import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { install, mergeIgnore, mergeScripts } from "../install.mjs";

const SKILL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const project = (pkg, extra = {}) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "install-"));
  fs.writeFileSync(path.join(dir, "package.json"), typeof pkg === "string" ? pkg : JSON.stringify(pkg, null, 2) + "\n");
  for (const [f, t] of Object.entries(extra)) fs.writeFileSync(path.join(dir, f), t);
  return dir;
};
const read = (dir, f) => fs.readFileSync(path.join(dir, f), "utf8");

test("a fresh project gets the skill, the runnable scripts (no tests), the config, npm scripts and ignore lines", () => {
  const dir = project({ name: "swt", scripts: { start: "x", test: "jest" } });
  const r = install({ target: dir, from: SKILL });
  assert.ok(fs.existsSync(path.join(dir, ".claude/skills/building-storybook-from-figma/SKILL.md")));
  assert.ok(fs.existsSync(path.join(dir, "scripts/figma/reviewSync.mjs")));
  assert.ok(fs.existsSync(path.join(dir, "scripts/figma/plugin/selfTest.js")));
  assert.ok(!fs.existsSync(path.join(dir, "scripts/figma/__tests__")));
  assert.ok(!fs.existsSync(path.join(dir, ".claude/skills/building-storybook-from-figma/scripts/__tests__"))); // a project's jest would run the fixtures
  assert.ok(fs.existsSync(path.join(dir, "figma-tokens.config.json")));
  const pkg = JSON.parse(read(dir, "package.json"));
  assert.equal(pkg.scripts.start, "x");
  assert.equal(pkg.scripts.test, "jest");
  assert.equal(pkg.scripts.doctor, "node scripts/figma/doctor.mjs");
  assert.equal(pkg.scripts.predev, undefined); // build hooks only on request
  assert.match(read(dir, ".gitignore"), /\.figma-dump\nsrc\/review-kit\/usage\.json\n/);
  assert.equal(r.changed, true);
  assert.ok(r.notes.some((n) => /--build-hooks/.test(n)));
  for (const f of ["ReviewPage.js", "ui.js", "kit.css", "index.js", "review.config.js", "usage.json", "usageCore.js"]) assert.ok(fs.existsSync(path.join(dir, "src/review-kit", f)), f);
  assert.deepEqual(JSON.parse(read(dir, "src/review-kit/usage.json")).components, {}); // empty until `npm run usage`
});

test("running it again changes nothing, and --check/dry run write nothing", () => {
  const dir = project({ name: "x" });
  install({ target: dir, from: SKILL });
  const again = install({ target: dir, from: SKILL });
  assert.equal(again.changed, false);
  const dir2 = project({ name: "y" });
  const dry = install({ target: dir2, from: SKILL, write: false });
  assert.equal(dry.changed, true);
  assert.ok(!fs.existsSync(path.join(dir2, "scripts")));
  assert.ok(!fs.existsSync(path.join(dir2, ".gitignore")));
  assert.equal(JSON.parse(read(dir2, "package.json")).scripts, undefined);
});

test("drift in a copied script is found by --check and repaired by install", () => {
  const dir = project({ name: "x" });
  install({ target: dir, from: SKILL });
  fs.appendFileSync(path.join(dir, "scripts/figma/usageScan.mjs"), "\n// edited\n");
  const r = install({ target: dir, from: SKILL, write: false });
  assert.deepEqual(r.actions.map((a) => a.file), ["scripts/figma/usageScan.mjs"].map((f) => path.relative(process.cwd(), path.join(dir, f))));
  install({ target: dir, from: SKILL });
  assert.equal(install({ target: dir, from: SKILL, write: false }).changed, false);
});

test("the project's own config, scripts and ignore lines are never replaced", () => {
  const dir = project({ name: "x", scripts: { doctor: "node my-doctor.js" } }, { "figma-tokens.config.json": '{"mine":true}\n', ".gitignore": "node_modules\n.figma-dump" });
  const r = install({ target: dir, from: SKILL });
  assert.equal(read(dir, "figma-tokens.config.json"), '{"mine":true}\n');
  assert.equal(JSON.parse(read(dir, "package.json")).scripts.doctor, "node my-doctor.js");
  assert.ok(r.conflicts.some((c) => /scripts\.doctor/.test(c)));
  assert.equal(read(dir, ".gitignore"), "node_modules\n.figma-dump\n\n# design review (skill building-storybook-from-figma)\nsrc/review-kit/usage.json\n");
});

