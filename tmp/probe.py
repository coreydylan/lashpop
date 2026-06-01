#!/usr/bin/env python3
"""Probe every photo URL: HEAD, partial GET for EXIF orientation, and CF transformed variant for R2 URLs."""
import json
import re
import sys
import time
import struct
import urllib.request
import urllib.error
import urllib.parse
import socket
from concurrent.futures import ThreadPoolExecutor, as_completed

SITE_BASE = "https://lashpop.vercel.app"  # production Next.js app (lashpopstudios.com is the old Squarespace site)
CDN_BASE = "https://cdn.lashpopstudios.com"
R2_HOST = "pub-f98565faaf544aa98c908360653eb5db.r2.dev"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 LashpopPhotoAudit/1.0"

PROBE_PATH = "/Users/coreydylan/Developer/lashpop/tmp/urls-to-probe.json"
OUT_PATH = "/Users/coreydylan/Developer/lashpop/tmp/probe-results.json"


def absolutise(u: str) -> str:
    if u.startswith("//"):
        return "https:" + u
    if u.startswith("/"):
        return SITE_BASE + u
    return u


def cf_variant(u: str) -> str | None:
    """Return the cdn.lashpopstudios.com cdn-cgi/image variant for R2-hosted URLs."""
    m = re.match(r"^https?://pub-[a-f0-9]+\.r2\.dev/(.+)$", u)
    if m:
        opts = "width=800,quality=80,format=auto,fit=scale-down"
        return f"{CDN_BASE}/cdn-cgi/image/{opts}/{m.group(1)}"
    return None


def http_request(url: str, method: str, headers=None, timeout=15):
    req = urllib.request.Request(url, method=method, headers=headers or {})
    req.add_header("User-Agent", UA)
    return urllib.request.urlopen(req, timeout=timeout)


def head(url: str) -> dict:
    try:
        resp = http_request(url, "HEAD")
        return {
            "status": resp.status,
            "content_type": resp.headers.get("Content-Type"),
            "content_length": resp.headers.get("Content-Length"),
            "error": None,
        }
    except urllib.error.HTTPError as e:
        # HEAD often returns 405 on R2 buckets - try a ranged GET
        if e.code in (403, 405):
            return _ranged_head_fallback(url)
        return {"status": e.code, "content_type": None, "content_length": None, "error": f"HTTPError {e.code}"}
    except (urllib.error.URLError, socket.timeout, ConnectionError) as e:
        return {"status": None, "content_type": None, "content_length": None, "error": f"{type(e).__name__}: {e}"}


def _ranged_head_fallback(url: str) -> dict:
    try:
        resp = http_request(url, "GET", headers={"Range": "bytes=0-0"}, timeout=15)
        cr = resp.headers.get("Content-Range")  # bytes 0-0/12345
        total = None
        if cr:
            m = re.search(r"/(\d+)$", cr)
            if m: total = m.group(1)
        return {
            "status": 200 if resp.status in (200, 206) else resp.status,
            "content_type": resp.headers.get("Content-Type"),
            "content_length": total or resp.headers.get("Content-Length"),
            "error": None,
            "head_via": "ranged-get",
        }
    except urllib.error.HTTPError as e:
        return {"status": e.code, "content_type": None, "content_length": None, "error": f"HTTPError {e.code}"}
    except Exception as e:
        return {"status": None, "content_type": None, "content_length": None, "error": f"{type(e).__name__}: {e}"}


def fetch_first_bytes(url: str, n: int = 65536) -> bytes | None:
    try:
        resp = http_request(url, "GET", headers={"Range": f"bytes=0-{n-1}"}, timeout=25)
        return resp.read(n)
    except urllib.error.HTTPError as e:
        if e.code in (416,):  # range not satisfiable - tiny file, just GET it all
            try:
                resp = http_request(url, "GET", timeout=25)
                return resp.read()
            except Exception:
                return None
        return None
    except Exception:
        return None


