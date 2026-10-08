import { forwardRef, useId } from "react";
import PropTypes from "prop-types";
import { Search } from "lucide-react";
import { cn } from "utils/cn";

const CONTROL =
  "block w-full rounded-lg border bg-white text-sm text-slate-900 placeholder:text-slate-400 " +
  "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 " +
  "disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed";

const controlClass = (error, extra) =>
  cn(CONTROL, error ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-slate-300", extra);

/**
 * Field — label, control, hint and error message in one block. Wrap an Input,
 * Select or Textarea with it. Pass the `id` from the render function to the
 * control so the label points at it.
 */
export function Field({ label, required, hint, error, children, className }) {
  const id = useId();
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="ml-0.5 text-red-600">*</span>}
        </label>
      )}
      {children({ id, invalid: !!error })}
      {error ? (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-slate-500">{hint}</p>
      )}
    </div>
  );
}

Field.propTypes = {
  /** Label text above the control. */
  label: PropTypes.string,
  /** Shows a red asterisk after the label. */
  required: PropTypes.bool,
  /** Helper text under the control. Hidden while there is an error. */
  hint: PropTypes.string,
  /** Error message. Turns the text red, replaces the hint. */
  error: PropTypes.string,
  /** Render function `({ id, invalid }) => <Input id={id} error={invalid} />`. */
  children: PropTypes.func.isRequired,
  /** Extra classes, for layout only. */
  className: PropTypes.string,
};

/** Input — single-line text control, 40px high. Use inside Field. */
export const Input = forwardRef(function Input({ error, className, ...props }, ref) {
  return <input ref={ref} aria-invalid={error || undefined} className={controlClass(error, cn("h-10 px-3", className))} {...props} />;
});

Input.propTypes = {
  /** Red border when true. Field passes this for you. */
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

/** Textarea — multi-line text control. Use inside Field. */
export const Textarea = forwardRef(function Textarea({ error, rows = 4, className, ...props }, ref) {
  return <textarea ref={ref} rows={rows} aria-invalid={error || undefined} className={controlClass(error, cn("px-3 py-2", className))} {...props} />;
});

Textarea.propTypes = {
  /** Red border when true. */
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

/** SearchInput — Input with a search icon on the left, for filtering a list. */
export const SearchInput = forwardRef(function SearchInput({ className, ...props }, ref) {
  return (
    <div className={cn("relative", className)}>
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
      <input ref={ref} type="search" className={controlClass(false, "h-10 pl-9 pr-3")} {...props} />
    </div>
  );
});

SearchInput.propTypes = {
  /** Placeholder text, e.g. "Search equipment...". */
  placeholder: PropTypes.string,
  /** Extra classes on the wrapper, for layout only (width). */
  className: PropTypes.string,
};
