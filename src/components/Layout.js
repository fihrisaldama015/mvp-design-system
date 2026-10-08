import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { BarChart3, ClipboardList, LayoutDashboard, Package, PlusCircle, Search, Settings as Cog, Upload, Wrench } from "lucide-react";
import CommandPalette from "components/CommandPalette";
import Notifications from "components/Notifications";

const LINKS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/equipment", label: "Equipment", icon: Package },
  { to: "/loans", label: "Loan log", icon: ClipboardList, end: true },
  { to: "/loans/new", label: "New loan", icon: PlusCircle },
  { to: "/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/import", label: "Import", icon: Upload },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Cog },
];

export default function Layout() {
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-60 bg-gray-900 text-gray-100 flex flex-col">
        <div className="px-5 py-5 text-lg font-bold">Loan Tracker</div>
        <nav className="flex-1 px-3 space-y-1">
          {LINKS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm ${
                  isActive ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-800"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-5 py-4 text-xs text-gray-500">Demo data, nothing is saved</div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-8">
          <button
            onClick={() => setPaletteOpen(true)}
            className="flex w-72 items-center gap-2 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-400 hover:border-gray-300"
          >
            <Search size={14} /> Search
            <kbd className="ml-auto rounded border border-gray-300 px-1 text-xs text-gray-500">Ctrl K</kbd>
          </button>
          <Notifications />
        </header>
        <main className="flex-1 overflow-auto p-8">
          <Outlet />
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
