import { Button } from "components/button";
import { ToastProvider, useToast } from "components/toast";

/**
 * Toast — a short message after an action ("Loan created"). Mount
 * `ToastProvider` once at the app root, then call `const toast = useToast()`
 * and `toast.success("...")`, `toast.error("...")` or `toast.info("...")` where
 * the action happens. For a message that stays on the page, use Alert.
 */
export default {
  title: "Feedback/Toast",
  component: ToastProvider,
  decorators: [(Story) => <ToastProvider><Story /></ToastProvider>],
  parameters: { docs: { story: { inline: false, iframeHeight: 260 } } },
};

/** `useToast()` returns `success`, `error` and `info`; each takes the message text. */
export const Default = {
  render: function ToastExample() {
    const toast = useToast();
    return (
      <div className="flex gap-2">
        <Button onClick={() => toast.success("Loan created")}>Success</Button>
        <Button variant="danger" onClick={() => toast.error("Could not save the loan")}>Error</Button>
        <Button variant="secondary" onClick={() => toast.info("Import started")}>Info</Button>
      </div>
    );
  },
};
