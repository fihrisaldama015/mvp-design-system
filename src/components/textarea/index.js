import { forwardRef } from "react";
import PropTypes from "prop-types";
import { useFieldControl } from "components/field";
import { controlClass } from "components/field/controlClass";
import { cn } from "utils/cn";

/** Textarea — multi-line text control for notes and descriptions. Put it inside a Field. */
export const Textarea = forwardRef(function Textarea({ error, id, rows = 4, className, ...props }, ref) {
  const field = useFieldControl();
  const invalid = error ?? field.invalid;
  return <textarea ref={ref} id={id ?? field.id} rows={rows} aria-invalid={invalid || undefined} className={controlClass(invalid, cn("px-3 py-2", className))} {...props} />;
});

Textarea.propTypes = {
  /** Red border when true. Inside a Field it follows the Field's `error`. */
  error: PropTypes.bool,
  /** Visible lines. */
  rows: PropTypes.number,
  /** Placeholder text. */
  placeholder: PropTypes.string,
  /** Disables the control. */
  disabled: PropTypes.bool,
  /** Extra classes, for layout only. */
  className: PropTypes.string,
};
