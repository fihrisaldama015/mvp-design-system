import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { checkLock, designSystemFiles, pullUi } from "../pullUi.mjs";

const CHECK = fileURLToPath(new URL("../check.mjs", import.meta.url));

const mk = (files) => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "ui-"));
  for (const [f, c] of Object.entries(files)) { fs.mkdirSync(path.dirname(path.join(d, f)), { recursive: true }); fs.writeFileSync(path.join(d, f), c); }
  return d;
};
const SRC = {
  "src/components/button/index.js": "button v1",
  "src/components/button/Button.stories.js": "story",
  "src/components/helper/index.js": "no story, so not design system",
  "src/tokens/tokens.css": "tokens",
  ".storybook/main.mjs": "main",
};
const git = (d, ...a) => execFileSync("git", ["-C", d, "-c", "user.email=t@t", "-c", "user.name=t", ...a], { encoding: "utf8" });

test("only component folders with a story are design system", () => {
  const files = designSystemFiles(mk(SRC));
  assert.ok(files.includes("src/components/button/index.js"));
  assert.ok(!files.some((f) => f.includes("helper")));
});

test("pull copies, records hashes and leaves app-level files alone", () => {
  const source = mk(SRC), target = mk({ "src/app/Layout.js": "mine", "src/pages/Home.js": "page" });
  const lock = pullUi({ source, target });
  assert.equal(fs.readFileSync(path.join(target, "src/components/button/index.js"), "utf8"), "button v1");
  assert.equal(fs.readFileSync(path.join(target, "src/app/Layout.js"), "utf8"), "mine");
  assert.ok(lock.files["src/tokens/tokens.css"]);
  assert.ok(fs.readFileSync(path.join(target, "src/components/GENERATED.md"), "utf8").includes("Do not edit"));
  assert.equal(lock.source.commit, null); // not a git repo: no crash
  assert.equal(checkLock(target).behind, null);
});

test("a folder removed in the source is removed in the copy", () => {
  const source = mk(SRC), target = mk({});
  pullUi({ source, target });
  fs.rmSync(path.join(source, "src/components/button"), { recursive: true });
  pullUi({ source, target });
  assert.ok(!fs.existsSync(path.join(target, "src/components/button/index.js")));
});

test("checkLock names edited and added files", () => {
  const source = mk(SRC), target = mk({});
  pullUi({ source, target });
  fs.writeFileSync(path.join(target, "src/components/button/index.js"), "edited by hand");
  fs.writeFileSync(path.join(target, "src/tokens/extra.css"), "new");
  const r = checkLock(target);
  assert.deepEqual(r.edited, ["src/components/button/index.js"]);
  assert.deepEqual(r.added, ["src/tokens/extra.css"]);
});

test("checkLock says how far behind a git source is and what changed", () => {
  const source = mk(SRC), target = mk({});
  git(source, "init", "-q"); git(source, "add", "-A"); git(source, "commit", "-q", "-m", "one");
  pullUi({ source, target });
  fs.writeFileSync(path.join(source, "src/components/button/index.js"), "button v2");
  git(source, "commit", "-qam", "two");
  const { behind } = checkLock(target);
  assert.equal(behind.commits, 1);
  assert.deepEqual(behind.changed, ["src/components/button/index.js"]);
});

test("check.mjs is silent when the copy is fresh and speaks when a file was edited", () => {
  const source = mk(SRC), target = mk({});
  pullUi({ source, target });
  const run = () => execFileSync("node", [CHECK, "--quiet"], { cwd: target, encoding: "utf8" });
  assert.equal(run(), "");
  fs.writeFileSync(path.join(target, "src/components/button/index.js"), "edited by hand");
  assert.match(run(), /changed by hand/);
});
