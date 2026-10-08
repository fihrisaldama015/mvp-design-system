import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { Check, ChevronDown } from "lucide-react";
import { useFieldControl } from "components/field";
import { cn } from "utils/cn";

/**
 * Select — a dropdown to pick one value from a list. Use it inside Field. The
 * menu opens under the button (or above when there is no room), marks the
 * chosen option with a tick, and works with the keyboard: Arrow keys to move,
 * Enter to choose, Escape to close. Pass `options` as `{ value, label }`; the
 * component is controlled (`value` and `onChange`).
 */
export function Select({ options, value, onChange, placeholder = "Select...", error: errorProp, disabled, id: idProp, className }) {
  const field = useFieldControl();
  const id = idProp ?? field.id;
  const error = errorProp ?? field.invalid;
  const autoId = useId();
  const listId = `${autoId}-list`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [rect, setRect] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const selectedIndex = useMemo(() => options.findIndex((o) => o.value === value), [options, value]);
  const selected = options[selectedIndex];

  const openMenu = () => {
    if (disabled) return;
    setActive(selectedIndex >= 0 ? selectedIndex : options.findIndex((o) => !o.disabled));
    setOpen(true);
  };

  const choose = (opt) => {
    if (opt.disabled) return;
    onChange?.(opt.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  // Measure the button so the menu (rendered in a portal) can sit under it.
  useLayoutEffect(() => {
    if (!open) return undefined;
    const measure = () => setRect(triggerRef.current.getBoundingClientRect());
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
      if (!triggerRef.current?.contains(e.target) && !menuRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const move = (dir) => {
    let i = active;
    for (let n = 0; n < options.length; n += 1) {
      i = (i + dir + options.length) % options.length;
      if (!options[i].disabled) {
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
    else if (e.key === "Enter" || e.key === " ") e.preventDefault(), options[active] && choose(options[active]);
    else if (e.key === "Escape") e.preventDefault(), setOpen(false);
    else if (e.key === "Tab") setOpen(false);
  };

  const MENU_MAX = 240;
  const below = rect ? window.innerHeight - rect.bottom : 0;
  const flip = rect && below < Math.min(MENU_MAX, options.length * 36 + 8) && rect.top > below;

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${autoId}-opt-${active}` : undefined}
        aria-invalid={error || undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 text-left text-sm",
          "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",
          "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
          error ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-slate-300",
          open && "border-indigo-500 ring-2 ring-indigo-500",
          className,
        )}
      >
        <span className={cn("truncate", selected ? "text-slate-900" : "text-slate-400")}>{selected ? selected.label : placeholder}</span>
        <ChevronDown size={16} className={cn("shrink-0 text-slate-400 transition-transform", open && "rotate-180")} aria-hidden />
      </button>
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
            className="z-[70] overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
          >
            {options.map((opt, i) => (
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
                  "flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm",
                  i === active && "bg-slate-50",
                  opt.value === value ? "font-medium text-indigo-600" : "text-slate-700",
                  opt.disabled && "cursor-not-allowed opacity-50",
                )}
              >
                <span className="truncate">{opt.label}</span>
                {opt.value === value && <Check size={16} aria-hidden />}
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </>
  );
}

Select.propTypes = {
  /** The choices: `{ value, label, disabled? }`. `value` must be unique. */
  options: PropTypes.arrayOf(
    PropTypes.shape({ value: PropTypes.string.isRequired, label: PropTypes.string.isRequired, disabled: PropTypes.bool }),
  ).isRequired,
  /** The chosen `value`, or an empty string for none. Controlled. */
  value: PropTypes.string,
  /** Called with the new `value` when the user chooses an option. */
  onChange: PropTypes.func,
  /** Grey text shown while nothing is chosen. */
  placeholder: PropTypes.string,
  /** Red border when true. Inside a Field it follows the Field's `error`. */
  error: PropTypes.bool,
  /** Disables the control. */
  disabled: PropTypes.bool,
  /** Id of the button. Inside a Field it is set for you. */
  id: PropTypes.string,
  /** Extra classes on the button, for layout only. */
  className: PropTypes.string,
};
