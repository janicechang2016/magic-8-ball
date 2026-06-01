# Magic 8 — "my dumbass boyfriend magic 8 ball" — Project Context

A Magic 8 Ball with a **Y2K / Mean Girls teen-magazine** look, personalized as
**"my dumbass boyfriend magic 8 ball"**. Web app → installable PWA → eventually
a **physical ball with an embedded round screen**. Each stage is a prototype of
the next.

- **Live:** https://magic-8-ball-nine.vercel.app/
- **Repo:** https://github.com/janicechang2016/magic-8-ball (deploys from `main`)
- **Hosting:** Vercel (auto-deploy on push to `main`)

---

## Current status

- **`index.html`** — the working app (renamed from `magic8ball-y2k.html`).
  Vanilla HTML/CSS/JS + Three.js r128 (CDN). No build step.
- **Theme: Y2K / Mean Girls — LOCKED.** Glossy bubblegum-pink shell, rhinestone-bezel round window, marker-font answers, floating heart/star/butterfly charms, magazine masthead and stickers.
  - Fonts: Shrikhand (masthead + idle "8"), Permanent Marker (answers, hints, stickers), Fredoka (UI).
  - Palette in CSS `:root`: `--bubble --hot --magenta --baby --cream --lilac --ink`.
- **Copy — LOCKED.** Browser title, home-screen name, and masthead all read "my dumbass boyfriend magic 8 ball". Kicker: "send his dumbass to the stratosphere girl <3". Stickers: `100% ACCURATE*`, `so kawaii~~`, butterfly/heart deco, `*results may vary`. Hint: "shank his stoopid ass".
- **Answers — LOCKED.** Custom 20-item snarky/deranged set lives in the `ANSWERS` array (block 1). 3-item `WAKE_LINES` set ("consulting my extremely worn thin patience" / "fuck his ass up" / "remember, forgive but never forget :)"). When editing, keep the deranged-but-affectionate voice.
- **PWA — IN PLACE.** Static `manifest.webmanifest`, real `icons/icon-192.png` + `icons/icon-512.png`, and `sw.js`. Network-first for HTML + manifest (so copy edits show up on reload), cache-first for icons + Three.js CDN. Cache key bumped when SW logic changes.
- **Bugs fixed during smoke test (do not regress):**
  - **Eye occluded by sphere.** The window/bezel/answer plane was being rendered inside the opaque `SphereGeometry(1)` because `eye.add(new THREE.Mesh(...)).position.z = 0.03` returned `eye` (parent), not the new mesh, silently clobbering `eye.position.z` to `0.03`. Fix: extract the bezel into a named const, set its `.position.z` on the mesh, and place `eye` at `z = 1.01` so the window floats just in front of the sphere apex.
  - **Window drifts off-axis.** Continuous `orb.rotation.y += 0.0015` in IDLE caused revealed answers to rotate away from camera over time. Removed both `rotation.y +=` and the `rotation.x` sine oscillation. Bob + scale pulse remain so the ball still feels alive.
  - **Window too large.** Bezel was ~66% of the ball diameter; classic Magic 8 Ball is ~25–30%. Whole `eye` group is now `eye.scale.setScalar(0.4)`; do NOT independently shrink the children (would compound).

---

## File layout

```
magic-8-ball/
  index.html              # the app
  manifest.webmanifest    # static PWA manifest
  sw.js                   # service worker — network-first HTML, cache-first assets
  icons/
    icon-192.png
    icon-512.png
  generate-icons.html     # one-off browser tool to regenerate the PNGs
  CLAUDE.md
  .gitignore
```

`generate-icons.html` exists so the icons can be regenerated if the masthead/icon design changes. Open it in a browser, click both download buttons, move PNGs back to `icons/`.

---

## Architecture & decisions

- **Stack:** plain HTML/CSS/JS + Three.js r128 from CDN. No framework, no bundler, no build step. Single-file app + small static assets — trivial to deploy, easier to port to firmware later.
- **Rendering:** WebGL via Three.js. Glossy shell is `MeshPhysicalMaterial` (clearcoat) with multi-hue point lights. Window bezel, glass, idle "8", and answer text are all `CanvasTexture` on flat planes inside an `eye` Group. Answer reveal = marker-font sticker (white outline + hot-pink fill) blurring + popping in. Charms are `Sprite`s with procedurally drawn textures.
- **Input model:**
  - Shake → `DeviceMotion` `accelerationIncludingGravity`, magnitude `> ~18`, 1.2s cooldown.
  - Universal fallback → tap/click + the **Ask** button.
  - iOS 13+ requires a `DeviceMotionEvent.requestPermission()` user gesture — handled via the "Enable motion" button.
