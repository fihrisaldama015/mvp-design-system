import { useArgs } from "storybook/preview-api";
import { fn } from "storybook/test";
import { AtSign, Plus, Search } from "lucide-react";
import { Field } from "components/field";
import { Input } from "components/input";

const STATUSES = ["default", "info", "success", "warning", "danger"];

/**
 * Input — SHIELD text field. With `label` and `caption` it is a full form field;
 * bare it fits a filter bar or a Field. `status="danger"` (or `error`) marks an
 * error, `clearable` adds a clear button once there is a value.
 */
export default {
  title: "Forms/Input",
  component: Input,
  args: { label: "Equipment name", placeholder: "e.g. Canon EOS R6", size: "md", status: "default", onChange: fn(), onClear: fn() },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    status: { control: "select", options: STATUSES },
  },
  // Single stories get a form-like width; the matrix stories set `parameters.wide`.
  decorators: [(Story, { parameters }) => (parameters.wide ? <Story /> : <div className="w-80"><Story /></div>)],
};

export const Default = {};

export const WithCaption = { args: { required: true, caption: "Shown in the list and on the loan form." } };

/** `info` puts an info icon after the label; its text shows in a tooltip. */
export const WithInfo = { args: { required: true, info: "The name printed on the asset label." } };

/** Without a label it is a bare control, e.g. in a filter bar. */
export const Bare = { args: { label: "", prefixIcon: <Search />, placeholder: "Search equipment..." } };

/** Controlled, with a clear button: it shows once there is a value. */
export const Clearable = {
  args: { value: "Canon EOS R6", clearable: true },
  render: function Render(args) {
    const [, updateArgs] = useArgs();
    return (
      <Input
        {...args}
        onChange={(e) => {
          args.onChange(e);
          updateArgs({ value: e.target.value });
        }}
      />
    );
  },
};

/** Icons are lucide icons; the input sizes them (22px). */
export const WithIcons = { args: { label: "Email", type: "email", prefixIcon: <AtSign />, placeholder: "name@example.com" } };

export const Danger = { args: { status: "danger", required: true, defaultValue: "EQ-", caption: "Asset tag must look like EQ-0042." } };

export const Success = { args: { status: "success", defaultValue: "EQ-0042", caption: "Tag is free." } };

export const Warning = { args: { status: "warning", defaultValue: "EQ-0042", caption: "This tag was used before." } };

export const Info = { args: { status: "info", caption: "Names are shown to every borrower." } };

export const Disabled = { args: { disabled: true, required: true, defaultValue: "EQ-0042", caption: "Set by the system." } };

export const ReadOnly = { args: { label: "Asset tag", readOnly: true, defaultValue: "EQ-0042" } };

export const Small = { args: { size: "sm", caption: "Small: 36px." } };

export const Large = { args: { size: "lg", caption: "Large: 44px." } };

export const NumberType = { args: { label: "Quantity", type: "number", placeholder: "0" } };

/** Inside a Field leave out `label` and `caption`: the Field has them and turns the input red on `error`. */
export const InsideField = {
  args: { label: "" },
  render: (args) => (
    <Field label="Equipment name" required error="Name is required">
      <Input {...args} />
    </Field>
  ),
};

/** Every status, empty and with a value, as in the SHIELD Figma page (hover and focus follow the pointer and the keyboard). */
export const AllStatuses = {
  parameters: { layout: "padded", wide: true },
  render: () => (
    <div className="grid gap-x-6 gap-y-4" style={{ gridTemplateColumns: "repeat(2, 24rem)" }}>
      {STATUSES.map((status) =>
        [undefined, "Value"].map((value) => (
          <Input
            key={`${status}-${value}`}
            status={status}
            label="Label"
            required
            info="Info"
            caption="There will be a caption text here"
            placeholder="Placeholder"
            prefixIcon={<Plus />}
            suffixIcon={<Plus />}
            clearable
            defaultValue={value}
          />
        )),
      )}
    </div>
  ),
};

/** Sizes, disabled and read-only. */
export const SizesAndStates = {
  parameters: { layout: "padded", wide: true },
  render: () => (
    <div className="grid gap-x-6 gap-y-4" style={{ gridTemplateColumns: "repeat(3, 24rem)" }}>
      {["sm", "md", "lg"].map((size) => (
        <Input key={size} size={size} label="Label" required info="Info" caption="There will be a caption text here" placeholder="Placeholder" prefixIcon={<Plus />} suffixIcon={<Plus />} />
      ))}
      <Input label="Label" required info="Info" caption="There will be a caption text here" placeholder="Placeholder" prefixIcon={<Plus />} suffixIcon={<Plus />} disabled />
      <Input label="Label" required info="Info" caption="There will be a caption text here" defaultValue="Value" prefixIcon={<Plus />} suffixIcon={<Plus />} readOnly />
    </div>
  ),
};
