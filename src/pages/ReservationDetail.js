import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import { Mail, Pencil, Users, XCircle } from "lucide-react";
import { Alert } from "components/alert";
import { Avatar } from "components/avatar";
import { Badge } from "components/badge";
import { Button } from "components/button";
import { Card } from "components/card";
import { ConfirmDialog } from "components/confirm-dialog";
import { DataTable } from "components/data-table";
import { Drawer } from "components/drawer";
import { DropdownMenu } from "components/dropdown-menu";
import { EmptyState } from "components/empty-state";
import { Field } from "components/field";
import { PageHeader } from "components/page-header";
import { ProgressBar } from "components/progress-bar";
import { Skeleton } from "components/skeleton";
import { Stepper } from "components/stepper";
import { Tabs } from "components/tabs";
import { Textarea } from "components/textarea";
import { useToast } from "components/toast";
import { Tooltip } from "components/tooltip";
import { EQUIPMENT } from "data/mock";
import { findConflicts, STATUS_LABEL, STATUS_TONE, useReservations } from "data/reservations";

const STEPS = ["Requested", "Approved", "Picked up", "Returned"];
const CONDITION_TONE = { New: "success", Good: "success", Fair: "warning", Worn: "danger" };

const formatDate = (d) => dayjs(d).format("D MMM YYYY");

// Where the reservation is in its lifecycle: the index of the current step (4 = all done).
const currentStep = (r) => {
  if (r.status === "completed") return 4;
  if (r.status === "active" || r.status === "overdue") return 2;
  return r.activity.some((a) => a.text === "Approved") ? 1 : 0;
};

// Share of the reservation window that has passed, 0 to 100.
const elapsedPercent = (r) => {
  const start = dayjs(r.start).startOf("day");
  const end = dayjs(r.end).endOf("day");
  return ((dayjs().valueOf() - start.valueOf()) / (end.valueOf() - start.valueOf())) * 100;
};

const conditionOf = (item) => EQUIPMENT.find((e) => e.id === item.id)?.condition ?? "Good";

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <Skeleton className="h-8 w-72" />
      <Skeleton className="h-7 w-full" />
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    </div>
  );
}

