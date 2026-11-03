import { useArgs } from "storybook/preview-api";
import { Eraser, Hourglass, PenLine } from "lucide-react";
import { ChoiceCards } from "proposed/choice-cards";

const options = [
  { value: "follow-figma", label: "Remove it, to match Figma", description: "The option disappears from the component. Screens that use it lose it.", icon: <Eraser size={52} strokeWidth={1.5} />, tone: "danger" },
  { value: "keep-deprecated", label: "Keep it, but mark it as old", description: "Screens that use it keep working. New screens do not get it by default.", icon: <Hourglass size={52} strokeWidth={1.5} />, tone: "warning" },
  { value: "keep", label: "Keep it, and add it to Figma", description: "Nothing changes in the code. The design adds it so both match.", icon: <PenLine size={52} strokeWidth={1.5} />, tone: "info" },
];

/** ChoiceCards — pick one option from a few cards that explain what happens. */
export default {
  title: "Forms/ChoiceCards",
  component: ChoiceCards,
  args: { options, value: "" },
  render: (args) => {
    const [, updateArgs] = useArgs();
    return <ChoiceCards {...args} onChange={(v) => updateArgs({ value: v })} />;
  },
  decorators: [(Story) => <div className="w-[900px]"><Story /></div>],
};

export const NothingChosen = {};

export const Chosen = { args: { value: "keep-deprecated" } };

export const Locked = { args: { value: "follow-figma", disabled: true } };
