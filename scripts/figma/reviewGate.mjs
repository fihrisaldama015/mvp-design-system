// The gates of `reviewSync --done`: may a review be marked applied? Pure: takes the stored document and a fresh usage scan
// (usageScan.scanUsage) and says yes or why not. The service enforces the same status rules on its side (409).
import { usageFor } from "./usageCore.mjs";

const label = (i) => (i.option !== undefined ? `${i.prop}=${i.option}` : i.prop);

// -> { ok: true, burnDown: [{ id, prop, before, now, migrateBy }] } | { ok: false, reason }
export function doneGate(doc, usage) {
  if (doc.status === "pending") return { ok: false, reason: `"${doc.component}" still has unanswered removals: do not apply or close it.` };
  if (!doc.jsxName) return { ok: false, reason: "This review has no component name; publish it again." };
  const burnDown = [];
  const removals = (doc.items ?? []).filter((i) => i.kind.startsWith("removed"));
  for (const i of removals) {
    if (doc.answers?.[i.id] === "keep") return { ok: false, reason: `Waiting for Figma: "${label(i)}" was kept, so the design changes first. Publish again after Figma is updated.` };
  }
  const warnings = usage?.warnings ?? [];
  if (removals.length && warnings.length) return { ok: false, reason: `Cannot count usage: the scan skipped ${warnings.length} file(s): ${warnings.join("; ")}. Fix them and run --done again.` };
  for (const i of removals) {
    const choice = doc.answers?.[i.id];
    const now = usageFor(usage, doc.jsxName, i);
    if (choice === "follow-figma" && now.count > 0) {
      const where = now.routes.length ? `: ${now.routes.map((r) => r.path).join(", ")}` : ` (not on a routed page: ${now.uses.map((u) => `${u.file}:${u.line}`).join(", ")})`;
      return { ok: false, reason: `"${label(i)}" still used in ${now.count} place(s) on ${now.routes.length} page(s)${where}. Migrate them first.` };
    }
    if (choice === "keep-deprecated") {
      const migrateBy = doc.migrateBy?.[i.id];
      if (!migrateBy) return { ok: false, reason: `"${label(i)}" is kept as deprecated but has no migrate-by date. Ask the reviewers to choose one.` };
      burnDown.push({ id: i.id, prop: label(i), before: doc.usage?.byItem?.[i.id]?.count ?? null, now: now.count, migrateBy });
    }
  }
  return { ok: true, burnDown };
}
