import { useArgs } from "storybook/preview-api";
import { fn } from "storybook/test";
import { Button } from "components/button";
import { Field, Input } from "components/field";
import { Modal } from "components/modal";

/** Modal — short task in a centred dialog. */
export default {
  title: "Overlays/Modal",
  component: Modal,
  args: { open: true, title: "Rename category", description: "The new name shows everywhere.", onClose: fn() },
  parameters: { layout: "fullscreen", docs: { story: { inline: false, iframeHeight: 420 } } },
};

function ModalStory(args) {
  const [, updateArgs] = useArgs();
  const close = () => updateArgs({ open: false });
  return (
    <Modal
      {...args}
      onClose={close}
      footer={
        <>
          <Button variant="ghost" onClick={close}>Cancel</Button>
          <Button onClick={close}>Save</Button>
        </>
      }
    >
      <Field label="Name" required>
        <Input defaultValue="Cameras" />
      </Field>
    </Modal>
  );
}

export const Default = { render: ModalStory };

export const Small = { args: { size: "sm" }, render: ModalStory };

export const Large = { args: { size: "lg" }, render: ModalStory };
