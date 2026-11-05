# New family site runbook (single-family base)

How to turn **invite-base-single** into one family's invitation, start to
finish. Use this base when the bride's and groom's families each want their
own site: build it twice, once per family, as two repos. (For one shared site
with bride/groom/joint links, use `invite-base` and its guide instead.) Written so
that a fresh Claude Code session (or Sandeep) can follow it without any other
context. Read `CLAUDE.md` first for the architecture; this file is the
procedure.

**Inputs you need before starting**

1. The couple's answers to the intake message (`docs/CLIENT-INTAKE.md`).
2. The event films (Sandeep makes these), plus the envelope opening film.
3. Optional: background music, a 1200×630 preview image, decor art.

---

## 1. Create the couple's repo

Naming: repo `hswedding/invite-<slug>`, Worker `invite-<slug>`, where `<slug>`
is the couple plus the side, lowercase letters, digits and hyphens: for
example `aarav-diya-bride` and `aarav-diya-groom`.

When both families want sites, build the first one fully, then start the
second repo the same way and copy over the shared parts of `src/data.js`
(`couple`, `wedding`, shared venues and functions, `site` wording), changing
`host` and the family-only functions.

### A. With the GitHub CLI logged in

```bash
./scripts/new-couple.sh <slug>
```

### B. Sandeep created an empty repo on GitHub (the usual case for a Claude session)

The couple repo must carry the base's **full history**, otherwise
`git merge upstream/main` can never pull base fixes. Never use GitHub's
"Use this template" button for the same reason.

```bash
# Claude cloud sessions clone shallow: deepen first, or the push is rejected.
git clone https://github.com/hswedding/invite-base-single invite-<slug>
cd invite-<slug>
git fetch --depth=1000 origin main      # no-op on a full clone
git remote rename origin upstream
git remote add origin https://github.com/hswedding/invite-<slug>
```

Then rename the Worker and package (the Worker name becomes the site URL and
must match the Cloudflare dashboard):

- `wrangler.jsonc` → `"name": "invite-<slug>"`
- `package.json` → `"name": "invite-<slug>"`

