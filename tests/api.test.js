import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRecord, spkKey } from '../api/_lib/validate.js';
import { __setClientForTest, HEADERS, wibTimestamp } from '../api/_lib/sheets.js';
import records from '../api/records.js';
import search from '../api/search.js';
import exportAll from '../api/export.js';
import health from '../api/health.js';
import { buildCsv, safeCell } from '../src/utils/exportCsv.js';

process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = 'x@y.iam.gserviceaccount.com';
process.env.GOOGLE_PRIVATE_KEY = 'dummy';
process.env.GOOGLE_SHEET_ID = 'sheet';
process.env.GOOGLE_SHEET_NAME = 'DATABASE';

function fakeSheets({ withHeader = false } = {}) {
  const rows = withHeader ? [HEADERS] : [];
  const calls = { batchUpdate: 0 };
  const rng = (r) => r.split('!')[1];
  return {
    rows, calls,
    spreadsheets: {
      get: async () => ({ data: { sheets: [{ properties: { title: 'DATABASE', sheetId: 7 } }] } }),
      batchUpdate: async () => { calls.batchUpdate++; return { data: {} }; },
      values: {
        get: async ({ range }) => {
          const r = rng(range);
          if (r === 'A1:M1') return { data: { values: rows.length ? [rows[0]] : undefined } };
          if (r === 'E2:E') return { data: { values: rows.slice(1).map((x) => [x[4]]) } };
          return { data: { values: rows.slice(1) } };
        },
        update: async ({ requestBody }) => { rows[0] = requestBody.values[0]; return { data: {} }; },
        append: async ({ requestBody }) => { rows.push(...requestBody.values.map((v) => v.map(String))); return { data: {} }; },
        batchGet: async ({ ranges }) => ({
          data: { valueRanges: ranges.map((r) => ({ values: [rows[Number(rng(r).match(/A(\d+):/)[1]) - 1]] })) },
        }),
      },
    },
  };
}

function call(handler, { method = 'GET', query = {}, body, headers = {} } = {}) {
  return new Promise((resolve) => {
    const res = {
      headers: {}, setHeader(k, v) { this.headers[k] = v; },
      status(c) { this.code = c; return this; },
      json(b) { resolve({ status: this.code, body: b }); },
    };
    handler({ method, query, body, headers }, res);
  });
}

const valid = { date: '2026-11-19', shift: '1', spk: ' 3456 ', qc: 'Budi', operator: 'Andi', qyt: 100, type: 'A', event: 'Defect A', machine: 'M01', color: 'Black', status: 'OK' };

test('validasi: data valid, SPK tetap string dengan leading zero', () => {
  const { value, errors } = validateRecord(valid);
  assert.equal(errors, undefined);
  assert.equal(value.spk, '3456');
  assert.equal(value.qyt, 100);
});

test('validasi: field wajib, QYT, tanggal, shift', () => {
  for (const bad of [{ ...valid, spk: '  ' }, { ...valid, spk: '123' }, { ...valid, spk: '12345' }, { ...valid, status: '' }, { ...valid, qyt: 0 }, { ...valid, qyt: '12a' }, { ...valid, qyt: 1.5 }, { ...valid, qyt: '' }, { ...valid, date: '2026-02-30' }, { ...valid, shift: '9' }, { ...valid, event: '' }]) {
    assert.ok(validateRecord(bad).errors, JSON.stringify(bad));
  }
  assert.ok(validateRecord(null).errors);
});

test('spkKey: leading zero dibedakan, substring tidak sama', () => {
  assert.notEqual(spkKey('00123456'), spkKey('123456'));
  assert.notEqual(spkKey('123456'), spkKey('1234567'));
});

test('wibTimestamp berformat +07:00', () => {
  assert.match(wibTimestamp(), /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+07:00$/);
});

