import PropTypes from "prop-types";
import { AlertTriangle } from "lucide-react";
import { Button } from "components/button";
import { Modal } from "components/modal";

/**
 * ConfirmDialog — a yes/no question before something that cannot be undone
 * (delete, retire, cancel a loan). Use `tone="danger"` for destructive actions
 * so the confirm button turns red and says what it does ("Delete item", not "OK").
 */
export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = "Confirm", tone = "default", loading = false }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-3">
        {tone === "danger" && <AlertTriangle size={20} className="mt-0.5 shrink-0 text-red-600" aria-hidden />}
        <p className="text-sm text-slate-600">{description}</p>
      </div>
    </Modal>
  );
}

ConfirmDialog.propTypes = {
  /** Shows the dialog when true. */
  open: PropTypes.bool.isRequired,
  /** Called on Cancel, X, backdrop or Escape. */
  onClose: PropTypes.func.isRequired,
  /** Called when the user confirms. */
  onConfirm: PropTypes.func.isRequired,
  /** The question, e.g. "Delete this item?". */
  title: PropTypes.string.isRequired,
  /** What will happen, including that it cannot be undone when true. */
  description: PropTypes.string.isRequired,
  /** Text of the confirm button: the action itself, e.g. "Delete item". */
  confirmLabel: PropTypes.string,
  /** `danger` makes the confirm button red and adds a warning icon. */
  tone: PropTypes.oneOf(["default", "danger"]),
  /** Shows a spinner on the confirm button while the action runs. */
  loading: PropTypes.bool,
};
