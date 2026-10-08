import PropTypes from "prop-types";
import { cn } from "utils/cn";

/**
 * Tabs — switches between views of the same page (underline style). Controlled:
 * keep the active `value` in state. Use it for sections of one record, not for
 * navigating between pages.
 */
export function Tabs({ tabs, value, onChange, className }) {
  return (
    <div role="tablist" className={cn("flex gap-6 border-b border-slate-200", className)}>
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={cn(
              "-mb-px border-b-2 pb-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
              active ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700",
            )}
          >
            {t.label}
            {t.count != null && (
              <span className={cn("ml-2 rounded-full px-2 py-0.5 text-xs", active ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-600")}>{t.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

Tabs.propTypes = {
  /** Tab list: `{ value, label, count? }`. `count` shows a small number after the label. */
  tabs: PropTypes.arrayOf(
    PropTypes.shape({ value: PropTypes.string.isRequired, label: PropTypes.string.isRequired, count: PropTypes.number }),
  ).isRequired,
  /** `value` of the active tab. */
  value: PropTypes.string.isRequired,
  /** Called with the `value` of the tab that was clicked. */
  onChange: PropTypes.func.isRequired,
  /** Extra classes, for layout only. */
  className: PropTypes.string,
};
