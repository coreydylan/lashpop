# LashPop Website Notes — implementation evidence

Source of written owner feedback: [LashPop Website Notes](https://docs.google.com/document/d/1z9TaAO7of_EWDojS-Hrh_RUMd5TDQyvLsT6od6qit78/edit)

Captured August 31, 2026 against the production site before the change and the local production build after the change. Production was not deployed or mutated.

## Reviewed changes

- `before-services-*` and `after-services-desktop.png`: the public category label is **Tiny Tattoos** while the Vagaro/database slug remains `fine-line-tattoos`.
- `before-team-*` and `after-team-photo-*`: the Join Our Team banner uses the approved team photograph embedded in the Website Notes document. The full source is retained in `public/lashpop-images/team/team-group-photo-2026-08-11.jpg`; the public page serves its deterministic Cloudflare Images copy.
- `before-service-browser-desktop.png` and `after-booking-back-*`: service cards retain their already-loaded photos after returning from the Vagaro handoff on desktop and phone. The six approved fill cards omit their secondary subtitles.
- `before-quiz-*` and `after-quiz-*`: comparison and result images use contained framing so the eyes remain visible at desktop and phone widths.
- `before-footer-desktop.png`: the pre-change footer evidence for the approved Fine Line Tattoos to Tiny Tattoos label update. The updated surface is also covered by the visual-regression baselines.
- `before-services-index-desktop.png`: the pre-change `/services` evidence. The updated surface is also covered by the visual-regression baselines.

## Photo provenance

The replacement team source is the native image immediately following the “Join the Team page photo” note in the connected Google Doc. It is a 1692×1364 JPEG whose SHA-256 is `166ec94c3887955917653bf7718e2cb02618950fd5ad84f44ddbcbcb4c4e9c95`.

The deterministic Cloudflare Images ID is `lp/d1b7c28c1c6f05603a6e6feb91309010196c0f8dbf02b205560683bee223fda8`. The 600px AVIF, 1200px WebP, and native 1692px JPEG variants were fetched and decoded during verification.

## Deferred dependency

The Website Notes ask for a Tiny Tattoos FAQ section but explicitly say the questions and answers are still to come from Jake and Emily. No placeholder FAQ content or empty public category was invented.
