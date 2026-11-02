# invite-base-single — one-family wedding invitation base

The base for families who want **their own site**: the bride's family and the
groom's family each get a separate invitation, one repo each, both started
from this base. (For one shared site with bride/groom/joint links, use
[`invite-base`](https://github.com/hswedding/invite-base) instead.)

Each site speaks in one family's voice: `host.side` in `src/data.js`
(`'bride'` or `'groom'`) puts that family's child first, and the invitation
builder has no bride/groom/joint switch. A single-page, mobile-first
digital wedding invitation (React 19 + Vite, GSAP + Lenis, no backend),
hosted free on **Cloudflare Workers static assets**. One site serves **every
guest variant**: which functions each guest sees lives in the link.

It currently carries the bride side of the Hemant & Sukriti invitation
(Malhotra family) as its working example, identical to that wedding's
`?side=bride` page.

## Run it

```bash
npm install
npm run dev        # Vite dev server → http://localhost:5173
npm run build      # production build → dist/
npm run cf:dev     # build + serve dist/ on Cloudflare's local runtime → http://localhost:8787
npm run deploy     # build + deploy with Wrangler (needs `npx wrangler login` once)
```

## Starting a new couple

Full procedure: **[docs/NEW-COUPLE-GUIDE.md](docs/NEW-COUPLE-GUIDE.md)**. The message to send a couple for their details, with where each answer goes: **[docs/CLIENT-INTAKE.md](docs/CLIENT-INTAKE.md)**.

Each family gets its **own repo**, a full clone of this one, so its site can
be customised freely while still being able to pull fixes from the base.
Name them after the couple plus the side:

```bash
./scripts/new-couple.sh aarav-diya-bride   # → hswedding/invite-aarav-diya-bride, host.side: 'bride'
./scripts/new-couple.sh aarav-diya-groom   # → hswedding/invite-aarav-diya-groom, host.side: 'groom'
```

The script clones the base (history kept), renames the remote to `upstream`,
sets the Worker name in `wrangler.jsonc` to `invite-<slug>`, writes fresh secret
link ids into `config.links` (`scripts/new-links.mjs`), commits, and
pushes a new private repo if the GitHub CLI is logged in (otherwise it prints
the two commands to run). Don't use GitHub's "Use this template" button: a
template copy starts with unrelated history and can never merge base fixes.

### Where a couple's changes go

Keeping to this layout means `git merge upstream/main` only conflicts where
you meant to diverge:

| What | Where |
| --- | --- |
| Names, hosting family (`host`, incl. `host.side`), events, venues, phones, RSVP number | `src/data.js` |
| Page title, description, WhatsApp preview, `noindex`, analytics token | `site` in `src/data.js` |
| Envelope film and its poster, Ganesha image on/off, music | `config` in `src/data.js` |
| Secret builder and ready-made link paths | `config.links` in `src/data.js` (fresh ids: `node scripts/new-links.mjs`) |
| Palette, fonts, spacing | `src/styles/tokens.css`, `src/styles/fonts.css` |
| Films, music, preview image (`og-image.jpg`, 1200×630) | `public/` (max 25 MiB per file on Cloudflare) |
| Couple photos (the swipeable reel after the countdown) | `public/photos/` (shrink with `scripts/compress-photos.ps1`) + `photos` in `src/data.js` |
| Decor art | `src/Images/` (swap files, keep names) |
| One-off sections or animations | `src/custom/`, listed in `src/custom/index.js` |

Edit other base files only when the couple's design truly needs it.

### Films

Encode a new film for `public/videos/` as H.264 with its index up front, so it
starts streaming at once (CRF 20 is visually lossless here; use 14 for the
envelope film, which phones show zoomed in):

```bash
ffmpeg -i in.mp4 -c:v libx264 -preset slower -crf 20 -pix_fmt yuv420p -c:a copy -movflags +faststart out.mp4
```

An event film plays once and then holds its last frame, so that frame must
show all the details. If a film fades them out or has an outro, cut it at the
last good frame (`-frames:v <n>` in the command above, `n` = frames to keep).

`config.envelopePoster` (`videos/envelop-poster.webp`) is the envelope film's
first frame: it shows, and is preloaded, before the film loads. Re-export it
whenever the envelope film changes, or the opening screen jumps on tap:

```bash
ffmpeg -i envelop.mp4 -frames:v 1 -vf "scale=in_color_matrix=bt709:in_range=tv:out_range=pc,format=bgra" -c:v libwebp -quality 95 envelop-poster.webp
```

Event films load nothing until the envelope is open; then each one downloads
in full, one at a time in page order, so it is on the phone before the guest
reaches it (a film reached earlier streams straight away). A film starts when
40% of it is on screen, plays through once without pausing and holds its last
frame; if the phone blocks autoplay (Low Power Mode, data saver) a **Play
film** button appears. The music buffers from the envelope tap. Keep new
media off the envelope's critical path, and keep films lean: a guest's phone
downloads every film on their link.

### Pulling a base fix into a couple's repo

```bash
git fetch upstream
git merge upstream/main
```

## Hosting on Cloudflare (free)

`wrangler.jsonc` serves `dist/` as static assets and sends unknown paths (the
secret pages and guest links) to `index.html`. Requests to static assets are
free and unlimited.

Films and music (`/videos/*`, `*.mp4`, `*.mp3`) go through a tiny Worker,
`worker/index.js`, that answers HTTP Range requests with `206 Partial
Content`. Cloudflare's asset server returns whole files to Range requests,
and Safari on iPhone/Mac won't play video served that way. The Worker needs
each file's size, which the build writes to `worker/media-sizes.json`
(generated, git-ignored), so always deploy via `npm run build` first. These
media requests count towards the free plan's 100,000 Worker requests a day.

`public/_headers` lets browsers cache Vite's hashed `/assets/*` bundles for a
year (a changed file always gets a new name); everything else revalidates.

One-time per repo, in the Cloudflare dashboard:

1. **Workers & Pages → Create → Import a repository** → pick the repo.
2. Build command `npm run build`, deploy command `npx wrangler deploy`
   (both are detected automatically).
3. The Worker name must match `name` in `wrangler.jsonc`. The site goes live
   at `https://<name>.<your-subdomain>.workers.dev`.
4. Optional: **Settings → Domains & Routes** to add the couple's own domain.

Every push to `main` redeploys. Pushes to other branches get a stable preview
URL, handy for sending a couple a draft (add a `config.links` path — the bare
root shows the closed page).

**Analytics (optional):** dashboard → Web Analytics → add a site → copy the
token from the snippet into `site.cloudflareAnalyticsToken` in `src/data.js`.

## Sending different guests different functions

There is no public front door: the site root (`/`) only shows an "open the link
you received" page. Every page lives at a secret path, `https://your-site/<id>`,
with the ids set in `config.links` in [`src/data.js`](src/data.js):

| `config.links` | Page |
|---|---|
| `builder` | the **Invitation Builder** (the family only) |
| `all` | the invitation with every function |

Every family's site gets its own random ids (`new-couple.sh` writes them; by
hand: `node scripts/new-links.mjs`). Change an id to revoke it — links already
sent with the old id stop working.

In the builder, pick a quick preset, adjust functions and sections, add an
optional guest name, and check the live phone preview. The share bar has
**Copy link** and **Send on WhatsApp**; the every-function link is under
**Ready-made link**. The hosting side is fixed by `host.side`, so there is no
side switch.

A single-guest link is a scrambled, check-summed token
(`https://your-site/agJWah0d…`) holding the settings below — no backend, the
link *is* the config. A guest can't read or edit it into another variant: a
changed token, an added query string, or the bare root all land on the closed
page. Older plain-base64 `/<slug>` links still open (a `side` in them is
ignored).

> Obscure, not secured — the paths and the scheme ship inside the site's
> JavaScript. Fine for a wedding invite; don't put anything private behind it.

### What a token holds (the builder writes it)

| Param | Meaning |
|---|---|
| `preset` | a key of `presets` in `data.js` |
| `fns` | exact functions (event ids from `data.js`) |
| `to` | personalised greeting |
| `scratch` `countdown` `photos` `venue` `rsvp` | `0` hides that section (without `scratch` the Hero's date card is left out too) |

Presets are the named guest groups in `presets` (`all` plus the family's own),
in builder order. A preset's optional `hide` turns sections off (e.g.
`hide: ['rsvp']`).
