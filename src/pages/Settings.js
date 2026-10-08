import { useState } from "react";

const SAVED = { loanDays: 7, maxLoans: 3, remind: true, density: "comfortable" };

export default function Settings() {
  const [saved, setSaved] = useState(SAVED);
  const [form, setForm] = useState(SAVED);
  const [showSaved, setShowSaved] = useState(false);

  const changed = JSON.stringify(saved) !== JSON.stringify(form);

  const save = () => {
    setSaved(form);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-lg font-bold text-gray-800 mb-4">Settings</h1>

      {showSaved && <div className="bg-green-500 text-white px-4 py-2 rounded mb-4 text-sm">Saved!</div>}

      <div className="bg-white shadow rounded p-5 mb-4">
        <h2 className="font-semibold text-gray-700 mb-3">Loan rules</h2>
        <div className="flex gap-6">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Default loan length (days)</label>
            <input
              type="number"
              value={form.loanDays}
              onChange={(e) => setForm({ ...form, loanDays: Number(e.target.value) })}
              className="border rounded px-2 py-1 w-32"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Max open loans per person</label>
            <input
              type="number"
              value={form.maxLoans}
              onChange={(e) => setForm({ ...form, maxLoans: Number(e.target.value) })}
              className="border rounded px-2 py-1 w-32"
            />
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded p-5 mb-4">
        <h2 className="font-semibold text-gray-700 mb-3">Reminders</h2>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setForm({ ...form, remind: !form.remind })}
            className={`w-11 h-6 rounded-full relative ${form.remind ? "bg-sky-500" : "bg-gray-300"}`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${form.remind ? "left-5" : "left-0.5"}`}
            />
          </button>
          <span className="text-sm text-gray-600">Remind borrowers one day before the return date</span>
        </div>
      </div>

      <div className="bg-white shadow rounded p-5 mb-6">
        <h2 className="font-semibold text-gray-700 mb-3">Table density</h2>
        {["comfortable", "compact"].map((d) => (
          <label key={d} className="flex items-center gap-2 text-sm text-gray-600 mb-1 capitalize">
            <input type="radio" name="density" checked={form.density === d} onChange={() => setForm({ ...form, density: d })} />
            {d}
          </label>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={save}
          disabled={!changed}
          className="bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white px-5 py-2 rounded"
        >
          Save settings
        </button>
        <button onClick={() => setForm(saved)} className="text-sm text-gray-500 underline">
          Reset
        </button>
      </div>
    </div>
  );
}
