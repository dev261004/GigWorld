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
from urllib.parse import unquote, urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from pymongo import MongoClient, UpdateOne
from pymongo.collection import Collection


BASE_URL = "https://www.twine.net"
JOBS_URL = f"{BASE_URL}/jobs"
SOURCE_WEBSITE = "twine.net"
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
    priority: str | None
    expires_at: datetime | None
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
    text = re.sub(r"\[(.*?)\]\((.*?)\)", r"\1 \2", text)
    text = text.replace("**", " ")
    return re.sub(r"\s+", " ", text).strip()


def parse_datetime(value: str | None, fallback: datetime | None = None) -> datetime | None:
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
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        }
    )
    return session


def fetch_page(session: requests.Session, url: str, timeout: int) -> str:
    response = session.get(url, timeout=timeout)
    response.raise_for_status()
    response.encoding = "utf-8"
    return response.text


def extract_embedded_state(html: str) -> dict:
    prefix = "window.__data="
    start = html.find(prefix)
    if start >= 0:
        start += len(prefix)
        end = html.find("</script>", start)
        if end > start:
            return json.loads(html[start:end].strip().rstrip(";"))

    soup = BeautifulSoup(html, "html.parser")
    for script in soup.find_all("script"):
        script_text = script.string or script.get_text()
        if prefix not in script_text:
            continue
        start = script_text.find(prefix) + len(prefix)
        return json.loads(script_text[start:].strip().rstrip(";"))

    raise RuntimeError("Could not find Twine embedded listing state.")


def looks_like_brief(value: object) -> bool:
    if not isinstance(value, dict):
        return False
    links = value.get("links")
    return bool(
        value.get("id")
        and value.get("text")
        and isinstance(links, dict)
        and (links.get("main") or links.get("main_relative"))
    )


def collect_briefs(value: object) -> list[dict]:
    if isinstance(value, dict):
        if looks_like_brief(value):
            return [value]

        jobs: list[dict] = []
        for child in value.values():
            jobs.extend(collect_briefs(child))
        return jobs

    if isinstance(value, list):
        jobs: list[dict] = []
        for child in value:
            jobs.extend(collect_briefs(child))
        return jobs

    return []


def extract_briefs_and_users(state: dict) -> tuple[list[dict], dict[str, dict]]:
    entities = state.get("entities") if isinstance(state.get("entities"), dict) else {}
    users = entities.get("users") if isinstance(entities.get("users"), dict) else {}
    briefs_map = entities.get("briefs") if isinstance(entities.get("briefs"), dict) else {}

    briefs = [
        brief
        for brief in briefs_map.values()
        if looks_like_brief(brief)
    ]
    if not briefs:
        briefs = collect_briefs(state)

    deduped: list[dict] = []
    seen_ids: set[str] = set()
    for brief in briefs:
        external_id = str(brief.get("id") or "").strip()
        if not external_id or external_id in seen_ids:
            continue
        deduped.append(brief)
        seen_ids.add(external_id)

    return deduped, users


def as_list(value: object) -> list[object]:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]


def extract_skills(brief: dict) -> list[str]:
    skills: list[str] = []
    for item in [*as_list(brief.get("roles")), *as_list(brief.get("role")), *as_list(brief.get("skill"))]:
        if isinstance(item, dict):
            name = clean_text(item.get("name") or item.get("text") or item.get("slug"))
        else:
            name = clean_text(item)
        if name and name not in skills:
            skills.append(name)
    return skills


def extract_answer_from_spec(spec: str, question_pattern: str) -> str:
    pattern = rf"\*\*{question_pattern}[^*]*\*\*\s*(.+?)(?:\n\s*\n|\*\*|$)"
    match = re.search(pattern, spec, flags=re.IGNORECASE | re.DOTALL)
    return clean_text(match.group(1)) if match else ""


def extract_experience(brief: dict) -> str:
    spec = str(brief.get("spec") or "")
    answer = extract_answer_from_spec(spec, r"What .*experience level is needed")
    if answer:
        return answer

    for question in as_list(brief.get("questions")):
        if not isinstance(question, dict):
            continue
        label = clean_text(question.get("question") or question.get("text") or question.get("label"))
        if "experience level" not in label.lower():
            continue
        answer = clean_experience_answer(
            question.get("answer")
            or question.get("response")
            or question.get("value")
            or question.get("selected")
        )
        if answer:
            return answer

    return "Not specified"


def clean_experience_answer(value: object) -> str:
    parts = []
    for item in as_list(value):
        if isinstance(item, dict):
            text = clean_text(item.get("label") or item.get("name") or item.get("text"))
        else:
            text = clean_text(item)
        text = re.sub(r":\s*[$£€]?\d.*$", "", text).strip()
        if text:
            parts.append(text)
    return ", ".join(parts)


def extract_job_type(brief: dict) -> str | None:
    spec = str(brief.get("spec") or "")
    answer = extract_answer_from_spec(spec, r"What type of work is this")
    return answer or None


def extract_location(brief: dict) -> str:
    location = clean_text(brief.get("location"))
    if brief.get("remote"):
        return "Remote" if not location else f"Remote, {location}"
    return location or "Remote"


def extract_company_name(brief: dict, users: dict[str, dict]) -> str:
    user_id = str(brief.get("user") or brief.get("user_id") or "").strip()
    user = users.get(user_id) if user_id else None
    if isinstance(user, dict):
        display_name = clean_text(user.get("displayname") or user.get("username"))
        if display_name:
            return display_name
    return "Twine Client"


