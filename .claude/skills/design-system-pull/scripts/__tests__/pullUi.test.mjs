import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { checkLock, designSystemFiles, pullUi, toPosix } from "../pullUi.mjs";

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

test("toPosix turns backslash paths into forward-slash paths", () => {
  assert.equal(toPosix("src\\components\\button\\index.js", "\\"), "src/components/button/index.js");
});

test("a CRLF copy hashes like the LF original; a binary file is hashed as it is", () => {
  const a = mk({ ...SRC }), b = mk({ ...SRC, "src/components/button/index.js": "button v1" });
  fs.writeFileSync(path.join(b, "src/components/button/index.js"), "line1\r\nline2\r\n");
  fs.writeFileSync(path.join(a, "src/components/button/index.js"), "line1\nline2\n");
  const bin = Buffer.from([1, 0, 13, 10, 2]), bin2 = Buffer.from([1, 0, 10, 2]);
  fs.writeFileSync(path.join(a, "src/tokens/x.bin"), bin); fs.writeFileSync(path.join(b, "src/tokens/x.bin"), bin2);
  const la = pullUi({ source: a, target: mk({}) }), lb = pullUi({ source: b, target: mk({}) });
  assert.equal(la.files["src/components/button/index.js"], lb.files["src/components/button/index.js"]);
  assert.notEqual(la.files["src/tokens/x.bin"], lb.files["src/tokens/x.bin"]);
});

test("pull refuses an empty source before deleting anything", () => {
  const source = mk({ "README.md": "nothing here" }), target = mk({});
  pullUi({ source: mk(SRC), target });
  assert.throws(() => pullUi({ source, target }), /no design system files/i);
  assert.ok(fs.existsSync(path.join(target, "src/components/button/index.js")));
});

test("the lock and GENERATED.md hold a relative source path, and checkLock still computes behind through it", () => {
  const source = mk(SRC), target = mk({});
  git(source, "init", "-q"); git(source, "add", "-A"); git(source, "commit", "-q", "-m", "one");
  const lock = pullUi({ source, target });
  assert.ok(!path.isAbsolute(lock.source.path));
  assert.ok(!lock.source.path.includes("\\"));
  assert.equal(path.resolve(target, lock.source.path), source);
  assert.ok(!fs.readFileSync(path.join(target, "src/components/GENERATED.md"), "utf8").includes(source));
  fs.writeFileSync(path.join(source, "src/components/button/index.js"), "button v2");
  git(source, "commit", "-qam", "two");
  assert.equal(checkLock(target).behind.commits, 1);
});

test("a dev commit that touches no design system file is not behind; a component commit is", () => {
  const source = mk(SRC), target = mk({});
  git(source, "init", "-q"); git(source, "add", "-A"); git(source, "commit", "-q", "-m", "one");
  pullUi({ source, target });
  fs.mkdirSync(path.join(source, "docs"), { recursive: true });
  fs.writeFileSync(path.join(source, "docs/x.md"), "docs");
  git(source, "add", "-A"); git(source, "commit", "-qm", "docs");
  assert.equal(checkLock(target).behind.commits, 0);
  fs.writeFileSync(path.join(source, "src/components/button/index.js"), "button v2");
  git(source, "commit", "-qam", "component");
  assert.equal(checkLock(target).behind.commits, 1);
});
