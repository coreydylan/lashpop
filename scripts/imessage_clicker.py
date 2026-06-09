#!/usr/bin/env python3
"""
Drive Messages.app to download offloaded iCloud attachments by locating the
circular download glyphs and clicking them (the entitled app makes the real
IMCore call; we just puppeteer its UI). Pair with imessage-harvest.py.

  python3 scripts/imessage_clicker.py --dry-run   # detect + annotate, NO clicks
  python3 scripts/imessage_clicker.py --pages 8   # click visible, scroll up, repeat

Requires: cliclick, an open Messages conversation frontmost (chat 41).
Detection: neutral-grey disk (~RGB 95-125) of button size with a bright icon
near its center, restricted to the transcript (right of the sidebar).
"""
import subprocess, sys, time
import numpy as np
from PIL import Image, ImageDraw

SF = 2  # retina
DRY = "--dry-run" in sys.argv
PAGES = int(sys.argv[sys.argv.index("--pages")+1]) if "--pages" in sys.argv else 6

def geom():
    scpt = ('tell application "System Events" to tell process "Messages"\n'
            ' set p to position of front window\n'
            ' set z to size of front window\n'
            ' return ((item 1 of p) as text) & " " & ((item 2 of p) as text) & " " '
            '& ((item 1 of z) as text) & " " & ((item 2 of z) as text)\n'
            'end tell')
    s = subprocess.check_output(["osascript","-e",scpt]).decode()
    return [int(float(v)) for v in s.split()]

def capture(x,y,w,h):
    subprocess.run(["screencapture","-x","-o","/tmp/_cap.png"],check=True)
    im = Image.open("/tmp/_cap.png").convert("RGB")
    W,H = im.size
    box = (x*SF, y*SF, min((x+w)*SF,W), min((y+h)*SF,H))
    return im.crop(box), box

def detect(crop):
    """Return list of (cx,cy) button centers in crop-native pixels."""
    A = np.asarray(crop, dtype=np.int16)
    Hn, Wn, _ = A.shape
    R,G,B = A[:,:,0],A[:,:,1],A[:,:,2]
    mx = np.max(A,axis=2); mn = np.min(A,axis=2)
    grey = (R>=90)&(R<=130)&((mx-mn)<=16)        # neutral mid-grey disk fill
    grey[:, :int(Wn*0.42)] = False                # exclude sidebar (left)
    grey[:int(Hn*0.03), :] = False                # exclude top chrome (FaceTime)
    grey[int(Hn*0.95):, :] = False                # exclude bottom (emoji/compose)
    # downsample by 4 for cheap clustering
    ds = 4
    small = grey[::ds, ::ds]
    ys, xs = np.where(small)
    pts = list(zip(xs.tolist(), ys.tolist()))
    # greedy cluster within radius
    clusters = []
    used = [False]*len(pts)
    R2 = (14)**2
    for i,(px,py) in enumerate(pts):
        if used[i]: continue
        cxs=[px]; cys=[py]; used[i]=True
        for j in range(i+1,len(pts)):
            if used[j]: continue
            qx,qy=pts[j]
            if (qx-px)**2+(qy-py)**2 <= R2:
                used[j]=True; cxs.append(qx); cys.append(qy)
        if len(cxs) >= 12:   # enough grey pixels => disk-sized
            clusters.append((sum(cxs)/len(cxs)*ds, sum(cys)/len(cys)*ds, len(cxs)))
    # verify: bright icon near center + roughly circular size
    out=[]
    for cx,cy,n in clusters:
        cx,cy=int(cx),int(cy)
        patch = A[max(0,cy-30):cy+30, max(0,cx-30):cx+30]
        if patch.size==0: continue
        bright = ((patch[:,:,0]>190)&(patch[:,:,1]>190)&(patch[:,:,2]>190)).sum()
        greyfill = ((patch[:,:,0]>=90)&(patch[:,:,0]<=130)).sum()
        if bright >= 60 and greyfill >= 400:      # has a white icon sitting on grey
            out.append((cx,cy))
    # dedup near-duplicates
    ded=[]
    for c in out:
        if all((c[0]-d[0])**2+(c[1]-d[1])**2 > 40**2 for d in ded): ded.append(c)
    return ded

def main():
    x,y,w,h = geom()
    subprocess.run(["osascript","-e",'tell application "Messages" to activate'])
    time.sleep(0.5)
    total_clicked=0
    for p in range(PAGES if not DRY else 1):
        crop, box = capture(x,y,w,h)
        centers = detect(crop)
        print(f"pass {p+1}: detected {len(centers)} download buttons")
        if DRY:
            d=ImageDraw.Draw(crop)
            for cx,cy in centers:
                d.ellipse((cx-45,cy-45,cx+45,cy+45), outline=(255,0,0), width=5)
            crop.save("/tmp/annot.png"); print("annotated -> /tmp/annot.png"); return
        for cx,cy in centers:
            lx = x + cx/SF; ly = y + cy/SF
            subprocess.run(["cliclick", f"c:{int(lx)},{int(ly)}"])
            total_clicked+=1
            time.sleep(0.35)
        # let downloads breathe, then page up into older history
        time.sleep(2.0)
        subprocess.run(["cliclick", f"c:{int(x+w*0.6)},{int(y+h*0.5)}"])  # focus transcript
        for _ in range(3):
            subprocess.run(["cliclick","kp:page-up"]); time.sleep(0.6)
        time.sleep(1.2)
    print(f"done. total clicks: {total_clicked}")

if __name__=="__main__":
    main()