def parse_number(value: object) -> float | None:
    if isinstance(value, (int, float)):
        return float(value) if value > 0 else None
    if value is None:
        return None
    match = re.search(r"\d+(?:,\d{3})*(?:\.\d+)?", str(value))
    if not match:
        return None
    number = float(match.group(0).replace(",", ""))
    return number if number > 0 else None


def extract_budget(brief: dict) -> dict[str, object]:
    spec = str(brief.get("spec") or "")
    raw = extract_answer_from_spec(spec, r"Budget range:?")
    currency = clean_text(brief.get("currency")).upper() or None

    amount = parse_number(brief.get("amount")) or parse_number(brief.get("budget"))
    if amount and not raw:
        raw = f"{currency} {amount:g}" if currency else f"{amount:g}"

    if not amount:
        amount = parse_number(raw)

    numbers = [
        float(match.replace(",", ""))
        for match in re.findall(r"\d+(?:,\d{3})*(?:\.\d+)?", raw)
    ]
    is_hourly = any(term in raw.lower() for term in ["/hr", "per hour", "hourly", "/hour"])

    return {
        "raw": raw or None,
        "currency": currency,
        "min": numbers[0] if numbers else amount,
        "max": numbers[1] if len(numbers) > 1 else amount,
        "is_hourly": is_hourly,
    }


def brief_to_job(brief: dict, users: dict[str, dict], now: datetime) -> ScrapedJob | None:
    title = clean_text(brief.get("text"))
    external_id = str(brief.get("id") or "").strip()

    links = brief.get("links") if isinstance(brief.get("links"), dict) else {}
    source_url = clean_text(links.get("main")) or urljoin(
        BASE_URL, clean_text(links.get("main_relative"))
    )

    if not title or not external_id or not source_url:
        return None

    posted_at = parse_datetime(brief.get("timestamp") or brief.get("approved_at"), now) or now
    expires_at = parse_datetime(brief.get("expires_at"))

    return ScrapedJob(
        job_title=title,
        company_name=extract_company_name(brief, users),
        rating="None",
        experience=extract_experience(brief),
        location=extract_location(brief),
        min_requirements=clean_text(brief.get("spec"))
        or "See source listing for full requirements.",
        tech_stack=extract_skills(brief),
        source="scraped",
        source_website=SOURCE_WEBSITE,
        source_url=source_url,
        external_id=external_id,
        project_status=clean_text(brief.get("status")) or None,
        budget=extract_budget(brief),
        proposals_count=brief.get("num_of_pitches")
        or brief.get("num_of_pitches_or_pending_pitches"),
        job_type=extract_job_type(brief),
        priority=clean_text(brief.get("priority")) or None,
        expires_at=expires_at,
        scraped_at=now,
        postedAt=posted_at,
        updatedAt=now,
    )


def parse_jobs(html: str) -> list[ScrapedJob]:
    state = extract_embedded_state(html)
    briefs, users = extract_briefs_and_users(state)
    now = datetime.now(timezone.utc)

    jobs: list[ScrapedJob] = []
    seen_ids: set[str] = set()
    for brief in briefs:
        job = brief_to_job(brief, users, now)
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
    doc["expires_at"] = job.expires_at.isoformat() if job.expires_at else None
    return doc


def scrape(args: argparse.Namespace) -> int:
    load_environment()
    session = make_session(args.user_agent)
    all_jobs: list[ScrapedJob] = []
    seen_ids: set[str] = set()

    if args.pages > 1:
        print(
            "Twine's public jobs page exposes the current listing set in the page "
            "HTML; additional --pages values will refetch the same public page."
        )

    for page_number in range(1, args.pages + 1):
        print(f"Fetching {args.url}")
        html = fetch_page(session, args.url, args.timeout)
        page_jobs = parse_jobs(html)
        print(f"Parsed {len(page_jobs)} jobs from fetch {page_number}")

        for job in page_jobs:
            if job.external_id in seen_ids:
                continue
            all_jobs.append(job)
            seen_ids.add(job.external_id)

        if args.limit and len(all_jobs) >= args.limit:
            all_jobs = all_jobs[: args.limit]
            break

        if page_number < args.pages:
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
        description="Scrape public Twine jobs into GigWorld's jobs collection."
    )
    parser.add_argument(
        "--url",
        default=JOBS_URL,
        help="Twine jobs URL to scrape, e.g. https://www.twine.net/jobs/developers.",
    )
    parser.add_argument(
        "--pages",
        type=int,
        default=1,
        help="Number of public page fetches. Twine currently exposes one listing set per URL.",
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
    if args.limit < 0:
        parser.error("--limit cannot be negative")
    if args.delay < 0 or args.jitter < 0:
        parser.error("--delay and --jitter cannot be negative")
    return args


def main(argv: list[str] | None = None) -> int:
    try:
        return scrape(parse_args(argv or sys.argv[1:]))
    except requests.HTTPError as exc:
        print(f"HTTP error while scraping Twine: {exc}", file=sys.stderr)
        return 1
    except requests.RequestException as exc:
        print(f"Network error while scraping Twine: {exc}", file=sys.stderr)
        return 1
    except Exception as exc:
        print(f"Twine scraper failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
