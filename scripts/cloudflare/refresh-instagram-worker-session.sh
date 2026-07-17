#!/bin/zsh
set -euo pipefail

repo_dir="${0:A:h:h:h}"
worker_dir="$repo_dir/workers/instagram-sync"
wrangler="$worker_dir/node_modules/.bin/wrangler"

if [[ ! -x "$wrangler" ]]; then
  print -u2 "Wrangler is not installed at $wrangler"
  exit 1
fi

print "Paste the Instagram sessionid cookie. Input is hidden and is sent directly to Cloudflare."
read -rs "session_id?> "
print
if [[ -z "$session_id" ]]; then
  print -u2 "No sessionid supplied; nothing changed."
  exit 1
fi

print -rn -- "$session_id" | "$wrangler" secret put IG_SESSION_ID --config "$worker_dir/wrangler.jsonc"
unset session_id
print "IG_SESSION_ID was updated. Run the documented health and one-post smoke test before enabling cron."
