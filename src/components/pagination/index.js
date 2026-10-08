import PropTypes from "prop-types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "components/button";

/**
 * Pagination — "Showing 1–10 of 60" with Previous / Next. Sits under a
 * DataTable, inside the same Card.
 */
export function Pagination({ page, pageSize, total, onPageChange }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-sm text-slate-600">
      <span>
        Showing {from}–{to} of {total}
      </span>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="secondary" leftIcon={<ChevronLeft size={14} />} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </Button>
        <span className="px-1">
          Page {page} of {pages}
        </span>
        <Button size="sm" variant="secondary" rightIcon={<ChevronRight size={14} />} disabled={page >= pages} onClick={() => onPageChange(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}

Pagination.propTypes = {
  /** Current page, starting at 1. */
  page: PropTypes.number.isRequired,
  /** Rows per page. */
  pageSize: PropTypes.number.isRequired,
  /** Total number of rows. */
  total: PropTypes.number.isRequired,
  /** Called with the new page number. */
  onPageChange: PropTypes.func.isRequired,
};
