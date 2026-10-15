import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { CalendarCheck, CalendarClock, CircleAlert, Eye, PackageCheck, Plus, XCircle } from "lucide-react";
import { Avatar } from "components/avatar";
import { Badge } from "components/badge";
import { Button } from "components/button";
import { Card } from "components/card";
import { ConfirmDialog } from "components/confirm-dialog";
import { DataTable } from "components/data-table";
import { DropdownMenu } from "components/dropdown-menu";
import { EmptyState } from "components/empty-state";
import { PageHeader } from "components/page-header";
import { Pagination } from "components/pagination";
import { SearchInput } from "components/search-input";
import { Select } from "components/select";
import { Skeleton } from "components/skeleton";
import { StatCard } from "components/stat-card";
import { Tabs } from "components/tabs";
import { useToast } from "components/toast";
import { Tooltip } from "components/tooltip";
import { STATUS_LABEL, STATUS_TONE, TEAMS, useReservations } from "data/reservations";

const PAGE_SIZE = 6;
const TEAM_OPTIONS = TEAMS.map((t) => ({ value: t, label: t }));

const period = (r) => {
  const start = dayjs(r.start);
  const end = dayjs(r.end);
  return `${start.format("D MMM")} to ${end.format("D MMM YYYY")}`;
};

const equipmentText = (r) => (r.items.length === 1 ? r.items[0].name : `${r.items[0].name} and ${r.items.length - 1} more`);

export default function Reservations() {
  const navigate = useNavigate();
  const toast = useToast();
  const { reservations, cancelReservation } = useReservations();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [team, setTeam] = useState("");
  const [page, setPage] = useState(1);
  const [toCancel, setToCancel] = useState(null);
  const [searchKey, setSearchKey] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const count = (status) => reservations.filter((r) => r.status === status).length;

  const tabs = [
    { value: "all", label: "All", count: reservations.length },
    { value: "upcoming", label: "Upcoming", count: count("upcoming") },
    { value: "active", label: "Active", count: count("active") },
    { value: "overdue", label: "Overdue", count: count("overdue") },
    { value: "completed", label: "Completed", count: count("completed") },
  ];

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reservations.filter(
      (r) =>
        (tab === "all" || r.status === tab) &&
        (!team || r.requester.team === team) &&
        (!q || r.requester.name.toLowerCase().includes(q) || r.items.some((i) => i.name.toLowerCase().includes(q))),
    );
  }, [reservations, tab, query, team]);

  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const filtered = tab !== "all" || query !== "" || team !== "";

  const reset = () => {
    setTab("all");
    setQuery("");
    setSearchKey((k) => k + 1);
    setTeam("");
    setPage(1);
  };

  const confirmCancel = () => {
    cancelReservation(toCancel.id);
    toast.success(`Reservation ${toCancel.id} cancelled`);
    setToCancel(null);
  };

  const columns = [
    {
      key: "requester",
      header: "Requester",
      render: (r) => (
        <div className="flex items-center gap-3">
          <Avatar name={r.requester.name} size="sm" />
          <div>
            <p className="font-medium text-default">{r.requester.name}</p>
            <p className="text-xs text-caption">{r.requester.team}</p>
          </div>
        </div>
      ),
    },
    { key: "equipment", header: "Equipment", render: (r) => equipmentText(r) },
    { key: "period", header: "Period", render: (r) => period(r) },
    { key: "status", header: "Status", render: (r) => <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge> },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => (
        // The cell sits inside a clickable row: stop the click so the menu does not open the detail page.
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <Tooltip content="Actions">
            <DropdownMenu
              label={`Actions for ${r.id}`}
              items={[
                { label: "View details", icon: <Eye size={14} />, onClick: () => navigate(`/reservations/${r.id}`) },
                ...(r.status === "upcoming" || r.status === "active"
                  ? [{ label: "Cancel", icon: <XCircle size={14} />, danger: true, onClick: () => setToCancel(r) }]
                  : []),
              ]}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reservations"
        description="Equipment booked ahead of time, and what is out right now."
        actions={
          <Button status="primary" prefixIcon={<Plus />} onClick={() => navigate("/reservations/new")}>
            New reservation
          </Button>
        }
      />

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Upcoming" value={count("upcoming")} icon={<CalendarClock size={20} />} tone="info" />
        <StatCard label="Active" value={count("active")} icon={<PackageCheck size={20} />} tone="success" />
        <StatCard label="Overdue" value={count("overdue")} icon={<CircleAlert size={20} />} tone="danger" hint="Past the end date, not returned" />
        <StatCard label="Completed" value={count("completed")} icon={<CalendarCheck size={20} />} tone="neutral" />
      </div>

      <Card
        padded={false}
        title="All reservations"
        action={
          <div className="flex items-center gap-3">
            <SearchInput
              key={searchKey}
              className="w-80"
              placeholder="Search requester or equipment"
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
            <Select
              className="w-40"
              placeholder="All teams"
              options={TEAM_OPTIONS}
              value={team}
              onChange={(v) => {
                setTeam(v);
                setPage(1);
              }}
              clearable
            />
          </div>
        }
      >
        <div className="px-5 pt-3">
          <Tabs
            tabs={tabs}
            value={tab}
            onChange={(v) => {
              setTab(v);
              setPage(1);
            }}
          />
        </div>
        {loading ? (
          <div className="flex flex-col gap-4 p-5" aria-busy="true">
            {Array.from({ length: PAGE_SIZE }, (_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={pageRows}
              onRowClick={(r) => navigate(`/reservations/${r.id}`)}
              empty={
                <EmptyState
                  title="No reservations match"
                  description="Try another status, team or search."
                  action={filtered ? <Button kind="outlined" onClick={reset}>Clear filters</Button> : undefined}
                />
              }
            />
            {rows.length > 0 && <Pagination page={page} pageSize={PAGE_SIZE} total={rows.length} onPageChange={setPage} />}
          </>
        )}
      </Card>

      <ConfirmDialog
        open={toCancel !== null}
        onClose={() => setToCancel(null)}
        onConfirm={confirmCancel}
        title="Cancel this reservation?"
        description={toCancel ? `${toCancel.requester.name}'s reservation ${toCancel.id} will be cancelled and the equipment released.` : ""}
        confirmLabel="Cancel reservation"
        tone="danger"
      />
    </div>
  );
}
