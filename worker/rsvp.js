/* ============================================================================
 *  RSVP → Google Sheet. The family pastes a sheet link in the builder (shared
 *  "Anyone with the link → Editor"); it's kept in KV and every RSVP is
 *  appended to it as one row. A Google service account does the writing: its
 *  JSON key is the GOOGLE_SA_KEY secret (README "RSVP sheet").
 *
 *    POST /api/rsvp    { name, phone, party, arrival, guestName } → one row
 *    GET  /api/sheet   the saved sheet link            (X-Builder header)
 *    POST /api/sheet   { url } → check access, save    (X-Builder header)
 * ========================================================================== */
import { config } from '../src/data.js';

const HEADER = ['Received', 'Name', 'Phone', 'Guests', 'Arrival', 'Invited as'];
const SHEET_RE = /\/spreadsheets\/d\/([\w-]{20,})/;
const sheetUrl = (id) => (id ? `https://docs.google.com/spreadsheets/d/${id}/edit` : '');

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
  // ponytail: anyone can POST here (as anyone could send the old WhatsApp
  // RSVP); add a Turnstile check if a sheet ever fills with spam.
  const row = [
    new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    name, phone, Math.min(Number(a.party) || 1, 20), cell(a.arrival, 10), cell(a.guestName),
  ];
  // RAW, so a guest's "=…" lands as text, never as a formula.
  await sheets(env, `${id}/values/A1:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, 'POST', { values: [row] });
  return json({ ok: true });
}

async function sheet(request, env) {
  if (request.headers.get('X-Builder') !== config.links.builder) return json({ error: 'Forbidden' }, 403);
  if (request.method === 'GET') return json({ url: sheetUrl(await env.SETTINGS.get('sheet')) });

  const { url } = await request.json().catch(() => ({}));
  const id = SHEET_RE.exec(url || '')?.[1];
  if (!id) return json({ error: 'That isn’t a Google Sheets link.' }, 400);
  // Write row 1 back as it is (or the header, on an empty sheet): proves the
  // sheet is editable before any guest's RSVP depends on it.
  const top = await sheets(env, `${id}/values/A1:F1?valueRenderOption=FORMULA`);
  await sheets(env, `${id}/values/A1:F1?valueInputOption=USER_ENTERED`, 'PUT', { values: top.values ?? [HEADER] });
  await env.SETTINGS.put('sheet', id);
  return json({ url: sheetUrl(id) });
}

async function sheets(env, path, method = 'GET', body) {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${path}`, {
    method,
    headers: { Authorization: `Bearer ${await accessToken(env)}`, 'Content-Type': 'application/json' },
    body: body && JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 403 || res.status === 404) {
    throw new Error('Can’t edit that sheet — share it as “Anyone with the link → Editor”.');
  }
  if (!res.ok) throw new Error(data.error?.message || 'Google Sheets error');
  return data;
}

/* ---- Google sign-in as the service account (OAuth JWT bearer) ------------- */
let cached; // { token, exp } — reused while this Worker instance lives

async function accessToken(env) {
  if (cached?.exp > Date.now()) return cached.token;
  if (!env.GOOGLE_SA_KEY) throw new Error('The GOOGLE_SA_KEY secret is not set.');
  const key = JSON.parse(env.GOOGLE_SA_KEY);
  const now = Math.floor(Date.now() / 1000);
  const part = (o) => b64url(new TextEncoder().encode(JSON.stringify(o)));
  const unsigned = `${part({ alg: 'RS256', typ: 'JWT' })}.${part({
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })}`;
  const der = Uint8Array.from(atob(key.private_key.replace(/-----[^-]+-----|\s/g, '')), (c) => c.charCodeAt(0));
  const signer = await crypto.subtle.importKey(
    'pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', signer, new TextEncoder().encode(unsigned));

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${b64url(new Uint8Array(sig))}`,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || 'Google sign-in failed');
  cached = { token: data.access_token, exp: Date.now() + (data.expires_in - 60) * 1000 };
  return cached.token;
}

const b64url = (bytes) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const json = (data, status = 200) => Response.json(data, { status });
