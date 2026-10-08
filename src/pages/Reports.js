import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { useStore } from "data/store";
import { PEOPLE, TODAY } from "data/mock";

const RANGES = [7, 30, 90];
const COLORS = ["#d97706", "#ea580c", "#65a30d", "#0284c7", "#7c3aed", "#e11d48"];

function Skeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-48 bg-stone-200 rounded mb-6" />
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 bg-stone-200 rounded" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 h-72 bg-stone-200 rounded" />
        <div className="h-72 bg-stone-200 rounded" />
      </div>
    </div>
  );
}

export default function Reports() {
  const { loans, equipment } = useStore();
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const data = useMemo(() => {
    const start = dayjs(TODAY).subtract(days, "day");
    const inRange = loans.filter((l) => !dayjs(l.loanedAt).isBefore(start, "day"));
    const buckets = Math.ceil(days / 7);
    const weekly = Array.from({ length: buckets }, (_, i) => {
      const from = start.add(i * 7, "day");
      const to = from.add(6, "day");
      return {
        label: from.format("D MMM"),
        count: inRange.filter((l) => !dayjs(l.loanedAt).isBefore(from, "day") && !dayjs(l.loanedAt).isAfter(to, "day")).length,
      };
    });
    const byCategory = {};
    inRange.forEach((l) => {
      const c = equipment.find((e) => e.id === l.equipmentId)?.category ?? "Other";
      byCategory[c] = (byCategory[c] ?? 0) + 1;
    });
    const byPerson = {};
    inRange.forEach((l) => (byPerson[l.borrower] = (byPerson[l.borrower] ?? 0) + 1));
    const byItem = {};
    inRange.forEach((l) => {
      const n = equipment.find((e) => e.id === l.equipmentId)?.name ?? l.equipmentId;
      byItem[n] = (byItem[n] ?? 0) + 1;
    });
    const returned = inRange.filter((l) => l.returnedAt);
    const onTime = returned.filter((l) => !dayjs(l.returnedAt).isAfter(dayjs(l.dueAt), "day")).length;
    const avg = returned.length
      ? returned.reduce((s, l) => s + dayjs(l.returnedAt).diff(dayjs(l.loanedAt), "day"), 0) / returned.length
      : 0;
    return {
      total: inRange.length,
      onTimePct: returned.length ? Math.round((onTime / returned.length) * 100) : 0,
      avg: avg.toFixed(1),
      weekly,
      categories: Object.entries(byCategory).sort((a, b) => b[1] - a[1]),
      people: Object.entries(byPerson).sort((a, b) => b[1] - a[1]).slice(0, 5),
      items: Object.entries(byItem).sort((a, b) => b[1] - a[1]).slice(0, 5),
    };
  }, [loans, equipment, days]);

  if (loading) return <Skeleton />;

  // line chart geometry
  const W = 560;
  const H = 200;
  const max = Math.max(1, ...data.weekly.map((w) => w.count));
  const pts = data.weekly.map((w, i) => {
    const x = 30 + (i * (W - 50)) / Math.max(1, data.weekly.length - 1);
    const y = H - 30 - (w.count / max) * (H - 60);
    return [x, y, w];
  });

  // donut geometry
  const R = 60;
  const C = 2 * Math.PI * R;
  const catTotal = data.categories.reduce((s, c) => s + c[1], 0) || 1;
  let offset = 0;

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-stone-900">Reports</h1>
        <div className="flex items-center gap-3">
          <div className="flex border border-stone-300 rounded-md overflow-hidden">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setDays(r)}
                className={`h-8 px-3 text-xs ${days === r ? "bg-amber-500 text-white" : "bg-white text-stone-600"}`}
              >
                Last {r} days
              </button>
            ))}
          </div>
          <button className="h-8 px-4 bg-stone-800 text-white text-xs tracking-widest rounded">EXPORT</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          ["Loans", data.total],
          ["Returned on time", `${data.onTimePct}%`],
          ["Average loan", `${data.avg} days`],
        ].map(([label, value]) => (
          <div key={label} className="bg-white border border-stone-200 rounded p-5">
            <div className="text-xs uppercase tracking-wider text-stone-400">{label}</div>
            <div className="text-3xl font-black text-amber-600 mt-1">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="col-span-2 bg-white border border-stone-200 rounded p-5">
          <h2 className="text-sm font-bold text-stone-700 mb-2">Loans per week</h2>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
            {[0, 0.5, 1].map((t) => (
              <g key={t}>
                <line x1="30" x2={W - 20} y1={H - 30 - t * (H - 60)} y2={H - 30 - t * (H - 60)} stroke="#e7e5e4" />
                <text x="4" y={H - 26 - t * (H - 60)} fontSize="10" fill="#a8a29e">
                  {Math.round(max * t)}
                </text>
              </g>
            ))}
            <polyline fill="none" stroke="#d97706" strokeWidth="3" points={pts.map((p) => `${p[0]},${p[1]}`).join(" ")} />
            {pts.map(([x, y, w]) => (
              <g key={w.label}>
                <circle cx={x} cy={y} r="4" fill="#d97706" />
                <text x={x} y={H - 10} fontSize="10" textAnchor="middle" fill="#78716c">
                  {w.label}
                </text>
              </g>
            ))}
          </svg>
        </div>

        <div className="bg-white border border-stone-200 rounded p-5">
          <h2 className="text-sm font-bold text-stone-700 mb-2">By category</h2>
          <svg viewBox="0 0 160 160" className="w-40 mx-auto">
            <circle cx="80" cy="80" r={R} fill="none" stroke="#f5f5f4" strokeWidth="22" />
            {data.categories.map(([name, n], i) => {
              const len = (n / catTotal) * C;
              const el = (
                <circle
                  key={name}
                  cx="80"
                  cy="80"
                  r={R}
                  fill="none"
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth="22"
                  strokeDasharray={`${len} ${C - len}`}
                  strokeDashoffset={-offset}
                  transform="rotate(-90 80 80)"
                />
              );
              offset += len;
              return el;
            })}
            <text x="80" y="86" textAnchor="middle" fontSize="20" fontWeight="800" fill="#1c1917">
              {data.total}
            </text>
          </svg>
          <ul className="mt-3 space-y-1 text-xs text-stone-600">
            {data.categories.map(([name, n], i) => (
              <li key={name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                {name}
                <span className="ml-auto font-semibold">{n}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-stone-200 rounded p-5">
          <h2 className="text-sm font-bold text-stone-700 mb-3">Top borrowers</h2>
          <div className="space-y-3">
            {data.people.map(([name, n]) => {
              const p = PEOPLE.find((x) => x.name === name);
              return (
                <div key={name}>
                  <div className="flex justify-between text-xs mb-1">
                    {p ? (
                      <Link to={`/people/${p.id}`} className="text-stone-700 hover:underline">
                        {name}
                      </Link>
                    ) : (
                      <span>{name}</span>
                    )}
                    <span className="font-semibold">{n}</span>
                  </div>
                  <div className="h-2 bg-stone-100 rounded">
                    <div className="h-2 bg-amber-500 rounded" style={{ width: `${(n / data.people[0][1]) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded p-5">
          <h2 className="text-sm font-bold text-stone-700 mb-3">Most borrowed items</h2>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-stone-400">
                <th className="pb-2 font-medium">Item</th>
                <th className="pb-2 font-medium text-right">Loans</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map(([name, n]) => (
                <tr key={name} className="border-t border-stone-100">
                  <td className="py-2 text-stone-700">{name}</td>
                  <td className="py-2 text-right font-semibold">{n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
