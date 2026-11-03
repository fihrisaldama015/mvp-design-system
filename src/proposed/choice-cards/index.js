import PropTypes from "prop-types";
import { cn } from "utils/cn";

/**
 * ChoiceCards — pick one option from a few, each shown as a card with a title and a sentence that explains what happens.
 * Use it for a decision where the consequence matters, instead of a Select that hides the options. Controlled: keep the
 * chosen `value` in state.
 */
export function ChoiceCards({ options, value, onChange, disabled = false, className }) {
  return (
    <div role="radiogroup" className={cn("grid grid-cols-1 gap-3 md:grid-cols-3", className)}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex flex-col gap-2 rounded-default border-2 bg-surface p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
              selected ? "border-primary" : "border-default",
              disabled ? "cursor-not-allowed opacity-60" : !selected && "hover:border-primary",
            )}
          >
            <span className="flex items-start justify-between gap-3">
              <span className="flex items-center gap-2 typo-semi-bold-text-sm">
                {o.icon}
                {o.label}
              </span>
              <span aria-hidden="true" className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2", selected ? "border-primary" : "border-default")}>
                {selected && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
              </span>
            </span>
            {o.description && <span className="text-caption typo-regular-text-sm">{o.description}</span>}
          </button>
        );
      })}
    </div>
  );
}

ChoiceCards.propTypes = {
  /** The choices: `{ value, label, description?, icon? }`. `description` says what happens when it is chosen; `icon` is a lucide icon at size 16. */
  options: PropTypes.arrayOf(
    PropTypes.shape({ value: PropTypes.string.isRequired, label: PropTypes.string.isRequired, description: PropTypes.string, icon: PropTypes.node }),
  ).isRequired,
  /** `value` of the chosen option, or an empty value when nothing is chosen yet. */
  value: PropTypes.string,
  /** Called with the `value` of the card that was clicked. */
  onChange: PropTypes.func.isRequired,
  /** Locks the choice, e.g. after the review is applied. Default `false`. */
  disabled: PropTypes.bool,
  /** Extra classes, for layout only. */
  className: PropTypes.string,
};
