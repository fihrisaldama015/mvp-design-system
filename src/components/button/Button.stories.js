import { fn } from "storybook/test";
import { Link } from "react-router-dom";
import { Plus, Trash2, Download } from "lucide-react";
import { Button } from "components/button";

/**
 * Button — the one button of the app. One `primary` per view, `secondary` for
 * the other actions, `danger` for destructive ones, `ghost` for quiet ones.
 */
export default {
  title: "Actions/Button",
  component: Button,
  args: { children: "Save changes", variant: "primary", size: "md", onClick: fn() },
  argTypes: {
    variant: { control: "inline-radio", options: ["primary", "secondary", "danger", "ghost"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
};

export const Primary = {};

export const Secondary = { args: { variant: "secondary", children: "Export" } };

export const Danger = { args: { variant: "danger", children: "Delete item" } };

export const Ghost = { args: { variant: "ghost", children: "Cancel" } };

/** Icons are lucide icons at size 16, before or after the label. */
export const WithIcon = { args: { leftIcon: <Plus size={16} />, children: "Add equipment" } };

export const IconAfter = { args: { variant: "secondary", rightIcon: <Download size={16} />, children: "Export CSV" } };

/** While saving: the spinner replaces the left icon and clicks are blocked. */
export const Loading = { args: { loading: true, children: "Saving" } };

export const Disabled = { args: { disabled: true } };

export const Small = { args: { size: "sm", variant: "secondary", leftIcon: <Trash2 size={14} />, children: "Remove" } };

export const Large = { args: { size: "lg", children: "Create loan" } };

/** `as={Link}` renders a link that looks like a button. */
export const AsLink = {
  args: { as: Link, to: "/equipment", variant: "secondary", children: "Open the list" },
};
