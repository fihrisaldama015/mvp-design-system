import { useArgs } from "storybook/preview-api";
import { Field } from "components/field";
import { Select } from "components/select";

const categories = [
  { value: "camera", label: "Camera" },
  { value: "laptop", label: "Laptop" },
  { value: "audio", label: "Audio" },
  { value: "lighting", label: "Lighting" },
  { value: "tripod", label: "Tripod", disabled: true },
];

/**
 * Select — pick one value from a list. Always inside a Field in forms. The menu
 * is drawn by the component (not the browser), so it looks the same everywhere.
 */
export default {
  title: "Forms/Select",
  component: Select,
  args: { options: categories, value: "", placeholder: "Choose a category" },
  decorators: [(Story) => <div className="h-72 w-80"><Story /></div>],
};

function SelectStory(args) {
  const [, updateArgs] = useArgs();
  return <Select {...args} onChange={(value) => updateArgs({ value })} />;
}

export const Default = { render: SelectStory };

export const WithValue = { args: { value: "laptop" }, render: SelectStory };

export const Error = { args: { error: true }, render: SelectStory };

export const Disabled = { args: { disabled: true, value: "camera" }, render: SelectStory };

/** The usual form: Field gives the label and the error text. */
export const InField = {
  render: (args) => {
    const [, updateArgs] = useArgs();
    return (
      <Field label="Category" required hint="Pick the closest one.">
        {({ id, invalid }) => <Select {...args} id={id} error={invalid} onChange={(value) => updateArgs({ value })} />}
      </Field>
    );
  },
};
