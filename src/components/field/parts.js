import PropTypes from "prop-types";
import { Info } from "lucide-react";
import { Tooltip } from "components/tooltip";
import { cn } from "utils/cn";

// Label and caption of the SHIELD "Input" (Figma layers "Label Elements" and
// "Caption"). Shared by Input (its own label / caption props) and Field, so a
// control inside a Field looks the same as an Input with a label.
// docs/shield/input.md has the Figma -> code table.
const LABEL_TYPO = { sm: "typo-medium-text-xs", md: "typo-medium-text-sm", lg: "typo-medium-text-base" };
const INFO_PX = { sm: 12, md: 16, lg: 16 };
const CAPTION_TYPO = { sm: "typo-regular-text-xs", md: "typo-regular-text-xs", lg: "typo-regular-text-sm" };

/**
 * FieldLabel — label row of a form control: text, a red asterisk when required and
 * an optional info icon with a tooltip. Disabled hides the asterisk and the icon.
 */
export function FieldLabel({ htmlFor, size = "md", required = false, info, disabled = false, children }) {
  return (
    <div className="flex items-center gap-0.5">
      <label htmlFor={htmlFor} className={cn(LABEL_TYPO[size], disabled ? "text-placeholder" : "text-default")}>
        {children}
      </label>
      {required && !disabled && (
        <span className={cn(LABEL_TYPO[size], "text-danger")} aria-hidden>
          *
        </span>
      )}
      {info && !disabled && (
        <span className="inline-flex pl-0.5 text-caption">
          <Tooltip content={info}>
            <span tabIndex={0} role="img" aria-label={info} className="inline-flex rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <Info size={INFO_PX[size]} aria-hidden />
            </span>
          </Tooltip>
        </span>
      )}
    </div>
  );
}

FieldLabel.propTypes = {
  /** id of the control the label belongs to. */
  htmlFor: PropTypes.string,
  /** Text size: sm, md (default), lg. Follows the control size. */
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  /** Shows a red asterisk after the label. */
  required: PropTypes.bool,
  /** Short help text, shown in a tooltip on an info icon after the label. */
  info: PropTypes.string,
  /** Greys the label out and hides the asterisk and the info icon. */
  disabled: PropTypes.bool,
  /** Label text. */
  children: PropTypes.node,
};

/** FieldCaption — helper or error text under a form control; red when `danger`. */
export function FieldCaption({ id, size = "md", danger = false, alert = false, children }) {
  return (
    <p id={id} role={alert ? "alert" : undefined} className={cn(CAPTION_TYPO[size], danger ? "text-danger" : "text-caption")}>
      {children}
    </p>
  );
}

FieldCaption.propTypes = {
  /** id, so the control can point to it with aria-describedby. */
  id: PropTypes.string,
  /** Text size: sm and md use text-xs, lg uses text-sm. */
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  /** Red text, for an error message. */
  danger: PropTypes.bool,
  /** Announces the text to screen readers when it appears (role="alert"). */
  alert: PropTypes.bool,
  /** Caption text. */
  children: PropTypes.node,
};

/** Gap between label, control and caption (Figma root gap per size). */
export const FIELD_GAP = { sm: "gap-0.5", md: "gap-1", lg: "gap-1.5" };
