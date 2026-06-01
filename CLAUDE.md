# Magic 8 — "the fate edit" — Project Context

A Magic 8 Ball with a **Y2K / Mean Girls teen-magazine** look. A responsive web
app today → an installable PWA → eventually a **physical ball with an embedded
round screen**. Each stage is a prototype of the next, so decisions are made
with the physical build in mind.

---

## Current status

- **`index.html`** — the working app. Rename of `magic8ball-y2k.html`.
  Vanilla HTML/CSS/JS + Three.js r128 (CDN). Procedural, no image assets, no build step.
- Earlier versions (reference / fallback only): `the-all-seeing-orb.html` (dark eye theme), `magic8ball.html` (neutral black foundation).
- **Theme: Y2K / Mean Girls — LOCKED.** Glossy bubblegum-pink plastic shell, rhinestone-bezel round window, marker-font ("Burn Book") answers, floating heart/star/butterfly charms, candy gradient + polka-dot background, magazine-cover masthead and pasted stickers.
  - Fonts: Shrikhand (masthead + the "8"), Permanent Marker (answers, hints, stickers), Fredoka (UI).
  - Palette in CSS `:root`: `--bubble --hot --magenta --baby --cream --lilac --ink`.
- Answers: classic 20. May be replaced with a custom set (still open).

---

## Architecture & decisions

- **Stack:** plain HTML/CSS/JS + Three.js r128 from CDN. No framework, no bundler, no build step. Single file by design — trivial to deploy and easier to port to firmware later.
- **Rendering:** WebGL via Three.js. Glossy bubblegum shell is a `MeshPhysicalMaterial` (clearcoat) lit by multi-hue point lights for candy/iridescent highlights. Window bezel, glass, idle "8", and answer text are drawn with `CanvasTexture`. Answer reveal = marker-font sticker (white outline + hot-pink fill) blurring + popping in. Charms are `Sprite`s with procedurally drawn heart/star/sparkle textures.
- **Input model:**
  - Shake → `DeviceMotion` `accelerationIncludingGravity`, magnitude `> ~18`, 1.2s cooldown.
  - Universal fallback → tap/click + the **Ask** button (always works, including in sandboxed previews).
  - iOS 13+ requires a `DeviceMotionEvent.requestPermission()` user gesture — handled via the "Enable motion" button.
- **❌ REMOVED — MediaPipe Tasks Vision Hand Landmarker.** The original reference used webcam hand-tracking for desktop shake detection. We are **not** using it: no webcam, no MediaPipe dependency, no `hand_landmarker.task`. Desktop users tap/click. **Do not reintroduce this.**
- **PWA:** web manifest + app icon are generated at runtime (enough for "Add to Home Screen"). Offline caching is **not yet implemented** (needs a real `sw.js` — see next steps).
- **Form constraint (load-bearing):** keep it a **sphere with ONE round window**. That window becomes the physical screen. Don't break this shape.

---

## Code map (blocks inside `index.html`)

| # | Block | Notes |
|---|-------|-------|
| 1 | Answers | `ANSWERS` array + `WAKE_LINES` — most-edited; the logic that ports to firmware |
| 2 | Scene | camera / renderer setup |
| 3 | Lights | multi-hue point lights for the candy gloss |
| 4 | Shell | glossy pink `MeshPhysicalMaterial` |
| 5 | Window | bezel + glass + idle "8" + answer reveal — **this is the physical-screen logic** |
| 6 | Charms | floating heart/star/sparkle sprites |
| 7 | State machine | `IDLE / WAKING / REVEAL` |
| 8 | Device motion | shake detection + iOS permission |
| 9 | Render loop | float, charm bob, shake, pop-in reveal |
| 10 | Resize | responsive camera |
| 11 | PWA | runtime manifest + pink "8" icon |

Theme colors live in the CSS `:root` variables; fonts are loaded from Google Fonts in `<head>`.

---

## Deployment — Vercel + GitHub

Restructure the single file into a small static project so PWA/offline works cleanly:

```
orb/
  index.html              # the app (move runtime manifest/icon out to static files)
  manifest.webmanifest    # static manifest
  sw.js                   # service worker (offline) — NEW
  icons/icon-192.png
  icons/icon-512.png
  vercel.json             # optional
```

Steps:
1. `git init`, create a GitHub repo, push.
2. Vercel → **New Project** → import the repo. It's a static site: framework preset **Other**, **no build command**, output dir = root. Deploy.
3. Vercel serves it over HTTPS automatically → `DeviceMotion` and PWA install both work on a real phone.

CLI alternative: run `npx vercel` from the folder.

---

## Next steps (ordered — ready to execute)

1. **Lock answers.** Theme is locked (Y2K/Mean Girls); confirm classic-20 vs. a custom set (Block #1).
2. **PWA offline.** Add static `manifest.webmanifest`, real icon PNGs, and `sw.js` (cache `index.html` + the Three.js CDN file, cache-first). Register the SW in `index.html`. Optionally self-host Three.js so it works fully offline.
3. **Deploy to Vercel** via the GitHub import above; verify install + shake on a physical phone.
4. **Polish:** `navigator.vibrate()` haptic on reveal, `prefers-reduced-motion` fallback, a loading state while the Three.js CDN loads.
5. **Iteration 3 — physical ball:**
   - **MCU:** ESP32 (Wi-Fi, drives display, reads sensor).
   - **Display:** round IPS LCD, e.g. GC9A01 240×240, behind the window.
   - **Sensor:** MPU-6050 / MPU-9250 accelerometer for shake.
   - **Two paths:** (a) ESP32 serves this HTML to an on-board display, or (b) port block #1 (answers) + #5 (reveal animation) to firmware (TFT_eSPI / LVGL). **Reuse the logic, don't rewrite it.**
   - **Enclosure:** 3D-printed or resin sphere with a diffuser window.

---

## Open questions (resolve before step 1)

- ~~Final theme~~ — **DONE: Y2K / Mean Girls, locked.**
- Custom answer set, or keep the classic 20? (Block #1.)
- Portrait-lock only, or allow landscape?
- Optional: tone down or add stickers — currently 5 pasted decorations + masthead.

---

## Conventions

- No build step. Keep dependencies to **Three.js only**.
- Keep everything **procedural** (no binary image assets) unless a texture is explicitly wanted.
- Preserve the **single round-window sphere** form factor at every stage.
