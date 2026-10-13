import PropTypes from "prop-types";
import { CircleAlert, CircleCheck, Info, Star, TriangleAlert, X } from "lucide-react";
import { cn } from "utils/cn";

// Classes come from the SHIELD Alert (Figma) through scripts/figma/variantClasses.mjs, written out in full.
const ICON = { default: Star, info: Info, success: CircleCheck, warning: TriangleAlert, danger: CircleAlert };

// kind × status (× invert for filled): box, message + icon colour, description + dismiss colour.
const FILLED = {
  default: { box: "bg-default-default", head: "text-default", body: "text-default" },
  info: { box: "bg-info-default", head: "text-base-color", body: "text-base-color" },
  success: { box: "bg-success-default", head: "text-base-color", body: "text-base-color" },
  warning: { box: "bg-warning-default", head: "text-default", body: "text-default" },
  danger: { box: "bg-danger-default", head: "text-base-color", body: "text-base-color" },
};
const FILLED_INVERT = {
  default: { box: "bg-default-invert-default", head: "text-base-color", body: "text-base-color" },
  info: { box: "bg-info-invert-default", head: "text-default", body: "text-default" },
  success: { box: "bg-success-invert-default", head: "text-default", body: "text-default" },
  warning: { box: "bg-warning-invert-default", head: "text-default", body: "text-default" },
  danger: { box: "bg-danger-invert-default", head: "text-default", body: "text-default" },
};
// outlined: pale fill, border and coloured message / icon; the description and the dismiss icon stay neutral.
const OUTLINED = {
  default: { box: "bg-default-default border border-default", head: "text-default", body: "text-default" },
  info: { box: "bg-info-invert-default border border-info", head: "text-info", body: "text-default" },
  success: { box: "bg-success-invert-default border border-success", head: "text-success", body: "text-default" },
  warning: { box: "bg-warning-invert-default border border-warning", head: "text-warning", body: "text-default" },
  danger: { box: "bg-danger-invert-default border border-danger", head: "text-danger", body: "text-default" },
};
// "dashed" in Figma is a bottom border only, with the radius; "full page" is the same without the radius.
const BAR = {
  default: { box: "bg-default-default border-b border-default", head: "text-default", body: "text-default" },
  info: { box: "bg-info-invert-default border-b border-info", head: "text-info", body: "text-default" },
  success: { box: "bg-success-invert-default border-b border-success", head: "text-success", body: "text-default" },
  warning: { box: "bg-warning-invert-default border-b border-warning", head: "text-warning", body: "text-default" },
  danger: { box: "bg-danger-invert-default border-b border-danger", head: "text-danger", body: "text-default" },
};

// Status "default" has a smaller description and a tighter gap in Figma at md and lg: kept as drawn.
const SIZE = {
  sm: { box: "py-3 px-3 gap-2.5", icon: 16, head: "typo-medium-text-xs", body: { default: "typo-regular-text-xs", other: "typo-regular-text-xs" }, gap: { default: "gap-1", other: "gap-1" } },
  md: { box: "py-3.5 px-3.5 gap-3", icon: 20, head: "typo-medium-text-sm", body: { default: "typo-regular-text-xs", other: "typo-regular-text-sm" }, gap: { default: "gap-2", other: "gap-2.5" } },
  lg: { box: "py-4 px-4 gap-3.5", icon: 24, head: "typo-medium-text-base", body: { default: "typo-regular-text-sm", other: "typo-regular-text-base" }, gap: { default: "gap-3", other: "gap-3" } },
};

function palette(kind, status, invert) {
  if (kind === "outlined") return OUTLINED[status];
  if (kind === "dashed" || kind === "full page") return BAR[status];
  return (invert ? FILLED_INVERT : FILLED)[status];
}

/**
 * Alert — an inline message inside the page (not a popup). Use it for a state the user should
 * see while working, e.g. "3 loans are overdue". For a short confirmation after an action use
 * Toast. Built from the SHIELD Alert (Figma): `kind` is how it looks, `status` what it means.
 */
export function Alert({ kind = "filled", status = "default", size = "md", invert = false, prefixIcon, title, children, action, onDismiss, className }) {
  const p = palette(kind, status, invert);
  const s = SIZE[size];
  const slot = status === "default" ? "default" : "other";
  const Icon = ICON[status];
  const rounded = kind === "full page" ? "" : "rounded-default";
  return (
    <div role="alert" className={cn("flex items-start", s.box, p.box, rounded, className)}>
      {prefixIcon !== false && <span className={cn("inline-flex shrink-0", p.head)}>{prefixIcon ?? <Icon size={s.icon} aria-hidden />}</span>}
      <div className={cn("flex min-w-0 flex-1 flex-col", s.gap[slot])}>
        {title && <p className={cn(s.head, p.head)}>{title}</p>}
        {children && <div className={cn(s.body[slot], p.body)}>{children}</div>}
      </div>
      {action}
      {onDismiss && (
        // Figma draws the dismiss as a bare x icon. IconButton is not synced with Figma yet; swap it in when it is.
        <button type="button" onClick={onDismiss} aria-label="Dismiss" className={cn("inline-flex shrink-0", p.body)}>
          <X size={s.icon} aria-hidden />
        </button>
      )}
    </div>
  );
}

Alert.propTypes = {
  /** How it looks: `filled` solid, `outlined` pale with a border, `dashed` pale with a bottom border, `full page` the same without rounded corners (spans the page). */
  kind: PropTypes.oneOf(["filled", "outlined", "dashed", "full page"]),
  /** Meaning; sets the colour and the default icon. `default` is neutral. */
  status: PropTypes.oneOf(["default", "info", "success", "warning", "danger"]),
  /** Padding, gap and text size: `sm`, `md`, `lg`. */
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  /** Flips a `filled` alert between the solid and the pale look. Other kinds ignore it. */
  invert: PropTypes.bool,
  /** Icon before the text: a lucide element (its size follows `size`), or `false` to hide it. Default: the icon of the status. */
  prefixIcon: PropTypes.oneOfType([PropTypes.node, PropTypes.oneOf([false])]),
  /** The message: the first line, medium weight. */
  title: PropTypes.string,
  /** The description under the message. */
  children: PropTypes.node,
  /** Element on the right, e.g. a small Button. Not in Figma. */
  action: PropTypes.node,
  /** Shows a dismiss (x) icon and is called when it is clicked. */
  onDismiss: PropTypes.func,
  /** Extra classes, for layout only. */
  className: PropTypes.string,
};
