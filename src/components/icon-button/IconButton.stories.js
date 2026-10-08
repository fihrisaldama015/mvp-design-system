import { fn } from "storybook/test";
import { MoreHorizontal, Pencil, Trash2, X } from "lucide-react";
import { IconButton } from "components/icon-button";

/**
 * IconButton — a button with only an icon. Always give it a `label`: it is the
 * accessible name and the tooltip.
 */
export default {
  title: "Actions/IconButton",
  component: IconButton,
  args: { icon: <Pencil size={16} />, label: "Edit", onClick: fn() },
  argTypes: {
    variant: { control: "inline-radio", options: ["ghost", "secondary", "danger"] },
    size: { control: "inline-radio", options: ["sm", "md"] },
  },
};

export const Default = {};

export const Secondary = { args: { variant: "secondary", icon: <MoreHorizontal size={16} />, label: "More" } };

export const Danger = { args: { variant: "danger", icon: <Trash2 size={16} />, label: "Delete" } };

export const Medium = { args: { size: "md", icon: <X size={18} />, label: "Close" } };

export const Disabled = { args: { disabled: true } };
