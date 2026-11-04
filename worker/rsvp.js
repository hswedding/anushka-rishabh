/* ============================================================================
 *  RSVP → Google Sheet. The family pastes a sheet link in the builder (shared
 *  as Editor with the service account); it's kept in KV and every RSVP is
 *  appended to its "RSVPs" tab as one row. A Google service account does the
 *  writing: its JSON key is the GOOGLE_SA_KEY secret (README "RSVP sheet").
 *  The Sheets calls and the tab's look are in ./sheets.js.
 *
 *    POST /api/rsvp    { name, phone, party, arrival, guestName, functions }
 *                      → one row (functions: the event ids on their link)
 *    GET  /api/sheet   the saved sheet link, the account's email (X-Builder)
 *    POST /api/sheet   { url } → set up the RSVPs tab, save   (X-Builder header)
 * ========================================================================== */
import { config, events } from '../src/data.js';
import { appendRow, setupTab, sheetIdOf, sheetUrl, serviceEmail } from './sheets.js';

// Columns A–F match the rows written before the tab was formatted, so a
// sheet that already holds RSVPs keeps lining up.
const COLUMNS = [
  { header: 'Received', kind: 'datetime', width: 170 },
  { header: 'Name', kind: 'text', width: 180 },
  { header: 'Phone', kind: 'text', width: 150 },
  { header: 'Guests', kind: 'number', width: 80 },
  { header: 'Arriving', kind: 'date', width: 140 },
  { header: 'Name on their link', kind: 'text', width: 170 },
  { header: 'Invited to', kind: 'list', width: 300 },
];
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
  ];

  const tab = await env.SETTINGS.get('sheetTab');
  try {
    if (tab == null) throw new Error('no tab yet');
    await appendRow(env.GOOGLE_SA_KEY, id, Number(tab), COLUMNS, row);
  } catch {
    // First RSVP since the sheet was saved without a tab, or the tab was
    // deleted: (re)make it, then write.
    await appendRow(env.GOOGLE_SA_KEY, id, await setup(env, id), COLUMNS, row);
  }
  return json({ ok: true });
}

async function setup(env, id) {
  const gid = await setupTab(env.GOOGLE_SA_KEY, id, COLUMNS, COLOURS);
  await env.SETTINGS.put('sheetTab', String(gid));
  return gid;
}

async function sheet(request, env) {
  if (request.headers.get('X-Builder') !== config.links.builder) return json({ error: 'Forbidden' }, 403);
  if (request.method === 'GET') {
    const [id, tab] = await Promise.all([env.SETTINGS.get('sheet'), env.SETTINGS.get('sheetTab')]);
    return json({ url: sheetUrl(id, tab), email: serviceEmail(env.GOOGLE_SA_KEY) });
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
