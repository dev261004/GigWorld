from __future__ import annotations

import argparse
import json
import os
import random
import re
import sys
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from html import unescape
from pathlib import Path
from time import sleep
from typing import Iterable
from urllib.parse import quote_plus, unquote, urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from pymongo import MongoClient, UpdateOne
from pymongo.collection import Collection


BASE_URL = "https://hubstafftalent.net"
SEARCH_URL = f"{BASE_URL}/search/jobs"
SOURCE_WEBSITE = "hubstafftalent.net"
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
    posted_label: str | None
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


def make_session(user_agent: str) -> requests.Session:
    session = requests.Session()
    session.headers.update(
        {
            "User-Agent": user_agent,
            "Accept": (
                "text/javascript, application/javascript, application/ecmascript, "
                "application/x-ecmascript, */*; q=0.01"
            ),
            "Accept-Language": "en-US,en;q=0.9",
            "X-Requested-With": "XMLHttpRequest",
        }
    )
    return session


def build_search_url(page_number: int, keyword: str | None) -> str:
    query = [
        f"page={page_number}",
        "search%5Btype%5D=",
        "search%5Blast_slider%5D=",
    ]
    if keyword:
        query.append(f"search%5Bkeywords%5D={quote_plus(keyword)}")
    return f"{SEARCH_URL}?{'&'.join(query)}"


def extract_results_html(js_response: str) -> str:
    marker = "$('#results').html(\""
    start = js_response.find(marker)
    if start == -1:
        raise RuntimeError("Could not find Hubstaff job result HTML in response.")

    index = start + len(marker)
    escaped = False
    chars: list[str] = []
    while index < len(js_response):
        char = js_response[index]
        if escaped:
            chars.append("\\" + char)
            escaped = False
        elif char == "\\":
            escaped = True
        elif char == '"':
            break
        else:
            chars.append(char)
        index += 1

    encoded_html = "".join(chars).replace(r"\$", "$")
    try:
        return json.loads(f'"{encoded_html}"')
    except json.JSONDecodeError:
        return encoded_html.encode("utf-8").decode("unicode_escape").replace("\\/", "/")


def fetch_results_html(
    session: requests.Session, page_number: int, keyword: str | None, timeout: int
) -> str:
    url = build_search_url(page_number, keyword)
    response = session.get(url, timeout=timeout)
    response.raise_for_status()
    response.encoding = "utf-8"
    return extract_results_html(response.text)


def parse_budget(raw_text: str, job_type: str | None) -> dict[str, object]:
    raw_text = clean_text(raw_text)
    if not raw_text:
        return {"raw": None}

    currency = "$" if "$" in raw_text else None
    numbers = [
        float(match.replace(",", ""))
        for match in re.findall(r"\d+(?:,\d{3})*(?:\.\d+)?", raw_text)
    ]
    is_hourly = "/hr" in raw_text.lower() or job_type == "hourly"

    return {
        "raw": raw_text,
        "currency": currency,
        "min": numbers[0] if numbers else None,
        "max": numbers[1] if len(numbers) > 1 else None,
        "is_hourly": is_hourly,
    }


def extract_company(card) -> str:
    agency = card.select_one(".job-agency")
    if not agency:
        return "Hubstaff Talent Client"
    text = clean_text(agency.get_text(" ", strip=True))
    return re.sub(r"^\s*Client\s*", "", text).strip() or "Hubstaff Talent Client"


def extract_location(card) -> str:
    location = card.select_one(".location")
    if not location:
        return "Remote"
    text = clean_text(location.get_text(" ", strip=True))
    text = re.sub(r"^HQ:\s*", "", text).strip()
    return text or "Remote"


def parse_job_card(card, now: datetime) -> ScrapedJob | None:
    title_link = card.select_one("a.name[href]")
    if not title_link:
        return None

    title = clean_text(title_link.get_text(" ", strip=True))
    source_url = urljoin(BASE_URL, title_link["href"])
    external_id = urlparse(source_url).path.strip("/")

    job_type = clean_text(card.select_one(".label").get_text(" ", strip=True)) if card.select_one(".label") else None
    pay_rate = clean_text(card.select_one(".pay-rate").get_text(" ", strip=True)) if card.select_one(".pay-rate") else ""
    description = clean_text(card.select_one(".profil-bio").get_text(" ", strip=True)) if card.select_one(".profil-bio") else ""
    skills = [
        clean_text(tag.get_text(" ", strip=True))
        for tag in card.select(".tag")
        if clean_text(tag.get_text(" ", strip=True))
    ]
    posted = clean_text(card.select_one(".a-tooltip").get_text(" ", strip=True)) if card.select_one(".a-tooltip") else None

    return ScrapedJob(
        job_title=title,
        company_name=extract_company(card),
        rating="None",
        experience=job_type or "Not specified",
        location=extract_location(card),
        min_requirements=description or "See source listing for full requirements.",
        tech_stack=skills,
        source="scraped",
        source_website=SOURCE_WEBSITE,
        source_url=source_url,
        external_id=external_id,
        project_status="Remote job" if "Remote job" in card.get_text(" ", strip=True) else None,
        budget=parse_budget(pay_rate, job_type),
        job_type=job_type,
        posted_label=posted,
        scraped_at=now,
        postedAt=now,
        updatedAt=now,
    )


