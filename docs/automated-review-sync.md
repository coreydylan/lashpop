# Automated Review Syncing

LashPop has an automated system that syncs reviews from Vagaro, Yelp, and Google Maps every 24 hours.

## How It Works

The system uses **Vercel Cron Jobs** to automatically run review scrapers daily at midnight UTC (4 PM PST / 5 PM PDT).

### Cron Schedule
- **Frequency**: Once per day
- **Time**: `0 0 * * *` (midnight UTC)
- **Endpoint**: `/api/cron/sync-reviews`

### What Gets Synced

Every 24 hours, the system:
1. **Scrapes Vagaro reviews** via Jina.ai reader
2. **Fetches Yelp reviews** via BrightData API
3. **Fetches Google Maps reviews** via BrightData API
4. **Deduplicates** and stores reviews in database
5. **Auto-approves** new reviews to testimonials table

## Database Tables

### `reviews`
Raw review data with full metadata from all sources (Vagaro, Yelp, Google).

### `testimonials`
Approved reviews displayed on the website. Auto-synced from `reviews` table.

## Configuration

### Required Environment Variables

```bash
# BrightData API (for Yelp & Google scraping)
BRIGHTDATA_API_TOKEN=your_api_token
BRIGHTDATA_YELP_DATASET_ID=gd_lgzhlu9323u3k24jkv
BRIGHTDATA_GOOGLE_DATASET_ID=gd_luzfs1dn2oa0teb81
YELP_BUSINESS_URL=https://www.yelp.com/biz/lashpop-studios-oceanside
YELP_INCLUDE_UNRECOMMENDED=true
GOOGLE_MAPS_URL=https://www.google.com/maps/place/LashPop+Studios/@...

# Cron job authentication
CRON_SECRET=your_secure_random_secret
```

### Setting Up in Vercel

1. Add environment variables to Vercel project settings
2. Deploy the app - cron job will automatically be registered
3. Monitor cron executions in Vercel dashboard > Cron tab

## Manual Sync

You can also manually trigger review syncs:

### Sync All Sources
```bash
curl -X GET "https://yoursite.com/api/cron/sync-reviews" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Sync Individual Sources
```bash
# Vagaro only
npx tsx scripts/scrape-vagaro-reviews.ts

# BrightData (Yelp + Google) only
npx tsx scripts/fetch-brightdata-reviews.ts
```

## Monitoring

### Vercel Dashboard
- Go to your project > Cron tab
- View execution history and logs
- See success/failure status

### Response Format
```json
{
  "success": true,
  "timestamp": "2025-11-14T00:00:00.000Z",
  "results": {
    "vagaro": {
      "success": true,
      "error": null,
      "stats": {
        "source": "vagaro",
        "parsed": 28,
        "inserted": 5,
        "testimonials": 3
      }
    },
    "brightdata": {
      "success": true,
      "error": null,
      "stats": {
        "sources": [
          {
            "source": "yelp",
            "parsed": 20,
            "inserted": 2,
            "testimonials": 2
          },
          {
            "source": "google",
            "parsed": 176,
            "inserted": 10,
            "testimonials": 10
          }
        ]
      }
    }
  }
}
```

## Security

The cron endpoint is protected by:
- **Bearer token authentication** - Only requests with valid `CRON_SECRET` are accepted
- **Vercel-signed requests** - In production, Vercel adds verification headers
- **Rate limiting** - Max 5-minute execution time

## Troubleshooting

### Cron job not running
1. Check Vercel dashboard > Cron tab for errors
2. Verify `vercel.json` has correct cron configuration
3. Ensure `CRON_SECRET` is set in environment variables

### No new reviews synced
- Reviews are automatically deduped
- If no new reviews exist, the count will be 0
- Check individual source logs for errors

### BrightData errors
- Verify API token is valid
- Check dataset IDs match your BrightData account
- Ensure business URLs are correct

## Cost Considerations

- **Vagaro**: Free (uses Jina.ai reader proxy)
- **BrightData**: Paid per record
  - Yelp: ~$0.0011 per review
  - Google Maps: ~$0.0011 per review
- Running daily will accumulate costs based on new reviews
