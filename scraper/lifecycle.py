from __future__ import annotations

from dataclasses import asdict
from datetime import datetime, timedelta, timezone
from typing import Iterable
from uuid import uuid4

from pymongo import UpdateOne
from pymongo.collection import Collection


NEW_GIG_HOURS = 48
EXPIRED_RETENTION_DAYS = 60


def make_run_id(source_website: str) -> str:
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    return f"{source_website}:{timestamp}:{uuid4().hex}"


def validate_sync_args(parser, args) -> None:
    if getattr(args, "sync_lifecycle", False) and getattr(args, "limit", 0):
        parser.error("--sync-lifecycle cannot be used with --limit")


def is_expired_datetime(value, now: datetime) -> bool:
    if not isinstance(value, datetime):
        return False
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value <= now


def upsert_jobs_with_lifecycle(
    collection: Collection,
    jobs: Iterable[object],
    source_website: str,
    sync_lifecycle: bool = False,
    run_id: str | None = None,
) -> tuple[int, int, int]:
    now = datetime.now(timezone.utc)
    run_id = run_id or make_run_id(source_website)
    jobs = list(jobs)

    operations = []
    for job in jobs:
        doc = asdict(job)
        expires_at = doc.get("expires_at")
        expired_by_date = is_expired_datetime(expires_at, now)

        doc["source_website"] = source_website
        doc["is_active"] = not expired_by_date
        doc["last_seen_at"] = now
        doc["last_scrape_run_id"] = run_id
        doc["scraped_at"] = now
        doc["updatedAt"] = now
        if expired_by_date:
            doc["project_status"] = "expired"
            doc["expired_at"] = now
            doc["delete_after"] = now + timedelta(days=EXPIRED_RETENTION_DAYS)

        set_on_insert = {
            "createdAt": now,
            "first_seen_at": now,
        }
        if expired_by_date:
            doc["new_until"] = None
        else:
            set_on_insert["new_until"] = now + timedelta(hours=NEW_GIG_HOURS)

        update_doc = {
            "$set": doc,
            "$setOnInsert": set_on_insert,
        }
        if not expired_by_date:
            update_doc["$unset"] = {
                "expired_at": "",
                "delete_after": "",
            }

        operations.append(
            UpdateOne(
                {
                    "source_website": source_website,
                    "external_id": job.external_id,
                },
                update_doc,
                upsert=True,
            )
        )

    inserted = 0
    updated = 0
    if operations:
        result = collection.bulk_write(operations, ordered=False)
        inserted = result.upserted_count
        updated = result.modified_count

    expired = 0
    if sync_lifecycle and jobs:
        expire_result = collection.update_many(
            {
                "source": "scraped",
                "source_website": source_website,
                "is_active": {"$ne": False},
                "last_scrape_run_id": {"$ne": run_id},
            },
            {
                "$set": {
                    "is_active": False,
                    "project_status": "expired",
                    "expired_at": now,
                    "delete_after": now + timedelta(days=EXPIRED_RETENTION_DAYS),
                    "updatedAt": now,
                }
            },
        )
        expired = expire_result.modified_count

    return inserted, updated, expired
