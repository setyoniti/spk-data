import { isConfigured } from './_lib/sheets.js';
import { methodGuard, send } from './_lib/http.js';

export default function handler(req, res) {
  if (!methodGuard(req, res, 'GET')) return;
  // Tidak menampilkan credentials / data apa pun.
  send(res, 200, { success: true, status: 'ok', configured: isConfigured(), time: new Date().toISOString() });
}
