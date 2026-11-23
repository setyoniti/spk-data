import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, PackageSearch, Plus, Search, SearchX, X } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import Button from '../components/Button.jsx';
import DataTable from '../components/DataTable.jsx';
import Loading from '../components/Loading.jsx';
import { useToast } from '../components/Toast.jsx';
import { searchSpk } from '../services/api.js';
import { downloadCsv } from '../utils/exportCsv.js';
import { LIMITS } from '../config.js';

export default function SearchPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const inputRef = useRef(null);
  const [spk, setSpk] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { spk, records }
  const [failed, setFailed] = useState('');

  const clear = () => {
    setSpk(''); setError(''); setResult(null); setFailed('');
    inputRef.current?.focus();
  };

  const doSearch = async () => {
    if (loading) return;
    const q = spk.trim();
    if (!q) { setError('4 angka terakhir SPK wajib diisi.'); return; }
    if (!/^\d{4}$/.test(q)) { setError('Masukkan tepat 4 angka terakhir SPK.'); return; }
    setError(''); setFailed(''); setLoading(true); setResult(null);
    try {
      const data = await searchSpk(q);
      setResult({ spk: data.spk, records: data.records });
    } catch (err) {
      setFailed(err.message);
      showToast('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const records = result?.records || [];
  const totalQyt = records.reduce((s, r) => s + (Number(r.qyt) || 0), 0);
  const shifts = new Set(records.map((r) => r.shift)).size;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-extrabold text-navy-900">SEARCH DATA SPK</h1>
        <p className="mb-5 text-sm text-slate-600">Masukkan 4 angka terakhir nomor SPK untuk melihat seluruh data terkait.</p>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <label htmlFor="spk" className="mb-1.5 block text-sm font-semibold text-slate-700">Nomor SPK <span className="font-normal text-slate-500">(masukkan 4 angka terakhir saja)</span></label>
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                id="spk" ref={inputRef} autoFocus autoComplete="off" value={spk} maxLength={LIMITS.spk}
                onChange={(e) => { setSpk(e.target.value); if (error) setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && doSearch()}
                placeholder="Contoh: 3456"
                className={`w-full rounded-lg border bg-white py-3 pl-10 pr-3 text-base shadow-sm focus:outline-none focus:ring-2 ${error ? 'border-red-400 focus:ring-red-200' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-200'}`}
              />
            </div>
            <Button variant="accent" icon={Search} loading={loading} onClick={doSearch}>SEARCH</Button>
            <Button variant="secondary" icon={X} onClick={clear} disabled={loading}>CLEAR</Button>
          </div>
          {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
        </div>

        <div className="mt-6">
          {loading && <Loading text="Mencari data SPK..." />}

          {!loading && failed && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
              <p className="font-semibold">Pencarian gagal</p>
              <p className="mt-1 text-sm">{failed}</p>
              <Button variant="danger" className="mt-4" onClick={doSearch}>Coba Lagi</Button>
            </div>
          )}

          {!loading && !failed && !result && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white py-14 text-center text-slate-500">
              <PackageSearch className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="text-sm">Hasil pencarian akan tampil di sini.</p>
            </div>
          )}

          {!loading && result && records.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white py-14 text-center">
              <SearchX className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="font-semibold text-slate-700">Data SPK tidak ditemukan.</p>
              <p className="mt-1 text-sm text-slate-500">Periksa kembali nomor SPK: <span className="font-mono">{result.spk}</span></p>
            </div>
          )}

          {!loading && result && records.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-500">SPK</p>
                  <p className="font-mono text-2xl font-extrabold text-navy-900">{result.spk}</p>
                  <p className="text-sm text-slate-600">Total data ditemukan: <b>{records.length}</b> record. <span className="text-slate-400">(terbaru di atas)</span></p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="success" icon={Download} onClick={() => downloadCsv(records, result.spk)}>EXPORT CSV</Button>
                  <Button variant="secondary" icon={Plus} onClick={clear}>SEARCH BARU</Button>
                  <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate('/')}>HOME</Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[['Total Record', records.length], ['Total QYT', totalQyt.toLocaleString('id-ID')], ['Jumlah Shift', shifts]].map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <p className="text-xs font-medium text-slate-500">{k}</p>
                    <p className="text-xl font-extrabold text-navy-800">{v}</p>
                  </div>
                ))}
              </div>

              <DataTable records={records} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
