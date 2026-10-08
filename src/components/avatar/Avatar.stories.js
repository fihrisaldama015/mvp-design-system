import { Avatar } from "components/avatar";

/** Avatar — initials of a person. */
export default {
  title: "Data/Avatar",
  component: Avatar,
  args: { name: "Maya Santoso", size: "md" },
  argTypes: { size: { control: "inline-radio", options: ["sm", "md", "lg"] } },
};

export const Default = {};

export const Small = { args: { size: "sm" } };

export const Large = { args: { size: "lg" } };
