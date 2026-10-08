import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useFieldControl } from "components/field";
import { IconButton } from "components/icon-button";
import { Button } from "components/button";
import { cn } from "utils/cn";

const ISO = "YYYY-MM-DD";
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MENU_WIDTH = 288;
const MENU_HEIGHT = 372;

/**
 * DatePicker — pick one date from a calendar. The value is a string like
 * `2026-10-05` (empty string for no date), shown as `5 Oct 2026`. Use it inside
 * Field. Keyboard: Arrow keys move by day or week, Page Up / Page Down by month,
 * Enter picks the date, Escape closes. Use `min` and `max` to block dates (for
 * example a due date cannot be before the loan date).
 */
export function DatePicker({ value = "", onChange, min, max, placeholder = "Select date", clearable = true, error: errorProp, disabled, id: idProp, className }) {
  const field = useFieldControl();
  const id = idProp ?? field.id;
  const error = errorProp ?? field.invalid;

  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => dayjs().startOf("month"));
  const [focused, setFocused] = useState(() => dayjs());
  const [rect, setRect] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const selected = value ? dayjs(value) : null;
  const minDay = min ? dayjs(min) : null;
  const maxDay = max ? dayjs(max) : null;
  const blocked = (d) => (minDay && d.isBefore(minDay, "day")) || (maxDay && d.isAfter(maxDay, "day"));

  const openMenu = () => {
    if (disabled) return;
    let start = selected ?? dayjs();
    if (minDay && start.isBefore(minDay, "day")) start = minDay;
    if (maxDay && start.isAfter(maxDay, "day")) start = maxDay;
    setFocused(start);
    setView(start.startOf("month"));
    setOpen(true);
  };

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  };

  const pick = (d) => {
    if (blocked(d)) return;
    onChange?.(d.format(ISO));
    close();
  };

  const moveFocus = (d) => {
    setFocused(d);
    setView(d.startOf("month"));
  };

  // 6 weeks, Monday first, so the grid never changes height between months.
  const days = useMemo(() => {
    const first = view.startOf("month");
    const offset = (first.day() + 6) % 7;
    return Array.from({ length: 42 }, (_, i) => first.add(i - offset, "day"));
  }, [view]);

  // Place the calendar under the button, or above it when there is no room.
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

  // Keep the keyboard focus on the focused day.
  useEffect(() => {
    if (!open || !rect) return;
    menuRef.current?.querySelector(`[data-date="${focused.format(ISO)}"]`)?.focus();
  }, [open, rect, focused, view]);

  const onKeyDown = (e) => {
    const steps = { ArrowLeft: [-1, "day"], ArrowRight: [1, "day"], ArrowUp: [-7, "day"], ArrowDown: [7, "day"], PageUp: [-1, "month"], PageDown: [1, "month"] };
    if (steps[e.key]) {
      e.preventDefault();
      moveFocus(focused.add(...steps[e.key]));
    } else if (e.key === "Home") {
      e.preventDefault();
      moveFocus(focused.subtract((focused.day() + 6) % 7, "day"));
    } else if (e.key === "End") {
      e.preventDefault();
      moveFocus(focused.add(6 - ((focused.day() + 6) % 7), "day"));
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Tab") {
      close(false);
    }
  };

  const flip = rect && window.innerHeight - rect.bottom < MENU_HEIGHT && rect.top > window.innerHeight - rect.bottom;
  const left = rect ? Math.max(8, Math.min(rect.left, window.innerWidth - MENU_WIDTH - 8)) : 0;
  const today = dayjs();

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={error || undefined}
        disabled={disabled}
        onClick={() => (open ? close(false) : openMenu())}
        onKeyDown={(e) => {
          if (!open && ["ArrowDown", "Enter", " "].includes(e.key)) {
            e.preventDefault();
            openMenu();
          }
        }}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 text-left text-sm",
          "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",
          "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
          error ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-slate-300",
          open && "border-indigo-500 ring-2 ring-indigo-500",
          className,
        )}
      >
        <span className={cn("truncate", selected ? "text-slate-900" : "text-slate-400")}>{selected ? selected.format("D MMM YYYY") : placeholder}</span>
        <Calendar size={16} className="shrink-0 text-slate-400" aria-hidden />
      </button>
      {open &&
        rect &&
        createPortal(
          <div
            ref={menuRef}
            role="dialog"
            aria-label="Choose a date"
            style={{ position: "fixed", left, width: MENU_WIDTH, ...(flip ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }) }}
            onKeyDown={onKeyDown}
            className="z-[70] rounded-xl border border-slate-200 bg-white p-3 shadow-lg"
          >
            <div className="mb-2 flex items-center justify-between">
              <IconButton icon={<ChevronLeft size={16} />} label="Previous month" onClick={() => setView(view.subtract(1, "month"))} />
              <span className="text-sm font-semibold text-slate-900" aria-live="polite">
                {view.format("MMMM YYYY")}
              </span>
              <IconButton icon={<ChevronRight size={16} />} label="Next month" onClick={() => setView(view.add(1, "month"))} />
            </div>
            <div className="grid grid-cols-7 text-center text-xs font-medium text-slate-400">
              {WEEKDAYS.map((w) => (
                <span key={w} className="py-1">
                  {w}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7" role="grid">
              {days.map((d) => {
                const isSelected = selected?.isSame(d, "day");
                const isFocused = focused.isSame(d, "day");
                const isOtherMonth = !d.isSame(view, "month");
                return (
                  <button
                    key={d.format(ISO)}
                    type="button"
                    data-date={d.format(ISO)}
                    tabIndex={isFocused ? 0 : -1}
                    aria-disabled={blocked(d) || undefined}
                    aria-label={d.format("dddd D MMMM YYYY")}
                    aria-selected={isSelected}
                    aria-current={d.isSame(today, "day") ? "date" : undefined}
                    onClick={() => pick(d)}
                    className={cn(
                      blocked(d) && "cursor-not-allowed text-slate-300 hover:bg-transparent",
                      "mx-auto flex h-9 w-9 items-center justify-center rounded-lg text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                      !blocked(d) && (isSelected ? "bg-indigo-600 font-semibold text-white" : isOtherMonth ? "text-slate-400 hover:bg-slate-50" : "text-slate-700 hover:bg-slate-100"),
                      !isSelected && !blocked(d) && d.isSame(today, "day") && "font-semibold text-indigo-600 ring-1 ring-inset ring-indigo-200",
                    )}
                  >
                    {d.date()}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex justify-between border-t border-slate-100 pt-2">
              <Button size="sm" variant="ghost" disabled={blocked(today)} onClick={() => pick(today)}>
                Today
              </Button>
              {clearable && value && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    onChange?.("");
                    close();
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

DatePicker.propTypes = {
  /** The chosen date as `YYYY-MM-DD`, or an empty string for none. Controlled. */
  value: PropTypes.string,
  /** Called with the new date as `YYYY-MM-DD`, or an empty string when cleared. */
  onChange: PropTypes.func,
  /** Earliest date that can be picked, as `YYYY-MM-DD`. Earlier days are greyed out. */
  min: PropTypes.string,
  /** Latest date that can be picked, as `YYYY-MM-DD`. */
  max: PropTypes.string,
  /** Grey text shown while no date is chosen. */
  placeholder: PropTypes.string,
  /** Shows a "Clear" button in the calendar when a date is chosen. */
  clearable: PropTypes.bool,
  /** Red border when true. Inside a Field it follows the Field's `error`. */
  error: PropTypes.bool,
  /** Disables the control. */
  disabled: PropTypes.bool,
  /** Id of the button. Inside a Field it is set for you. */
  id: PropTypes.string,
  /** Extra classes on the button, for layout only. */
  className: PropTypes.string,
};