test('POST /api/records + GET /api/search + export (alur dua komputer)', async () => {
  const fake = fakeSheets();
  __setClientForTest(fake);

  const wrongMethod = await call(records, { method: 'GET' });
  assert.equal(wrongMethod.status, 405);

  const bad = await call(records, { method: 'POST', body: { ...valid, qyt: -1 } });
  assert.equal(bad.status, 400);
  assert.ok(bad.body.errors.qyt);

  const r1 = await call(records, { method: 'POST', body: valid });
  assert.equal(r1.status, 201);
  assert.equal(r1.body.record.spk, '3456');
  assert.match(r1.body.record.id, /^[0-9a-f-]{36}$/);
  assert.equal(fake.rows[0][0], 'ID', 'header dibuat otomatis');
  assert.equal(fake.rows[1][4], '3456');
  assert.equal(fake.rows[1][12], 'OK');
  assert.equal(typeof fake.rows[1][4], 'string');

  await call(records, { method: 'POST', body: { ...valid, operator: 'Deni', qyt: 50, event: '=HYPERLINK("x")' } });
  await call(records, { method: 'POST', body: { ...valid, spk: '3457' } });
  await call(records, { method: 'POST', body: { ...valid, spk: '3458' } });
  assert.equal(fake.rows.length, 5, 'setiap input = record baru, tidak menimpa');

  const s = await call(search, { query: { spk: '3456' } });
  assert.equal(s.status, 200);
  assert.equal(s.body.total, 2);
  assert.ok(s.body.records.every((r) => r.spk === '3456'));
  assert.equal(s.body.records[0].qyt, 50, 'terbaru di atas');

  assert.equal((await call(search, { query: { spk: '3457' } })).body.total, 1);
  assert.equal((await call(search, { query: { spk: '9999' } })).body.total, 0);
  assert.equal((await call(search, { query: { spk: '' } })).status, 400);

  const all = await call(exportAll);
  assert.equal(all.body.total, 4);
});

test('SPK 4 digit tetap dibaca sebagai string', async () => {
  const fake = fakeSheets({ withHeader: true });
  __setClientForTest(fake);
  await call(records, { method: 'POST', body: { ...valid, spk: '0345' } });
  const s = await call(search, { query: { spk: '0345' } });
  assert.equal(s.body.total, 1);
});

test('error Google tidak bocor ke pengguna', async () => {
  const fake = fakeSheets();
  fake.spreadsheets.get = async () => { throw new Error('PRIVATE KEY SECRET stack'); };
  __setClientForTest(fake);
  const origErr = console.error; console.error = () => {};
  const r = await call(records, { method: 'POST', body: valid });
  console.error = origErr;
  assert.equal(r.status, 500);
  assert.ok(!JSON.stringify(r.body).includes('SECRET'));
});

test('credentials tidak tersedia -> 503 jelas', async () => {
  __setClientForTest(null);
  const saved = process.env.GOOGLE_SHEET_ID;
  delete process.env.GOOGLE_SHEET_ID;
  const r = await call(search, { query: { spk: '9999' } });
  process.env.GOOGLE_SHEET_ID = saved;
  assert.equal(r.status, 503);
  const h = await call(health);
  assert.equal(h.status, 200);
  assert.equal(h.body.status, 'ok');
  assert.equal(h.body.configured, true);
});

test('CSV: BOM, escape, dan proteksi formula injection', () => {
  assert.equal(safeCell('=1+1'), `"'=1+1"`);
  assert.equal(safeCell('a"b'), '"a""b"');
  const csv = buildCsv([{ id: '1', timestamp: '2026-11-19T08:00:00+07:00', date: '2026-11-19', shift: '1', spk: '3456', qc: '@x', operator: 'A', qyt: 5, type: 'T', event: 'a\nb', machine: 'M', color: 'C', status: 'OK' }]);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('"3456"') && csv.includes(`"'@x"`) && csv.includes('19/11/2026') && csv.includes('"OK"'));
});
