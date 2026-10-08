import { createContext, useContext, useMemo, useState } from "react";
import dayjs from "dayjs";
import { EQUIPMENT, LOANS, TODAY } from "data/mock";

// In-memory store: it lives as long as the tab. No backend, no login.
const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [equipment, setEquipment] = useState(EQUIPMENT);
  const [loans, setLoans] = useState(LOANS);

  const patchLoan = (id, patch) =>
    setLoans((list) => list.map((l) => (l.id === id ? { ...l, ...(typeof patch === "function" ? patch(l) : patch) } : l)));

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
            note: "",
            extensions: [],
          },
          ...list,
        ]);
        setEquipment((list) => list.map((e) => (e.id === equipmentId ? { ...e, status: "On loan" } : e)));
      },
      returnLoan: (loanId) => {
        const target = loans.find((l) => l.id === loanId);
        if (!target) return;
        patchLoan(loanId, { returnedAt: TODAY });
        setEquipment((list) => list.map((e) => (e.id === target.equipmentId ? { ...e, status: "Available" } : e)));
      },
      extendLoan: (loanId, days) =>
        patchLoan(loanId, (l) => ({
          dueAt: dayjs(l.dueAt).add(days, "day").format("YYYY-MM-DD"),
          extensions: [...l.extensions, { at: TODAY, days }],
        })),
      undoExtend: (loanId) =>
        patchLoan(loanId, (l) => {
          const last = l.extensions[l.extensions.length - 1];
          if (!last) return {};
          return {
            dueAt: dayjs(l.dueAt).subtract(last.days, "day").format("YYYY-MM-DD"),
            extensions: l.extensions.slice(0, -1),
          };
        }),
      setLoanNote: (loanId, note) => patchLoan(loanId, { note }),
    }),
    [equipment, loans],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  return useContext(StoreContext);
}
