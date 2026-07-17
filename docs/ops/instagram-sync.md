# Instagram sync operations

`lashpop-instagram-sync` imports recent `@lashpopstudios` media into D1 and R2. It uses an
Instagram web session because the current implementation has no Meta app/OAuth integration.

## Current secret contract

- `IG_SESSION_ID` — sensitive `sessionid` cookie; currently requires an interactive login.
- `IG_DS_USER_ID` — sensitive cookie value.
- `IG_CSRF_TOKEN` — sensitive cookie value.
- `NEXT_PUBLIC_R2_BUCKET_URL` — public DAM asset base URL.
- `MANUAL_TRIGGER_SECRET` — bearer token for the protected manual run endpoint.

Never place cookie values in Git, shell history, documentation, or command arguments. Field
is the secret source of truth. After an interactive Instagram login, refresh the missing
session secret with the hidden-input helper:

```bash
scripts/cloudflare/refresh-instagram-worker-session.sh
```

Then deploy with the cron still disabled, confirm `/health` reports all three session
components configured, and run a protected one-post smoke test. Only after that succeeds,
enable `"triggers": { "crons": ["30 13 * * *"] }`, deploy again, and verify the schedule
through Cloudflare's API.

Session cookies expire and can be challenged by Instagram. The maintainable long-term path
is a Meta app with the official Instagram API and OAuth token refresh. That requires client
authorization/app ownership and cannot be completed from infrastructure credentials alone.
