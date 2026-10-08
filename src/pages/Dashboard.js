import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { useStore } from "data/store";
import { AlertTriangle } from "lucide-react";
import { CATEGORIES, loanStatus, personByName } from "data/mock";

export default function Dashboard() {
  const { equipment, loans } = useStore();

  const onLoan = equipment.filter((e) => e.status === "On loan").length;
  const maintenance = equipment.filter((e) => e.status === "Maintenance").length;
  const overdue = loans.filter((l) => loanStatus(l) === "Overdue").length;

  const stats = [
    { label: "Total items", value: equipment.length },
    { label: "Borrowed", value: onLoan },
    { label: "Late", value: overdue },
    { label: "In repair", value: maintenance },
  ];

  const perCategory = CATEGORIES.map((c) => ({
    name: c,
    count: equipment.filter((e) => e.category === c).length,
  }));
  const maxCount = Math.max(1, ...perCategory.map((c) => c.count));

  const recent = loans.slice(0, 6);
  const nameOf = (id) => equipment.find((e) => e.id === id)?.name ?? id;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Where our equipment is today</p>
        </div>
        <Link to="/loans/new" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-md font-medium">
          + New loan
        </Link>
      </div>

      {overdue > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-lg px-4 py-3 mb-6">
          <AlertTriangle size={18} />
          <span className="text-sm">
            {overdue} loans are late.{" "}
            <Link to="/loans?status=Overdue" className="font-semibold underline">
              Review them
            </Link>
          </span>
        </div>
      )}

      <div className="grid grid-cols-4 gap-6 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl shadow-lg p-6">
            <div className="text-sm text-gray-500">{s.label}</div>
            <div className="text-4xl font-bold text-blue-600 mt-2">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 col-span-1">
          <h2 className="text-lg font-bold text-gray-800 mb-5">Equipment by category</h2>
          <div className="space-y-4">
            {perCategory.map((c) => (
              <div key={c.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{c.name}</span>
                  <span className="font-semibold text-gray-800">{c.count}</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full">
                  <div className="h-3 bg-blue-500 rounded-full" style={{ width: `${(c.count / maxCount) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 col-span-2">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold text-gray-800">Recent loans</h2>
            <Link to="/loans" className="text-sm text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-xs uppercase text-gray-600">
              <tr>
                <th className="text-left px-3 py-2">Equipment</th>
                <th className="text-left px-3 py-2">Borrower</th>
                <th className="text-left px-3 py-2">Due</th>
                <th className="text-left px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {recent.map((l) => {
                const status = loanStatus(l);
                return (
                  <tr key={l.id}>
                    <td className="px-3 py-3 text-gray-800">{nameOf(l.equipmentId)}</td>
                    <td className="px-3 py-3 text-gray-600">
                      {personByName(l.borrower) ? (
                        <Link to={`/people/${personByName(l.borrower).id}`} className="hover:underline">
                          {l.borrower}
                        </Link>
                      ) : (
                        l.borrower
                      )}
                    </td>
                    <td className="px-3 py-3 text-gray-600">{dayjs(l.dueAt).format("D MMM")}</td>
                    <td className="px-3 py-3">
                      <span
                        title={`Due ${l.dueAt}`}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          status === "Overdue"
                            ? "bg-red-100 text-red-700"
                            : status === "Active"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
