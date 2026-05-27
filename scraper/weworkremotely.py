from __future__ import annotations

import argparse
import json
import os
import re
import sys
import xml.etree.ElementTree as ET
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from html import unescape
from pathlib import Path
from typing import Iterable
from urllib.parse import unquote, urlparse

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from pymongo import MongoClient, UpdateOne
from pymongo.collection import Collection

from lifecycle import upsert_jobs_with_lifecycle, validate_sync_args


DEFAULT_FEED_URL = "https://weworkremotely.com/remote-jobs.rss"
SOURCE_WEBSITE = "weworkremotely.com"
DEFAULT_USER_AGENT = (
    "GigWorldScraper/1.0 (+https://github.com/dev261004/GigWorld; "
    "contact: project-owner)"
)


@dataclass
class ScrapedJob:
    job_title: str
    company_name: str
    rating: str
    experience: str
    location: str
    min_requirements: str
    tech_stack: list[str]
    source: str
    source_website: str
    source_url: str
    external_id: str
    project_status: str | None
    budget: dict[str, object]
    job_type: str | None
    category: str | None
    apply_url: str | None
    company_url: str | None
    company_logo: str | None
    headquarters: str | None
    scraped_at: datetime
    postedAt: datetime
    updatedAt: datetime


def load_environment() -> None:
    repo_root = Path(__file__).resolve().parents[1]
    load_dotenv(repo_root / ".env")
    load_dotenv(repo_root / "backend" / ".env")
    load_dotenv(Path(__file__).resolve().parent / ".env")


def clean_text(value: object) -> str:
    if value is None:
        return ""
    text = unescape(str(value))
    return re.sub(r"\s+", " ", text).strip()


def html_to_text(value: object) -> str:
    if not value:
        return ""

    soup = BeautifulSoup(str(value), "html.parser")
    for tag in soup(["script", "style", "img"]):
        tag.decompose()
    return clean_text(soup.get_text(" ", strip=True))


def make_session(user_agent: str) -> requests.Session:
    session = requests.Session()
    session.headers.update(
        {
            "User-Agent": user_agent,
            "Accept": "application/rss+xml,application/xml,text/xml,*/*",
            "Accept-Language": "en-US,en;q=0.9",
        }
    )
    return session


def fetch_feed(session: requests.Session, feed_url: str, timeout: int) -> str:
    response = session.get(feed_url, timeout=timeout)
    response.raise_for_status()
    response.encoding = "utf-8"
    return response.text


def child_text(item: ET.Element, name: str) -> str:
    child = item.find(name)
    return clean_text(child.text) if child is not None and child.text else ""


def parse_pub_date(value: str, fallback: datetime) -> datetime:
    if not value:
        return fallback
    try:
        parsed = parsedate_to_datetime(value)
    except (TypeError, ValueError):
        return fallback
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def split_title(raw_title: str) -> tuple[str, str]:
    title = clean_text(raw_title)
    if ": " not in title:
        return title, "We Work Remotely Company"

    company, job_title = title.split(": ", 1)
    return clean_text(job_title) or title, clean_text(company) or "We Work Remotely Company"


def extract_company_logo(description_html: str) -> str | None:
    soup = BeautifulSoup(description_html or "", "html.parser")
    image = soup.find("img", src=True)
    return clean_text(image["src"]) if image else None


def extract_labeled_value(description_html: str, label: str) -> str | None:
    soup = BeautifulSoup(description_html or "", "html.parser")
    label_node = None
    for strong in soup.find_all("strong"):
        if clean_text(strong.get_text()).rstrip(":").lower() == label.lower():
            label_node = strong
            break

    if not label_node:
        return None

    values = []
    for sibling in label_node.next_siblings:
        if getattr(sibling, "name", None) == "br":
            break
        if getattr(sibling, "name", None) == "strong":
            break
        values.append(clean_text(sibling.get_text(" ", strip=True) if hasattr(sibling, "get_text") else sibling))

    text = clean_text(" ".join(value for value in values if value))
    return text or None


def extract_company_url(description_html: str) -> str | None:
    soup = BeautifulSoup(description_html or "", "html.parser")
    for strong in soup.find_all("strong"):
        if clean_text(strong.get_text()).rstrip(":").lower() != "url":
            continue
        link = strong.find_next("a", href=True)
        if link:
            return clean_text(link["href"])
    return None


