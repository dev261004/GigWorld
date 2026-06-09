# GigWorld Scraper Commands

Use these commands from PowerShell.

## One-Time Setup

```powershell
cd backend
npm run jobs:backfill-lifecycle
```

Purpose:

- Adds lifecycle fields to existing job records.
- Marks existing active jobs as active.
- Marks already-expired jobs as inactive.
- Sets expired jobs to be deleted after 60 days.
- Does not mark old existing jobs as "New Gig".

Run this once before starting the lifecycle worker.

## Test One Full Sync

```powershell
cd backend
npm run scrape:once
```

Purpose:

- Runs all active scraper sources one time.
- Inserts new gigs.
- Updates existing gigs.
- Marks missing old gigs as expired.
- Good command to test before starting the always-running worker.

## Start Automatic 6-Hour Worker

```powershell
cd backend
npm run scrape:worker
```

Purpose:

- Starts the backend scraper worker.
- Runs every 6 hours.
- Runs all active scrapers sequentially.
- Keeps job lifecycle synced automatically.

Keep this process running on your server.

## GitHub Actions 6-Hour Scraper

Workflow file:

```text
.github/workflows/scrape-jobs.yml
```

Purpose:

- Runs `npm run scrape:once` automatically every 6 hours on GitHub.
- Keeps scraping working even when your local PC is shut down.
- Uses the same lifecycle sync logic as the local worker.
- Does not change local scraping commands.
- Skips DesignCrowd in GitHub Actions through `SCRAPER_DISABLED_SOURCES=designcrowd`.

Required GitHub repository secret:

```text
MONGODB_URL
```

Optional GitHub repository secret:

```text
DB_NAME
```

Add secrets in GitHub:

```text
Repository -> Settings -> Secrets and variables -> Actions -> New repository secret
```

Manual run:

```text
Repository -> Actions -> GigWorld Scheduled Scraper -> Run workflow
```

Important:

- The schedule runs on GitHub's servers, not your local machine.
- GitHub cron uses UTC time.
- In a public repo, do not commit `.env`; keep MongoDB credentials only in GitHub Secrets.

## Preview One Scraper Without Writing DB

```powershell
python scraper\remotive.py --limit 5 --dry-run
```

Purpose:

- Checks if a scraper can still fetch and parse jobs.
- Does not insert, update, expire, or delete anything.
- Safe for testing selectors/API responses.

You can replace `remotive.py` with any scraper file, for example:

```powershell
python scraper\remoteok.py --limit 5 --dry-run
python scraper\weworkremotely.py --limit 5 --dry-run
python scraper\twine.py --limit 5 --dry-run
python scraper\guru.py --limit 5 --dry-run
```

## Run One Source With Lifecycle Sync

```powershell
python scraper\remotive.py --sync-lifecycle
```

Purpose:

- Runs one scraper in production sync mode.
- Inserts new jobs from that source.
- Updates jobs already in MongoDB.
- Marks jobs from that same source as expired if they were not seen in this run.

Important:

- Do not use `--limit` with `--sync-lifecycle`.
- If you want only a preview, use `--dry-run` instead.

## Recommended Order

For first setup:

```powershell
cd backend
npm run jobs:backfill-lifecycle
npm run scrape:once
npm run scrape:worker
```

For daily/server usage:

```powershell
cd backend
npm run scrape:worker
```
