# LashPop DNS cutover readiness — 2026-08-28

This record pins the current release and the final public-DNS action. It does
not authorize or perform launch. Public DNS still serves Squarespace.

## Current release boundary

- GitHub `main`: `e4e346fdaacd0c65069de0c90d70057dc572a9ca` (PR #35).
- Vercel production: `dpl_EE6Ri6zNeyq6bcpDzXJZSCFD7MQL`, READY, built from
  exact commit `e4e346f`.
- Previous Vercel rollback: `dpl_GGFFaU3VdBDNu7vBJkJvKCuuYMsP` at `f60185a`.
- `quality`, `browser-regression`, Vercel preview, post-merge GitHub checks,
  and a fresh clean-worktree `npm run test:launch` all passed.
- `npm run validate:seo-migration -- https://lashpop.vercel.app` passed: 104
  self-canonical sitemap URLs returned 200 and 20 legacy/bad-staging URLs
  redirected in one hop.
- Desktop, 390 px, and 320 px headless browser checks loaded meaningful
  content with no error overlay, console errors, broken images, or full-page
  horizontal overflow. The 320 px team section rendered all 16 images.
- Vercel logs contained no error-level or HTTP 500 entries for the current
  deployment during this readiness run.

## Provider and data state

- `lashpop.vercel.app`, `lashpopstudios.com`, and
  `www.lashpopstudios.com` are attached to `experial/lashpop`.
- Vercel project domain `www.lashpopstudios.com` is prestaged as a permanent
  308 redirect to the canonical apex `lashpopstudios.com`.
- Production environment-variable names cover the live database, R2, Vagaro,
  auth, SMS, mail, Mapbox, GTM, and Meta integrations. Values were not exposed.
- Cloudflare Hosted Images is live on production Worker version
  `ed4ddbf7-1fc4-4aad-8b5e-891454978e12`. The merged strict gate records
  4,716/4,716 status, Hosted Images provenance, dimension, and decoded-RGBA
  pixel matches. Fresh AVIF and WebP requests returned
  `x-lp-img-backend: hosted` with no fallback.
- Image rollback version: `6bc0a10d-061f-404e-a5df-e355fa9f3da1` (the last
  pre-cutover legacy deployment). Command syntax was verified with
  `wrangler rollback --help`; do not run it unless rollback is authorized.
- Vagaro Worker version `8091cbee-21e8-4679-a12d-1c03655ba395` deployed at
  2026-08-29 01:05 UTC. Manual sync
  `6f142748-6899-48cf-9cb1-66844b2f829e` completed successfully at 01:06 UTC.
  The live catalog reports Tiny Tattoos (`35729654`) active and booking-ready.
- D1 `PRAGMA quick_check` returned `ok`; `PRAGMA foreign_key_check` returned no
  rows; both audit reads reported zero changes/rows written.
- D1 backup health returned 200. The latest scheduled backup succeeded with
  69 tables and 9,189 rows and remained within its 30-hour health window.

## DNS state and staged parity

- Active public zone: Cloudflare zone `108a0d29a7a5c179a20e8560955eae58`
  on the legacy account, authoritative nameservers
  `coleman.ns.cloudflare.com` and `katelyn.ns.cloudflare.com`.
- The active export contains 26 records. Five records route the web to
  Squarespace. The remaining 21 mail/non-web records have SHA-256 fingerprint
  `91a1e3144445cb1af5003edaecb7cdb43bc7c997cf33d4a975b293d17aadee94`
  after canonical trailing-dot normalization.
- The 21-record set includes MX, SPF, two DKIM selectors, DMARC, MTA-STS,
  TLS reporting, mail/autoconfig A records, all seven mail SRVs, GoDaddy
  payment/domain-connect records, the Squarespace verification CNAME, and the
  historical `cdn` CNAME.
- As a fallback target, all 21 records were also prestaged in Vercel DNS and
  matched one-for-one when queried from `ns1.vercel-dns.com`. Public
  nameservers were not changed.
- The preferred cutover keeps the existing authoritative Cloudflare zone and
  changes only web routing in one Cloudflare batch. This avoids mail-record
  churn, registrar access, registry lock, and nameserver propagation.

## Final switch — plan, apply, and rollback

The guarded command re-reads the active Cloudflare zone, refuses any mixed or
unexpected web state, verifies the exact 21-record non-web fingerprint, reads
Vercel's current rank-1 domain targets, and verifies the `www` 308 before it
will construct the batch. Default mode is plan-only.

```bash
node scripts/cloudflare/lashpop-dns-cutover.mjs
```

After written launch authorization, the single public-DNS switch is:

```bash
node scripts/cloudflare/lashpop-dns-cutover.mjs \
  --apply --confirm lashpopstudios.com
```

Rollback is also plan-first and uses the same non-web parity guard:

```bash
node scripts/cloudflare/lashpop-dns-cutover.mjs --rollback
node scripts/cloudflare/lashpop-dns-cutover.mjs \
  --rollback --apply --confirm lashpopstudios.com
```

The script reads `CLOUDFLARE_API_TOKEN_PERSONAL` from the managed environment.
Never pass or paste the token on the command line. The public cutover command
was not executed during this readiness run.

Immediately after an authorized switch, verify Cloudflare answers, Vercel
certificate issuance, apex HTTPS, `www` 308, the 21-record mail/non-web hash,
incoming/outgoing mail, booking, forms, admin login, Hosted Images, Worker
health, Vercel logs, and the production-domain SEO migration. Roll back the web
batch if TLS, mail, booking, or another critical flow cannot be corrected
promptly.

## External authorization blockers

Technical release and DNS preparation do not satisfy these owner/client gates:

- `docs/launch/website-acceptance-signoff.md` has 72 unchecked decisions and
  approvals, including final GO LIVE authorization, incident-response owner,
  client visual/content/quiz/device acceptance, observation owner/window, and
  rollback authority.
- Clarity Kit still lacks LashPop's legal notice email and postal address; no
  agreements or signatures exist.
- Managed Foundation remains `pending_authorization` at $30/month with no
  payment request or billing instrument.
- `VAGARO_WEBHOOK_SECRET` is not configured and a signed real Vagaro delivery
  has not been accepted after configuration.
- Instagram health returns 503 `configuration_required` because
  `IG_SESSION_ID` is absent and scheduling is disabled. LashPop must either
  refresh/authorize the session or initial the explicit launch exception.
- Custom-domain TLS can only be finally proved after public DNS points to
  Vercel; certificate issuance and production-domain acceptance remain the
  first post-switch gates.

Until those items are completed or explicitly accepted by an authorized owner,
the release remains **NO-GO** even though the technical DNS switch is prepared.
