import { createContext, useContext, useId } from "react";
import PropTypes from "prop-types";
import { cn } from "utils/cn";

const FieldContext = createContext({ id: undefined, invalid: false });

/** useFieldControl — lets a control (Input, Select, ...) read the id and error state of the Field around it. */
export function useFieldControl() {
  return useContext(FieldContext);
}

/**
 * Field — label, control, hint and error message in one block. Put one control
 * inside it (Input, Textarea, Select, ...): the label is connected to it and it
 * turns red when `error` is set, with nothing to pass by hand.
 */
export function Field({ label, required, hint, error, children, className }) {
  const id = useId();
  return (
    <FieldContext.Provider value={{ id, invalid: !!error }}>
      <div className={cn("space-y-1.5", className)}>
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-slate-700">
            {label}
            {required && <span className="ml-0.5 text-red-600">*</span>}
          </label>
        )}
        {children}
        {error ? (
          <p className="text-xs text-red-600" role="alert">
            {error}
          </p>
        ) : (
          hint && <p className="text-xs text-slate-500">{hint}</p>
        )}
      </div>
    </FieldContext.Provider>
  );
}

Field.propTypes = {
  /** Label text above the control. */
  label: PropTypes.string,
  /** Shows a red asterisk after the label. */
  required: PropTypes.bool,
  /** Helper text under the control. Hidden while there is an error. */
  hint: PropTypes.string,
  /** Error message. Turns the control red and replaces the hint. */
  error: PropTypes.string,
  /** The control: an Input, Textarea or Select. */
  children: PropTypes.node.isRequired,
  /** Extra classes, for layout only. */
  className: PropTypes.string,
};
