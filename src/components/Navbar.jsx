import { Link } from 'react-router-dom';
import { ArrowLeft, ClipboardList } from 'lucide-react';

export default function Navbar({ showBack = true }) {
  return (
    <header className="bg-navy-900 text-white shadow">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600"><ClipboardList className="h-5 w-5" /></span>
          <span className="leading-tight">
            <span className="block text-sm font-bold tracking-wide">Production Data Finder</span>
            <span className="block text-xs text-blue-200">Production Record &amp; SPK Search System</span>
          </span>
        </Link>
        {showBack && (
          <Link to="/" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-blue-100 hover:bg-white/10">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
        )}
      </div>
    </header>
  );
}
