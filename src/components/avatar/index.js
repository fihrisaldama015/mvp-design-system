import PropTypes from "prop-types";
import { cn } from "utils/cn";

const SIZES = { sm: "h-7 w-7 text-xs", md: "h-9 w-9 text-sm", lg: "h-12 w-12 text-base" };

/** Avatar — a round badge with the initials of a person (or a photo when `src` is given). */
export function Avatar({ name, src, size = "md", className }) {
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
  return src ? (
    <img src={src} alt={name} className={cn("rounded-full object-cover", SIZES[size], className)} />
  ) : (
    <span title={name} className={cn("inline-flex items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700", SIZES[size], className)}>
      {initials}
    </span>
  );
}

Avatar.propTypes = {
  /** Full name; the initials come from it. */
  name: PropTypes.string.isRequired,
  /** Photo URL. Without it the initials are shown. */
  src: PropTypes.string,
  /** Size: sm 28px, md 36px, lg 48px. */
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  /** Extra classes, for layout only. */
  className: PropTypes.string,
};
