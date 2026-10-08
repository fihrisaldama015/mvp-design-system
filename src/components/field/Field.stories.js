import { Field, Input, Textarea, SearchInput } from "components/field";

/**
 * Field — label + control + hint/error. The control (Input, Select, Textarea)
 * is always inside a Field in forms. Standalone controls are for filter bars.
 */
export default {
  title: "Forms/Field",
  component: Field,
  args: { label: "Equipment name", required: true, hint: "Shown in the list and on the loan form." },
  decorators: [(Story) => <div className="w-80"><Story /></div>],
};

export const WithInput = {
  render: (args) => <Field {...args}>{({ id, invalid }) => <Input id={id} error={invalid} placeholder="e.g. Canon EOS R6" />}</Field>,
};

export const WithError = {
  args: { error: "Name is required", hint: undefined },
  render: (args) => <Field {...args}>{({ id, invalid }) => <Input id={id} error={invalid} />}</Field>,
};

export const WithTextarea = {
  args: { label: "Notes", required: false, hint: "Optional." },
  render: (args) => <Field {...args}>{({ id, invalid }) => <Textarea id={id} error={invalid} placeholder="Anything we should know?" />}</Field>,
};

export const Disabled = {
  args: { label: "Asset tag", hint: undefined, required: false },
  render: (args) => <Field {...args}>{({ id }) => <Input id={id} disabled defaultValue="EQ-0042" />}</Field>,
};

/** For filter bars above a list; no label. */
export const Search = {
  render: () => <SearchInput placeholder="Search equipment..." />,
};
