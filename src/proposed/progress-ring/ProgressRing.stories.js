import { ProgressRing } from "proposed/progress-ring";

/** ProgressRing — circular progress with the count in the middle. Display only. */
export default {
  title: "Feedback/ProgressRing",
  component: ProgressRing,
  args: { value: 1, max: 3, label: "Decisions saved" },
};

export const Default = {};

export const NothingDone = { args: { value: 0, max: 1 } };

export const AllDone = { args: { value: 3, max: 3, tone: "success" } };

export const Small = { args: { value: 2, max: 5, size: 64, label: undefined } };
