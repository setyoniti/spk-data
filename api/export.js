import { fail, methodGuard, send } from './_lib/http.js';
import { listAll } from './_lib/sheets.js';

// Dipakai fitur "Export Excel" di menu Input: mengembalikan seluruh data.
export default async function handler(req, res) {
  if (!methodGuard(req, res, 'GET')) return;
  try {
    const records = await listAll();
    return send(res, 200, { success: true, total: records.length, records });
  } catch (err) {
    return fail(res, err, 'Gagal mengambil data untuk export. Silakan coba lagi.');
  }
}
