import { useEffect } from "react";
import PropTypes from "prop-types";
import { X } from "lucide-react";
import { IconButton } from "components/icon-button";
import { cn } from "utils/cn";

const WIDTHS = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" };

/**
 * Modal — a centred dialog on a dark backdrop for a short task that needs the
 * user's full attention (a small form, a preview). Closes with the X, the
 * backdrop or Escape. For a yes/no question use ConfirmDialog; for a longer
 * form use Drawer.
 */
export function Modal({ open, onClose, title, description, footer, size = "md", children }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} aria-hidden />
      <div role="dialog" aria-modal="true" aria-label={title} className={cn("relative w-full rounded-xl bg-white shadow-xl", WIDTHS[size])}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
          </div>
          <IconButton icon={<X size={16} />} label="Close" onClick={onClose} />
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

Modal.propTypes = {
  /** Shows the dialog when true. */
  open: PropTypes.bool.isRequired,
  /** Called when the user closes it (X, backdrop or Escape). */
  onClose: PropTypes.func.isRequired,
  /** Dialog title. */
  title: PropTypes.string.isRequired,
  /** One line under the title. */
  description: PropTypes.string,
  /** Buttons at the bottom right: Cancel (ghost) first, then the main action. */
  footer: PropTypes.node,
  /** Width: sm 384px, md 512px, lg 672px. */
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  /** Dialog body. */
  children: PropTypes.node,
};
