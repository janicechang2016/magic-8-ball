# my dumbass boyfriend magic 8 ball 🎱

A Magic 8 Ball web app with a snarky Y2K-magazine soul: classic black-plastic ball,
Mean-Girls-era magazine spread, and two sides you flip between — *her* side delivers
deranged-but-affectionate verdicts; the **boyfriend rehab** side flips the ball over
into a calm-blue theme and answers with emotionally-intelligent "say this, not that"
scripts.

**Live:** https://magic-8-ball-nine.vercel.app/ · rehab side: [`#rehab`](https://magic-8-ball-nine.vercel.app/#rehab)

Tap the ball (or shake your phone) to ask. Swipe across the ball to flip sides. Type a
question if you want — it's pure ritual; the orb decides.

## How it's built

One HTML file, no build step. The interesting parts:

- **Hybrid 3D/DOM rendering.** The ball is a glossy Three.js `MeshPhysicalMaterial`
  sphere, but the answer window is an HTML overlay whose CSS transform is synced
  frame-by-frame to the orb's projected position and rotation. During the wake tumble,
  `backface-visibility: hidden` makes the window vanish mid-flip — selling a 3D
  "turn-over" that's actually a coordinated 2D illusion. CSS handles what CSS is good at
  (per-character blur/glow reveals); WebGL handles what it's good at (the ball).
- **Two sides, one document.** `#rehab` is a real, shareable URL — a hash-driven theme
  system swaps colors, copy, stickers, and the active answer set at the flip's midpoint,
  while the window's backface is hidden so the swap is never seen.
- **Installable PWA.** Service worker with network-first HTML and cache-first assets;
  works offline; edge-to-edge on iOS when added to the home screen.
- **Resilient by design.** If WebGL or the CDN fails, a CSS-gradient sphere stands in
  (it doubles as the loading skeleton) and the whole state machine runs on timers —
  the ball still answers.
- **Accessible.** Answers and side-flips are announced via an `aria-live` region,
  `prefers-reduced-motion` swaps the tumble/blur choreography for a quiet beat,
  the side switcher is a real radiogroup, zoom is never disabled, and tap targets
  meet WCAG 2.5.8.
- **Device motion.** Shake-to-ask on mobile, with the iOS 13+ permission dance handled
  gracefully (the permission button rewires itself into "ask again" once granted).

## Run it locally

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

Three.js loads from a CDN; everything else is in `index.html`.

## Roadmap

Iteration 3 is a physical ball: ESP32 + round LCD + accelerometer behind a real
8-ball window, reusing the answer sets and reveal logic as firmware.
