import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scanUsage } from "../usageScan.mjs";
import { usageFor } from "../usageCore.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures/app");
const urls = (uses) => uses.flatMap((u) => u.routes.map((r) => r.path));

test("finds Select on both reservation routes", () => {
  const u = scanUsage(root);
  const paths = new Set(urls(u.components.Select));
  assert.ok(paths.has("/reservations") && paths.has("/reservations/new"));
  const first = u.components.Select.find((x) => x.file.endsWith("Reservations.js"));
  assert.deepEqual(first.attrs, { name: "item", searchable: true, options: "expr" });
  assert.equal(first.line, 7);
  assert.equal(u.components.Button[0].attrs.onClick, "expr");
});
test("review route is excluded", () => {
  const u = scanUsage(root);
  assert.ok(!urls(u.components.Select).includes("/review"));
  assert.ok(!u.components.Select.some((x) => x.file.endsWith("Review.js")));
});
test("param route without sample has no url", () => {
  const r = urls(scanUsage(root).components.Select);
  assert.ok(r.includes("/loans/:id"));
  const route = scanUsage(root).components.Select.flatMap((x) => x.routes).find((x) => x.path === "/loans/:id");
  assert.equal(route.url, null);
});
test("param route with sample has its url", () => {
  const route = scanUsage(root, { routeSamples: { "/loans/:id": "/loans/1" } }).components.Select.flatMap((x) => x.routes).find((x) => x.path === "/loans/:id");
  assert.equal(route.url, "/loans/1");
});
test("layout usage reaches every child route", () => {
  const t = scanUsage(root).components.Tooltip;
  assert.deepEqual(t[0].routes.map((r) => r.path).sort(), ["/loans/:id", "/reservations", "/reservations/new"]);
  assert.equal(t[0].routes.find((r) => r.path === "/reservations").url, "/reservations");
});
test("a file imported by a page is attributed to that page's route", () => {
  const picker = scanUsage(root).components.Select.find((x) => x.file.endsWith("Picker.js"));
  assert.deepEqual(picker.routes.map((r) => r.path), ["/reservations/new"]);
});

const usage = { components: { Select: [
  { file: "a", line: 1, attrs: { searchable: true }, routes: [{ path: "/a", url: "/a" }] },
  { file: "b", line: 1, attrs: { searchable: false }, routes: [{ path: "/b", url: "/b" }] },
  { file: "c", line: 1, attrs: {}, routes: [{ path: "/a", url: "/a" }, { path: "/c", url: null }] },
  { file: "d", line: 1, attrs: { size: "sm" }, routes: [{ path: "/d", url: "/d" }] },
] } };
test("usageFor: onByDefault counts uses that do not pass false", () => {
  const r = usageFor(usage, "Select", { kind: "removed-prop", prop: "searchable", onByDefault: true });
  assert.equal(r.count, 3);
  assert.deepEqual(r.routes.map((x) => x.path), ["/a", "/c", "/d"]);
});
test("usageFor: removed-prop without default needs the prop passed and not false", () => {
  assert.equal(usageFor(usage, "Select", { kind: "removed-prop", prop: "searchable" }).count, 1);
});
test("usageFor: removed-option matches the literal value", () => {
  const r = usageFor(usage, "Select", { kind: "removed-option", prop: "size", option: "sm" });
  assert.equal(r.count, 1); assert.equal(r.uses[0].file, "d");
});
test("usageFor: other kinds count every use; unknown component is empty", () => {
  assert.equal(usageFor(usage, "Select", { kind: "removed-component" }).count, 4);
  assert.deepEqual(usageFor(usage, "Nope", { kind: "x" }), { count: 0, routes: [], uses: [] });
});
