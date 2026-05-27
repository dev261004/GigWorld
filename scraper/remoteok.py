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


BASE_API_URL = "https://remoteok.com/api"
SOURCE_WEBSITE = "remoteok.com"
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
    apply_url: str | None
    company_logo: str | None
    slug: str | None
    scraped_at: datetime
    postedAt: datetime
    updatedAt: datetime


def load_environment() -> None:
    repo_root = Path(__file__).resolve().parents[1]
    load_dotenv(repo_root / ".env")
    load_dotenv(repo_root / "backend" / ".env")
    load_dotenv(Path(__file__).resolve().parent / ".env")


def fix_mojibake(text: str) -> str:
    if not any(marker in text for marker in ("Ã", "Â", "â")):
        return text
    try:
        return text.encode("latin1").decode("utf-8")
    except (UnicodeEncodeError, UnicodeDecodeError):
        return text


def clean_text(value: object) -> str:
    if value is None:
        return ""
    text = fix_mojibake(unescape(str(value)))
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


def fetch_jobs(session: requests.Session, timeout: int) -> list[dict]:
    response = session.get(BASE_API_URL, timeout=timeout)
    response.raise_for_status()
    response.encoding = "utf-8"
    payload = response.json()
    return payload if isinstance(payload, list) else []


def parse_budget(job: dict) -> dict[str, object]:
    salary_min = job.get("salary_min")
    salary_max = job.get("salary_max")

    min_value = float(salary_min) if isinstance(salary_min, (int, float)) and salary_min > 0 else None
    max_value = float(salary_max) if isinstance(salary_max, (int, float)) and salary_max > 0 else None
    is_hourly = False
    description = html_to_text(job.get("description")).lower()
    if re.search(r"/\s*h|/\s*hour|per\s+hour|hourly", description):
        is_hourly = True
    elif min_value is not None and max_value is not None and max_value < 1000:
        is_hourly = True

    if min_value is None and max_value is None:
        return {
            "raw": None,
            "currency": None,
            "min": None,
            "max": None,
            "is_hourly": None,
        }

    suffix = "/hour" if is_hourly else ""
    if min_value is not None and max_value is not None and min_value != max_value:
        raw = f"USD {min_value:g} - {max_value:g}"
    else:
        amount = min_value if min_value is not None else max_value
        raw = f"USD {amount:g}"
    raw = f"{raw}{suffix}"

    return {
        "raw": raw,
        "currency": "USD",
        "min": min_value,
        "max": max_value if max_value is not None else min_value,
        "is_hourly": is_hourly,
    }


def extract_tags(job: dict) -> list[str]:
    tags = []
    for tag in job.get("tags") or []:
        text = clean_text(tag)
        if text and text not in tags:
            tags.append(text)
    return tags


def extract_experience(tags: list[str], description: str) -> str:
    lowered_tags = {tag.lower() for tag in tags}
    if "senior" in lowered_tags:
        return "Senior"
    if "junior" in lowered_tags:
        return "Junior"

    match = re.search(r"\b(\d+\+?)\s*(?:-|to)?\s*(\d+\+?)?\s+years?\b", description, re.I)
    if match:
        return clean_text(match.group(0))

    return "Not specified"


def infer_job_type(tags: list[str], description: str) -> str | None:
    text = " ".join(tags + [description]).lower()
    if "freelance" in text:
        return "freelance"
    if "contract" in text:
        return "contract"
    if "part time" in text or "part-time" in text:
        return "part_time"
    if "full time" in text or "full-time" in text:
        return "full_time"
    return None


def row_matches_filters(row: dict, args: argparse.Namespace) -> bool:
    haystack = " ".join(
        [
            clean_text(row.get("position")),
            clean_text(row.get("company")),
            clean_text(row.get("location")),
            " ".join(extract_tags(row)),
            html_to_text(row.get("description")),
        ]
    ).lower()

    if args.search and args.search.lower() not in haystack:
        return False
    if args.company and args.company.lower() not in clean_text(row.get("company")).lower():
        return False
    if args.tag:
        tags = {tag.lower() for tag in extract_tags(row)}
        if args.tag.lower() not in tags:
            return False

    return True


def row_to_scraped_job(row: dict, now: datetime) -> ScrapedJob | None:
    external_id = str(row.get("id") or "").strip()
    title = clean_text(row.get("position"))
    source_url = clean_text(row.get("url"))

    if not external_id or not title or not source_url:
        return None

    description = html_to_text(row.get("description"))
    tags = extract_tags(row)
    company_logo = clean_text(row.get("company_logo") or row.get("logo")) or None

    location = clean_text(row.get("location")).strip(" ,") or "Remote"

    return ScrapedJob(
        job_title=title,
        company_name=clean_text(row.get("company")) or "Remote OK Company",
        rating="None",
        experience=extract_experience(tags, description),
        location=location,
        min_requirements=description or "See source listing for full requirements.",
        tech_stack=tags,
        source="scraped",
        source_website=SOURCE_WEBSITE,
        source_url=source_url,
        external_id=external_id,
        project_status="open",
        budget=parse_budget(row),
        job_type=infer_job_type(tags, description),
        apply_url=clean_text(row.get("apply_url")) or source_url,
        company_logo=company_logo,
        slug=clean_text(row.get("slug")) or None,
        scraped_at=now,
        postedAt=parse_datetime(row.get("date"), now),
        updatedAt=now,
    )


def parse_jobs(rows: list[dict], args: argparse.Namespace) -> list[ScrapedJob]:
    now = datetime.now(timezone.utc)
    jobs: list[ScrapedJob] = []
    seen_ids: set[str] = set()

    for row in rows:
        if not isinstance(row, dict) or not row.get("id"):
            continue
        if not row_matches_filters(row, args):
            continue

        job = row_to_scraped_job(row, now)
        if not job or job.external_id in seen_ids:
            continue
        jobs.append(job)
        seen_ids.add(job.external_id)
        if args.limit and len(jobs) >= args.limit:
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
    rows = fetch_jobs(session, args.timeout)
    jobs = parse_jobs(rows, args)
    print(f"Parsed {len(jobs)} jobs from RemoteOK API response")

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
        description="Import public RemoteOK API jobs into GigWorld's jobs collection."
    )
    parser.add_argument(
        "--search",
        default=None,
        help="Optional local text filter over title, company, location, tags, and description.",
    )
    parser.add_argument(
        "--company",
        default=None,
        help="Optional local company-name filter.",
    )
    parser.add_argument(
        "--tag",
        default=None,
        help="Optional exact RemoteOK tag filter, e.g. python, react, marketing.",
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
    except requests.HTTPError as exc:
        print(f"HTTP error while calling RemoteOK API: {exc}", file=sys.stderr)
        return 1
    except requests.RequestException as exc:
        print(f"Network error while calling RemoteOK API: {exc}", file=sys.stderr)
        return 1
    except Exception as exc:
        print(f"RemoteOK scraper failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
