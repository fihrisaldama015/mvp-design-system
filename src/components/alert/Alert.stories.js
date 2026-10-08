import { Button } from "components/button";
import { Alert } from "components/alert";

/** Alert — inline message in the page. Short confirmations use Toast instead. */
export default {
  title: "Feedback/Alert",
  component: Alert,
  args: { tone: "info" },
  decorators: [(Story) => <div className="w-[480px]"><Story /></div>],
  argTypes: { tone: { control: "inline-radio", options: ["info", "success", "warning", "danger"] } },
};

export const Info = { args: { title: "Heads up", children: "Equipment must be returned by 5 PM on the due date." } };

export const Success = { args: { tone: "success", title: "Loan created", children: "The borrower was notified." } };

export const Warning = { args: { tone: "warning", title: "3 loans are overdue", children: "Send a reminder to the borrowers." } };

export const Danger = { args: { tone: "danger", title: "Import failed", children: "Row 14 has no asset tag." } };

export const WithAction = {
  args: { tone: "warning", title: "3 loans are overdue" },
  render: (args) => <Alert {...args} action={<Button size="sm" variant="secondary">Review</Button>} />,
};
