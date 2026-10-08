import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import { Check } from "lucide-react";
import { useStore } from "data/store";
import { TODAY } from "data/mock";

const STEPS = ["Equipment", "Borrower", "Confirm"];

export default function NewLoan() {
  const { equipment, createLoan } = useStore();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const available = equipment.filter((e) => e.status === "Available");
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    equipmentId: available.some((e) => e.id === params.get("equipment")) ? params.get("equipment") : "",
    borrower: "",
    unit: "",
    dueAt: "",
  });
  const [errors, setErrors] = useState({});

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const validate = () => {
    const next = {};
    if (step === 1 && !form.equipmentId) next.equipmentId = "Please choose an item";
    if (step === 2) {
      if (form.borrower.trim().length < 2) next.borrower = "Enter the borrower's name";
      if (!form.unit.trim()) next.unit = "Enter the unit";
      if (!form.dueAt) next.dueAt = "Pick a return date";
      else if (dayjs(form.dueAt).isBefore(dayjs(TODAY), "day")) next.dueAt = "The date is in the past";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const next = () => validate() && setStep(step + 1);

  const submit = () => {
    createLoan(form);
    alert("Loan created");
    navigate("/loans");
  };

  const chosen = equipment.find((e) => e.id === form.equipmentId);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-emerald-800 mb-6">Lend equipment</h1>

      <div className="flex items-center mb-8">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const done = n < step;
          const active = n === step;
          return (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                    done ? "bg-emerald-600 text-white" : active ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500" : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {done ? <Check size={16} /> : n}
                </div>
                <span className={active ? "font-semibold text-emerald-800" : "text-gray-500"}>{label}</span>
              </div>
              {n < STEPS.length && <div className="flex-1 h-0.5 bg-gray-300 mx-4" />}
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-3xl shadow-md p-8">
        {step === 1 && (
          <div>
            <label className="block font-medium text-gray-800 mb-2">Which item?</label>
            <select
              value={form.equipmentId}
              onChange={set("equipmentId")}
              className="w-full border-2 border-emerald-200 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500"
            >
              <option value="">Choose an available item</option>
              {available.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.serial})
                </option>
              ))}
            </select>
            {errors.equipmentId && <p className="text-red-500 text-sm mt-2">{errors.equipmentId}</p>}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <label className="block font-medium text-gray-800 mb-2">Borrower</label>
              <input
                value={form.borrower}
                onChange={set("borrower")}
                className="w-full border-2 border-emerald-200 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500"
              />
              {errors.borrower && <p className="text-red-500 text-sm mt-2">{errors.borrower}</p>}
            </div>
            <div>
              <label className="block font-medium text-gray-800 mb-2">Unit</label>
              <input
                value={form.unit}
                onChange={set("unit")}
                className="w-full border-2 border-emerald-200 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500"
              />
              {errors.unit && <p className="text-red-500 text-sm mt-2">{errors.unit}</p>}
            </div>
            <div>
              <label className="block font-medium text-gray-800 mb-2">Return by</label>
              <input
                type="date"
                value={form.dueAt}
                onChange={set("dueAt")}
                className="w-full border-2 border-emerald-200 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500"
              />
              {errors.dueAt && <p className="text-red-500 text-sm mt-2">{errors.dueAt}</p>}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Check the details</h2>
            <ul className="space-y-3 text-gray-700">
              <li>
                <b>Item:</b> {chosen?.name} ({chosen?.serial})
              </li>
              <li>
                <b>Borrower:</b> {form.borrower}, {form.unit}
              </li>
              <li>
                <b>Return by:</b> {dayjs(form.dueAt).format("D MMMM YYYY")}
              </li>
            </ul>
          </div>
        )}

        <div className="flex justify-between mt-8">
          <button
            onClick={() => (step === 1 ? navigate("/") : setStep(step - 1))}
            className="px-6 py-2.5 rounded-full border-2 border-gray-300 text-gray-600"
          >
            {step === 1 ? "Cancel" : "Back"}
          </button>
          {step < 3 ? (
            <button onClick={next} className="px-8 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
              Next
            </button>
          ) : (
            <button onClick={submit} className="px-8 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
              Confirm loan
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
