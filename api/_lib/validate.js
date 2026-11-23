export const SHIFTS = ['1', '2', '3'];
export const LIMITS = { spk: 4, qc: 100, operator: 100, type: 100, event: 1000, machine: 50, color: 50, status: 100 };
export const MAX_QYT = 999999999;

const stripControl = (s) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');

/** Teks satu baris: hapus karakter kontrol, rapikan spasi. */
export function cleanText(v) {
  if (typeof v !== 'string') return '';
  return stripControl(v).replace(/\s+/g, ' ').trim();
}

/** Teks multi-baris (Event): pertahankan baris baru. */
export function cleanMultiline(v) {
  if (typeof v !== 'string') return '';
  return stripControl(v.replace(/\r\n?/g, '\n')).replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

/** Normalisasi SPK: tetap STRING, trim, rapikan spasi. */
export const normalizeSpk = (v) => cleanText(typeof v === 'number' ? String(v) : v);

/** Kunci pembanding SPK (exact match, tidak peka huruf besar/kecil). */
export const spkKey = (v) => normalizeSpk(v).toUpperCase();

function isRealDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function validateRecord(body) {
  const errors = {};
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { errors: { _: 'Format data tidak valid.' } };
  }
  const value = {
    date: cleanText(body.date),
    shift: cleanText(String(body.shift ?? '')),
    spk: normalizeSpk(body.spk),
    qc: cleanText(body.qc),
    operator: cleanText(body.operator),
    type: cleanText(body.type),
    event: cleanMultiline(body.event),
    machine: cleanText(body.machine),
    color: cleanText(body.color),
    status: cleanText(body.status),
  };

  if (!value.date) errors.date = 'Tanggal wajib diisi.';
  else if (!isRealDate(value.date)) errors.date = 'Format tanggal tidak valid.';

  if (!SHIFTS.includes(value.shift)) errors.shift = 'Shift tidak valid.';

  const labels = { spk: 'SPK', qc: 'QC', operator: 'Operator', type: 'Type', event: 'Event', machine: 'Mesin', color: 'Color' };
  for (const k of Object.keys(labels)) {
    if (!value[k]) errors[k] = `${labels[k]} wajib diisi.`;
    else if (value[k].length > LIMITS[k]) errors[k] = `${labels[k]} maksimal ${LIMITS[k]} karakter.`;
  }
  if (!/^\d{4}$/.test(value.spk)) errors.spk = 'SPK harus tepat 4 angka.';
  if (!value.status) errors.status = 'Status wajib diisi.';
  else if (value.status.length > LIMITS.status) errors.status = `Status maksimal ${LIMITS.status} karakter.`;

  const raw = typeof body.qyt === 'string' ? body.qyt.trim() : body.qyt;
  if (raw === '' || raw === null || raw === undefined) errors.qyt = 'QYT wajib diisi.';
  else if ((typeof raw === 'string' && !/^\d+$/.test(raw)) || (typeof raw === 'number' && !Number.isInteger(raw))) {
    errors.qyt = 'QYT harus berupa angka bulat positif.';
  } else {
    const n = Number(raw);
    if (!Number.isSafeInteger(n) || n <= 0) errors.qyt = 'QYT harus lebih dari 0.';
    else if (n > MAX_QYT) errors.qyt = 'QYT terlalu besar.';
    else value.qyt = n;
  }

  return Object.keys(errors).length ? { errors } : { value };
}
