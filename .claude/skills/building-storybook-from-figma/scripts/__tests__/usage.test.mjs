import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scanUsage } from "../usageScan.mjs";
import { cleanHowToSee, usageFor } from "../usageCore.mjs";

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

// Second fixture: no semicolons, renamed imports, spreads, index routes, comments.
const root2 = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures/app2");
const sel = () => scanUsage(root2).components.Select ?? [];
const nameOf = (x) => x.attrs.name;

test("a default import under another name is recorded under the folder's component name", () => {
  const u = scanUsage(root2);
  assert.ok(!u.components.Sel);
  assert.ok(sel().some((x) => nameOf(x) === "landing"));
});
test("a renamed named import is recorded under the imported name (multi-line list, no semicolons)", () => {
  assert.ok(!scanUsage(root2).components.S);
  assert.ok(sel().some((x) => nameOf(x) === "literal"));
  assert.ok(scanUsage(root2).components.Button === undefined); // imported, never used
});
test("a spread is recorded as attrs['...'] = expr", () => {
  assert.equal(sel().find((x) => nameOf(x) === "spread").attrs["..."], "expr");
});
test("usageFor: a spread is a possible use for removed-prop and removed-option", () => {
  const u = { components: { Select: [{ file: "a", line: 1, attrs: { "...": "expr" }, routes: [{ path: "/a", url: "/a" }] }] } };
  assert.equal(usageFor(u, "Select", { kind: "removed-prop", prop: "searchable" }).count, 1);
  assert.equal(usageFor(u, "Select", { kind: "removed-option", prop: "variant", option: "old" }).count, 1);
});
test("usageFor: removed-option counts a non-literal value as a possible match", () => {
  const u = { components: { Select: [
    { file: "a", line: 1, attrs: { variant: "expr" }, routes: [] },
    { file: "b", line: 1, attrs: { variant: "new" }, routes: [] },
  ] } };
  assert.equal(usageFor(u, "Select", { kind: "removed-option", prop: "variant", option: "old" }).count, 1);
});
test("index routes take the parent's path, or / at the top", () => {
  const r = (n) => sel().find((x) => nameOf(x) === n).routes.map((x) => x.path);
  assert.deepEqual(r("landing"), ["/"]);
  assert.deepEqual(r("literal"), ["/shop"]);
});
test("tags inside JSX and JS comments are not counted; an apostrophe in text does not hide a tag", () => {
  const names = sel().map(nameOf);
  assert.ok(!names.includes("ghost-jsx") && !names.includes("ghost-line"));
  assert.ok(names.includes("landing") && names.includes("after-comment"));
  assert.equal(sel().find((x) => nameOf(x) === "after-comment").line, 14);
});

test("cleanHowToSee keeps valid steps (trimmed) and drops invalid entries with a reason", () => {
  const { clean, dropped } = cleanHowToSee({
    Alert: { "/reservations/new": ["  Open New reservation. ", "Pick the Recovery Strap Set."], "/bad/empty": [], "/bad/long": ["x".repeat(201)], "/bad/type": "text", "/bad/blank": ["ok", "  "] },
    Select: "nope",
    Many: { "/many": Array.from({ length: 9 }, (_, i) => `step ${i}`) },
  });
  assert.deepEqual(clean, { Alert: { "/reservations/new": ["Open New reservation.", "Pick the Recovery Strap Set."] } });
  assert.equal(dropped.length, 6);
  assert.ok(dropped.some((d) => d.startsWith("Alert /bad/long")));
  assert.ok(dropped.some((d) => d.startsWith("Select:")));
});

test("cleanHowToSee of nothing is empty and of a non-object is dropped whole", () => {
  assert.deepEqual(cleanHowToSee(undefined), { clean: {}, dropped: [] });
  assert.equal(cleanHowToSee(["a"]).dropped.length, 1);
  assert.deepEqual(cleanHowToSee(["a"]).clean, {});
});

test("usageFor puts the steps of a component on the route they belong to, and only there", () => {
  const usage = {
    howToSee: { Select: { "/reservations/new": ["Fill in step 1."] } },
    components: { Select: [
      { file: "a.js", line: 1, attrs: { searchable: true }, routes: [{ path: "/reservations", url: "/reservations" }] },
      { file: "b.js", line: 2, attrs: { searchable: true }, routes: [{ path: "/reservations/new", url: "/reservations/new" }] },
    ] },
  };
  const found = usageFor(usage, "Select", { kind: "removed-prop", prop: "searchable" });
  assert.deepEqual(found.routes, [{ path: "/reservations", url: "/reservations" }, { path: "/reservations/new", url: "/reservations/new", steps: ["Fill in step 1."] }]);
});

test("usageFor without steps keeps the route shape, and a component named like an object member is safe", () => {
  const usage = { howToSee: {}, components: { constructor: [{ file: "a.js", line: 1, attrs: { x: true }, routes: [{ path: "/p", url: "/p" }] }] } };
  assert.deepEqual(usageFor(usage, "constructor", { kind: "removed-prop", prop: "x" }).routes, [{ path: "/p", url: "/p" }]);
  assert.deepEqual(usageFor({ components: { A: [{ file: "a.js", line: 1, attrs: { x: true }, routes: [{ path: "/p", url: "/p" }] }] } }, "A", { kind: "removed-prop", prop: "x" }).routes, [{ path: "/p", url: "/p" }]);
});

test("scanUsage carries the cleaned steps into the usage and leaves the key out when there are none", () => {
  const withSteps = scanUsage(root, { howToSee: { Select: { "/reservations": ["Open the list."] } } });
  assert.deepEqual(withSteps.howToSee, { Select: { "/reservations": ["Open the list."] } });
  assert.equal("howToSee" in scanUsage(root), false);
});
