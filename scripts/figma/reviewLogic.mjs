// Pure review rules. Copied verbatim into design-review/server/src/reviewLogic.mjs; change both.
// No imports, no I/O: every function takes the current document and an ISO time `at`, and returns
//   { ok: true, status: 200|201, doc } | { ok: false, status: 400|409, error, current? }
export const CHOICES = ["follow-figma", "keep-deprecated", "keep"];
export const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const removals = (d) => d.items.filter((i) => i.kind.startsWith("removed"));
const unanswered = (d) => removals(d).filter((i) => !d.answers?.[i.id]).map((i) => i.id);
export const statusOf = (d) => (d.status === "applied" ? "applied" : unanswered(d).length ? "pending" : "answered");
// The audit entries of the current Figma cycle: after the last "published..." or "Figma changed..." entry ("republished" is not a marker).
export function currentCycleAudit(audit) {
  const a = Array.isArray(audit) ? audit : [];
  let at = -1;
  a.forEach((e, n) => { if (/^(published|Figma changed)/.test(String(e?.action ?? ""))) at = n; });
  return a.slice(at + 1);
}
const decisions = (d) => currentCycleAudit(d.audit).filter((a) => a.action === "decided");
const answeredIds = (d) => removals(d).filter((i) => d.answers?.[i.id]).map((i) => i.id);
function lastDecision(d) {
  const a = decisions(d).at(-1);
  return a ? { by: a.by, at: a.at, ...(a.note ? { note: a.note } : {}) } : null;
}
function deadline(d) {
  const dates = removals(d).filter((i) => d.answers?.[i.id] === "keep-deprecated").map((i) => d.migrateBy?.[i.id]).filter((x) => typeof x === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x)).sort();
  return dates[0] ?? null;
}
function usageCount(d) {
  const by = d.usage?.byItem;
  return by && typeof by === "object" ? removals(d).reduce((n, i) => n + (Number(by[i.id]?.count) || 0), 0) : null;
}
export const summary = (d) => ({ slug: slug(d.component), component: d.component, status: d.status, removals: removals(d).length, unanswered: unanswered(d).length, additions: d.items.length - removals(d).length, figmaNode: d.figmaNode, readAt: d.readAt, updatedAt: d.updatedAt, version: d.version,
  jsxName: d.jsxName ?? null, answered: answeredIds(d).length, choices: [...new Set(answeredIds(d).map((id) => d.answers?.[id]))].sort(), lastDecision: lastDecision(d), deadline: deadline(d), usageCount: usageCount(d) });

const fail = (status, error, extra = {}) => ({ ok: false, status, error, ...extra });
const done = (doc, status = 200) => ({ ok: true, status, doc });
const HISTORY_MAX = 50;
const PREVIEW = /^(https:\/\/\S|http:\/\/localhost(?:[:/?#]|$))/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const NOTE_MAX = 500;

export function publish(prev, body, at) {
  const b = body ?? {};
  if (!b.component) return fail(400, "component is required.");
  if (!Array.isArray(b.items) || !b.sourceHash) return fail(400, "items (array) and sourceHash are required.");
  if (b.previewUrl != null && !(typeof b.previewUrl === "string" && PREVIEW.test(b.previewUrl))) return fail(400, "previewUrl must start with https:// or http://localhost.");
  const base = { component: b.component, jsxName: b.jsxName ?? null, storybookUrl: b.storybookUrl ?? null, storyId: b.storyId ?? null, figmaFileKey: b.figmaFileKey ?? null, figmaNode: b.figmaNode ?? null, figmaPage: b.figmaPage ?? null, code: b.code ?? null, readAt: b.readAt ?? null, sourceHash: b.sourceHash, items: b.items, usage: b.usage ?? null, previewUrl: b.previewUrl ?? null };
  let usageHistory = prev?.usageHistory ?? [];
  if (b.usage?.byItem && typeof b.usage.byItem === "object") {
    const counts = Object.fromEntries(Object.entries(b.usage.byItem).map(([id, u]) => [id, Number(u?.count ?? 0)]));
    usageHistory = [...usageHistory, { at: b.usage.at ?? at, counts }].slice(-HISTORY_MAX);
  }
  let next;
  if (prev && prev.sourceHash === b.sourceHash && prev.status !== "applied") {
    next = { ...prev, ...base, usageHistory, updatedAt: at, audit: [...prev.audit, { at, by: "tool", action: "republished (same Figma state, answers kept)" }] };
  } else {
    const why = !prev ? "published" : prev.status === "applied" ? "published (new cycle)" : "Figma changed: earlier answers dropped";
    next = { ...base, answers: {}, migrateBy: {}, status: "pending", version: (prev?.version ?? 0) + 1, createdAt: prev?.createdAt ?? at, updatedAt: at, usageHistory, audit: [...(prev?.audit ?? []), { at, by: "tool", action: why }] };
  }
  next.status = statusOf(next);
  return done(next, prev ? 200 : 201);
}

export function decide(doc, { answers, migrateBy = {}, version, by, note } = {}, at) {
  if (typeof by !== "string" || !by.trim() || by.length > 80) return fail(400, "reviewer (a name, up to 80 characters) is required.");
  if (!answers || typeof answers !== "object") return fail(400, "answers must be an object { itemId: choice }.");
  if (note != null && typeof note !== "string") return fail(400, "note must be text.");
  const text = (note ?? "").trim();
  if (text.length > NOTE_MAX) return fail(400, `note must be at most ${NOTE_MAX} characters.`);
  if (doc.status === "applied") return fail(409, "This review was already applied.", { current: doc });
  if (version !== doc.version) return fail(409, "Someone else changed this review. Reload and check before saving.", { current: doc });
  const valid = new Set(removals(doc).map((i) => i.id));
  for (const [id, choice] of Object.entries(answers)) {
    if (!valid.has(id)) return fail(400, `Unknown item "${id}": only removals need an answer.`);
    if (choice !== null && !CHOICES.includes(choice)) return fail(400, `Choice for "${id}" must be one of ${CHOICES.join(", ")}.`);
    if (choice === "keep-deprecated" && !DATE.test(String(migrateBy?.[id] ?? ""))) return fail(400, `Choose a migrate-by date for "${id}".`);
  }
  const merged = { ...doc.answers };
  const dates = { ...(doc.migrateBy ?? {}) };
  const changes = {};
  const changedDates = {};
  for (const [id, choice] of Object.entries(answers)) {
    if (choice === null) {
      if (merged[id]) { delete merged[id]; changes[id] = null; }
      delete dates[id];
    } else {
      if (merged[id] !== choice || (choice === "keep-deprecated" && dates[id] !== migrateBy[id])) { changes[id] = choice; if (choice === "keep-deprecated") changedDates[id] = migrateBy[id]; }
      merged[id] = choice;
      if (choice === "keep-deprecated") dates[id] = migrateBy[id]; else delete dates[id];
    }
  }
  if (!Object.keys(changes).length) return done(doc);
  const next = { ...doc, answers: merged, migrateBy: dates, version: doc.version + 1, updatedAt: at, audit: [...doc.audit, { at, by: by.trim(), action: "decided", changes, ...(text ? { note: text } : {}), ...(Object.keys(changedDates).length ? { migrateBy: changedDates } : {}) }] };
  next.status = statusOf(next);
  return done(next);
}

export function markApplied(doc, at) {
  return done({ ...doc, status: "applied", version: doc.version + 1, updatedAt: at, audit: [...doc.audit, { at, by: "tool", action: "applied" }] });
}
