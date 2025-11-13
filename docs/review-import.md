## Vagaro Review Importer

The `scripts/scrape-vagaro-reviews.ts` helper fetches the public LashPop review
feed from Vagaro (via the read-only [r.jina.ai](https://r.jina.ai) mirror) and
imports any new reviews into two tables:

- `reviews` – canonical raw feed, one row per review (Vagaro or other sources).
- `testimonials` – curated set used by the marketing site (auto-approved with
  rating 5 and ordered after the latest entry).

### Requirements

- `.env.local` must define `DATABASE_URL` (Postgres connection used by Drizzle).
- Optional: override `VAGARO_REVIEWS_SOURCE` if you want to point at a
  different Vagaro vanity URL or a pre-fetched snapshot.

### Syncing Vagaro reviews

```bash
npx tsx scripts/scrape-vagaro-reviews.ts
```

What the script does:

1. Downloads the LashPop reviews page as Markdown, bypassing Imperva/Incapsula.
2. Parses reviewer names, optional dates, the target (`Venue` or service
   provider), and review text. Provider names are matched against the
   `team_members` table so we can capture both venue + individual feedback.
3. Upserts into `reviews`, deduping by `source + reviewer + review text`.
4. Mirrors any newly seen reviews into `testimonials` so the frontend can render
   them (rating defaults to 5). Business responses are appended to the stored
   review text for context.

Display order increments from the current maximum so each run simply appends new
testimonials. Re-run the script any time you want to sync the latest Vagaro
reviews into the database.

### Syncing Bright Data (Yelp/Google) reviews

The Bright Data helper triggers the configured datasets (Yelp, Google Maps, etc.)
and pipes the resulting rows into the shared `reviews` + `testimonials` tables.
Set the following env vars in `.env.local`:

- `BRIGHTDATA_API_TOKEN`
- `BRIGHTDATA_YELP_DATASET_ID` / `BRIGHTDATA_GOOGLE_DATASET_ID`
- `YELP_BUSINESS_URL`, `GOOGLE_MAPS_URL`

Then run:

```bash
npx tsx scripts/fetch-brightdata-reviews.ts
```

Each row is normalized, deduped per source, and synced just like the Vagaro
importer, so the marketing site stays in sync regardless of the review source.
