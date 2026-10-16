// Every .mjs under the skill's scripts directory must parse. A syntax error in any
// script (e.g. an unescaped quote in a string) fails here instead of at run time.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(d, e.name);
  return e.isDirectory() ? (e.name === "__tests__" || e.name === "node_modules" ? [] : walk(p)) : e.name.endsWith(".mjs") ? [p] : [];
});

test("every skill script parses (node --check)", () => {
  const files = walk(scriptsDir);
  assert.ok(files.length > 0, "no .mjs files found");
  for (const f of files) {
    try {
      execFileSync(process.execPath, ["--check", f], { stdio: "pipe" });
    } catch (e) {
      assert.fail(`${path.relative(scriptsDir, f)} has a syntax error:\n${e.stderr}`);
    }
  }
});
