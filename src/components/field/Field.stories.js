import { Field, Input, Textarea, SearchInput } from "components/field";

/**
 * Field — label + control + hint/error. Put one control (Input, Textarea,
 * Select) inside it; the label and the red error state connect by themselves.
 * Standalone controls are for filter bars.
 */
export default {
  title: "Forms/Field",
  component: Field,
  args: { label: "Equipment name", children: <Input /> },
  decorators: [(Story) => <div className="w-80"><Story /></div>],
};

export const WithInput = {
  args: { required: true, hint: "Shown in the list and on the loan form.", children: <Input placeholder="e.g. Canon EOS R6" /> },
};

export const WithError = { args: { required: true, error: "Name is required" } };

export const WithTextarea = {
  args: { label: "Notes", hint: "Optional.", children: <Textarea placeholder="Anything we should know?" /> },
};

export const Disabled = { args: { label: "Asset tag", children: <Input disabled defaultValue="EQ-0042" /> } };

/** For filter bars above a list; no label. */
export const Search = { render: () => <SearchInput placeholder="Search equipment..." /> };
