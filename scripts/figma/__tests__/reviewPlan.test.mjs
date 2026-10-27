import test from "node:test";
import assert from "node:assert/strict";
import { buildPlan, planText } from "../reviewPlan.mjs";

const doc = (items, answers = {}, extra = {}) => ({ component: "Alert", jsxName: "Alert", code: "src/components/alert/index.js", status: "answered", version: 3, items, answers, migrateBy: {}, audit: [], ...extra });
const prop = { id: "removed-prop:dismissible", kind: "removed-prop", prop: "dismissible", deprecated: false };
const opt = { id: "removed-option:kind=outlined", kind: "removed-option", prop: "kind", option: "outlined" };
const use = (file, line) => ({ file, line, attrs: {} });
const usage = { [prop.id]: { count: 2, routes: [], uses: [use("src/pages/A.js", 10), use("src/pages/B.js", 22)] }, [opt.id]: { count: 1, routes: [], uses: [use("src/pages/C.js", 5)] } };
const step = (p, id) => p.steps.find((s) => s.id === id);

test("buildPlan follow-figma removed-prop lists the component edit, one edit per use, usage and done", () => {
  const p = buildPlan(doc([prop], { [prop.id]: "follow-figma" }), usage);
  const s = step(p, prop.id);
  assert.equal(s.kind, "follow-figma"); assert.equal(s.choice, "follow-figma");
  const edits = s.actions.filter((a) => a.type === "edit");
  assert.equal(edits.length, 3);
  assert.equal(edits[0].file, "src/components/alert/index.js");
  assert.match(edits[0].text, /remove `dismissible` from propTypes and from the component/);
  assert.match(edits[0].text, /dev repo/);
  assert.deepEqual(edits.slice(1).map((a) => [a.file, a.line]), [["src/pages/A.js", 10], ["src/pages/B.js", 22]]);
  assert.match(edits[1].text, /remove the `dismissible` attribute/);
  const runs = s.actions.filter((a) => a.type === "run");
  assert.equal(runs[0].text, "npm run usage (must report 0 uses)");
  assert.match(runs[1].text, /reviewSync\.mjs --done "Alert"/);
  assert.equal(p.component, "Alert"); assert.equal(p.status, "answered"); assert.equal(p.version, 3);
});
test("buildPlan follow-figma removed-option edits each use", () => {
  const s = step(buildPlan(doc([opt], { [opt.id]: "follow-figma" }), usage), opt.id);
  assert.equal(s.actions.filter((a) => a.type === "edit").length, 1);
  assert.match(s.actions[0].text, /kind="outlined" is no longer in Figma: use one of the remaining options/);
  assert.equal(s.actions[0].file, "src/pages/C.js"); assert.equal(s.actions[0].line, 5);
});
test("buildPlan keep-deprecated lists deadline and remaining uses and a deprecated edit only when not deprecated", () => {
  const d = doc([prop], { [prop.id]: "keep-deprecated" }, { migrateBy: { [prop.id]: "2026-12-01" } });
  const s = step(buildPlan(d, usage), prop.id);
  assert.equal(s.kind, "keep-deprecated");
  assert.equal(s.actions[0].type, "edit"); assert.match(s.actions[0].text, /start the propTypes description of `dismissible` with `@deprecated`/);
  const wait = s.actions.find((a) => a.type === "wait");
  assert.match(wait.text, /2026-12-01/); assert.match(wait.text, /src\/pages\/A\.js:10/); assert.match(wait.text, /src\/pages\/B\.js:22/);
  assert.equal(s.actions.at(-1).type, "run"); assert.match(s.actions.at(-1).text, /--done/);
  const dep = doc([{ ...prop, deprecated: true }], { [prop.id]: "keep-deprecated" }, { migrateBy: { [prop.id]: "2026-12-01" } });
  assert.equal(step(buildPlan(dep, usage), prop.id).actions.some((a) => a.type === "edit"), false);
  const none = doc([prop], { [prop.id]: "keep-deprecated" });
  assert.doesNotThrow(() => planText(buildPlan(none, usage)));
  assert.match(step(buildPlan(none, usage), prop.id).actions.find((a) => a.type === "wait").text, /no valid migrate-by date/);
});
test("buildPlan keep is a single wait", () => {
  const s = step(buildPlan(doc([prop], { [prop.id]: "keep" }), usage), prop.id);
  assert.equal(s.kind, "keep"); assert.equal(s.actions.length, 1); assert.equal(s.actions[0].type, "wait");
  assert.match(s.actions[0].text, /Figma changes first: do not change code; publish again after the design is updated/);
});
test("buildPlan unanswered is a wait", () => {
  const s = step(buildPlan(doc([prop], {}, { status: "pending" }), usage), prop.id);
  assert.equal(s.kind, "unanswered"); assert.equal(s.choice, null); assert.deepEqual(s.actions.map((a) => a.type), ["wait"]);
});
test("buildPlan copies the note and keeps items order, with safe additions", () => {
  const added = { id: "added-prop:size", kind: "added-prop", prop: "size" };
  const d = doc([added, prop], { [prop.id]: "follow-figma" }, { audit: [{ at: "t", by: "Dina", action: "decided", changes: { [prop.id]: "follow-figma" }, note: "Search moved" }, { at: "t2", by: "Sam", action: "decided", changes: {} }] });
  const p = buildPlan(d, usage);
  assert.deepEqual(p.steps.map((s) => s.id), [added.id, prop.id]);
  assert.equal(p.steps[0].kind, "safe-addition"); assert.match(p.steps[0].actions[0].text, /reference\/existing-component\.md/);
  assert.equal(p.steps[1].note, "Search moved"); assert.equal("note" in p.steps[0], false);
  assert.equal(p.finalChecks.length, 4);
  assert.match(p.finalChecks.at(-1), /--done "Alert"/);
});
test("planText mentions every file:line", () => {
  const p = buildPlan(doc([prop, opt], { [prop.id]: "follow-figma", [opt.id]: "follow-figma" }), usage);
  const t = planText(p);
  for (const f of ["src/pages/A.js:10", "src/pages/B.js:22", "src/pages/C.js:5", "src/components/alert/index.js"]) assert.ok(t.includes(f), f);
  assert.match(t, /Alert/);
});
