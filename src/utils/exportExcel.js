import { formatDate, formatTimestamp, monthKey, monthLabel, monthShortLabel, compactToday } from './date.js';

const HEAD = ['No', 'Bulan', 'Tanggal', 'Shift', 'SPK', 'QC', 'Operator', 'QYT', 'Type', 'Event', 'Mesin', 'Color', 'Status', 'Timestamp Input', 'ID'];
const WIDTHS = [6, 18, 12, 8, 18, 16, 16, 8, 14, 40, 12, 12, 16, 18, 38];

// Teks diawali = + - @ diberi apostrof agar tidak dibaca sebagai formula.
const safe = (v) => (/^[=+\-@]/.test(String(v ?? '')) ? `'${v}` : String(v ?? ''));

const toRow = (r, i) => [i + 1, monthLabel(monthKey(r.date)), formatDate(r.date), `Shift ${r.shift}`, safe(r.spk), safe(r.qc), safe(r.operator), Number(r.qyt) || 0, safe(r.type), safe(r.event), safe(r.machine), safe(r.color), safe(r.status), formatTimestamp(r.timestamp), r.id];

function sheetOf(XLSX, rows) {
  const ws = XLSX.utils.aoa_to_sheet([HEAD, ...rows]);
  ws['!cols'] = WIDTHS.map((wch) => ({ wch }));
  ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length, c: HEAD.length - 1 } }) };
  ws['!freeze'] = { xSplit: 0, ySplit: 1 };
  return ws;
}

/**
 * Workbook:
 *  - "Rekap Bulanan"  : jumlah record & total QYT per bulan
 *  - "Semua Data"     : seluruh data dengan kolom Bulan
 *  - satu sheet per bulan (mis. "Nov 2026")
 */
export async function exportExcel(records) {
  if (!records.length) throw new Error('Belum ada data untuk diekspor.');
  const XLSX = await import('xlsx');

  const sorted = [...records].sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.timestamp || '').localeCompare(b.timestamp || ''));
  const groups = new Map();
  for (const r of sorted) {
    const k = monthKey(r.date);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  }
  const keys = [...groups.keys()].sort();

  const recap = [['Bulan', 'Jumlah Record', 'Jumlah SPK', 'Total QYT']];
  keys.forEach((k) => {
    const g = groups.get(k);
    recap.push([monthLabel(k), g.length, new Set(g.map((r) => r.spk)).size, g.reduce((s, r) => s + (Number(r.qyt) || 0), 0)]);
  });
  recap.push(['TOTAL', sorted.length, new Set(sorted.map((r) => r.spk)).size, sorted.reduce((s, r) => s + (Number(r.qyt) || 0), 0)]);
  const wsRecap = XLSX.utils.aoa_to_sheet(recap);
  wsRecap['!cols'] = [{ wch: 20 }, { wch: 16 }, { wch: 14 }, { wch: 14 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsRecap, 'Rekap Bulanan');
  XLSX.utils.book_append_sheet(wb, sheetOf(XLSX, sorted.map(toRow)), 'Semua Data');
  const used = new Set(['Rekap Bulanan', 'Semua Data']);
  keys.forEach((k) => {
    let name = monthShortLabel(k).slice(0, 31);
    while (used.has(name)) name += '_';
    used.add(name);
    XLSX.utils.book_append_sheet(wb, sheetOf(XLSX, groups.get(k).map(toRow)), name);
  });

  XLSX.writeFile(wb, `Data_Produksi_${compactToday()}.xlsx`);
  return { total: sorted.length, months: keys.length };
}
