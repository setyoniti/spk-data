import googleapis from 'googleapis';
import { randomUUID } from 'node:crypto';
import { AppError } from './http.js';
import { spkKey } from './validate.js';

const { google } = googleapis;

export const HEADERS = ['ID', 'Timestamp', 'Tanggal', 'Shift', 'SPK', 'QC', 'Operator', 'QYT', 'Type', 'Event', 'Mesin', 'Color', 'Status'];
const LAST_COL = 'M';
const state = { sheets: null, ready: false, sheetId: null };

/** Hanya untuk pengujian: suntik klien Google Sheets palsu. */
export function __setClientForTest(client) {
  state.sheets = client;
  state.ready = false;
}

function getConfig() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const name = (process.env.GOOGLE_SHEET_NAME || 'DATABASE').trim();
  if (!email || !rawKey || !spreadsheetId) {
    throw new AppError(503, 'Konfigurasi server belum lengkap. Hubungi administrator.');
  }
  // Private key bisa tersimpan dengan \n ter-escape, atau dibungkus tanda kutip.
  const key = rawKey.replace(/^"|"$/g, '').replace(/\\n/g, '\n');
  return { email, key, spreadsheetId, name };
}

const q = (name) => `'${name.replace(/'/g, "''")}'`;

function client(cfg) {
  if (!state.sheets) {
    const auth = new google.auth.JWT({
      email: cfg.email,
      key: cfg.key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    state.sheets = google.sheets({ version: 'v4', auth });
  }
  return state.sheets;
}

async function ctx() {
  const cfg = getConfig();
  const sheets = client(cfg);
  if (!state.ready) await ensureSheet(sheets, cfg);
  return { sheets, ...cfg };
}

/** Pastikan sheet DATABASE + header ada. Tidak pernah menghapus/menimpa data. */
async function ensureSheet(sheets, { spreadsheetId, name }) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties' });
  let props = (meta.data.sheets || []).map((s) => s.properties).find((p) => p.title === name);
  if (!props) {
    const r = await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: [{ addSheet: { properties: { title: name } } }] },
    });
    props = r.data.replies[0].addSheet.properties;
  }
  state.sheetId = props.sheetId;

  const head = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${q(name)}!A1:${LAST_COL}1` });
  if (!head.data.values || !head.data.values[0] || head.data.values[0].length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${q(name)}!A1:${LAST_COL}1`,
      valueInputOption: 'RAW',
      requestBody: { values: [HEADERS] },
    });
    await formatSheet(sheets, spreadsheetId, props.sheetId);
  }
  state.ready = true;
}

async function formatSheet(sheets, spreadsheetId, sheetId) {
  const col = (c, fmt) => ({
    repeatCell: {
      range: { sheetId, startRowIndex: 1, startColumnIndex: c, endColumnIndex: c + 1 },
      cell: { userEnteredFormat: { numberFormat: fmt } },
      fields: 'userEnteredFormat.numberFormat',
    },
  });
  const requests = [
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 12 },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.043, green: 0.12, blue: 0.24 },
            textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat)',
      },
    },
    { updateSheetProperties: { properties: { sheetId, gridProperties: { frozenRowCount: 1 } }, fields: 'gridProperties.frozenRowCount' } },
    col(0, { type: 'TEXT' }), // ID
    col(1, { type: 'TEXT' }), // Timestamp
    col(2, { type: 'TEXT' }), // Tanggal
    col(3, { type: 'TEXT' }), // Shift
    col(4, { type: 'TEXT' }), // SPK
    col(7, { type: 'NUMBER', pattern: '0' }), // QYT
    { setBasicFilter: { filter: { range: { sheetId, startRowIndex: 0, startColumnIndex: 0, endColumnIndex: 12 } } } },
  ];
  await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests } });
}

const toDateIso = (s) => {
  const t = String(s ?? '').trim();
  const m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); // jika diedit manual ke DD/MM/YYYY
  return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : t;
};

export function rowToRecord(row = []) {
  const c = (i) => String(row[i] ?? '');
  return {
    id: c(0),
    timestamp: c(1),
    date: toDateIso(row[2]),
    shift: c(3),
    spk: c(4),
    qc: c(5),
    operator: c(6),
    qyt: Number(String(row[7] ?? '0').replace(/,/g, '')) || 0,
    type: c(8),
    event: c(9),
    machine: c(10),
    color: c(11),
    status: c(12),
  };
}

/** Terbaru di atas. Jika timestamp sama, baris yang lebih bawah di spreadsheet (lebih baru diinput) di atas. */
const newestFirst = (list) =>
  list
    .map((r, i) => [r, i])
    .sort((a, b) => (b[0].timestamp || '').localeCompare(a[0].timestamp || '') || b[1] - a[1])
    .map(([r]) => r);

export function wibTimestamp(now = Date.now()) {
  return new Date(now + 7 * 3600 * 1000).toISOString().slice(0, 19) + '+07:00';
}

export async function appendRecord(v) {
  const { sheets, spreadsheetId, name } = await ctx();
  const record = {
    id: randomUUID(),
    timestamp: wibTimestamp(),
    date: v.date,
    shift: v.shift,
    spk: v.spk,
    qc: v.qc,
    operator: v.operator,
    qyt: v.qyt,
    type: v.type,
    event: v.event,
    machine: v.machine,
    color: v.color,
    status: v.status,
  };
  // RAW: teks tidak di-parse (leading zero aman, "=..." tidak jadi formula).
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${q(name)}!A:${LAST_COL}`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [[record.id, record.timestamp, record.date, record.shift, record.spk, record.qc, record.operator, record.qyt, record.type, record.event, record.machine, record.color, record.status]],
    },
  });
  return record;
}

/** Baca kolom SPK saja, lalu ambil hanya baris yang cocok persis. */
export async function findBySpk(spk) {
  const { sheets, spreadsheetId, name } = await ctx();
  const target = spkKey(spk);
  const col = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${q(name)}!E2:E`,
    valueRenderOption: 'FORMATTED_VALUE',
  });
  const rows = col.data.values || [];
  const ranges = [];
  rows.forEach((r, i) => {
    const storedSpk = spkKey(String(r?.[0] ?? ''));
    if (storedSpk.endsWith(target)) ranges.push(`${q(name)}!A${i + 2}:${LAST_COL}${i + 2}`);
  });
  const records = [];
  for (let i = 0; i < ranges.length; i += 100) {
    const res = await sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges: ranges.slice(i, i + 100),
      valueRenderOption: 'FORMATTED_VALUE',
    });
    for (const vr of res.data.valueRanges || []) if (vr.values?.[0]) records.push(rowToRecord(vr.values[0]));
  }
  return newestFirst(records);
}

/** Semua data (untuk export Excel). */
export async function listAll() {
  const { sheets, spreadsheetId, name } = await ctx();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${q(name)}!A2:${LAST_COL}`,
    valueRenderOption: 'FORMATTED_VALUE',
  });
  return newestFirst((res.data.values || []).filter((r) => r && r[4]).map(rowToRecord));
}

export function isConfigured() {
  return Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_SHEET_ID);
}

export const __sheetName = () => (process.env.GOOGLE_SHEET_NAME || 'DATABASE').trim();
