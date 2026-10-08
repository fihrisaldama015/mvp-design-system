import { cn } from "utils/cn";

// Shared look of the text controls (Input, Textarea, SearchInput).
const CONTROL =
  "block w-full rounded-lg border bg-white text-sm text-slate-900 placeholder:text-slate-400 " +
  "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 " +
  "disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed";

export const controlClass = (error, extra) =>
  cn(CONTROL, error ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-slate-300", extra);
