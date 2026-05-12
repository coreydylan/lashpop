#!/bin/bash
# Wrapper script invoked by launchd. Loads env, runs fetch + upload, cleans up.
# Logs to scripts/instagram-import/last-run.log

set -e
REPO_DIR="/Users/coreydylan/Developer/lashpop"
LOG_FILE="$REPO_DIR/scripts/instagram-import/last-run.log"

cd "$REPO_DIR"

# Tee everything to log
exec >"$LOG_FILE" 2>&1

echo "=== Instagram sync started $(date) ==="

# Load env (DATABASE_URL, R2_*, NEXT_PUBLIC_R2_BUCKET_URL)
set -a
source .env.local
set +a

# Make sure Node tools are on PATH (launchd has a minimal PATH)
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$HOME/.npm-global/bin:$PATH"

# Fetch (uses session.json + instagrapi)
"$REPO_DIR/.venv-scrape/bin/python" scripts/instagram-import/fetch.py --limit 24

# Upload to R2 + DB
npx tsx scripts/instagram-import/upload.ts

# Clean up local downloads (session stays)
rm -rf scripts/instagram-import/images
rm -f scripts/instagram-import/manifest.json

echo "=== Instagram sync finished $(date) ==="
