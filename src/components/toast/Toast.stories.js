import { Button } from "components/button";
import { ToastProvider, useToast } from "components/toast";

function ToastButtons() {
  const toast = useToast();
  return (
    <div className="flex gap-2">
      <Button onClick={() => toast.success("Loan created")}>Success</Button>
      <Button variant="danger" onClick={() => toast.error("Could not save the loan")}>Error</Button>
      <Button variant="secondary" onClick={() => toast.info("Import started")}>Info</Button>
    </div>
  );
}

/**
 * Toast — a short message after an action ("Loan created"). Mount
 * `ToastProvider` once at the app root, then call `useToast()` where needed.
 * For a message that stays on the page, use Alert.
 */
export default {
  title: "Feedback/Toast",
  component: ToastProvider,
  decorators: [(Story) => <ToastProvider><Story /></ToastProvider>],
  parameters: { docs: { story: { inline: false, iframeHeight: 260 } } },
};

export const Default = { render: () => <ToastButtons /> };
