import { formatDate } from '../utils/date.js';

const COLS = ['No', 'Tanggal', 'Shift', 'SPK', 'QC', 'Operator', 'QYT', 'Type', 'Event', 'Mesin', 'Color', 'Status'];

export default function DataTable({ records }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-navy-900 text-white">
          <tr>
            {COLS.map((c) => (
              <th key={c} className={`whitespace-nowrap px-4 py-3 font-semibold ${c === 'QYT' ? 'text-right' : ''}`}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {records.map((r, i) => (
            <tr key={r.id || i} className="hover:bg-blue-50/60">
              <td className="px-4 py-3 text-slate-500">{i + 1}</td>
              <td className="whitespace-nowrap px-4 py-3">{formatDate(r.date)}</td>
              <td className="whitespace-nowrap px-4 py-3">Shift {r.shift}</td>
              <td className="whitespace-nowrap px-4 py-3 font-mono font-semibold text-navy-800">{r.spk}</td>
              <td className="px-4 py-3">{r.qc}</td>
              <td className="px-4 py-3">{r.operator}</td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums">{Number(r.qyt).toLocaleString('id-ID')}</td>
              <td className="px-4 py-3">{r.type}</td>
              <td className="min-w-[14rem] max-w-md whitespace-pre-wrap break-words px-4 py-3">{r.event}</td>
              <td className="px-4 py-3">{r.machine}</td>
              <td className="px-4 py-3">{r.color}</td>
              <td className="px-4 py-3">{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
