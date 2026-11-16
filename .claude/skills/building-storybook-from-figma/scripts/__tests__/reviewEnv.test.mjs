import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { envConvention, forConvention, namesRead, envKeys, diagnose } from "../reviewEnv.mjs";

const dirWith = (files) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "reviewenv-"));
  for (const [f, t] of Object.entries(files)) fs.writeFileSync(path.join(dir, f), t);
  return dir;
};
const TEMPLATE = "serviceUrl: import.meta.env.PUBLIC_REVIEW_SERVICE_URL,\nproject: import.meta.env.PUBLIC_REVIEW_PROJECT,\n";
const SWT_BUNDLER = 'define: { "process.env.REACT_APP_API_URL": JSON.stringify(process.env.REACT_APP_API_URL || "") }';

test("a bundler that defines process.env.REACT_APP_* one by one is the react-app-define convention", () => {
  assert.equal(envConvention(dirWith({ "rsbuild.config.js": SWT_BUNDLER })), "react-app-define");
});

test("no bundler config, or one without those defines, keeps the PUBLIC_ convention", () => {
  assert.equal(envConvention(dirWith({})), "public");
  assert.equal(envConvention(dirWith({ "rsbuild.config.js": "export default {};" })), "public");
});

test("the template is rewritten to the project's convention, and left alone for PUBLIC_", () => {
  assert.equal(forConvention(TEMPLATE, "public"), TEMPLATE);
  const out = forConvention(TEMPLATE, "react-app-define");
  assert.match(out, /serviceUrl: process\.env\.REACT_APP_REVIEW_SERVICE_URL,/);
  assert.match(out, /project: process\.env\.REACT_APP_REVIEW_PROJECT,/);
  assert.doesNotMatch(out, /PUBLIC_/);
});

test("namesRead lists the review settings a config reads, either way of reading", () => {
  assert.deepEqual(namesRead(TEMPLATE), ["PUBLIC_REVIEW_SERVICE_URL", "PUBLIC_REVIEW_PROJECT"]);
  assert.deepEqual(namesRead("a: process.env.REACT_APP_REVIEW_PROJECT, b: process.env.NODE_ENV"), ["REACT_APP_REVIEW_PROJECT"]);
});

test("envKeys reads the names of set variables from the .env files, never an empty one, never the example file", () => {
  const dir = dirWith({
    ".env": "REVIEW_API_KEY=secret\nPUBLIC_REVIEW_PROJECT=p\n# PUBLIC_REVIEW_SERVICE_URL=x\nEMPTY=\n",
    ".env.local": "export PUBLIC_REVIEW_SERVICE_URL=https://s\n",
    ".env.example": "PUBLIC_REVIEW_SERVICE_URL=\nONLY_IN_EXAMPLE=1\n",
  });
  const keys = envKeys(dir, {});
  assert.ok(keys.has("PUBLIC_REVIEW_PROJECT") && keys.has("PUBLIC_REVIEW_SERVICE_URL") && keys.has("REVIEW_API_KEY"));
  assert.ok(!keys.has("EMPTY") && !keys.has("ONLY_IN_EXAMPLE"));
});

test("envKeys also counts the process environment", () => {
  assert.ok(envKeys(dirWith({}), { PUBLIC_REVIEW_PROJECT: "p" }).has("PUBLIC_REVIEW_PROJECT"));
});

test("diagnose: the page reads REACT_APP_ names but only the dashboard's PUBLIC_ lines are set and the bundler does not map them", () => {
  const cfg = "a: process.env.REACT_APP_REVIEW_SERVICE_URL, b: process.env.REACT_APP_REVIEW_PROJECT";
  const keys = new Set(["PUBLIC_REVIEW_SERVICE_URL", "PUBLIC_REVIEW_PROJECT"]);
  const out = diagnose({ configText: cfg, keys, bundler: SWT_BUNDLER });
  assert.equal(out.length, 2);
  assert.match(out[0].found, /reads REACT_APP_REVIEW_SERVICE_URL.*PUBLIC_REVIEW_SERVICE_URL/s);
  assert.match(out[0].fix, /process\.env\.REACT_APP_REVIEW_SERVICE_URL \|\| process\.env\.PUBLIC_REVIEW_SERVICE_URL/);
});

test("diagnose: nothing to say when the bundler already maps the PUBLIC_ name to the one the page reads", () => {
  const cfg = "a: process.env.REACT_APP_REVIEW_SERVICE_URL, b: process.env.REACT_APP_REVIEW_PROJECT";
  const bundler = `${SWT_BUNDLER} "process.env.REACT_APP_REVIEW_SERVICE_URL": JSON.stringify(process.env.REACT_APP_REVIEW_SERVICE_URL || process.env.PUBLIC_REVIEW_SERVICE_URL || ""), "process.env.REACT_APP_REVIEW_PROJECT": JSON.stringify(process.env.REACT_APP_REVIEW_PROJECT || process.env.PUBLIC_REVIEW_PROJECT || "")`;
  const keys = new Set(["PUBLIC_REVIEW_SERVICE_URL", "PUBLIC_REVIEW_PROJECT"]);
  assert.deepEqual(diagnose({ configText: cfg, keys, bundler }), []);
});

test("diagnose: a name the page reads is set but the bundler never defines it", () => {
  const cfg = "a: process.env.REACT_APP_REVIEW_PROJECT";
  const out = diagnose({ configText: cfg, keys: new Set(["REACT_APP_REVIEW_PROJECT"]), bundler: SWT_BUNDLER });
  assert.equal(out.length, 1);
  assert.match(out[0].found, /not defined in the bundler config/);
});

test("diagnose: with no bundler config the define check is skipped (a create-react-app project exposes REACT_APP_ itself)", () => {
  const cfg = "a: process.env.REACT_APP_REVIEW_PROJECT";
  assert.deepEqual(diagnose({ configText: cfg, keys: new Set(["REACT_APP_REVIEW_PROJECT"]), bundler: "" }), []);
});

test("diagnose: import.meta.env names need no define, and a missing value says where to get it", () => {
  const ok = diagnose({ configText: TEMPLATE, keys: new Set(["PUBLIC_REVIEW_SERVICE_URL", "PUBLIC_REVIEW_PROJECT"]), bundler: "" });
  assert.deepEqual(ok, []);
  const missing = diagnose({ configText: TEMPLATE, keys: new Set(), bundler: "" });
  assert.equal(missing.length, 2);
  assert.match(missing[0].found, /PUBLIC_REVIEW_SERVICE_URL is not set/);
  assert.match(missing[0].fix, /dashboard/);
});

test("diagnose never repeats a value: only names appear", () => {
  const keys = new Set(["PUBLIC_REVIEW_PROJECT"]);
  const out = diagnose({ configText: "a: process.env.REACT_APP_REVIEW_PROJECT", keys, bundler: SWT_BUNDLER });
  assert.ok(out.every((o) => !/https?:|drp_/.test(`${o.found} ${o.fix}`)));
});
