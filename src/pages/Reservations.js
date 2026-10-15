import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Badge } from "components/badge";
import { Button } from "components/button";
import { Card } from "components/card";
import { DataTable } from "components/data-table";
import { EmptyState } from "components/empty-state";
import { PageHeader } from "components/page-header";
import { Select } from "components/select";
import { RESERVATIONS, RESERVATION_STATUSES } from "data/reservations";

const TONE = { Confirmed: "success", Pending: "warning", Cancelled: "neutral" };

const STATUS_OPTIONS = RESERVATION_STATUSES.map((s) => ({ value: s, label: s }));

const columns = [
  { key: "equipment", header: "Equipment", className: "font-medium text-default" },
  { key: "reservedBy", header: "Reserved by" },
  { key: "unit", header: "Unit" },
  { key: "startsAt", header: "Starts" },
  { key: "endsAt", header: "Ends" },
  { key: "status", header: "Status", render: (r) => <Badge tone={TONE[r.status]}>{r.status}</Badge> },
];

export default function Reservations() {
  const [status, setStatus] = useState("");
  const rows = useMemo(() => RESERVATIONS.filter((r) => !status || r.status === status), [status]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reservations"
        description={`${RESERVATIONS.length} upcoming equipment reservations`}
        actions={<Button status="primary" prefixIcon={<Plus />}>New reservation</Button>}
      />
      <Card
        title="Upcoming reservations"
        padded={false}
        action={
          <Select
            className="w-48"
            size="sm"
            options={STATUS_OPTIONS}
            value={status}
            onChange={setStatus}
            placeholder="All statuses"
            clearable
          />
        }
      >
        <DataTable
          columns={columns}
          rows={rows}
          empty={<EmptyState title="No reservations" description="Try another status." />}
        />
      </Card>
    </div>
  );
}
