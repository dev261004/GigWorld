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
