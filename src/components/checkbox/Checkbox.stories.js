import { Checkbox } from "components/checkbox";

/** Checkbox — independent yes/no choices and row selection. */
export default {
  title: "Forms/Checkbox",
  component: Checkbox,
  args: { label: "Needs a charger" },
};

export const Default = {};

export const WithDescription = { args: { description: "A charger is added to the loan automatically." } };

export const Checked = { args: { defaultChecked: true } };

export const Disabled = { args: { disabled: true } };
