import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { CheckCircle2, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useStore } from "data/store";
import { CATEGORIES } from "data/mock";

const PER_PAGE = 8;

const badge = {
  Available: "bg-green-100 text-green-800",
  "On loan": "bg-yellow-100 text-yellow-800",
  Maintenance: "bg-red-100 text-red-800",
};

const schema = Yup.object({
  name: Yup.string().trim().min(3, "At least 3 characters").required("Name is required"),
  category: Yup.string().required("Pick a category"),
  serial: Yup.string().trim().required("Serial number is required"),
});

// A tooltip written by hand: shows a dark label above the icon on hover.
function Tip({ text, children }) {
  return (
    <span className="relative group inline-flex">
      {children}
      <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
        {text}
      </span>
    </span>
  );
}

export default function EquipmentList() {
  const { equipment, addEquipment, removeEquipment } = useStore();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return equipment.filter(
      (e) =>
        (!category || e.category === category) &&
        (!q || e.name.toLowerCase().includes(q) || e.serial.toLowerCase().includes(q)),
    );
  }, [equipment, search, category]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const rows = loading ? [] : filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const formik = useFormik({
    initialValues: { name: "", category: "", serial: "" },
    validationSchema: schema,
    onSubmit: (values, { resetForm }) => {
      addEquipment({ ...values, condition: "New" });
      setToast("Equipment added");
      setTimeout(() => setToast(""), 3000);
      resetForm();
      setShowModal(false);
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-slate-800">Equipment</h1>
        <div className="flex gap-3">
          <Link to="/import" className="flex items-center gap-2 border border-indigo-300 text-indigo-700 px-4 py-2 rounded-lg text-sm hover:bg-indigo-50">
            Import CSV
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            <Plus size={16} /> Add equipment
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search name or serial"
            className="pl-9 pr-3 py-2 w-72 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-100 text-slate-600 text-left">
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Serial</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id} className="odd:bg-white even:bg-slate-50">
                <td className="px-4 py-3 text-slate-500">{e.id}</td>
                <td className="px-4 py-3">
                  <Link to={`/equipment/${e.id}`} className="text-indigo-700 hover:underline">
                    {e.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-700">{e.category}</td>
                <td className="px-4 py-3 text-slate-500 font-mono text-xs">{e.serial}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${badge[e.status]}`}>{e.status}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2 text-slate-500">
                    <Tip text="Open details">
                      <Link to={`/equipment/${e.id}`} aria-label="Open">
                        <Pencil size={16} />
                      </Link>
                    </Tip>
                    <Tip text="Delete">
                      <button
                        aria-label="Delete"
                        onClick={() => {
                          if (window.confirm(`Delete ${e.name}?`)) removeEquipment(e.id);
                        }}
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    </Tip>
                  </div>
                </td>
              </tr>
            ))}
            {loading && (
              <tr>
                <td colSpan={6} className="py-16">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  Nothing found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4 text-sm text-slate-600">
        <span>
          Page {page} of {pages}
        </span>
        <div className="flex gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1.5 border border-slate-300 rounded disabled:opacity-40"
          >
            Previous
          </button>
          <button
            disabled={page === pages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1.5 border border-slate-300 rounded disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {toast && (
        <div className="fixed top-4 right-4 z-[60] flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-3 text-sm text-white shadow-lg">
          <CheckCircle2 size={18} className="text-green-400" /> {toast}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form onSubmit={formik.handleSubmit} className="bg-white rounded-xl p-6 w-[420px] shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-slate-800">Add equipment</h2>
              <button type="button" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            <label className="block text-sm text-slate-700 mb-1">Name</label>
            <input
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
            {formik.touched.name && formik.errors.name && <p className="text-red-500 text-xs mt-1">{formik.errors.name}</p>}

            <label className="block text-sm text-slate-700 mt-3 mb-1">Category</label>
            <select
              name="category"
              value={formik.values.category}
              onChange={formik.handleChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">Select</option>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            {formik.touched.category && formik.errors.category && (
              <p className="text-red-500 text-xs mt-1">{formik.errors.category}</p>
            )}

            <label className="block text-sm text-slate-700 mt-3 mb-1">Serial number</label>
            <input
              name="serial"
              value={formik.values.serial}
              onChange={formik.handleChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
            {formik.touched.serial && formik.errors.serial && (
              <p className="text-red-500 text-xs mt-1">{formik.errors.serial}</p>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-slate-300 rounded-lg">
                Cancel
              </button>
              <button
                type="submit"
                onClick={() => formik.setTouched({ name: true, category: true, serial: true })}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
