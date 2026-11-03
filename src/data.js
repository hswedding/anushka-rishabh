/* ============================================================================
 *  ALL CONTENT LIVES HERE.
 *  Edit names / dates / venues / phone numbers below — never touch the
 *  animation or layout code. Everything marked  ⟵ EDIT  is a placeholder.
 *
 *  Anushka & Rishabh — the BRIDE's side (the Jain family). Filled from the
 *  family's Google Form answers of 3 Nov 2026. Still to come from them:
 *  function timings, the second contact's number, guest groups (presets),
 *  photos, the films and the song — each is marked  ⟵ TODO  below.
 * ========================================================================== */

/* The couple ---------------------------------------------------------------- */
export const couple = {
  groom: { first: 'Rishabh', full: 'Rishabh Jain', role: 'groom' },
  bride: { first: 'Anushka', full: 'Anushka Jain', role: 'bride' },
  monogram: 'A&R',
  hashtag: '#ItsGivingAnuRish',
};

/* The wedding moment (countdown + hero target). ISO local time. ------------- */
export const wedding = {
  // 20 Dec 2026 — the pheras. ⟵ TODO the form left the time blank; 7 p.m. is a
  // placeholder so the countdown has a target. Change it once they confirm.
  dateTimeISO: '2026-12-20T19:00:00',
  dateLabel: '20 December 2026',
  dayLabel: 'Sunday',
  scratchPrompt: 'Scratch to reveal our wedding date',
};

/* The hosting family — this site speaks in ONE family's voice. --------------
   `side` decides whose child is named first and how the couple is ordered:
   'bride' → bride first, 'groom' → groom first. For the other family's site,
   start a second repo from this base and set side: 'groom'. */
export const host = {
  side: 'bride',
  // No prayer line and no Ganesha image (per the form). The family asked for
  // English + Hindi, so the card opens with a plain Hindi heading instead.
  invocation: '॥ शुभ विवाह ॥',
  hosts: 'Mr. Pawan Kumar Jain & Mrs. Urmila Jain',
  inviteLine: 'joyfully invite you to celebrate the wedding of',
  parents: {
    bride: 'D/o Mrs. Anjuli & Mr. Amit Jain',
    groom: 'S/o Mrs. Sarika & Mr. Sanjeev Jain',
  },
  sign: 'With love, The Jain Family',
  // Closes the builder's WhatsApp message.
  waSignoff: 'With love,\nThe Jain Family',
  // RSVPs go to this WhatsApp number (digits + country code, no + or spaces).
  rsvpWhatsApp: '919810421242',
  contacts: [
    { name: 'Amit Jain', phone: '+919810421242' },
    // ⟵ TODO Animesh Jain was named as the second contact but no number was
    // given. Add { name: 'Animesh Jain', phone: '+91…' } once it comes in.
  ],
  // Printed-card style lines in the footer, under the contacts (Hindi).
  closing: [
    { label: 'दर्शनाभिलाषी', lines: ['समस्त जैन परिवार'] },
  ],
};

/* Venues --------------------------------------------------------------------- */
const radissonKaushambi = {
  name: 'Radisson Blu Hotel, Kaushambi',
  area: 'H-3, Modipon Vihar, Sector 14, Kaushambi, Ghaziabad, Uttar Pradesh 201010',
  mapUrl: 'https://maps.app.goo.gl/hJyvANdJfXEYX8MJ7',
};
const silverSpoons = {
  name: 'Silver Spoons',
  area: 'C-7, Sector 18, Vasundhara, Ghaziabad, Uttar Pradesh 201012',
  mapUrl: 'https://maps.app.goo.gl/bxjjfHsSuyNaom4Z9',
};

/* ----------------------------------------------------------------------------
 *  THE FUNCTIONS this family invites guests to (its own and the shared ones).
 *  `icon` is a key in components/Icons.jsx.  `dressCode.color` is the dot.
 *  `order` controls chronological sort.
 *  `comesWith` (an event id): no builder checkbox of its own — it joins that
 *  event on the page (e.g. its venue card), for a function whose details are
 *  in that event's film.
 *
 *  Films: each `video` below is a detail card (name, date, venue) standing in
 *  until the real film is ready. Drop the finished film into public/videos/
 *  under the SAME file name and nothing else needs to change.
 *
 *  ⟵ TODO no start times were given for any function, and the order within a
 *  day is assumed (Engagement before Sangeet, Haldi before the Wedding).
 * -------------------------------------------------------------------------- */
export const events = [
  {
    id: 'engagement', order: 1,
    name: 'Engagement', nameDeva: 'सगाई',
    dateISO: '2026-12-19', dateLabel: '19 Dec', dayLabel: 'Saturday',
    timeLabel: 'To be confirmed', icon: 'heart',
    blurb: 'Two families, one promise — the exchange of rings.',
    dressCode: { label: 'To be shared', color: '#c9ad78' },
    venue: radissonKaushambi,
    video: '/videos/Engagement (Anushka).mp4',
  },
  {
    id: 'sangeet', order: 2,
    name: 'Sangeet', nameDeva: 'संगीत',
    dateISO: '2026-12-19', dateLabel: '19 Dec', dayLabel: 'Saturday',
    timeLabel: 'To be confirmed', icon: 'sangeet',
    blurb: 'An evening of music, dance and celebration.',
    dressCode: { label: 'To be shared', color: '#8fa37e' },
    venue: radissonKaushambi,
    video: '/videos/Sangeet (Anushka).mp4',
  },
  {
    id: 'haldi', order: 3,
    name: 'Haldi', nameDeva: 'हल्दी',
    dateISO: '2026-12-20', dateLabel: '20 Dec', dayLabel: 'Sunday',
    timeLabel: 'To be confirmed', icon: 'haldi',
    blurb: 'Turmeric, sunshine and blessings for the bride.',
    dressCode: { label: 'To be shared', color: '#e3c565' },
    venue: silverSpoons,
    video: '/videos/Haldi (Anushka).mp4',
  },
  {
    id: 'wedding', order: 4,
    name: 'The Wedding', nameDeva: 'शुभ विवाह',
    dateISO: '2026-12-20', dateLabel: '20 Dec', dayLabel: 'Sunday',
    timeLabel: 'To be confirmed', icon: 'wedding',
    blurb: 'The sacred pheras — where two souls become one.',
    dressCode: { label: 'To be shared', color: '#5c7052' },
    venue: silverSpoons,
    video: '/videos/Wedding (Anushka).mp4',
  },
];

