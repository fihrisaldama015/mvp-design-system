import PropTypes from "prop-types";
import { cn } from "utils/cn";

/**
 * PageHeader — the title row at the top of every page: title, optional
 * description, and the page actions on the right (one primary at most).
 */
export function PageHeader({ title, description, actions, className }) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-4", className)}>
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

PageHeader.propTypes = {
  /** Page title (h1). One per page, sentence case. */
  title: PropTypes.string.isRequired,
  /** One line under the title. */
  description: PropTypes.string,
  /** Buttons on the right. At most one `primary`. */
  actions: PropTypes.node,
  /** Extra classes, for layout only. */
  className: PropTypes.string,
};
