import { useNavigate } from "react-router-dom";
import { Button } from "components/button";
import { EmptyState } from "components/empty-state";
import { PageHeader } from "components/page-header";

// Placeholder: replaced by the real detail page.
export default function ReservationDetail() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Reservation" />
      <EmptyState
        title="Reservation details are coming"
        description="This page will show the status, the equipment and the activity of one reservation."
        action={<Button kind="outlined" onClick={() => navigate("/reservations")}>Back to reservations</Button>}
      />
    </div>
  );
}
