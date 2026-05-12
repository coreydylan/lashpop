#!/usr/bin/env python3
"""
Fetch full-resolution Instagram posts from @lashpopstudios using instagrapi
(more reliable than instaloader for current Instagram).

Outputs:
  - ./images/<code>_<idx>.jpg
  - ./manifest.json
"""

import argparse
import json
import os
import sys
import time
import urllib.request
from datetime import datetime, timezone

from instagrapi import Client

USERNAME = "lashpopstudios"
HERE = os.path.dirname(os.path.abspath(__file__))
IMG_DIR = os.path.join(HERE, "images")
MANIFEST = os.path.join(HERE, "manifest.json")

BASE_DELAY = 1.5


def download(url: str, filepath: str) -> int:
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
        },
    )
    with urllib.request.urlopen(req, timeout=30) as response:
        data = response.read()
    with open(filepath, "wb") as f:
        f.write(data)
    return len(data)


def best_image_url(media_or_resource) -> str | None:
    """Pick the highest-resolution URL from image_versions2."""
    iv = getattr(media_or_resource, "image_versions2", None)
    if iv and isinstance(iv, dict):
        candidates = iv.get("candidates") or []
        if candidates:
            best = max(candidates, key=lambda c: (c.get("width") or 0) * (c.get("height") or 0))
            return best.get("url")
    # Fallback to thumbnail_url
    tu = getattr(media_or_resource, "thumbnail_url", None)
    return str(tu) if tu else None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=24)
    args = parser.parse_args()

    os.makedirs(IMG_DIR, exist_ok=True)
    cl = Client()
    cl.delay_range = [1, 3]

    print(f"Resolving @{USERNAME}...")
    user_id = cl.user_id_from_username(USERNAME)
    print(f"  user_id={user_id}")

    print(f"Fetching {args.limit} media...")
    medias = cl.user_medias(user_id, amount=args.limit)
    print(f"  got {len(medias)} media items")

    manifest = {
        "profile": {
            "username": USERNAME,
            "user_id": str(user_id),
            "scraped_at": datetime.now(timezone.utc).isoformat(),
        },
        "posts": [],
    }

    for i, m in enumerate(medias, 1):
        code = m.code
        permalink = f"https://www.instagram.com/p/{code}/"
        caption = (m.caption_text or "").strip()
        # m.taken_at can be datetime or str
        taken = m.taken_at
        if hasattr(taken, "isoformat"):
            date_utc = taken.isoformat()
        else:
            date_utc = str(taken)

        # Collect image URLs based on media type
        # 1 = photo, 2 = video (use thumbnail), 8 = carousel
        images = []
        try:
            if m.media_type == 8 and m.resources:
                for idx, r in enumerate(m.resources):
                    if r.media_type == 2:
                        # video in carousel - skip or just thumbnail
                        url = best_image_url(r)
                        if not url:
                            continue
                    else:
                        url = best_image_url(r)
                        if not url:
                            continue
                    images.append({"index": idx, "source_url": url, "alt_text": None})
            else:
                url = best_image_url(m)
                if not url:
                    # Final fallback
                    url = str(m.thumbnail_url) if m.thumbnail_url else None
                if url:
                    images.append({"index": 0, "source_url": url, "alt_text": None})
        except Exception as e:
            print(f"  [{code}] error gathering urls: {e}")
            continue

        if not images:
            print(f"  [{code}] no images, skipping")
            continue

        # Download each
        downloaded_images = []
        for img in images:
            fname = f"{code}_{img['index']}.jpg"
            fpath = os.path.join(IMG_DIR, fname)
            try:
                size = download(img["source_url"], fpath)
                downloaded_images.append(
                    {
                        "index": img["index"],
                        "source_url": img["source_url"],
                        "local_path": fpath,
                        "alt_text": img["alt_text"],
                        "size_bytes": size,
                    }
                )
            except Exception as e:
                print(f"  [{code}#{img['index']}] download fail: {e}")

        if not downloaded_images:
            continue

        manifest["posts"].append(
            {
                "shortcode": code,
                "permalink": permalink,
                "post_type": "Carousel" if m.media_type == 8 else ("Video" if m.media_type == 2 else "Image"),
                "caption": caption,
                "date_utc": date_utc,
                "images": downloaded_images,
            }
        )

        preview = caption[:50].replace("\n", " ")
        total_size = sum(img["size_bytes"] for img in downloaded_images)
        print(
            f"  [{i}/{len(medias)}] {code} ({len(downloaded_images)} img, {total_size//1024}KB) {preview}"
        )

        time.sleep(BASE_DELAY)

    # Filter: keep only images >= MIN_WIDTH px wide (drops video thumbnails)
    MIN_WIDTH = 1000
    from PIL import Image as PILImage

    filtered_posts = []
    removed_imgs = 0
    removed_posts = 0
    for post in manifest["posts"]:
        kept = []
        for img in post["images"]:
            try:
                im = PILImage.open(img["local_path"])
                w, h = im.size
                if w >= MIN_WIDTH:
                    img["width"] = w
                    img["height"] = h
                    kept.append(img)
                else:
                    removed_imgs += 1
                    try:
                        os.remove(img["local_path"])
                    except FileNotFoundError:
                        pass
            except Exception:
                removed_imgs += 1
        if kept:
            post["images"] = kept
            filtered_posts.append(post)
        else:
            removed_posts += 1
    manifest["posts"] = filtered_posts

    with open(MANIFEST, "w") as f:
        json.dump(manifest, f, indent=2)

    total_images = sum(len(p["images"]) for p in manifest["posts"])
    print(f"\nWrote {MANIFEST}")
    print(f"  posts:  {len(manifest['posts'])} (dropped {removed_posts})")
    print(f"  images: {total_images} (dropped {removed_imgs} < {MIN_WIDTH}px)")


if __name__ == "__main__":
    main()
