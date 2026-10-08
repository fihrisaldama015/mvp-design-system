import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CornerDownLeft, Search } from "lucide-react";
import { useStore } from "data/store";
import { PEOPLE } from "data/mock";

const PAGES = [
  { label: "Dashboard", to: "/" },
  { label: "Equipment", to: "/equipment" },
  { label: "Loan log", to: "/loans" },
  { label: "New loan", to: "/loans/new" },
  { label: "Maintenance", to: "/maintenance" },
  { label: "Import equipment", to: "/import" },
  { label: "Reports", to: "/reports" },
  { label: "Settings", to: "/settings" },
];

export default function CommandPalette({ open, onClose }) {
  const { equipment, loans, tickets } = useStore();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (open) {
      setQuery("");
      setIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const has = (...parts) => parts.some((p) => String(p).toLowerCase().includes(q));
    const list = [];
    PAGES.filter((p) => !q || has(p.label)).forEach((p) => list.push({ group: "Pages", label: p.label, to: p.to }));
    if (q) {
      equipment
        .filter((e) => has(e.name, e.serial, e.id))
        .slice(0, 5)
        .forEach((e) => list.push({ group: "Equipment", label: e.name, hint: e.serial || e.id, to: `/equipment/${e.id}` }));
      PEOPLE.filter((p) => has(p.name, p.unit))
        .slice(0, 4)
        .forEach((p) => list.push({ group: "People", label: p.name, hint: p.unit, to: `/people/${p.id}` }));
      loans
        .filter((l) => has(l.id, l.borrower))
        .slice(0, 4)
        .forEach((l) => list.push({ group: "Loans", label: l.id, hint: l.borrower, to: `/loans/${l.id}` }));
      tickets
        .filter((t) => has(t.id, t.title))
        .slice(0, 3)
        .forEach((t) => list.push({ group: "Tickets", label: t.title, hint: t.id, to: `/maintenance/${t.id}` }));
    }
    return list;
  }, [query, equipment, loans, tickets]);

  if (!open) return null;

  const go = (item) => {
    onClose();
    navigate(item.to);
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndex((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" && results[index]) {
      go(results[index]);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  let lastGroup = "";

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-slate-900/50 pt-24" onClick={onClose}>
      <div className="w-[560px] overflow-hidden rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-slate-200 px-4">
          <Search size={18} className="text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIndex(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search equipment, people, loans, tickets, pages"
            className="h-14 flex-1 text-sm outline-none"
          />
          <kbd className="rounded border border-slate-300 px-1.5 text-xs text-slate-500">Esc</kbd>
        </div>
        <ul className="max-h-80 overflow-auto py-2">
          {results.length === 0 && <li className="px-4 py-8 text-center text-sm text-slate-400">No results for "{query}"</li>}
          {results.map((r, i) => {
            const header = r.group !== lastGroup;
            lastGroup = r.group;
            return (
              <li key={`${r.group}-${r.to}`}>
                {header && <div className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">{r.group}</div>}
                <button
                  onMouseEnter={() => setIndex(i)}
                  onClick={() => go(r)}
                  className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm ${i === index ? "bg-slate-100" : ""}`}
                >
                  <span className="text-slate-800">{r.label}</span>
                  <span className="flex items-center gap-2 text-xs text-slate-400">
                    {r.hint}
                    {i === index && <CornerDownLeft size={12} />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="flex gap-4 border-t border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-500">
          <span>↑↓ move</span>
          <span>↵ open</span>
          <span>Esc close</span>
        </div>
      </div>
    </div>
  );
}
