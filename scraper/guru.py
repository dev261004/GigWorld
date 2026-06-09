from __future__ import annotations

import argparse
import json
import os
import random
import re
import sys
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta, timezone
from html import unescape
from pathlib import Path
from time import sleep
from typing import Iterable
from urllib.parse import unquote, urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.collection import Collection

from lifecycle import upsert_jobs_with_lifecycle, validate_sync_args


BASE_URL = "https://www.guru.com"
JOBS_URL = f"{BASE_URL}/d/jobs/"
SOURCE_WEBSITE = "guru.com"
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
    proposals_count: int | None
    job_type: str | None
    hiring_type: str | None
    scraped_at: datetime
    postedAt: datetime
    updatedAt: datetime
    expires_at: datetime | None


def load_environment() -> None:
    repo_root = Path(__file__).resolve().parents[1]
    load_dotenv(repo_root / ".env")
    load_dotenv(repo_root / "backend" / ".env")
    load_dotenv(Path(__file__).resolve().parent / ".env")


def clean_text(value: object) -> str:
    if value is None:
        return ""
    if hasattr(value, "get_text"):
        text = value.get_text(" ", strip=True)
    else:
        text = str(value)
    text = unescape(text).replace("\xa0", " ")
    return re.sub(r"\s+", " ", text).strip()


def parse_posted_at(value: str | None, now: datetime) -> datetime:
    text = clean_text(value).lower()
    text = re.sub(r"^on\s+", "", text).strip()

    match = re.search(r"(\d+)\s+min", text)
    if match:
        return now - timedelta(minutes=int(match.group(1)))

    match = re.search(r"(\d+)\s+hr", text)
    if match:
        return now - timedelta(hours=int(match.group(1)))

    match = re.search(r"(\d+)\s+day", text)
    if match:
        return now - timedelta(days=int(match.group(1)))

    for fmt in ("%b %d, %Y", "%B %d, %Y"):
        try:
            return datetime.strptime(text.title(), fmt).replace(tzinfo=timezone.utc)
        except ValueError:
            continue

    return now


def parse_deadline(value: str | None) -> datetime | None:
    text = clean_text(value)
    match = re.search(r"([A-Za-z]+ \d{1,2}, \d{4})", text)
    if not match:
        return None

    for fmt in ("%b %d, %Y", "%B %d, %Y"):
        try:
            parsed = datetime.strptime(match.group(1), fmt)
            return parsed.replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
        except ValueError:
            continue

    return None


def parse_money(value: str) -> float:
    match = re.search(r"(\d+(?:,\d{3})*(?:\.\d+)?)\s*([kKmM])?", value)
    if not match:
        return 0.0
    amount = float(match.group(1).replace(",", ""))
    suffix = (match.group(2) or "").lower()
    if suffix == "k":
        amount *= 1000
    elif suffix == "m":
        amount *= 1_000_000
    return amount


def parse_budget(value: str) -> dict[str, object]:
    raw = clean_text(value)
    dollar_values = [parse_money(match.group(0)) for match in re.finditer(r"\$\s*\d[\d,.]*\s*[kKmM]?", raw)]
    is_hourly = "hourly" in raw.lower() or "/hr" in raw.lower()

    minimum = None
    maximum = None
    if len(dollar_values) >= 2:
        minimum = min(dollar_values[:2])
        maximum = max(dollar_values[:2])
    elif len(dollar_values) == 1:
        if "under" in raw.lower():
            maximum = dollar_values[0]
        else:
            minimum = dollar_values[0]
            maximum = dollar_values[0]

    return {
        "raw": raw or None,
        "currency": "USD" if "$" in raw else None,
        "min": minimum,
        "max": maximum,
        "is_hourly": is_hourly,
    }


def parse_proposals(value: str) -> int | None:
    text = clean_text(value)
    if re.search(r"\bNo Quotes Received\b", text, flags=re.IGNORECASE):
        return 0
    match = re.search(r"(\d+)\s+Quotes?\s+Received", text, flags=re.IGNORECASE)
    return int(match.group(1)) if match else None


def build_page_url(page_number: int) -> str:
    if page_number <= 1:
        return JOBS_URL
    return f"{JOBS_URL}pg/{page_number}/"


def make_session(user_agent: str) -> requests.Session:
    session = requests.Session()
    session.headers.update(
        {
            "User-Agent": user_agent,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        }
    )
    return session


def fetch_page(session: requests.Session, page_number: int, timeout: int) -> BeautifulSoup:
    url = build_page_url(page_number)
    response = session.get(url, timeout=timeout)
    response.raise_for_status()
    return BeautifulSoup(response.text, "html.parser")


def normalize_source_url(href: str) -> str:
    href = href.split("&SearchUrl=", 1)[0]
    return urljoin(BASE_URL, href)


def extract_job_type(raw_budget: str) -> str | None:
    first_part = clean_text(raw_budget).split("|", 1)[0].strip()
    return first_part or None


def unique_texts(nodes: Iterable[object]) -> list[str]:
    values = []
    for node in nodes:
        text = clean_text(node)
        if text and text not in values:
            values.append(text)
    return values


