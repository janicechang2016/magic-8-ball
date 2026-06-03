# Magic 8 — "my dumbass boyfriend magic 8 ball" — Project Context

A Magic 8 Ball web app: **classic black plastic 8-ball look + snarky Y2K voice + Mean Girls magazine spread background**. Responsive web app → installable PWA → eventually a **physical ball with an embedded round screen**.

**Two sides of one ball:** the default side is *her* snark ("my dumbass boyfriend magic 8 ball"); a second **"boyfriend rehab"** side (calm-blue theme) gives the boyfriend emotionally-intelligent **"say this, not that"** scripts. They're the same single page — a `#rehab` URL hash + a `body.rehab` theme class — and you move between them by **flipping the ball over** (reusing the wake turn-over as the transition). See "Two sides / theme system" below.

- **Live:** https://magic-8-ball-nine.vercel.app/
- **Repo:** https://github.com/janicechang2016/magic-8-ball (deploys from `main`)
- **Hosting:** Vercel (auto-deploy on push to `main`)

---

## Current state

### What it looks like
- **Background:** the actual scanned Y2K teen-magazine spread (`magazine-inspo.webp`) painted full-bleed on its own `#bg-photo` layer (`cover`, sized to `100lvh`), with a soft cream tint + radial vignette layered on top via `body::before`.
- **Masthead:** "my dumbass boyfriend magic 8 ball" in Shrikhand with hot-pink fill + deep-ink stroke. Pink-pill kicker reads "send his dumbass to the stratosphere girl <3".
- **Stickers (decor):** `100% ACCURATE*` badge, `so kawaii~~` tag, butterfly/heart emoji decals, `*results may vary` cream-paper sticker (positioned high on mobile via `.rmv` media query to clear the input + ASK button).
- **Orb:** glossy **black** `MeshPhysicalMaterial` (#0e0e0e, clearcoat 1.0). Neutral warm lights instead of the original candy multi-hue.
- **Window (the "center feature"):** an **HTML overlay** centered on the viewport — circular white-to-cream div with a bold black serif "8" (Bodoni Moda 900). A **recessed-window ridge** (`#answer-overlay::after`) draws a beveled rim — highlight along the top edge, shadow along the bottom — masked to a thin ring near the circle's edge, plus a 2px dark groove via box-shadow, so the window reads as sunk into the ball like a real 8-ball. On `.waking` and `.answering`, the bg transitions to deep navy (#0a1340 → #02041a) and the "8" fades out. The dark-navy inverted-triangle clip-path element scales/fades in (no rotation), and luminescent white answer text staggers in on top.
- **Bottom UI:** cream paper `#hint` label (only renders when non-empty), italic Bodoni question input with `ask the ball…` placeholder, italic pink **ASK** button (**desktop only** — hidden on touch devices via `@media (pointer: coarse)`), small cream-sticker **Reset** button (cream `#fff6d8` fill, magenta text + border, kawaii-sticker style) — labeled "Enable motion" on iOS until permission is granted.

### What it does
- Tap/click orb, click ASK (desktop), or press Enter in the input → `ask()`.
- iOS DeviceMotion shake (`magnitude > 18`, 1.2s cooldown) also fires `ask()`. Permission gated via the "Enable motion" button on iOS 13+; on grant, the button rewires into a **Reset** that snaps the ball back to its landing state.
- On non-iOS, motion is auto-registered and the **Reset** button shows immediately.
- **Shake hint toast (`#shake-toast`):** a one-time Y2K pink sticker ("psst — shake your phone bestie 🤳") floats just above the input/button stack on **mobile only**. It's shown via `showShakeToast()` *only once motion is actually live* — immediately on Android, after the iOS permission grant — so it never tells the user to shake before shaking works. `dismissShakeToast()` (called at the top of `ask()`) fades it out on the first shake/tap/Enter and it does not return. Gated by `isTouch = matchMedia('(pointer: coarse)')` + `toastShown`/`toastDismissed` flags.
- The typed question doesn't affect the answer (still random from `ANSWERS`) — it's pure ritual.

### Locked content
- **21 custom snarky answers** in `ANSWERS` (block 1, default side). Keep the deranged-but-affectionate voice.
- **12 "say this, not that" pairs** in `REHAB` (block 1b, rehab side) — `{bad, good}`. Sincere-but-cheeky EQ coaching; keep them short enough to fit the triangle.
- **Single wake line:** `consulting my extremely worn thin patience`. Don't randomize — this is the only one.
- **Post-reveal hint:** `it has spoken ♥`.
- **Title / home-screen name** (all): `my dumbass boyfriend magic 8 ball`.

---

## Two sides / theme system (the "boyfriend rehab" foil)

- **Concept:** Page 1 (default) = her catharsis, snark verdicts, hot-pink Y2K. Page 2 (`#rehab`) = his redemption arc, **"say this, not that"** EQ scripts, calm-blue "rehab" theme. Same black ball, flipped over.
- **One document, two modes.** Not a second HTML file (that would duplicate the whole Three.js engine and break the flip). A `body.rehab` class swaps CSS variables + `body::before` wash + masthead stroke; JS swaps text + the active answer set.
- **`THEMES` config (block 1b)** holds per-side `title / kicker / badge / tag / rmv / link / linkHref / wake / hint`. `applyTheme(m)` writes those into the masthead, kicker, three stickers, and `#side-link`, and points `activeAnswers` at `ANSWERS` (default) or `REHAB` (rehab), plus sets `currentWake` / `currentHint` (read by `ask()` and the loop).
- **`REHAB` (block 1b)** is an array of `{bad, good}` pairs. **Only the `good` (EQ rewrite) line is displayed** — the struck-through `bad` instinct + arrow were removed per design; `bad` is retained in the data in case it's wanted back. `showRehabAnswer()` streams `good` via the shared `streamChars()` glow helper, then `fitAnswerToTriangle()`. `revealPending()` dispatches: object → rehab renderer, string → `showAnswerHTML()`.
- **The flip (block 7b + `S.FLIPPING`):** `#side-link` is an `<a href="#rehab">`/`<a href="#home">`; clicking changes the hash → `hashchange` → `flipSide(mode)`. `flipSide` runs the same -360° turn-over as WAKING; at the **midpoint (p≥0.5, backface hidden)** it calls `applyTheme(pendingMode)` so the swap is unseen, then lands on IDLE (the "8" window) on the new side. `modeFromHash()` + the initial `applyTheme(modeFromHash())` make each side a real shareable URL with working back/forward.
- **Rehab visual:** `body.rehab` retints to calm blues (`--hot:#2f7fd6` etc.), a cool `body::before` wash, deep-blue masthead stroke. The black orb and blue answer triangle are unchanged (shared by both sides). The magazine **photo is the same** — only the wash recolors the mood (no second bg image).

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
- **3D facet look (lighting only, no transform):** `.tri` is a beveled rim (directional gradient, lit top → dark point); `.tri::before` is a raised inner facet (inset clip-path triangle) with a top specular highlight; `.tri::after` pools a core shadow toward the point. `.ans` is `position:relative; z-index:2` to sit above both pseudo-layers. Kept transform-free on purpose so it doesn't reintroduce the double-turn-over.
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
| 8 | Device motion + reset + shake toast | shake detection + iOS permission. `reset()` and `becomeResetButton()` rewire the motion button into a Reset action after grant (or immediately on non-iOS). `showShakeToast()`/`dismissShakeToast()` drive the mobile-only `#shake-toast` hint, fired when motion goes live and cleared on first `ask()`. |
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
- **Background must NOT use `background-attachment: fixed`** — on iOS Safari that sizes the cover image to the layout viewport and leaves a white bar at the bottom. The photo is painted in **two places**: (1) a dedicated `#bg-photo` fixed layer (`z-index:0`, `width:100vw; height:100lvh`, `center/cover`) fills the in-viewport content area; (2) the **same image on the `html` root** (`center/cover`) — the browser propagates the root background across the whole canvas, including the iOS safe areas behind the status bar / home indicator, which a `position:fixed` layer does *not* cover. Page is `height:100dvh`; `html` keeps cream `var(--paper-warm)` as a load-failure fallback only.
- **iOS Safari chrome can't be painted by the page.** In a normal Safari *tab*, the top status bar and the bottom URL toolbar are browser UI — the root-bg trick fills behind the status bar, but the bottom URL bar stays. The genuinely edge-to-edge, no-chrome experience is the **installed PWA** (Add to Home Screen → standalone, where `viewport-fit=cover` + `apple-mobile-web-app-status-bar-style: black-translucent` let the photo go fully full-screen). This is also the intended iteration-3 form factor.
- `*results may vary` sticker has `.rmv` class with a media query bumping `bottom` from ~108px to ~248px to clear the input + ASK + Reset stack at ≤600px wide.
- Procedural magazine `.strip / .issue / .pgnum` fragments are hidden everywhere via `#mag-bg{display:none}` since the photo replaced them — but the CSS is retained for easy revert.
- Question input has `autocomplete="off"` and blurs itself on Enter so the iOS keyboard dismisses.
- **The ASK button is hidden on touch devices** (`@media (pointer: coarse){ #shake{display:none} }`) — on mobile you tap the orb or shake the phone. Desktop keeps the ASK button.
- **Top stickers must share the masthead's `env(safe-area-inset-top)` offset.** The masthead is offset by `env(safe-area-inset-top)`, so in standalone PWA (inset ≈ 59px) it drops below the notch. Any sticker pinned near the top with a flat `top:%` will NOT move with it and will collide (the `100% ACCURATE` badge overlapped the kicker pill until its top became `calc(18% + env(safe-area-inset-top))`). In Safari the inset is ~0 so this is a no-op there. If you add more top-anchored stickers, give them the same `+ env(safe-area-inset-top)`.
- On iOS, the Reset button text starts as "Enable motion" until the user grants permission; then the same button instance is rewired to call `reset()` with the label changed.
- The `#shake-toast` shake hint is **mobile-only and motion-gated** (only shown once `devicemotion` is registered), so it never appears on desktop and never prompts a shake before iOS permission is granted. Positioned `bottom:195px` to float above the input + button stack. One-time per page load — does not reappear on Reset.

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
2. **Finish smoke test.** Desktop ✓. Still TODO: mobile browser shake on a real phone (motion permission + Reset relabel; confirm ASK button is hidden), PWA install (Add to Home Screen → standalone launch), offline (airplane-mode launch of installed PWA).
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
