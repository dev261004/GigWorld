from __future__ import annotations

import argparse
import hashlib
import json
import os
import random
import re
import sys
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from time import sleep
from typing import Iterable
from urllib.parse import unquote, urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from pymongo import MongoClient, UpdateOne
from pymongo.collection import Collection

from lifecycle import upsert_jobs_with_lifecycle, validate_sync_args


BASE_URL = "https://www.freelancer.com"
SOURCE_WEBSITE = "freelancer.com"
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
    bids_count: int | None
    scraped_at: datetime
    postedAt: datetime
    updatedAt: datetime


def load_environment() -> None:
    repo_root = Path(__file__).resolve().parents[1]
    load_dotenv(repo_root / ".env")
    load_dotenv(repo_root / "backend" / ".env")
    load_dotenv(Path(__file__).resolve().parent / ".env")


def clean_text(value: str | None) -> str:
    if not value:
        return ""
    return re.sub(r"\s+", " ", value).strip()


def parse_int(value: str | None) -> int | None:
    if not value:
        return None
    match = re.search(r"\d+", value.replace(",", ""))
    return int(match.group(0)) if match else None


def extract_budget(price_text: str) -> dict[str, object]:
    price_text = clean_text(price_text)
    if not price_text:
        return {"raw": None}

    currency_symbols = "$" + "\u20ac" + "\u00a3" + "\u20b9"
    currency_match = re.search(
        rf"[{re.escape(currency_symbols)}]|USD|EUR|GBP|INR", price_text, re.I
    )
    numbers = [
        float(num.replace(",", ""))
        for num in re.findall(r"\d+(?:,\d{3})*(?:\.\d+)?", price_text)
    ]

    return {
        "raw": price_text,
        "currency": currency_match.group(0) if currency_match else None,
        "min": numbers[0] if numbers else None,
        "max": numbers[1] if len(numbers) > 1 else None,
        "is_hourly": "/ hr" in price_text.lower() or "hour" in price_text.lower(),
    }


def build_page_url(page_number: int) -> str:
    if page_number <= 1:
        return f"{BASE_URL}/jobs"
    return f"{BASE_URL}/jobs/{page_number}"


def make_session(user_agent: str) -> requests.Session:
    session = requests.Session()
    session.headers.update(
        {
            "User-Agent": user_agent,
            "Accept": (
                "text/html,application/xhtml+xml,application/xml;q=0.9,"
                "image/avif,image/webp,*/*;q=0.8"
            ),
            "Accept-Language": "en-US,en;q=0.9",
        }
    )
    return session


def fetch_page(session: requests.Session, url: str, timeout: int) -> str:
    response = session.get(url, timeout=timeout)
    response.raise_for_status()
    return response.text


def stable_external_id(source_url: str) -> str:
    path = urlparse(source_url).path.strip("/")
    if path:
        return path
    return hashlib.sha256(source_url.encode("utf-8")).hexdigest()


def parse_job_card(card, now: datetime) -> ScrapedJob | None:
    title_link = card.select_one(
        "[data-heading-link='true'], .JobSearchCard-primary-heading-link"
    )
    if not title_link:
        return None

    title = clean_text(title_link.get_text(" ", strip=True))
    source_url = urljoin(BASE_URL, title_link.get("href", ""))
    description = clean_text(
        card.select_one(".JobSearchCard-primary-description").get_text(" ", strip=True)
        if card.select_one(".JobSearchCard-primary-description")
        else ""
    )
    tags = [
        clean_text(tag.get_text(" ", strip=True))
        for tag in card.select(".JobSearchCard-primary-tagsLink")
    ]
    tags = [tag for tag in tags if tag]

    status = clean_text(
        card.select_one(".JobSearchCard-primary-heading-days").get_text(" ", strip=True)
        if card.select_one(".JobSearchCard-primary-heading-days")
        else ""
    )
    price_text = clean_text(
        card.select_one(".JobSearchCard-secondary-price").get_text(" ", strip=True)
        if card.select_one(".JobSearchCard-secondary-price")
        else ""
    )
    if not price_text:
        price_text = clean_text(
            card.select_one(".JobSearchCard-primary-price").get_text(" ", strip=True)
            if card.select_one(".JobSearchCard-primary-price")
            else ""
        )

    bids_text = clean_text(
        card.select_one(".JobSearchCard-secondary-entry").get_text(" ", strip=True)
        if card.select_one(".JobSearchCard-secondary-entry")
        else ""
    )

    card_text = clean_text(card.get_text(" ", strip=True)).lower()
    location = "Local" if " local " in f" {card_text} " else "Remote"

    return ScrapedJob(
        job_title=title,
        company_name="Freelancer.com Client",
        rating="None",
        experience="Not specified",
        location=location,
        min_requirements=description or "See source listing for full requirements.",
        tech_stack=tags,
        source="scraped",
        source_website=SOURCE_WEBSITE,
        source_url=source_url,
        external_id=stable_external_id(source_url),
        project_status=status or None,
        budget=extract_budget(price_text),
        bids_count=parse_int(bids_text),
        scraped_at=now,
        postedAt=now,
        updatedAt=now,
    )


