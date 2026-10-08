import { useArgs } from "storybook/preview-api";
import { fn } from "storybook/test";
import { ConfirmDialog } from "components/confirm-dialog";

/** ConfirmDialog — yes/no question before an action that cannot be undone. */
export default {
  title: "Overlays/ConfirmDialog",
  component: ConfirmDialog,
  args: {
    open: true,
    title: "Delete this item?",
    description: "Canon EOS R6 will be removed from the list. This cannot be undone.",
    confirmLabel: "Delete item",
    tone: "danger",
    onConfirm: fn(),
  },
  parameters: { layout: "fullscreen", docs: { story: { inline: false, iframeHeight: 320 } } },
  argTypes: { tone: { control: "inline-radio", options: ["default", "danger"] } },
};

function ConfirmStory(args) {
  const [, updateArgs] = useArgs();
  return <ConfirmDialog {...args} onClose={() => updateArgs({ open: false })} />;
}

export const Danger = { render: ConfirmStory };

export const Default = {
  args: { tone: "default", title: "Mark as returned?", description: "The item becomes available again.", confirmLabel: "Mark returned" },
  render: ConfirmStory,
};

export const Loading = { args: { loading: true }, render: ConfirmStory };
