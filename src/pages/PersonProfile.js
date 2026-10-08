import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import dayjs from "dayjs";
import { MoreVertical } from "lucide-react";
import { useStore } from "data/store";
import { PEOPLE, TODAY, loanStatus } from "data/mock";

// "in 3 days" / "2 days ago" relative to the demo date.
function rel(date) {
  const n = dayjs(date).diff(dayjs(TODAY), "day");
  if (n === 0) return "today";
  const abs = Math.abs(n);
  const unit = abs === 1 ? "day" : "days";
  return n > 0 ? `in ${abs} ${unit}` : `${abs} ${unit} ago`;
}

export default function PersonProfile() {
  const { id } = useParams();
  const { loans, equipment, extendLoan, undoExtend, returnLoan } = useStore();
  const person = PEOPLE.find((p) => p.id === id);

  const [loading, setLoading] = useState(true);
  const [menuFor, setMenuFor] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  if (loading) {
    return <div className="text-teal-700 text-sm animate-pulse">Loading profile...</div>;
  }

  if (!person) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center border-2 border-dashed border-teal-300 rounded-2xl p-10">
        <div className="text-teal-900 font-bold text-lg">We could not load this profile</div>
        <p className="text-gray-500 text-sm mt-1">The person does not exist or the link is wrong.</p>
        <button onClick={() => window.location.reload()} className="mt-5 px-5 py-2 rounded-full bg-teal-600 text-white text-sm">
          Retry
        </button>
      </div>
    );
  }

  const mine = loans.filter((l) => l.borrower === person.name);
  const open = mine.filter((l) => !l.returnedAt);
  const history = mine.filter((l) => l.returnedAt);
  const late = open.filter((l) => loanStatus(l) === "Overdue").length;
  const nameOf = (eid) => equipment.find((e) => e.id === eid)?.name ?? eid;
  const initials = person.name
    .split(" ")
    .map((w) => w[0])
    .join("");

  const flash = (value) => {
    setToast(value);
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="grid grid-cols-[300px_1fr] gap-8 max-w-5xl">
      <aside className="bg-white rounded-2xl p-6 h-fit shadow-sm border border-teal-100">
        <div className="w-24 h-24 rounded-full bg-teal-600 text-white text-3xl font-semibold flex items-center justify-center mx-auto">
          {initials}
        </div>
        <h1 className="text-center text-xl font-bold text-teal-900 mt-4">{person.name}</h1>
        <p className="text-center text-sm text-gray-500">
          {person.rank}, {person.unit}
        </p>
        <div className="mt-5 space-y-1 text-sm text-gray-600">
          <div>✉ {person.email}</div>
          <div>☎ {person.phone}</div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-6 text-center">
          {[
            ["Open", open.length],
            ["Total", mine.length],
            ["Late", late],
          ].map(([label, n]) => (
            <div key={label} className="bg-teal-50 rounded-lg py-2">
              <div className={`text-xl font-bold ${label === "Late" && n > 0 ? "text-red-600" : "text-teal-700"}`}>{n}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          ))}
        </div>
      </aside>

      <section>
        <h2 className="text-lg font-bold text-teal-900 mb-3">Open loans</h2>
        {open.length === 0 ? (
          <div className="border-2 border-dashed border-teal-200 rounded-xl p-8 text-center text-gray-400 text-sm">
            No open loans. {person.name.split(" ")[0]} has returned everything.
          </div>
        ) : (
          <ul className="bg-white rounded-xl border border-teal-100 divide-y divide-teal-50">
            {open.map((l) => {
              const isLate = loanStatus(l) === "Overdue";
              return (
                <li key={l.id} className="flex items-center justify-between px-5 py-4 relative">
                  <div>
                    <Link to={`/equipment/${l.equipmentId}`} className="font-medium text-gray-900 hover:text-teal-700">
                      {nameOf(l.equipmentId)}
                    </Link>
                    <div className={`text-sm ${isLate ? "text-red-600 font-medium" : "text-gray-500"}`}>
                      Due {rel(l.dueAt)}
                    </div>
                  </div>
                  <button onClick={() => setMenuFor(menuFor === l.id ? null : l.id)} className="p-2 rounded-full hover:bg-teal-50" aria-label="Actions">
                    <MoreVertical size={18} />
                  </button>
                  {menuFor === l.id && (
                    <>
                      <div className="fixed inset-0" onClick={() => setMenuFor(null)} />
                      <div className="absolute right-4 top-12 z-10 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 text-sm">
                        <Link to={`/loans/${l.id}`} className="block px-4 py-2 hover:bg-teal-50">
                          View loan
                        </Link>
                        <button
                          className="block w-full text-left px-4 py-2 hover:bg-teal-50"
                          onClick={() => {
                            extendLoan(l.id, 7);
                            setMenuFor(null);
                            flash({ text: "Loan extended by 7 days", undo: l.id });
                          }}
                        >
                          Extend 7 days
                        </button>
                        <button
                          className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                          onClick={() => {
                            returnLoan(l.id);
                            setMenuFor(null);
                            flash({ text: "Marked as returned" });
                          }}
                        >
                          Mark Returned
                        </button>
                      </div>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <h2 className="text-lg font-bold text-teal-900 mt-8 mb-3">History</h2>
        <ul className="bg-white rounded-xl border border-teal-100 divide-y divide-teal-50">
          {history.map((l) => (
            <li key={l.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <span className="text-gray-800">{nameOf(l.equipmentId)}</span>
              <span className="text-gray-500">Returned {rel(l.returnedAt)}</span>
            </li>
          ))}
          {history.length === 0 && <li className="px-5 py-4 text-sm text-gray-400">Nothing returned yet.</li>}
        </ul>
      </section>

      {toast && (
        <div className="fixed bottom-6 left-6 bg-black text-white rounded px-4 py-3 text-sm flex items-center gap-5 shadow-lg">
          {toast.text}
          {toast.undo && (
            <button
              className="font-bold underline"
              onClick={() => {
                undoExtend(toast.undo);
                setToast(null);
              }}
            >
              Undo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
