/* ============================================================================
 *  RSVP → Google Sheet. The family pastes a sheet link in the builder (shared
 *  as Editor with the service account); it's kept in KV and every RSVP is
 *  appended to its "RSVPs" tab as one row. A Google service account does the
 *  writing: its JSON key is the GOOGLE_SA_KEY secret (README "RSVP sheet").
 *  The Sheets calls and the tab's look are in ./sheets.js.
 *
 *    POST /api/rsvp    { name, phone, party, arrival, guestName, functions }
 *                      → one row (functions: the event ids on their link,
 *                      listed under "Invited to" and ✓ in each one's column)
 *    GET  /api/sheet   the saved sheet link, the account's email (X-Builder)
 *    POST /api/sheet   { url } → set up the RSVPs tab, save   (X-Builder header)
 * ========================================================================== */
import { config, events } from '../src/data.js';
import { appendRow, headerOk, layoutOf, setupTab, sheetIdOf, sheetUrl, serviceEmail } from './sheets.js';

// Columns A–F match the rows written before the tab was formatted, so a
// sheet that already holds RSVPs keeps lining up. Then one ✓ column per
// function, its header totalling the Guests of its ✓ rows — rename, add or
// remove a function in data.js only before RSVPs come in, or the old rows'
// ✓s sit under the wrong headers.
const COLUMNS = [
  { header: 'Received', kind: 'datetime', width: 170 },
  { header: 'Name', kind: 'text', width: 180 },
  { header: 'Phone', kind: 'text', width: 150 },
  { header: 'Guests', kind: 'number', width: 80 },
  { header: 'Arriving', kind: 'date', width: 140 },
  { header: 'Name on their link', kind: 'text', width: 170 },
  { header: 'Invited to', kind: 'list', width: 300 },
  ...events.map((e) => ({ header: e.name, kind: 'check', width: 130, tally: 'Guests' })),
];
const LAYOUT = layoutOf(COLUMNS);
const COLOURS = { header: '#3e5141', band: '#f4f3e8' }; // tokens.css --gold-deep / --gold-wash

export async function handleApi(request, env) {
  const { pathname } = new URL(request.url);
  try {
    if (pathname === '/api/rsvp' && request.method === 'POST') return await rsvp(request, env);
    if (pathname === '/api/sheet') return await sheet(request, env);
    return json({ error: 'Not found' }, 404);
  } catch (e) {
    return json({ error: e.message }, 502);
  }
}

async function rsvp(request, env) {
  const id = await env.SETTINGS.get('sheet');
  if (!id) return json({ error: 'No RSVP sheet saved in the builder yet' }, 503);
  const a = await request.json().catch(() => ({}));
  const cell = (v, max = 100) => String(v ?? '').trim().slice(0, max);
  const name = cell(a.name);
  const phone = cell(a.phone, 20);
  if (!name || !phone) return json({ error: 'Name and phone are required' }, 400);
  // Only real functions, in the order of the day, by their names.
  const asked = new Set(Array.isArray(a.functions) ? a.functions : []);
  const functions = events.filter((e) => asked.has(e.id)).map((e) => e.name).join(', ');
  // ponytail: anyone can POST here (as anyone could send the old WhatsApp
  // RSVP); add a Turnstile check if a sheet ever fills with spam.
  const row = [
    new Date(), name, phone, Math.min(Math.max(Number(a.party) || 1, 1), 20),
    cell(a.arrival, 10), cell(a.guestName), functions,
    ...events.map((e) => (asked.has(e.id) ? '✓' : '')),
  ];

  const tab = await savedTab(env);
  try {
    if (tab?.layout !== LAYOUT) throw new Error('tab not set up for these columns');
    // The family may have deleted or cleared the header row since.
    if (!(await headerOk(env.GOOGLE_SA_KEY, id, COLUMNS))) throw new Error('header row missing');
    await appendRow(env.GOOGLE_SA_KEY, id, tab.gid, COLUMNS, row);
  } catch {
    // First RSVP since the sheet was saved without a tab, the functions in
    // data.js changed, the header row or the tab was deleted: (re)make it
    // (header back on top, no reply overwritten), then write.
    await appendRow(env.GOOGLE_SA_KEY, id, await setup(env, id), COLUMNS, row);
  }
  return json({ ok: true });
}

/** { gid, layout } of the RSVPs tab as last set up, or null. */
async function savedTab(env) {
  try { return JSON.parse(await env.SETTINGS.get('sheetTab')); } catch { return null; }
}

async function setup(env, id) {
  const gid = await setupTab(env.GOOGLE_SA_KEY, id, COLUMNS, COLOURS);
  await env.SETTINGS.put('sheetTab', JSON.stringify({ gid, layout: LAYOUT }));
  return gid;
}

async function sheet(request, env) {
  if (request.headers.get('X-Builder') !== config.links.builder) return json({ error: 'Forbidden' }, 403);
  if (request.method === 'GET') {
    const [id, tab] = await Promise.all([env.SETTINGS.get('sheet'), savedTab(env)]);
    return json({ url: sheetUrl(id, tab?.gid), email: serviceEmail(env.GOOGLE_SA_KEY) });
  }

  const { url } = await request.json().catch(() => ({}));
  const id = sheetIdOf(url);
  if (!id) return json({ error: 'That isn’t a Google Sheets link.' }, 400);
  // Setting up the tab proves the sheet is editable before any guest's RSVP
  // depends on it; only then is it saved.
  const gid = await setup(env, id);
  await env.SETTINGS.put('sheet', id);
  return json({ url: sheetUrl(id, gid) });
}

const json = (data, status = 200) => Response.json(data, { status });
