import { LIMITS } from '../config.js';

export const emptyForm = (today) => ({
  date: today, shift: '1', spk: '', qc: '', operator: '', qyt: '', type: '', event: '', machine: '', color: '', status: '',
});

const LABELS = { spk: 'SPK', qc: 'QC', operator: 'Operator', type: 'Type', event: 'Event', machine: 'Mesin', color: 'Color', status: 'Status' };

export function validateForm(f) {
  const e = {};
  if (!f.date) e.date = 'Tanggal wajib diisi.';
  if (!f.shift) e.shift = 'Shift wajib dipilih.';
  for (const k of Object.keys(LABELS)) {
    const v = String(f[k] ?? '').trim();
    if (!v) e[k] = `${LABELS[k]} wajib diisi.`;
    else if (v.length > LIMITS[k]) e[k] = `${LABELS[k]} maksimal ${LIMITS[k]} karakter.`;
  }
  if (f.spk.trim() && !/^\d{4}$/.test(f.spk.trim())) e.spk = 'SPK harus tepat 4 angka.';
  const q = String(f.qyt ?? '').trim();
  if (!q) e.qyt = 'QYT wajib diisi.';
  else if (!/^\d+$/.test(q)) e.qyt = 'QYT harus berupa angka bulat positif.';
  else if (Number(q) <= 0) e.qyt = 'QYT harus lebih dari 0.';
  return e;
}

/** Apakah pengguna sudah mengisi sesuatu (selain default)? */
export const isDirty = (f, today) =>
  ['spk', 'qc', 'operator', 'qyt', 'type', 'event', 'machine', 'color'].some((k) => String(f[k]).trim() !== '') ||
  f.date !== today || f.shift !== '1';