export default function ReservationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { reservations, updateReservation, cancelReservation } = useReservations();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [editing, setEditing] = useState(false);
  const notesRef = useRef(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, [id]);

  const reservation = reservations.find((r) => r.id === id);
  const back = () => navigate("/reservations");

  if (loading) return <DetailSkeleton />;

  if (!reservation) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Reservation not found" />
        <EmptyState
          title="We could not find this reservation"
          description={`There is no reservation ${id}. It may have been removed.`}
          action={<Button kind="outlined" onClick={back}>Back to reservations</Button>}
        />
      </div>
    );
  }

  const r = reservation;
  const live = r.status === "upcoming" || r.status === "active" || r.status === "overdue";
  const cancellable = r.status === "upcoming" || r.status === "active";
  const conflicts = live ? findConflicts(r, reservations) : [];
  const days = dayjs(r.end).diff(dayjs(r.start), "day") + 1;
  const elapsed = r.status === "completed" ? 100 : r.status === "upcoming" ? 0 : elapsedPercent(r);

  const tabs = [
    { value: "overview", label: "Overview" },
    { value: "equipment", label: "Equipment", count: r.items.length },
    { value: "activity", label: "Activity", count: r.activity.length },
  ];

  // Textarea takes no `value` prop, so it stays uncontrolled: fill it when the drawer opens, read it on save.
  const openEditor = () => {
    setEditing(true);
    setTimeout(() => {
      if (notesRef.current) notesRef.current.value = r.notes;
    }, 0);
  };

  const saveNotes = () => {
    updateReservation(r.id, { notes: (notesRef.current?.value ?? r.notes).trim() });
    toast.success(`Notes saved for ${r.id}`);
    setEditing(false);
  };

  const confirmCancel = () => {
    cancelReservation(r.id);
    toast.success(`Reservation ${r.id} cancelled`);
    setConfirming(false);
  };

  const columns = [
    { key: "name", header: "Equipment", render: (i) => <span className="font-medium text-default">{i.name}</span> },
    { key: "category", header: "Category" },
    { key: "condition", header: "Condition", render: (i) => <Badge tone={CONDITION_TONE[conditionOf(i)]}>{conditionOf(i)}</Badge> },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`${r.id}, ${r.requester.name}`}
        description={`${r.items.length === 1 ? r.items[0].name : `${r.items.length} items`} from ${formatDate(r.start)} to ${formatDate(r.end)}`}
        actions={
          <>
            <Badge tone={STATUS_TONE[r.status]} dot>{STATUS_LABEL[r.status]}</Badge>
            <Button kind="outlined" prefixIcon={<Pencil />} onClick={openEditor}>Edit notes</Button>
            {cancellable && (
              <Tooltip content="More" side="top">
                <DropdownMenu
                  label="More"
                  items={[{ label: "Cancel reservation", icon: <XCircle size={14} />, danger: true, onClick: () => setConfirming(true) }]}
                />
              </Tooltip>
            )}
          </>
        }
      />

      {conflicts.length > 0 && (
        <Alert status="warning" kind="outlined" title="This equipment is booked twice">
          {conflicts.map((c) => `${c.id} (${c.requester.name}, ${formatDate(c.start)} to ${formatDate(c.end)})`).join("; ")} books the same equipment in an overlapping period.
        </Alert>
      )}

      <Card>
        <Stepper steps={STEPS} current={currentStep(r)} />
        {r.status === "cancelled" ? (
          <p className="mt-4 text-sm text-caption">This reservation was cancelled, so the lifecycle stopped early.</p>
        ) : (
          <ProgressBar
            className="mt-5"
            label={`Time elapsed in the reservation window (${days} ${days === 1 ? "day" : "days"})`}
            value={elapsed}
            tone={r.status === "overdue" ? "danger" : r.status === "completed" ? "success" : "primary"}
          />
        )}
      </Card>

      <Tabs tabs={tabs} value={tab} onChange={setTab} />

      {tab === "overview" && (
        <div className="grid grid-cols-3 gap-4">
          <Card title="Requester">
            <div className="flex items-center gap-3">
              <Avatar name={r.requester.name} size="lg" />
              <div className="min-w-0">
                <p className="font-medium text-default">{r.requester.name}</p>
                <Tooltip content={r.requester.email} side="top">
                  <p className="flex items-center gap-1.5 truncate text-sm text-caption"><Mail size={14} />{r.requester.email}</p>
                </Tooltip>
                <p className="flex items-center gap-1.5 text-sm text-caption"><Users size={14} />{r.requester.team}</p>
              </div>
            </div>
          </Card>
          <Card title="Period">
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between"><dt className="text-caption">Start</dt><dd className="text-default">{formatDate(r.start)}</dd></div>
              <div className="flex justify-between"><dt className="text-caption">End</dt><dd className="text-default">{formatDate(r.end)}</dd></div>
              <div className="flex justify-between"><dt className="text-caption">Duration</dt><dd className="text-default">{days} {days === 1 ? "day" : "days"}</dd></div>
              <div className="flex justify-between"><dt className="text-caption">Requested on</dt><dd className="text-default">{formatDate(r.createdAt)}</dd></div>
            </dl>
          </Card>
          <Card title="Notes">
            {r.notes ? <p className="text-sm text-default">{r.notes}</p> : <p className="text-sm text-caption">No notes yet.</p>}
          </Card>
        </div>
      )}

      {tab === "equipment" && (
        <Card padded={false} title="Equipment">
          <DataTable columns={columns} rows={r.items} empty={<EmptyState title="No equipment" description="This reservation has no items." />} />
        </Card>
      )}

      {tab === "activity" && (
        <div className="flex flex-col gap-3">
          {[...r.activity].reverse().map((a) => (
            <Card key={`${a.at}-${a.text}`}>
              <div className="flex items-center gap-3">
                <Avatar name={a.by} size="sm" />
                <div className="flex-1">
                  <p className="text-sm text-default">{a.text}</p>
                  <p className="text-xs text-caption">{a.by}</p>
                </div>
                <p className="text-xs text-caption">{dayjs(a.at).format("D MMM YYYY, HH:mm")}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Drawer
        open={editing}
        onClose={() => setEditing(false)}
        title="Edit notes"
        description={`Reservation ${r.id}`}
        footer={
          <>
            <Button kind="text" onClick={() => setEditing(false)}>Cancel</Button>
            <Button status="primary" onClick={saveNotes}>Save notes</Button>
          </>
        }
      >
        <Field label="Notes" hint="Visible to everyone who can see this reservation.">
          <Textarea ref={notesRef} rows={6} placeholder="Add a note" />
        </Field>
      </Drawer>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={confirmCancel}
        title="Cancel this reservation?"
        description={`${r.requester.name}'s reservation ${r.id} will be cancelled and the equipment released.`}
        confirmLabel="Cancel reservation"
        tone="danger"
      />
    </div>
  );
}
