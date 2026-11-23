import { MAX_BODY_BYTES, fail, methodGuard, send } from './_lib/http.js';
import { validateRecord } from './_lib/validate.js';
import { appendRecord } from './_lib/sheets.js';

export default async function handler(req, res) {
  if (!methodGuard(req, res, 'POST')) return;
  try {
    if (Number(req.headers['content-length'] || 0) > MAX_BODY_BYTES) {
      return send(res, 413, { success: false, message: 'Data terlalu besar.' });
    }
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = null; }
    }
    const { value, errors } = validateRecord(body);
    if (errors) return send(res, 400, { success: false, message: 'Data tidak valid. Periksa kembali isian Anda.', errors });

    const record = await appendRecord(value);
    return send(res, 201, { success: true, message: 'Data berhasil disimpan', record: { id: record.id, spk: record.spk } });
  } catch (err) {
    return fail(res, err, 'Data gagal disimpan. Silakan coba lagi.');
  }
}
