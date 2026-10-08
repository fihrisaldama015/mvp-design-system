import { Info } from "lucide-react";
import { IconButton } from "components/icon-button";
import { Tooltip } from "components/tooltip";

/** Tooltip — explains an icon on hover or focus. */
export default {
  title: "Overlays/Tooltip",
  component: Tooltip,
  args: { content: "Last service: 12 Mar", side: "top" },
  argTypes: { side: { control: "inline-radio", options: ["top", "bottom"] } },
  decorators: [(Story) => <div className="py-10"><Story /></div>],
};

export const Default = { render: (args) => <Tooltip {...args}><IconButton icon={<Info size={16} />} label="Service info" /></Tooltip> };

export const Bottom = { args: { side: "bottom" }, render: (args) => <Tooltip {...args}><IconButton icon={<Info size={16} />} label="Service info" /></Tooltip> };
