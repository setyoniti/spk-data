import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

const ToastContext = createContext({ showToast: () => {} });
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const showToast = useCallback((type, message) => {
    clearTimeout(timer.current);
    setToast({ type, message, id: Date.now() });
    timer.current = setTimeout(() => setToast(null), type === 'error' ? 7000 : 4000);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);

  const ok = toast?.type === 'success';
  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div role="status" aria-live="polite" className="fixed inset-x-4 top-4 z-50 flex justify-center sm:inset-x-auto sm:right-4">
          <div className={`flex max-w-md items-start gap-3 rounded-lg px-4 py-3 text-white shadow-lg ${ok ? 'bg-green-600' : 'bg-red-600'}`}>
            {ok ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /> : <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />}
            <p className="text-sm font-medium">{toast.message}</p>
            <button onClick={() => setToast(null)} aria-label="Tutup" className="ml-2 rounded p-0.5 hover:bg-white/20">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}
