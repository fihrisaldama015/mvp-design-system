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
