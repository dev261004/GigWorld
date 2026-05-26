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

## Upwork

The Upwork scraper targets public skill pages like
`https://www.upwork.com/freelance-jobs/python/`. It does not scrape Upwork's
login-only job search, RSS/feed routes, or challenge pages.

Preview data without writing to MongoDB:

```bash
python scraper/upwork.py --skills python --limit 5 --dry-run
```

Write parsed jobs to MongoDB:

```bash
python scraper/upwork.py --skills python react-js data-entry --delay 5
```

If Upwork returns a challenge page to server-side requests, save the public skill
page HTML from your browser and import that file:

```bash
python scraper/upwork.py --html-file path/to/upwork-python.html --dry-run
python scraper/upwork.py --html-file path/to/upwork-python.html
```

Notes:

- The script stops if Upwork returns a challenge, 403, 429, or similar block.
- It intentionally does not bypass captcha, login, or anti-bot systems.
- For production-scale usage, prefer Upwork's official API.
