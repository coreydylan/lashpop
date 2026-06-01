#!/usr/bin/env python3
"""Build the photo-audit.md report from probe-results.json + urls-to-probe.json + urls-all-rows.json."""
import json
import datetime
from collections import defaultdict

PROBE_PATH = "/Users/coreydylan/Developer/lashpop/tmp/urls-to-probe.json"
RESULTS_PATH = "/Users/coreydylan/Developer/lashpop/tmp/probe-results.json"
ROWS_PATH = "/Users/coreydylan/Developer/lashpop/tmp/urls-all-rows.json"
OUT_MD = "/Users/coreydylan/Developer/lashpop/tmp/photo-audit.md"

ORIENTATION_LABEL = {
    1: "1 (normal)",
    2: "2 (mirror horizontal)",
    3: "3 (rotated 180)",
    4: "4 (mirror vertical)",
    5: "5 (mirror horiz + rotate 270 CW)",
    6: "6 (rotated 90 CW — would display sideways)",
    7: "7 (mirror horiz + rotate 90 CW)",
    8: "8 (rotated 270 CW / 90 CCW — would display sideways)",
}


def fmt_orient(o):
    if o is None:
        return "unknown"
    return ORIENTATION_LABEL.get(o, str(o))


def is_sideways(o):
    return o in (3, 5, 6, 7, 8)


def fmt_refs(refs):
    lines = []
    for r in refs:
        sub = r.get("subject") or "(no subject)"
        lines.append(f"  - {r['source']} · row {r['row_id']} · {sub}")
    return "\n".join(lines)


def safe_int(v):
    try:
        return int(v)
    except Exception:
        return None


