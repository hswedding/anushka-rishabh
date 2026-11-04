/* ============================================================================
 *  Google Sheets for RSVPs — a formatted "RSVPs" tab and one typed row per
 *  reply, written as a Google service account (its JSON key is `saKey`).
 *  Plain fetch + WebCrypto, so the same file runs in a Cloudflare Worker
 *  (here) and in a Vercel function (Wedding-Invitation keeps it as
 *  api/_sheets.js) — keep the copies in step.
 *
 *  A column is { header, kind, width, tally }; `kind` picks how its cells are
 *  stored and shown (KINDS). A `tally` column (a function's ✓ column) names
 *  the column it adds up: its header shows the running total under the name,
 *  e.g. "Haldi / 42 coming" = the Guests of every ✓ row. Rows go in with
 *  appendCells as typed values — a guest's "=…" is a string, never a
 *  formula, and dates are real dates that sort.
 * ========================================================================== */

export const TAB = 'RSVPs';

const SHEET_RE = /\/spreadsheets\/d\/([\w-]{20,})/;
/** The sheet id in a Google Sheets link (or a bare id), else ''. */
export const sheetIdOf = (s = '') => SHEET_RE.exec(s)?.[1] || (/^[\w-]{20,}$/.test(s.trim()) ? s.trim() : '');
export const sheetUrl = (id, gid) =>
  (id ? `https://docs.google.com/spreadsheets/d/${id}/edit${gid != null ? `#gid=${gid}` : ''}` : '');

const KINDS = {
  text: { wrapStrategy: 'WRAP' },
  list: { wrapStrategy: 'WRAP' },
  check: { horizontalAlignment: 'CENTER', textFormat: { bold: true } },
  number: { horizontalAlignment: 'CENTER' },
  datetime: { numberFormat: { type: 'DATE_TIME', pattern: 'd mmm yyyy, h:mm am/pm' } },
  date: { numberFormat: { type: 'DATE', pattern: 'ddd, d mmm yyyy' } },
};
const format = (kind) => ({ verticalAlignment: 'MIDDLE', ...KINDS[kind] });

// Sheets counts days from 30 Dec 1899; times are the wall clock in India.
const IST_MS = 330 * 60 * 1000;
const serial = (ms) => ms / 86400000 + 25569;

function cell(kind, v) {
  const out = { userEnteredFormat: format(kind) };
  if (v == null || v === '') return out;
  let value;
  if (kind === 'datetime' && v instanceof Date) value = { numberValue: serial(v.getTime() + IST_MS) };
  else if (kind === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(v)) value = { numberValue: serial(Date.parse(`${v}T00:00Z`)) };
  else if (kind === 'number' && Number.isFinite(Number(v))) value = { numberValue: Number(v) };
  else value = { stringValue: String(v) };
  return { ...out, userEnteredValue: value };
}

/** Append one reply to the tab with id `gid`; `values` line up with `columns`. */
export function appendRow(saKey, id, gid, columns, values) {
  return sheets(saKey, `${id}:batchUpdate`, 'POST', {
    requests: [{
      appendCells: {
        sheetId: gid,
        rows: [{ values: columns.map((c, i) => cell(c.kind, values[i])) }],
        fields: 'userEnteredValue,userEnteredFormat',
      },
    }],
  });
}

/** The column headers, in order — when they change, the tab needs setting up again. */
export const layoutOf = (columns) => columns.map((c) => c.header).join('|');

/** The RSVPs tab's id when its header row already matches `columns`, else
 *  null (no tab yet, or the functions in data.js changed since). */
export async function tabFor(saKey, id, columns) {
  const meta = await sheets(saKey, `${id}?fields=${encodeURIComponent('sheets.properties(sheetId,title)')}`);
  const gid = meta.sheets?.find((s) => s.properties.title === TAB)?.properties.sheetId;
  if (gid == null) return null;
  const top = (await sheets(saKey, `${id}/values/${encodeURIComponent(`'${TAB}'!1:1`)}`)).values?.[0] || [];
  // A tally header reads "Haldi\n42 coming": compare the name line only.
  return columns.every((c, i) => String(top[i] ?? '').split('\n')[0] === c.header) ? gid : null;
}

/** Spreadsheet column letter for a 0-based index: 0 → A, 26 → AA. */
const letter = (i) => (i >= 26 ? letter(Math.floor(i / 26) - 1) : '') + String.fromCharCode(65 + (i % 26));

/** A header cell: the name, or for a tally column the name over its total. */
function headerValue(c, columns) {
  const sum = columns.findIndex((x) => x.header === c.tally);
  if (sum < 0) return { stringValue: c.header };
  const own = letter(columns.indexOf(c));
  const by = letter(sum);
  return {
    formulaValue: `="${c.header.replace(/"/g, '""')}"&CHAR(10)&SUMIF(${own}$2:${own},"✓",${by}$2:${by})&" coming"`,
  };
}

/**
 * Make (or tidy) the RSVPs tab and return its id: a bold coloured header row
 * that stays put while scrolling, sized columns, alternating row colours and
 * a filter on every column. Takes over the first tab when it is empty or
 * already holds RSVPs from before this tab existed (A1 = "Received");
 * otherwise adds the tab in front. Safe to run again — it re-applies the look
 * and rewrites only the header row.
 */
export async function setupTab(saKey, id, columns, { header = '#3e5141', band = '#f4f3e8' } = {}) {
  const meta = await sheets(saKey,
    `${id}?fields=${encodeURIComponent('sheets(properties(sheetId,title,index),bandedRanges(bandedRangeId))')}`);
  const tabs = meta.sheets || [];
  let tab = tabs.find((s) => s.properties.title === TAB);
  if (!tab && tabs.length) {
    const first = tabs.reduce((a, b) => (b.properties.index < a.properties.index ? b : a));
    const range = encodeURIComponent(`'${first.properties.title.replace(/'/g, "''")}'!A1:Z20`);
    const top = (await sheets(saKey, `${id}/values/${range}`)).values || [];
    if (!top.length || top[0][0] === 'Received') tab = first;
  }

  const gid = tab ? tab.properties.sheetId : Math.floor(Math.random() * 2e9);
  const n = columns.length;
  const cols = { sheetId: gid, startColumnIndex: 0, endColumnIndex: n };
  const requests = [
    tab
      ? { updateSheetProperties: {
          properties: { sheetId: gid, title: TAB, gridProperties: { frozenRowCount: 1 } },
          fields: 'title,gridProperties.frozenRowCount',
        } }
      : { addSheet: { properties: { sheetId: gid, title: TAB, index: 0, gridProperties: { frozenRowCount: 1 } } } },
    // Banding can't overlap, so drop any earlier one before adding ours.
    ...(tab?.bandedRanges || []).map((b) => ({ deleteBanding: { bandedRangeId: b.bandedRangeId } })),
    { updateCells: {
        start: { sheetId: gid, rowIndex: 0, columnIndex: 0 },
        rows: [{ values: columns.map((c) => ({
          userEnteredValue: headerValue(c, columns),
          userEnteredFormat: {
            backgroundColor: rgb(header),
            textFormat: { bold: true, fontSize: 11, foregroundColor: rgb('#ffffff') },
            horizontalAlignment: 'CENTER', verticalAlignment: 'MIDDLE', wrapStrategy: 'WRAP',
          },
        })) }],
        fields: 'userEnteredValue,userEnteredFormat',
    } },
    { updateDimensionProperties: {
        range: { sheetId: gid, dimension: 'ROWS', startIndex: 0, endIndex: 1 },
        properties: { pixelSize: columns.some((c) => c.tally) ? 56 : 36 }, fields: 'pixelSize',
    } },
    ...columns.map((c, i) => ({ updateDimensionProperties: {
        range: { sheetId: gid, dimension: 'COLUMNS', startIndex: i, endIndex: i + 1 },
        properties: { pixelSize: c.width || 140 }, fields: 'pixelSize',
    } })),
    // Rows typed in by hand, or kept from before, look like the new ones.
    ...columns.map((c, i) => ({ repeatCell: {
        range: { sheetId: gid, startRowIndex: 1, startColumnIndex: i, endColumnIndex: i + 1 },
        cell: { userEnteredFormat: format(c.kind) },
        fields: 'userEnteredFormat(numberFormat,horizontalAlignment,verticalAlignment,wrapStrategy)',
    } })),
    { addBanding: { bandedRange: {
        range: cols,
        rowProperties: { headerColor: rgb(header), firstBandColor: rgb('#ffffff'), secondBandColor: rgb(band) },
    } } },
    { setBasicFilter: { filter: { range: cols } } },
  ];
  await sheets(saKey, `${id}:batchUpdate`, 'POST', { requests });
  return gid;
}

function rgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return { red: (n >> 16) / 255, green: ((n >> 8) & 255) / 255, blue: (n & 255) / 255 };
}

async function sheets(saKey, path, method = 'GET', body) {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${path}`, {
    method,
    headers: { Authorization: `Bearer ${await accessToken(saKey)}`, 'Content-Type': 'application/json' },
    body: body && JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Google's own reason too: a 403 is also what a disabled Sheets API gives.
    const why = data.error?.message || `Google Sheets error ${res.status}`;
    throw new Error(res.status === 403 || res.status === 404
      ? `Can’t edit that sheet — share it with the service account as Editor. (Google: ${why})`
      : why);
  }
  return data;
}

/** The service account's address, for the builder's "share it with …" hint. */
export function serviceEmail(saKey) {
  try { return JSON.parse(saKey).client_email || ''; } catch { return ''; }
}

/* ---- Google sign-in as the service account (OAuth JWT bearer) ------------- */
let cached; // { token, exp } — reused while this instance lives

async function accessToken(saKey) {
  if (cached?.exp > Date.now()) return cached.token;
  if (!saKey) throw new Error('The GOOGLE_SA_KEY secret is not set.');
  const key = JSON.parse(saKey);
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