Give the family its own secret page ids (builder and ready-made link; the
base's ids must never be reused):

```bash
node scripts/new-links.mjs              # rewrites config.links in src/data.js
git commit -am "Start invite-<slug> from invite-base-single"
git push -u origin main
```

Work on a branch (`sandeep/<slug>-content`) from here if the couple should
review a preview before it goes live (see step 6).

---

## 2. Fill in `src/data.js`

Everything the guest reads comes from this one file. Replace the example
couple completely: search for every `⟵ EDIT` marker and for the old names.

### `couple`

| Field | Example | Used for |
| --- | --- | --- |
| `groom.first`, `bride.first` | `'Aarav'`, `'Diya'` | Hero names, closed page, share message |
| `groom.full`, `bride.full` | `'Aarav Mehta'` | Not displayed today; keep filled |
| `monogram` | `'A&D'` | Not displayed today |
| `hashtag` | `'#AaravWedsDiya'` | Footer. `''` leaves that line empty |

Name order follows `host.side`: a bride-side site shows the bride first, a
groom-side site the groom first (`orderedCouple` in `lib/config.js`).

### `wedding`

| Field | Example | Notes |
| --- | --- | --- |
| `dateLabel` | `'14 February 2027'` | Shown under the couple's names in the hero |
| `dayLabel` | `'Sunday'` | Check it matches the date |

### `host` — the one family this site speaks for

| Field | Example | Notes |
| --- | --- | --- |
| `side` | `'bride'` | `'bride'` or `'groom'`. Whose child is named first, with their parents' line |
| `ganesha` | `['॥ श्री गणेशाय नमः ॥']` | Optional array of invocation lines (Sanskrit/Hindi). The first is the invocation; any further line (a blessing, e.g. a guru's grace) is set a size smaller and wraps in balanced lines. Write dandas (`॥`, `।`) with spaces as usual: they're kept on the same line as the next word. Omit for none |
| `invocation` | `'ੴ ਸਤਿ ਨਾਮੁ'` | Optional single line (any script). Omit for none |
| `hosts` | `'Mrs. & Mr. Rajesh Mehta'` | Who is inviting. Shown as written (mixed case); a line only wraps after an `&`, never inside a name |
| `inviteLine` | `'joyfully invite you to celebrate the wedding of their daughter'` | Sentence after the hosts |
| `parents.bride`, `parents.groom` | `'D/o Mrs. Neha & Mr. Rajesh Mehta'` | Line under each name, wrapping only after an `&` like `hosts`. Omit a key to hide it |
| `sign` | `'With love, the Mehta Family'` | Footer sign-off, right under "Thank You" (the couple's names aren't repeated there) |
| `waSignoff` | `'With Best Regards,\nMehta Family'` | Optional. Added at the end of the WhatsApp message the builder sends (`\n` starts a new line). Omit to end on the link |
| `contacts` | `[{ name: 'Rajesh Mehta', phone: '+919800000000' }]` | Footer tap-to-call list. Phones with `+` and country code |
| `closing` | `[{ label: 'RSVP', lines: ['Mehta Family'] }, { label: 'With Best Compliments From', lines: ['Nanke & Dadke'] }]` | Optional printed-card style lines in the footer, under the contacts: each `label` is a small heading over its `lines`. Omit for none |

The Ganesha image above the invocation is controlled separately by
`config.showGanesha`.

### Venues (plain `const`s above `events`)

Define each venue once and reuse it across events:

```js
const banquet = {
  name: 'The Grand Lawns',
  area: 'Sector 5, Panchkula, Haryana',
  mapUrl: 'https://maps.app.goo.gl/…',   // the couple's Google Maps share link
};
```

The Venue section has one card per unique venue of the guest's selected
functions. Each card leads with those functions' names and days, then the
venue name and address, then a "Get directions" button. A map of the
**last** venue (the latest function, usually the wedding) is embedded below.

### `events` — the functions

```js
{
  id: 'haldi', order: 3,
  name: 'Haldi', nameDeva: 'हल्दी',
  dateISO: '2027-02-13', dateLabel: '13 Feb', dayLabel: 'Saturday',
  timeLabel: '10 a.m. onwards', icon: 'haldi',
  blurb: 'Turmeric, sunshine and joy.',
  dressCode: { label: 'Sunny yellow', color: '#f1c40f' },
  venue: banquet,
  video: '/videos/Haldi.mp4',
},
```

| Field | Notes |
| --- | --- |
| `id` | Lowercase kebab-case, unique. It is the vocabulary of guest links (`fns=`) and presets. **Never rename or remove an id after links have been sent**: those guests silently lose that function |
| `order` | Chronological sort. Guest links always show functions in this order |
| `name` | Title on the film card and on its venue card |
| `dateLabel`, `dayLabel` | Shown above the film (`13 Feb · Saturday`) and under the name on its venue card |
| `video` | One film in `public/videos/` (URL-encode spaces as they appear in the path, e.g. `/videos/HS Haldi.mp4` works as written) |
| `videoBySide` | Not needed here; use `video`. (Still supported: it plays the film for `host.side`) |
| `comesWith` | Optional, an event id, e.g. `comesWith: 'wedding'`. For a function whose details are in another function's film (say the Sehrabandi inside the groom's wedding film): it gets no builder checkbox and stays out of the presets, and joins that function on the page — its venue card — whenever that function is on the link. Give it no `video` |
| `nameDeva`, `dateISO`, `timeLabel`, `icon`, `blurb` | **Not rendered by the current UI.** Keep them filled (they document the function and a custom section may use them). `icon` must be a key in `components/Icons.jsx`: `kirtan mehndi path sangeet haldi chooda baarat wedding heart lotus sparkle` |
| `dressCode.color` | Only shown as the colour dot in the builder. The label isn't rendered |

**Important:** a function **without a film doesn't get its own card** on the
page; it only appears by name and day on its venue card. Its time, dress code and
details reach guests through its film. If a couple wants a function without a
film shown properly, build a small card section in `src/custom/` that renders
`name`, `dateLabel`, `timeLabel`, `dressCode` and `blurb` for film-less events.

### `presets`

Named guest groups for the builder's quick presets, in button order, e.g.
`{ label: 'Office friends', ids: ['sangeet', 'wedding'] }` (ids must exist).
Keep `all`: it is the full invitation and the ready-made link. Optional
`hide: ['rsvp']` turns sections off when the preset is picked. Preset keys are
stored in guest links: never rename one after links are out.

### `photos`

The couple's photos, shown as an endless, slowly drifting reel of tilted prints
right after the hero (guests can drag or swipe it; it pauses on hover,
focus or its pause button).

1. Shrink the originals (Windows, PowerShell):
   `powershell -ExecutionPolicy Bypass -File scripts/compress-photos.ps1 <folder>`
   — writes 1200px-wide JPEGs to `public/photos/`, keeping file names and
   fixing phone rotation. Aim for 4–8 photos.
2. List them in `photos` in the order they should appear:
   `{ src: '/photos/1.jpg', alt: 'The couple at the beach' }`. Write a real
   `alt` for each.
3. Cards are portrait (2:3). For landscape shots add `focus: '40%'` (CSS
   `object-position` x) to choose which part stays in frame.

No photos? Set `photos = []` and the section disappears. A single link can
hide it with `photos=0` (the builder has a Photos toggle).

### `toggleableSections`

Leave as is unless a section is removed. Only `envelope` (the opening envelope
film; off, the invitation opens straight away, the film never downloads and the
music starts on the guest's first tap), `photos` and `rsvp` can be turned off per link — in the builder, or with a preset's `hide`. Hero,
Venue & Travel and Footer always show.

### `config`

| Field | Notes |
| --- | --- |
| `bgMusic` | Looping music path in `public/`. Encode spaces as `%20` here |
| `siteUrl` | Leave `''` (auto-detected). Set it only if a custom domain should be used in share links built on another domain |
| `links` | Secret page ids: `builder` (the family's builder) and `all` (the ready-made every-function link), each opened at `https://<site>/<id>`. Fresh random ids per site: `node scripts/new-links.mjs`. Changing an id revokes that link |
| `envelopeVideo` | Opening film path, default `/videos/envelop.mp4` |
| `envelopePoster` | That film's first frame, default `/videos/envelop-poster.webp`. **Re-export it with every new envelope film** (README "Films"), or the opening screen jumps on tap. `''` = none |
| `showGanesha` | `false` hides the Ganesha image at the top of the hero |

### `site` — page meta (what WhatsApp shows when a link is shared)

| Field | Notes |
| --- | --- |
| `url` | The deployed site, no trailing slash (set by `new-couple.sh` from the Worker name). Update it if the couple gets a custom domain — WhatsApp needs it to find the preview image |
| `title` | Browser tab, e.g. `'Aarav & Diya · Wedding Invitation'` |
| `description` | Search/preview description |
| `shareTitle`, `shareDescription` | WhatsApp/social preview title and text |
| `shareImage` | `/og-image.jpg`, a 1200×630 JPG in `public/` (made absolute with `url` at build). **Replace it per couple** — the base ships the sample HS envelope. Keep it under ~300 KB or WhatsApp may drop it |
| `themeColor` | Mobile browser bar colour; match the page background |
| `noindex` | Keep `true` (home addresses and phone numbers are on the page) |
| `cloudflareAnalyticsToken` | Optional Web Analytics token; `''` = none |

Restart `npm run dev` after editing `site`; it's read once at startup.

### `studio`

Sandeep's footer credit ("Made with ♥ by … | Create Yours →"). "Create
Yours" opens `studio.url`, the HS Wedding Invites website. Leave unless told
otherwise.

---

## 3. Media in `public/`

| File | Rules |
| --- | --- |
| `videos/*.mp4` | **H.264 MP4** (Safari can't play other codecs), ≤ **25 MiB** each (Cloudflare's per-file limit), index up front (`+faststart`). Encode with the README "Films" command (CRF 20). Today's films are 1–7 MB. A film plays once and holds its last frame, so it must **end on a frame showing all the details**: trim any fade-out, outro or glitch after it (README "Films") |
| `videos/envelop.mp4` | Opening film; plays by itself on load, silent (no audio track: `-an`), then reveals the page. CRF 14 (phones show it zoomed in) |
| `videos/envelop-poster.webp` | The envelope film's first frame (README "Films"); replace it together with `envelop.mp4` |
| music `.mp3` | Looping background score; check the couple is OK using it |
| `og-image.jpg` | 1200×630 preview image |
| `favicon.png` | Optional; replace with the couple's monogram if wanted. Keep it 180×180 (a full-size logo here costs every guest ~1 MB) |

Films and music are served through `worker/index.js`, which adds the Range /
206 support Safari needs. It only covers `/videos/*`, `*.mp4` and `*.mp3`
(`run_worker_first` in `wrangler.jsonc`). If you add another media format or
folder, extend that list and the extension regex in the `mediaSizes` plugin in
`vite.config.js`.

---

## 4. Design

All of this is per couple and free to change:

- **Palette:** `src/styles/tokens.css` (CSS variables: cream paper, gold
  family, rani/blush accents, leaf greens, envelope maroon). Match the couple's
  printed card or chosen colours; keep text contrast (labels ≥ 4.5:1).
- **Fonts:** self-hosted `@fontsource/*` packages imported in
  `src/styles/fonts.css` (no Google Fonts link — add a family with
  `npm i @fontsource/<name>` plus an `@import` per weight), font stacks in
  `tokens.css`, optional custom font block in `fonts.css`. Check licences for any
  paid font.
- **Decor art:** `src/Images/` (florals, palace, wash,
  Ganesha). Easiest is to replace files keeping the same names; otherwise edit
  the imports in `Hero.jsx`, `Footer.jsx`.
- **One-off sections or animations:** add components in `src/custom/` and
  list them in `src/custom/index.js` (`[{ id, Component }]`). They render after
  RSVP and before the footer, and receive the `invite` prop. Import GSAP from
  `src/lib/gsap.js`, scroll through `window.__lenis`, and honour
  `useReducedMotion`.
- Editing base files is allowed when the design needs it, but every such edit
  is a place where a later `git merge upstream/main` can conflict.

---

## 5. Verify locally

```bash
npm install
npm run dev                        # http://localhost:5173
```

Open and check each of:

- `/` and any made-up path: the closed "open the link you received" page
- `/<links.all>`: hosts, invocation, name order (the host's child first), parents lines, every film
- `/<links.builder>`: the builder lists every function (no side switch); presets select the right ones; a copied link opens the same view as the live preview
- RSVP: under `npm run cf:dev` with `.dev.vars`, save a test sheet in the builder and send an RSVP — a row appears (README "RSVP sheet")
- Footer contacts, hashtag and sign-off
- The hero shows the right wedding date

Then the production build on Cloudflare's runtime:

```bash
npm run cf:dev                     # http://localhost:8787
curl -sI -H "Range: bytes=0-1" "http://localhost:8787/videos/envelop.mp4"   # expect 206 + Content-Range
```

---

## 6. Deploy on Cloudflare (once per couple)

1. Cloudflare dashboard → **Workers & Pages → Create → Import a repository** →
   `hswedding/invite-<slug>`.
2. Keep the detected settings: build `npm run build`, deploy
   `npx wrangler deploy`. The project name must equal `name` in
   `wrangler.jsonc`.
3. Live at `https://invite-<slug>.hs-amazonsellers.workers.dev`. Add the
   couple's own domain under the Worker's Domains & Routes if they have one.
4. With preview builds on, each pushed branch gets a stable preview URL: send
   it to the couple for review with a page path added (`/<links.all>`, or
   `/<links.builder>`; the bare root shows the closed page), then merge to
   `main` to go live.
5. Set the `GOOGLE_SA_KEY` secret (README "RSVP sheet"), or RSVPs can't be
   saved.

After deploy, check on a real phone (ideally an iPhone too): envelope film
plays, films play, a builder-made guest link opens, and the WhatsApp preview shows
title, text and image.

---

## 7. Hand over to the family

Send the family its builder link: `https://<site>/<links.builder>`.

First they make a Google Sheet, share it as **Editor** with the service
account email the builder shows, and paste it into **RSVP Google Sheet → Save
sheet**: every guest's RSVP lands there as a row.

In the builder they pick a guest's functions (or a preset) and sections,
optionally type the guest's name, check the live preview, then copy the link
or tap "Send on WhatsApp". **Ready-made link** in the builder has the
every-function link for family WhatsApp groups. The site root shows nothing,
so guests only ever see their own link. Remind them the builder link is
obscure, not secured: keep it within the family.

---

## 8. Later

- **Pull a base fix** into a live couple: `git fetch upstream && git merge upstream/main`, then check the site.
- **After the agreed period:** replace the content with a thank-you page or delete the Worker in Cloudflare, archive the GitHub repo, and delete the couple's personal data.

## Gotchas

- Changing or removing an event `id` or a preset key breaks links already sent. Never change `KEY` in `src/lib/config.js`.
- Every family's site needs its own `config.links` ids (`node scripts/new-links.mjs`); changing one revokes that link.
- `dayLabel` and `dateLabel` are typed by hand: check they match the dates.
- `bgMusic` needs `%20` for spaces; event `video` paths can be written with spaces.
- Every film must be H.264 MP4 under 25 MiB, or it won't deploy or won't play on iPhone.
- A new envelope film needs a new `envelop-poster.webp` (its first frame), or the opening screen jumps on tap.
- Event films don't loop: each one stops on its last frame, so that frame must show the function's details.
- `worker/media-sizes.json` is generated by `npm run build`; run a build before `wrangler dev` or `wrangler deploy`.
- The Cloudflare Worker name and `wrangler.jsonc` `name` must match, or the Cloudflare build fails.
