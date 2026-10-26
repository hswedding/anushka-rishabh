# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install
npm run dev        # Vite dev server → http://localhost:5173
npm run build      # production build → dist/
npm run preview    # serve the built dist/ (--host)
npm run cf:dev     # build + serve dist/ on Cloudflare's local runtime (wrangler dev, :8787)
npm run deploy     # build + wrangler deploy
./scripts/new-couple.sh <couple>-<bride|groom>   # start a family's repo from this base
```

There is no test runner, linter, or type checker configured — `dev`, `build`, and `preview` are the only scripts. Verify changes by running the dev server and viewing the page.

## Setting up a couple's repo

When asked to build one family's invitation (often in an empty `hswedding/invite-<couple>-<bride|groom>` repo), follow **`docs/NEW-COUPLE-GUIDE.md`** step by step: it covers creating the repo from this base with full history, every `src/data.js` field and what actually renders, media rules (H.264 MP4 ≤ 25 MiB), design, local checks, the Cloudflare deploy and the hand-over. The couple's answers arrive in the format of **`docs/CLIENT-INTAKE.md`**, which maps each answer to its `data.js` field.

## What this is

This is **invite-base-single**: the base for families who want their own site, so the bride's and groom's families each get a separate repo cloned from it (see README "Starting a new couple"). It was cloned from `hswedding/invite-base` (the shared bride/groom/joint base) with full history; the differences are a single `host` family block (with `host.side: 'bride' | 'groom'`) instead of `families`, no `side` URL param, events without a `side`, and no hosting-side switch in the builder. Fixes made in `invite-base` can be merged here (`git fetch` it as a remote, then merge and resolve the `host`/`families` differences). Family repos keep this repo as the `upstream` remote and pull fixes with `git merge upstream/main`, so keep base changes generic and couple-specific work in `src/data.js`, `src/styles/tokens.css`, `public/` and `src/custom/`.

A single-page, mobile-first digital wedding invitation. React 19 + Vite, GSAP + Lenis for animation/scroll, **no backend and no router**. One deployed site serves every guest variant; which sections and functions a guest sees is encoded entirely in the URL path. Deployed as a **Cloudflare Worker** with static assets (`wrangler.jsonc`: `assets.directory = ./dist`, `not_found_handling = single-page-application` so the secret pages and `/<token>` guest links resolve to `index.html`). The only Worker code is `worker/index.js`, run first for media paths only (`run_worker_first`): it adds HTTP Range / 206 support, which Safari needs for `<video>`, using file sizes the `mediaSizes` Vite plugin writes to `worker/media-sizes.json` at build (git-ignored; build before `wrangler dev`/`deploy`). No analytics package — `main.jsx` adds the optional Cloudflare Web Analytics beacon from `site.cloudflareAnalyticsToken`, on guest invitation views only.

## Architecture

**URL path is the state.** `src/lib/config.js` is the core: `main.jsx` calls `parseRoute(pathname)` once and renders one of three pages — `Builder` (path = `config.links.builder`), `App` with an `invite` object (the ready-made `config.links.all` link, or a guest token), or `Closed` (bare `/`, unknown or tampered paths). Query strings are ignored on purpose so guests can't widen their own link. There is no store or context and no URL watching.

A guest token is a query string (`fns`, `preset`, `to`, `countdown|photos|venue|rsvp=0` — see the header comment in `config.js`) prefixed with an FNV checksum, XOR-scrambled with a fixed `KEY` and base64url-encoded (`encodeToken`/`decodeToken`). **Never change `KEY` or a preset key** — every link already sent depends on them. `decodeLegacy` still accepts the old plain-base64 `/<slug>` links (a `side` in them is ignored). `buildQuery` → `sharePath` is the builder's direction; `sharePath` returns `config.links.all` when the state is exactly every function with every section. Presets in `data.js` carry an optional `hide` (sections turned off); `presetState(key)` expands one into builder state. The hosting side is fixed by `host.side`; `invite.side` still exists (always `host.side`) so sections and `orderedCouple()` stay the same as in invite-base. Each family's site needs its own `config.links` ids — `scripts/new-links.mjs` writes fresh ones (`new-couple.sh` runs it).

The builder (`src/sections/Builder.jsx`) live-previews by loading the real invitation in an iframe at `<sharePath>#preview`; `#preview` makes `App` skip the envelope, start muted, and skip analytics.

**Content vs. code separation is deliberate.** All copy, names, the hosting family (`host`), dates, venues, phone numbers, events, presets, global config and page meta (`site`: title, description, WhatsApp/OG preview, `noindex`) live in `src/data.js` — placeholders are marked `⟵ EDIT`. Section/animation components read from it and should not hardcode content. Event `id`s in `data.js` are the vocabulary for the `fns` param and presets; renaming or removing one silently invalidates existing shared links. `sanitiseIds` drops unknown ids and re-sorts to canonical chronological order (`event.order`), so unknown/stale ids fail closed rather than erroring.

**Render flow** (`src/App.jsx`): an `Envelope` gate covers the page and locks `body` scroll until opened (skipped in the builder's `#preview`). On open, a `Lenis` smooth-scroll instance is created and synced to GSAP `ScrollTrigger` via `gsap.ticker`; it is exposed as `window.__lenis` — **programmatic scrolls must go through `lenis.scrollTo`**, not `window.scrollTo`, or they fight the smooth-scroll loop. Sections are conditionally mounted from `invite.sections`. `useReducedMotion` disables Lenis and GSAP effects for users who prefer reduced motion — honor it in any new animation.

**Shared GSAP instance.** Always import gsap/ScrollTrigger/useGSAP from `src/lib/gsap.js` (plugins are registered there once) — never import from `gsap` directly in components.

**Directory map:** `src/sections/` = full-width page scenes (Hero, Countdown, Photos, EventFilms, Venue, Rsvp, Footer, Envelope) plus the standalone Builder and Closed pages. `src/components/` = reusable pieces (Petals, ScratchCard, Icons). `src/styles/` = plain CSS; `base.css` `@import`s `tokens.css` (design tokens/CSS variables) and `fonts.css`, and `main.jsx` also imports `components.css`. Icons are keyed by string in `Icons.jsx` and referenced by name from event data.

## External integrations (no backend)

- **RSVP and sharing go through WhatsApp deep links** built in `config.js` (`buildRsvpWhatsApp`, `buildWhatsAppShare`) — the RSVP form does not POST anywhere; it opens a `wa.me` link to `host.rsvpWhatsApp` (fallback `config.rsvpWhatsApp`). There is no server to receive submissions.
- **Media** lives in `public/` (`/videos/*.mp4` referenced by event `video` fields and `config.envelopeVideo`, `og-image.jpg` via `site.shareImage`). Cloudflare caps each static file at 25 MiB.
- **Page meta**: `index.html` has a `<!--SITE_META-->` placeholder; the `siteMeta` plugin in `vite.config.js` fills it from `site` in `data.js` at build (restart the dev server after editing `site`).
- **Custom sections**: `src/custom/index.js` exports `[{ id, Component }]`, rendered after RSVP, before Footer.

## Platform notes

Windows + Vite: `vite.config.js` ignores `**/.vs/**` and `**/.git/**` in the dev watcher — Visual Studio's `.vs` index locks `.vsidx` files and crashes the watcher (EBUSY) otherwise. `cssCodeSplit` is off (single CSS bundle) and build target is `es2020`.
