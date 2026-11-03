import PropTypes from "prop-types";
import { Check } from "lucide-react";
import { cn } from "utils/cn";

// Soft tints for the icon tile, the same pairs the StatCard uses, so the icon is coloured but does not shout.
const TONES = {
  neutral: "bg-slate-100 text-slate-600",
  info: "bg-sky-50 text-sky-600",
  success: "bg-emerald-50 text-emerald-600",
  warning: "bg-amber-50 text-amber-600",
  danger: "bg-red-50 text-red-600",
};

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
              <span className="flex items-center gap-3">
                {o.icon && <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", TONES[o.tone] ?? TONES.neutral)}>{o.icon}</span>}
                <span className="typo-semi-bold-text-sm">{o.label}</span>
              </span>
              <span aria-hidden="true" className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2", selected ? "border-primary bg-primary text-true-white" : "border-default")}>
                {selected && <Check size={14} strokeWidth={3} />}
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
  /** The choices: `{ value, label, description?, icon?, tone? }`. `description` says what happens when it is chosen; `icon` is a lucide icon at size 20, shown in a soft tile coloured by `tone` (default `neutral`), so each choice looks different. */
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      description: PropTypes.string,
      icon: PropTypes.node,
      tone: PropTypes.oneOf(["neutral", "info", "success", "warning", "danger"]),
    }),
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
