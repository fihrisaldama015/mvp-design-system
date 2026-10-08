import { NavLink, Outlet } from "react-router-dom";
import { BarChart3, ClipboardList, LayoutDashboard, Package, PlusCircle, Settings as Cog } from "lucide-react";

const LINKS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/equipment", label: "Equipment", icon: Package },
  { to: "/loans", label: "Loan log", icon: ClipboardList, end: true },
  { to: "/loans/new", label: "New loan", icon: PlusCircle },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Cog },
];

export default function Layout() {
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
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
