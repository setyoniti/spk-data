export class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const MAX_BODY_BYTES = 20 * 1024;

export function send(res, status, body) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.status(status).json(body);
}

export function methodGuard(req, res, method) {
  if (req.method === method) return true;
  res.setHeader('Allow', method);
  send(res, 405, { success: false, message: 'Metode tidak diizinkan.' });
  return false;
}

/** Kirim error ke pengguna tanpa membocorkan detail internal. */
export function fail(res, err, fallback) {
  if (err instanceof AppError) return send(res, err.status, { success: false, message: err.message });
  // Log hanya pesan singkat (tanpa credentials / stack trace ke pengguna).
  console.error('[api-error]', err?.code || '', String(err?.message || err).slice(0, 300));
  return send(res, 500, { success: false, message: fallback });
}
