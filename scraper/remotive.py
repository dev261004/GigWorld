from __future__ import annotations

import argparse
import json
import os
import re
import sys
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
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


BASE_API_URL = "https://remotive.com/api/remote-jobs"
SOURCE_WEBSITE = "remotive.com"
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
    company_logo: str | None
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


def parse_datetime(value: str | None, fallback: datetime) -> datetime:
    if not value:
        return fallback

    normalized = str(value).replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError:
        return fallback

    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def make_session(user_agent: str) -> requests.Session:
    session = requests.Session()
    session.headers.update(
        {
            "User-Agent": user_agent,
            "Accept": "application/json,text/plain,*/*",
            "Accept-Language": "en-US,en;q=0.9",
        }
    )
    return session


def build_params(args: argparse.Namespace) -> dict[str, str]:
    params: dict[str, str] = {}
    if args.search:
        params["search"] = args.search
    if args.category:
        params["category"] = args.category
    if args.company_name:
        params["company_name"] = args.company_name
    if args.api_limit:
        params["limit"] = str(args.api_limit)
    return params


def fetch_jobs(session: requests.Session, args: argparse.Namespace) -> list[dict]:
    response = session.get(BASE_API_URL, params=build_params(args), timeout=args.timeout)
    response.raise_for_status()
    payload = response.json()
    jobs = payload.get("jobs") if isinstance(payload, dict) else []
    return jobs if isinstance(jobs, list) else []


def humanize_job_type(value: object) -> str:
    text = clean_text(value).replace("_", " ")
    return text.title() if text else "Not specified"


def parse_salary_number(token: str) -> float | None:
    token = token.strip().lower()
    multiplier = 1000 if token.endswith("k") else 1
    token = token.rstrip("k").strip()

    if "," in token and "." not in token:
        left, right = token.split(",", 1)
        if len(right) == 3:
            token = left + right
        else:
            token = f"{left}.{right}"
    else:
        token = token.replace(",", "")

    try:
        return float(token) * multiplier
    except ValueError:
        return None


def parse_budget(raw_salary: object) -> dict[str, object]:
    raw = clean_text(raw_salary)
    if not raw:
        return {
            "raw": None,
            "currency": None,
            "min": None,
            "max": None,
            "is_hourly": None,
        }

    currency = None
    if "$" in raw:
        currency = "USD"
    elif "\u00a3" in raw or "GBP" in raw.upper():
        currency = "GBP"
    elif "\u20ac" in raw or "EUR" in raw.upper():
        currency = "EUR"

    numbers = []
    for match in re.findall(r"\d+(?:[,.]\d+)?\s*[kK]?", raw):
        number = parse_salary_number(match)
        if number is not None:
            numbers.append(number)

    is_hourly = bool(re.search(r"/\s*h|/\s*hour|per\s+hour|hourly", raw, re.I))
    return {
        "raw": raw,
        "currency": currency,
        "min": numbers[0] if numbers else None,
        "max": numbers[1] if len(numbers) > 1 else (numbers[0] if numbers else None),
        "is_hourly": is_hourly,
    }


def extract_tags(job: dict) -> list[str]:
    tags = []
    category = clean_text(job.get("category"))
    if category:
        tags.append(category)

    for tag in job.get("tags") or []:
        text = clean_text(tag)
        if text and text not in tags:
            tags.append(text)
    return tags


def job_to_scraped_job(job: dict, now: datetime) -> ScrapedJob | None:
    external_id = str(job.get("id") or "").strip()
    title = clean_text(job.get("title"))
    source_url = clean_text(job.get("url"))

    if not external_id or not title or not source_url:
        return None

    job_type = clean_text(job.get("job_type")) or None
    posted_at = parse_datetime(job.get("publication_date"), now)
    location = clean_text(job.get("candidate_required_location")) or "Remote"
    description = html_to_text(job.get("description"))

    return ScrapedJob(
        job_title=title,
        company_name=clean_text(job.get("company_name")) or "Remotive Company",
        rating="None",
        experience=humanize_job_type(job_type),
        location=location,
        min_requirements=description or "See source listing for full requirements.",
        tech_stack=extract_tags(job),
        source="scraped",
        source_website=SOURCE_WEBSITE,
        source_url=source_url,
        external_id=external_id,
        project_status="open",
        budget=parse_budget(job.get("salary")),
        job_type=job_type,
        category=clean_text(job.get("category")) or None,
        company_logo=clean_text(job.get("company_logo")) or None,
        scraped_at=now,
        postedAt=posted_at,
        updatedAt=now,
    )


def parse_jobs(rows: list[dict], limit: int) -> list[ScrapedJob]:
    now = datetime.now(timezone.utc)
    jobs: list[ScrapedJob] = []
    seen_ids: set[str] = set()

    for row in rows:
        if not isinstance(row, dict):
            continue
        job = job_to_scraped_job(row, now)
        if not job or job.external_id in seen_ids:
            continue
        jobs.append(job)
        seen_ids.add(job.external_id)
        if limit and len(jobs) >= limit:
            break

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

    print(f"Fetching {BASE_API_URL}")
    rows = fetch_jobs(session, args)
    jobs = parse_jobs(rows, args.limit)
    print(f"Parsed {len(jobs)} jobs from Remotive API response")

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
        description="Import public Remotive API jobs into GigWorld's jobs collection."
    )
    parser.add_argument(
        "--search",
        default=None,
        help="Optional Remotive search term, e.g. python, marketing, designer.",
    )
    parser.add_argument(
        "--category",
        default=None,
        help="Optional Remotive category filter, e.g. software-dev or marketing.",
    )
    parser.add_argument(
        "--company-name",
        default=None,
        help="Optional Remotive company name filter.",
    )
    parser.add_argument(
        "--api-limit",
        type=int,
        default=0,
        help="Optional limit parameter sent to Remotive. 0 means omit it.",
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
    if args.api_limit < 0:
        parser.error("--api-limit cannot be negative")
    validate_sync_args(parser, args)
    return args


def main(argv: list[str] | None = None) -> int:
    try:
        return scrape(parse_args(argv or sys.argv[1:]))
    except requests.HTTPError as exc:
        print(f"HTTP error while calling Remotive API: {exc}", file=sys.stderr)
        return 1
    except requests.RequestException as exc:
        print(f"Network error while calling Remotive API: {exc}", file=sys.stderr)
        return 1
    except Exception as exc:
        print(f"Remotive scraper failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
