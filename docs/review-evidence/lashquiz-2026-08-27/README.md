# Lash quiz crop and result evidence

Captured from production builds at a 390 x 844 phone viewport and a
1440 x 1000 desktop viewport.

## Filled 3:4 comparison crops

| Viewport | Before (`origin/main` at `878ecac`) | After (`codex/quiz-preserve-eye-edges`) |
| --- | --- | --- |
| 390 px phone | [A square crop master is cropped again by the 3:4 card](before/lashquiz_mobile_390.png) | [The 3:4 card is fully filled from the real source and saved focal point](after/lashquiz_mobile_390.png) |
| 1440 px desktop | [A square crop master is cropped again by the 3:4 card](before/lashquiz_desktop_1440.png) | [The same desktop card geometry is fully filled without the square intermediary](after/lashquiz_desktop_1440.png) |

There are no square cards, letterbox bands, or `contain` rendering in the after
state. The public quiz rejects legacy `-square-` masters, and the admin crop
editor now previews and saves a matching 900 x 1200 portrait-safe master. The
390 px screenshot also shows **Neither of these** directly below the photos.

## Result paths and current result photos

- [Classic](after/lashquiz_result_classic.png)
- [Wet / Angel](after/lashquiz_result_wetAngel.png)
- [Hybrid](after/lashquiz_result_hybrid.png)
- [Volume](after/lashquiz_result_volume.png)

The browser test selects a style whenever its correctly labeled photo appears
and selects **Neither of these** for pairs that do not contain that style. The
Hybrid and Wet / Angel runs intentionally use Classic questionnaire answers to
prove that the labeled photo choices control the result. Each test also asserts
the exact current admin-configured result-photo URL and a loaded image.
