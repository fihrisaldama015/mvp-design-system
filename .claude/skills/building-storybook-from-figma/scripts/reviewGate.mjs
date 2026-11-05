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

// May `reviewSync --plan` print a plan? Not when the usage scan skipped files: the plan would hide uses. -> { ok: true } | { ok: false, reason }
export function planGate(doc, usage) {
  if (!doc.jsxName) return { ok: false, reason: "This review has no component name; publish it again." };
  const warnings = usage?.warnings ?? [];
  const removals = (doc.items ?? []).filter((i) => i.kind.startsWith("removed"));
  if (removals.length && warnings.length) return { ok: false, reason: `Cannot count usage: the scan skipped ${warnings.length} file(s): ${warnings.join("; ")}. Fix them and run --plan again.` };
  return { ok: true };
}

/**
 * The review needs the candidate build (the branch where Figma's changes are applied, "figma-draft") when Figma ADDS something: the current
 * code does not have an added property or option, so only that build can show it. Returns the message to stop with, or null.
 * url: the address from --preview-url or from the project in the dashboard; allowNone: --no-preview (the developer chose to go without).
 */
export function previewNeeded(items, url, { allowNone = false } = {}) {
  const added = items.filter((i) => i.kind?.startsWith("added"));
  if (!added.length || url || allowNone) return null;
  return [
    `${added.length} item(s) are things Figma ADDS (${[...new Set(added.map((i) => i.prop))].slice(0, 4).join(", ")}${added.length > 4 ? ", ..." : ""}): the current code does not have them, so reviewers can only see them in a build with the Figma changes.`,
    "No candidate preview URL was found (not passed with --preview-url, and not set on the project in the review dashboard).",
    "Ask the developer to: 1. apply the Figma changes on a branch (figma-draft) and deploy it (Vercel gives the branch its own address) or run it locally,",
    "2. set its origin in the dashboard (the project's Settings, Candidate preview URL) or pass --preview-url https://<origin>, 3. run this again.",
    "To publish without it, pass --no-preview: the review page then says that no candidate preview exists.",
  ].join("\n");
}
