import PropTypes from "prop-types";
import { cn } from "utils/cn";

/**
 * DataTable — the one table of the app. Describe the columns once and pass the
 * rows. Header is grey and small, rows have a hover state, and an optional
 * `onRowClick` makes the whole row a link to the detail page. Put it in a
 * `Card` with `padded={false}`.
 */
export function DataTable({ columns, rows, rowKey = "id", onRowClick, empty, className }) {
  if (rows.length === 0 && empty) return empty;
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" className={cn("px-5 py-3", c.align === "right" && "text-right", c.headerClassName)}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr
              key={row[rowKey]}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn("hover:bg-slate-50", onRowClick && "cursor-pointer")}
            >
              {columns.map((c) => (
                <td key={c.key} className={cn("px-5 py-3 text-slate-700", c.align === "right" && "text-right", c.className)}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

DataTable.propTypes = {
  /** Column list: `{ key, header, render?(row), align?: "left"|"right", className?, headerClassName? }`. Without `render` the cell shows `row[key]`. */
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      header: PropTypes.node,
      render: PropTypes.func,
      align: PropTypes.oneOf(["left", "right"]),
      className: PropTypes.string,
      headerClassName: PropTypes.string,
    }),
  ).isRequired,
  /** Array of row objects. */
  rows: PropTypes.array.isRequired,
  /** Field that is unique per row. Default `"id"`. */
  rowKey: PropTypes.string,
  /** Called with the row when it is clicked. Makes rows look clickable. */
  onRowClick: PropTypes.func,
  /** Element shown instead of the table when there are no rows, e.g. EmptyState. */
  empty: PropTypes.node,
  /** Extra classes, for layout only. */
  className: PropTypes.string,
};
