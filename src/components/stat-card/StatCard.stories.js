import { Package, AlertTriangle } from "lucide-react";
import { StatCard } from "components/stat-card";

/** StatCard — one big number with a label, for the top of a dashboard. */
export default {
  title: "Data/StatCard",
  component: StatCard,
  args: { label: "Items on loan", value: 18, hint: "3 due this week", icon: <Package size={20} />, tone: "info" },
  argTypes: { tone: { control: "inline-radio", options: ["neutral", "info", "success", "warning", "danger"] } },
  decorators: [(Story) => <div className="w-72"><Story /></div>],
};

export const Default = {};

export const Danger = { args: { label: "Overdue", value: 3, hint: "Send a reminder", icon: <AlertTriangle size={20} />, tone: "danger" } };

export const WithoutIcon = { render: (args) => <StatCard label={args.label} value={args.value} /> };
