const TIMEOUT_MS = 20000;

export class ApiError extends Error {
  constructor(message, errors) {
    super(message);
    this.errors = errors;
  }
}

async function request(url, options = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal, cache: 'no-store' });
    let data = null;
    try { data = await res.json(); } catch { /* respons bukan JSON */ }
    if (!res.ok || !data || data.success === false) {
      throw new ApiError(data?.message || 'Terjadi kesalahan pada server. Silakan coba lagi.', data?.errors);
    }
    return data;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err.name === 'AbortError') throw new ApiError('Koneksi terlalu lama (timeout). Silakan coba lagi.');
    if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new ApiError('Tidak ada koneksi internet. Periksa jaringan Anda.');
    throw new ApiError('Tidak dapat terhubung ke server. Silakan coba lagi.');
  } finally {
    clearTimeout(timer);
  }
}

const GAS_URL = (
  import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL ||
  'https://script.google.com/macros/s/AKfycbybbkHRIMz_K_jNIiMJAoR6lPdmPs5FzgNIrL-3pB7OQONkNV4uf1uauNh_Bd3TNdHJ/exec'
).trim();

function gasRequest(payload) {
  if (!GAS_URL) return null;
  const params = new URLSearchParams();
  params.set('action', payload.action);
  if (payload.action === 'save') {
    params.set('payload', JSON.stringify(payload.payload));
    Object.entries(payload.payload).forEach(([key, value]) => {
      params.set(key, String(value ?? ''));
    });
  }
  if (payload.action === 'search') params.set('spk', payload.spk);
  return request(`${GAS_URL}?${params.toString()}`, {
    method: 'GET',
  });
}

export const saveRecord = (payload) => {
  if (GAS_URL) return gasRequest({ action: 'save', payload });
  return request('/api/records', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
};

export const searchSpk = (spk) => {
  if (GAS_URL) return gasRequest({ action: 'search', spk });
  return request(`/api/search?spk=${encodeURIComponent(spk)}`);
};

export const fetchAllRecords = () => {
  if (GAS_URL) return gasRequest({ action: 'list' });
  return request('/api/export');
};
