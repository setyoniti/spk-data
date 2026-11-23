import { fail, methodGuard, send } from './_lib/http.js';
import { LIMITS, normalizeSpk } from './_lib/validate.js';
import { findBySpk } from './_lib/sheets.js';

export default async function handler(req, res) {
  if (!methodGuard(req, res, 'GET')) return;
  try {
    const raw = Array.isArray(req.query?.spk) ? req.query.spk[0] : req.query?.spk;
    const spk = normalizeSpk(raw ?? '');
    if (!spk) return send(res, 400, { success: false, message: 'Nomor SPK wajib diisi.' });
    if (!/^\d{4}$/.test(spk)) return send(res, 400, { success: false, message: 'Masukkan tepat 4 angka terakhir SPK.' });

    const records = await findBySpk(spk);
    return send(res, 200, { success: true, spk, total: records.length, records });
  } catch (err) {
    return fail(res, err, 'Pencarian gagal. Silakan coba lagi.');
  }
}
