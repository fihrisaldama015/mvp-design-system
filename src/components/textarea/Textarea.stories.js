import { Textarea } from "components/textarea";

/** Textarea — multi-line text. In forms put it inside a Field. */
export default {
  title: "Forms/Textarea",
  component: Textarea,
  args: { placeholder: "Anything we should know?" },
  decorators: [(Story) => <div className="w-80"><Story /></div>],
};

export const Default = {};

export const Error = { args: { error: true } };

export const Disabled = { args: { disabled: true, defaultValue: "Lens cap is missing." } };

export const Tall = { args: { rows: 8 } };
