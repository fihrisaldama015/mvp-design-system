import PropTypes from "prop-types";
import { cn } from "utils/cn";

const TONE = { warning: "text-warning", success: "text-success", info: "text-info", danger: "text-danger" };

/**
 * ProgressRing — a circular progress with the count in the middle (for example 1/3). Use it for "how many of these are
 * done" when the number matters as much as the bar, such as decisions saved on a review. Display only.
 */
export function ProgressRing({ value, max, tone = "warning", size = 96, label, className }) {
  const total = max > 0 ? max : 1;
  const ratio = Math.min(1, Math.max(0, value / total));
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const centre = size / 2;
  return (
    <div className={cn("flex items-center gap-4", className)} role="img" aria-label={`${label ? `${label}: ` : ""}${value} of ${max}`}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
          <circle cx={centre} cy={centre} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-caption opacity-25" />
          <circle
            cx={centre}
            cy={centre}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - ratio)}
            className={cn("transition-all", TONE[tone])}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-2xl font-semibold text-default">{value}/{max}</span>
      </div>
      {label && <p className="typo-semi-bold-text-lg">{label}</p>}
    </div>
  );
}

ProgressRing.propTypes = {
  /** How many are done. Clamped between 0 and `max`. */
  value: PropTypes.number.isRequired,
  /** How many there are in total. Shown in the middle as `value/max`. */
  max: PropTypes.number.isRequired,
  /** Colour of the filled part: `warning` while work is left, `success` when everything is done. Default `warning`. */
  tone: PropTypes.oneOf(["warning", "success", "info", "danger"]),
  /** Diameter in pixels. Default `96`. */
  size: PropTypes.number,
  /** Title beside the ring, e.g. "Decisions saved". Also the accessible name. */
  label: PropTypes.string,
  /** Extra classes, for layout only. */
  className: PropTypes.string,
};
