import { useArgs } from "storybook/preview-api";
import { Button } from "components/button";
import { Collapse } from "proposed/collapse";

/** Collapse — shows or hides content with a smooth height change. */
export default {
  title: "Navigation/Collapse",
  component: Collapse,
  args: { open: true },
  render: (args) => {
    const [, updateArgs] = useArgs();
    return (
      <div className="flex w-[480px] flex-col gap-3">
        <Button kind="outlined" onClick={() => updateArgs({ open: !args.open })}>{args.open ? "Hide" : "Show"}</Button>
        <Collapse {...args}>
          <p className="rounded-default border border-default p-4">The content slides open and closed instead of jumping.</p>
        </Collapse>
      </div>
    );
  },
};

export const Open = {};

export const Closed = { args: { open: false } };
