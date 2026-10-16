import { Route, Routes } from "react-router-dom";
import Layout from "app/Layout";
import Reservations from "pages/Reservations";
import NewReservation from "pages/NewReservation";
import LoanDetail from "pages/LoanDetail";
import Review from "pages/Review";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/reservations" element={<Reservations />} />
        <Route path="/reservations/new" element={<NewReservation />} />
        <Route path="/loans/:id" element={<LoanDetail />} />
        <Route path="/review" element={<Review />} />
      </Route>
    </Routes>
  );
}
