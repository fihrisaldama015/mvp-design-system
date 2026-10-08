import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, FileSpreadsheet, UploadCloud } from "lucide-react";
import { useStore } from "data/store";
import { CATEGORIES, CONDITIONS } from "data/mock";

const TEMPLATE = "name,category,serial,condition\nHandheld Radio HR-400,Radio,HR400-0001,New\n";

const SAMPLE = `name,category,serial,condition
Handheld Radio HR-400,Radio,HR400-0001,New
Handheld Radio HR-400,Radio,HR400-0002,New
Field Laptop X16,Laptop,X16-90001,New
Field Laptop X16,Laptop,X16-90002,Good
Portable Projector P4,Projector,P4-12001,Good
Thermal Camera TC-1,Thermal,TC-1-0001,New
Torque Wrench Set,Tool kit,,Good
Recovery Strap Set,Vehicle accessory,TW-77,Fair
Jump Start Pack JP-14,Vehicle accessory,JP14-0001,Good
Handheld Radio HR-200,Radio,HR200-0418,Good
Tablet T12,Laptop,T12-4001,New
Pa,Radio,PA-1,Good`;

// A small CSV reader: handles quoted cells that contain commas.
function splitLine(line) {
  const cells = [];
  let cur = "";
  let quoted = false;
  for (const ch of line) {
    if (ch === '"') quoted = !quoted;
    else if (ch === "," && !quoted) {
      cells.push(cur);
      cur = "";
    } else cur += ch;
  }
  cells.push(cur);
  return cells.map((c) => c.trim());
}

function parse(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const header = splitLine(lines[0]).map((h) => h.toLowerCase());
  return lines.slice(1).map((line, i) => {
    const cells = splitLine(line);
    const row = { line: i + 2 };
    header.forEach((h, idx) => (row[h] = cells[idx] ?? ""));
    return row;
  });
}

export default function ImportCsv() {
  const { equipment, addEquipment } = useStore();
  const fileInput = useRef(null);
  const [step, setStep] = useState(1);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [onlyErrors, setOnlyErrors] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imported, setImported] = useState(0);

  const checked = useMemo(() => {
    const known = new Set(equipment.map((e) => e.serial));
    const seen = new Set();
    return rows.map((r) => {
      const errors = [];
      if ((r.name ?? "").length < 3) errors.push("Name is too short");
      if (!CATEGORIES.includes(r.category)) errors.push(`Unknown category "${r.category}"`);
      if (!r.serial) errors.push("Serial is missing");
      else if (known.has(r.serial)) errors.push("Serial already exists");
      else if (seen.has(r.serial)) errors.push("Serial repeated in the file");
      if (r.serial) seen.add(r.serial);
      return { ...r, errors };
    });
  }, [rows, equipment]);

  const valid = checked.filter((r) => r.errors.length === 0);
  const shown = onlyErrors ? checked.filter((r) => r.errors.length) : checked;

  const load = (text, name) => {
    setRows(parse(text));
    setFileName(name);
    setStep(2);
  };

  const readFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => load(String(reader.result), file.name);
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob([TEMPLATE], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "equipment-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Fake progress: the data is added to the in-memory list once the bar is full.
  useEffect(() => {
    if (step !== 3) return undefined;
    const timer = setInterval(() => setProgress((p) => Math.min(100, p + 20)), 150);
    return () => clearInterval(timer);
  }, [step]);

  useEffect(() => {
    if (step === 3 && progress >= 100) {
      valid.forEach((r) => addEquipment({ name: r.name, category: r.category, serial: r.serial, condition: CONDITIONS.includes(r.condition) ? r.condition : "Good" }));
      setImported(valid.length);
      setStep(4);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, step]);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-1 text-2xl font-bold text-lime-900">Import equipment</h1>
      <p className="mb-6 text-sm text-gray-600">Add many items at once from a CSV file.</p>

      {step === 1 && (
        <>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              readFile(e.dataTransfer.files[0]);
            }}
            className={`flex flex-col items-center rounded-2xl border-2 border-dashed px-8 py-16 text-center ${dragging ? "border-lime-500 bg-lime-50" : "border-lime-300 bg-white"}`}
          >
            <UploadCloud size={44} className="text-lime-600" />
            <p className="mt-3 font-semibold text-gray-800">Drop a CSV file here</p>
            <p className="text-sm text-gray-500">or</p>
            <button onClick={() => fileInput.current.click()} className="mt-2 rounded-lg bg-lime-600 px-5 py-2 text-sm font-semibold text-white hover:bg-lime-700">
              Choose a file
            </button>
            <input ref={fileInput} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => readFile(e.target.files[0])} />
          </div>
          <div className="mt-4 flex gap-6 text-sm">
            <button onClick={downloadTemplate} className="text-lime-800 underline">
              Download the template
            </button>
            <button onClick={() => load(SAMPLE, "sample-equipment.csv")} className="text-lime-800 underline">
              Try it with sample data
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div className="mb-4 flex items-center justify-between rounded-xl bg-lime-50 px-5 py-3">
            <div className="flex items-center gap-3 text-sm">
              <FileSpreadsheet className="text-lime-700" />
              <b>{fileName}</b>
              <span className="text-gray-600">
                {valid.length} ready, <span className={checked.length - valid.length ? "font-semibold text-red-600" : ""}>{checked.length - valid.length} with problems</span>
              </span>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={onlyErrors} onChange={(e) => setOnlyErrors(e.target.checked)} className="accent-lime-600" />
              Show only problems
            </label>
          </div>

          <table className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2">Line</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2">Serial</th>
                <th className="px-4 py-2">Check</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.line} className={`border-t border-gray-100 ${r.errors.length ? "bg-red-50" : ""}`}>
                  <td className="px-4 py-2 text-gray-400">{r.line}</td>
                  <td className="px-4 py-2">{r.name}</td>
                  <td className="px-4 py-2">{r.category}</td>
                  <td className="px-4 py-2 font-mono text-xs">{r.serial}</td>
                  <td className="px-4 py-2">
                    {r.errors.length === 0 ? <span className="text-green-600">OK</span> : <span className="text-red-600">{r.errors.join(", ")}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-5 flex justify-between">
            <button
              onClick={() => {
                setStep(1);
                setRows([]);
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700"
            >
              Start over
            </button>
            <button
              disabled={valid.length === 0}
              onClick={() => {
                setProgress(0);
                setStep(3);
              }}
              className="rounded-lg bg-lime-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              Import {valid.length} valid rows
            </button>
          </div>
        </>
      )}

      {step === 3 && (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
          <p className="mb-4 font-semibold text-gray-800">Importing {valid.length} items...</p>
          <div className="mx-auto h-3 w-full max-w-md overflow-hidden rounded-full bg-lime-100">
            <div className="h-3 rounded-full bg-lime-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-sm text-gray-500">{progress}%</p>
        </div>
      )}

      {step === 4 && (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
          <CheckCircle2 size={56} className="mx-auto text-lime-600" />
          <h2 className="mt-3 text-xl font-bold text-gray-900">{imported} items imported</h2>
          <p className="text-sm text-gray-500">{checked.length - imported} rows were skipped because of problems.</p>
          <Link to="/equipment" className="mt-5 inline-block rounded-lg bg-lime-600 px-5 py-2 text-sm font-semibold text-white">
            See the equipment list
          </Link>
        </div>
      )}
    </div>
  );
}
