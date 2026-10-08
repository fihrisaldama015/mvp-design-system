import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import dayjs from "dayjs";
import { AlertTriangle, CalendarPlus, CheckCircle2 } from "lucide-react";
import { useStore } from "data/store";
import { TODAY, loanStatus, personByName } from "data/mock";

const statusPill = {
  Active: "bg-violet-100 text-violet-700",
  Overdue: "bg-red-100 text-red-700",
  Returned: "bg-green-100 text-green-700",
};

export default function LoanDetail() {
  const { id } = useParams();
  const { loans, equipment, returnLoan, extendLoan, setLoanNote } = useStore();
  const loan = loans.find((l) => l.id === id);
  const [note, setNote] = useState(loan?.note ?? "");
  const [noteSaved, setNoteSaved] = useState(false);

  if (!loan) {
    return (
      <div className="text-violet-900">
        Loan not found.{" "}
        <Link to="/loans" className="underline">
          Back to the log
        </Link>
      </div>
    );
  }

  const item = equipment.find((e) => e.id === loan.equipmentId);
  const person = personByName(loan.borrower);
  const status = loanStatus(loan);
  const lateDays = status === "Overdue" ? dayjs(TODAY).diff(dayjs(loan.dueAt), "day") : 0;

  const events = [
    { date: loan.loanedAt, title: "Loaned out", detail: `${item?.name ?? loan.equipmentId} to ${loan.borrower}` },
    ...loan.extensions.map((x) => ({ date: x.at, title: `Extended by ${x.days} days`, detail: "New due date set" })),
    loan.returnedAt
      ? { date: loan.returnedAt, title: "Returned", detail: "Item checked back in", tone: "done" }
      : status === "Overdue"
        ? { date: loan.dueAt, title: "Became overdue", detail: `${lateDays} days late so far`, tone: "bad" }
        : { date: loan.dueAt, title: "Due back", detail: "Not returned yet", tone: "future" },
  ].sort((a, b) => a.date.localeCompare(b.date));

  const saveNote = () => {
    setLoanNote(loan.id, note);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 1500);
  };

  return (
    <div className="max-w-5xl">
      <div className="text-sm text-violet-400 mb-2">
        <Link to="/loans" className="hover:text-violet-700">
          Loans
        </Link>{" "}
        / {loan.id}
      </div>

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-violet-900">Loan {loan.id}</h1>
          <span className={`px-3 py-1 text-sm rounded-md font-medium ${statusPill[status]}`}>{status}</span>
        </div>
        {!loan.returnedAt && (
          <div className="flex gap-3">
            <button
              onClick={() => extendLoan(loan.id, 7)}
              className="flex items-center gap-2 border border-violet-600 text-violet-700 rounded-md px-4 py-2 text-sm hover:bg-violet-50"
            >
              <CalendarPlus size={16} /> Extend 7 days
            </button>
            <button
              onClick={() => returnLoan(loan.id)}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white rounded-md px-4 py-2 text-sm"
            >
              <CheckCircle2 size={16} /> Mark returned
            </button>
          </div>
        )}
      </div>

      {status === "Overdue" && (
        <div className="flex items-start gap-3 border-l-4 border-red-500 bg-red-50 p-4 mb-5">
          <AlertTriangle className="text-red-500 mt-0.5" size={20} />
          <div>
            <div className="font-semibold text-red-800">This loan is {lateDays} days late</div>
            <div className="text-sm text-red-700">It was due on {loan.dueAt}. Contact {loan.borrower} ({loan.unit}).</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white border border-violet-100 rounded-lg p-6">
          <h2 className="font-semibold text-violet-900 mb-5">Timeline</h2>
          <ol className="relative border-l-2 border-violet-200 ml-2 space-y-6">
            {events.map((ev, i) => (
              <li key={i} className="ml-6">
                <span
                  className={`absolute -left-[9px] w-4 h-4 rounded-full border-2 border-white ${
                    ev.tone === "bad" ? "bg-red-500" : ev.tone === "done" ? "bg-green-500" : ev.tone === "future" ? "bg-violet-200" : "bg-violet-600"
                  }`}
                />
                <div className="text-xs text-violet-400 font-mono">{ev.date}</div>
                <div className="font-medium text-gray-900">{ev.title}</div>
                <div className="text-sm text-gray-500">{ev.detail}</div>
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-violet-100 rounded-lg p-6">
            <h2 className="font-semibold text-violet-900 mb-4">Summary</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-violet-400">Item</dt>
                <dd>
                  <Link to={`/equipment/${loan.equipmentId}`} className="text-violet-700 underline">
                    {item?.name ?? loan.equipmentId}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-violet-400">Borrower</dt>
                <dd>
                  {person ? (
                    <Link to={`/people/${person.id}`} className="text-violet-700 underline">
                      {loan.borrower}
                    </Link>
                  ) : (
                    loan.borrower
                  )}
                  , {loan.unit}
                </dd>
              </div>
              <div>
                <dt className="text-violet-400">Loaned</dt>
                <dd className="font-mono">{loan.loanedAt}</dd>
              </div>
              <div>
                <dt className="text-violet-400">Due</dt>
                <dd className="font-mono">{loan.dueAt}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-white border border-violet-100 rounded-lg p-6">
            <h2 className="font-semibold text-violet-900 mb-3">Notes</h2>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder="Anything the next person should know"
              className="w-full border border-violet-200 rounded-md p-2 text-sm"
            />
            <button onClick={saveNote} className="mt-2 text-sm bg-violet-100 text-violet-800 px-3 py-1.5 rounded-md">
              {noteSaved ? "Saved ✓" : "Save note"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
