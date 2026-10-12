import { fn } from "storybook/test";
import { Link } from "react-router-dom";
import { Plus, Download, Trash2, ArrowRight } from "lucide-react";
import { Button } from "components/button";

const KINDS = ["filled", "outlined", "dashed", "text"];
const STATUSES = ["default", "primary", "info", "success", "warning", "danger"];

/**
 * Button — SHIELD button. `kind` is the look, `status` the meaning. One filled
 * primary per view; `danger` for destructive actions; `text` for quiet ones such
 * as Cancel in a dialog.
 */
export default {
  title: "Actions/Button",
  component: Button,
  args: { children: "Button", kind: "filled", status: "primary", size: "md", onClick: fn() },
  argTypes: {
    kind: { control: "inline-radio", options: KINDS },
    status: { control: "select", options: STATUSES },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
};

export const Primary = {};

export const Default = { args: { status: "default" } };

export const Outlined = { args: { kind: "outlined", children: "Export" } };

export const Dashed = { args: { kind: "dashed", prefixIcon: <Plus />, children: "Add item" } };

export const Text = { args: { kind: "text", status: "default", children: "Cancel" } };

export const Danger = { args: { status: "danger", prefixIcon: <Trash2 />, children: "Delete" } };

/** Icons are lucide icons; the button sizes them (16px sm, 18px md / lg). */
export const WithIcons = { args: { prefixIcon: <Plus />, children: "Add equipment" } };

export const SuffixIcon = { args: { kind: "outlined", suffixIcon: <ArrowRight />, children: "Next" } };

/** The label keeps its width while the spinner shows. */
export const Loading = { args: { loading: true, children: "Saving" } };

export const Disabled = { args: { disabled: true } };

export const Small = { args: { size: "sm", kind: "outlined", prefixIcon: <Download />, children: "Export" } };

export const Large = { args: { size: "lg", children: "Create loan" } };

/** `as={Link}` renders a link that looks like a button. */
export const AsLink = { args: { as: Link, to: "/equipment", kind: "outlined", status: "default", children: "Open the list" } };

/** Every kind x status, as in the SHIELD Figma page (State and Disabled follow on hover / with `disabled`). */
export const AllKindsAndStatuses = {
  parameters: { layout: "padded" },
  render: () => (
    <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(6, max-content)" }}>
      {KINDS.map((kind) =>
        STATUSES.map((status) => (
          <Button key={`${kind}-${status}`} kind={kind} status={status} prefixIcon={<Plus />} suffixIcon={<ArrowRight />}>
            Button
          </Button>
        )),
      )}
      {KINDS.map((kind) => (
        <Button key={`${kind}-disabled`} kind={kind} status="primary" disabled>
          Disabled
        </Button>
      ))}
    </div>
  ),
};
