import { forwardRef, useId } from "react";
import PropTypes from "prop-types";
import { cn } from "utils/cn";

/**
 * Checkbox — a tick box with its label. Use for independent yes/no choices and
 * for selecting rows. For a single on/off setting that applies at once use Toggle.
 */
export const Checkbox = forwardRef(function Checkbox({ label, description, className, ...props }, ref) {
  const id = useId();
  return (
    <div className={cn("flex items-start gap-2.5", className)}>
      <input
        ref={ref}
        id={id}
        type="checkbox"
        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 disabled:opacity-50"
        {...props}
      />
      {(label || description) && (
        <label htmlFor={id} className="text-sm">
          {label && <span className="font-medium text-slate-700">{label}</span>}
          {description && <span className="block text-slate-500">{description}</span>}
        </label>
      )}
    </div>
  );
});

Checkbox.propTypes = {
  /** Text next to the box. */
  label: PropTypes.string,
  /** Grey helper text under the label. */
  description: PropTypes.string,
  /** Ticked state (controlled). Pair with onChange. */
  checked: PropTypes.bool,
  /** Disables the box. */
  disabled: PropTypes.bool,
  /** Extra classes, for layout only. */
  className: PropTypes.string,
};
