import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { Check, ChevronDown, X } from "lucide-react";
import { useFieldControl } from "components/field";
import { BORDER, FOCUS_RING, ICON_PX, SIZE, sized } from "components/field/control";
import { FIELD_GAP, FieldCaption, FieldLabel } from "components/field/parts";
import { cn } from "utils/cn";

// Built from SHIELD "Input - Single Select/Base" (Figma): Size x Status, Disabled, Read-only,
// prefix icon, clear button. The control is drawn like Input (components/field/control); Figma has
// no menu, so the menu uses the same tokens. docs/shield/select.md has the Figma -> code table.

let warnedSearchable = false;

/**
 * Select — SHIELD single-choice dropdown. Give it a `label` and a `caption` to get the full field,
 * or use it bare inside a Field (which then supplies the label, the caption and the error state).
 * The menu opens under the control (or above when there is no room), marks the chosen option with
 * a tick, and works with the keyboard: Arrow keys to move, Enter to choose, Escape to close. Pass
 * `options` as `{ value, label }`; the component is controlled (`value` and `onChange`).
 */
export function Select({
  options,
  value,
  onChange,
  placeholder = "Select...",
  size = "md",
  status: statusProp,
  error,
  label,
  required = false,
  caption,
  prefixIcon,
  suffixIcon,
  clearable = false,
  onClear,
  readOnly = false,
  searchable = false,
  disabled = false,
  id: idProp,
  className,
}) {
  const field = useFieldControl();
  const id = idProp ?? field.id;
  const status = statusProp ?? (error ?? field.invalid ? "danger" : "default");
  const captionId = caption ? `${id}-caption` : field.captionId;
  const s = SIZE[size];
  const autoId = useId();
  const listId = `${autoId}-list`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [rect, setRect] = useState(null);
  const [query, setQuery] = useState("");
  const triggerRef = useRef(null);
  const boxRef = useRef(null);
  const menuRef = useRef(null);
  const searchRef = useRef(null);
  const interactive = !disabled && !readOnly;

  if (searchable && process.env.NODE_ENV !== "production" && !warnedSearchable) {
    warnedSearchable = true;
    // eslint-disable-next-line no-console
    console.warn("Select: `searchable` is deprecated (the SHIELD design has no menu search). It still works; new code should not use it.");
  }

  const selected = options.find((o) => o.value === value);
  const shown = useMemo(() => (searchable && query ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase())) : options), [options, searchable, query]);
  const selectedIndex = shown.findIndex((o) => o.value === value);

  const openMenu = () => {
    if (!interactive) return;
    setQuery("");
    setActive(selectedIndex >= 0 ? selectedIndex : shown.findIndex((o) => !o.disabled));
    setOpen(true);
  };

  const choose = (opt) => {
    if (opt.disabled) return;
    onChange?.(opt.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const clear = (e) => {
    e.stopPropagation();
    onChange?.("");
    onClear?.();
    triggerRef.current?.focus();
  };

  // Measure the control so the menu (rendered in a portal) can sit under it.
  useLayoutEffect(() => {
    if (!open) return undefined;
    const measure = () => setRect(boxRef.current.getBoundingClientRect());
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (!boxRef.current?.contains(e.target) && !menuRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Focus the search box when the menu opens.
  useEffect(() => {
    if (open && rect && searchable) searchRef.current?.focus();
  }, [open, rect, searchable]);

  const move = (dir) => {
    let i = active;
    for (let n = 0; n < shown.length; n += 1) {
      i = (i + dir + shown.length) % shown.length;
      if (!shown[i].disabled) {
        setActive(i);
        return;
      }
    }
  };

  const onKeyDown = (e) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    if (e.key === "ArrowDown") e.preventDefault(), move(1);
    else if (e.key === "ArrowUp") e.preventDefault(), move(-1);
    else if (e.key === "Enter" || (e.key === " " && e.target === triggerRef.current)) e.preventDefault(), shown[active] && choose(shown[active]);
    else if (e.key === "Escape") e.preventDefault(), setOpen(false);
    else if (e.key === "Tab") setOpen(false);
  };

  const MENU_MAX = 240;
  const below = rect ? window.innerHeight - rect.bottom : 0;
  const flip = rect && below < Math.min(MENU_MAX, shown.length * 36 + (searchable ? 52 : 8)) && rect.top > below;
  const hasValue = Boolean(selected);

  const control = (
    <div className="group/control relative">
      {/* Focus ring: 1px gap in the border/base colour, then 3px in the status' invert/focused colour. */}
      <span aria-hidden className={cn("pointer-events-none absolute -inset-1 opacity-0 group-focus-within/control:opacity-100", open && "opacity-100", s.radius, FOCUS_RING[status])} />
      <span aria-hidden className={cn("pointer-events-none absolute -inset-px border border-base opacity-0 group-focus-within/control:opacity-100", open && "opacity-100", s.radius)} />
      {/* The whole box opens the menu; the button inside is the focus target for the keyboard and screen readers. */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        ref={boxRef}
        onClick={() => (open ? setOpen(false) : openMenu())}
        className={cn(
          "relative flex items-center border",
          s.box,
          disabled ? "cursor-not-allowed border-disabled bg-disabled" : readOnly ? "border-invert-default bg-disabled" : cn("cursor-pointer bg-surface", BORDER[status], open && status === "default" && "border-primary"),
        )}
      >
        {prefixIcon && <span className="inline-flex shrink-0 text-caption">{sized(prefixIcon)}</span>}
        <button
          ref={triggerRef}
          id={id}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={open ? `${autoId}-opt-${active}` : undefined}
          aria-invalid={status === "danger" || undefined}
          aria-describedby={captionId}
          aria-readonly={readOnly || undefined}
          disabled={disabled}
          onKeyDown={onKeyDown}
          className={cn("min-w-0 flex-1 truncate bg-transparent text-left outline-none disabled:cursor-not-allowed", s.text, hasValue ? "text-default" : "text-placeholder", interactive && !hasValue && "group-hover/control:text-body")}
        >
          {hasValue ? selected.label : placeholder}
        </button>
        {clearable && hasValue && interactive && (
          <button type="button" onClick={clear} aria-label="Clear" className="inline-flex shrink-0 rounded-full text-caption focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <X size={ICON_PX} aria-hidden />
          </button>
        )}
        {suffixIcon !== false && (
          <span className={cn("inline-flex shrink-0 text-caption transition-transform", open && !suffixIcon && "rotate-180")}>{suffixIcon ? sized(suffixIcon) : <ChevronDown size={ICON_PX} aria-hidden />}</span>
        )}
      </div>
      {open &&
        rect &&
        createPortal(
          <ul
            ref={menuRef}
            id={listId}
            role="listbox"
            style={{
              position: "fixed",
              left: rect.left,
              width: rect.width,
              maxHeight: MENU_MAX,
              ...(flip ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }),
            }}
            className="z-[70] overflow-auto rounded-form-md border border-default bg-surface py-1 shadow-lg"
          >
            {searchable && (
              <li role="presentation" className="px-2 pb-1">
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  placeholder="Search..."
                  aria-label="Search options"
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActive(0);
                  }}
                  onKeyDown={onKeyDown}
                  className="h-8 w-full rounded-form-sm border border-invert-default bg-surface px-2 text-default typo-regular-text-sm placeholder:text-placeholder focus:border-primary focus:outline-none"
                />
              </li>
            )}
            {shown.length === 0 && (
              <li role="presentation" className="px-3 py-2 text-caption typo-regular-text-sm">
                No results
              </li>
            )}
            {shown.map((opt, i) => (
              <li
                key={opt.value}
                id={`${autoId}-opt-${i}`}
                role="option"
                aria-selected={opt.value === value}
                aria-disabled={opt.disabled || undefined}
                onMouseEnter={() => !opt.disabled && setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(opt)}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-2 px-3 py-2",
                  i === active && "bg-default-hovered",
                  opt.value === value ? "text-primary typo-medium-text-sm" : "text-default typo-regular-text-sm",
                  opt.disabled && "cursor-not-allowed text-disabled",
                )}
              >
                <span className="truncate">{opt.label}</span>
                {opt.value === value && <Check size={16} aria-hidden />}
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </div>
  );

  if (!label && !caption) return <div className={cn("w-full", className)}>{control}</div>;
  return (
    <div className={cn("flex w-full flex-col", FIELD_GAP[size], className)}>
      {label && (
        <FieldLabel htmlFor={id} size={size} required={required} disabled={disabled}>
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
}

Select.propTypes = {
  /** The choices: `{ value, label, disabled? }`. `value` must be unique. */
  options: PropTypes.arrayOf(
    PropTypes.shape({ value: PropTypes.string.isRequired, label: PropTypes.string.isRequired, disabled: PropTypes.bool }),
  ).isRequired,
  /** The chosen `value`, or an empty string for none. Controlled. */
  value: PropTypes.string,
  /** Called with the new `value` when the user chooses an option (an empty string when cleared). */
  onChange: PropTypes.func,
  /** Grey text shown while nothing is chosen. */
  placeholder: PropTypes.string,
  /** Height and text size: sm 36px, md 40px (default), lg 44px. */
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  /** Border colour: `danger` for an error (also turns the caption red). Default `default` (primary on hover and focus). Figma has only these two for Select. */
  status: PropTypes.oneOf(["default", "danger"]),
  /** Shortcut for `status="danger"`. Inside a Field it follows the Field's `error`. */
  error: PropTypes.bool,
  /** Label above the field. Leave it out inside a Field (the Field has the label). */
  label: PropTypes.node,
  /** Red asterisk after the label. */
  required: PropTypes.bool,
  /** Helper text under the field; red when `status="danger"`. Leave it out inside a Field. */
  caption: PropTypes.node,
  /** Icon before the text, a lucide icon. Sized by the select (22px). */
  prefixIcon: PropTypes.node,
  /** Icon at the end, a lucide icon. Default: a chevron that turns up while the menu is open. `false` hides it. */
  suffixIcon: PropTypes.oneOfType([PropTypes.node, PropTypes.oneOf([false])]),
  /** Shows a clear (x) button while an option is chosen. Clearing calls `onChange("")`. */
  clearable: PropTypes.bool,
  /** Called after the clear button empties the select. */
  onClear: PropTypes.func,
  /** Shows the value on a grey background; the menu does not open. */
  readOnly: PropTypes.bool,
  /**
   * @deprecated Not in the SHIELD design (Figma has no menu search). Still works so existing callers do not
   * break, but it is off by default and new code should not use it. Shows a search box at the top of the menu
   * that filters the options by label. Removed once no caller passes it.
   */
  searchable: PropTypes.bool,
  /** Greys the control out and blocks it. */
  disabled: PropTypes.bool,
  /** Id of the button. Inside a Field it is set for you. */
  id: PropTypes.string,
  /** Extra classes on the outer element, for layout only (width, margin). */
  className: PropTypes.string,
};
