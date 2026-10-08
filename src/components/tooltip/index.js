import PropTypes from "prop-types";
import { cn } from "utils/cn";

/**
 * Tooltip — a small dark label that shows on hover or keyboard focus. Use it to
 * explain an icon or a truncated value; never for information the user needs.
 */
export function Tooltip({ content, side = "top", children }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs text-white opacity-0 shadow transition-opacity",
          "group-hover:opacity-100 group-focus-within:opacity-100",
          side === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5",
        )}
      >
        {content}
      </span>
    </span>
  );
}

Tooltip.propTypes = {
  /** Tooltip text, short. */
  content: PropTypes.string.isRequired,
  /** Where it appears. */
  side: PropTypes.oneOf(["top", "bottom"]),
  /** The element that triggers it. */
  children: PropTypes.node.isRequired,
};
