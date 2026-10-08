import { Skeleton } from "components/skeleton";

/** Skeleton — a grey pulsing block that holds the place of content while it loads. */
export default {
  title: "Feedback/Skeleton",
  component: Skeleton,
  args: { className: "h-4 w-64" },
};

export const Line = {};

/** A list placeholder: three rows. */
export const Rows = {
  render: () => (
    <div className="w-72 space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  ),
};

export const Avatar = { args: { className: "h-9 w-9 rounded-full" } };
