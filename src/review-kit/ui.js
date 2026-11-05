// The few building blocks of the review page, written for it and styled by kit.css: they do not use the project's components, so
// the page looks the same in every project. Props follow what the page needs, not a full design system.
import { createContext, forwardRef, useContext, useEffect, useId, useRef, useState } from "react";
import { AlertTriangle, Check, CheckCircle2, Inbox, Info, Loader2, XCircle } from "lucide-react";

const cx = (...a) => a.filter(Boolean).join(" ");

export const Button = forwardRef(function Button({ kind = "filled", status, size = "md", loading = false, disabled = false, as: As = "button", prefixIcon, suffixIcon, className, children, ...props }, ref) {
  const off = disabled || loading;
  const own = As === "button" ? { type: "button", disabled: off } : { "aria-disabled": off || undefined };
  return (
    <As ref={ref} {...own} {...props} className={cx("rk-btn", `rk-btn-${kind}`, status && `rk-btn-${status}`, size === "sm" && "rk-btn-sm", className)}>
      {loading ? <Loader2 className="rk-spin" aria-hidden /> : prefixIcon}
      {children}
      {!loading && suffixIcon}
    </As>
  );
});

export function Badge({ tone = "neutral", dot = true, className, children }) {
  return <span className={cx("rk-badge", `rk-tone-${tone}`, className)}>{dot && <span className="rk-badge-dot" aria-hidden />}{children}</span>;
}

const ALERT_ICON = { danger: XCircle, warning: AlertTriangle, success: CheckCircle2, info: Info, default: Info };
export function Alert({ status = "info", title, children }) {
  const Icon = ALERT_ICON[status] ?? Info;
  return (
    <div role={status === "danger" ? "alert" : "status"} className={cx("rk-alert", `rk-tone-${status === "default" ? "neutral" : status}`)}>
      <Icon size={18} aria-hidden />
      <div>{title && <p className="rk-alert-title">{title}</p>}{children && <p>{children}</p>}</div>
    </div>
  );
}

export function Card({ title, description, action, children }) {
  return (
    <section className="rk-card">
      {(title || action) && (
        <header className="rk-card-head">
          <div>{title && <h2 className="rk-card-title">{title}</h2>}{description && <p className="rk-caption">{description}</p>}</div>
          {action}
        </header>
      )}
      <div className="rk-card-body">{children}</div>
    </section>
  );
}

export function PageHeader({ title, description, actions }) {
  return (
    <div className="rk-flex rk-flex-wrap rk-justify-between rk-gap-4">
      <div className="rk-flex rk-flex-col rk-gap-1 rk-max-w-xl">
        <h1 className="rk-typo-semi-bold-text-2xl">{title}</h1>
        {description && <p className="rk-text-caption">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

const FieldContext = createContext({ id: undefined, invalid: false });
export function Field({ label, hint, error, required, children }) {
  const id = useId();
  return (
    <FieldContext.Provider value={{ id, invalid: Boolean(error) }}>
      <div className="rk-field">
        {label && <label htmlFor={id} className="rk-label">{label}{required && <span className="rk-req"> *</span>}</label>}
        {children}
        {(error || hint) && <p className={cx("rk-caption", error && "rk-caption-danger")}>{error || hint}</p>}
      </div>
    </FieldContext.Provider>
  );
}

export const Input = forwardRef(function Input({ label, caption, status = "default", required, className, ...props }, ref) {
  const id = useId();
  const invalid = status === "danger";
  return (
    <div className="rk-field">
      {label && <label htmlFor={id} className="rk-label">{label}{required && <span className="rk-req"> *</span>}</label>}
      <input ref={ref} id={id} required={required} aria-invalid={invalid || undefined} className={cx("rk-control", className)} {...props} />
      {caption && <p className={cx("rk-caption", invalid && "rk-caption-danger")}>{caption}</p>}
    </div>
  );
});

export const Textarea = forwardRef(function Textarea({ rows = 4, className, ...props }, ref) {
  const field = useContext(FieldContext);
  return <textarea ref={ref} id={field.id} rows={rows} aria-invalid={field.invalid || undefined} className={cx("rk-control", className)} {...props} />;
});

export function Tabs({ tabs, value, onChange, className }) {
  return (
    <div role="tablist" className={cx("rk-tabs", className)}>
      {tabs.map((t) => <button key={t.value} role="tab" type="button" aria-selected={t.value === value} className="rk-tab" onClick={() => onChange(t.value)}>{t.label}</button>)}
    </div>
  );
}

export function Stepper({ steps, current }) {
  return (
    <ol className="rk-stepper">
      {steps.map((label, i) => {
        const done = i < current, active = i === current;
        return (
          <li key={label} className={cx("rk-step", i < steps.length - 1 && "rk-step-grow")}>
            <span className="rk-step">
              <span aria-current={active ? "step" : undefined} className={cx("rk-step-dot", done && "rk-step-done", active && "rk-step-active")}>{done ? <Check size={14} /> : i + 1}</span>
              <span className={cx("rk-step-label", active && "rk-step-label-active")}>{label}</span>
            </span>
            {i < steps.length - 1 && <span className={cx("rk-step-line", done && "rk-step-line-done")} />}
          </li>
        );
      })}
    </ol>
  );
}

export function StatCard({ label, value, hint, icon, tone = "neutral" }) {
  return (
    <div className="rk-stat">
      {icon && <div className={cx("rk-stat-icon", `rk-tone-${tone}`)}>{icon}</div>}
      <div>
        <p className="rk-caption">{label}</p>
        <p className="rk-stat-value">{value}</p>
        {hint && <p className="rk-caption">{hint}</p>}
      </div>
    </div>
  );
}

export function ChoiceCards({ options, value, onChange, disabled = false }) {
  return (
    <div role="radiogroup" className="rk-choices">
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={o.value === value} disabled={disabled} className="rk-choice" onClick={() => onChange(o.value)}>
          {o.icon && <span className="rk-flex rk-shrink-0" style={{ color: `var(--rk-${["danger", "warning", "info", "success"].includes(o.tone) ? o.tone : "caption"})`, opacity: 0.7 }}>{o.icon}</span>}
          <span className="rk-flex rk-flex-col rk-gap-1 rk-min-w-0 rk-flex-1">
            <span className="rk-typo-semi-bold-text-sm">{o.label}</span>
            {o.description && <span className="rk-text-caption rk-typo-regular-text-sm">{o.description}</span>}
          </span>
          <span aria-hidden className="rk-choice-radio"><Check size={14} strokeWidth={3} /></span>
        </button>
      ))}
    </div>
  );
}

