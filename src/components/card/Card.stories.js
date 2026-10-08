import { Package } from "lucide-react";
import { Button } from "components/button";
import { Card, StatCard } from "components/card";

/** Card — the container of every block on a page. */
export default {
  title: "Data/Card",
  component: Card,
  args: { title: "Recent loans", description: "Last 7 days" },
  decorators: [(Story) => <div className="w-[480px]"><Story /></div>],
};

export const Default = {
  render: (args) => (
    <Card {...args}>
      <p className="text-sm text-slate-600">Card content goes here.</p>
    </Card>
  ),
};

export const WithAction = {
  render: (args) => (
    <Card {...args} action={<Button size="sm" variant="secondary">View all</Button>}>
      <p className="text-sm text-slate-600">Card content goes here.</p>
    </Card>
  ),
};

export const NoHeader = {
  args: { title: undefined, description: undefined },
  render: (args) => (
    <Card {...args}>
      <p className="text-sm text-slate-600">A plain block without a header.</p>
    </Card>
  ),
};

/** For tables: no padding, so the table touches the edges. */
export const Unpadded = {
  args: { padded: false },
  render: (args) => (
    <Card {...args}>
      <div className="px-5 py-3 text-sm text-slate-600">Full-width content</div>
    </Card>
  ),
};

export const Stat = {
  render: () => <StatCard label="Items on loan" value={18} hint="3 due this week" icon={<Package size={20} />} tone="info" />,
};
