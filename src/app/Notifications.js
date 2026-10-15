import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { Bell } from "lucide-react";
import { useStore } from "data/store";
import { TODAY, loanStatus } from "data/mock";

const DOT = { red: "bg-red-500", amber: "bg-amber-400", cyan: "bg-cyan-500" };

export default function Notifications() {
  const { loans, tickets, equipment } = useStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("all");
  const [read, setRead] = useState(() => new Set());

  const items = useMemo(() => {
    const nameOf = (id) => equipment.find((e) => e.id === id)?.name ?? id;
    const list = [];
    loans
      .filter((l) => loanStatus(l) === "Overdue")
      .forEach((l) => {
        const days = dayjs(TODAY).diff(dayjs(l.dueAt), "day");
        list.push({ id: `late-${l.id}`, tone: "red", title: `${l.id} is ${days} days late`, text: `${nameOf(l.equipmentId)}, ${l.borrower}`, to: `/loans/${l.id}` });
      });
    loans
      .filter((l) => !l.returnedAt && dayjs(l.dueAt).diff(dayjs(TODAY), "day") >= 0 && dayjs(l.dueAt).diff(dayjs(TODAY), "day") <= 2)
      .forEach((l) =>
        list.push({ id: `soon-${l.id}`, tone: "amber", title: `${l.id} is due soon`, text: `Due ${l.dueAt}, ${l.borrower}`, to: `/loans/${l.id}` }),
      );
    tickets
      .filter((t) => t.status !== "Resolved" && (t.priority === "Urgent" || t.priority === "High"))
      .forEach((t) => list.push({ id: `ticket-${t.id}`, tone: "cyan", title: `${t.priority} ticket: ${t.title}`, text: `${t.id}, ${nameOf(t.equipmentId)}`, to: `/maintenance/${t.id}` }));
    return list;
  }, [loans, tickets, equipment]);

  const unread = items.filter((i) => !read.has(i.id));
  const shown = tab === "unread" ? unread : items;

  const openItem = (item) => {
    setRead(new Set([...read, item.id]));
    setOpen(false);
    navigate(item.to);
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative rounded-full p-2 text-gray-600 hover:bg-gray-100" aria-label="Notifications">
        <Bell size={20} />
        {unread.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-40 w-96 rounded-xl border border-gray-200 bg-white shadow-xl">
            <div className="flex items-center justify-between px-4 pb-1 pt-4">
              <h2 className="font-semibold text-gray-900">Notifications</h2>
              <button className="text-xs text-cyan-700 hover:underline" onClick={() => setRead(new Set(items.map((i) => i.id)))}>
                Mark all as read
              </button>
            </div>
            <div className="flex gap-4 border-b border-gray-100 px-4 text-sm">
              {[
                ["all", `All (${items.length})`],
                ["unread", `Unread (${unread.length})`],
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`-mb-px border-b-2 py-2 ${tab === key ? "border-cyan-600 text-cyan-700" : "border-transparent text-gray-500"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <ul className="max-h-96 overflow-auto">
              {shown.length === 0 && <li className="px-4 py-10 text-center text-sm text-gray-400">You are all caught up</li>}
              {shown.map((i) => (
                <li key={i.id}>
                  <button onClick={() => openItem(i)} className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-gray-50">
                    <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${read.has(i.id) ? "bg-gray-200" : DOT[i.tone]}`} />
                    <span>
                      <span className={`block text-sm ${read.has(i.id) ? "text-gray-500" : "font-medium text-gray-900"}`}>{i.title}</span>
                      <span className="block text-xs text-gray-500">{i.text}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
