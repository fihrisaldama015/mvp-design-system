import PropTypes from "prop-types";
import { cn } from "utils/cn";

/**
 * Card — white surface with a thin border; the container for every block of a
 * page. Use `title` (and `action`) for a header row, `padded={false}` when the
 * content is a table that should touch the edges.
 */
export function Card({ title, description, action, padded = true, children, className }) {
  return (
    <section className={cn("rounded-xl border border-slate-200 bg-white shadow-sm", className)}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            {title && <h2 className="text-base font-semibold text-slate-900">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={padded ? "p-5" : undefined}>{children}</div>
    </section>
  );
}

Card.propTypes = {
  /** Header title. Without title and action there is no header. */
  title: PropTypes.string,
  /** Small grey text under the title. */
  description: PropTypes.string,
  /** Element on the right of the header, e.g. a Button. */
  action: PropTypes.node,
  /** Pads the content with 20px. Turn off for tables. */
  padded: PropTypes.bool,
  /** Card content. */
  children: PropTypes.node,
  /** Extra classes, for layout only. */
  className: PropTypes.string,
};

/** StatCard — one big number with a label, for dashboards and summaries. */
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
