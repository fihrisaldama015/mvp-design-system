import { useArgs } from "storybook/preview-api";
import { Field } from "components/field";
import { MapPin, Plus } from "lucide-react";
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

/** `sm` 36px, `md` 40px (default), `lg` 44px. */
export const Sizes = {
  render: (args) => (
    <div className="flex w-80 flex-col gap-4">
      {["sm", "md", "lg"].map((size) => <Select key={size} {...args} size={size} placeholder={`Size ${size}`} />)}
    </div>
  ),
};

/** `default` and `danger` (the two statuses Figma has for Select); `danger` also reddens the caption. */
export const Statuses = {
  render: (args) => (
    <div className="flex w-80 flex-col gap-4">
      {["default", "danger"].map((status) => <Select key={status} {...args} status={status} placeholder={`Status ${status}`} />)}
    </div>
  ),
};

/** Grey background, the menu does not open. */
export const ReadOnly = { args: { readOnly: true, value: "laptop" }, render: SelectStory };

/** The clear (x) button shows while an option is chosen and calls `onChange("")`. */
export const Clearable = { args: { clearable: true, value: "laptop" }, render: SelectStory };

/** `prefixIcon` takes a lucide icon; the select sizes it. */
export const WithPrefixIcon = { args: { prefixIcon: <MapPin />, placeholder: "Choose a location" }, render: SelectStory };

/** The full SHIELD field: label, required mark, caption. */
export const Labelled = { args: { label: "Category", required: true, caption: "Pick the closest one." }, render: SelectStory };

/** Every look of the SHIELD Select side by side, as in Figma: status, size, disabled, read-only. Used to check it against the Figma export. */
export const Matrix = {
  render: (args) => {
    const common = { ...args, className: "w-72", label: "Label", required: true, caption: "There will be a caption text here", prefixIcon: <Plus />, placeholder: "Placeholder" };
    return (
      <div className="grid w-max grid-cols-3 gap-x-6 gap-y-8">
        <Select {...common} />
        <Select {...common} status="danger" />
        <Select {...common} size="sm" />
        <Select {...common} size="md" />
        <Select {...common} size="lg" />
        <Select {...common} disabled />
        <Select {...common} readOnly value="camera" />
      </div>
    );
  },
};

/**
 * Deprecated: the menu has a search box. The SHIELD design has no menu search, so it is off by default.
 * Existing callers can keep passing `searchable`; new code should not.
 */
export const SearchableDeprecated = { args: { searchable: true }, render: SelectStory };

export const Disabled = { args: { disabled: true, value: "camera" }, render: SelectStory };

/** The usual form: Field gives the label and the error text, and connects them to the Select. */
export const InField = {
  render: (args) => {
    const [, updateArgs] = useArgs();
    return (
      <Field label="Category" required hint="Pick the closest one.">
        <Select {...args} onChange={(value) => updateArgs({ value })} />
      </Field>
    );
  },
};
