const base = 'w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:bg-slate-100';
const ok = 'border-slate-300 focus:border-blue-500 focus:ring-blue-200';
const bad = 'border-red-400 focus:border-red-500 focus:ring-red-200';

export default function InputField({ label, name, error, as = 'input', required = true, className = '', children, ...rest }) {
  const Tag = as;
  return (
    <div className={className}>
      <label htmlFor={name} className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <Tag id={name} name={name} aria-invalid={!!error} className={`${base} ${error ? bad : ok}`} {...rest}>
        {children}
      </Tag>
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
