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
from urllib.parse import unquote, urlparse

import requests
from dotenv import load_dotenv
from pymongo import MongoClient, UpdateOne
from pymongo.collection import Collection

from lifecycle import upsert_jobs_with_lifecycle, validate_sync_args


BASE_API_URL = "https://api.truelancer.com/api/v1/projects"
SOURCE_WEBSITE = "truelancer.com"
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


def load_environment() -> None:
    repo_root = Path(__file__).resolve().parents[1]
    load_dotenv(repo_root / ".env")
    load_dotenv(repo_root / "backend" / ".env")
    load_dotenv(Path(__file__).resolve().parent / ".env")


def clean_text(value: object) -> str:
    if value is None:
        return ""
    text = unescape(str(value))
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def parse_datetime(value: str | None, fallback: datetime) -> datetime:
    if not value:
        return fallback
    normalized = value.replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError:
        return fallback
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def build_page_url(page_number: int) -> str:
    return f"{BASE_API_URL}?page={page_number}"


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


def fetch_page(session: requests.Session, page_number: int, timeout: int) -> dict:
    url = build_page_url(page_number)
    response = session.get(url, timeout=timeout)
    response.raise_for_status()
    return response.json()


def extract_projects(payload: dict) -> tuple[list[dict], bool]:
    projects = payload.get("projects") or {}
    rows = projects.get("data") or []
    has_next = bool(projects.get("next_page_url"))
    return rows, has_next


def extract_location(project: dict) -> str:
    city = clean_text(project.get("city"))
    country = ""
    country_obj = project.get("countryObj")
    if isinstance(country_obj, dict):
        country = clean_text(country_obj.get("name"))
    elif project.get("country_code"):
        country = clean_text(project.get("country_code"))

    parts = [part for part in [city, country] if part]
    return ", ".join(parts) if parts else "Remote"


def extract_skills(project: dict) -> list[str]:
    skills = []
    for skill in project.get("skills") or []:
        if not isinstance(skill, dict):
            continue
        name = clean_text(skill.get("tagName") or skill.get("name") or skill.get("tag"))
        if name and name not in skills:
            skills.append(name)
    return skills


def extract_status(project: dict) -> str | None:
    public_status = project.get("publicStatusName")
    if isinstance(public_status, dict):
        status = clean_text(public_status.get("displayvalue"))
        if status:
            return status

    job_status = project.get("jobstatus")
    if isinstance(job_status, dict):
        status = clean_text(job_status.get("displayvalue"))
        if status:
            return status

    return None


def extract_budget(project: dict) -> dict[str, object]:
    budget = project.get("budget")
    currency = clean_text(project.get("currency")) or None
    amount = None
    if isinstance(budget, (int, float)):
        amount = float(budget)
    elif budget is not None:
        match = re.search(r"\d+(?:,\d{3})*(?:\.\d+)?", str(budget))
        amount = float(match.group(0).replace(",", "")) if match else None

    job_type_name = clean_text(project.get("jobTypeName"))
    is_hourly = "hour" in job_type_name.lower()
    raw = f"{currency} {amount:g}" if currency and amount is not None else None

    return {
        "raw": raw,
        "currency": currency,
        "min": amount,
        "max": amount,
        "is_hourly": is_hourly,
    }


def project_to_job(project: dict, now: datetime) -> ScrapedJob | None:
    title = clean_text(project.get("title"))
    source_url = clean_text(project.get("link"))
    external_id = str(project.get("id") or "").strip()
    if not title or not source_url or not external_id:
        return None

    posted_at = parse_datetime(project.get("created_at"), now)
    job_type = clean_text(project.get("jobTypeName")) or None
    hiring_type = clean_text(project.get("hiring_type")).replace("_", " ") or None

    return ScrapedJob(
        job_title=title,
        company_name="Truelancer Client",
        rating="None",
        experience=hiring_type or "Not specified",
        location=extract_location(project),
        min_requirements=clean_text(project.get("description"))
        or "See source listing for full requirements.",
        tech_stack=extract_skills(project),
        source="scraped",
        source_website=SOURCE_WEBSITE,
        source_url=source_url,
        external_id=external_id,
        project_status=extract_status(project),
        budget=extract_budget(project),
        proposals_count=project.get("total_proposals"),
        job_type=job_type,
        hiring_type=hiring_type,
        scraped_at=now,
        postedAt=posted_at,
        updatedAt=now,
    )


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
    all_jobs: list[ScrapedJob] = []
    page_number = args.start_page

    for page_offset in range(args.pages):
        current_page = page_number + page_offset
        print(f"Fetching {build_page_url(current_page)}")
        payload = fetch_page(session, current_page, args.timeout)
        projects, has_next = extract_projects(payload)
        now = datetime.now(timezone.utc)

        page_jobs = []
        for project in projects:
            job = project_to_job(project, now)
            if job:
                page_jobs.append(job)

        print(f"Parsed {len(page_jobs)} jobs from page {current_page}")
        all_jobs.extend(page_jobs)

        if args.limit and len(all_jobs) >= args.limit:
            all_jobs = all_jobs[: args.limit]
            break
        if not has_next:
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
        description="Scrape public Truelancer jobs into GigWorld's jobs collection."
    )
    parser.add_argument("--pages", type=int, default=1, help="Number of pages to scrape.")
    parser.add_argument(
        "--start-page", type=int, default=1, help="Truelancer API page to start from."
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
        print(f"HTTP error while scraping Truelancer: {exc}", file=sys.stderr)
        return 1
    except requests.RequestException as exc:
        print(f"Network error while scraping Truelancer: {exc}", file=sys.stderr)
        return 1
    except Exception as exc:
        print(f"Truelancer scraper failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
