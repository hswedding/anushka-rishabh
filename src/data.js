/* ============================================================================
 *  ALL CONTENT LIVES HERE.
 *  Edit names / dates / venues / phone numbers below — never touch the
 *  animation or layout code. Everything marked  ⟵ EDIT  is a placeholder.
 * ========================================================================== */

/* The couple ---------------------------------------------------------------- */
export const couple = {
  groom: { first: 'Hemant', full: 'Hemant', role: 'groom' },
  bride: { first: 'Sukriti', full: 'Sukriti', role: 'bride' },
  monogram: 'H&S',
  hashtag: '#SukHeverafter',
};

/* The wedding moment (countdown + hero target). ISO local time. ------------- */
export const wedding = {
  // 24 Nov 2026, 9:00 PM — the pheras / main ceremony.  ⟵ EDIT
  dateTimeISO: '2026-11-24T21:00:00',
  dateLabel: '24 November 2026',
  dayLabel: 'Tuesday',
  scratchPrompt: 'Scratch to reveal our wedding date',
};

/* The hosting family — this site speaks in ONE family's voice. --------------
   `side` decides whose child is named first and how the couple is ordered:
   'bride' → bride first, 'groom' → groom first. For the other family's site,
   start a second repo from this base and set side: 'groom'. */
export const host = {
  side: 'bride',                                                   // ⟵ EDIT 'bride' | 'groom'
  // Optional invocation lines at the top (Sanskrit/Hindi). Remove for none.
  ganesha: ['वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ ।', 'निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा ॥'],
  // Optional single invocation line in any script, e.g. 'ੴ ਸਤਿ ਨਾਮੁ'.
  // invocation: '',
  hosts: 'Mrs. Usha & Late Mr. Prem Malhotra',                     // ⟵ EDIT
  inviteLine: 'joyfully invite you to celebrate the wedding of',   // ⟵ EDIT
  parents: {
    bride: 'D/o Mrs. Ashu & Mr. Manish Malhotra',                  // ⟵ EDIT
    groom: 'S/o Mrs. Neeru & Mr. Jatinder Bahl',                   // ⟵ EDIT
  },
  sign: 'With love, the Malhotra Family',                          // ⟵ EDIT
  // RSVPs go to this WhatsApp number (digits + country code, no + or spaces).
  rsvpWhatsApp: '919815551592',                                    // ⟵ EDIT
  contacts: [
    { name: 'Manish Malhotra', phone: '+919876500001' },           // ⟵ EDIT
    { name: 'Ashu Malhotra', phone: '+919876500002' },             // ⟵ EDIT
  ],
};

/* Venues --------------------------------------------------------------------- */
const brideHome = {
  name: '3010, Tribune Colony',
  area: 'Sector 29, Chandigarh',
  mapUrl: 'https://maps.app.goo.gl/SQxN8fmCPD2m1V5u6',
};
const hotelRadius = {
  name: 'Hotel Radius',
  area: 'SCO 205-209, Airport Rd, TDI City, Sector 117, Mohali, Punjab 160055',
  mapUrl: 'https://maps.google.com/?q=Hotel+Radius+TDI+City+Sector+117+Mohali',
};
const dullatResort = {
  name: 'Dullat Resort',
  area: 'Sector 118, Sahibzada Ajit Singh Nagar, Punjab 140307',                                                          // ⟵ EDIT add city/area
  mapUrl: 'https://maps.google.com/?q=Dullat+Resort',                // ⟵ EDIT refine map link
};

/* ----------------------------------------------------------------------------
 *  THE FUNCTIONS this family invites guests to (its own and the shared ones).
 *  `icon` is a key in components/Icons.jsx.  `dressCode.color` is the dot.
 *  `order` controls chronological sort.
 * -------------------------------------------------------------------------- */
export const events = [
  {
    id: 'kirtan', order: 1,
    name: 'Sai Sandhya', nameDeva: 'साईं संध्या',
    dateISO: '2026-11-14', dateLabel: '14 Nov', dayLabel: 'Saturday',
    timeLabel: 'Evening', icon: 'kirtan',
    blurb: 'An evening of devotional song and blessings to begin the celebrations.',
    dressCode: { label: 'Soft ivory & pastels', color: '#f4ead8' },
    venue: brideHome,
    video: '/videos/Sai Sandhya (Sukriti).mp4',
  },
  {
    id: 'mehndi-bride', order: 3,
    name: 'Mehndi', nameDeva: 'मेहंदी',
    dateISO: '2026-11-21', dateLabel: '21 Nov', dayLabel: 'Saturday',
    timeLabel: 'Afternoon – Evening', icon: 'mehndi',
    blurb: 'Intricate henna and festive cheer for the bride and her guests.',
    dressCode: { label: 'Marigold & green', color: '#d9b441' },
    venue: brideHome,
    video: '/videos/Mehndi (Sukriti).mp4',
  },
  {
    id: 'shagun-sangeet', order: 5,
    name: 'Shagun & Sangeet', nameDeva: 'शगुन व संगीत',
    dateISO: '2026-11-22', dateLabel: '22 Nov', dayLabel: 'Sunday',
    timeLabel: 'Evening', icon: 'sangeet',
    blurb: 'Both families come together for blessings, dance and music.',
    dressCode: { label: 'Jewel tones', color: '#3b5ca8' },
    venue: hotelRadius,
    video: '/videos/HS Shagun.mp4',
  },
  {
    id: 'haldi', order: 6,
    name: 'Haldi', nameDeva: 'उत्सव',
    dateISO: '2026-11-23', dateLabel: '23 Nov', dayLabel: 'Monday',
    timeLabel: '9 a.m. onwards', icon: 'haldi',
    blurb: 'Turmeric, sunshine and joy for the bride and groom.',
    dressCode: { label: 'Sunny yellow', color: '#f1c40f' },
    venue: hotelRadius,
    video: '/videos/HS Haldi.mp4',
  },
  {
    id: 'chooda', order: 7,
    name: 'Chooda Rasam', nameDeva: 'चूड़ा रसम',
    dateISO: '2026-11-24', dateLabel: '24 Nov', dayLabel: 'Tuesday',
    timeLabel: 'Morning', icon: 'chooda',
    blurb: 'The bride adorns her sacred chooda amid family blessings.',
    dressCode: { label: 'Rose & red', color: '#d05f7a' },
    venue: hotelRadius,
  },
  {
    id: 'wedding', order: 9,
    name: 'The Wedding', nameDeva: 'विवाह',
    dateISO: '2026-11-24', dateLabel: '24 Nov', dayLabel: 'Tuesday',
    timeLabel: 'Night', icon: 'wedding',
    blurb: 'The sacred pheras — where two souls become one.',
    dressCode: { label: 'Festive best', color: '#8a1f2b' },
    venue: dullatResort,
    video: '/videos/Wedding (Sukriti).mp4',
  },
];