test("--build-hooks chains after predev/prebuild instead of replacing them, once", () => {
  const m = mergeScripts(JSON.stringify({ scripts: { predev: "node gen.js", prebuild: "npm run usage" } }), { buildHooks: true });
  const s = JSON.parse(m.text).scripts;
  assert.equal(s.predev, "node gen.js && npm run usage");
  assert.equal(s.prebuild, "npm run usage");
  assert.equal(JSON.parse(mergeScripts(m.text, { buildHooks: true }).text).scripts.predev, "node gen.js && npm run usage");
  assert.equal(mergeScripts('{"name":"a"}', { buildHooks: true }).changes.includes("scripts.predev"), true);
});

test("package.json keeps its indent (tabs, 4 spaces) and a project without package.json is an error", () => {
  assert.match(mergeScripts('{\n\t"name": "a"\n}\n').text, /^\{\n\t"name"/);
  assert.match(mergeScripts('{\n    "name": "a"\n}\n').text, /^\{\n    "name"/);
  assert.throws(() => install({ target: fs.mkdtempSync(path.join(os.tmpdir(), "install-")), from: SKILL }), /no package\.json/);
  assert.equal(mergeIgnore(".figma-dump\nsrc/review-kit/usage.json\n").missing.length, 0);
});

test("a project that already holds the skill (mvp) only gets its runnable copy checked", () => {
  const dir = project({ name: "x" });
  install({ target: dir, from: SKILL });
  const r = install({ target: dir }); // no --from: finds the skill in the project
  assert.equal(r.changed, false);
});

test("the kit is replaced on every run, but review.config.js belongs to the project; --no-kit and --kit-dir", () => {
  const dir = project({ name: "x" });
  install({ target: dir, from: SKILL });
  fs.writeFileSync(path.join(dir, "src/review-kit/review.config.js"), "// mine\n");
  fs.appendFileSync(path.join(dir, "src/review-kit/kit.css"), "/* edited */");
  const r = install({ target: dir, from: SKILL });
  assert.deepEqual(r.actions.map((a) => path.basename(a.file)), ["kit.css"]);
  assert.equal(read(dir, "src/review-kit/review.config.js"), "// mine\n");
  const none = project({ name: "n" });
  install({ target: none, from: SKILL, kit: false });
  assert.ok(!fs.existsSync(path.join(none, "src/review-kit")));
  const other = project({ name: "o" });
  install({ target: other, from: SKILL, kitDir: "src/features/review" });
  assert.ok(fs.existsSync(path.join(other, "src/features/review/ReviewPage.js")));
});

test("a project that defines process.env.REACT_APP_* in its bundler gets a review.config.js that reads them that way, and a note for the define", () => {
  const dir = project({ name: "swt" }, { "rsbuild.config.js": 'export default { source: { define: { "process.env.REACT_APP_API_URL": JSON.stringify(process.env.REACT_APP_API_URL || "") } } };' });
  const r = install({ target: dir, from: SKILL });
  const cfg = read(dir, "src/review-kit/review.config.js");
  assert.match(cfg, /serviceUrl: process\.env\.REACT_APP_REVIEW_SERVICE_URL,/);
  assert.match(cfg, /project: process\.env\.REACT_APP_REVIEW_PROJECT,/);
  assert.doesNotMatch(cfg, /import\.meta\.env\.PUBLIC_/);
  const note = r.notes.find((n) => /REACT_APP_/.test(n));
  assert.ok(note, "a note says to add the define");
  assert.match(note, /process\.env\.REACT_APP_REVIEW_PROJECT \|\| process\.env\.PUBLIC_REVIEW_PROJECT/);
});

test("no note about the define when the bundler already has it, and a plain project keeps the PUBLIC_ reads", () => {
  const defined = ["SERVICE_URL", "PROJECT"].map((k) => `"process.env.REACT_APP_REVIEW_${k}": 1`).join(", ");
  const dir = project({ name: "swt" }, { "rsbuild.config.js": `export default { source: { define: { "process.env.REACT_APP_API_URL": 1, ${defined} } } };` });
  assert.ok(!install({ target: dir, from: SKILL }).notes.some((n) => /REACT_APP_/.test(n)));
  const plain = project({ name: "other" });
  install({ target: plain, from: SKILL });
  assert.match(read(plain, "src/review-kit/review.config.js"), /import\.meta\.env\.PUBLIC_REVIEW_SERVICE_URL/);
});
