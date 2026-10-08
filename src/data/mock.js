import dayjs from "dayjs";

// A fixed "today" so the demo looks the same every day (and in screenshots).
export const TODAY = "2026-10-08";

export const CATEGORIES = ["Radio", "Laptop", "Projector", "Camera", "Tool kit", "Vehicle accessory"];
export const CONDITIONS = ["New", "Good", "Fair", "Worn"];

const eq = (n, name, category, serial, status, condition) => ({
  id: `EQ-${String(n).padStart(3, "0")}`,
  name,
  category,
  serial,
  status,
  condition,
});

const HAND_MADE = [
  eq(1, "Handheld Radio HR-200", "Radio", "HR200-0418", "Available", "Good"),
  eq(2, "Handheld Radio HR-200", "Radio", "HR200-0419", "On loan", "Good"),
  eq(3, "Field Laptop X14", "Laptop", "X14-77120", "Available", "New"),
  eq(4, "Field Laptop X14", "Laptop", "X14-77121", "Available", "Good"),
  eq(5, "Field Laptop X14", "Laptop", "X14-77122", "On loan", "Fair"),
  eq(6, "Portable Projector P3", "Projector", "P3-30911", "Available", "Good"),
  eq(7, "Portable Projector P3", "Projector", "P3-30912", "On loan", "Good"),
  eq(8, "Action Camera C5", "Camera", "C5-55001", "Available", "New"),
  eq(9, "Action Camera C5", "Camera", "C5-55002", "Maintenance", "Worn"),
  eq(10, "Mechanic Tool Kit 120pc", "Tool kit", "TK120-009", "Available", "Good"),
  eq(11, "Mechanic Tool Kit 120pc", "Tool kit", "TK120-010", "On loan", "Fair"),
  eq(12, "Recovery Strap Set", "Vehicle accessory", "RS-2201", "Available", "Good"),
  eq(13, "Jump Start Pack JP-12", "Vehicle accessory", "JP12-448", "Available", "Good"),
  eq(14, "Jump Start Pack JP-12", "Vehicle accessory", "JP12-449", "On loan", "Good"),
  eq(15, "Handheld Radio HR-300", "Radio", "HR300-1102", "Available", "New"),
  eq(16, "Portable Projector P3", "Projector", "P3-30913", "Maintenance", "Fair"),
  eq(17, "Field Laptop X14", "Laptop", "X14-77123", "Available", "Good"),
  eq(18, "Action Camera C5", "Camera", "C5-55003", "Available", "Good"),
];

// 42 more items so paging, long names and empty fields get exercised.
const MODELS = [
  ["Handheld Radio HR-300", "Radio", "HR300"],
  ["Field Laptop X14 Rugged Edition with extended battery and docking cradle", "Laptop", "X14R"],
  ["Portable Projector P3", "Projector", "P3"],
  ["Action Camera C5", "Camera", "C5"],
  ["Mechanic Tool Kit 120pc", "Tool kit", "TK120"],
  ["Recovery Strap Set", "Vehicle accessory", "RS"],
  ["Night Vision Monocular NV-7", "Camera", "NV7"],
  ["Satellite Phone SP-2", "Radio", "SP2"],
  ["Tablet T10", "Laptop", "T10"],
  ["Torque Wrench Set", "Tool kit", "TW"],
];

const GENERATED = Array.from({ length: 42 }, (_, i) => {
  const n = 19 + i;
  const [name, category, code] = MODELS[i % MODELS.length];
  const serial = i === 5 ? "" : `${code}-${6000 + n * 7}`;
  return eq(n, name, category, serial, i % 11 === 7 ? "Maintenance" : "Available", CONDITIONS[i % 4]);
});

export const PEOPLE = [
  { id: "P-01", name: "Aisyah Rahman", unit: "3 SIR", rank: "Sergeant", email: "aisyah.rahman@example.com", phone: "+65 8123 4401" },
  { id: "P-02", name: "Daniel Tan", unit: "40 SAR", rank: "Corporal", email: "daniel.tan@example.com", phone: "+65 8123 4402" },
  { id: "P-03", name: "Marcus Lee", unit: "1 GDS", rank: "Lieutenant", email: "marcus.lee@example.com", phone: "+65 8123 4403" },
  { id: "P-04", name: "Nur Aini", unit: "3 SIR", rank: "Private", email: "nur.aini@example.com", phone: "+65 8123 4404" },
  { id: "P-05", name: "Ravi Kumar", unit: "9 DIV", rank: "Staff Sergeant", email: "ravi.kumar@example.com", phone: "+65 8123 4405" },
  { id: "P-06", name: "Chen Wei", unit: "40 SAR", rank: "Corporal", email: "chen.wei@example.com", phone: "+65 8123 4406" },
  { id: "P-07", name: "Siti Aminah", unit: "9 DIV", rank: "Sergeant", email: "siti.aminah@example.com", phone: "+65 8123 4407" },
  { id: "P-08", name: "Hafiz Ismail", unit: "3 SIR", rank: "Private", email: "hafiz.ismail@example.com", phone: "+65 8123 4408" },
  { id: "P-09", name: "Priya Nair", unit: "9 DIV", rank: "Captain", email: "priya.nair@example.com", phone: "+65 8123 4409" },
  { id: "P-10", name: "Jonathan Goh", unit: "1 GDS", rank: "Corporal", email: "jonathan.goh@example.com", phone: "+65 8123 4410" },
  { id: "P-11", name: "Farah Zain", unit: "40 SAR", rank: "Sergeant", email: "farah.zain@example.com", phone: "+65 8123 4411" },
  { id: "P-12", name: "Kenneth Ong", unit: "9 DIV", rank: "Lieutenant", email: "kenneth.ong@example.com", phone: "+65 8123 4412" },
];

