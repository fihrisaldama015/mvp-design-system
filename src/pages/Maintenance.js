import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import { MoreHorizontal, Plus, SlidersHorizontal } from "lucide-react";
import { useStore } from "data/store";
import { PEOPLE, PRIORITIES, TICKET_STATUSES } from "data/mock";

const priorityBar = { Low: "border-l-gray-300", Medium: "border-l-yellow-400", High: "border-l-orange-500", Urgent: "border-l-rose-600" };
const priorityChip = {
  Low: "bg-gray-100 text-gray-600",
  Medium: "bg-yellow-100 text-yellow-800",
  High: "bg-orange-100 text-orange-800",
  Urgent: "bg-rose-100 text-rose-700",
};
const statusDot = { Open: "bg-rose-500", "In progress": "bg-sky-500", Resolved: "bg-green-500" };

export default function Maintenance() {
  const { tickets, equipment, addTicket, setTicketStatus } = useStore();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [statuses, setStatuses] = useState(new Set());
  const [priorities, setPriorities] = useState(new Set());
  const [popover, setPopover] = useState(false);
  const [menuFor, setMenuFor] = useState(null);
  const [sheet, setSheet] = useState(Boolean(params.get("item")));
  const [flash, setFlash] = useState("");
  const [form, setForm] = useState({ equipmentId: params.get("item") ?? "", title: "", priority: "Medium", reporter: "", description: "" });
  const [errors, setErrors] = useState({});

  const nameOf = (id) => equipment.find((e) => e.id === id)?.name ?? id;
  const toggle = (set, setSet, value) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setSet(next);
  };

  const rows = useMemo(
    () => tickets.filter((t) => (!statuses.size || statuses.has(t.status)) && (!priorities.size || priorities.has(t.priority))),
    [tickets, statuses, priorities],
  );
  const filterCount = statuses.size + priorities.size;

  const submit = () => {
    const next = {};
    if (!form.equipmentId) next.equipmentId = true;
    if (form.title.trim().length < 5) next.title = true;
    if (!form.reporter) next.reporter = true;
    setErrors(next);
    if (Object.keys(next).length) return;
    const id = addTicket(form);
    setSheet(false);
    setForm({ equipmentId: "", title: "", priority: "Medium", reporter: "", description: "" });
    setFlash(`Ticket ${id} was created`);
    setTimeout(() => setFlash(""), 4000);
  };

  const inputClass = (bad) => `w-full rounded-lg border px-3 py-2 text-sm ${bad ? "border-rose-500 bg-rose-50" : "border-gray-300"}`;

  return (
    <div className="max-w-5xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-rose-900">Maintenance</h1>
          <p className="text-sm text-gray-500">{tickets.filter((t) => t.status !== "Resolved").length} open tickets</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setPopover(!popover)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${filterCount ? "border-rose-500 bg-rose-50 text-rose-700" : "border-gray-300 bg-white text-gray-700"}`}
            >
              <SlidersHorizontal size={16} /> Filters{filterCount ? ` (${filterCount})` : ""}
            </button>
            {popover && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setPopover(false)} />
                <div className="absolute right-0 top-12 z-30 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-xl">
                  <div className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Status</div>
                  {TICKET_STATUSES.map((s) => (
                    <label key={s} className="flex items-center gap-2 py-1 text-sm">
                      <input type="checkbox" checked={statuses.has(s)} onChange={() => toggle(statuses, setStatuses, s)} className="accent-rose-600" />
                      {s}
                    </label>
                  ))}
                  <div className="mb-2 mt-4 text-xs font-bold uppercase tracking-wide text-gray-400">Priority</div>
                  <div className="flex flex-wrap gap-2">
                    {PRIORITIES.map((p) => (
                      <button
                        key={p}
                        onClick={() => toggle(priorities, setPriorities, p)}
                        className={`rounded-full border px-3 py-1 text-xs ${priorities.has(p) ? "border-rose-600 bg-rose-600 text-white" : "border-gray-300 text-gray-600"}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <button
                    className="mt-4 text-xs text-rose-600 underline"
                    onClick={() => {
                      setStatuses(new Set());
                      setPriorities(new Set());
                    }}
                  >
                    Clear all
                  </button>
                </div>
              </>
            )}
          </div>
          <button onClick={() => setSheet(true)} className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700">
            <Plus size={16} /> New ticket
          </button>
        </div>
      </div>

      {flash && <div className="mb-4 rounded-lg bg-rose-100 px-4 py-2 text-sm text-rose-800">{flash}</div>}

      <div className="grid grid-cols-[90px_1fr_190px_110px_120px_70px_40px] gap-4 px-4 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
        <span>Ticket</span>
        <span>Problem</span>
        <span>Item</span>
        <span>Priority</span>
        <span>Status</span>
        <span>Opened</span>
        <span />
      </div>
      <ul className="space-y-2">
        {rows.map((t) => (
          <li
            key={t.id}
            className={`relative grid grid-cols-[90px_1fr_190px_110px_120px_70px_40px] items-center gap-4 rounded-lg border border-l-4 border-gray-200 bg-white px-4 py-3 text-sm ${priorityBar[t.priority]}`}
          >
            <span className="font-mono text-xs text-gray-500">{t.id}</span>
            <Link to={`/maintenance/${t.id}`} className="font-medium text-gray-900 hover:text-rose-700">
              {t.title}
            </Link>
            <span className="truncate text-gray-600">{nameOf(t.equipmentId)}</span>
            <span className={`w-fit rounded-md px-2 py-0.5 text-xs font-medium ${priorityChip[t.priority]}`}>{t.priority}</span>
            <span className="flex items-center gap-2 text-gray-700">
              <span className={`h-2 w-2 rounded-full ${statusDot[t.status]}`} />
              {t.status}
            </span>
            <span className="text-gray-500">{dayjs(t.createdAt).format("DD MMM")}</span>
            <div className="relative">
              <button onClick={() => setMenuFor(menuFor === t.id ? null : t.id)} className="rounded p-1 hover:bg-gray-100" aria-label="Row actions">
                <MoreHorizontal size={18} />
              </button>
              {menuFor === t.id && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setMenuFor(null)} />
                  <ul className="absolute right-0 top-8 z-30 w-40 divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200 bg-white text-sm shadow-lg">
                    <li>
                      <button className="w-full px-3 py-2 text-left hover:bg-rose-50" onClick={() => navigate(`/maintenance/${t.id}`)}>
                        Open ticket
                      </button>
                    </li>
                    {t.status === "Open" && (
                      <li>
                        <button
                          className="w-full px-3 py-2 text-left hover:bg-rose-50"
                          onClick={() => {
                            setTicketStatus(t.id, "In progress");
                            setMenuFor(null);
                          }}
                        >
                          Start work
                        </button>
                      </li>
                    )}
                    {t.status !== "Resolved" && (
                      <li>
                        <button
                          className="w-full px-3 py-2 text-left text-green-700 hover:bg-green-50"
                          onClick={() => {
                            setTicketStatus(t.id, "Resolved");
                            setMenuFor(null);
                          }}
                        >
                          Resolve
                        </button>
                      </li>
                    )}
                  </ul>
                </>
              )}
            </div>
          </li>
        ))}
        {rows.length === 0 && <li className="rounded-lg border border-dashed border-gray-300 py-12 text-center text-sm text-gray-400">No tickets match the filters</li>}
      </ul>

      {sheet && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setSheet(false)} />
          <div className="fixed inset-x-0 bottom-0 z-50 mx-auto w-[640px] rounded-t-2xl bg-white p-6 shadow-2xl">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-300" />
            <h2 className="mb-4 text-lg font-bold text-rose-900">Report a problem</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500">ITEM</label>
                <select value={form.equipmentId} onChange={(e) => setForm({ ...form, equipmentId: e.target.value })} className={inputClass(errors.equipmentId)}>
                  <option value="">Choose an item</option>
                  {equipment.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.id} {e.name.slice(0, 32)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500">REPORTED BY</label>
                <select value={form.reporter} onChange={(e) => setForm({ ...form, reporter: e.target.value })} className={inputClass(errors.reporter)}>
                  <option value="">Choose a person</option>
                  {PEOPLE.map((p) => (
                    <option key={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-semibold text-gray-500">WHAT IS WRONG</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass(errors.title)} placeholder="A short title" />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-semibold text-gray-500">PRIORITY</label>
                <div className="flex gap-2">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm({ ...form, priority: p })}
                      className={`rounded-full border px-4 py-1.5 text-sm ${form.priority === p ? "border-rose-600 bg-rose-600 text-white" : "border-gray-300 text-gray-600"}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-semibold text-gray-500">DETAILS</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={inputClass(false)} />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setSheet(false)} className="rounded-lg px-4 py-2 text-sm text-gray-600">
                Cancel
              </button>
              <button onClick={submit} className="rounded-lg bg-rose-600 px-5 py-2 text-sm font-medium text-white">
                Create ticket
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
