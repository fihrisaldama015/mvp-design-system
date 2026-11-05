import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { listPageOf, probeText, routeTable, scanUsage } from "../usageScan.mjs";
import { DERIVED_STEP, usageFor } from "../usageCore.mjs";

const tmp = (files) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "usageroutes-"));
  for (const [name, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
    fs.writeFileSync(path.join(dir, name), text);
  }
  return dir;
};

// The shape of swt-fe: bare imports under src/ (baseUrl), named imports, lazy pages, routes in src/routes/, a config array.
const swtLike = () => tmp({
  "src/App.js": 'import AppRouter from "routes";\nexport default () => <AppRouter />;\n',
  "src/routes/index.js": [
    'import Layout from "layouts/layoutAdmin";',
    'import Home from "pages/home";',
    'import { Dash } from "pages/v2/dashboard";',
    'import userRoutes from "./user";',
    "export default function R() {",
    "  return (<Routes><Route element={<Layout />}>",
    '    <Route path="/" element={<Home />} />',
    '    <Route path="/v2" element={<Suspense fallback={null}><Dash /></Suspense>} />',
    '    <Route path="*" element={<Navigate to="/404" />} />',
    "  </Route></Routes>);",
    "}",
  ].join("\n"),
  "src/routes/user.js": [
    'import { lazy } from "react";',
    'const UserList = lazy(() => import("pages/user-list"));',
    "const Rank = React.lazy(",
    '  () => import("pages/rank"),',
    ");",
    "export default [",
    '  { path: "/users", component: UserList, name: "Users" },',
    '  { path: "/rank", element: <Suspense><Rank /></Suspense> },',
    '  { path: "/nothing", component: Missing },',
    "];",
  ].join("\n"),
  "src/layouts/layoutAdmin.js": "export default () => <Outlet />;\n",
  "src/pages/home/index.js": 'import Button from "components/button";\nexport default () => <Button kind="filled" />;\n',
  "src/pages/v2/dashboard/index.js": 'import { Select } from "components/select";\nexport const Dash = () => <Select searchable />;\n',
  "src/pages/user-list/index.js": 'import Button from "components/button";\nexport default () => <Button />;\n',
  "src/pages/rank/index.js": 'import { Select } from "components/select";\nexport default () => <Select />;\n',
  "src/components/button/index.js": "export default function Button() { return null; }\n",
  "src/components/select/index.js": "export const Select = () => null;\n",
});

test("routes in src/routes/ are read: JSX with named and bare imports, lazy pages and config arrays", () => {
  const { routes, report } = routeTable(swtLike());
  assert.deepEqual(routes.map((r) => r.path).sort(), ["/", "/rank", "/users", "/v2"]);
  assert.equal(report.blind, false);
  assert.deepEqual(report.files.map((f) => f.file).sort(), ["src/routes/index.js", "src/routes/user.js"]);
  const user = report.files.find((f) => f.file.endsWith("user.js"));
  assert.equal(user.pathKeys, 3);
  assert.equal(user.configRoutes, 2); // /nothing names a component that is not imported
});

test("the layout route reaches its children, and a Suspense wrapper does not hide the page", () => {
  const root = swtLike();
  const u = scanUsage(root);
  const select = u.components.Select;
  assert.deepEqual(select.map((x) => x.file).sort(), ["src/pages/rank/index.js", "src/pages/v2/dashboard/index.js"]);
  assert.deepEqual(select.find((x) => x.file.includes("dashboard")).routes.map((r) => r.path), ["/v2"]);
  assert.deepEqual(select.find((x) => x.file.includes("rank")).routes.map((r) => r.path), ["/rank"]); // lazy page in a config array
  assert.equal(select.find((x) => x.file.includes("dashboard")).attrs.searchable, true);
  assert.deepEqual(u.components.Button.map((x) => x.file).sort(), ["src/pages/home/index.js", "src/pages/user-list/index.js"]);
});

test("a page imported lazily from a page is followed", () => {
  const root = tmp({
    "src/routes/index.js": 'import Home from "pages/home";\nexport default () => <Route path="/" element={<Home />} />;\n',
    "src/pages/home/index.js": 'const Panel = lazy(() => import("./Panel"));\nexport default () => <Panel />;\n',
    "src/pages/home/Panel.js": 'import { Select } from "components/select";\nexport default () => <Select />;\n',
    "src/components/select/index.js": "export const Select = () => null;\n",
  });
  assert.equal(scanUsage(root).components.Select[0].file, "src/pages/home/Panel.js");
});

