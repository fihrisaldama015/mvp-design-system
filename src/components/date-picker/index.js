import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import { Calendar } from "lucide-react";
import { useFieldControl } from "components/field";
import { Button } from "components/button";
import { useAnchoredPopup } from "utils/useAnchoredPopup";
import { ISO, MonthGrid, MonthHeader, handleCalendarKey, triggerClass } from "./calendarParts";

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
  const { triggerRef, menuRef, style } = useAnchoredPopup({ open, onDismiss: () => setOpen(false), width: 288, height: 372 });

  const selected = value ? dayjs(value) : null;
  const minDay = min ? dayjs(min) : null;
  const maxDay = max ? dayjs(max) : null;
  const blocked = (d) => !!((minDay && d.isBefore(minDay, "day")) || (maxDay && d.isAfter(maxDay, "day")));

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

  // Keep the keyboard focus on the focused day.
  useEffect(() => {
    if (open && style) menuRef.current?.querySelector(`[data-date="${focused.format(ISO)}"]`)?.focus();
  }, [open, style, focused, view, menuRef]);

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
        className={triggerClass(error, open, className)}
      >
        <span className={selected ? "truncate text-slate-900" : "truncate text-slate-400"}>{selected ? selected.format("D MMM YYYY") : placeholder}</span>
        <Calendar size={16} className="shrink-0 text-slate-400" aria-hidden />
      </button>
      {open &&
        style &&
        createPortal(
          <div
            ref={menuRef}
            role="dialog"
            aria-label="Choose a date"
            style={style}
            onKeyDown={(e) => handleCalendarKey(e, focused, moveFocus, close)}
            className="z-[70] rounded-xl border border-slate-200 bg-white p-3 shadow-lg"
          >
            <MonthHeader month={view} onPrev={() => setView(view.subtract(1, "month"))} onNext={() => setView(view.add(1, "month"))} />
            <MonthGrid
              month={view}
              focused={focused}
              onPick={pick}
              getState={(d) => ({ selected: !!selected?.isSame(d, "day"), band: "none", blocked: blocked(d) })}
            />
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
