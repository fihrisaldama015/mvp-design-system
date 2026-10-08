import { SearchX } from "lucide-react";
import { Button } from "components/button";
import { EmptyState } from "components/empty-state";

/** EmptyState — shown when a list or table has no rows. */
export default {
  title: "Feedback/EmptyState",
  component: EmptyState,
  args: { title: "No loans yet", description: "Create the first loan to see it here." },
  decorators: [(Story) => <div className="w-[480px] rounded-xl border border-slate-200 bg-white"><Story /></div>],
};

export const Default = {};

export const WithAction = { render: (args) => <EmptyState {...args} action={<Button>New loan</Button>} /> };

/** When a search or filter has no result. */
export const NoResults = { args: { icon: <SearchX size={22} />, title: "No results", description: "Try a different search or clear the filters." } };
