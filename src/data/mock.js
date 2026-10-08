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

export const EQUIPMENT = [
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

const loan = (n, equipmentId, borrower, unit, loanedAt, dueAt, returnedAt = null) => ({
  id: `L-${String(n).padStart(3, "0")}`,
  equipmentId,
  borrower,
  unit,
  loanedAt,
  dueAt,
  returnedAt,
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
];

export function loanStatus(l) {
  if (l.returnedAt) return "Returned";
  return dayjs(l.dueAt).isBefore(dayjs(TODAY), "day") ? "Overdue" : "Active";
}
