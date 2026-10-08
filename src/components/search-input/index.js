import { forwardRef } from "react";
import PropTypes from "prop-types";
import { Search } from "lucide-react";
import { controlClass } from "components/field/controlClass";
import { cn } from "utils/cn";

/** SearchInput — an Input with a search icon on the left, for filtering a list. No label; it sits in a filter bar above a table. */
export const SearchInput = forwardRef(function SearchInput({ className, ...props }, ref) {
  return (
    <div className={cn("relative", className)}>
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
      <input ref={ref} type="search" className={controlClass(false, "h-10 pl-9 pr-3")} {...props} />
    </div>
  );
});

SearchInput.propTypes = {
  /** Placeholder text, e.g. "Search equipment...". */
  placeholder: PropTypes.string,
  /** Extra classes on the wrapper, for layout only (width). */
  className: PropTypes.string,
};
