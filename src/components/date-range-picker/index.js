import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import { Calendar } from "lucide-react";
import { useFieldControl } from "components/field";
import { Button } from "components/button";
import { ISO, MonthGrid, MonthHeader, handleCalendarKey, triggerClass } from "components/date-picker/calendarParts";
import { useAnchoredPopup } from "utils/useAnchoredPopup";

const PRESETS = [
  { label: "Last 7 days", range: () => [dayjs().subtract(6, "day"), dayjs()] },
  { label: "Last 30 days", range: () => [dayjs().subtract(29, "day"), dayjs()] },
  { label: "This month", range: () => [dayjs().startOf("month"), dayjs().endOf("month")] },
];

const format = (iso) => dayjs(iso).format("D MMM YYYY");

/**
 * DateRangePicker — pick a "from" and a "to" date from two calendars (one on a
 * narrow screen). Click the first day, then the last day; the days between are
 * shaded while you move. The value is `{ start, end }` as `YYYY-MM-DD` strings
 * (both empty for no range). `onChange` is called once, when the range is
 * complete, so the page never receives half a range. Use it for report and
 * filter periods; for a single date use DatePicker.
 */
export function DateRangePicker({ value, onChange, min, max, placeholder = "Select dates", presets = true, error: errorProp, disabled, id: idProp, className }) {
  const field = useFieldControl();
  const id = idProp ?? field.id;
  const error = errorProp ?? field.invalid;
  const start = value?.start || "";
  const end = value?.end || "";

  const [open, setOpen] = useState(false);
  const [months, setMonths] = useState(2);
  const [view, setView] = useState(() => dayjs().startOf("month"));
  const [focused, setFocused] = useState(() => dayjs());
  const [draft, setDraft] = useState({ start: "", end: "" });
  const [hover, setHover] = useState(null);
  const width = months === 2 ? 584 : 288;
  const { triggerRef, menuRef, style } = useAnchoredPopup({ open, onDismiss: () => setOpen(false), width, height: 420 });

  const minDay = min ? dayjs(min) : null;
  const maxDay = max ? dayjs(max) : null;
  const blocked = (d) => !!((minDay && d.isBefore(minDay, "day")) || (maxDay && d.isAfter(maxDay, "day")));

  const openMenu = () => {
    if (disabled) return;
    let anchor = start ? dayjs(start) : dayjs();
    if (minDay && anchor.isBefore(minDay, "day")) anchor = minDay;
    if (maxDay && anchor.isAfter(maxDay, "day")) anchor = maxDay;
    setMonths(window.innerWidth < 640 ? 1 : 2);
    setDraft({ start, end });
    setHover(null);
    setFocused(anchor);
    setView(anchor.startOf("month"));
    setOpen(true);
  };

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  };

  const complete = (s, e) => {
    onChange?.({ start: s.format(ISO), end: e.format(ISO) });
    close();
  };

  // First click sets the start; the second sets the end (or restarts when it is before the start).
  const pick = (d) => {
    if (blocked(d)) return;
    if (!draft.start || draft.end || d.isBefore(dayjs(draft.start), "day")) {
      setDraft({ start: d.format(ISO), end: "" });
      setHover(null);
    } else {
      setDraft({ start: draft.start, end: d.format(ISO) });
      complete(dayjs(draft.start), d);
    }
  };

  const moveFocus = (d) => {
    setFocused(d);
    const last = view.add(months - 1, "month").endOf("month");
    if (d.isBefore(view, "day")) setView(d.startOf("month"));
    else if (d.isAfter(last, "day")) setView(d.startOf("month").subtract(months - 1, "month"));
  };

  useEffect(() => {
    if (open && style) menuRef.current?.querySelector(`[data-date="${focused.format(ISO)}"]`)?.focus();
  }, [open, style, focused, view, menuRef]);

  // While only the start is chosen, the hovered day previews the end.
  const rangeStart = draft.start ? dayjs(draft.start) : null;
  let rangeEnd = draft.end ? dayjs(draft.end) : null;
  if (rangeStart && !rangeEnd && hover && !hover.isBefore(rangeStart, "day")) rangeEnd = hover;

  const getState = (d) => {
    const isStart = !!rangeStart?.isSame(d, "day");
    const isEnd = !!rangeEnd?.isSame(d, "day");
    let band = "none";
    if (rangeStart && rangeEnd && !d.isBefore(rangeStart, "day") && !d.isAfter(rangeEnd, "day")) {
      if (isStart && isEnd) band = "none";
      else if (isStart) band = "start";
      else if (isEnd) band = "end";
      else band = "mid";
    }
    // The preview end is shaded, not filled, until it is clicked.
    const confirmedEnd = !!draft.end;
    return { selected: isStart || (isEnd && confirmedEnd), band, blocked: blocked(d) };
  };

  const label = start && end ? `${format(start)} – ${format(end)}` : placeholder;

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
        <span className={start && end ? "truncate text-slate-900" : "truncate text-slate-400"}>{label}</span>
        <Calendar size={16} className="shrink-0 text-slate-400" aria-hidden />
      </button>
      {open &&
        style &&
        createPortal(
          <div
            ref={menuRef}
            role="dialog"
            aria-label="Choose a date range"
            style={style}
            onKeyDown={(e) => handleCalendarKey(e, focused, moveFocus, close)}
            onMouseLeave={() => setHover(null)}
            className="z-[70] rounded-xl border border-slate-200 bg-white p-3 shadow-lg"
          >
            <div className={months === 2 ? "grid grid-cols-2 gap-6" : undefined}>
              {Array.from({ length: months }, (_, i) => {
                const month = view.add(i, "month");
                return (
                  <div key={month.format(ISO)}>
                    <MonthHeader
                      month={month}
                      onPrev={i === 0 ? () => setView(view.subtract(1, "month")) : undefined}
                      onNext={i === months - 1 ? () => setView(view.add(1, "month")) : undefined}
                    />
                    <MonthGrid month={month} focused={focused} getState={getState} onPick={pick} onHover={setHover} hideOtherMonth />
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
              <div className="flex flex-wrap gap-1">
                {presets &&
                  PRESETS.map((p) => {
                    const [s, e] = p.range();
                    return (
                      <Button key={p.label} size="sm" variant="ghost" disabled={blocked(s) || blocked(e)} onClick={() => complete(s, e)}>
                        {p.label}
                      </Button>
                    );
                  })}
              </div>
              {start && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    onChange?.({ start: "", end: "" });
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

DateRangePicker.propTypes = {
  /** The chosen range: `{ start, end }` as `YYYY-MM-DD`, both empty strings for none. Controlled. */
  value: PropTypes.shape({ start: PropTypes.string, end: PropTypes.string }),
  /** Called once with `{ start, end }` when the range is complete (or `{ start: "", end: "" }` when cleared). */
  onChange: PropTypes.func,
  /** Earliest date that can be picked, as `YYYY-MM-DD`. */
  min: PropTypes.string,
  /** Latest date that can be picked, as `YYYY-MM-DD`. */
  max: PropTypes.string,
  /** Grey text shown while no range is chosen. */
  placeholder: PropTypes.string,
  /** Shows the quick ranges (Last 7 days, Last 30 days, This month). A quick range that touches a blocked date is disabled. */
  presets: PropTypes.bool,
  /** Red border when true. Inside a Field it follows the Field's `error`. */
  error: PropTypes.bool,
  /** Disables the control. */
  disabled: PropTypes.bool,
  /** Id of the button. Inside a Field it is set for you. */
  id: PropTypes.string,
  /** Extra classes on the button, for layout only (width). */
  className: PropTypes.string,
};
