import test from "node:test";
import assert from "node:assert/strict";
import { publish, decide, markApplied } from "../reviewLogic.mjs";

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
