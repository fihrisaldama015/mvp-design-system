import { forwardRef } from "react";
import PropTypes from "prop-types";
import { cn } from "utils/cn";

const VARIANTS = {
  ghost: "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
  secondary: "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50",
  danger: "text-red-600 hover:bg-red-50",
};

const SIZES = { sm: "h-8 w-8", md: "h-10 w-10" };

/**
 * IconButton — a button with only an icon (row actions, close, more menu). The
 * `label` is required: it is the accessible name and the native tooltip.
 */
export const IconButton = forwardRef(function IconButton(
  { icon, label, variant = "ghost", size = "sm", className, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex items-center justify-center rounded-lg transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:pointer-events-none",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {icon}
    </button>
  );
});

IconButton.propTypes = {
  /** The icon: a lucide icon at size 16 (sm) or 18 (md). */
  icon: PropTypes.node.isRequired,
  /** Accessible name and tooltip, e.g. "Delete". Required. */
  label: PropTypes.string.isRequired,
  /** Look: `ghost` plain, `secondary` with a border, `danger` red icon. */
  variant: PropTypes.oneOf(["ghost", "secondary", "danger"]),
  /** Size: sm 32px, md 40px. */
  size: PropTypes.oneOf(["sm", "md"]),
  /** Extra classes, for layout only. */
  className: PropTypes.string,
  /** Native button type. Defaults to `"button"`. */
  type: PropTypes.oneOf(["button", "submit", "reset"]),
};
