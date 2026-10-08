import PropTypes from "prop-types";
import { cn } from "utils/cn";

const TONES = { primary: "bg-indigo-600", success: "bg-emerald-500", warning: "bg-amber-500", danger: "bg-red-500" };

/** ProgressBar — a thin bar that shows how much of a whole is used (0–100). */
export function ProgressBar({ value, tone = "primary", label, className }) {
  const v = Math.min(100, Math.max(0, value));
  return (
    <div className={className}>
      {label && (
        <div className="mb-1 flex justify-between text-xs text-slate-600">
          <span>{label}</span>
          <span>{Math.round(v)}%</span>
        </div>
      )}
      <div role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={cn("h-full rounded-full transition-all", TONES[tone])} style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

ProgressBar.propTypes = {
  /** Percentage from 0 to 100. */
  value: PropTypes.number.isRequired,
  /** Colour of the fill. */
  tone: PropTypes.oneOf(["primary", "success", "warning", "danger"]),
  /** Text above the bar; also shows the percentage. */
  label: PropTypes.string,
  /** Extra classes on the wrapper, for layout only (width). */
  className: PropTypes.string,
};
