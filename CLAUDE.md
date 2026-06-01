# Magic 8 — "my dumbass boyfriend magic 8 ball" — Project Context

A Magic 8 Ball web app: **classic black plastic 8-ball look + snarky Y2K voice + Mean Girls magazine spread background**. Responsive web app → installable PWA → eventually a **physical ball with an embedded round screen**.

- **Live:** https://magic-8-ball-nine.vercel.app/
- **Repo:** https://github.com/janicechang2016/magic-8-ball (deploys from `main`)
- **Hosting:** Vercel (auto-deploy on push to `main`)

---

## Current state

### What it looks like
- **Background:** the actual scanned Y2K teen-magazine spread (`magazine-inspo.webp`, cover-fit, fixed) with a soft cream tint and radial vignette under the orb.
- **Masthead:** "my dumbass boyfriend magic 8 ball" in Shrikhand with hot-pink fill + deep-ink stroke. Pink-pill kicker reads "send his dumbass to the stratosphere girl <3".
- **Stickers (decor):** `100% ACCURATE*` badge, `so kawaii~~` tag, butterfly/heart emoji decals, `*results may vary` cream-paper sticker (positioned high on mobile to clear the input + ASK button).
- **Orb:** glossy **black** `MeshPhysicalMaterial` (#0e0e0e, clearcoat 1.0). Neutral warm lights instead of the original candy multi-hue.
- **Window (the "center feature"):** an **HTML overlay** — circular cream-to-white div with bold black serif "8" (Bodoni Moda 900). On reveal, a dark-navy inverted-triangle clip-path element flips into place with a 3D `rotateX` animation; luminescent white answer text staggers in char-by-char on top.
- **Bottom UI:** cream paper `#hint` label (only renders when non-empty), italic Bodoni question input with `ask the ball…` placeholder, italic pink **ASK** button.

### What it does
- Tap/click orb, click ASK, or press Enter in the input → `ask()`.
- iOS DeviceMotion shake (`magnitude > 18`, 1.2s cooldown) also fires `ask()`. Permission gated via the **Enable motion** button on iOS 13+.
- The typed question doesn't affect the answer (still random from `ANSWERS`) — it's pure ritual.

### Locked content
- **20 custom snarky answers** in `ANSWERS` (block 1). Keep the deranged-but-affectionate voice.
- **Single wake line:** `consulting my extremely worn thin patience`. Don't randomize — this is the only one.
- **Post-reveal hint:** `it has spoken ♥`.
- **Title / home-screen name** (all): `my dumbass boyfriend magic 8 ball`.

---

## Architecture — the big pivot

The original `magic8ball-y2k.html` rendered the bezel / glass / idle 8 / answer plate as flat `CanvasTexture` planes inside the 3D scene. **All of that has been deleted.** The window is now an HTML overlay (`#answer-overlay`) centered on the viewport, and the 3D scene is just the shell sphere + lights + charm sprites.

**Why:** the user wanted CSS keyframe-based reveals (per-char blur+brightness), a 3D `rotateX` flip on the triangle, and luminescent text — all far easier in HTML/CSS than in canvas/Three.js.

**Trade-off:** the HTML overlay is fixed at viewport center. It does NOT live on the orb's surface. To sell the illusion that it's part of the ball, the overlay's `transform` is synced to the orb's projected pixel position during the shake (see `pxPerWorld` in `resize()` and the WAKING branch of the render loop). When the shake ends and state goes REVEAL, the inline transform is cleared so the overlay snaps back to dead center for the flip.

---

## Animation timeline

```
ask() ──► state=WAKING ──── 1200ms ────► state=REVEAL ──── 3800ms ────► state=IDLE
          (orb sin-wave wobble,                            (triangle 3D flip
           overlay tracks orb,                              + char stagger reveal)
           "8" fades out via                                hint flips to
           CSS class .waking)                               "it has spoken ♥"
```

- **WAKING (1200ms):** orb wobbles via 4.5Hz sin waves on position (amp 0.18/0.13) and rotation (amp 0.22). Window overlay translates by orb position × `pxPerWorld` so the white circle visibly moves with the ball.
- **REVEAL (3800ms):**
  - **Triangle flip:** CSS `triangle-flip` keyframes, 950ms, `cubic-bezier(.22,.61,.36,1)`. rotateX(-160°→0°) + scale(.86→1) with opacity ramp. `perspective:800px` on overlay so the 3D reads.
  - **Char reveal:** each `.char` span animates `char-reveal` keyframes — opacity 0→1, filter `blur(14px) brightness(2.5)` → `blur(0) brightness(1)` — over 600ms with cubic-bezier(.2,.7,.3,1). Stagger 80ms per char, **base delay 620ms** so it doesn't start streaming until the triangle is mostly settled.
  - **Auto-scale:** `showAnswerHTML` reads `text.length` and sets `--ans-scale` CSS variable on `.ans` so long answers shrink: ≤12→1.0, ≤20→.88, ≤28→.76, ≤36→.66, longer→.58.

---

## File layout

```
magic-8-ball/
  index.html              # the app
  manifest.webmanifest    # static PWA manifest
  sw.js                   # service worker — VERSION='magic8-v3', network-first HTML, cache-first assets
  magazine-inspo.webp     # 118KB body bg (committed)
  icons/
    icon-192.png
    icon-512.png
  generate-icons.html     # one-off browser tool to regenerate the PNGs
  CLAUDE.md
  .gitignore
```

Reference images that are NOT in git: `magazine-lettering.webp`, `8ballinspo.jpeg`. Used as design refs only; not deployed assets.

---

## Code map (blocks inside `index.html`)

| # | Block | Notes |
|---|-------|-------|
| 1 | Answers | `ANSWERS` (20) + `WAKE_LINES` (single) — what ports to firmware |
| 2 | Scene | camera (FOV 38°, portrait z=6.2, landscape z=4.2), `WebGLRenderer({alpha:true})` |
| 3 | Lights | neutral warm — was multi-hue candy, toned down for the black plastic |
| 4 | Shell | black `MeshPhysicalMaterial` (#0e0e0e, clearcoat 1.0). One mesh, that's it. |
| 5 | Answer window — HTML overlay handles. `setOverlay()` toggles `idle / waking / answering` classes; `showAnswerHTML()` populates chars, sets `--ans-scale`, applies `REVEAL_BASE_DELAY_MS` + `CHAR_STAGGER_MS` per-char `animationDelay`. |
| 6 | Charms | floating heart/star/sparkle sprites via `canvasTex()` (the helper survives for these) |
| 7 | State machine | `IDLE / WAKING / REVEAL`. WAKING uses sin-wave wobble (4.5Hz) + syncs `overlay.style.transform` to orb position via `pxPerWorld`. REVEAL clears the inline transform and calls `showAnswerHTML(pending)`. |
| 8 | Device motion | shake detection + iOS permission |
| 9 | Render loop | wobble math, hint flip, no more canvas redraws for the window |
| 10 | Resize | recomputes `pxPerWorld = h / (2 · camera.z · tan(vFov/2))` for shake-tracking |
| 11 | Answer overlay JS | `setOverlay`, `showAnswerHTML`, char-by-char span construction |
| 12 | PWA | `navigator.serviceWorker.register('./sw.js')` |

---

## CSS state classes on `#answer-overlay`

- `.idle` → black "8" visible, triangle hidden
- `.waking` → "8" fades out (opacity transition), triangle hidden
- `.answering` → "8" `display:none`, `.tri` `display:flex` (triggers `triangle-flip` animation), char spans inside animate via `char-reveal` keyframes

The class flips happen in `ask()` (→ waking) and the WAKING→REVEAL transition (→ answering via `showAnswerHTML`).

---

## PWA caching strategy

- **HTML + manifest** → **network-first** (so copy/code iterations land on reload)
- **Icons + magazine photo + Three.js CDN** → **cache-first** (offline + perf)
- **Bump `VERSION` in `sw.js`** whenever SW logic changes (currently `magic8-v3`) so the activate handler purges old caches

---

## Mobile considerations

- Portrait camera z=6.2 (was 4.7) so the orb takes ~50% viewport height instead of ~62%.
- `*results may vary` sticker has `.rmv` class with a media query bumping `bottom` from ~108px to ~248px to clear the input + ASK stack at ≤600px wide.
- Procedural magazine `.strip / .issue / .pgnum` fragments are hidden on mobile (also currently hidden everywhere via `#mag-bg{display:none}` since the photo replaced them — but the CSS is retained for easy revert).
- Question input has `autocomplete="off"` and blurs itself on Enter so the iOS keyboard dismisses.

---

## Gotchas / don't regress these

- **`Object3D.add()` returns the parent.** Never chain `.position.z = X` directly off `.add()` — it silently clobbers the parent's `position.z`. (This bit us when the eye was buried inside the sphere.) Always: assign mesh to a const, set `.position` on the const, then `group.add(mesh)`.
- **The HTML overlay is decoupled from the orb's 3D position by default.** The transform-sync in WAKING is what makes them move together. If you add new states or rework the loop, make sure the overlay's inline transform is cleared on state transitions out of WAKING.
- **`position:absolute` inside a flex parent doesn't auto-center.** The blue triangle was visibly off-center for a release because of this. Use explicit `left:50%; transform:translateX(-50%)`.
- **Triangle must be inscribed in the circle.** With `width:82%` the top edge needs `top:25%` so the corners don't poke through the white circle. Reducing either changes both.
- **Three.js CDN URL** (`https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`) is hard-coded in `sw.js` precache. If you swap CDNs/versions, update both.

---

## Next steps

1. ~~Lock answers, copy, theme, PWA, deploy~~ — **DONE.**
2. **Finish smoke test.** Desktop ✓. Still TODO: mobile browser shake on a real phone, PWA install (Add to Home Screen → standalone launch), offline (airplane-mode launch of installed PWA).
3. **Polish:** `navigator.vibrate()` is already wired in `ask()`; consider `prefers-reduced-motion` fallback (no flip / no wobble), loading state while Three.js CDN loads, optional echo of the typed question somewhere during reveal.
4. **Iteration 3 — physical ball:**
   - **MCU:** ESP32 (Wi-Fi, drives display, reads sensor)
   - **Display:** round IPS LCD (e.g. GC9A01 240×240) behind the window
   - **Sensor:** MPU-6050 / MPU-9250 accelerometer
   - **Two paths:** (a) ESP32 serves this HTML to an on-board display, or (b) port block 1 (answers) + the answer-overlay reveal logic to firmware (TFT_eSPI / LVGL). Reuse, don't rewrite.

---

## Conventions

- No build step. Three.js r128 from CDN.
- **Procedural by default**, with two committed binary exceptions: PWA icons and `magazine-inspo.webp`. Don't add more without the user asking.
- Preserve the **single round-window sphere** form factor at every stage.
- Bump `VERSION` in `sw.js` on SW changes.
- When adding meshes to a `THREE.Group`: assign to a const, set `.position` on the mesh, then `group.add(mesh)`. Never chain off `.add()`.
- When positioning absolute children inside a flex parent, set `left/right/top/bottom` explicitly — don't rely on the flex centering inheriting.
