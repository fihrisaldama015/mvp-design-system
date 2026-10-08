import { SearchInput } from "components/search-input";

/** SearchInput — filter box above a list. */
export default {
  title: "Forms/SearchInput",
  component: SearchInput,
  args: { placeholder: "Search equipment..." },
  decorators: [(Story) => <div className="w-80"><Story /></div>],
};

export const Default = {};

export const WithValue = { args: { defaultValue: "canon" } };
