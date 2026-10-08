import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { MoreHorizontal } from "lucide-react";
import { IconButton } from "components/icon-button";
import { cn } from "utils/cn";

/**
 * DropdownMenu — a "⋯" button that opens a short list of row actions. Use it
 * when a row has three or more actions; for one or two, show IconButtons. The
 * destructive action goes last, with `danger: true`.
 */
export function DropdownMenu({ items, label = "More actions", align = "right" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <IconButton icon={<MoreHorizontal size={16} />} label={label} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} />
      {open && (
        <div role="menu" className={cn("absolute z-30 mt-1 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-lg", align === "right" ? "right-0" : "left-0")}>
          {items.map((item) => (
            <button
              key={item.label}
              role="menuitem"
              type="button"
              onClick={() => {
                setOpen(false);
                item.onClick?.();
              }}
              className={cn("flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50", item.danger ? "text-red-600" : "text-slate-700")}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

DropdownMenu.propTypes = {
  /** Menu items: `{ label, onClick, icon?, danger? }`. Put the destructive one last. */
  items: PropTypes.arrayOf(
    PropTypes.shape({ label: PropTypes.string.isRequired, onClick: PropTypes.func, icon: PropTypes.node, danger: PropTypes.bool }),
  ).isRequired,
  /** Accessible name of the trigger button. */
  label: PropTypes.string,
  /** Which edge of the trigger the menu lines up with. */
  align: PropTypes.oneOf(["left", "right"]),
};
