import { ProgressBar } from "components/progress-bar";

/** ProgressBar — how much of a whole is used. */
export default {
  title: "Feedback/ProgressBar",
  component: ProgressBar,
  args: { value: 60, label: "Maintenance budget" },
  decorators: [(Story) => <div className="w-72"><Story /></div>],
  argTypes: { tone: { control: "inline-radio", options: ["primary", "success", "warning", "danger"] } },
};

export const Default = {};

export const Success = { args: { value: 100, tone: "success", label: "Import complete" } };

export const Danger = { args: { value: 92, tone: "danger", label: "Storage used" } };

export const NoLabel = { args: { label: undefined } };
