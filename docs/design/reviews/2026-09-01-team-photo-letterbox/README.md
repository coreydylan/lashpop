# LashPop team photo framing — review evidence

Written owner direction: preserve the complete team composition on browsers
narrower than the 2048px source, and use an enlarged blur of the same image as
a side matte on wider browsers rather than stretching or aggressively cropping
the foreground.

## Behavior

- Below 2048px, Emily's new 2048×1365 source fills a stable 1.579:1 frame. This
  trims only 5% vertically—about 34 source pixels per edge—while keeping every
  person visible with ample headroom. The frame adds exactly 10vw to the prior slot,
  preserving the established pixel grid for later sections.
- At 2048px and above, the crisp foreground remains capped at its native width.
  A second, decorative copy fills and blurs behind it, using only the photo's
  own colors.
- The wide foreground frame is 2048×1280, a 6.2% vertical crop. Every face and
  the source's generous headroom remain visible.
- The decorative image has an empty alt attribute and is hidden from assistive
  technology. The meaningful foreground retains `The LashPop Studios team`.

## Evidence

- `before-team-photo-390.png` and `before-team-photo-1440.png` show the old
  fixed 1.875:1 crop.
- `after-team-photo-390.png` and `after-team-photo-1440.png` show the nearly
  complete composition at narrow and normal desktop widths.
- `after-team-photo-2560.png` shows the photo-derived blurred side matte on an
  ultrawide viewport.

The focused browser contract checks all three widths, caps wide-screen crop at
7%, and verifies the blurred layer is absent below the source width.
