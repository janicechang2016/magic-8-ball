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
- **Stickers (decor):** `100% ACCURATE*` badge, `so kawaii~~` tag, butterfly/heart emoji decals, `*results may vary` cream-paper sticker (positioned high on mobile via `.rmv` media query to clear the input + ASK button).
- **Orb:** glossy **black** `MeshPhysicalMaterial` (#0e0e0e, clearcoat 1.0). Neutral warm lights instead of the original candy multi-hue.
- **Window (the "center feature"):** an **HTML overlay** centered on the viewport — circular white-to-cream div with a bold black serif "8" (Bodoni Moda 900). On `.waking` and `.answering`, the bg transitions to deep navy (#0a1340 → #02041a) and the "8" fades out. The dark-navy inverted-triangle clip-path element scales/fades in (no rotation), and luminescent white answer text staggers in on top.
- **Bottom UI:** cream paper `#hint` label (only renders when non-empty), italic Bodoni question input with `ask the ball…` placeholder, italic pink **ASK** button, small **Reset** button (or "Enable motion" → "Reset" after iOS permission grant).

### What it does
- Tap/click orb, click ASK, or press Enter in the input → `ask()`.
- iOS DeviceMotion shake (`magnitude > 18`, 1.2s cooldown) also fires `ask()`. Permission gated via the "Enable motion" button on iOS 13+; on grant, the button rewires into a **Reset** that snaps the ball back to its landing state.
- On non-iOS, motion is auto-registered and the **Reset** button shows immediately.
- The typed question doesn't affect the answer (still random from `ANSWERS`) — it's pure ritual.

### Locked content
- **20 custom snarky answers** in `ANSWERS` (block 1). Keep the deranged-but-affectionate voice.
- **Single wake line:** `consulting my extremely worn thin patience`. Don't randomize — this is the only one.
- **Post-reveal hint:** `it has spoken ♥`.
- **Title / home-screen name** (all): `my dumbass boyfriend magic 8 ball`.

---

## Architecture — the big pivot

The original `magic8ball-y2k.html` rendered the bezel / glass / idle 8 / answer plate as flat `CanvasTexture` planes inside the 3D scene. **All of that has been deleted.** The window is now an HTML overlay (`#answer-overlay`) centered on the viewport, and the 3D scene is just the shell sphere + lights + charm sprites.

**Why:** the user wanted CSS keyframe-based reveals (per-char blur+brightness), a 3D "turn over" rotation effect, luminescent text, and a Reset action — all far easier in HTML/CSS/DOM than canvas/Three.js.

**Trade-off:** the HTML overlay is fixed at viewport center. It does NOT live on the orb's surface. To sell the illusion that it's part of the ball:
- During WAKING, the overlay's `transform` is synced to the orb's projected pixel position (via `pxPerWorld`) so it slides with the orb's rock.
- The overlay's `transform` also picks up a CSS 3D `rotateX` mirrored from `orb.rotation.x` — because the orb is a featureless sphere, the **only visible "turn over" is this overlay rotation**. The orb is rotating in 3D but you can't see it.
- `backface-visibility: hidden` on the overlay hides it once it flips past ~90°, so the ball appears to "turn the other way" mid-shake.
- At REVEAL the inline transform is cleared so the overlay snaps back to dead-center for the triangle pop-in.

---

## Animation timeline

```
ask() ──► state=WAKING ──── 1500ms ────► state=REVEAL ──── 3800ms ────► state=IDLE
          orb does -360° X tumble                          triangle pop-in + char        hint flips to
          overlay mirrors rotateX +                        stagger reveal                "it has spoken ♥"
          translate by orb pos × pxPerWorld                bg transitions stay
          backface-visibility hides mid-flip               (dark navy from waking)
          bg cream→navy via .waking class
```

### WAKING (1500ms) — the "turn over"
- **One** -360° X-axis rotation with ease-out: `orb.rotation.x = -2π · (1 - (1-p)^2.6)`. Power 2.6 = quick whip forward, slow settle.
- Subtle organic rock: two near-but-different sin waves on x/y position (freq 7.5 / 6.8, amp 0.045 / 0.055, damped by `1-p` so it lands still).
- Overlay tracks orb position in screen px AND mirrors `orb.rotation.x` as CSS rotateX with `perspective(700px)`. With `backface-visibility:hidden`, the window vanishes past ~90° and reappears past ~270°.
- The `.waking` CSS class drives the white→navy bg transition and fades the "8" out.

### REVEAL (3800ms) — the answer
- Triangle (`.tri`) pops in via `triangle-flip` keyframes: 550ms, **scale .65 → 1, opacity 0 → 1** (no rotation — used to also flip in rotateX, but that read as a second turn-over and was removed).
- Char-by-char stream: each `.char` span animates `char-reveal` — opacity 0→1, filter `blur(14px) brightness(2.5)` → `blur(0) brightness(1)` — 600ms cubic-bezier(.2,.7,.3,1). Stagger 80ms per char, **base delay 360ms** so chars start streaming as the triangle settles.
- **Font auto-scale by length:** `showAnswerHTML` reads `text.length` and sets a `--ans-scale` CSS variable consumed by the `.ans` font-size. Buckets: ≤12→1.0, ≤20→.88, ≤28→.76, ≤36→.66, longer→.58.

### Reset
- The Reset button (formerly "Enable motion") clears everything: state→IDLE, asked=false, pending='', orb transform reset, overlay class→`.idle`, answer chars/hint/question input all cleared. Lands the user back at the white "8" window.

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
| 3 | Lights | neutral warm (ambient + key + 2 fills) — toned down for the black plastic |
| 4 | Shell | black `MeshPhysicalMaterial` (#0e0e0e, clearcoat 1.0). One mesh, that's it. |
| 5 | Answer window — HTML overlay handles. `setOverlay()` toggles `idle / waking / answering` classes; `showAnswerHTML()` populates chars, sets `--ans-scale`, applies `REVEAL_BASE_DELAY_MS + i·CHAR_STAGGER_MS` per-char `animationDelay`. |
| 6 | Charms | floating heart/star/sparkle sprites. ALL positioned at `bz` between -1.6 and -3.4 (behind orb's back face). The orbital `charms.rotation.y` was removed so sprites never rotate around into z > 0 (i.e., in front of the orb). |
| 7 | State machine | `IDLE / WAKING / REVEAL`. Unified turn-over animation: every ASK does the same -360° X tumble with mirrored CSS rotateX on the overlay. No more first/subsequent split. |
| 8 | Device motion + reset | shake detection + iOS permission. `reset()` and `becomeResetButton()` rewire the motion button into a Reset action after grant (or immediately on non-iOS). |
| 9 | Render loop | wake math, hint flip, no more canvas redraws for the window |
| 10 | Resize | recomputes `pxPerWorld = h / (2 · camera.z · tan(vFov/2))` for shake-tracking |
| 11 | Answer overlay JS | `setOverlay`, `showAnswerHTML`, char-by-char span construction with `--ans-scale` |
| 12 | PWA | `navigator.serviceWorker.register('./sw.js')` |

---

## CSS state classes on `#answer-overlay`

- `.idle` → white/cream bg, black "8" visible
- `.waking` → bg transitions to deep navy (#0a1340 → #02041a), "8" fades out
- `.answering` → bg stays navy, `.eight` hidden, `.tri` `display:flex` (triggers `triangle-flip` pop-in), `.ans` chars stream in

Background and box-shadow on `#answer-overlay` use a 500ms ease transition; both `.waking` and `.answering` share the same navy gradient so there's no flicker at the WAKING→REVEAL boundary.

---

## PWA caching strategy

- **HTML + manifest** → **network-first** (so copy/code iterations land on reload)
- **Icons + magazine photo + Three.js CDN** → **cache-first** (offline + perf)
- **Bump `VERSION` in `sw.js`** whenever SW logic changes (currently `magic8-v3`) so the activate handler purges old caches

---

## Mobile considerations

- Portrait camera z=6.2 (was 4.7) so the orb takes ~50% viewport height instead of ~62%.
- `*results may vary` sticker has `.rmv` class with a media query bumping `bottom` from ~108px to ~248px to clear the input + ASK + Reset stack at ≤600px wide.
- Procedural magazine `.strip / .issue / .pgnum` fragments are hidden everywhere via `#mag-bg{display:none}` since the photo replaced them — but the CSS is retained for easy revert.
- Question input has `autocomplete="off"` and blurs itself on Enter so the iOS keyboard dismisses.
- On iOS, the Reset button text starts as "Enable motion" until the user grants permission; then the same button instance is rewired to call `reset()` with the label changed.

---

## Gotchas / don't regress these

- **`Object3D.add()` returns the parent.** Never chain `.position.z = X` directly off `.add()` — it silently clobbers the parent's `position.z`. Always: assign mesh to a const, set `.position` on the const, then `group.add(mesh)`.
- **The HTML overlay is decoupled from the orb's 3D position by default.** The transform-sync in WAKING is what makes them move together AND what makes the "turn over" visible. If you add new states or rework the loop, make sure the overlay's inline transform is cleared when transitioning out of WAKING.
- **The visible "turn over" is the overlay rotation, not the orb's.** Don't rip out `orb.rotation.x` in WAKING — it's the source value being mirrored to CSS. But also know that the sphere rotating in 3D produces zero pixels of visible change on its own.
- **`position:absolute` inside a flex parent doesn't auto-center.** The blue triangle was visibly off-center for a release because of this. Use explicit `left:50%; transform:translateX(-50%)`.
- **Triangle must be inscribed in the circle.** With `width:82%` the top edge needs `top:25%` so the corners don't poke through the white circle. Reducing either changes both.
- **Triangle no longer rotates on reveal.** It used to do a rotateX flip in `triangle-flip`. That was perceived as a second turn-over on top of the wake's 360°. Now it's pop-in only (scale + fade). If you re-add a rotation here, watch for the double-flip feedback.
- **Three.js CDN URL** (`https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`) is hard-coded in `sw.js` precache. If you swap CDNs/versions, update both.

---

## Next steps

1. ~~Lock answers, copy, theme, PWA, deploy~~ — **DONE.**
2. **Finish smoke test.** Desktop ✓. Still TODO: mobile browser shake on a real phone (motion permission + Reset relabel), PWA install (Add to Home Screen → standalone launch), offline (airplane-mode launch of installed PWA).
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
- Animation rule of thumb: don't stack two distinct rotation animations back-to-back (wake flip + triangle flip = "double turn"). Pick one rotation per phase.
