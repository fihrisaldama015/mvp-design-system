import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Joins class names and lets the last Tailwind class win (`cn("p-2", "p-4")` gives `p-4`). */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