# --- EXIF orientation parsing -------------------------------------------------
def jpeg_exif_orientation(data: bytes) -> int | None:
    if not data or data[:2] != b"\xff\xd8":
        return None
    i = 2
    while i < len(data) - 4:
        if data[i] != 0xFF:
            return None
        marker = data[i+1]
        if marker == 0xDA or marker == 0xD9:  # SOS or EOI
            return None
        seg_len = struct.unpack(">H", data[i+2:i+4])[0]
        if marker == 0xE1 and data[i+4:i+10] == b"Exif\x00\x00":
            tiff_start = i + 10
            return _parse_tiff_orientation(data, tiff_start)
        i += 2 + seg_len
    return None


def _parse_tiff_orientation(data: bytes, tiff_start: int) -> int | None:
    if len(data) < tiff_start + 8:
        return None
    bo = data[tiff_start:tiff_start+2]
    if bo == b"II":
        fmt = "<"
    elif bo == b"MM":
        fmt = ">"
    else:
        return None
    magic = struct.unpack(fmt + "H", data[tiff_start+2:tiff_start+4])[0]
    if magic != 42:
        return None
    ifd0 = struct.unpack(fmt + "I", data[tiff_start+4:tiff_start+8])[0]
    p = tiff_start + ifd0
    if p + 2 > len(data):
        return None
    n_entries = struct.unpack(fmt + "H", data[p:p+2])[0]
    p += 2
    for _ in range(n_entries):
        if p + 12 > len(data):
            return None
        tag = struct.unpack(fmt + "H", data[p:p+2])[0]
        if tag == 0x0112:
            # type=3 (short), count=1, value packed in next 4 bytes (low 2)
            val = struct.unpack(fmt + "H", data[p+8:p+10])[0]
            return val
        p += 12
    return None


def png_orientation(data: bytes) -> int | None:
    # PNG has no EXIF in the strictest sense, but eXIf chunk exists in newer files.
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        return None
    p = 8
    while p + 8 < len(data):
        length = struct.unpack(">I", data[p:p+4])[0]
        ctype = data[p+4:p+8]
        if ctype == b"eXIf":
            chunk = data[p+8:p+8+length]
            return _parse_tiff_orientation(chunk, 0)
        p += 8 + length + 4
        if length > 10_000_000:  # corrupt
            return None
    return None


def get_orientation(data: bytes) -> int | None:
    if not data: return None
    if data[:2] == b"\xff\xd8":
        return jpeg_exif_orientation(data)
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return png_orientation(data)
    return None


# --- Probe one URL ------------------------------------------------------------
def probe_one(url: str) -> dict:
    out = {"url": url}
    fetch_url = absolutise(url)
    out["fetch_url"] = fetch_url
    out["head"] = head(fetch_url)
    orientation = None
    if out["head"]["status"] == 200 and out["head"].get("content_type", "").startswith("image"):
        body = fetch_first_bytes(fetch_url)
        if body:
            orientation = get_orientation(body)
            out["bytes_sampled"] = len(body)
        else:
            out["bytes_sampled"] = 0
    out["orientation"] = orientation
    # CF variant
    cf_url = cf_variant(url)
    if cf_url:
        out["cf_url"] = cf_url
        out["cf_head"] = head(cf_url)
    return out


def main():
    with open(PROBE_PATH) as f:
        url_map = json.load(f)
    urls = list(url_map.keys())
    print(f"Probing {len(urls)} unique URLs (concurrency=8)", flush=True)
    results = {}
    started = time.time()
    with ThreadPoolExecutor(max_workers=8) as ex:
        futures = {ex.submit(probe_one, u): u for u in urls}
        done = 0
        for fut in as_completed(futures):
            u = futures[fut]
            try:
                results[u] = fut.result()
            except Exception as e:
                results[u] = {"url": u, "error": f"probe-exception: {type(e).__name__}: {e}"}
            done += 1
            if done % 50 == 0 or done == len(urls):
                elapsed = time.time() - started
                print(f"  {done}/{len(urls)} done ({elapsed:.1f}s)", flush=True)
    with open(OUT_PATH, "w") as f:
        json.dump(results, f)
    print(f"Wrote {OUT_PATH}")


if __name__ == "__main__":
    main()