def extract_external_id(guid: str, link: str) -> str:
    value = guid or link
    path = urlparse(value).path.strip("/")
    return path.split("/")[-1] if path else value


def infer_job_type(description: str) -> str | None:
    text = description.lower()
    if re.search(r"\bfreelance\b", text):
        return "freelance"
    if re.search(r"\bcontract\b|\bcontractor\b", text):
        return "contract"
    if re.search(r"\bpart[-\s]?time\b", text):
        return "part_time"
    if re.search(r"\bfull[-\s]?time\b", text):
        return "full_time"
    return None


def extract_experience(title: str, description: str) -> str:
    text = f"{title} {description}"
    if re.search(r"\bsenior\b|\bsr\.?\b", text, re.I):
        return "Senior"
    if re.search(r"\bjunior\b|\bjr\.?\b|entry[-\s]?level", text, re.I):
        return "Junior"
    match = re.search(r"\b(\d+\+?)\s*(?:-|to)?\s*(\d+\+?)?\s+years?\b", text, re.I)
    if match:
        return clean_text(match.group(0))
    return "Not specified"


def parse_item(item: ET.Element, now: datetime) -> ScrapedJob | None:
    raw_title = child_text(item, "title")
    source_url = child_text(item, "link")
    guid = child_text(item, "guid")
    description_html = child_text(item, "description")
    categories = [
        clean_text(category.text)
        for category in item.findall("category")
        if category.text and clean_text(category.text)
    ]

    job_title, company_name = split_title(raw_title)
    external_id = extract_external_id(guid, source_url)
    if not job_title or not source_url or not external_id:
        return None

    description = html_to_text(description_html)
    category = categories[0] if categories else None
    headquarters = extract_labeled_value(description_html, "Headquarters")
    location = "Remote"
    if headquarters:
        location = f"Remote, HQ: {headquarters}"

    tags = []
    for value in categories:
        if value and value not in tags:
            tags.append(value)

    return ScrapedJob(
        job_title=job_title,
        company_name=company_name,
        rating="None",
        experience=extract_experience(job_title, description),
        location=location,
        min_requirements=description or "See source listing for full requirements.",
        tech_stack=tags,
        source="scraped",
        source_website=SOURCE_WEBSITE,
        source_url=source_url,
        external_id=external_id,
        project_status="open",
        budget={
            "raw": None,
            "currency": None,
            "min": None,
            "max": None,
            "is_hourly": None,
        },
        job_type=infer_job_type(description),
        category=category,
        apply_url=source_url,
        company_url=extract_company_url(description_html),
        company_logo=extract_company_logo(description_html),
        headquarters=headquarters,
        scraped_at=now,
        postedAt=parse_pub_date(child_text(item, "pubDate"), now),
        updatedAt=now,
    )


def parse_feed(xml_text: str, args: argparse.Namespace) -> list[ScrapedJob]:
    root = ET.fromstring(xml_text)
    channel = root.find("channel")
    if channel is None:
        raise RuntimeError("Could not find RSS channel in We Work Remotely feed.")

    now = datetime.now(timezone.utc)
    jobs: list[ScrapedJob] = []
    seen_ids: set[str] = set()

    for item in channel.findall("item"):
        job = parse_item(item, now)
        if not job or job.external_id in seen_ids:
            continue
        if not job_matches_filters(job, args):
            continue
        jobs.append(job)
        seen_ids.add(job.external_id)
        if args.limit and len(jobs) >= args.limit:
            break

    return jobs


def job_matches_filters(job: ScrapedJob, args: argparse.Namespace) -> bool:
    haystack = " ".join(
        [
            job.job_title,
            job.company_name,
            job.location,
            job.category or "",
            " ".join(job.tech_stack),
            job.min_requirements,
        ]
    ).lower()

    if args.search and args.search.lower() not in haystack:
        return False
    if args.company and args.company.lower() not in job.company_name.lower():
        return False
    if args.category and args.category.lower() not in {tag.lower() for tag in job.tech_stack}:
        return False
    return True


def resolve_db_name(mongodb_url: str | None, explicit_db_name: str | None) -> str:
    if explicit_db_name and explicit_db_name.strip():
        return explicit_db_name.strip()

    if mongodb_url:
        url_db_name = unquote(urlparse(mongodb_url).path.strip("/"))
        if url_db_name:
            return url_db_name

    env_db_name = os.getenv("DB_NAME")
    if env_db_name and env_db_name.strip():
        return env_db_name.strip().strip("\"'")

    return "Gigworld"


