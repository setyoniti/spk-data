import { Loader2 } from 'lucide-react';

export default function Loading({ text = 'Memuat data...' }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-12 text-slate-500">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
}
