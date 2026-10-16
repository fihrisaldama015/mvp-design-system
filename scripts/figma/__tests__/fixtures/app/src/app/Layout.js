import { Outlet } from "react-router-dom";
import { Tooltip } from "components/tooltip";

export default function Layout() {
  return (
    <div>
      <Tooltip label="Help" />
      <Outlet />
    </div>
  );
}
