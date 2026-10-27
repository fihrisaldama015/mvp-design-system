import test from "node:test";
import assert from "node:assert/strict";
import { publish, decide, markApplied, summary } from "../reviewLogic.mjs";

const T = "2026-10-16T00:00:00.000Z";
const body = { component: "Input - Single Select/Base", sourceHash: "h1", items: [{ id: "removed-prop:searchable", kind: "removed-prop", prop: "searchable" }],
  usage: { at: T, byItem: { "removed-prop:searchable": { count: 2, routes: ["/reservations", "/reservations/new"] } } } };

test("first publish is 201, pending, version 1, history has the count", () => {
  const r = publish(null, body, T);
  assert.equal(r.status, 201); assert.equal(r.doc.status, "pending"); assert.equal(r.doc.version, 1);
  assert.deepEqual(r.doc.usageHistory, [{ at: T, counts: { "removed-prop:searchable": 2 } }]);
});
test("same sourceHash keeps answers; new sourceHash drops them", () => {
  const d = decide(publish(null, body, T).doc, { answers: { "removed-prop:searchable": "follow-figma" }, version: 1, by: "Dina" }, T).doc;
  assert.equal(publish(d, body, T).doc.answers["removed-prop:searchable"], "follow-figma");
  assert.deepEqual(publish(d, { ...body, sourceHash: "h2" }, T).doc.answers, {});
});
test("keep-deprecated without migrateBy is 400", () => {
  const r = decide(publish(null, body, T).doc, { answers: { "removed-prop:searchable": "keep-deprecated" }, version: 1, by: "Dina" }, T);
  assert.equal(r.status, 400); assert.match(r.error, /migrate-by date/);
});
test("keep-deprecated with migrateBy is stored", () => {
  const r = decide(publish(null, body, T).doc, { answers: { "removed-prop:searchable": "keep-deprecated" }, migrateBy: { "removed-prop:searchable": "2026-12-01" }, version: 1, by: "Dina" }, T);
  assert.equal(r.doc.migrateBy["removed-prop:searchable"], "2026-12-01"); assert.equal(r.doc.status, "answered");
});
test("stale version is 409 with current", () => {
  const r = decide(publish(null, body, T).doc, { answers: {}, version: 7, by: "Dina" }, T);
  assert.equal(r.status, 409); assert.equal(r.current.version, 1);
});
test("previewUrl must be http(s)", () => {
  assert.equal(publish(null, { ...body, previewUrl: "javascript:alert(1)" }, T).status, 400);
});
test("applied doc refuses decisions", () => {
  const a = markApplied(publish(null, body, T).doc, T).doc;
  assert.equal(decide(a, { answers: {}, version: a.version, by: "Dina" }, T).status, 409);
});

test("previewUrl: https and localhost accepted; lookalikes and other schemes are 400", () => {
  for (const u of ["http://localhost:5002", "https://x.vercel.app", "http://localhost", "http://localhost/a"]) assert.equal(publish(null, { ...body, previewUrl: u }, T).ok, true, u);
  for (const u of ["http://localhost.evil.com", "http://localhost@evil.com", "javascript:alert(1)", "http://example.com"]) assert.equal(publish(null, { ...body, previewUrl: u }, T).status, 400, u);
});
test("publish without component says it is required", () => {
  assert.equal(publish(null, { ...body, component: "" }, T).error, "component is required.");
});
test("null answer clears the answer and migrateBy", () => {
  const id = "removed-prop:searchable";
  const d = decide(publish(null, body, T).doc, { answers: { [id]: "keep-deprecated" }, migrateBy: { [id]: "2026-12-01" }, version: 1, by: "Dina" }, T).doc;
  const r = decide(d, { answers: { [id]: null }, version: d.version, by: "Dina" }, T);
  assert.equal(r.doc.answers[id], undefined); assert.equal(r.doc.migrateBy[id], undefined); assert.equal(r.doc.status, "pending");
});
test("markApplied sets status applied, bumps version, audits", () => {
  const d = publish(null, body, T).doc;
  const a = markApplied(d, T);
  assert.equal(a.ok, true); assert.equal(a.doc.status, "applied"); assert.equal(a.doc.version, d.version + 1);
  assert.equal(a.doc.audit.at(-1).action, "applied");
});
test("usageHistory is capped at 50 and carried across a new cycle", () => {
  let d = null;
  for (let i = 0; i < 55; i++) d = publish(d, { ...body, usage: { at: `t${i}`, byItem: { x: { count: i } } } }, T).doc;
  assert.equal(d.usageHistory.length, 50); assert.equal(d.usageHistory[0].at, "t5"); assert.equal(d.usageHistory.at(-1).at, "t54");
  const n = publish(d, { ...body, sourceHash: "h2", usage: { at: "t55", byItem: { x: { count: 1 } } } }, T).doc;
  assert.equal(n.version, d.version + 1); assert.equal(n.usageHistory.length, 50); assert.equal(n.usageHistory.at(-1).at, "t55"); assert.equal(n.usageHistory[0].at, "t6");
});

