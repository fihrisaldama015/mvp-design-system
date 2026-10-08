import { useEffect } from "react";
import PropTypes from "prop-types";
import { X } from "lucide-react";
import { IconButton } from "components/icon-button";

/**
 * Drawer — a panel that slides in from the right for creating or editing a
 * record, or for details that should not leave the list. Closes with the X, the
 * backdrop or Escape. For a short question use ConfirmDialog.
 */
export function Drawer({ open, onClose, title, description, footer, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} aria-hidden />
      <aside role="dialog" aria-modal="true" aria-label={title} className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
          </div>
          <IconButton icon={<X size={16} />} label="Close" onClick={onClose} />
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">{footer}</div>}
      </aside>
    </div>
  );
}

Drawer.propTypes = {
  /** Shows the panel when true. */
  open: PropTypes.bool.isRequired,
  /** Called when the user closes it (X, backdrop or Escape). */
  onClose: PropTypes.func.isRequired,
  /** Panel title. */
  title: PropTypes.string.isRequired,
  /** One line under the title. */
  description: PropTypes.string,
  /** Buttons at the bottom right: Cancel (ghost) first, then the main action. */
  footer: PropTypes.node,
  /** Panel body; scrolls when long. */
  children: PropTypes.node,
};