def record_to_job(record, now: datetime) -> ScrapedJob | None:
    external_id = clean_text(record.get("data-gid"))
    title_link = record.select_one(".jobRecord__title a[href]")
    title = clean_text(title_link)
    if not external_id or not title or not title_link:
        return None

    source_url = normalize_source_url(title_link.get("href", ""))
    budget_text = clean_text(record.select_one(".jobRecord__budget"))
    deadline_text = clean_text(record.select_one(".record__header__action--full .copy"))
    meta = record.select_one(".jobRecord__meta")
    posted_text = clean_text(meta.select_one("strong") if meta else None)
    posted_at = parse_posted_at(posted_text, now)
    expires_at = parse_deadline(deadline_text)
    description = clean_text(record.select_one(".jobRecord__desc"))
    company_name = clean_text(record.select_one(".identityName")) or "Guru Client"
    location = clean_text(record.select_one(".freelancerAvatar__subText strong")) or "Remote"
    rating = clean_text(record.select_one(".feedback-score")) or "None"
    skills = unique_texts(record.select(".skillsList__skill"))
    job_type = extract_job_type(budget_text)

    return ScrapedJob(
        job_title=title,
        company_name=company_name,
        rating=rating,
        experience="Not specified",
        location=location,
        min_requirements=description or "See source listing for full requirements.",
        tech_stack=skills,
        source="scraped",
        source_website=SOURCE_WEBSITE,
        source_url=source_url,
        external_id=external_id,
        project_status="open",
        budget=parse_budget(budget_text),
        proposals_count=parse_proposals(clean_text(record)),
        job_type=job_type,
        hiring_type=job_type,
        scraped_at=now,
        postedAt=posted_at,
        updatedAt=now,
        expires_at=expires_at,
    )


def extract_jobs(soup: BeautifulSoup, now: datetime) -> list[ScrapedJob]:
    jobs = []
    for record in soup.select("#serviceList .record.jobRecord[data-gid]"):
        job = record_to_job(record, now)
        if job:
            jobs.append(job)
    return jobs


def has_next_page(soup: BeautifulSoup, page_number: int) -> bool:
    next_path = f"/d/jobs/pg/{page_number + 1}/"
    return soup.find("a", href=lambda href: bool(href and next_path in href)) is not None


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
    doc["expires_at"] = job.expires_at.isoformat() if job.expires_at else None
    return doc


def scrape(args: argparse.Namespace) -> int:
    load_environment()
    session = make_session(args.user_agent)
    all_jobs: list[ScrapedJob] = []

    for page_offset in range(args.pages):
        current_page = args.start_page + page_offset
        print(f"Fetching {build_page_url(current_page)}")
        soup = fetch_page(session, current_page, args.timeout)
        now = datetime.now(timezone.utc)
        page_jobs = extract_jobs(soup, now)

        print(f"Parsed {len(page_jobs)} jobs from page {current_page}")
        all_jobs.extend(page_jobs)

        if args.limit and len(all_jobs) >= args.limit:
            all_jobs = all_jobs[: args.limit]
            break
        if not page_jobs or not has_next_page(soup, current_page):
            break
        if page_offset < args.pages - 1:
            sleep(args.delay + random.uniform(0, args.jitter))

    if args.dry_run:
        print(json.dumps([serialize_job(job) for job in all_jobs], indent=2))
        print(f"Dry run complete. Parsed {len(all_jobs)} jobs; wrote 0 records.")
        return 0

    mongodb_url = args.mongodb_url or os.getenv("MONGODB_URL") or os.getenv("MONGO_URI")
    db_name = resolve_db_name(mongodb_url, args.db_name)
    print(f"Writing to MongoDB database '{db_name}', collection '{args.collection}'")

    collection = connect_collection(mongodb_url, db_name, args.collection)
    inserted, updated, expired = upsert_jobs(collection, all_jobs, args.sync_lifecycle)
    print(
        f"Scrape complete. Parsed {len(all_jobs)} jobs, "
        f"inserted {inserted}, updated {updated}, expired {expired}."
    )
    return 0


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Scrape public Guru freelance jobs into GigWorld's jobs collection."
    )
    parser.add_argument("--pages", type=int, default=1, help="Number of pages to scrape.")
    parser.add_argument("--start-page", type=int, default=1, help="Guru page to start from.")
    parser.add_argument(
        "--limit", type=int, default=0, help="Maximum total jobs to keep. 0 means no cap."
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=3.0,
        help="Base delay in seconds between page requests.",
    )
    parser.add_argument(
        "--jitter",
        type=float,
        default=1.5,
        help="Random extra delay in seconds between page requests.",
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
        help="MongoDB database name. Defaults to DB_NAME env or URL database.",
    )
    parser.add_argument("--collection", default="jobs", help="MongoDB collection name.")
    parser.add_argument(
        "--user-agent", default=DEFAULT_USER_AGENT, help="HTTP User-Agent header."
    )
    args = parser.parse_args(argv)

    if args.pages < 1:
        parser.error("--pages must be at least 1")
    if args.start_page < 1:
        parser.error("--start-page must be at least 1")
    if args.limit < 0:
        parser.error("--limit cannot be negative")
    if args.delay < 0 or args.jitter < 0:
        parser.error("--delay and --jitter cannot be negative")
    validate_sync_args(parser, args)
    return args


def main(argv: list[str] | None = None) -> int:
    try:
        return scrape(parse_args(argv or sys.argv[1:]))
    except requests.HTTPError as exc:
        print(f"HTTP error while scraping Guru: {exc}", file=sys.stderr)
        return 1
    except requests.RequestException as exc:
        print(f"Network error while scraping Guru: {exc}", file=sys.stderr)
        return 1
    except Exception as exc:
        print(f"Guru scraper failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
