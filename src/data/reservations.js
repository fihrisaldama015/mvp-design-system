import { useSyncExternalStore } from "react";
import dayjs from "dayjs";
import { EQUIPMENT } from "data/mock";

// Equipment reservations (mock). Every date is relative to today, so the demo
// looks the same on any day. The store at the bottom lives as long as the tab.

export const RESERVATION_STATUSES = ["upcoming", "active", "overdue", "completed", "cancelled"];
export const STATUS_LABEL = { upcoming: "Upcoming", active: "Active", overdue: "Overdue", completed: "Completed", cancelled: "Cancelled" };
export const STATUS_TONE = { upcoming: "info", active: "success", overdue: "danger", completed: "neutral", cancelled: "neutral" };
export const TEAMS = ["1 GDS", "3 SIR", "9 DIV", "40 SAR"];

/** ISO date (YYYY-MM-DD) `n` days from today; `n` may be negative. */
export const daysFromNow = (n) => dayjs().add(n, "day").format("YYYY-MM-DD");

const item = (id) => {
  const e = EQUIPMENT.find((x) => x.id === id);
  return { id: e.id, name: e.name, category: e.category };
};
const person = (name, team) => ({ name, email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@example.org`, team });
const at = (n, time) => `${daysFromNow(n)} ${time}`;

export const RESERVATIONS = [
  {
    id: "RS-1001", requester: person("Aisyah Rahman", "3 SIR"), items: [item("EQ-001")],
    start: daysFromNow(-2), end: daysFromNow(2), status: "active", notes: "Radio check for the weekend exercise.", createdAt: daysFromNow(-9),
    activity: [{ at: at(-9, "10:12"), by: "Aisyah Rahman", text: "Requested the reservation" }, { at: at(-8, "09:00"), by: "Store keeper", text: "Approved" }, { at: at(-2, "08:30"), by: "Store keeper", text: "Picked up" }],
  },
  {
    id: "RS-1002", requester: person("Daniel Tan", "40 SAR"), items: [item("EQ-003")],
    start: daysFromNow(-9), end: daysFromNow(-2), status: "overdue", notes: "Needed for the field survey. Not returned yet.", createdAt: daysFromNow(-14),
    activity: [{ at: at(-14, "14:05"), by: "Daniel Tan", text: "Requested the reservation" }, { at: at(-13, "09:40"), by: "Store keeper", text: "Approved" }, { at: at(-9, "08:15"), by: "Store keeper", text: "Picked up" }, { at: at(-1, "09:00"), by: "System", text: "Marked as overdue" }],
  },
  {
    id: "RS-1003", requester: person("Marcus Lee", "1 GDS"), items: [item("EQ-006")],
    start: daysFromNow(1), end: daysFromNow(2), status: "upcoming", notes: "Briefing room is booked on both days.", createdAt: daysFromNow(-3),
    activity: [{ at: at(-3, "11:20"), by: "Marcus Lee", text: "Requested the reservation" }, { at: at(-2, "10:00"), by: "Store keeper", text: "Approved" }],
  },
  {
    id: "RS-1004", requester: person("Ravi Kumar", "9 DIV"), items: [item("EQ-008")],
    start: daysFromNow(3), end: daysFromNow(6), status: "upcoming", notes: "", createdAt: daysFromNow(-1),
    activity: [{ at: at(-1, "16:45"), by: "Ravi Kumar", text: "Requested the reservation" }],
  },
  {
    id: "RS-1005", requester: person("Nur Aini", "3 SIR"), items: [item("EQ-010")],
    start: daysFromNow(1), end: daysFromNow(2), status: "cancelled", notes: "Workshop moved to next month.", createdAt: daysFromNow(-5),
    activity: [{ at: at(-5, "13:30"), by: "Nur Aini", text: "Requested the reservation" }, { at: at(-2, "15:10"), by: "Nur Aini", text: "Cancelled the reservation" }],
  },
  {
    id: "RS-1006", requester: person("Chen Wei", "40 SAR"), items: [item("EQ-013")],
    start: daysFromNow(-1), end: daysFromNow(3), status: "active", notes: "Vehicle convoy training.", createdAt: daysFromNow(-6),
    activity: [{ at: at(-6, "09:25"), by: "Chen Wei", text: "Requested the reservation" }, { at: at(-5, "10:00"), by: "Store keeper", text: "Approved" }, { at: at(-1, "08:05"), by: "Store keeper", text: "Picked up" }],
  },
  {
    id: "RS-1007", requester: person("Aisyah Rahman", "3 SIR"), items: [item("EQ-015"), item("EQ-012")],
    start: daysFromNow(5), end: daysFromNow(9), status: "upcoming", notes: "Recovery drill. Please include the strap set.", createdAt: daysFromNow(-2),
    activity: [{ at: at(-2, "12:00"), by: "Aisyah Rahman", text: "Requested the reservation" }, { at: at(-1, "09:30"), by: "Store keeper", text: "Approved" }],
  },
  {
    id: "RS-1008", requester: person("Daniel Tan", "40 SAR"), items: [item("EQ-012")],
    start: daysFromNow(7), end: daysFromNow(8), status: "upcoming", notes: "Overlaps with RS-1007 on the same strap set.", createdAt: daysFromNow(-1),
    activity: [{ at: at(-1, "17:20"), by: "Daniel Tan", text: "Requested the reservation" }],
  },
  {
    id: "RS-1009", requester: person("Marcus Lee", "1 GDS"), items: [item("EQ-004")],
    start: daysFromNow(-14), end: daysFromNow(-10), status: "completed", notes: "", createdAt: daysFromNow(-20),
    activity: [{ at: at(-20, "10:00"), by: "Marcus Lee", text: "Requested the reservation" }, { at: at(-19, "09:00"), by: "Store keeper", text: "Approved" }, { at: at(-14, "08:00"), by: "Store keeper", text: "Picked up" }, { at: at(-10, "16:30"), by: "Store keeper", text: "Returned" }],
  },
  {
    id: "RS-1010", requester: person("Ravi Kumar", "9 DIV"), items: [item("EQ-018")],
    start: daysFromNow(-8), end: daysFromNow(-5), status: "completed", notes: "Footage for the open day.", createdAt: daysFromNow(-12),
    activity: [{ at: at(-12, "15:00"), by: "Ravi Kumar", text: "Requested the reservation" }, { at: at(-11, "09:15"), by: "Store keeper", text: "Approved" }, { at: at(-8, "08:45"), by: "Store keeper", text: "Picked up" }, { at: at(-5, "17:00"), by: "Store keeper", text: "Returned" }],
  },
  {
    id: "RS-1011", requester: person("Hannah Lim", "9 DIV"), items: [item("EQ-007")],
    start: daysFromNow(-6), end: daysFromNow(-1), status: "overdue", notes: "Training roadshow.", createdAt: daysFromNow(-10),
    activity: [{ at: at(-10, "11:00"), by: "Hannah Lim", text: "Requested the reservation" }, { at: at(-9, "10:30"), by: "Store keeper", text: "Approved" }, { at: at(-6, "08:20"), by: "Store keeper", text: "Picked up" }, { at: at(0, "00:05"), by: "System", text: "Marked as overdue" }],
  },
  {
    id: "RS-1012", requester: person("Nur Aini", "3 SIR"), items: [item("EQ-017"), item("EQ-002")],
    start: daysFromNow(-20), end: daysFromNow(-16), status: "completed", notes: "", createdAt: daysFromNow(-26),
    activity: [{ at: at(-26, "10:40"), by: "Nur Aini", text: "Requested the reservation" }, { at: at(-25, "09:00"), by: "Store keeper", text: "Approved" }, { at: at(-20, "08:10"), by: "Store keeper", text: "Picked up" }, { at: at(-16, "16:00"), by: "Store keeper", text: "Returned" }],
  },
  {
    id: "RS-1013", requester: person("Chen Wei", "40 SAR"), items: [item("EQ-017")],
    start: daysFromNow(10), end: daysFromNow(12), status: "upcoming", notes: "", createdAt: daysFromNow(0),
    activity: [{ at: at(0, "08:50"), by: "Chen Wei", text: "Requested the reservation" }],
  },
  {
    id: "RS-1014", requester: person("Ravi Kumar", "9 DIV"), items: [item("EQ-004")],
    start: daysFromNow(2), end: daysFromNow(4), status: "cancelled", notes: "Replaced by another laptop.", createdAt: daysFromNow(-4),
    activity: [{ at: at(-4, "14:00"), by: "Ravi Kumar", text: "Requested the reservation" }, { at: at(-3, "09:10"), by: "Ravi Kumar", text: "Cancelled the reservation" }],
  },
];

const isLive = (r) => r.status === "upcoming" || r.status === "active" || r.status === "overdue";

/** Other live reservations that book one of the same items in an overlapping period. Pass a draft `{ id?, items, start, end }`. */
export function findConflicts(draft, list = reservations) {
  const ids = new Set(draft.items.map((i) => i.id));
  return list.filter(
    (r) =>
      r.id !== draft.id &&
      isLive(r) &&
      r.items.some((i) => ids.has(i.id)) &&
      !dayjs(r.start).isAfter(draft.end, "day") &&
      !dayjs(r.end).isBefore(draft.start, "day"),
  );
}

// A tiny module-level store: the list lives as long as the tab, no backend.
let reservations = RESERVATIONS;
const listeners = new Set();
const commit = (next) => {
  reservations = next;
  listeners.forEach((l) => l());
};
const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

const nextId = () => `RS-${1000 + reservations.length + 1}`;

/** The reservations store. Re-renders the component when the list changes. */
export function useReservations() {
  const list = useSyncExternalStore(subscribe, () => reservations);
  return {
    reservations: list,
    /** Adds a reservation (`requester`, `items`, `start`, `end`, `notes`) as upcoming and returns its id. */
    addReservation: (draft) => {
      const id = nextId();
      const now = dayjs().format("YYYY-MM-DD HH:mm");
      commit([
        { notes: "", ...draft, id, status: "upcoming", createdAt: daysFromNow(0), activity: [{ at: now, by: draft.requester.name, text: "Requested the reservation" }] },
        ...reservations,
      ]);
      return id;
    },
    updateReservation: (id, patch) => commit(reservations.map((r) => (r.id === id ? { ...r, ...patch } : r))),
    cancelReservation: (id) =>
      commit(
        reservations.map((r) =>
          r.id === id
            ? { ...r, status: "cancelled", activity: [...r.activity, { at: dayjs().format("YYYY-MM-DD HH:mm"), by: "Store keeper", text: "Cancelled the reservation" }] }
            : r,
        ),
      ),
  };
}
