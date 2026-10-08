import PropTypes from "prop-types";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "utils/cn";

const TONES = {
  info: { box: "border-sky-200 bg-sky-50 text-sky-900", icon: Info, color: "text-sky-600" },
  success: { box: "border-emerald-200 bg-emerald-50 text-emerald-900", icon: CheckCircle2, color: "text-emerald-600" },
  warning: { box: "border-amber-200 bg-amber-50 text-amber-900", icon: AlertTriangle, color: "text-amber-600" },
  danger: { box: "border-red-200 bg-red-50 text-red-900", icon: XCircle, color: "text-red-600" },
};

/**
 * Alert — an inline message inside the page (not a popup). Use it for a state
 * the user should see while working, e.g. "3 loans are overdue". For a short
 * confirmation after an action use Toast.
 */
export function Alert({ tone = "info", title, children, action, className }) {
  const t = TONES[tone];
  const Icon = t.icon;
  return (
    <div role="alert" className={cn("flex items-start gap-3 rounded-lg border p-4 text-sm", t.box, className)}>
      <Icon size={18} className={cn("mt-0.5 shrink-0", t.color)} aria-hidden />
      <div className="flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? "mt-0.5" : undefined}>{children}</div>}
      </div>
      {action}
    </div>
  );
}

Alert.propTypes = {
  /** Meaning; sets the colour and the icon. */
  tone: PropTypes.oneOf(["info", "success", "warning", "danger"]),
  /** Bold first line. */
  title: PropTypes.string,
  /** Message text. */
  children: PropTypes.node,
  /** Element on the right, e.g. a small Button. */
  action: PropTypes.node,
  /** Extra classes, for layout only. */
  className: PropTypes.string,
};
