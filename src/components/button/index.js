import { cloneElement, forwardRef, isValidElement } from "react";
import PropTypes from "prop-types";
import { LoaderCircle } from "lucide-react";
import { cn } from "utils/cn";

// Built from SHIELD "Button" (Figma): 4 kinds x 6 statuses x 3 sizes, hovered and
// pressed states, disabled and loading. Every class below is a Graphene token
// (see Storybook Foundations); docs/shield/button.md has the Figma -> code table.
const KIND = {
  filled: "",
  outlined: "border bg-surface hover:bg-default-hovered active:bg-default-pressed",
  dashed: "border border-dashed bg-surface hover:bg-default-hovered active:bg-default-pressed",
  text: "bg-transparent hover:bg-default-hovered active:bg-default-pressed",
};

const STATUS = {
  filled: {
    default: "bg-default-default text-default hover:bg-default-hovered active:bg-default-pressed",
    primary: "bg-primary-default text-base-color hover:bg-primary-hovered active:bg-primary-pressed",
    info: "bg-info-default text-base-color hover:bg-info-hovered active:bg-info-pressed",
    success: "bg-success-default text-base-color hover:bg-success-hovered active:bg-success-pressed",
    warning: "bg-warning-default text-base-color hover:bg-warning-hovered active:bg-warning-pressed",
    danger: "bg-danger-default text-base-color hover:bg-danger-hovered active:bg-danger-pressed",
  },
  // outlined and dashed share colours: the border and the text carry the status.
  outlined: {
    default: "border-invert-default text-default",
    primary: "border-primary text-primary",
    info: "border-info text-info",
    success: "border-success text-success",
    warning: "border-warning text-warning",
    danger: "border-danger text-danger",
  },
  text: {
    default: "text-default",
    primary: "text-primary",
    info: "text-info",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
  },
};
STATUS.dashed = STATUS.outlined;

// Disabled replaces the colours (no hover / pressed).
const DISABLED = {
  filled: "bg-disabled text-disabled",
  outlined: "bg-surface border-disabled text-disabled",
  dashed: "bg-surface border-disabled text-disabled",
  text: "bg-transparent text-disabled",
};

const SIZE = {
  sm: "h-component-sm px-4 gap-2",
  md: "h-component-md px-4 gap-2",
  lg: "h-component-lg px-5 gap-3",
};
const ICON_PX = { sm: 16, md: 18, lg: 18 };

const sized = (icon, size) => (isValidElement(icon) ? cloneElement(icon, { size: ICON_PX[size], "aria-hidden": true }) : icon);

/**
 * Button — SHIELD button. `kind` is the look (filled, outlined, dashed, text) and
 * `status` the meaning (primary for the main action, danger for destructive ones,
 * default for neutral ones). One filled primary per view. While `loading` the label
 * stays in place (no layout jump) and a spinner shows over it. Use `as={Link}` and
 * `to` for a link that looks like a button.
 */
export const Button = forwardRef(function Button(
  { as: Tag = "button", kind = "filled", status = "default", size = "md", loading = false, disabled = false, prefixIcon, suffixIcon, className, children, type, ...props },
  ref,
) {
  const isNative = Tag === "button";
  const blocked = disabled || loading;
  const colours = disabled
    ? cn(DISABLED[kind], kind === "outlined" || kind === "dashed" ? "border" : "", (kind === "outlined" || kind === "dashed") && status === "default" && "border-invert-default", kind === "dashed" && "border-dashed")
    : cn(KIND[kind], STATUS[kind][status]);
  return (
    <Tag
      ref={ref}
      // A native button never submits a form by accident: type defaults to "button".
      {...(isNative ? { type: type ?? "button", disabled: blocked } : { "aria-disabled": blocked || undefined })}
      aria-busy={loading || undefined}
      className={cn(
        "relative inline-flex items-center justify-center whitespace-nowrap rounded-default typo-semi-bold-text-sm transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        SIZE[size],
        colours,
        disabled && "cursor-not-allowed",
        loading && "cursor-wait",
        !isNative && blocked && "pointer-events-none",
        className,
      )}
      {...props}
    >
      <span className={cn("inline-flex items-center", SIZE[size].split(" ").find((c) => c.startsWith("gap-")), loading && "invisible")}>
        {sized(prefixIcon, size)}
        {children}
        {sized(suffixIcon, size)}
      </span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <LoaderCircle size={16} className="animate-spin" aria-label="Loading" />
        </span>
      )}
    </Tag>
  );
});

Button.propTypes = {
  /** Look: `filled` (solid), `outlined` (border), `dashed` (dashed border), `text` (no border, no fill). */
  kind: PropTypes.oneOf(["filled", "outlined", "dashed", "text"]),
  /** Meaning: `primary` main action, `danger` destructive, `info` / `success` / `warning`, `default` neutral. */
  status: PropTypes.oneOf(["default", "primary", "info", "success", "warning", "danger"]),
  /** Height: sm 36px, md 40px (default), lg 44px. */
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  /** Shows a spinner over the label and blocks clicks; the width does not change. */
  loading: PropTypes.bool,
  /** Greys the button out and blocks clicks. */
  disabled: PropTypes.bool,
  /** Icon before the label, a lucide icon. Sized by the button (16px sm, 18px md / lg). */
  prefixIcon: PropTypes.node,
  /** Icon after the label, a lucide icon. */
  suffixIcon: PropTypes.node,
  /** Element or component to render, e.g. `Link` from react-router-dom (pass `to` too). Default `"button"`. */
  as: PropTypes.elementType,
  /** Native button type. Defaults to `"button"`; use `"submit"` for the submit button of a form. */
  type: PropTypes.oneOf(["button", "submit", "reset"]),
  /** Extra classes, for layout only (width, margin). */
  className: PropTypes.string,
  /** Label. Leave it out for an icon-only button (then give it an `aria-label`). */
  children: PropTypes.node,
};
