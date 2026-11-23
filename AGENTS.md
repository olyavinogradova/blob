# AGENTS.md — Blob game guide

Working notes for any coding agent resuming work on this project. Read this before changing anything: it records decisions already made (many set explicitly by the user) so solved problems stay solved.

## What this is

**Blob** — a full-screen iPhone doodle toy. Open it, a random cloud-like blob
appears, you finish the picture with a brush and eraser.

- Live: https://olyavinogradova.github.io/blob/ (GitHub Pages, deploy from `main` / root)

## Architecture

Single self-contained `index.html` (inline CSS + JS in an IIFE) — **no frameworks,
no dependencies, no backend**. Plus `manifest.json`, `sw.js`, `favicon.png`,
`icons/` (192 / 512 / apple-touch / maskable — the user's own artwork).

Key mechanisms inside `index.html`:

- **Canvas engine**: 
  - transparent canvas over the palette-coloured body background.
  - Brush = `source-over` with `globalAlpha = 1` (fully opaque, covers everything, even black).
  - Eraser = `destination-out` (true erase to background, never white paint).
  - Strokes smoothed with quadratic midpoints; first
  active pointer only; `setPointerCapture` for reliable drag tracking.
- **Shape generator** (`newBlob()`): picks one of four families — classic
wobble / stretch+tilt / crescent / hook — each with sub-species;
`rollShape()` builds the recipe and its perceptual signature, `pickShape()`
enforces the 5-shape memory rule (details in design decision 1).
- **Sizing (rearchitected 2026-11-23)**: the body is a flex column sized to the
dynamic viewport (`height:100dvh`, `100%` fallback); the canvas fills it above
the toolbar, so canvas bottom === toolbar top structurally. `setup()` measures
the canvas's real `getBoundingClientRect()` (never `innerHeight`, which
disagreed with the fixed-position UI at launch and between browser/PWA modes)
× `devicePixelRatio` (capped 3). A `ResizeObserver` on the canvas (debounced
150 ms; `resize` event as fallback) re-fits and draws a fresh blob whenever
the box genuinely changes — including the iOS launch transient that resize
events miss in standalone. Still deliberate: the app must always fit the real
screen; drawing preservation across size changes is NOT wanted.
- `limitY` **= canvas bottom = toolbar top = hard canvas edge**: in the flex
column the canvas element ends where the toolbar begins, so `limitY = H` —
no measured offsets and no sanity floor (the old `max(rect.top, H*0.5)`
floor was what let strokes paint below a misplaced toolbar). `clampPoint()`
clamps stroke centres to `[r, W-r]` × `[r, limitY-r]`, so lines hug all
edges at full thickness. Recomputed in `newBlob()`.
- **Undo**: `toDataURL()` snapshot pushed on every `pointerdown` (cap 15);
undo pops and redraws. Memory-only, cleared on `newBlob()`.
- **Screenshot**: composes background colour + live canvas into a PNG cropped at
`limitY` (toolbar strip excluded by design), shown in an overlay. Save goes
through `navigator.share({files})`; iOS 16+ may omit "Save to Photos" from the
share sheet, so the overlay image supports long-press → "Add to Photos".
Desktop fallback: plain download of `blob.png`.
- **Service worker** (`sw.js`): versioned cache (`blob-cache-<CACHE_VERSION>`),
network-first for navigations (deployed updates arrive on next online load),
cache-first for same-origin assets, old caches deleted on activation, icons
cached best-effort. All paths relative — works under the Pages `/blob/` subpath.
**Bump** `CACHE_VERSION` **for every game change** so installed PWAs update.

## Design decisions (user-set — do not quietly change)

1. **Blob figures only**: smooth, cloud-like, rounded. NO sharp/angular mode,

   NO outline/stroke around the figure (filled silhouettes only — the hook
    family is a thick *filled* stroke, not a contour). The silhouette comes
    from one of four randomly picked "families" (weights 40/20/20/20), all
    solid-fill and corner-free (user request 2026-11-23: more variation, incl.
    C and J shapes):
   - *classic* — radius modulated by 2–3 random sine harmonics (k 1–5; a k=1
   lobe makes eggs/pears) + 0–3 edge lumps;
   - *stretch* — classic wobble squashed/stretched (height factor 0.75–1.35,
   width = 1/height) plus a random tilt up to ~±32°;
   - *crescent* — lumpy disc with organic bite(s) carved out via
   `destination-out`. Sub-species by bite geometry (added 2026-11-23 after
   user feedback that crescents looked alike): *moon* (deep side bite),
   *ring* (centred bite → donut), *bigbite* (wide-open C), *nibble* (small
   rim bite, 35% chance of a second one). The bite is clamped so it can
   never erase the whole figure.
   - *hook* — thick round-ended stroke along a curve with a slow thickness
   drift, tilted up to ~±35°. Sub-species by bend structure (added
   2026-11-23 after user feedback that J's looked alike): *j* (curl at the
   bottom), *cane* (curl at the top), *snake* (S-curve, fat middle,
   tapered ends).
    Plus ~30% chance of a small detached puff (all families). Goal:
    variative, imagination-sparking.
    **Shape memory (user rule, 2026-11-23)**: the last 5 generated shapes are
    remembered; a new one must differ from all of them. Signatures are
    perceptual — family + sub-species, with mirrored/rotated variants counting
    as the same shape — so same-looking cousins are blocked, not just exact
    repeats. Repeating the previous blob's family is also avoided when
    possible.
