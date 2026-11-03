import PropTypes from "prop-types";
import { Check } from "lucide-react";
import { cn } from "utils/cn";

// Dim colours for the icon: it sits next to the text as a quiet cue and does not shout.
const TONES = {
  neutral: "text-slate-400/70",
  info: "text-sky-400/70",
  success: "text-emerald-400/70",
  warning: "text-amber-400/70",
  danger: "text-red-400/70",
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
              "flex items-center gap-4 rounded-default border-2 bg-surface p-4 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
              selected ? "border-primary" : "border-default",
              disabled ? "cursor-not-allowed opacity-60" : !selected && "hover:border-primary",
            )}
          >
            {o.icon && <span className={cn("flex shrink-0 items-center", TONES[o.tone] ?? TONES.neutral)}>{o.icon}</span>}
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="typo-semi-bold-text-sm">{o.label}</span>
              {o.description && <span className="text-caption typo-regular-text-sm">{o.description}</span>}
            </span>
            <span aria-hidden="true" className={cn("flex h-6 w-6 shrink-0 items-center justify-center self-start rounded-full border-2 transition-colors duration-200", selected ? "border-primary bg-primary-default text-base-color" : "border-default")}>
              <Check size={14} strokeWidth={3} className={cn("transition-all duration-200", selected ? "scale-100 opacity-100" : "scale-50 opacity-0")} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

ChoiceCards.propTypes = {
  /** The choices: `{ value, label, description?, icon?, tone? }`. `description` says what happens when it is chosen; `icon` is a lucide icon at size 48 to 56 with `strokeWidth={1.5}`, shown on the left as tall as the text and tinted by `tone` (default `neutral`), so each choice looks different without a container around it. */
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
