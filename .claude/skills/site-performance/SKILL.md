---
name: site-performance
description: Make a wedding-invitation site (or any media-heavy single page) load faster with no visible or audible quality loss — audit, VMAF-gated film encoding, envelope poster, near-lossless WebP art, favicon, load-order and caching fixes, then verification. Use when asked to optimise performance or load time, and whenever a couple's films, envelope video, decor art or favicon are added or replaced.
---

# Site performance playbook

The rule: **nothing a guest can see or hear gets worse.** Every lossy step is
measured against the original and only kept if it passes a quality gate. Where
something can't be shrunk without loss, change *when* it loads instead.

What matters most is the **envelope's critical path**: the first screen is the
envelope, so until the guest taps, the only downloads should be the HTML, JS,
CSS, fonts, the envelope poster/film and the first-screen art. Everything else
waits until it's needed, and arrives before the guest gets there.

Scripts live in `scripts/` next to this file (paths below are relative to it).
Install once per checkout — it fetches ffmpeg (built with VMAF) and sharp into
`scripts/node_modules`, which is git-ignored:

```bash
npm install --prefix .claude/skills/site-performance/scripts
```

## 1. Audit — find what costs the most

1. `node scripts/audit.mjs <project>` — every film, audio file and image in
   `public/` and `src/` with codec, bitrate, index position, x264 CRF, and a
   to-fix list.
2. `npm run build` — read the main JS chunk size. If it's over ~150 KB gzip or
   Vite warns about a >500 KB chunk, find the heavy packages with this plugin
   in a throwaway config (prints unminified bytes per package):
   ```js
   // vite.measure.config.js — npx vite build -c vite.measure.config.js
   import { mergeConfig } from 'vite'; import base from './vite.config.js';
   export default mergeConfig(base, { plugins: [{ name: 'sizes', generateBundle(_, b) {
     for (const c of Object.values(b)) if (c.type === 'chunk') { const by = {};
       for (const [id, m] of Object.entries(c.modules)) { const k = id.split(/node_modules[\\/]/)[1]?.split(/[\\/]/).slice(0, id.includes('node_modules/@') || id.includes('node_modules\\@') ? 2 : 1).join('/') || 'src'; by[k] = (by[k] || 0) + m.renderedLength; }
       console.log(c.fileName, Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 12)); } } }] });
   ```
3. In the browser (mobile size), open a guest link and **before tapping** run
   `performance.getEntriesByType('resource').map(r => decodeURIComponent(r.name))`.
   Anything beyond the critical-path list above is a load-order bug (step 5).

## 2. Films — VMAF-gated encoding

```bash
node scripts/films.mjs --out optimized public/videos/<event films>.mp4
node scripts/films.mjs --envelope --out optimized public/videos/envelop.mp4
```

For each film it encodes H.264 (x264 `preset slower`, index up front) at a
few CRFs, scores each with **VMAF** against the original, and keeps the
smallest that passes. If that saves under 15%, it only moves the index to the
front, which is lossless. Results go to `optimized/` with a `report.json`.
Check the numbers, then copy the files over the originals. Keep the same file
names so `data.js` doesn't change.

| | Gate | Typical pick |
|---|---|---|
| Event films (shown ~1:1 on phones) | full-frame VMAF mean ≥ 96.7, 1%-low ≥ 95.4 | CRF 20, −25…50% |
| Envelope (`--envelope`) | VMAF of the **phone view**: the 390×844@3x centre crop, upscaled, mean ≥ 95.3, 1%-low ≥ 93.5 | CRF 14 for 1080p landscape, −76%; CRF 20 for 1080×1920 portrait (barely zoomed), −53% |

VMAF ≥ 95 is generally considered indistinguishable from the original. An
identical copy scored ~97.6 on this content, so these gates sit within about
a point of "no change". The envelope gets the phone-view test because a
landscape film cover-fit on a portrait phone shows only a ~500 px-wide centre
strip, enlarged 2.3×.

Things the audit typically finds, and what to do about them:
- **Index (`moov`) at the end** (most editors, Clipchamp, Canva): the browser
  must fetch the file's end before it can play. This costs nothing to fix;
  every output gets `+faststart`.
- **Tiny keyframe interval** (e.g. `keyint=18`): bloats the file for nothing.
  Re-encoding fixes it.
- **Already at CRF 23 with normal keyframes**: nothing to gain without
  quality loss, so the script only fixes the index.
- **Not H.264**: Safari only plays H.264 MP4, so the film must be re-encoded.
  The script forces it.
- **Untagged HD colour**: the `--envelope` run tags it BT.709. Browsers
  already assume BT.709, so pixels don't change, but every browser then draws
  it identically and the poster matches.
- **Event films end on their last frame**: trim fades and outros first
  (`-frames:v <n>`), so the frame the film holds shows all the details.

Keep resolution. A 1080-wide portrait film is ~3× the CSS width on a phone,
and the envelope is already upscaled. Don't use AV1 or WebM: low-end Android
phones lack a hardware decoder, and Safari support is patchy.

## 3. Envelope poster

```bash
node scripts/poster.mjs public/videos/envelop.mp4 public/videos/envelop-poster.webp
```

The poster is frame 0 as WebP at quality 95 (~60 KB, ~52 dB from the frame).
It's converted with the matrix browsers use (BT.709 for HD; checked by
drawing the video into a canvas in Chrome: mean difference 0.03 levels), so
nothing jumps when playback replaces it. Run it on the **final** film, every
time the envelope film changes. Wire it as `poster=` on the `<video>` and
preload it from `index.html` (step 5).