def parse_jobs(html: str) -> list[ScrapedJob]:
    soup = BeautifulSoup(html, "html.parser")
    now = datetime.now(timezone.utc)
    cards = soup.select(
        "#project-list .JobSearchCard-item-inner[data-project-card='true']"
    )
    if not cards:
        cards = soup.select(".JobSearchCard-item-inner[data-project-card='true']")

    jobs: list[ScrapedJob] = []
    seen_ids: set[str] = set()
    for card in cards:
        job = parse_job_card(card, now)
        if not job or job.external_id in seen_ids:
            continue
        jobs.append(job)
        seen_ids.add(job.external_id)
    return jobs


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


def resolve_db_name(mongodb_url: str | None, explicit_db_name: str | None) -> str:
    if explicit_db_name and explicit_db_name.strip():
        return explicit_db_name.strip()

    if mongodb_url:
        url_db_name = unquote(urlparse(mongodb_url).path.strip("/"))
        if url_db_name:
            return url_db_name

    env_db_name = os.getenv("DB_NAME")
    if env_db_name and env_db_name.strip():
        return env_db_name.strip()

    return "Gigworld"


def upsert_jobs(
    collection: Collection, jobs: Iterable[ScrapedJob], sync_lifecycle: bool
) -> tuple[int, int, int]:
    return upsert_jobs_with_lifecycle(
        collection, jobs, SOURCE_WEBSITE, sync_lifecycle=sync_lifecycle
    )


def scrape(args: argparse.Namespace) -> int:
    load_environment()
    session = make_session(args.user_agent)
    all_jobs: list[ScrapedJob] = []

    end_page = args.start_page + args.pages
    for page_number in range(args.start_page, end_page):
        url = build_page_url(page_number)
        print(f"Fetching {url}")
        html = fetch_page(session, url, args.timeout)
        page_jobs = parse_jobs(html)
        print(f"Parsed {len(page_jobs)} jobs from page {page_number}")

        all_jobs.extend(page_jobs)
        if args.limit and len(all_jobs) >= args.limit:
            all_jobs = all_jobs[: args.limit]
            break

        if page_number < end_page - 1:
            sleep(args.delay + random.uniform(0, args.jitter))

    if args.dry_run:
        preview = [
            {
                **asdict(job),
                "scraped_at": job.scraped_at.isoformat(),
                "postedAt": job.postedAt.isoformat(),
                "updatedAt": job.updatedAt.isoformat(),
            }
            for job in all_jobs
        ]
        print(json.dumps(preview, indent=2, ensure_ascii=False))
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
        description="Scrape public Freelancer.com jobs into GigWorld's jobs collection."
    )
    parser.add_argument("--pages", type=int, default=1, help="Number of pages to scrape.")
    parser.add_argument(
        "--start-page", type=int, default=1, help="Freelancer jobs page to start from."
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
    parser.add_argument(
        "--collection", default="jobs", help="MongoDB collection name."
    )
    parser.add_argument(
        "--user-agent", default=DEFAULT_USER_AGENT, help="HTTP User-Agent header."
    )
    args = parser.parse_args(argv)

    if args.pages < 1:
        parser.error("--pages must be at least 1")
    if args.start_page < 1:
        parser.error("--start-page must be at least 1")
    if args.delay < 0 or args.jitter < 0:
        parser.error("--delay and --jitter cannot be negative")
    validate_sync_args(parser, args)
    return args


def main(argv: list[str] | None = None) -> int:
    try:
        return scrape(parse_args(argv or sys.argv[1:]))
    except requests.HTTPError as exc:
        print(f"HTTP error while scraping Freelancer: {exc}", file=sys.stderr)
        return 1
    except requests.RequestException as exc:
        print(f"Network error while scraping Freelancer: {exc}", file=sys.stderr)
        return 1
    except Exception as exc:
        print(f"Scraper failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
