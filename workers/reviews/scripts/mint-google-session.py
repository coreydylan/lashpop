#!/usr/bin/env python3
"""
Mint a fresh Google Maps reviews session for the lashpop-reviews Worker.

Why this script exists:
  Google Maps' /maps/preview/place endpoint embeds the 8 most recent reviews
  inline, but only when called from a request that looks like a real browser.
  A static curl gets a 35KB stub with no reviews; a real Chrome gets the rich
  102KB version. The discriminator is the session token embedded in the URL's
  pb= param plus the NID cookie set during the live JS session.

What this script does:
  1. Opens LashPop's place page in Playwright (real Chromium, headed).
  2. Waits for Google's own JS to fire /maps/preview/place.
  3. Captures the URL (with the session token already baked in) + all cookies.
  4. Updates two Worker secrets via `wrangler secret put`:
       - GOOGLE_PREVIEW_URL   — the captured URL
       - GOOGLE_COOKIES       — the cookie header to replay with

Run from the Mac:
  cd workers/reviews
  python3 scripts/mint-google-session.py

Tokens last days-to-weeks. If the Worker logs report a stripped <50KB response
for /maps/preview/place, re-run this script.

Persistent Chrome profile is at /tmp/google-mint-profile so cookies build up
across runs; Google's anti-bot looks more friendly to a "returning user."
"""
import asyncio
import os
import shutil
import subprocess
import sys
from pathlib import Path

try:
    from playwright.async_api import async_playwright
except ImportError:
    sys.exit("Playwright not installed. Try: pip3 install playwright && python3 -m playwright install chromium")

# LashPop's Google Maps place identifier
FID = os.environ.get("GOOGLE_PLACE_FID", "0x80dc73710da0172f:0x49e879bec593fc5e")
NAME = os.environ.get("GOOGLE_PLACE_NAME", "LashPop Studios")

PROFILE = Path(os.environ.get("GOOGLE_MINT_PROFILE", "/tmp/pgcheck/chrome-profile"))
PROFILE.mkdir(parents=True, exist_ok=True)
# Clear stale singleton locks from a previous run
for stale in PROFILE.glob("Singleton*"):
    stale.unlink(missing_ok=True)

WORKER_DIR = Path(__file__).resolve().parent.parent
NAVIGATION_TIMEOUT_MS = 30_000
RICH_RESPONSE_THRESHOLD = 50_000  # bytes — below this the reviews block is missing


async def mint() -> tuple[str, str]:
    """Drive a real Chromium to harvest the URL + cookies."""
    async with async_playwright() as p:
        ctx = await p.chromium.launch_persistent_context(
            str(PROFILE),
            headless=False,
            viewport={"width": 1400, "height": 900},
            args=["--disable-blink-features=AutomationControlled"],
        )
        page = ctx.pages[0] if ctx.pages else await ctx.new_page()

        captured_url: str | None = None
        best_len = 0

        async def on_response(resp):
            nonlocal captured_url, best_len
            if "/maps/preview/place" not in resp.url:
                return
            try:
                text = await resp.text()
            except Exception:
                return
            if len(text) > best_len:
                best_len = len(text)
                if len(text) >= RICH_RESPONSE_THRESHOLD:
                    captured_url = resp.url

        page.on("response", lambda r: asyncio.create_task(on_response(r)))

        url = f"https://maps.google.com/maps?q={NAME.replace(' ', '+')}&ftid={FID}&hl=en"
        print(f"navigating to {url}")
        await page.goto(url, wait_until="domcontentloaded", timeout=NAVIGATION_TIMEOUT_MS)

        for i in range(30):
            if captured_url:
                break
            await page.wait_for_timeout(500)

        if not captured_url:
            await ctx.close()
            raise SystemExit(
                f"never saw a rich preview/place response. Largest seen: {best_len}B. "
                f"Google may have served a degraded view — try again."
            )

        cookies = await ctx.cookies("https://www.google.com")
        cookie_header = "; ".join(f"{c['name']}={c['value']}" for c in cookies)

        await ctx.close()
        return captured_url, cookie_header


def set_secret(name: str, value: str) -> None:
    """Pipe value into `wrangler secret put NAME` from the worker directory."""
    print(f"  setting {name} ({len(value)} chars)…")
    result = subprocess.run(
        ["npx", "wrangler", "secret", "put", name],
        input=value,
        text=True,
        capture_output=True,
        cwd=WORKER_DIR,
    )
    if result.returncode != 0:
        sys.exit(f"wrangler secret put {name} failed:\n{result.stderr}")
    # Show the final line of wrangler's output (the ✨ success line)
    for line in reversed(result.stdout.splitlines()):
        if line.strip():
            print(f"    {line}")
            break


def main() -> None:
    if not shutil.which("npx"):
        sys.exit("npx not found on PATH — install Node.js")

    print("=== minting Google session ===")
    url, cookies = asyncio.run(mint())
    print(f"\n  URL ({len(url)} chars)")
    print(f"  cookies ({len(cookies)} chars)")

    print("\n=== updating Worker secrets ===")
    set_secret("GOOGLE_PREVIEW_URL", url)
    set_secret("GOOGLE_COOKIES", cookies)

    print("\nDone. Trigger the Worker to confirm:")
    print(
        '  curl -H "Authorization: Bearer $TRIGGER" '
        'https://lashpop-reviews.<…>.workers.dev/run | jq .sources.google'
    )


if __name__ == "__main__":
    main()
