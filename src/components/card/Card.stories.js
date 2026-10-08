import { Button } from "components/button";
import { Card } from "components/card";

/** Card — the container of every block on a page. */
export default {
  title: "Data/Card",
  component: Card,
  args: { children: <p className="text-sm text-slate-600">Card content goes here.</p> },
  decorators: [(Story) => <div className="w-[480px]"><Story /></div>],
};

export const Default = { args: { title: "Recent loans", description: "Last 7 days" } };

export const WithAction = {
  args: { title: "Recent loans", description: "Last 7 days", action: <Button size="sm" variant="secondary">View all</Button> },
};

export const NoHeader = { args: { children: <p className="text-sm text-slate-600">A plain block without a header.</p> } };

/** For tables: no padding, so the table touches the edges. */
export const Unpadded = {
  args: { title: "Equipment", padded: false, children: <div className="px-5 py-3 text-sm text-slate-600">Full-width content</div> },
};
