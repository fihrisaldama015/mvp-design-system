import { useArgs } from "storybook/preview-api";
import { Field } from "components/field";
import { DatePicker } from "components/date-picker";

/**
 * DatePicker — pick one date from a calendar. The value is `YYYY-MM-DD`. In
 * forms put it inside a Field. Use `min` / `max` to block dates.
 */
export default {
  title: "Forms/DatePicker",
  component: DatePicker,
  args: { value: "", placeholder: "Select date" },
  decorators: [(Story) => <div className="h-[460px] w-72"><Story /></div>],
};

function DatePickerStory(args) {
  const [, updateArgs] = useArgs();
  return <DatePicker {...args} onChange={(value) => updateArgs({ value })} />;
}

export const Default = { render: DatePickerStory };

export const WithValue = { args: { value: "2026-10-12" }, render: DatePickerStory };

/** Only 5–25 Oct 2026 can be picked: the rest is greyed out. */
export const MinAndMax = { args: { value: "2026-10-12", min: "2026-10-05", max: "2026-10-25" }, render: DatePickerStory };

export const Error = { args: { error: true }, render: DatePickerStory };

export const Disabled = { args: { disabled: true, value: "2026-10-12" }, render: DatePickerStory };

/** The usual form: Field gives the label and the error text. */
export const InField = {
  render: (args) => {
    const [, updateArgs] = useArgs();
    return (
      <Field label="Due date" required hint="Equipment must be back by 5 PM.">
        <DatePicker {...args} onChange={(value) => updateArgs({ value })} />
      </Field>
    );
  },
};
