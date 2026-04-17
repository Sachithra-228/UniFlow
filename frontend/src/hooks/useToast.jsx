import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const toastStyles = {
  success: {
    icon: CheckCircle2,
    className: "border-emerald-300/60 bg-emerald-100/90 text-emerald-900 dark:border-emerald-600/40 dark:bg-emerald-900/40 dark:text-emerald-100",
  },
  error: {
    icon: AlertCircle,
    className: "border-rose-300/60 bg-rose-100/95 text-rose-900 dark:border-rose-600/40 dark:bg-rose-900/45 dark:text-rose-100",
  },
  info: {
    icon: Info,
    className: "border-cyan-300/60 bg-cyan-100/95 text-cyan-900 dark:border-cyan-600/40 dark:bg-cyan-900/45 dark:text-cyan-100",
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(({ title, message, type = "info", duration = 4000 }) => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, title, message, type }]);
    window.setTimeout(() => removeToast(id), duration);
  }, [removeToast]);

  const value = useMemo(() => ({ toasts, addToast, removeToast }), [toasts, addToast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[110] flex w-[min(92vw,360px)] flex-col gap-3">
        {toasts.map((toast) => {
          const style = toastStyles[toast.type] ?? toastStyles.info;
          const Icon = style.icon;
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-xl backdrop-blur-sm transition-all ${style.className}`}
            >
              <div className="flex items-start gap-3">
                <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{toast.title}</p>
                  {toast.message ? <p className="mt-1 text-xs opacity-90">{toast.message}</p> : null}
                </div>
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="rounded-md p-1 opacity-80 transition hover:bg-black/10 hover:opacity-100 dark:hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