## 4. Images and favicon

```bash
node scripts/images.mjs webp src/Images/decor/*.png src/Images/ganesha.png
node scripts/images.mjs favicon <logo.png> public/favicon.png [--bg "#fdf9ef"]
```

- **Decor art: near-lossless WebP.** No colour channel moves more than about
  4/255, and files come out ~55% smaller than PNG. Plain lossless saves only
  ~33%. Standard lossy WebP at q90 leaves edge errors of up to 50/255, so
  don't use it. Then point the imports at `.webp` and `git rm` the PNGs (git
  history keeps the originals).
- **Don't downscale art** already ≤ 3× its largest CSS width.
- **Favicon: 180×180 PNG.** A full-size logo here costs every guest ~1 MB.
  iOS paints transparent areas black, so use `--bg` with the page colour.
- **Photos:** already 1200 px JPEG q80 via `scripts/compress-photos.ps1`.
  Leave them; converting again is lossy on lossy.
- **Music:** leave the file alone, since re-encoding MP3 is lossy on lossy.
  Fix *when* it loads instead (step 5).

## 5. Load order — the code side

invite-base already does all of this; the files named are the reference
implementation. For another codebase, port the pattern.

| Pattern | Why | Reference |
|---|---|---|
| Poster preloaded from `index.html`, skipped for `#preview` / no-envelope links | Opening screen paints whole, in parallel with the JS | `vite.config.js` `<!--ENVELOPE_POSTER-->`, `Envelope.jsx` |
| Music `preload='none'`, switched to `'auto'` on the envelope **tap** | Doesn't compete with the envelope film, yet is buffered by the reveal | `hooks/useBackgroundMusic.js`, `unlock` via `onTap` in `Envelope.jsx` |
| Photos and the RSVP phone field wait for the envelope to open (`ready`) | The photo reel sits inside the browser's lazy-load distance, and the phone field fetches a JS chunk and a flag from another host — all competed with the envelope film | `sections/Photos.jsx`, `sections/Rsvp.jsx` |
| Event films `preload="none"`, downloaded after the envelope opens, a screen ahead or in page order | They used to start loading all at once behind the envelope | `sections/EventFilms.jsx` |
| Map iframe gets its `src` only when ~a screen away | A reveal tween leaves it `visibility:hidden`, and **browsers load hidden iframes immediately even with `loading="lazy"`**. Google Maps is heavy | `sections/Venue.jsx` |
| Heavy below-the-fold library `React.lazy` with a **same-size fallback** | `react-phone-number-input` was a third of the JS; the same-size fallback avoids layout shift and stale ScrollTrigger positions | `sections/Rsvp.jsx` |
| Host-only pages `React.lazy` | Guests never download the builder | `main.jsx` |
| Fonts self-hosted (`@fontsource`), unused families dropped | Removes two render-blocking cross-origin connections (~375 ms seen) | `styles/fonts.css` |

Watch for any element that animates in with `autoAlpha` / `visibility:hidden`
and holds an iframe or lazy image: `loading="lazy"` won't save it.

## 6. Delivery

- **Hashed `/assets/*`:** `Cache-Control: public, max-age=31536000, immutable`
  via `public/_headers` on Cloudflare, or a `headers` entry in `vercel.json`
  on Vercel.
- **Leave non-hashed media on revalidation** (the default), so a replaced
  film reaches guests at once.
- **Cloudflare static assets answer Range requests with a full 200**, and
  Safari then refuses to play `<video>`. invite-base's `worker/index.js` adds
  206 responses. Any new media folder or extension must be added to
  `run_worker_first` and the `mediaSizes` plugin.
- **Cloudflare caps each static file at 25 MiB**; the audit flags anything
  larger.
- **Missing files are served as `index.html`** by the SPA fallback. A
  referenced but absent `og-image.jpg` or sound effect therefore "loads" as
  HTML, so check every path in `data.js` / `index.html` exists.

## 7. Verify (never skip)

1. `npm run build`. The main chunk should be no larger than before, and there
   should be no chunk warning.
2. Dev server at mobile size (375×812) on a guest link:
   - **Before the tap:** the poster shows instantly; resources are only the
     critical-path set (no music, no event films, no map).
   - **After the tap:** the music request starts while the envelope film
     plays.
   - **After the reveal:** each film is `readyState` 4 before it scrolls into
     view (`[...document.querySelectorAll('video')].map(v => v.preload + ':' + v.readyState)`).
   - **RSVP:** the phone field is in place, with the same height as the
     fallback.
   - **Map:** loads only on approach.
   - **Console:** no errors.
3. Look at every re-encoded film and art piece on the page once with your own
   eyes. The numbers decide the setting; your eyes confirm it.
4. After deploy: `curl -sI <site>/assets/<file>` shows the immutable header,
   and `curl -sI <site>/videos/<film> -H "Range: bytes=0-1"` returns 206 on
   Cloudflare.

## Reference result (Hemant & Sukriti, Oct 2026)

| | Before | After |
|---|---|---|
| Envelope film | 12.6 MB, 11.5 Mbps, index at end | 3.0 MB, CRF 14, phone-view VMAF 95.5 |
| Five event films | 42 MB | 29 MB (CRF 20, VMAF ≥ 96.8) |
| Decor art | 1,050 KB PNG | 476 KB near-lossless WebP |
| Favicon | 853 KB | 26 KB |
| JS before first screen | 183 KB gzip | 132 KB gzip |
| Before the tap | envelope + music + 9 films + Google Maps | envelope, poster, first-screen art only |
