# LashPop launch readiness — 2026-07-17

## Release status

The Vercel/Cloudflare release candidate is deployed and technically ready for
client acceptance at `https://lashpop.vercel.app`.

- Vercel production deployment: `dpl_5aocoszYQqTv6qLFCmsqUFGdz1gp`
- Cloudflare account: `corey@experialstudio.com`
- D1 database: `lashpop-production`
- Public DNS has **not** been changed. `lashpopstudios.com` still resolves to
  Squarespace until the coordinated cutover.

## Verified launch work

### Existing-site and SEO parity

- Sitemap validation passed for 105 unique canonical URLs; every URL returned
  200 and a matching self-canonical.
- Twenty representative Squarespace/staging URLs return a one-hop permanent
  redirect. The complete redirect inventory includes all URLs found in the old
  site crawl and the former staging sitemap.
- `/services` is a real index, category/service pages are directly addressable,
  and the bad nested staging paths permanently redirect to canonical pages.
- `robots.txt`, canonical URLs, Open Graph URLs, local-business data, and launch
  security headers passed the automated migration validator.
- The address and phone are consistent with the current Vagaro listing:
  `429 S Coast Hwy, Oceanside, CA 92054`, `(760) 212-0448`.
- Fine Line Tattoos is live in the requested service order and on Evie and
  Kelly Richter's service profiles. Vagaro remains the source of truth for
  service/team sync; financial, intake-form, customer, and appointment data are
  deliberately not mirrored.

See `docs/seo-migration-inventory-2026-07-17.md` and run:

```sh
npm run validate:seo-migration -- https://lashpop.vercel.app
```

### Performance and accessibility

- Production-build Lighthouse on mobile throttling: performance 90,
  accessibility 100, LCP 2.0 s, CLS 0.
- Desktop: performance 100, accessibility 100, LCP 0.8 s, CLS 0.
- The hero now paints immediately and large gallery/lightbox images are no
  longer eagerly prefetched. Loading, focus, reduced-motion, contrast, names,
  and touch-target behavior were improved.

### Admin and public-surface hardening

- Admin/DAM APIs and scrollytelling compositions reject unauthenticated access.
- Unsigned Vagaro webhooks return 401. The endpoint currently uses Vagaro's
  published delivery-IP allowlist; set `VAGARO_WEBHOOK_SECRET` to switch to
  signature-token verification.
- OTP is limited to existing admin accounts and durably throttled by hashed
  IP/phone keys in D1. Newsletter and careers writes have hashed IP/identity
  limits as well.
- Unfinished public customer login, friend booking, SEO utility, and standalone
  staff-photo utility routes are retired/redirected. The public photo Worker is
  disabled and returns 404 for uploads.
- FAQ HTML is sanitized with a strict allowlist. All JSON-LD uses a script-safe
  serializer, including externally sourced review text.
- Local secret files are ignored by Git and restricted to mode 0600.
- GTM `GTM-KDJ34BG` and Meta Pixel `314609749250536` are present in the
  production client bundle.
- Dependency audit has zero high/critical findings and six moderate nested
  build-tool findings. The suggested forced fixes are breaking downgrades and
  must not be applied.

### Cloudflare backup and privacy state

- Backups are private in `lashpop-d1-backups`; all 188 copies formerly in the
  public DAM bucket were removed after private preservation/checksum proof.
- The image Worker blocks backup/private prefixes and non-image objects. Former
  public backup URLs return 404 with private/no-store behavior.
- All compromised web/punchlist sessions were revoked.
- Redundant Vagaro mirrors were purged. `appointments`, `vagaro_customers`,
  `form_responses`, `transactions`, `session`, and `punchlist_sessions` are all
  zero rows, and future corresponding webhook events are acknowledged without
  storage.
- Definitive private backup:
  `backups/lashpop-d1/2026/07/17/2026-07-17T20-54-59.406Z/manifest.json`
  (69 tables, 8,558 rows, 58 schema objects).
- Checksums, byte counts, row counts, SQLite `quick_check`, schema recreation,
  and restore-time session scrubbing all passed. Backup health is 200 and the
  daily 02:00 Pacific cron is attached.

See `docs/ops/cloudflare-backup-recovery.md`.

## Required approvals or credentials before DNS cutover

1. **Incident-response decision.** A database backup containing client/contact,
   appointment, form-response, transaction, and session data was publicly
   reachable before this audit. Technical containment is complete, but 404s do
   not prove it was never retrieved. Document the exposure window/access
   evidence and obtain client/legal direction on notification before handoff.
2. **Authenticated admin acceptance.** Sessions were intentionally revoked.
   An authorized admin must sign in and smoke-test panel switching, owner/
   publisher/viewer permissions, a content edit, DAM upload, newsletter list,
   and logout.
3. **GoDaddy nameserver access/approval.** The current authoritative zone is the
   old Squarespace Cloudflare zone. The new Corey-account zone is pending and
   assigned `fatima.ns.cloudflare.com` and `nicolas.ns.cloudflare.com`.
4. **Vagaro verification token.** Add the portal's webhook verification token as
   `VAGARO_WEBHOOK_SECRET`, then confirm a real Vagaro delivery succeeds.
5. **Instagram session.** `IG_SESSION_ID` is the only missing Instagram Worker
   secret. Its cron is intentionally disabled until login refresh and a health/
   sync test pass. See `docs/ops/instagram-sync.md`.
6. **Search/analytics/legal access.** Obtain Google Search Console history and
   verification, submit the new sitemap after cutover, and confirm the desired
   consent/GPC behavior for GTM and Meta Pixel.

## Coordinated cutover checklist

1. Complete the approvals and authenticated smoke test above.
2. Confirm the pending Cloudflare zone still contains apex/www records for
   Vercel and exact parity for MX, SPF, DKIM, DMARC, MTA-STS, TLS reporting,
   autoconfig, mail host, and SRV records.
3. Lower relevant DNS TTLs if the authoritative provider permits it.
4. In GoDaddy, replace the old nameservers with only
   `fatima.ns.cloudflare.com` and `nicolas.ns.cloudflare.com`.
5. Monitor authoritative DNS propagation, Vercel certificate issuance, apex and
   www redirects, mail delivery, booking, forms, admin login, Worker health,
   and error logs.
6. Re-run the SEO migration validator against `https://lashpopstudios.com`,
   submit `/sitemap.xml` in Search Console, and request indexing for the home,
   services, Fine Line Tattoos, privacy, and terms pages.
7. Keep the Squarespace configuration available through the observation window.
   If a critical issue appears, restore the prior nameservers; do not alter mail
   records independently during rollback.

## Post-launch hardening backlog

- Replace the Instagram session-cookie integration with official Meta OAuth.
- Add a tested CSP after inventorying Vagaro, GTM, Meta, Mapbox, R2, and image
  origins.
- Hash session tokens at rest and add automatic cleanup for expired rate-limit
  keys.
- Resolve the six moderate dependency advisories when non-breaking upstream
  releases are available.
- Review all historical private archives under the incident/retention decision,
  then delete them on the approved schedule.
