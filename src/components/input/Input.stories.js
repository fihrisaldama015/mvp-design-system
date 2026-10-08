import { Input } from "components/input";

/** Input — single-line text. In forms put it inside a Field. */
export default {
  title: "Forms/Input",
  component: Input,
  args: { placeholder: "e.g. Canon EOS R6" },
  decorators: [(Story) => <div className="w-80"><Story /></div>],
};

export const Default = {};

export const WithValue = { args: { defaultValue: "Canon EOS R6" } };

export const Error = { args: { error: true, defaultValue: "" } };

export const Disabled = { args: { disabled: true, defaultValue: "EQ-0042" } };

export const NumberType = { args: { type: "number", placeholder: "0" } };

export const DateType = { args: { type: "date" } };
