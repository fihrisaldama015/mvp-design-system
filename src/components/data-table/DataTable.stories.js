import { fn } from "storybook/test";
import { Badge } from "components/badge";
import { Card } from "components/card";
import { EmptyState } from "components/empty-state";
import { DataTable } from "components/data-table";

const rows = [
  { id: 1, name: "Canon EOS R6", tag: "EQ-0001", status: "Available" },
  { id: 2, name: "MacBook Pro 14", tag: "EQ-0002", status: "On loan" },
  { id: 3, name: "Shure SM7B", tag: "EQ-0003", status: "Overdue" },
];

const TONE = { Available: "success", "On loan": "info", Overdue: "danger" };

const columns = [
  { key: "name", header: "Name", className: "font-medium text-slate-900" },
  { key: "tag", header: "Asset tag" },
  { key: "status", header: "Status", render: (r) => <Badge tone={TONE[r.status]}>{r.status}</Badge> },
];

/** DataTable — the one table. Put it in a Card with `padded={false}`. */
export default {
  title: "Data/DataTable",
  component: DataTable,
  args: { columns, rows, onRowClick: undefined },
  parameters: { layout: "padded" },
  decorators: [(Story) => <Card padded={false}><Story /></Card>],
};

export const Default = {};

export const ClickableRows = { args: { onRowClick: fn() } };

export const Empty = { args: { rows: [], empty: <EmptyState title="No equipment" description="Add the first item." /> } };
