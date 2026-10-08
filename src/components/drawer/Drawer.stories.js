import { useArgs } from "storybook/preview-api";
import { fn } from "storybook/test";
import { Button } from "components/button";
import { Field, Input, Textarea } from "components/field";
import { Select } from "components/select";
import { Drawer } from "components/drawer";

/** Drawer — create or edit a record without leaving the list. */
export default {
  title: "Overlays/Drawer",
  component: Drawer,
  args: { open: true, title: "Add equipment", description: "Fill in the details below.", onClose: fn() },
  parameters: { layout: "fullscreen", docs: { story: { inline: false, iframeHeight: 520 } } },
};

function DrawerStory(args) {
  const [, updateArgs] = useArgs();
  const close = () => updateArgs({ open: false });
  return (
    <Drawer
      {...args}
      onClose={close}
      footer={
        <>
          <Button variant="ghost" onClick={close}>Cancel</Button>
          <Button onClick={close}>Save</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Name" required>{({ id }) => <Input id={id} />}</Field>
        <Field label="Category">
          {({ id }) => (
            <Select id={id} value="camera" options={[{ value: "camera", label: "Camera" }, { value: "laptop", label: "Laptop" }]} />
          )}
        </Field>
        <Field label="Notes">{({ id }) => <Textarea id={id} />}</Field>
      </div>
    </Drawer>
  );
}

export const Default = { render: DrawerStory };