def parse_jobs(results_html: str) -> list[ScrapedJob]:
    soup = BeautifulSoup(results_html, "html.parser")
    now = datetime.now(timezone.utc)
    jobs: list[ScrapedJob] = []
    seen_ids: set[str] = set()

    for card in soup.select(".search-result"):
        job = parse_job_card(card, now)
        if not job or job.external_id in seen_ids:
            continue
        jobs.append(job)
        seen_ids.add(job.external_id)
    return jobs


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


def upsert_jobs(collection: Collection, jobs: Iterable[ScrapedJob]) -> tuple[int, int]:
    operations = []
    for job in jobs:
        doc = asdict(job)
        operations.append(
            UpdateOne(
                {
                    "source_website": SOURCE_WEBSITE,
                    "external_id": job.external_id,
                },
                {
                    "$set": doc,
                    "$setOnInsert": {"createdAt": job.scraped_at},
                },
                upsert=True,
            )
        )

    if not operations:
        return 0, 0

    result = collection.bulk_write(operations, ordered=False)
    return result.upserted_count, result.modified_count


def serialize_job(job: ScrapedJob) -> dict[str, object]:
    doc = asdict(job)
    doc["scraped_at"] = job.scraped_at.isoformat()
    doc["postedAt"] = job.postedAt.isoformat()
    doc["updatedAt"] = job.updatedAt.isoformat()
    return doc


def scrape(args: argparse.Namespace) -> int:
    load_environment()
    session = make_session(args.user_agent)
    all_jobs: list[ScrapedJob] = []

    end_page = args.start_page + args.pages
    for page_number in range(args.start_page, end_page):
        url = build_search_url(page_number, args.keyword)
        print(f"Fetching {url}")
        results_html = fetch_results_html(session, page_number, args.keyword, args.timeout)
        page_jobs = parse_jobs(results_html)
        print(f"Parsed {len(page_jobs)} jobs from page {page_number}")

        all_jobs.extend(page_jobs)
        if args.limit and len(all_jobs) >= args.limit:
            all_jobs = all_jobs[: args.limit]
            break

        if page_number < end_page - 1:
            sleep(args.delay + random.uniform(0, args.jitter))

    if args.dry_run:
        print(json.dumps([serialize_job(job) for job in all_jobs], indent=2))
        print(f"Dry run complete. Parsed {len(all_jobs)} jobs; wrote 0 records.")
        return 0

    mongodb_url = args.mongodb_url or os.getenv("MONGODB_URL") or os.getenv("MONGO_URI")
    db_name = resolve_db_name(mongodb_url, args.db_name)
    print(f"Writing to MongoDB database '{db_name}', collection '{args.collection}'")

    collection = connect_collection(mongodb_url, db_name, args.collection)
    inserted, updated = upsert_jobs(collection, all_jobs)
    print(
        f"Scrape complete. Parsed {len(all_jobs)} jobs, "
        f"inserted {inserted}, updated {updated}."
    )
    return 0


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Scrape public Hubstaff Talent jobs into GigWorld's jobs collection."
    )
    parser.add_argument("--pages", type=int, default=1, help="Number of pages to scrape.")
    parser.add_argument(
        "--start-page", type=int, default=1, help="Hubstaff search page to start from."
    )
    parser.add_argument(
        "--keyword",
        default=None,
        help="Optional keyword search, e.g. developer, assistant, scraping.",
    )
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

    if args.pages < 1:
        parser.error("--pages must be at least 1")
    if args.start_page < 1:
        parser.error("--start-page must be at least 1")
    if args.limit < 0:
        parser.error("--limit cannot be negative")
    if args.delay < 0 or args.jitter < 0:
        parser.error("--delay and --jitter cannot be negative")
    return args


def main(argv: list[str] | None = None) -> int:
    try:
        return scrape(parse_args(argv or sys.argv[1:]))
    except requests.HTTPError as exc:
        print(f"HTTP error while scraping Hubstaff Talent: {exc}", file=sys.stderr)
        return 1
    except requests.RequestException as exc:
        print(f"Network error while scraping Hubstaff Talent: {exc}", file=sys.stderr)
        return 1
    except Exception as exc:
        print(f"Hubstaff scraper failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