const reduced = () => typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
// Content that opens and closes by height. Closed content is not focusable (inert) and is not rendered until it was opened once.
export function Collapse({ open, children }) {
  const [seen, setSeen] = useState(open);
  const [settled, setSettled] = useState(open); // after the height change, so focus rings and menus are not clipped
  if (open && !seen) setSeen(true);
  useEffect(() => { setSettled(reduced() ? open : false); }, [open]);
  return (
    <div className="rk-collapse" style={{ gridTemplateRows: open ? "1fr" : "0fr" }} onTransitionEnd={(e) => { if (e.target === e.currentTarget) setSettled(open); }}>
      <div style={{ overflow: open && settled ? "visible" : "hidden" }} aria-hidden={!open} {...(open ? {} : { inert: "" })}>{seen ? children : null}</div>
    </div>
  );
}

export function ProgressRing({ value, max, tone = "warning", size = 96, label, className }) {
  const ratio = Math.min(1, Math.max(0, value / (max > 0 ? max : 1)));
  const stroke = 8, r = (size - stroke) / 2, c = 2 * Math.PI * r, mid = size / 2;
  return (
    <div className={cx("rk-flex rk-items-center rk-gap-4", className)} role="img" aria-label={`${label ? `${label}: ` : ""}${value} of ${max}`}>
      <div className="rk-ring" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
          <circle cx={mid} cy={mid} r={r} fill="none" stroke="var(--rk-border)" strokeWidth={stroke} />
          <circle cx={mid} cy={mid} r={r} fill="none" stroke={`var(--rk-${tone})`} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - ratio)} style={{ transition: "stroke-dashoffset .3s" }} />
        </svg>
        <span className="rk-ring-value">{value}/{max}</span>
      </div>
      {label && <p className="rk-typo-semi-bold-text-lg">{label}</p>}
    </div>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="rk-flex rk-items-center rk-gap-3 rk-cursor-pointer">
      <button type="button" role="switch" aria-checked={checked} className="rk-switch" onClick={() => onChange?.(!checked)} />
      {label && <span className="rk-typo-medium-text-sm">{label}</span>}
    </label>
  );
}

export function Avatar({ name }) {
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
  return <span className="rk-avatar" title={name}>{initials}</span>;
}

export function EmptyState({ title, description }) {
  return (
    <div className="rk-empty">
      <div className="rk-empty-icon"><Inbox size={22} /></div>
      <h3 className="rk-typo-semi-bold-text-sm">{title}</h3>
      {description && <p className="rk-text-caption rk-max-w-sm">{description}</p>}
    </div>
  );
}

// A question the person must answer: Escape or a click outside is Cancel. Focus starts on Cancel, the safe choice.
export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = "Confirm", tone = "default", loading = false }) {
  const cancel = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    cancel.current?.focus();
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="rk-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="rk-dialog" role="alertdialog" aria-modal="true" aria-label={title}>
        <div className="rk-dialog-body">
          {tone === "danger" && <AlertTriangle size={20} aria-hidden style={{ color: "var(--rk-danger)", flexShrink: 0, marginTop: 2 }} />}
          <div className="rk-flex rk-flex-col rk-gap-2"><h3 className="rk-typo-semi-bold-text-base">{title}</h3><p className="rk-text-caption">{description}</p></div>
        </div>
        <div className="rk-dialog-foot">
          <Button ref={cancel} kind="text" onClick={onClose}>Cancel</Button>
          <Button status={tone === "danger" ? "danger" : "primary"} loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
