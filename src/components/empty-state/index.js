import PropTypes from "prop-types";
import { Inbox } from "lucide-react";
import { cn } from "utils/cn";

/**
 * EmptyState — what a list or table shows when there is nothing to show: an
 * icon, a title, one line of help, and the action that fills it.
 */
export function EmptyState({ icon, title, description, action, className }) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-12 text-center", className)}>
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">{icon ?? <Inbox size={22} />}</div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

EmptyState.propTypes = {
  /** A lucide icon at size 22. Defaults to an inbox. */
  icon: PropTypes.node,
  /** What is empty, e.g. "No loans yet". */
  title: PropTypes.string.isRequired,
  /** One line that says what to do next. */
  description: PropTypes.string,
  /** The button that fixes the empty state. */
  action: PropTypes.node,
  /** Extra classes, for layout only. */
  className: PropTypes.string,
};
