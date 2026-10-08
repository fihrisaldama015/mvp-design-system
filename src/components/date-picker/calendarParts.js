import dayjs from "dayjs";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { IconButton } from "components/icon-button";
import { cn } from "utils/cn";

// Internal building blocks shared by DatePicker and DateRangePicker.
export const ISO = "YYYY-MM-DD";
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

/** Month title with optional previous / next buttons. */
export function MonthHeader({ month, onPrev, onNext }) {
  return (
    <div className="mb-2 flex h-8 items-center justify-between">
      {onPrev ? <IconButton icon={<ChevronLeft size={16} />} label="Previous month" onClick={onPrev} /> : <span className="h-8 w-8" />}
      <span className="text-sm font-semibold text-slate-900" aria-live="polite">
        {month.format("MMMM YYYY")}
      </span>
      {onNext ? <IconButton icon={<ChevronRight size={16} />} label="Next month" onClick={onNext} /> : <span className="h-8 w-8" />}
    </div>
  );
}

/**
 * MonthGrid — weekday row and 6 weeks of days (Monday first). `getState(day)`
 * returns `{ selected, band, blocked }` where band is "none", "mid", "start" or
 * "end" (the light strip of a range).
 */
export function MonthGrid({ month, focused, getState, onPick, onHover, hideOtherMonth }) {
  const first = month.startOf("month");
  const offset = (first.day() + 6) % 7;
  const days = Array.from({ length: 42 }, (_, i) => first.add(i - offset, "day"));
  const today = dayjs();
  return (
    <div>
      <div className="grid grid-cols-7 text-center text-xs font-medium text-slate-400">
        {WEEKDAYS.map((w) => (
          <span key={w} className="py-1">
            {w}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7" role="grid">
        {days.map((d) => {
          const otherMonth = !d.isSame(month, "month");
          if (otherMonth && hideOtherMonth) return <span key={d.format(ISO)} className="h-9" />;
          const { selected, band = "none", blocked } = getState(d);
          const isToday = d.isSame(today, "day");
          return (
            <div key={d.format(ISO)} className={cn("flex justify-center", band !== "none" && "bg-indigo-50", band === "start" && "rounded-l-lg", band === "end" && "rounded-r-lg")}>
              <button
                type="button"
                data-date={d.format(ISO)}
                tabIndex={focused.isSame(d, "day") ? 0 : -1}
                aria-disabled={blocked || undefined}
                aria-label={d.format("dddd D MMMM YYYY")}
                aria-selected={selected}
                aria-current={isToday ? "date" : undefined}
                onClick={() => onPick(d)}
                onMouseEnter={() => onHover?.(d)}
                onFocus={() => onHover?.(d)}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                  blocked && "cursor-not-allowed text-slate-300",
                  !blocked && selected && "bg-indigo-600 font-semibold text-white",
                  !blocked && !selected && band !== "none" && "text-indigo-700 hover:bg-indigo-100",
                  !blocked && !selected && band === "none" && (otherMonth ? "text-slate-400 hover:bg-slate-50" : "text-slate-700 hover:bg-slate-100"),
                  !selected && !blocked && isToday && "font-semibold text-indigo-600 ring-1 ring-inset ring-indigo-200",
                )}
              >
                {d.date()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * handleCalendarKey — shared keyboard rules: arrows move by day or week, Page
 * Up / Down by month, Home / End to the start or end of the week, Escape and
 * Tab close the calendar.
 */
export function handleCalendarKey(e, focused, moveFocus, close) {
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
    close(true);
  } else if (e.key === "Tab") {
    close(false);
  }
}

/** The trigger button look, shared so both pickers match Input and Select. */
export const triggerClass = (error, open, className) =>
  cn(
    "flex h-10 w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 text-left text-sm",
    "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",
    "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
    error ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-slate-300",
    open && "border-indigo-500 ring-2 ring-indigo-500",
    className,
  );
