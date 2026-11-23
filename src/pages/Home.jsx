import { Link } from 'react-router-dom';
import { ClipboardList, FilePlus2, Search } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';

function MenuCard({ to, icon: Icon, title, desc, tone }) {
  return (
    <Link
      to={to}
      className={`group flex flex-1 flex-col items-center rounded-2xl border-2 bg-white p-8 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 ${tone.border}`}
    >
      <span className={`mb-5 flex h-20 w-20 items-center justify-center rounded-2xl text-white ${tone.bg}`}>
        <Icon className="h-10 w-10" />
      </span>
      <span className="text-2xl font-extrabold text-navy-900">{title}</span>
      <span className="mt-2 text-sm text-slate-500">{desc}</span>
    </Link>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar showBack={false} />
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-10 text-center">
          <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-900 text-white shadow">
            <ClipboardList className="h-9 w-9" />
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">Production Data Finder</h1>
          <p className="mt-2 text-slate-600">Sistem Input dan Pencarian Data Produksi Berdasarkan SPK</p>
        </div>
        <div className="flex flex-col gap-6 sm:flex-row">
          <MenuCard to="/input" icon={FilePlus2} title="INPUT DATA" desc="Catat data produksi dan temuan baru, serta export Excel" tone={{ border: 'border-blue-200 hover:border-blue-500', bg: 'bg-blue-600' }} />
          <MenuCard to="/search" icon={Search} title="SEARCH DATA" desc="Cari seluruh data berdasarkan nomor SPK" tone={{ border: 'border-slate-200 hover:border-navy-700', bg: 'bg-navy-800' }} />
        </div>
        <p className="mt-10 text-center text-xs text-slate-400">Production Record System</p>
      </main>
    </div>
  );
}
