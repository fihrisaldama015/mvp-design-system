import { createContext, useContext, useMemo, useState } from "react";
import dayjs from "dayjs";
import { EQUIPMENT, LOANS, TICKETS, TODAY } from "data/mock";

// In-memory store: it lives as long as the tab. No backend, no login.
const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [equipment, setEquipment] = useState(EQUIPMENT);
  const [loans, setLoans] = useState(LOANS);
  const [tickets, setTickets] = useState(TICKETS);

  const patchLoan = (id, patch) =>
    setLoans((list) => list.map((l) => (l.id === id ? { ...l, ...(typeof patch === "function" ? patch(l) : patch) } : l)));

  const setItemStatus = (equipmentId, from, to) =>
    setEquipment((list) => list.map((e) => (e.id === equipmentId && e.status === from ? { ...e, status: to } : e)));

  const value = useMemo(
    () => ({
      equipment,
      loans,
      tickets,
      addTicket: ({ equipmentId, title, priority, reporter, description }) => {
        const id = `T-${String(Date.now()).slice(-5)}`;
        setTickets((list) => [
          {
            id,
            equipmentId,
            title,
            priority,
            status: "Open",
            reporter,
            createdAt: TODAY,
            comments: description ? [{ author: reporter, at: `${TODAY} 09:00`, text: description }] : [],
          },
          ...list,
        ]);
        setItemStatus(equipmentId, "Available", "Maintenance");
        return id;
      },
      setTicketStatus: (ticketId, status) => {
        const target = tickets.find((t) => t.id === ticketId);
        if (!target) return;
        setTickets((list) => list.map((t) => (t.id === ticketId ? { ...t, status } : t)));
        if (status === "Resolved") setItemStatus(target.equipmentId, "Maintenance", "Available");
        else setItemStatus(target.equipmentId, "Available", "Maintenance");
      },
      addComment: (ticketId, author, text) =>
        setTickets((list) =>
          list.map((t) => (t.id === ticketId ? { ...t, comments: [...t.comments, { author, at: `${TODAY} 17:00`, text }] } : t)),
        ),
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
    [equipment, loans, tickets],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  return useContext(StoreContext);
}