def connect_collection(
    mongodb_url: str | None, db_name: str, collection_name: str
) -> Collection:
    if not mongodb_url:
        raise RuntimeError(
            "MongoDB URL not found. Set MONGODB_URL in backend/.env or pass "
            "--mongodb-url."
        )
    client = MongoClient(mongodb_url)
    return client[db_name][collection_name]


def upsert_jobs(
    collection: Collection, jobs: Iterable[ScrapedJob], sync_lifecycle: bool
) -> tuple[int, int, int]:
    return upsert_jobs_with_lifecycle(
        collection, jobs, SOURCE_WEBSITE, sync_lifecycle=sync_lifecycle
    )


def serialize_job(job: ScrapedJob) -> dict[str, object]:
    doc = asdict(job)
    doc["scraped_at"] = job.scraped_at.isoformat()
    doc["postedAt"] = job.postedAt.isoformat()
    doc["updatedAt"] = job.updatedAt.isoformat()
    return doc


def scrape(args: argparse.Namespace) -> int:
    load_environment()
    session = make_session(args.user_agent)

    print(f"Fetching {args.feed_url}")
    xml_text = fetch_feed(session, args.feed_url, args.timeout)
    jobs = parse_feed(xml_text, args)
    print(f"Parsed {len(jobs)} jobs from We Work Remotely RSS feed")

    if args.dry_run:
        print(json.dumps([serialize_job(job) for job in jobs], indent=2))
        print(f"Dry run complete. Parsed {len(jobs)} jobs; wrote 0 records.")
        return 0

    mongodb_url = args.mongodb_url or os.getenv("MONGODB_URL") or os.getenv("MONGO_URI")
    db_name = resolve_db_name(mongodb_url, args.db_name)
    print(f"Writing to MongoDB database '{db_name}', collection '{args.collection}'")

    collection = connect_collection(mongodb_url, db_name, args.collection)
    inserted, updated, expired = upsert_jobs(collection, jobs, args.sync_lifecycle)
    print(
        f"Scrape complete. Parsed {len(jobs)} jobs, "
        f"inserted {inserted}, updated {updated}, expired {expired}."
    )
    return 0


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Import public We Work Remotely RSS jobs into GigWorld's jobs collection."
    )
    parser.add_argument(
        "--feed-url",
        default=DEFAULT_FEED_URL,
        help="We Work Remotely RSS feed URL.",
    )
    parser.add_argument(
        "--search",
        default=None,
        help="Optional local text filter over title, company, category, location, and description.",
    )
    parser.add_argument(
        "--company",
        default=None,
        help="Optional local company-name filter.",
    )
    parser.add_argument(
        "--category",
        default=None,
        help="Optional exact RSS category filter, e.g. Programming, Design, Customer Support.",
    )
    parser.add_argument(
        "--limit", type=int, default=0, help="Maximum total jobs to keep. 0 means no cap."
    )
    parser.add_argument("--timeout", type=int, default=20, help="Request timeout.")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print parsed jobs without writing to MongoDB.",
    )
    parser.add_argument(
        "--sync-lifecycle",
        action="store_true",
        help="Expire old jobs from this source that are not seen in this completed run.",
    )
    parser.add_argument("--mongodb-url", help="MongoDB connection URL.")
    parser.add_argument(
        "--db-name",
        default=None,
        help="MongoDB database name. Defaults to DB_NAME env or Gigworld.",
    )
    parser.add_argument("--collection", default="jobs", help="MongoDB collection name.")
    parser.add_argument(
        "--user-agent", default=DEFAULT_USER_AGENT, help="HTTP User-Agent header."
    )
    args = parser.parse_args(argv)

    if args.limit < 0:
        parser.error("--limit cannot be negative")
    validate_sync_args(parser, args)
    return args


def main(argv: list[str] | None = None) -> int:
    try:
        return scrape(parse_args(argv or sys.argv[1:]))
    except ET.ParseError as exc:
        print(f"XML error while parsing We Work Remotely RSS: {exc}", file=sys.stderr)
        return 1
    except requests.HTTPError as exc:
        print(f"HTTP error while fetching We Work Remotely RSS: {exc}", file=sys.stderr)
        return 1
    except requests.RequestException as exc:
        print(f"Network error while fetching We Work Remotely RSS: {exc}", file=sys.stderr)
        return 1
    except Exception as exc:
        print(f"We Work Remotely scraper failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
