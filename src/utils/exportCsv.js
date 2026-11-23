import { formatDate, formatTimestamp, compactToday } from './date.js';

const HEAD = ['No', 'ID', 'Timestamp', 'Tanggal', 'Shift', 'SPK', 'QC', 'Operator', 'QYT', 'Type', 'Event', 'Mesin', 'Color', 'Status'];

/** Cegah formula injection di Excel: nilai berawalan = + - @ diberi apostrof. */
export function safeCell(v) {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export function buildCsv(records) {
  const rows = records.map((r, i) => [i + 1, r.id, formatTimestamp(r.timestamp), formatDate(r.date), r.shift, r.spk, r.qc, r.operator, r.qyt, r.type, r.event, r.machine, r.color, r.status]);
  const lines = [HEAD, ...rows].map((row) => row.map(safeCell).join(','));
  return '\uFEFF' + lines.join('\r\n'); // BOM agar Excel membaca UTF-8
}

export function downloadCsv(records, spk) {
  const blob = new Blob([buildCsv(records)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SPK_${String(spk).replace(/[^\w.-]+/g, '_')}_${compactToday()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