test("audit entry carries the migrate-by date for keep-deprecated, changes stay id -> choice", () => {
  const id = "removed-prop:searchable";
  const r = decide(publish(null, body, T).doc, { answers: { [id]: "keep-deprecated" }, migrateBy: { [id]: "2026-12-01" }, version: 1, by: "Dina" }, T);
  const e = r.doc.audit.at(-1);
  assert.deepEqual(e.changes, { [id]: "keep-deprecated" });
  assert.deepEqual(e.migrateBy, { [id]: "2026-12-01" });
  const f = decide(publish(null, body, T).doc, { answers: { [id]: "follow-figma" }, version: 1, by: "Dina" }, T);
  assert.equal(f.doc.audit.at(-1).migrateBy, undefined);
});
test("a date-only change is a change: new audit entry, version bump", () => {
  const id = "removed-prop:searchable";
  const d = decide(publish(null, body, T).doc, { answers: { [id]: "keep-deprecated" }, migrateBy: { [id]: "2026-12-01" }, version: 1, by: "Dina" }, T).doc;
  const r = decide(d, { answers: { [id]: "keep-deprecated" }, migrateBy: { [id]: "2027-01-15" }, version: d.version, by: "Dina" }, T);
  assert.notEqual(r.doc, d);
  assert.equal(r.doc.version, d.version + 1);
  assert.equal(r.doc.migrateBy[id], "2027-01-15");
  assert.deepEqual(r.doc.audit.at(-1).migrateBy, { [id]: "2027-01-15" });
  // same choice and same date is still a no-op
  assert.equal(decide(r.doc, { answers: { [id]: "keep-deprecated" }, migrateBy: { [id]: "2027-01-15" }, version: r.doc.version, by: "Dina" }, T).doc, r.doc);
});

const ID = "removed-prop:searchable";
const fresh = () => publish(null, body, T).doc;
const answer = (extra = {}) => decide(fresh(), { answers: { [ID]: "follow-figma" }, version: 1, by: "Dina", ...extra }, T);

test("decide stores a trimmed note on the audit entry", () => {
  const r = answer({ note: "  Search moves to the toolbar.  " });
  assert.equal(r.ok, true);
  const last = r.doc.audit.at(-1);
  assert.equal(last.action, "decided");
  assert.equal(last.note, "Search moves to the toolbar.");
});
test("a note over 500 characters is 400", () => {
  const r = answer({ note: "x".repeat(501) });
  assert.equal(r.status, 400); assert.equal(r.error, "note must be at most 500 characters.");
  assert.equal(answer({ note: "x".repeat(500) }).ok, true);
});
test("a non-string note is 400", () => {
  for (const n of [5, {}, ["a"], true]) { const r = answer({ note: n }); assert.equal(r.status, 400); assert.equal(r.error, "note must be text."); }
});
test("an empty note adds no note key", () => {
  for (const n of [undefined, null, "", "   "]) assert.equal("note" in answer({ note: n }).doc.audit.at(-1), false);
});
test("a no-op decision ignores the note", () => {
  const d = answer().doc;
  const r = decide(d, { answers: { [ID]: "follow-figma" }, version: d.version, by: "Dina", note: "again" }, T);
  assert.equal(r.doc, d); assert.equal(r.doc.audit.length, d.audit.length);
});
test("summary reports answered, choices, lastDecision with note, deadline and usageCount", () => {
  const items = [{ id: "removed-prop:a", kind: "removed-prop", prop: "a" }, { id: "removed-option:b=x", kind: "removed-option", prop: "b", option: "x" }, { id: "removed-prop:c", kind: "removed-prop", prop: "c" }, { id: "added-prop:z", kind: "added-prop", prop: "z" }];
  const b = { component: "Alert", jsxName: "Alert", sourceHash: "h", items, usage: { at: T, byItem: { "removed-prop:a": { count: 2 }, "removed-option:b=x": { count: 3 }, "removed-prop:c": { count: 1 } } } };
  let d = publish(null, b, T).doc;
  d = decide(d, { answers: { "removed-prop:a": "keep-deprecated", "removed-option:b=x": "follow-figma" }, migrateBy: { "removed-prop:a": "2026-12-01" }, version: 1, by: "Dina", note: "Soon" }, "2026-10-17T00:00:00.000Z").doc;
  d = decide(d, { answers: { "removed-prop:c": "keep-deprecated" }, migrateBy: { "removed-prop:c": "2026-11-15" }, version: d.version, by: "Sam" }, "2026-10-18T00:00:00.000Z").doc;
  const s = summary(d);
  assert.equal(s.jsxName, "Alert"); assert.equal(s.answered, 3);
  assert.deepEqual(s.choices, ["follow-figma", "keep-deprecated"]);
  assert.deepEqual(s.lastDecision, { by: "Sam", at: "2026-10-18T00:00:00.000Z" });
  assert.equal(s.deadline, "2026-11-15"); assert.equal(s.usageCount, 6);
  assert.equal(s.removals, 3); assert.equal(s.additions, 1); assert.equal(s.slug, "alert");
  const withNote = decide(d, { answers: { "removed-prop:c": "follow-figma" }, version: d.version, by: "Kim", note: "ok" }, "2026-10-19T00:00:00.000Z").doc;
  assert.deepEqual(summary(withNote).lastDecision, { by: "Kim", at: "2026-10-19T00:00:00.000Z", note: "ok" });
});
test("summary of an old document has nulls and zeros, not errors", () => {
  const old = { component: "Old", status: "pending", items: [{ id: ID, kind: "removed-prop", prop: "searchable" }], answers: {}, audit: [{ at: T, by: "tool", action: "published" }], version: 1 };
  const s = summary(old);
  assert.equal(s.jsxName, null); assert.equal(s.answered, 0); assert.deepEqual(s.choices, []);
  assert.equal(s.lastDecision, null); assert.equal(s.deadline, null); assert.equal(s.usageCount, null); assert.equal(s.unanswered, 1);
  assert.doesNotThrow(() => summary({ component: "X", status: "pending", items: [], answers: {} }));
});
