import { fn } from "storybook/test";
import { Button } from "components/button";
import { Alert } from "components/alert";

/** Alert — inline message in the page. Short confirmations use Toast instead. */
export default {
  title: "Feedback/Alert",
  component: Alert,
  args: { status: "info", title: "Heads up", children: "Equipment must be returned by 5 PM on the due date." },
  decorators: [(Story) => <div className="w-[480px]"><Story /></div>],
  argTypes: { prefixIcon: { control: false }, action: { control: false }, onDismiss: { control: false } },
};

export const Default = { args: { status: "default", title: "Heads up" } };
export const Info = {};
export const Success = { args: { status: "success", title: "Loan created", children: "The borrower was notified." } };
export const Warning = { args: { status: "warning", title: "3 loans are overdue", children: "Send a reminder to the borrowers." } };
export const Danger = { args: { status: "danger", title: "Import failed", children: "Row 14 has no asset tag." } };

export const Outlined = { args: { kind: "outlined", status: "warning", title: "3 loans are overdue", children: "Send a reminder to the borrowers." } };
export const Dashed = { args: { kind: "dashed", status: "default" } };
export const FullPage = { args: { kind: "full page", status: "danger", title: "Import failed", children: "Row 14 has no asset tag." } };
export const Inverted = { args: { invert: true, status: "success", title: "Loan created", children: "The borrower was notified." } };

export const Small = { args: { size: "sm" } };
export const Large = { args: { size: "lg" } };
export const TitleOnly = { args: { children: undefined } };
export const NoIcon = { args: { prefixIcon: false } };
export const Dismissible = { args: { onDismiss: fn() } };

export const WithAction = {
  args: { status: "warning", title: "3 loans are overdue", children: undefined },
  render: (args) => <Alert {...args} action={<Button size="sm" kind="outlined">Review</Button>} />,
};

const TITLE = "This is a Plus UI alert message component";
const BODY = "Lorem ipsum dolor sit amet, his rebum salutatus id, purto vitae signi ferumque ea per. An quod erant sed. Viris aliquam impedit et est has veri deleniti sensibus id, summo paulo cetero no vel.";
const MATRIX = [
  ...["default", "info", "success", "warning", "danger"].map((status) => ({ kind: "filled", status })),
  ...["default", "info", "success", "warning", "danger"].map((status) => ({ kind: "outlined", status })),
  { kind: "dashed", status: "default" },
  ...["info", "success", "warning", "danger"].map((status) => ({ kind: "full page", status })),
];

/** Every kind and status at size md, with the Figma texts and a dismiss icon, for the Figma check. */
export const AllKinds = {
  parameters: { layout: "padded" },
  decorators: [],
  render: (args) => (
    <div className="flex w-[768px] flex-col gap-4">
      {MATRIX.map((m) => <Alert key={`${m.kind}-${m.status}`} {...args} {...m} title={TITLE} onDismiss={() => {}}>{BODY}</Alert>)}
    </div>
  ),
};