test("review.usage.routeFiles and aliases point the scanner to a project's own layout", () => {
  const root = tmp({
    "src/app/router.js": 'import Home from "@/screens/home";\nexport default () => <Route path="/" element={<Home />} />;\n',
    "src/screens/home.js": 'import { Select } from "components/select";\nexport default () => <Select />;\n',
    "src/components/select/index.js": "export const Select = () => null;\n",
  });
  assert.equal(scanUsage(root).routing.blind, true);
  assert.equal(Object.keys(scanUsage(root, { routeFiles: ["src/app/router.js"] }).components).length, 0); // "@/" is not an alias yet
  const u = scanUsage(root, { routeFiles: ["src/app/router.js"], aliases: { "@": "src" } });
  assert.equal(u.routing.blind, false);
  assert.equal(u.components.Select[0].routes[0].path, "/");
});

test("blind: no route read is said loudly with what to do; partial names the files", () => {
  const blind = scanUsage(tmp({ "src/main.js": "createRoot(el).render(<RouterProvider router={router} />);\n" }));
  assert.equal(blind.routing.blind, true);
  const text = probeText(blind.routing);
  assert.match(text, /BLIND/);
  assert.match(text, /routeFiles/);
  assert.match(text, /add an adapter/);
  const partial = probeText(routeTable(swtLike()).report);
  assert.match(partial, /PARTIAL: .*src\/routes\/user\.js/);
  assert.doesNotMatch(probeText({ files: [{ file: "a.js", jsxTags: 2, jsxRoutes: 2, pathKeys: 0, configRoutes: 0 }], routes: 2, blind: false }), /PARTIAL|BLIND/);
});

const withParams = () => tmp({
  "src/routes/index.js": [
    'import List from "pages/stations";',
    'import One from "pages/station";',
    'import Lane from "pages/lane";',
    'import Orphan from "pages/orphan";',
    "export default () => (<Routes>",
    '  <Route path="/stations" element={<List />} />',
    '  <Route path="/stations/:id" element={<One />} />',
    '  <Route path="/stations/:id/lane/:laneId" element={<Lane />} />',
    '  <Route path="/orphan/:id" element={<Orphan />} />',
    "</Routes>);",
  ].join("\n"),
  "src/pages/stations/index.js": "export default () => null;\n",
  "src/pages/station/index.js": 'import { Select } from "components/select";\nexport default () => <Select />;\n',
  "src/pages/lane/index.js": 'import { Select } from "components/select";\nexport default () => <Select />;\n',
  "src/pages/orphan/index.js": 'import { Select } from "components/select";\nexport default () => <Select />;\n',
  "src/components/select/index.js": "export const Select = () => null;\n",
});

test("a page with a parameter opens its list page and says to click a row; a sample path of the project wins", () => {
  const root = withParams();
  const u = scanUsage(root);
  const routes = Object.fromEntries(u.components.Select.flatMap((x) => x.routes).map((r) => [r.path, r]));
  assert.equal(routes["/stations/:id"].url, "/stations");
  assert.equal(routes["/stations/:id"].derived, true);
  assert.equal(routes["/stations/:id/lane/:laneId"].url, "/stations"); // the longest shorter path without a parameter
  assert.equal(routes["/orphan/:id"].url, null); // nothing above it: the project must give a sample
  assert.deepEqual(u.routing.noSample, ["/orphan/:id"]);
  const found = usageFor(u, "Select", { kind: "added-prop", prop: "x" });
  assert.deepEqual(found.routes.find((r) => r.path === "/stations/:id").steps, [DERIVED_STEP]);
  const own = scanUsage(root, { routeSamples: { "/stations/:id": "/stations/42" }, howToSee: { Select: { "/stations/:id": ["Click Edit."] } } });
  const r = usageFor(own, "Select", { kind: "added-prop", prop: "x" }).routes.find((x) => x.path === "/stations/:id");
  assert.equal(r.url, "/stations/42");
  assert.equal(r.derived, undefined);
  assert.deepEqual(r.steps, ["Click Edit."]);
});

test("listPageOf: the longest shorter route without a parameter, never the root", () => {
  const known = new Set(["/", "/a", "/a/b", "/a/b/:id"]);
  assert.equal(listPageOf("/a/b/:id", known), "/a/b");
  assert.equal(listPageOf("/a/b/:id/c/:d", known), "/a/b");
  assert.equal(listPageOf("/a/:id", known), "/a");
  assert.equal(listPageOf("/:id", known), null);
});