/* Quick presets for the invitation builder — named guest groups, in button
   order. `hide` (optional) lists sections the preset turns off, e.g.
   hide: ['rsvp']. Keys are stored in guest links — don't rename them.
   ⟵ TODO the family will send their guest groups; add them here. */
const byIds = (...ids) => ids;
const selectable = events.filter((e) => !e.comesWith);
export const presets = {
  all: { label: 'All functions', ids: selectable.map((e) => e.id) },       // keep: the default
  wedding: { label: 'Wedding only', ids: byIds('wedding') },
};

/* Couple photos — the swipeable strip after the countdown (hide with photos=0).
   Files live in public/photos; shrink new ones first with
   scripts/compress-photos.ps1. Order here = order in the strip. Cards are
   portrait, so landscape shots get their sides cropped — `focus` (CSS
   object-position x %) picks which part stays in frame.
   ⟵ TODO the family is sending photos on WhatsApp; until then the section
   stays hidden. Example: { src: '/photos/1.jpg', alt: 'Anushka and Rishabh …' } */
export const photos = [];

/* Toggleable parts (Hero / Venue & Travel / Footer always show). 'envelope'
   is the opening envelope video — without it the invitation opens straight
   away and the video never downloads. 'scratch' is the Hero's date card,
   which is left out without it. ------------------------------------------- */
export const toggleableSections = [
  { id: 'envelope', label: 'Envelope video' },
  { id: 'scratch', label: 'Scratch card' },
  { id: 'countdown', label: 'Countdown' },
  { id: 'photos', label: 'Photos' },
  { id: 'rsvp', label: 'RSVP' },
];

/* Global config ------------------------------------------------------------- */
export const config = {
  // WhatsApp number that RSVP submissions are sent to (digits + country code,
  // no + or spaces). Fallback when host.rsvpWhatsApp is empty.
  rsvpWhatsApp: '919810421242',
  // Looping background score, played while the sound toggle is on. Lives in
  // public/ — the %20 is the space in the file name.
  // ⟵ TODO swap for the family's song (https://youtu.be/CnEqrgMlWLQ) once
  // Sandeep drops the .mp3 into public/.
  bgMusic: '/global%20music.mp3',
  // Default site URL used by the builder to build share links.
  // Leave '' to auto-detect from the browser. ⟵ EDIT once deployed.
  siteUrl: '',
  // Secret page paths: https://your-site/<id>. `builder` is the family's page;
  // `all` is the ready-made invitation with every function. Change an id to
  // revoke it — links already sent with the old id stop working. The site
  // root (/) opens nothing. Every family's site needs its own ids:
  // `node scripts/new-links.mjs` writes fresh ones.
  links: {
    builder: 'dVEa3L0E4hjr',
    all: 'LkeKUErEhB7N',
  },
  // The opening envelope film (public/). ⟵ TODO still the studio sample (HS
  // seal) — replace with the couple's envelope film.
  envelopeVideo: '/videos/envelop.mp4',
  // The envelope film's first frame (public/), shown and preloaded before
  // the film loads so the opening screen paints at once. Re-export it
  // whenever envelopeVideo changes — README "Films". '' to skip.
  envelopePoster: '/videos/envelop-poster.webp',
  // No Ganesha image for this family.
  showGanesha: false,
};

/* Page meta — written into index.html at build time (see vite.config.js).
   This is what WhatsApp shows in the link preview. */
export const site = {
  // The deployed site, no trailing slash. Link-preview crawlers (WhatsApp)
  // need absolute image URLs, so shareImage is prefixed with it at build
  // time. Matches the Worker name in wrangler.jsonc. ⟵ EDIT for a custom domain
  url: 'https://anushka-rishabh.hs-invites.workers.dev',
  title: 'Anushka & Rishabh · Wedding Invitation',
  description:
    'With the blessings of our families, we joyfully invite you to celebrate the wedding of Anushka & Rishabh — 20 December 2026.',
  shareTitle: "Anushka & Rishabh · You're Invited",
  shareDescription:
    'Join us as we celebrate the wedding of Anushka & Rishabh — 19–20 December 2026. Tap to open your invitation.',
  // 1200×630 image in public/ for the WhatsApp / social preview.
  shareImage: '/og-image.jpg',
  // Browser UI colour on mobile — match the page background.
  themeColor: '#faf7f0',
  // Keep invitations (home addresses, phone numbers) out of search engines.
  noindex: true,
  // Optional Cloudflare Web Analytics token (dashboard → Web Analytics →
  // add a site → copy the token from the JS snippet). '' = no analytics.
  cloudflareAnalyticsToken: '',
};

/* Studio credit — the "Made with ♥ by … | Create Yours →" line in the footer.
   The CTA opens the HS Wedding Invites website, where guests can enquire. */
export const studio = {
  name: 'HS Wedding Invites',
  cta: 'Create Yours →',
  // Where "Create Yours" goes.
  url: 'https://hs-wedding-invites.hs-invites.workers.dev/',
};
