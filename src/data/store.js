import { createContext, useContext, useMemo, useState } from "react";
import { EQUIPMENT, LOANS, TODAY } from "data/mock";

// In-memory store: it lives as long as the tab. No backend, no login.
const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [equipment, setEquipment] = useState(EQUIPMENT);
  const [loans, setLoans] = useState(LOANS);

  const value = useMemo(
    () => ({
      equipment,
      loans,
      addEquipment: (item) =>
        setEquipment((list) => [
          { ...item, id: `EQ-${String(Date.now()).slice(-5)}`, status: "Available" },
          ...list,
        ]),
      updateEquipment: (id, patch) =>
        setEquipment((list) => list.map((e) => (e.id === id ? { ...e, ...patch } : e))),
      removeEquipment: (id) => setEquipment((list) => list.filter((e) => e.id !== id)),
      createLoan: ({ equipmentId, borrower, unit, dueAt }) => {
        setLoans((list) => [
          {
            id: `L-${String(Date.now()).slice(-5)}`,
            equipmentId,
            borrower,
            unit,
            loanedAt: TODAY,
            dueAt,
            returnedAt: null,
          },
          ...list,
        ]);
        setEquipment((list) => list.map((e) => (e.id === equipmentId ? { ...e, status: "On loan" } : e)));
      },
      returnLoan: (loanId) => {
        const target = loans.find((l) => l.id === loanId);
        if (!target) return;
        setLoans((list) => list.map((l) => (l.id === loanId ? { ...l, returnedAt: TODAY } : l)));
        setEquipment((list) => list.map((e) => (e.id === target.equipmentId ? { ...e, status: "Available" } : e)));
      },
    }),
    [equipment, loans],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  return useContext(StoreContext);
}