/* Quick presets for the invitation builder — named guest groups, in button
   order. `hide` (optional) lists sections the preset turns off, e.g.
   hide: ['rsvp']. Keys are stored in guest links — don't rename them. */
const byIds = (...ids) => ids;
export const presets = {
  all: { label: 'All functions', ids: events.map((e) => e.id) },       // keep: the default
  wedding: { label: 'Wedding only', ids: byIds('wedding') },              // ⟵ EDIT
  'shagun-wedding': { label: 'Shagun + Wedding', ids: byIds('shagun-sangeet', 'wedding') }, // ⟵ EDIT
};

/* Couple photos — the swipeable strip after the countdown (hide with photos=0).
   Files live in public/photos; shrink new ones first with
   scripts/compress-photos.ps1. Order here = order in the strip. Cards are
   portrait, so landscape shots get their sides cropped — `focus` (CSS
   object-position x %) picks which part stays in frame. ⟵ EDIT */
export const photos = [
  { src: '/photos/1.jpg', alt: 'The couple on a white Royal Enfield' },
  { src: '/photos/3.jpg', alt: 'The couple arm in arm on an evening out', focus: '40%' },
  { src: '/photos/4.jpg', alt: 'The couple reading a book together in a pine forest', focus: '46%' },
  { src: '/photos/2.jpg', alt: 'The couple running hand in hand through tall grass' },
];

/* Toggleable scenes (Envelope / Hero / Footer are always shown) ------------- */
export const toggleableSections = [
  { id: 'countdown', label: 'Countdown' },
  { id: 'photos', label: 'Photos' },
  { id: 'venue', label: 'Venue & Travel' },
  { id: 'rsvp', label: 'RSVP' },
];

/* Global config ------------------------------------------------------------- */
export const config = {
  // WhatsApp number that RSVP submissions are sent to (digits + country code,
  // no + or spaces). Used for both RSVP delivery and the footer share CTA. ⟵ EDIT
  rsvpWhatsApp: '919876500001',
  // Looping background score, played while the sound toggle is on. Lives in
  // public/ — the %20 is the space in the file name. ⟵ EDIT
  bgMusic: '/global%20music.mp3',
  // Default site URL used by the builder to build share links.
  // Leave '' to auto-detect from the browser. ⟵ EDIT once deployed.
  siteUrl: '',
  // Secret page paths: https://your-site/<id>. `builder` is the family's page;
  // `all` is the ready-made invitation with every function. Change an id to
  // revoke it — links already sent with the old id stop working. The site
  // root (/) opens nothing. Every family's site needs its own ids:
  // `node scripts/new-links.mjs` writes fresh ones. ⟵ EDIT
  links: {
    builder: '8RLVf-FVg8Ia',
    all: 'Y0HAHELgq8sq',
  },
  // The opening envelope film (public/). ⟵ EDIT per couple
  envelopeVideo: '/videos/envelop.mp4',
  // The envelope film's first frame (public/), shown and preloaded before
  // the film loads so the opening screen paints at once. Re-export it
  // whenever envelopeVideo changes — README "Films". '' to skip. ⟵ EDIT
  envelopePoster: '/videos/envelop-poster.webp',
  // Show the Ganesha image at the top of the hero. Set false for couples
  // who want a different (or no) invocation image. ⟵ EDIT
  showGanesha: true,
};

/* Page meta — written into index.html at build time (see vite.config.js).
   This is what WhatsApp shows in the link preview. ⟵ EDIT per couple */
export const site = {
  // The deployed site, no trailing slash. Link-preview crawlers (WhatsApp)
  // need absolute image URLs, so shareImage is prefixed with it at build
  // time. scripts/new-couple.sh sets it from the Worker name. ⟵ EDIT
  url: 'https://invite-base-single.hs-invites.workers.dev',
  title: 'Hemant & Sukriti · Wedding Invitation',
  description:
    'With the blessings of our families, we joyfully invite you to celebrate the wedding of Hemant & Sukriti — 24 November 2026.',
  shareTitle: "Hemant & Sukriti · You're Invited",
  shareDescription:
    'Join us as we celebrate our wedding — 24 November 2026. Tap to open your invitation.',
  // 1200×630 image in public/ for the WhatsApp / social preview.
  shareImage: '/og-image.jpg',
  // Browser UI colour on mobile — match the page background.
  themeColor: '#fdf9ef',
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
