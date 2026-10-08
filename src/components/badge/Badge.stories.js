import { Badge } from "components/badge";

/**
 * Badge — status pill. Choose the tone by meaning, not by taste: success =
 * available, info = on loan, warning = due soon, danger = overdue.
 */
export default {
  title: "Data/Badge",
  component: Badge,
  args: { children: "Available", tone: "success", dot: true },
  argTypes: { tone: { control: "inline-radio", options: ["neutral", "info", "success", "warning", "danger"] } },
};

export const Success = {};

export const Info = { args: { tone: "info", children: "On loan" } };

export const Warning = { args: { tone: "warning", children: "Due soon" } };

export const Danger = { args: { tone: "danger", children: "Overdue" } };

export const Neutral = { args: { tone: "neutral", children: "Retired" } };

export const WithoutDot = { args: { dot: false } };
