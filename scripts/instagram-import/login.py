#!/usr/bin/env python3
"""
One-time login to instagrapi. Prompts for username + password + 2FA code,
then dumps session settings to ./session.json.

Use --account=USERNAME if running again non-interactively (will reuse env vars).

Recommended: use your PERSONAL Instagram account, not the LashPop business one.

  .venv-scrape/bin/python scripts/instagram-import/login.py
"""

import getpass
import json
import os
import sys

from instagrapi import Client

HERE = os.path.dirname(os.path.abspath(__file__))
SESSION_FILE = os.path.join(HERE, "session.json")


def main():
    username = input("Instagram username (personal, not @lashpopstudios): ").strip()
    if not username:
        print("Username required.", file=sys.stderr)
        sys.exit(1)

    password = getpass.getpass(f"Password for @{username}: ")
    if not password:
        print("Password required.", file=sys.stderr)
        sys.exit(1)

    verification_code = input("2FA code (leave blank if not enabled): ").strip() or None

    cl = Client()
    cl.delay_range = [1, 3]
    print("Logging in...")
    ok = cl.login(username, password, verification_code=verification_code)
    if not ok:
        print("Login failed", file=sys.stderr)
        sys.exit(1)

    # Sanity check by hitting a profile
    print("Testing session by fetching @lashpopstudios user id...")
    user_id = cl.user_id_from_username("lashpopstudios")
    print(f"  ok, user_id={user_id}")

    cl.dump_settings(SESSION_FILE)
    print(f"\nWrote {SESSION_FILE}")
    print("\nNext step: store as a GitHub Secret named IG_SESSION_JSON")
    print(f"  gh secret set IG_SESSION_JSON -R coreydylan/lashpop < {SESSION_FILE}")


if __name__ == "__main__":
    main()
