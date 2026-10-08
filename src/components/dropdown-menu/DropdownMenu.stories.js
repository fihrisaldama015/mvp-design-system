import { fn } from "storybook/test";
import { Pencil, Copy, Trash2 } from "lucide-react";
import { DropdownMenu } from "components/dropdown-menu";

/** DropdownMenu — "⋯" row actions. The destructive action goes last. */
export default {
  title: "Overlays/DropdownMenu",
  component: DropdownMenu,
  args: {
    items: [
      { label: "Edit", icon: <Pencil size={14} />, onClick: fn() },
      { label: "Duplicate", icon: <Copy size={14} />, onClick: fn() },
      { label: "Delete", icon: <Trash2 size={14} />, danger: true, onClick: fn() },
    ],
  },
  argTypes: { align: { control: "inline-radio", options: ["left", "right"] } },
  decorators: [(Story) => <div className="flex h-48 w-64 justify-end"><Story /></div>],
};

export const Default = {};

export const AlignLeft = { args: { align: "left" }, decorators: [(Story) => <div className="flex h-48 w-64"><Story /></div>] };
