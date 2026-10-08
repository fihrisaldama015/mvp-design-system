import { useArgs } from "storybook/preview-api";
import { Field } from "components/field";
import { DateRangePicker } from "components/date-range-picker";

/**
 * DateRangePicker — pick a "from" and a "to" date. Click the first day, then
 * the last day. `onChange` fires once, when the range is complete. For one date
 * use DatePicker.
 */
export default {
  title: "Forms/DateRangePicker",
  component: DateRangePicker,
  args: { value: { start: "", end: "" }, placeholder: "Select dates" },
  parameters: { docs: { story: { inline: false, iframeHeight: 520 } } },
  decorators: [(Story) => <div className="h-[480px] w-80"><Story /></div>],
};

function RangeStory(args) {
  const [, updateArgs] = useArgs();
  return <DateRangePicker {...args} onChange={(value) => updateArgs({ value })} />;
}

export const Default = { render: RangeStory };

export const WithValue = { args: { value: { start: "2026-10-05", end: "2026-10-12" } }, render: RangeStory };

/** Only 1–25 Oct 2026 can be picked. The quick ranges that reach outside are disabled. */
export const MinAndMax = {
  args: { value: { start: "2026-10-05", end: "2026-10-12" }, min: "2026-10-01", max: "2026-10-25" },
  render: RangeStory,
};

export const WithoutPresets = { args: { presets: false }, render: RangeStory };

export const Error = { args: { error: true }, render: RangeStory };

export const Disabled = { args: { disabled: true, value: { start: "2026-10-05", end: "2026-10-12" } }, render: RangeStory };

/** The usual form: Field gives the label and the error text. */
export const InField = {
  render: (args) => {
    const [, updateArgs] = useArgs();
    return (
      <Field label="Report period" hint="Loans created in this period.">
        <DateRangePicker {...args} onChange={(value) => updateArgs({ value })} />
      </Field>
    );
  },
};
