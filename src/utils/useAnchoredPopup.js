import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * useAnchoredPopup — positions a popup (rendered in a portal) under its trigger
 * button, or above it when there is no room, and closes it on an outside click.
 * Returns the two refs to attach and the `style` for the popup (null until it
 * is measured). Used by DatePicker and DateRangePicker.
 */
export function useAnchoredPopup({ open, onDismiss, width, height }) {
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [rect, setRect] = useState(null);

  useLayoutEffect(() => {
    if (!open) {
      setRect(null);
      return undefined;
    }
    const measure = () => setRect(triggerRef.current.getBoundingClientRect());
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (!triggerRef.current?.contains(e.target) && !menuRef.current?.contains(e.target)) onDismiss();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, onDismiss]);

  let style = null;
  if (rect) {
    const below = window.innerHeight - rect.bottom;
    const flip = below < height && rect.top > below;
    style = {
      position: "fixed",
      width,
      left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
      ...(flip ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }),
    };
  }
  return { triggerRef, menuRef, style };
}
