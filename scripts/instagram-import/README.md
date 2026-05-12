# Instagram Gallery Sync

Pulls full-resolution posts from `@lashpopstudios` and replaces the homepage
gallery with sharp images.

## Schedule

Runs daily at 6:30 AM Pacific via macOS launchd.
**Only fires when the machine is awake** — closed laptop → no run that week,
will catch up next day the machine is on.

## Files

- `fetch.py` — uses `instagrapi` to pull recent posts, downloads images, writes
  `manifest.json`. Tries an anonymous session first; if rate-limited, will use
  `session.json` if it exists.
- `upload.ts` — reads the manifest, uploads each image to R2, inserts asset
  rows in Postgres, tags them with `ig_carousel` so the homepage carousel
  picks them up. Idempotent — re-runs skip duplicate `external_id`s.
- `run.sh` — wrapper that loads `.env.local`, runs fetch + upload, cleans up.
  Logs every run to `last-run.log`.
- `login.py` — one-time login flow if anonymous starts getting blocked. Writes
  a `session.json` that `fetch.py` will pick up automatically.

## Install on a new machine

```bash
cd /Users/coreydylan/Developer/lashpop

# Python venv with instagrapi + pillow
python3 -m venv .venv-scrape
.venv-scrape/bin/pip install instagrapi pillow

# Copy the launchd plist (loaded from the repo to make it easy to redeploy)
cp scripts/instagram-import/com.lashpop.instagram-sync.plist \
   ~/Library/LaunchAgents/com.lashpop.instagram-sync.plist
launchctl load ~/Library/LaunchAgents/com.lashpop.instagram-sync.plist
```

## Manual run

```bash
scripts/instagram-import/run.sh
tail -50 scripts/instagram-import/last-run.log
```

## If anonymous gets blocked

```bash
.venv-scrape/bin/python scripts/instagram-import/login.py
# (writes session.json - already gitignored)
```

## Inspect / disable

```bash
launchctl list | grep lashpop
launchctl unload ~/Library/LaunchAgents/com.lashpop.instagram-sync.plist
```
