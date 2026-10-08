import PropTypes from "prop-types";
import { cn } from "utils/cn";

/**
 * StatCard — one big number with a label (and an optional icon), for the top
 * of a dashboard or a summary row. Put several in a grid.
 */
export function StatCard({ label, value, hint, icon, tone = "neutral" }) {
  const tones = { neutral: "bg-slate-100 text-slate-600", success: "bg-emerald-50 text-emerald-600", warning: "bg-amber-50 text-amber-600", danger: "bg-red-50 text-red-600", info: "bg-sky-50 text-sky-600" };
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      {icon && <div className={cn("flex h-11 w-11 items-center justify-center rounded-lg", tones[tone])}>{icon}</div>}
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-semibold text-slate-900">{value}</p>
        {hint && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
    </div>
  );
}

StatCard.propTypes = {
  /** What the number is, e.g. "Items on loan". */
  label: PropTypes.string.isRequired,
  /** The number or short value. */
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  /** Small line under the value. */
  hint: PropTypes.string,
  /** A lucide icon at size 20. */
  icon: PropTypes.node,
  /** Colour of the icon tile. */
  tone: PropTypes.oneOf(["neutral", "info", "success", "warning", "danger"]),
};
