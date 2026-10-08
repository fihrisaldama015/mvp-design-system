import PropTypes from "prop-types";
import { Check } from "lucide-react";
import { cn } from "utils/cn";

/**
 * Stepper — shows the steps of a multi-step flow (e.g. New loan) and where the
 * user is. Steps before `current` are done (tick), the current one is
 * highlighted, the rest are grey. It is display only; the page owns the step state.
 */
export function Stepper({ steps, current, className }) {
  return (
    <ol className={cn("flex items-center", className)}>
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className={cn("flex items-center", i < steps.length - 1 && "flex-1")}>
            <span className="flex items-center gap-2">
              <span
                aria-current={active ? "step" : undefined}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                  done && "bg-indigo-600 text-white",
                  active && "border-2 border-indigo-600 text-indigo-600",
                  !done && !active && "border border-slate-300 text-slate-400",
                )}
              >
                {done ? <Check size={14} /> : i + 1}
              </span>
              <span className={cn("text-sm font-medium", active ? "text-slate-900" : "text-slate-500")}>{label}</span>
            </span>
            {i < steps.length - 1 && <span className={cn("mx-3 h-px flex-1", done ? "bg-indigo-600" : "bg-slate-200")} />}
          </li>
        );
      })}
    </ol>
  );
}

Stepper.propTypes = {
  /** Step names in order, short. */
  steps: PropTypes.arrayOf(PropTypes.string).isRequired,
  /** Index of the current step, starting at 0. */
  current: PropTypes.number.isRequired,
  /** Extra classes, for layout only. */
  className: PropTypes.string,
};
