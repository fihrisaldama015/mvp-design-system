import PropTypes from "prop-types";
import { cn } from "utils/cn";

/**
 * Toggle — an on/off switch for a setting that takes effect right away
 * (Settings page). For choices inside a form that is submitted, use Checkbox.
 */
export function Toggle({ checked, onChange, label, disabled, className }) {
  return (
    <label className={cn("inline-flex items-center gap-3", disabled ? "opacity-50" : "cursor-pointer", className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
          checked ? "bg-indigo-600" : "bg-slate-300",
        )}
      >
        <span className={cn("absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", checked && "translate-x-5")} />
      </button>
      {label && <span className="text-sm font-medium text-slate-700">{label}</span>}
    </label>
  );
}

Toggle.propTypes = {
  /** On (true) or off (false). Controlled. */
  checked: PropTypes.bool.isRequired,
  /** Called with the new value when the user flips the switch. */
  onChange: PropTypes.func,
  /** Text next to the switch. */
  label: PropTypes.string,
  /** Disables the switch. */
  disabled: PropTypes.bool,
  /** Extra classes, for layout only. */
  className: PropTypes.string,
};