export const personByName = (name) => PEOPLE.find((p) => p.name === name);

const loan = (n, equipmentId, borrower, unit, loanedAt, dueAt, returnedAt = null) => ({
  id: `L-${String(n).padStart(3, "0")}`,
  equipmentId,
  borrower,
  unit,
  loanedAt,
  dueAt,
  returnedAt,
  note: "",
  extensions: [],
});

export const LOANS = [
  loan(1, "EQ-002", "Aisyah Rahman", "3 SIR", "2026-09-28", "2026-10-05"),
  loan(2, "EQ-005", "Daniel Tan", "40 SAR", "2026-10-03", "2026-10-10"),
  loan(3, "EQ-007", "Marcus Lee", "1 GDS", "2026-10-06", "2026-10-13"),
  loan(4, "EQ-011", "Nur Aini", "3 SIR", "2026-09-30", "2026-10-07"),
  loan(5, "EQ-014", "Ravi Kumar", "9 DIV", "2026-10-07", "2026-10-14"),
  loan(6, "EQ-001", "Aisyah Rahman", "3 SIR", "2026-09-15", "2026-09-22", "2026-09-21"),
  loan(7, "EQ-003", "Chen Wei", "40 SAR", "2026-09-10", "2026-09-17", "2026-09-17"),
  loan(8, "EQ-006", "Marcus Lee", "1 GDS", "2026-09-12", "2026-09-19", "2026-09-24"),
  loan(9, "EQ-008", "Siti Aminah", "9 DIV", "2026-09-20", "2026-09-27", "2026-09-26"),
  loan(10, "EQ-010", "Daniel Tan", "40 SAR", "2026-09-05", "2026-09-12", "2026-09-12"),
  loan(11, "EQ-012", "Ravi Kumar", "9 DIV", "2026-09-18", "2026-09-25", "2026-09-25"),
  loan(12, "EQ-004", "Nur Aini", "3 SIR", "2026-09-22", "2026-09-29", "2026-09-30"),
  loan(13, "EQ-015", "Chen Wei", "40 SAR", "2026-09-25", "2026-10-02", "2026-10-01"),
  loan(14, "EQ-017", "Siti Aminah", "9 DIV", "2026-10-01", "2026-10-08", "2026-10-06"),
  loan(15, "EQ-020", "Hafiz Ismail", "3 SIR", "2026-10-02", "2026-10-06"),
  loan(16, "EQ-031", "Priya Nair", "9 DIV", "2026-10-05", "2026-10-12"),
  loan(17, "EQ-021", "Jonathan Goh", "1 GDS", "2026-09-02", "2026-09-09", "2026-09-09"),
  loan(18, "EQ-022", "Farah Zain", "40 SAR", "2026-09-03", "2026-09-10", "2026-09-11"),
  loan(19, "EQ-023", "Kenneth Ong", "9 DIV", "2026-09-06", "2026-09-13", "2026-09-12"),
  loan(20, "EQ-025", "Hafiz Ismail", "3 SIR", "2026-08-28", "2026-09-04", "2026-09-04"),
  loan(21, "EQ-026", "Priya Nair", "9 DIV", "2026-08-30", "2026-09-06", "2026-09-08"),
  loan(22, "EQ-027", "Jonathan Goh", "1 GDS", "2026-09-08", "2026-09-15", "2026-09-14"),
  loan(23, "EQ-028", "Farah Zain", "40 SAR", "2026-09-11", "2026-09-18", "2026-09-18"),
  loan(24, "EQ-029", "Kenneth Ong", "9 DIV", "2026-09-14", "2026-09-21", "2026-09-22"),
  loan(25, "EQ-030", "Aisyah Rahman", "3 SIR", "2026-09-16", "2026-09-23", "2026-09-23"),
  loan(26, "EQ-032", "Daniel Tan", "40 SAR", "2026-09-19", "2026-09-26", "2026-09-25"),
  loan(27, "EQ-033", "Marcus Lee", "1 GDS", "2026-09-21", "2026-09-28", "2026-09-29"),
  loan(28, "EQ-034", "Ravi Kumar", "9 DIV", "2026-09-24", "2026-10-01", "2026-10-01"),
  loan(29, "EQ-035", "Chen Wei", "40 SAR", "2026-09-27", "2026-10-04", "2026-10-03"),
  loan(30, "EQ-036", "Siti Aminah", "9 DIV", "2026-10-01", "2026-10-08", "2026-10-07"),
  loan(31, "EQ-001", "Hafiz Ismail", "3 SIR", "2026-08-18", "2026-08-25", "2026-08-25"),
  loan(32, "EQ-003", "Priya Nair", "9 DIV", "2026-08-20", "2026-08-27", "2026-08-26"),
];

// An item with an unreturned loan is "On loan" (kept in sync here, once).
const openIds = new Set(LOANS.filter((l) => !l.returnedAt).map((l) => l.equipmentId));
export const EQUIPMENT = [...HAND_MADE, ...GENERATED].map((e) =>
  openIds.has(e.id) ? { ...e, status: "On loan" } : e,
);

export function loanStatus(l) {
  if (l.returnedAt) return "Returned";
  return dayjs(l.dueAt).isBefore(dayjs(TODAY), "day") ? "Overdue" : "Active";
}
