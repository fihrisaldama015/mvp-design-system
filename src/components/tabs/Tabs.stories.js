import { useArgs } from "storybook/preview-api";
import { Tabs } from "components/tabs";

/** Tabs — sections of one record or one list (underline style). */
export default {
  title: "Navigation/Tabs",
  component: Tabs,
  args: {
    value: "all",
    tabs: [
      { value: "all", label: "All", count: 60 },
      { value: "available", label: "Available", count: 42 },
      { value: "loan", label: "On loan", count: 18 },
    ],
  },
  decorators: [(Story) => <div className="w-[480px]"><Story /></div>],
};

function TabsStory(args) {
  const [, updateArgs] = useArgs();
  return <Tabs {...args} onChange={(value) => updateArgs({ value })} />;
}

export const Default = { render: TabsStory };

export const WithoutCounts = {
  args: { value: "details", tabs: [{ value: "details", label: "Details" }, { value: "history", label: "History" }, { value: "files", label: "Files" }] },
  render: TabsStory,
};
