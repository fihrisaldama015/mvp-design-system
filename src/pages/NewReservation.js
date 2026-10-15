import { useNavigate } from "react-router-dom";
import { Button } from "components/button";
import { EmptyState } from "components/empty-state";
import { PageHeader } from "components/page-header";

// Placeholder: replaced by the real form.
export default function NewReservation() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="New reservation" />
      <EmptyState
        title="The reservation form is coming"
        description="You will be able to book equipment for a period here."
        action={<Button kind="outlined" onClick={() => navigate("/reservations")}>Back to reservations</Button>}
      />
    </div>
  );
}
