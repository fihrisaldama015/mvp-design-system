import PropTypes from "prop-types";
import { cn } from "utils/cn";

/**
 * Card — white surface with a thin border; the container for every block of a
 * page. Use `title` (and `action`) for a header row, `padded={false}` when the
 * content is a table that should touch the edges.
 */
export function Card({ title, description, action, padded = true, children, className }) {
  return (
    <section className={cn("rounded-xl border border-slate-200 bg-white shadow-sm", className)}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            {title && <h2 className="text-base font-semibold text-slate-900">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={padded ? "p-5" : undefined}>{children}</div>
    </section>
  );
}

Card.propTypes = {
  /** Header title. Without title and action there is no header. */
  title: PropTypes.string,
  /** Small grey text under the title. */
  description: PropTypes.string,
  /** Element on the right of the header, e.g. a Button. */
  action: PropTypes.node,
  /** Pads the content with 20px. Turn off for tables. */
  padded: PropTypes.bool,
  /** Card content. */
  children: PropTypes.node,
  /** Extra classes, for layout only. */
  className: PropTypes.string,
};
