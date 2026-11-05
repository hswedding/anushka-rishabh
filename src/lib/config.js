/* ============================================================================
 *  URL path → page.  No backend: every guest variant is encoded in the path.
 *
 *    /                     closed — guests only ever get a full link
 *    /{links.builder}      the invitation builder (the family only)
 *    /{links.all}          ready-made invitation with every function
 *    /{token}              a builder-made guest link
 *
 *  A token is the variant's query string (below), check-summed and scrambled,
 *  so a guest can't read or edit it into another variant — a tampered token
 *  opens the closed page. Obscure, not secured: the scheme ships in the JS.
 *
 *  Single-family site: the hosting side is fixed by `host.side` in data.js,
 *  so there is no `side` param (old links that carry one simply ignore it).
 *
 *  Query string inside a token:
 *    fns       csv of event ids             (which functions to show)
 *    preset    a key of `presets` in data.js
 *    to        guest name (personalised greeting)
 *    envelope/photos/rsvp = 0              (hide that part; without the
 *                                           envelope the page opens straight
 *                                           away and its film never loads)
 *  Venue & Travel is on every invitation — an old link's venue=0 is ignored.
 * ========================================================================== */
import { TOKEN_KEY } from './tokenKey.js';
import { couple, events, presets, host, config } from '../data.js';

const EVENT_IDS = events.map((e) => e.id);
export const SECTION_IDS = ['envelope', 'photos', 'rsvp'];

/** Keep only known ids, preserve canonical chronological order. */
function sanitiseIds(ids) {
  const set = new Set(ids);
  return EVENT_IDS.filter((id) => set.has(id));
}

/** Couple names in hosting-side order: a bride-side site puts the bride first. */
export function orderedCouple(side = host.side) {
  return side === 'bride' ? [couple.bride, couple.groom] : [couple.groom, couple.bride];
}

/** Builder state a preset stands for: its functions and sections. */
export function presetState(key) {
  const p = presets[key];
  return {
    side: host.side,
    eventIds: sanitiseIds(p.ids),
    sections: Object.fromEntries(SECTION_IDS.map((id) => [id, !p.hide?.includes(id)])),
  };
}

/* ---- tokens -------------------------------------------------------------- */
// Never change TOKEN_KEY (src/lib/tokenKey.js): every guest link already
// sent is scrambled with it.
const KEY = new TextEncoder().encode(TOKEN_KEY);
const scramble = (bytes) => bytes.map((b, i) => b ^ KEY[i % KEY.length]);
const toB64 = (bytes) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64 = (s) =>
  Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

/** FNV-1a, as 4 bytes. */
function checksum(bytes) {
  let h = 0x811c9dc5;
  for (const b of bytes) h = Math.imul(h ^ b, 0x01000193);
  return [h >>> 24, (h >>> 16) & 255, (h >>> 8) & 255, h & 255];
}

export function encodeToken(query) {
  const body = new TextEncoder().encode(query.replace(/^\?/, ''));
  return toB64(scramble(Uint8Array.from([...checksum(body), ...body])));
}

/** Token → query string, or null if it isn't one of ours. */
function decodeToken(token) {
  try {
    const bytes = scramble(fromB64(token));
    const body = bytes.slice(4);
    if (checksum(body).some((b, i) => b !== bytes[i])) return null;
    return new TextDecoder('utf-8', { fatal: true }).decode(body);
  } catch {
    return null;
  }
}

// Links sent before tokens were plain base64 of the query string. Accept them
// only if every key is one the old builder wrote, so a random path stays closed.
// ponytail: these stay readable/forgeable; delete once guests have new links.
const LEGACY_KEYS = new Set([
  'side', 'fns', 'preset', 'to', 'host', 'story', 'music', 'venue', 'scratch', 'countdown',
  ...SECTION_IDS,
]);
function decodeLegacy(slug) {
  try {
    const q = atob(slug.replace(/-/g, '+').replace(/_/g, '/'));
    const keys = [...new URLSearchParams(q).keys()];
    return keys.length && keys.every((k) => LEGACY_KEYS.has(k)) ? q : null;
  } catch {
    return null;
  }
}

