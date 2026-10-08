import { createContext, useCallback, useContext, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { CheckCircle2, Info, XCircle, X } from "lucide-react";
import { cn } from "utils/cn";

const ToastContext = createContext(null);

const TONES = {
  success: { icon: CheckCircle2, color: "text-emerald-500" },
  danger: { icon: XCircle, color: "text-red-500" },
  info: { icon: Info, color: "text-sky-500" },
};

/**
 * ToastProvider — put it once at the root of the app. Then call
 * `useToast()` anywhere to show a short message after an action. Toasts appear
 * top right and close by themselves after 4 seconds.
 */
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const dismiss = useCallback((id) => setItems((list) => list.filter((t) => t.id !== id)), []);

  const show = useCallback(
    (message, tone = "success") => {
      const id = `${Date.now()}-${Math.random()}`;
      setItems((list) => [...list, { id, message, tone }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  const api = useMemo(
    () => ({ success: (m) => show(m, "success"), error: (m) => show(m, "danger"), info: (m) => show(m, "info") }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-80 flex-col gap-2" aria-live="polite">
        {items.map((t) => {
          const { icon: Icon, color } = TONES[t.tone];
          return (
            <div key={t.id} className="pointer-events-auto flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
              <Icon size={18} className={cn("mt-0.5 shrink-0", color)} aria-hidden />
              <p className="flex-1 text-sm text-slate-700">{t.message}</p>
              <button type="button" aria-label="Dismiss" onClick={() => dismiss(t.id)} className="text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

ToastProvider.propTypes = {
  /** The app. */
  children: PropTypes.node,
};

/** useToast — returns `{ success(message), error(message), info(message) }`. Must be used under ToastProvider. */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
