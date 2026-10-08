import PropTypes from "prop-types";
import { cn } from "utils/cn";

const TONES = {
  neutral: { pill: "bg-slate-100 text-slate-700", dot: "bg-slate-400" },
  info: { pill: "bg-sky-50 text-sky-700", dot: "bg-sky-500" },
  success: { pill: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  warning: { pill: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  danger: { pill: "bg-red-50 text-red-700", dot: "bg-red-500" },
};

/**
 * Badge — a small status pill with a coloured dot. Pick the tone by meaning:
 * success = good/available, warning = needs attention, danger = problem/overdue,
 * info = in progress, neutral = everything else.
 */
export function Badge({ tone = "neutral", dot = true, children, className }) {
  const t = TONES[tone];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", t.pill, className)}>
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", t.dot)} aria-hidden />}
      {children}
    </span>
  );
}

Badge.propTypes = {
  /** Meaning of the status; sets the colour. */
  tone: PropTypes.oneOf(["neutral", "info", "success", "warning", "danger"]),
  /** Shows the small dot before the label. */
  dot: PropTypes.bool,
  /** Label, short and in sentence case, e.g. "Available". */
  children: PropTypes.node.isRequired,
  /** Extra classes, for layout only. */
  className: PropTypes.string,
};
