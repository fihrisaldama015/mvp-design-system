import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { cn } from "utils/cn";

const reduced = () => typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);

/**
 * Collapse — shows or hides its content with a smooth height change instead of a jump. Controlled: keep `open` in state.
 * The content is built the first time it opens (heavy content such as frames costs nothing while closed) and stays
 * mounted afterwards, so what the user typed in it is kept. People who asked for less motion get no animation.
 */
export function Collapse({ open, duration = 300, children, className }) {
  const [seen, setSeen] = useState(open);
  const [settled, setSettled] = useState(open); // true once the height change is over, so focus rings and menus are not clipped
  if (open && !seen) setSeen(true);
  useEffect(() => { setSettled(reduced() ? open : false); }, [open]);
  return (
    <div
      className={className}
      style={{ display: "grid", gridTemplateRows: open ? "1fr" : "0fr", transition: reduced() ? "none" : `grid-template-rows ${duration}ms ease` }}
      onTransitionEnd={(e) => { if (e.target === e.currentTarget) setSettled(open); }}
    >
      <div className={cn("min-h-0", open && settled ? "overflow-visible" : "overflow-hidden")} aria-hidden={!open} {...(open ? {} : { inert: "" })}>
        {seen ? children : null}
      </div>
    </div>
  );
}

Collapse.propTypes = {
  /** Whether the content is shown. */
  open: PropTypes.bool.isRequired,
  /** Length of the height change in milliseconds. Default `300`. */
  duration: PropTypes.number,
  /** The content to show or hide. */
  children: PropTypes.node,
  /** Extra classes, for layout only. */
  className: PropTypes.string,
};
