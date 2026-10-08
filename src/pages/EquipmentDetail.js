import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import { useStore } from "data/store";
import { CATEGORIES, CONDITIONS, loanStatus } from "data/mock";

const statusColor = {
  Available: "bg-emerald-100 text-emerald-700",
  "On loan": "bg-orange-100 text-orange-700",
  Maintenance: "bg-rose-100 text-rose-700",
};

export default function EquipmentDetail() {
  const { id } = useParams();
  const { equipment, loans, updateEquipment, removeEquipment } = useStore();
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const item = equipment.find((e) => e.id === id);

  const [tab, setTab] = useState("details");
  const [drawer, setDrawer] = useState(false);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});

  if (!item) {
    return (
      <div>
        <p className="text-zinc-600">Equipment not found.</p>
        <Link to="/equipment" className="text-orange-600 underline">
          Back to the list
        </Link>
      </div>
    );
  }

  const history = loans.filter((l) => l.equipmentId === item.id);

  const openDrawer = () => {
    setForm({ name: item.name, category: item.category, serial: item.serial, condition: item.condition });
    setErrors({});
    setDrawer(true);
  };

  const save = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (!form.serial.trim()) next.serial = "Serial is required";
    setErrors(next);
    if (Object.keys(next).length) return;
    updateEquipment(item.id, form);
    setDrawer(false);
  };

  const fields = [
    ["Category", item.category],
    ["Serial number", item.serial],
    ["Condition", item.condition],
    ["Equipment ID", item.id],
  ];

  return (
    <div>
      <Link to="/equipment" className="text-sm text-zinc-500 hover:text-zinc-800">
        ← Back
      </Link>

      <div className="flex items-start justify-between mt-3 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900">{item.name}</h1>
          <span
            className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${statusColor[item.status]}`}
          >
            {item.status}
          </span>
        </div>
        <div className="flex gap-3">
          {item.status === "Available" && (
            <Link
              to={`/loans/new?equipment=${item.id}`}
              className="px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded"
            >
              Lend this item
            </Link>
          )}
          <button onClick={() => setConfirmDelete(true)} className="px-4 py-2 text-sm font-semibold text-red-600 border border-red-300 rounded">
            Delete
          </button>
          <button onClick={openDrawer} className="px-4 py-2 text-sm font-semibold text-zinc-700 border border-zinc-300 rounded">
            Edit
          </button>
        </div>
      </div>

      {item.status === "On loan" && history.find((l) => !l.returnedAt) && (
        <div className="mb-6 rounded border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-900">
          With <b>{history.find((l) => !l.returnedAt).borrower}</b> since {history.find((l) => !l.returnedAt).loanedAt}.
        </div>
      )}

      <div className="flex gap-8 border-b border-zinc-200 mb-6">
        {[
          ["details", "Details"],
          ["history", `Loan history (${history.length})`],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`pb-3 text-sm font-semibold border-b-2 -mb-px ${
              tab === key ? "border-orange-500 text-orange-600" : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "details" && (
        <dl className="grid grid-cols-2 gap-6 bg-white p-6 rounded border border-zinc-200 max-w-2xl">
          {fields.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs uppercase tracking-wide text-zinc-400">{label}</dt>
              <dd className="text-base text-zinc-900 mt-1">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {tab === "history" && (
        <div className="bg-white rounded border border-zinc-200 max-w-3xl">
          {history.length === 0 && <p className="p-6 text-zinc-400 text-sm">This item has not been lent yet.</p>}
          {history.map((l) => (
            <div key={l.id} className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 last:border-0">
              <div>
                <div className="font-semibold text-zinc-900">{l.borrower}</div>
                <div className="text-sm text-zinc-500">{l.unit}</div>
              </div>
              <div className="text-sm text-zinc-600">
                {dayjs(l.loanedAt).format("D MMM")} to {dayjs(l.dueAt).format("D MMM YYYY")}
              </div>
              <div className="text-xs font-bold uppercase text-zinc-500">{loanStatus(l)}</div>
            </div>
          ))}
        </div>
      )}

      {drawer && (
        <>
          <div className="fixed inset-0 bg-zinc-900/40" onClick={() => setDrawer(false)} />
          <div className="fixed top-0 right-0 h-full w-[380px] bg-white shadow-xl p-6 z-50 overflow-auto">
            <h2 className="text-lg font-bold text-zinc-900 mb-5">Edit equipment</h2>

            <label className="text-xs font-semibold text-zinc-500">NAME</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border-b-2 border-zinc-300 focus:border-orange-500 outline-none py-2 mb-1"
            />
            {errors.name && <p className="text-xs text-red-600 mb-3">{errors.name}</p>}

            <label className="text-xs font-semibold text-zinc-500 block mt-4">CATEGORY</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full border-b-2 border-zinc-300 py-2 bg-white mb-1"
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>

            <label className="text-xs font-semibold text-zinc-500 block mt-4">SERIAL NUMBER</label>
            <input
              value={form.serial}
              onChange={(e) => setForm({ ...form, serial: e.target.value })}
              className="w-full border-b-2 border-zinc-300 focus:border-orange-500 outline-none py-2 mb-1"
            />
            {errors.serial && <p className="text-xs text-red-600 mb-3">{errors.serial}</p>}

            <label className="text-xs font-semibold text-zinc-500 block mt-4">CONDITION</label>
            <select
              value={form.condition}
              onChange={(e) => setForm({ ...form, condition: e.target.value })}
              className="w-full border-b-2 border-zinc-300 py-2 bg-white"
            >
              {CONDITIONS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>

            <div className="flex gap-3 mt-8">
              <button onClick={save} className="flex-1 py-2 bg-orange-500 text-white font-semibold rounded">
                Save changes
              </button>
              <button onClick={() => setDrawer(false)} className="flex-1 py-2 border border-zinc-300 rounded text-zinc-700">
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-96 rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-zinc-900">Delete this asset?</h2>
            <p className="mt-2 text-sm text-zinc-500">
              {item.name} ({item.serial || "no serial"}) will be removed. You cannot undo this.
            </p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 rounded-lg border border-zinc-300 py-2 text-zinc-700">
                Keep it
              </button>
              <button
                onClick={() => {
                  removeEquipment(item.id);
                  navigate("/equipment");
                }}
                className="flex-1 rounded-lg bg-red-600 py-2 font-semibold text-white"
              >
                Yes, delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