/* ---- routing ------------------------------------------------------------- */
/** { page: 'builder' } | { page: 'invite', invite } | { page: 'closed' } */
export function parseRoute(pathname = '') {
  const slug = pathname.replace(/^\/+|\/+$/g, '');
  if (!slug) return { page: 'closed' };
  if (slug === config.links.builder) return { page: 'builder' };
  if (slug === config.links.all) return { page: 'invite', invite: { ...presetState('all'), guestName: '' } };

  const q = decodeToken(slug) ?? decodeLegacy(slug);
  return q == null ? { page: 'closed' } : { page: 'invite', invite: parseInvitation(q) };
}

export function parseInvitation(query = '') {
  const p = new URLSearchParams(query);

  // function selection: preset > fns > every function
  let ids;
  const presetKey = p.get('preset');
  if (presetKey && presets[presetKey]) {
    ids = presets[presetKey].ids;
  } else if (p.has('fns')) {
    ids = (p.get('fns') || '').split(',').map((s) => s.trim());
  } else {
    ids = events.map((e) => e.id);
  }

  return {
    side: host.side, // fixed per site
    eventIds: sanitiseIds(ids),
    sections: Object.fromEntries(SECTION_IDS.map((id) => [id, p.get(id) !== '0'])),
    guestName: (p.get('to') || '').trim(),
  };
}

/** Ordered, hydrated event objects for the current selection, plus any
 *  `comesWith` event that joins a selected one. */
export function selectedEvents(eventIds) {
  const set = new Set(eventIds);
  return events
    .filter((e) => set.has(e.id) || set.has(e.comesWith))
    .sort((a, b) => a.order - b.order);
}

/** Build a query string from a builder state object. */
export function buildQuery(state) {
  const p = new URLSearchParams();
  if (state.guestName) p.set('to', state.guestName.trim());

  // store the function selection compactly: a matching preset name if possible,
  // otherwise the explicit id list.
  const sel = sanitiseIds(state.eventIds || []);
  const presetMatch = Object.entries(presets).find(
    ([, v]) => v.ids.length === sel.length && v.ids.every((id) => sel.includes(id))
  );
  if (presetMatch && presetMatch[0] === 'all') {
    /* default — omit for a clean link */
  } else if (presetMatch) {
    p.set('preset', presetMatch[0]);
  } else {
    p.set('fns', sel.join(','));
  }

  for (const id of SECTION_IDS) {
    if (state.sections && state.sections[id] === false) p.set(id, '0');
  }

  const qs = p.toString();
  return qs ? `?${qs}` : '';
}

/** Path for a builder state: the ready-made link when it matches every
 *  function exactly, otherwise a guest token. */
export function sharePath(state) {
  const q = buildQuery(state);
  return `/${q === buildQuery(presetState('all')) ? config.links.all : encodeToken(q)}`;
}

/** Absolute URL for a path on this site. */
export function siteUrl(path) {
  return (config.siteUrl || window.location.origin).replace(/\/$/, '') + path;
}

// WhatsApp's full send URL, not the wa.me short link: on a laptop wa.me
// redirects to this one and the redirect mangles emoji (💐 arrives blank on
// WhatsApp Web), while phones never take that hop.
const WA_SEND = 'https://api.whatsapp.com/send';

/** WhatsApp link to forward the invitation to a guest, closed with the hosting
 *  family's `host.waSignoff` (data.js) when it has one. */
export function buildWhatsAppShare(url, guestName, coupleNames, signoff = '') {
  const greeting = guestName ? `Dear ${guestName},\n\n` : '';
  const msg =
    `${greeting}With great joy, you are invited to the wedding celebrations of ` +
    `${coupleNames}. 💐\n\nOpen your invitation here:\n${url}` +
    (signoff ? `\n\n${signoff}` : '');
  return `${WA_SEND}?text=${encodeURIComponent(msg)}`;
}
