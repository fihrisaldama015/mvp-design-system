import { useArgs } from "storybook/preview-api";
import { fn } from "storybook/test";
import { Toggle } from "components/toggle";

/** Toggle — on/off setting that applies at once. */
export default {
  title: "Forms/Toggle",
  component: Toggle,
  args: { checked: false, label: "Email me about overdue loans", onChange: fn() },
};

function ToggleStory(args) {
  const [, updateArgs] = useArgs();
  return <Toggle {...args} onChange={(checked) => updateArgs({ checked })} />;
}

export const Default = { render: ToggleStory };

export const On = { args: { checked: true }, render: ToggleStory };

export const Disabled = { args: { disabled: true } };
