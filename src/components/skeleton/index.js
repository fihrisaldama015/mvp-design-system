import PropTypes from "prop-types";
import { cn } from "utils/cn";

/**
 * Skeleton — a grey pulsing block that holds the place of content while a page
 * or list loads. Size it with `className` (for example `h-4 w-40`). Use Spinner
 * for a short wait after a click.
 */
export function Skeleton({ className }) {
  return <div className={cn("animate-pulse rounded-md bg-slate-200", className)} aria-hidden />;
}

Skeleton.propTypes = {
  /** Width and height classes, e.g. `h-4 w-40`. */
  className: PropTypes.string,
};
