import { Route, Routes } from "react-router-dom";
import Layout from "components/Layout";
import Dashboard from "pages/Dashboard";
import EquipmentList from "pages/EquipmentList";
import EquipmentDetail from "pages/EquipmentDetail";
import LoanLog from "pages/LoanLog";
import NewLoan from "pages/NewLoan";
import Settings from "pages/Settings";
import LoanDetail from "pages/LoanDetail";
import PersonProfile from "pages/PersonProfile";
import Reports from "pages/Reports";
import NotFound from "pages/NotFound";
import Maintenance from "pages/Maintenance";
import TicketDetail from "pages/TicketDetail";
import ImportCsv from "pages/ImportCsv";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/equipment" element={<EquipmentList />} />
        <Route path="/equipment/:id" element={<EquipmentDetail />} />
        <Route path="/loans" element={<LoanLog />} />
        <Route path="/loans/new" element={<NewLoan />} />
        <Route path="/loans/:id" element={<LoanDetail />} />
        <Route path="/people/:id" element={<PersonProfile />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/maintenance/:id" element={<TicketDetail />} />
        <Route path="/import" element={<ImportCsv />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