- **❌ REMOVED — MediaPipe Hand Landmarker.** Webcam hand-tracking is not used. Do not reintroduce.
- **PWA caching strategy:**
  - HTML + manifest → **network-first** (so copy/code iterations land on reload).
  - icons + Three.js CDN → **cache-first** (offline + perf).
  - Bump `VERSION` in `sw.js` when changing SW strategy so the activate handler purges old caches.
- **Form constraint (load-bearing):** keep it a **sphere with ONE round window**. That window becomes the physical screen. Don't break this shape.

---

## Code map (blocks inside `index.html`)

| # | Block | Notes |
|---|-------|-------|
| 1 | Answers | `ANSWERS` array + `WAKE_LINES` — most-edited; the logic that ports to firmware |
| 2 | Scene | camera / renderer setup |
| 3 | Lights | multi-hue point lights for the candy gloss |
| 4 | Shell | glossy pink `MeshPhysicalMaterial` |
| 5 | Window | `eye` Group (`z=1.01`, `scale=0.4`) holds bezel + glass + idle "8" + answer plane. **GOTCHA:** `Object3D.add()` returns the parent — never chain `.position.z` off it; assign the mesh to a const first. |
| 6 | Charms | floating heart/star/sparkle sprites |
| 7 | State machine | `IDLE / WAKING / REVEAL`. IDLE has NO rotation drift (intentional, see bug above). |
| 8 | Device motion | shake detection + iOS permission |
| 9 | Render loop | float, charm bob, shake, pop-in reveal |
| 10 | Resize | responsive camera |
| 11 | PWA | service-worker registration; manifest is a static file |

Theme colors live in CSS `:root`; fonts load from Google Fonts in `<head>`.

---

## Next steps (ordered)

1. ~~Lock answers~~ — **DONE.**
2. ~~PWA offline (static manifest, icons, sw.js)~~ — **DONE.**
3. ~~Deploy to Vercel via GitHub~~ — **DONE.**
4. **Finish smoke test.** Desktop ✓. Still TODO: mobile browser (layout + shake on a real phone), PWA install (Add to Home Screen → standalone launch), offline (airplane-mode launch of installed PWA).
5. **Polish:** `navigator.vibrate()` on reveal, `prefers-reduced-motion` fallback, loading state while Three.js CDN loads.
6. **Iteration 3 — physical ball:**
   - **MCU:** ESP32 (Wi-Fi, drives display, reads sensor).
   - **Display:** round IPS LCD, e.g. GC9A01 240×240, behind the window.
   - **Sensor:** MPU-6050 / MPU-9250 accelerometer for shake.
   - **Two paths:** (a) ESP32 serves this HTML to an on-board display, or (b) port block 1 (answers) + block 5 (reveal animation) to firmware (TFT_eSPI / LVGL). **Reuse the logic, don't rewrite it.**
   - **Enclosure:** 3D-printed or resin sphere with a diffuser window.

---

## Open questions

- ~~Final theme~~ — **DONE: Y2K / Mean Girls, locked.**
- ~~Custom answer set~~ — **DONE: 20 custom answers locked.**
- Portrait-lock only, or allow landscape?
- Optional: tone down or add stickers — currently 5 decorations + masthead.
- Answer text size at the new 0.4 window scale — readable on desktop; revisit on mobile if too small.

---

## Conventions

- No build step. Keep dependencies to **Three.js only**.
- Keep everything **procedural** (no binary image assets) unless a texture is explicitly wanted. The icons in `icons/` are the one exception (PWA needs real files).
- Preserve the **single round-window sphere** form factor at every stage.
- When editing PWA structure, bump `VERSION` in `sw.js` so the activate handler clears old caches.
- When adding meshes to a `THREE.Group`: assign to a const, set `.position` on the mesh, then `group.add(mesh)`. Never chain `.position` off `.add()`.
