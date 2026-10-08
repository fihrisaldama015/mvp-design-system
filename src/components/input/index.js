import { forwardRef } from "react";
import PropTypes from "prop-types";
import { useFieldControl } from "components/field";
import { controlClass } from "components/field/controlClass";
import { cn } from "utils/cn";

/**
 * Input — single-line text control, 40px high. In a form put it inside a Field
 * (label, hint and error come from there). On its own it is for filter bars.
 */
export const Input = forwardRef(function Input({ error, id, className, ...props }, ref) {
  const field = useFieldControl();
  const invalid = error ?? field.invalid;
  return <input ref={ref} id={id ?? field.id} aria-invalid={invalid || undefined} className={controlClass(invalid, cn("h-10 px-3", className))} {...props} />;
});

Input.propTypes = {
  /** Red border when true. Inside a Field it follows the Field's `error`. */
  error: PropTypes.bool,
  /** Native input type, e.g. text, email, number, date. */
  type: PropTypes.string,
  /** Placeholder text. */
  placeholder: PropTypes.string,
  /** Disables the control. */
  disabled: PropTypes.bool,
  /** Extra classes, for layout only. */
  className: PropTypes.string,
};
