import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileSpreadsheet, RotateCcw, Save } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import Button from '../components/Button.jsx';
import InputField from '../components/InputField.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { useToast } from '../components/Toast.jsx';
import { LIMITS, SHIFTS } from '../config.js';
import { emptyForm, isDirty, validateForm } from '../utils/validation.js';
import { todayWIB } from '../utils/date.js';
import { exportExcel } from '../utils/exportExcel.js';
import { fetchAllRecords, saveRecord } from '../services/api.js';

export default function InputPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [form, setForm] = useState(() => emptyForm(todayWIB()));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const lock = useRef(false); // cegah double-submit

  const set = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const resetNow = () => {
    setForm(emptyForm(todayWIB()));
    setErrors({});
    setConfirmReset(false);
  };

  const onReset = () => (isDirty(form, todayWIB()) ? setConfirmReset(true) : resetNow());

  const onSubmit = async (e) => {
    e.preventDefault();
    if (lock.current) return;
    const errs = validateForm(form);
    setErrors(errs);
    if (Object.keys(errs).length) {
      showToast('error', 'Lengkapi data yang wajib diisi.');
      document.getElementById(Object.keys(errs)[0])?.focus();
      return;
    }
    lock.current = true;
    setSaving(true);
    try {
      await saveRecord({ ...form, spk: form.spk.trim(), qyt: Number(form.qyt) });
      showToast('success', 'Data berhasil disimpan');
      setForm(emptyForm(todayWIB()));
      setErrors({});
    } catch (err) {
      if (err.errors) setErrors((p) => ({ ...p, ...err.errors }));
      showToast('error', err.message);
    } finally {
      lock.current = false;
      setSaving(false);
    }
  };

  const onExport = async () => {
    setExporting(true);
    try {
      const { records } = await fetchAllRecords();
      const r = await exportExcel(records);
      showToast('success', `Export berhasil: ${r.total} data, ${r.months} bulan.`);
    } catch (err) {
      showToast('error', err.message || 'Export gagal.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-navy-900">INPUT DATA PRODUKSI</h1>
            <p className="text-sm text-slate-600">Isi seluruh data, lalu klik Simpan. Setiap input menjadi satu record baru.</p>
          </div>
          <Button variant="success" icon={FileSpreadsheet} loading={exporting} onClick={onExport}>
            {exporting ? 'Menyiapkan Excel...' : 'EXPORT EXCEL (SEMUA DATA)'}
          </Button>
        </div>

        <form onSubmit={onSubmit} noValidate className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <InputField label="Tanggal" name="date" type="date" value={form.date} onChange={set} error={errors.date} />
            <InputField label="Shift" name="shift" as="select" value={form.shift} onChange={set} error={errors.shift}>
              {SHIFTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </InputField>

            <InputField label="SPK" name="spk" value={form.spk} onChange={set} error={errors.spk} maxLength={LIMITS.spk} placeholder="Masukkan 4 angka terakhir" inputMode="numeric" autoComplete="off" className="md:col-span-2" />

            <InputField label="QC" name="qc" value={form.qc} onChange={set} error={errors.qc} maxLength={LIMITS.qc} placeholder="Nama QC" autoComplete="off" />
            <InputField label="Operator" name="operator" value={form.operator} onChange={set} error={errors.operator} maxLength={LIMITS.operator} placeholder="Nama operator" autoComplete="off" />

            <InputField label="QYT" name="qyt" value={form.qyt} onChange={set} error={errors.qyt} inputMode="numeric" placeholder="Jumlah (angka bulat)" autoComplete="off" />
            <InputField label="Type" name="type" value={form.type} onChange={set} error={errors.type} maxLength={LIMITS.type} placeholder="Tipe produk" autoComplete="off" />

            <InputField label="Mesin" name="machine" value={form.machine} onChange={set} error={errors.machine} maxLength={LIMITS.machine} placeholder="Nama / kode mesin" autoComplete="off" />
            <InputField label="Color" name="color" value={form.color} onChange={set} error={errors.color} maxLength={LIMITS.color} placeholder="Warna produk" autoComplete="off" />
            <InputField label="Status" name="status" value={form.status} onChange={set} error={errors.status} maxLength={LIMITS.status} placeholder="Teks status" autoComplete="off" />

            <InputField label="Event" name="event" as="textarea" rows={4} value={form.event} onChange={set} error={errors.event} maxLength={LIMITS.event} placeholder="Defect / temuan / kejadian produksi" className="md:col-span-2" />
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-between">
            <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate('/')}>KEMBALI</Button>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button variant="secondary" icon={RotateCcw} onClick={onReset} disabled={saving}>RESET FORM</Button>
              <Button type="submit" variant="accent" icon={Save} loading={saving}>{saving ? 'MENYIMPAN...' : 'SIMPAN DATA'}</Button>
            </div>
          </div>
        </form>
      </main>

      <ConfirmDialog
        open={confirmReset}
        title="Reset form?"
        message="Data yang sudah Anda isi akan dihapus dan tidak dapat dikembalikan."
        confirmText="Ya, Reset"
        onConfirm={resetNow}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}
