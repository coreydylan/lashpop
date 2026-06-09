#!/usr/bin/env python3
"""
iMessage attachment harvester (for the R2-suspension image recovery).

Watches the Messages chat.db for the specific attachments that map to dead DAM
assets and, the instant each one downloads from iCloud (transfer_state -> 5 and
the file lands in ~/Library/Messages/Attachments), copies it into
  s3-recovery/imessage-originals/
so nothing is lost if Messages re-offloads it later.

Read-only on chat.db (opened immutable). Safe to run alongside Messages.app
while you scroll the conversation (or run scripts/imessage-autoscroll.applescript).

Usage:
  python3 scripts/imessage-harvest.py            # watch until all targets captured (Ctrl-C to stop)
  python3 scripts/imessage-harvest.py --once     # single pass, then exit
"""
import sqlite3, os, re, shutil, sys, time

HOME = os.path.expanduser("~")
DB = os.path.join(HOME, "Library/Messages/chat.db")
OUT = os.path.join(os.getcwd(), "s3-recovery/imessage-originals")
CHATS = [41, 71, 2174, 8207, 10907, 12247]   # every chat Emily (+17602244206) is in
ONCE = "--once" in sys.argv

# The set of source-image "stems" we still need (written by the recovery dig).
STEM_FILE = "/tmp/missing_stems.txt"

def stem(n):
    n = os.path.basename(n or "").rsplit(".", 1)[0]
    n = re.sub(r"(_VSCO|_copy|copy\d*| copy| ?\(\d+\)|__\d+_)$", "", n, flags=re.I)
    return n.strip().lower()

def load_targets():
    if os.path.exists(STEM_FILE):
        return set(l for l in open(STEM_FILE).read().splitlines() if l)
    return None  # None => harvest ALL images in these chats

def connect():
    return sqlite3.connect(f"file:{DB}?mode=ro&immutable=1", uri=True)

def scan(targets):
    """Return list of (rowid, src_path, transfer_name, downloaded?) for image attachments in scope."""
    con = connect(); c = con.cursor()
    q = f"""
    SELECT DISTINCT a.ROWID, a.filename, a.transfer_name, a.transfer_state, a.mime_type
    FROM attachment a
    JOIN message_attachment_join maj ON maj.attachment_id=a.ROWID
    JOIN chat_message_join cmj ON cmj.message_id=maj.message_id
    WHERE cmj.chat_id IN ({','.join('?'*len(CHATS))})
    """
    out = []
    for rid, fn, tn, ts, mime in c.execute(q, CHATS):
        name = tn or (os.path.basename(fn) if fn else "")
        is_img = (mime or "").startswith("image") or name.lower().endswith(
            (".jpg", ".jpeg", ".png", ".heic", ".webp", ".gif"))
        if not is_img:
            continue
        if targets is not None and stem(name) not in targets:
            continue
        p = os.path.expanduser(fn) if fn else None
        out.append((rid, p, name, bool(p and os.path.exists(p))))
    con.close()
    return out

def main():
    os.makedirs(OUT, exist_ok=True)
    targets = load_targets()
    total = len(scan(targets))
    print(f"Harvesting into {OUT}")
    print(f"Watching {total} target image attachments across chats {CHATS}")
    if targets is None:
        print("  (no stem list found -> capturing ALL images in these chats)")
    grabbed = {f for f in os.listdir(OUT)} if os.path.isdir(OUT) else set()
    captured = 0
    try:
        while True:
            rows = scan(targets)
            ready = [(rid, p, name) for rid, p, name, ok in rows if ok]
            pending = sum(1 for *_, ok in rows if not ok)
            for rid, p, name in ready:
                dst = os.path.join(OUT, name)
                base, ext = os.path.splitext(name)
                i = 1
                while os.path.exists(dst) and os.path.getsize(dst) != os.path.getsize(p):
                    dst = os.path.join(OUT, f"{base}~{i}{ext}"); i += 1
                if os.path.basename(dst) in grabbed and os.path.exists(dst):
                    continue
                try:
                    shutil.copy2(p, dst)
                    grabbed.add(os.path.basename(dst)); captured += 1
                    print(f"  [+] {name}  ({os.path.getsize(p)//1024} KB)   downloaded:{len(ready)}  pending:{pending}")
                except Exception as e:
                    print(f"  [!] failed {name}: {e}")
            done = len(ready)
            sys.stdout.write(f"\r  progress: {done}/{len(rows)} downloaded, {pending} still offloaded, {len(grabbed)} files saved   ")
            sys.stdout.flush()
            if ONCE or pending == 0:
                print("\nDone." if pending == 0 else "\nSingle pass complete.")
                break
            time.sleep(4)
    except KeyboardInterrupt:
        print(f"\nStopped. Saved {len(grabbed)} files to {OUT}.")

if __name__ == "__main__":
    main()
