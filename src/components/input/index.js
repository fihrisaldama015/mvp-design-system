import { forwardRef, useCallback, useId, useRef, useState } from "react";
import PropTypes from "prop-types";
import { X } from "lucide-react";
import { useFieldControl } from "components/field";
import { BORDER, FOCUS_RING, ICON_PX, SIZE, sized } from "components/field/control";
import { FIELD_GAP, FieldCaption, FieldLabel } from "components/field/parts";
import { cn } from "utils/cn";

// Built from SHIELD "Input" (Figma): State x Size x Status, Disabled and Read-only.
// State hovered -> hover:, pressed (caret shown) -> focus-within:, filled -> the
// input has a value (clear button shows). Every class is a Graphene token;
// docs/shield/input.md has the Figma -> code table. The size / border / focus-ring
// maps are shared with Select (components/field/control).

// Clears the native value and fires React's onChange, for controlled and uncontrolled inputs.
function clearNative(input) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
  setter.call(input, "");
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

/**
 * Input — SHIELD single-line text field. Give it a `label` and a `caption` to get
 * the full field, or use it bare (filter bars, or inside a Field, which then
 * supplies the label, the caption and the error state). `status` colours the
 * border (and the caption for `danger`); `clearable` adds a clear button once
 * there is a value.
 */
export const Input = forwardRef(function Input(
  {
    size = "md",
    status: statusProp,
    error,
    label,
    required = false,
    info,
    caption,
    prefixIcon,
    suffixIcon,
    clearable = false,
    onClear,
    disabled = false,
    readOnly = false,
    id,
    value,
    defaultValue,
    onChange,
    className,
    ...props
  },
  ref,
) {
  const field = useFieldControl();
  const ownId = useId();
  const inputId = id ?? field.id ?? ownId;
  const captionId = caption ? `${inputId}-caption` : field.captionId;
  const status = statusProp ?? (error ?? field.invalid ? "danger" : "default");
  const s = SIZE[size];

  const inner = useRef(null);
  const setRef = useCallback(
    (node) => {
      inner.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  const [typed, setTyped] = useState(() => String(defaultValue ?? "") !== "");
  const hasValue = value !== undefined && value !== null ? String(value) !== "" : typed;
  const interactive = !disabled && !readOnly;

  const handleChange = (e) => {
    setTyped(e.target.value !== "");
    onChange?.(e);
  };
  const handleClear = () => {
    if (!inner.current) return;
    clearNative(inner.current);
    inner.current.focus();
    onClear?.();
  };

  const control = (
    <div className="group/control relative">
      {/* Focus ring: 1px gap in the border/base colour, then 3px in the status' invert/focused colour. */}
      <span aria-hidden className={cn("pointer-events-none absolute -inset-1 opacity-0 group-focus-within/control:opacity-100", s.radius, FOCUS_RING[status])} />
      <span aria-hidden className={cn("pointer-events-none absolute -inset-px border border-base opacity-0 group-focus-within/control:opacity-100", s.radius)} />
      <div
        className={cn(
          "relative flex items-center border",
          s.box,
          disabled ? "border-disabled bg-disabled" : readOnly ? "border-invert-default bg-disabled" : cn("bg-surface", BORDER[status]),
        )}
      >
        {prefixIcon && <span className="inline-flex shrink-0 text-caption">{sized(prefixIcon)}</span>}
        <input
          ref={setRef}
          id={inputId}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          disabled={disabled}
          readOnly={readOnly}
          required={required || undefined}
          aria-invalid={status === "danger" || undefined}
          aria-describedby={captionId}
          className={cn(
            "min-w-0 flex-1 bg-transparent text-default outline-none placeholder:text-placeholder",
            s.text,
            interactive && "group-hover/control:placeholder:text-body",
            disabled && "cursor-not-allowed",
          )}
          {...props}
        />
        {clearable && hasValue && interactive && (
          <button type="button" onClick={handleClear} aria-label="Clear" className="inline-flex shrink-0 rounded-full text-caption focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <X size={ICON_PX} aria-hidden />
          </button>
        )}
        {suffixIcon && <span className="inline-flex shrink-0 text-caption">{sized(suffixIcon)}</span>}
      </div>
    </div>
  );

  if (!label && !caption) return <div className={cn("w-full", className)}>{control}</div>;
  return (
    <div className={cn("flex w-full flex-col", FIELD_GAP[size], className)}>
      {label && (
        <FieldLabel htmlFor={inputId} size={size} required={required} info={info} disabled={disabled}>
          {label}
        </FieldLabel>
      )}
      {control}
      {caption && (
        <FieldCaption id={captionId} size={size} danger={status === "danger"}>
          {caption}
        </FieldCaption>
      )}
    </div>
  );
});

Input.propTypes = {
  /** Height and text size: sm 36px, md 40px (default), lg 44px. */
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  /** Border colour: `danger` for an error (also turns the caption red), `info` / `success` / `warning`. Default `default` (primary on hover and focus). */
  status: PropTypes.oneOf(["default", "info", "success", "warning", "danger"]),
  /** Shortcut for `status="danger"`. Inside a Field it follows the Field's `error`. */
  error: PropTypes.bool,
  /** Label above the field. Leave it out inside a Field (the Field has the label). */
  label: PropTypes.node,
  /** Red asterisk after the label; also sets the native `required`. */
  required: PropTypes.bool,
  /** Short help text, shown in a tooltip on an info icon after the label. */
  info: PropTypes.string,
  /** Helper text under the field; red when `status="danger"`. Leave it out inside a Field. */
  caption: PropTypes.node,
  /** Icon before the text, a lucide icon. Sized by the input (22px). */
  prefixIcon: PropTypes.node,
  /** Icon after the text, a lucide icon. */
  suffixIcon: PropTypes.node,
  /** Shows a clear (x) button while there is a value. Clearing fires `onChange` with an empty value. */
  clearable: PropTypes.bool,
  /** Called after the clear button empties the field. */
  onClear: PropTypes.func,
  /** Greys the field out and blocks input. */
  disabled: PropTypes.bool,
  /** Shows the value on a grey background; it can be selected and copied, not changed. */
  readOnly: PropTypes.bool,
  /** Native input type, e.g. text, email, number, date. */
  type: PropTypes.string,
  /** Placeholder text. */
  placeholder: PropTypes.string,
  /** Value, for a controlled input (pair it with `onChange`). */
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** Starting value, for an uncontrolled input. */
  defaultValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** Change handler, gets the native change event. */
  onChange: PropTypes.func,
  /** id of the native input. Inside a Field it comes from the Field. */
  id: PropTypes.string,
  /** Extra classes on the outer element, for layout only (width, margin). */
  className: PropTypes.string,
};
