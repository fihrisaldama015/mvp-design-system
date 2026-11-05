import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../templates/review-kit");
const files = fs.readdirSync(KIT);
const js = files.filter((f) => f.endsWith(".js"));
const read = (f) => fs.readFileSync(path.join(KIT, f), "utf8");
const css = read("kit.css");
// Written by the installer or the project, so they are not in the kit folder.
const GENERATED = ["usage.json", "usageCore.js"];

test("the kit does not depend on the project: no host components, aliases or build-time env, except in review.config.js", () => {
  for (const f of js) {
    for (const m of read(f).matchAll(/^\s*import\b[^;]*?\bfrom\s+["']([^"']+)["']|\bimport\(\s*["']([^"']+)["']/gm)) {
      const spec = m[1] ?? m[2];
      if (spec.startsWith(".")) continue;
      assert.ok(["react", "lucide-react"].includes(spec), `${f} imports "${spec}": only react and lucide-react may come from the project`);
    }
    if (f !== "review.config.js") assert.doesNotMatch(read(f), /import\.meta|process\.env/, `${f} reads the environment: that belongs in review.config.js`);
  }
});

test("every relative import of the kit exists in it, or is written by the installer", () => {
  for (const f of js) {
    for (const m of read(f).matchAll(/^\s*import\b[^;]*?\bfrom\s+["'](\.\/[^"']+)["']/gm)) {
      const name = m[1].slice(2);
      const found = [name, `${name}.js`].some((n) => files.includes(n) || GENERATED.includes(n));
      assert.ok(found, `${f} imports ${m[1]}, which is not in the kit`);
    }
  }
});

test("every rk- class the kit uses has a rule in kit.css, and none is left without the prefix", () => {
  const defined = new Set([...css.matchAll(/\.(rk-(?:\\.|[A-Za-z0-9_-])+)/g)].map((m) => m[1].replace(/\\/g, "")));
  const has = (tok) => (tok.endsWith("-") ? [...defined].some((d) => d.startsWith(tok)) : defined.has(tok)); // "rk-btn-${kind}" is a prefix: some rule must start with it
  const missing = new Set();
  for (const f of js) {
    for (const m of read(f).matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\}|\{([^{}]*)\})/g)) {
      const text = (m[1] ?? m[2] ?? m[3] ?? "").replace(/\$\{/g, '"').replace(/[{}]/g, '"');
      for (const t of text.matchAll(/(?:^|[\s"`'])([a-z][\w:.\-/%]*[\w%])(?=$|[\s"`'])/g)) {
        const tok = t[1];
        if (!tok.startsWith("rk-")) continue;
        if (!has(tok)) missing.add(`${f}: ${tok}`);
      }
    }
    for (const m of read(f).matchAll(/["'`](rk-[\w:.\-/%]+)/g)) if (!has(m[1])) missing.add(`${f}: ${m[1]}`);
  }
  assert.deepEqual([...missing], []);
  // Nothing in kit.css may reach the project's own elements: every selector names an rk- class.
  const rules = css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{/g);
  const outside = [];
  for (const [, prelude] of rules) {
    const p = prelude.trim();
    if (!p || p.startsWith("@") || /^(from|to|\d+%)$/.test(p)) continue;
    for (const sel of topLevel(p)) if (!sel.includes(".rk-")) outside.push(sel.trim()); // a comma inside :where(a, b) does not separate selectors
  }
  assert.deepEqual(outside, [], "a rule of kit.css can reach outside the page");
});

test("the kit's JSX compiles", { skip: !esbuild() }, () => {
  const { transformSync } = esbuild();
  for (const f of js) assert.doesNotThrow(() => transformSync(read(f), { loader: "jsx", format: "esm" }), f);
});

test("a project config is only a template here: the kit reads everything from review.config.js", () => {
  assert.match(read("review.config.js"), /export const config = \{[\s\S]*serviceUrl[\s\S]*project[\s\S]*usage[\s\S]*previews/);
  assert.match(read("index.js"), /ReviewPage/);
});

function esbuild() {
  for (const base of [process.cwd(), KIT]) {
    try { return createRequire(path.join(base, "x.js"))("esbuild"); } catch { /* not installed here */ }
  }
  return null;
}

function topLevel(list) {
  const out = [];
  let depth = 0, cur = "";
  for (const ch of list) {
    if (ch === "(") depth += 1;
    if (ch === ")") depth -= 1;
    if (ch === "," && depth === 0) { out.push(cur); cur = ""; } else cur += ch;
  }
  return [...out, cur];
}
