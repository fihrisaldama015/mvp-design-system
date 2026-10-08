import { forwardRef } from "react";
import PropTypes from "prop-types";
import { Loader2 } from "lucide-react";
import { cn } from "utils/cn";

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

const VARIANTS = {
  primary: `bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-500 ${FOCUS}`,
  secondary: `bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus-visible:ring-indigo-500 ${FOCUS}`,
  danger: `bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 ${FOCUS}`,
  ghost: `text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-indigo-500 ${FOCUS}`,
};

const SIZES = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-base gap-2",
};

/**
 * Button — the one button of the app. `primary` is the main action of a view
 * (one per view), `secondary` the others, `danger` a destructive action, and
 * `ghost` a quiet action (for example Cancel in a dialog). Use `as={Link}` and
 * `to` to make a link that looks like a button. For an icon without a label use
 * IconButton.
 */
export const Button = forwardRef(function Button(
  {
    as: Tag = "button",
    variant = "primary",
    size = "md",
    loading = false,
    disabled = false,
    leftIcon,
    rightIcon,
    className,
    children,
    type,
    ...props
  },
  ref,
) {
  const isNative = Tag === "button";
  const blocked = disabled || loading;
  return (
    <Tag
      ref={ref}
      // A native button never submits a form by accident: type defaults to "button".
      {...(isNative ? { type: type ?? "button", disabled: blocked } : { "aria-disabled": blocked || undefined })}
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium whitespace-nowrap transition-colors",
        VARIANTS[variant],
        SIZES[size],
        blocked && "opacity-50 pointer-events-none",
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 size={16} className="animate-spin" aria-hidden /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </Tag>
  );
});

Button.propTypes = {
  /** Look of the button: `primary` main action, `secondary` other actions, `danger` destructive, `ghost` quiet. */
  variant: PropTypes.oneOf(["primary", "secondary", "danger", "ghost"]),
  /** Height: sm 32px, md 40px, lg 44px. */
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  /** Shows a spinner in place of the left icon and blocks clicks. */
  loading: PropTypes.bool,
  /** Greys the button out and blocks clicks. */
  disabled: PropTypes.bool,
  /** Icon before the label (a lucide icon at size 16). */
  leftIcon: PropTypes.node,
  /** Icon after the label. */
  rightIcon: PropTypes.node,
  /** Element or component to render, e.g. `Link` from react-router-dom (pass `to` too). Default `"button"`. */
  as: PropTypes.elementType,
  /** Native button type. Defaults to `"button"`; use `"submit"` for the submit button of a form. */
  type: PropTypes.oneOf(["button", "submit", "reset"]),
  /** Extra classes, for layout only (width, margin). */
  className: PropTypes.string,
  /** Label. */
  children: PropTypes.node,
};
