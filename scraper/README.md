# GigWorld Scrapers

## Freelancer.com

The Freelancer scraper reads public job listing pages such as `/jobs` and `/jobs/2`,
normalizes each card into the backend `Job` shape, and upserts records into the
MongoDB `jobs` collection.

Install dependencies:

```bash
pip install -r scraper/requirements.txt
```

Preview data without writing to MongoDB:

```bash
python scraper/freelancer.py --pages 1 --limit 5 --dry-run
```

Write parsed jobs to MongoDB:

```bash
python scraper/freelancer.py --pages 3 --delay 5
```

The script loads `MONGODB_URL` and `DB_NAME` from `backend/.env`. You can also
override them with `--mongodb-url` and `--db-name`.

Notes:

- Keep `--dry-run` on while changing selectors.
- Use small page counts and a polite delay between requests.
- Do not add login flows, captcha bypasses, or disallowed query-string scraping.

## Truelancer

The Truelancer scraper reads the public projects feed used by
`https://www.truelancer.com/freelance-jobs`, normalizes each project into the
backend `Job` shape, and upserts records into MongoDB.

Preview data without writing to MongoDB:

```bash
python scraper/truelancer.py --pages 1 --limit 5 --dry-run
```

Write parsed jobs to MongoDB:

```bash
python scraper/truelancer.py --pages 3 --delay 5
```

Notes:

- The script loads `MONGODB_URL` and `DB_NAME` from `backend/.env`.
- It upserts by Truelancer project ID, so reruns update existing rows.
- Use small page counts and a polite delay between requests.

## Hubstaff Talent

The Hubstaff Talent scraper reads the public job-search XHR used by
`https://hubstafftalent.net/search/jobs`, parses the returned result cards, and
upserts records into MongoDB.

Preview data without writing to MongoDB:

```bash
python scraper/hubstaff.py --pages 1 --limit 5 --dry-run
```

Search by keyword:

```bash
python scraper/hubstaff.py --keyword developer --pages 1 --limit 5 --dry-run
```

Write parsed jobs to MongoDB:

```bash
python scraper/hubstaff.py --pages 3 --delay 5
```

Notes:

- The script loads `MONGODB_URL` and `DB_NAME` from `backend/.env`.
- It upserts by Hubstaff job URL, so reruns update existing rows.
- Use small page counts and a polite delay between requests.

## Twine

The Twine scraper reads the public jobs page at `https://www.twine.net/jobs`,
extracts the embedded listing data, normalizes each job into the backend `Job`
shape, and upserts records into MongoDB.

Preview data without writing to MongoDB:

```bash
python scraper/twine.py --limit 5 --dry-run
```

Scrape a role-specific Twine page:

```bash
python scraper/twine.py --url https://www.twine.net/jobs/developers --limit 5 --dry-run
```

Write parsed jobs to MongoDB:

```bash
python scraper/twine.py --limit 25
```

Notes:

- The script loads `MONGODB_URL` and `DB_NAME` from `backend/.env`.
- It upserts by Twine listing ID, so reruns update existing rows.
- Twine currently exposes one public listing set per page URL.

## DesignCrowd

The DesignCrowd scraper reads public open design jobs from
`https://www.designcrowd.com/jobs/`, parses listing cards, and upserts records
into MongoDB.

Preview data without writing to MongoDB:

```bash
python scraper/designcrowd.py --pages 1 --limit 5 --dry-run
```

Write parsed jobs to MongoDB:

```bash
python scraper/designcrowd.py --pages 2 --delay 5
```

Scrape a category page:

```bash
python scraper/designcrowd.py --url https://www.designcrowd.com/jobs/open/corporateidentity/ --limit 5 --dry-run
```

Notes:

- The script loads `MONGODB_URL` and `DB_NAME` from `backend/.env`.
- It upserts by DesignCrowd job ID, so reruns update existing rows.
- Private listings are stored only with the public metadata shown on the jobs page.

## Remotive API

The Remotive scraper reads jobs from the public Remotive API at
`https://remotive.com/api/remote-jobs`, normalizes each API record into the
backend `Job` shape, and upserts records into MongoDB.

Preview data without writing to MongoDB:

```bash
python scraper/remotive.py --limit 5 --dry-run
```

Search jobs:

```bash
python scraper/remotive.py --search python --limit 5 --dry-run
```

Filter by category or company:

```bash
python scraper/remotive.py --category software-dev --limit 5 --dry-run
python scraper/remotive.py --company-name "A.Team" --limit 5 --dry-run
```

Write parsed jobs to MongoDB:

```bash
python scraper/remotive.py --limit 25
```

Notes:

- The script loads `MONGODB_URL` and `DB_NAME` from `backend/.env`.
- It upserts by Remotive job ID, so reruns update existing rows.
- Keep Remotive attribution and link users back with the stored `source_url`.

## RemoteOK API

The RemoteOK scraper reads jobs from the public RemoteOK API at
`https://remoteok.com/api`, skips the API metadata row, normalizes each job into
the backend `Job` shape, and upserts records into MongoDB.

Preview data without writing to MongoDB:

```bash
python scraper/remoteok.py --limit 5 --dry-run
```

Search or filter locally:

```bash
python scraper/remoteok.py --search python --limit 5 --dry-run
python scraper/remoteok.py --tag react --limit 5 --dry-run
python scraper/remoteok.py --company "A.Team" --limit 5 --dry-run
```

Write parsed jobs to MongoDB:

```bash
python scraper/remoteok.py --limit 25
```

Notes:

- The script loads `MONGODB_URL` and `DB_NAME` from `backend/.env`.
- It upserts by RemoteOK job ID, so reruns update existing rows.
- RemoteOK requires visible attribution and links back to RemoteOK job URLs.

## We Work Remotely RSS

The We Work Remotely scraper reads jobs from the public RSS feed at
`https://weworkremotely.com/remote-jobs.rss`, parses each RSS item, normalizes it
into the backend `Job` shape, and upserts records into MongoDB.

Preview data without writing to MongoDB:

```bash
python scraper/weworkremotely.py --limit 5 --dry-run
```

Search or filter locally:

```bash
python scraper/weworkremotely.py --search python --limit 5 --dry-run
python scraper/weworkremotely.py --category "Programming" --limit 5 --dry-run
python scraper/weworkremotely.py --company "Cadastra" --limit 5 --dry-run
```

Use a category RSS feed:

```bash
python scraper/weworkremotely.py --feed-url https://weworkremotely.com/categories/remote-programming-jobs.rss --limit 5 --dry-run
```

Write parsed jobs to MongoDB:

```bash
python scraper/weworkremotely.py --limit 25
```

Notes:

- The script loads `MONGODB_URL` and `DB_NAME` from `backend/.env`.
- It upserts by We Work Remotely RSS GUID/job slug, so reruns update existing rows.
- We Work Remotely asks feed users to attribute links back to We Work Remotely.
