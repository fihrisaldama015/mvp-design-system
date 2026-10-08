import PropTypes from "prop-types";
import { Loader2 } from "lucide-react";
import { cn } from "utils/cn";

/** Spinner — a rotating icon for content that is loading. Use Skeleton for page-shaped loading. */
export function Spinner({ size = 20, label = "Loading", className }) {
  return <Loader2 size={size} role="status" aria-label={label} className={cn("animate-spin text-indigo-600", className)} />;
}

Spinner.propTypes = {
  /** Icon size in px. */
  size: PropTypes.number,
  /** Accessible label. */
  label: PropTypes.string,
  /** Extra classes, e.g. a different colour. */
  className: PropTypes.string,
};

/** Skeleton — grey pulsing block that holds the place of content while it loads. Size it with `className`. */
export function Skeleton({ className }) {
  return <div className={cn("animate-pulse rounded-md bg-slate-200", className)} aria-hidden />;
}

Skeleton.propTypes = {
  /** Width and height classes, e.g. `h-4 w-40`. */
  className: PropTypes.string,
};
