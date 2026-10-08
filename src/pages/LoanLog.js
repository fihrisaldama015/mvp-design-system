import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { Download } from "lucide-react";
import { useStore } from "data/store";
import { loanStatus } from "data/mock";

const PER_PAGE = 8;

const dot = {
  Active: "text-amber-600",
  Overdue: "text-red-600",
  Returned: "text-green-600",
};

export default function LoanLog() {
  const { equipment, loans, returnLoan } = useStore();
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const nameOf = (id) => equipment.find((e) => e.id === id)?.name ?? id;

  const rows = useMemo(
    () =>
      loans.filter(
        (l) =>
          (!status || loanStatus(l) === status) &&
          (!from || l.loanedAt >= from) &&
          (!to || l.loanedAt <= to),
      ),
    [loans, status, from, to],
  );

  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const visible = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const exportCsv = () => {
    const header = "Loan,Equipment,Borrower,Unit,Loaned,Due,Returned,Status";
    const lines = rows.map((l) =>
      [l.id, nameOf(l.equipmentId), l.borrower, l.unit, l.loanedAt, l.dueAt, l.returnedAt ?? "", loanStatus(l)].join(","),
    );
    const url = URL.createObjectURL(new Blob([[header, ...lines].join("\n")], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "loan-log.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-2xl font-semibold text-neutral-800">Loan log</h1>
        <button onClick={exportCsv} className="flex items-center gap-2 border border-gray-400 rounded px-3 py-1.5 text-sm text-gray-700">
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div className="flex items-end gap-4 mb-4 text-sm">
        <div>
          <div className="text-gray-600 mb-1">Status</div>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="border border-gray-400 rounded px-2 py-1.5 bg-white"
          >
            <option value="">All</option>
            <option>Active</option>
            <option>Overdue</option>
            <option>Returned</option>
          </select>
        </div>
        <div>
          <div className="text-gray-600 mb-1">Loaned from</div>
          <input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
            className="border border-gray-400 rounded px-2 py-1"
          />
        </div>
        <div>
          <div className="text-gray-600 mb-1">to</div>
          <input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
            className="border border-gray-400 rounded px-2 py-1"
          />
        </div>
        <div className="ml-auto text-gray-500">{rows.length} loans</div>
      </div>

      <table className="w-full border-collapse border border-gray-300 bg-white text-sm">
        <thead>
          <tr className="bg-gray-200 text-left">
            {["Loan", "Equipment", "Borrower", "Unit", "Loaned", "Due", "Status", ""].map((h) => (
              <th key={h} className="border border-gray-300 px-3 py-2 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map((l) => {
            const s = loanStatus(l);
            return (
              <tr key={l.id}>
                <td className="border border-gray-300 px-3 py-2">{l.id}</td>
                <td className="border border-gray-300 px-3 py-2">{nameOf(l.equipmentId)}</td>
                <td className="border border-gray-300 px-3 py-2">{l.borrower}</td>
                <td className="border border-gray-300 px-3 py-2">{l.unit}</td>
                <td className="border border-gray-300 px-3 py-2">{dayjs(l.loanedAt).format("DD/MM/YY")}</td>
                <td className="border border-gray-300 px-3 py-2">{dayjs(l.dueAt).format("DD/MM/YY")}</td>
                <td className={`border border-gray-300 px-3 py-2 font-medium ${dot[s]}`}>● {s}</td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {!l.returnedAt && (
                    <button
                      onClick={() => {
                        if (window.confirm("Mark this loan as returned?")) returnLoan(l.id);
                      }}
                      className="bg-rose-500 hover:bg-rose-600 text-white text-xs px-2.5 py-1 rounded"
                    >
                      Mark returned
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="flex justify-center gap-1 mt-5">
        {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => setPage(n)}
            className={`w-8 h-8 text-sm rounded ${n === page ? "bg-gray-800 text-white" : "bg-gray-200 text-gray-700"}`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