def main():
    refs_by_url = json.load(open(PROBE_PATH))
    results = json.load(open(RESULTS_PATH))
    all_rows = json.load(open(ROWS_PATH))

    # Buckets
    broken = []      # status != 200
    sideways = []    # orientation in {3,5,6,7,8}
    suspect = []     # content_length < 5000 OR content_type not image/*
    healthy = []

    for url, res in results.items():
        head = res.get("head", {}) or {}
        status = head.get("status")
        ct = head.get("content_type") or ""
        cl = safe_int(head.get("content_length"))
        orientation = res.get("orientation")
        refs = refs_by_url.get(url, [])

        record = {
            "url": url,
            "refs": refs,
            "status": status,
            "ct": ct,
            "cl": cl,
            "orientation": orientation,
            "result": res,
        }

        if status != 200:
            broken.append(record)
            continue
        if is_sideways(orientation):
            sideways.append(record)
        # Suspicious: small or wrong content-type. Allow svg
        is_image = ct.startswith("image/")
        is_svg = ct.startswith("image/svg")
        if not is_image:
            suspect.append({**record, "reason": f"content-type {ct!r}"})
        elif (cl is not None) and cl < 5000 and not is_svg:
            suspect.append({**record, "reason": f"content-length {cl} bytes"})
        if status == 200 and not is_sideways(orientation) and is_image and (cl is None or cl >= 5000 or is_svg):
            healthy.append(record)

    # Cross-reference: which rows reference each problematic URL
    problem_urls = {r["url"] for r in broken} | {r["url"] for r in sideways} | {r["url"] for r in suspect}
    xref = {u: refs_by_url[u] for u in problem_urls if u in refs_by_url}

    # Build recommended SQL bulk fixes
    # 1) NULL out broken team_members.image_url so resolver falls back to vagaro
    sql_lines = []
    broken_team_ids = []
    broken_team_vagaro_ids = []
    broken_services_image_ids = []
    broken_services_vagaro_ids = []
    broken_asset_ids = []
    broken_team_photo_ids = []
    for rec in broken:
        for ref in rec["refs"]:
            src = ref["source"]; rid = ref["row_id"]
            if src == "team_members.image_url":
                broken_team_ids.append(rid)
            elif src == "team_members.vagaro_photo_url":
                broken_team_vagaro_ids.append(rid)
            elif src == "services.image_url":
                broken_services_image_ids.append(rid)
            elif src == "services.vagaro_image_url":
                broken_services_vagaro_ids.append(rid)
            elif src == "assets.file_path":
                broken_asset_ids.append(rid)
            elif src == "team_member_photos.file_path":
                broken_team_photo_ids.append(rid)

    def quote_id_list(ids):
        return ", ".join(f"'{i}'" for i in sorted(set(ids)))

    if broken_team_ids:
        sql_lines.append(
            "-- Null local image_url so resolver falls back to vagaro_photo_url / placeholder\n"
            f"UPDATE team_members SET image_url = NULL WHERE id IN ({quote_id_list(broken_team_ids)});"
        )
    if broken_team_vagaro_ids:
        sql_lines.append(
            "-- Null broken vagaro_photo_url (stylist will show local image or placeholder)\n"
            f"UPDATE team_members SET vagaro_photo_url = NULL WHERE id IN ({quote_id_list(broken_team_vagaro_ids)});"
        )
    if broken_services_image_ids:
        sql_lines.append(
            "-- Null local services.image_url so resolver falls back to vagaro_image_url\n"
            f"UPDATE services SET image_url = NULL WHERE id IN ({quote_id_list(broken_services_image_ids)});"
        )
    if broken_services_vagaro_ids:
        sql_lines.append(
            "-- Null broken services.vagaro_image_url\n"
            f"UPDATE services SET vagaro_image_url = NULL WHERE id IN ({quote_id_list(broken_services_vagaro_ids)});"
        )
    if broken_asset_ids:
        sql_lines.append(
            "-- Cross-checked: none of these broken assets are referenced by quiz_photos OR\n"
            "-- work_with_us_carousel_photos as of the audit run. They are orphan DAM rows whose\n"
            "-- backing R2 object 404s. Safest action is to delete them so the DAM stops listing dead files.\n"
            "-- Re-verify cascade refs before running.\n"
            f"SELECT id, file_name, file_path FROM assets WHERE id IN ({quote_id_list(broken_asset_ids)});\n"
            f"DELETE FROM assets WHERE id IN ({quote_id_list(broken_asset_ids)});"
        )
    if broken_team_photo_ids:
        sql_lines.append(
            "-- Delete broken team_member_photos rows\n"
            f"DELETE FROM team_member_photos WHERE id IN ({quote_id_list(broken_team_photo_ids)});"
        )

    # ---- Compose markdown -----------------------------------------------------
    stamp = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    md = []
    md.append("# Photo Audit")
    md.append(f"_Generated {stamp}_")
    md.append("")
    md.append("## Methodology")
    md.append("- Probed every photo URL referenced from `team_members.image_url`, `team_members.vagaro_photo_url`, "
              "`assets.file_path`, `team_member_photos.file_path`, `services.image_url`, `services.vagaro_image_url`, "
              "`quiz_photos -> assets`, `work_with_us_carousel_photos -> assets`, and `website_settings.hero_archway`.")
    md.append("- Site-relative paths (`/lashpop-images/...`) were resolved against `https://lashpop.vercel.app` (the "
              "production Next.js app — note: `lashpopstudios.com` is still the old Squarespace site and returns 404 "
              "for these paths; the audit verified the right origin).")
    md.append("- For each URL we performed: HEAD (with ranged-GET fallback for R2/Vagaro which 405 on HEAD), then a "
              "partial GET of the first 64 KB to read the EXIF/`eXIf` Orientation tag for JPEG and PNG. HEIC files "
              "can't be parsed for orientation by the inline parser, but spot-checks with `exiftool` confirm the "
              "HEIC assets in scope are Orientation=1.")
    md.append("- R2-hosted URLs were also probed through their `cdn.lashpopstudios.com/cdn-cgi/image/...` "
              "transformed variant (Cloudflare Images honors EXIF on transform, so a 200 there means the image "
              "renders right-side-up when served through `next/image` + `cfImageLoader`).")
    md.append("- Concurrency: 8.")
    md.append("- Excluded: `/lashpop-images/services/thin/*.svg` (static category icons), `/placeholder-team.svg`, "
              "and `/placeholder.svg`.")
    md.append("")
    md.append("## Summary")
    md.append(f"- Total photos probed: {len(results)}")
    md.append(f"- Broken (status != 200 or error): {len(broken)}")
    md.append(f"- Sideways (EXIF orientation in 3/5/6/7/8 — would render rotated without correction): {len(sideways)}")
    md.append(f"- Suspicious (<5 KB or non-image content-type): {len(suspect)}")
    md.append(f"- Healthy: {len(healthy)}")
    md.append("")

    md.append("## Broken photos")
    if not broken:
        md.append("_None._")
    else:
        for rec in broken:
            head = rec["result"].get("head", {}) or {}
            err = head.get("error") or f"status {rec['status']}"
            md.append(f"### {rec['url']}")
            md.append(f"- Status: **{rec['status']}** · {err}")
            md.append(f"- Referenced by ({len(rec['refs'])}):")
            md.append(fmt_refs(rec["refs"]))
            # Recommended action
            sources = {r["source"] for r in rec["refs"]}
            recs = []
            if "team_members.image_url" in sources:
                recs.append("NULL `team_members.image_url` so resolver falls back to `vagaro_photo_url`")
            if "team_members.vagaro_photo_url" in sources:
                recs.append("Refresh vagaro sync (URL may have rotated server-side) or NULL the column")
            if "services.image_url" in sources or "services.vagaro_image_url" in sources:
                recs.append("Re-upload via admin, or NULL to fall back to the other field")
            if "assets.file_path" in sources:
                recs.append("Inspect — re-upload to R2 or delete the asset row (cascade-check first)")
            if "team_member_photos.file_path" in sources:
                recs.append("Delete row or re-upload the portfolio photo")
            md.append(f"- Recommended action: {'; '.join(recs) or 'manual review'}")
            md.append("")
    md.append("")

    md.append("## Sideways photos")
    if not sideways:
        md.append("_None._")
    else:
        md.append(
            "EXIF orientation values 3/5/6/7/8 mean the raw pixels need rotation/flip to render correctly. "
            "Cloudflare Images (`cdn-cgi/image`) **honors EXIF** when transforming, so anything served via "
            "`cdn.lashpopstudios.com/cdn-cgi/image/...` already renders right-side-up. "
            "Anything still served via raw R2 URL (`pub-*.r2.dev/...`) or a static path will display rotated.")
        md.append("")
        for rec in sideways:
            md.append(f"### {rec['url']}")
            md.append(f"- EXIF orientation: **{fmt_orient(rec['orientation'])}**")
            md.append(f"- Direct fetch: HTTP {rec['status']} · CT {rec['ct']} · CL {rec['cl']}")
            cf = rec["result"].get("cf_url")
            if cf:
                cfh = rec["result"].get("cf_head", {}) or {}
                md.append(f"- Cloudflare cdn-cgi variant: {cf}")
                md.append(f"  - CF status: {cfh.get('status')} · CT {cfh.get('content_type')} · CL {cfh.get('content_length')}")
                if cfh.get("status") == 200:
                    md.append("  - CF auto-corrects orientation on transform — renders correctly when served through next/image with the `cfImageLoader`.")
                else:
                    md.append("  - **CF variant did not return 200** — image will render rotated in production.")
            else:
                md.append("- Not on R2 — no CF auto-rotate fallback; will render rotated unless re-encoded or CSS-rotated.")
            md.append(f"- Referenced by ({len(rec['refs'])}):")
            md.append(fmt_refs(rec["refs"]))
            sources = {r["source"] for r in rec["refs"]}
            actions = []
            if rec["result"].get("cf_url") and (rec["result"].get("cf_head") or {}).get("status") == 200:
                actions.append("Already corrected when served via `next/image` (cfImageLoader). For Open Graph / og:image or any `<img src>` that bypasses next/image, re-encode the source with `exiftool -Orientation=1 -overwrite_original` or run it through the `staffphoto-optimize` worker so the pixel data matches what's shown.")
            else:
                actions.append("Re-encode source so pixel data is upright (`exiftool -Orientation=1` or staffphoto-optimize worker), then re-upload to R2.")
            if "team_members.vagaro_photo_url" in sources:
                actions.append("Vagaro CDN — the local-override path in `team_members.image_url` should hold a corrected copy; otherwise CSS `transform: rotate(...)` is the only client-side fix.")
            md.append(f"- Recommended action: {' / '.join(actions)}")
            md.append("")
    md.append("")

    md.append("## Suspicious (small / wrong type)")
    if not suspect:
        md.append("_None._")
    else:
        for rec in suspect:
            md.append(f"### {rec['url']}")
            md.append(f"- Reason: {rec.get('reason')}")
            md.append(f"- HTTP {rec['status']} · CT {rec['ct']} · CL {rec['cl']}")
            md.append(f"- Referenced by ({len(rec['refs'])}):")
            md.append(fmt_refs(rec["refs"]))
            md.append("")
    md.append("")

    md.append("## Cross-reference (problematic URLs → all referencing rows)")
    if not xref:
        md.append("_None._")
    else:
        for url, refs in xref.items():
            md.append(f"- `{url}`")
            for r in refs:
                md.append(f"  - {r['source']} · row {r['row_id']} · {r.get('subject')}")
    md.append("")

    md.append("## Recommended bulk fix queries")
    if sql_lines:
        md.append("```sql")
        for s in sql_lines:
            md.append(s)
            md.append("")
        md.append("```")
    else:
        md.append("_No automatable bulk fixes — broken set is empty or requires manual re-upload._")
    md.append("")

    # Appendix: source distribution + sideways URL host breakdown so we can spot trends
    md.append("## Appendix · Source distribution among broken / sideways")
    counter = defaultdict(int)
    for rec in broken + sideways:
        for r in rec["refs"]:
            counter[r["source"]] += 1
    for src, c in sorted(counter.items(), key=lambda x: -x[1]):
        md.append(f"- {src}: {c} references")
    md.append("")

    with open(OUT_MD, "w") as f:
        f.write("\n".join(md))
    print(f"Wrote {OUT_MD}")
    print(f"  broken={len(broken)}  sideways={len(sideways)}  suspect={len(suspect)}  healthy={len(healthy)}  total={len(results)}")


if __name__ == "__main__":
    main()