2. **Six fixed palettes** (Playful Garden, Candy Universe, Electric Nature,

   Midnight Cinema, Paper & Ink, Neon Lagoon — added 2026-11-23 at the user's
    request) — constants at the top of the script. Per blob:
    random palette, random distinct colour for the blob, random distinct colour
    for the background (body bg + `--paper` + `theme-color` meta update); the
    remaining seven — **including the blob's own colour** (user rule 2026-11-23:
    "add blob colour to the palette") — become the swatches; default selection =
    first swatch.
3. **Toolbar**: circled floating pill. Since 2026-11-23 it floats via margins

   (`0 12px calc(6px + env(safe-area-inset-bottom))`) as the last child of the
    body flex column — same visual as the old `position:fixed` version, but it
    can never desync from the canvas (a fixed-position toolbar measured against
    a JS-sized canvas was the root cause of the PWA "toolbar too high / brush
    below toolbar" bug). The `env()` part self-adapts: home-indicator zone in
    the installed PWA, zero above Safari's own toolbar in the browser. Do NOT
    dock it flush (tried, rejected: collided with Safari's bar / felt wrong in
    PWA).
4. **Icon-only buttons** in the toolbar (no "Brush"/"Eraser" words), long size

   slider, separate remembered sizes per tool (defaults 8 / 28).
5. **Top-right buttons**: Undo ↶, New blob ✦ (sparkle), Screenshot 📷 — in that

   order. There is deliberately NO Clear button (screenshot replaced it; New blob
    covers fresh starts).
6. **No rotation special-casing**: size changes just re-fit + fresh blob.
7. Title/name: **Blob** everywhere (manifest, apple metas, page title).

## Workflow rules (user-set — hard rules)

- **Never** `git push` **or publish without the user's explicit approval.** Commit
locally, then ask. (Standing rule from 2026-11-22.)
- The user asks for a `safety.md` **release review** before publishing rounds —
run the checks from `safety.md` in the repo folder and report in its format
(blockers / warnings / passed, verdict).
- **Commit identity**: `olyavinogradova <blob@example.com>` set repo-local
- `.gitignore` is **deny-by-default** (`/`* then `!`-whitelist of the site
  files). A new file is unpublishable until a `!/path` line is added.
  `AGENTS.md` and `safety.md` are published (user decision 2026-11-23);
  `blob-icon-assets/` and `.zcode/` stay local.
- **Verification method**: serve locally (`python3 -m http.server 8123`) and test
in the ZCode in-app browser at iPhone viewport 390×844 (pointer drags draw;
canvas pixels can be sampled via `evaluate` for ground truth — vision models
misjudge colours/positions, prefer programmatic checks). The user reports
real-device bugs via phone screenshots — analyze them, but first check whether
their PWA is on the latest version (SW updates apply one launch later; Pages
also caches ~10 min).
- Deploy = `git push` (after approval) → Pages rebuilds in ~1 min → verify live
HTML markers with `curl`.
- The user is a terminal/git beginner: explain commands plainly, show real
output, never assume they track local repo state.

## Tested vs not

Tested locally (browser, iPhone viewport): all drawing/eraser/undo/clamp/palette/
screenshot behaviour, SW registration + offline reload, `/blob/` subpath hosting;
four-family generator + 5-shape memory (40-tap stress test: 40/40 distinct,
zero bound violations; 8-screen pairwise check: all different); dvh flex-column
layout round (canvas bottom === toolbar top at every tested size, strokes clamp
at the canvas edge, resize/restore re-fits with a fresh blob, screenshot export
dimensions unchanged).
Device-only (rely on user feedback): Add to Home Screen flow, share sheet on iOS,
real safe-area insets.

## Known caveats

- The ~34 px home-indicator zone is Apple's gesture area — nothing can paint
there; the pill sits just above it.
- iOS 16+ share sheet sometimes lacks "Save to Photos" — long-press fallback
exists in the overlay.
- If the blob looks wrong in PWA mode, suspect a stale service worker before
suspecting the code.
- Hook/puff placement uses fractions of the drawable height (top `H*0.12`,
bottom `H*0.62`, puff `H-270`). Since the 2026-11-23 layout round, `H`
excludes the toolbar entirely, so hooks and puffs stay inside the canvas by
construction — the old landscape overlap concern is gone.
