import { Spinner, Skeleton } from "components/spinner";

/** Spinner and Skeleton — the two loading states. */
export default {
  title: "Feedback/Spinner",
  component: Spinner,
};

export const Default = {};

export const Large = { args: { size: 32 } };

/** A list placeholder: three grey rows. */
export const SkeletonRows = {
  render: () => (
    <div className="w-72 space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  ),
};
