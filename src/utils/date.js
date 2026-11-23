const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

/** Tanggal hari ini (WIB) format YYYY-MM-DD. */
export function todayWIB() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

/** YYYY-MM-DD -> DD/MM/YYYY */
export function formatDate(iso) {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : String(iso || '');
}

/** ISO timestamp (+07:00) -> DD/MM/YYYY HH:mm */
export function formatTimestamp(ts) {
  const m = String(ts || '').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]}` : String(ts || '');
}

/** YYYY-MM-DD -> "YYYY-MM" (kunci bulan, untuk pengurutan) */
export const monthKey = (iso) => (String(iso || '').match(/^(\d{4})-(\d{2})/) || []).slice(1, 3).join('-') || 'Tanpa Tanggal';

export function monthLabel(key) {
  const m = key.match(/^(\d{4})-(\d{2})$/);
  return m ? `${MONTHS[Number(m[2]) - 1]} ${m[1]}` : key;
}

export function monthShortLabel(key) {
  const m = key.match(/^(\d{4})-(\d{2})$/);
  return m ? `${MONTHS_SHORT[Number(m[2]) - 1]} ${m[1]}` : key;
}

export const compactToday = () => todayWIB().replace(/-/g, '');
