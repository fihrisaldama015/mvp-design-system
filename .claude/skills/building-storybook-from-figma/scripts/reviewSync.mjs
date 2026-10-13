// Review step before a component that already exists is synced from Figma: what is
// added (safe), what is gone from Figma but still in code (needs a human decision),
// and which defaults change. Writes src/guide/sync-review.json, which the Storybook
// page "Guide/Sync review" shows; the dev's answers come back as review-decisions.json.
// Usage: node scripts/figma/reviewSync.mjs <components.Name.json> <src/components/x/index.js>
//          [--map '{"Dismiss":"onDismiss"}']   Figma property -> code prop (default: camelCase)
//          [--legacy tone=status,...]          old code prop that Figma replaced (not "removed")
//          [--out src/guide/sync-review.json] [--src src]
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const [, , figmaFile, codeFile, ...rest] = process.argv;
const flag = (n, d) => (rest.includes(n) ? rest[rest.indexOf(n) + 1] : d);
const MAP = JSON.parse(flag("--map", "{}"));
const LEGACY = Object.fromEntries((flag("--legacy", "") || "").split(",").filter(Boolean).map((p) => p.split("=")));
const OUT = flag("--out", "src/guide/sync-review.json");
const SRC = flag("--src", "src");
if (!figmaFile || !codeFile) {
  console.error("Usage: node scripts/figma/reviewSync.mjs <components.Name.json> <src/components/x/index.js> [--map JSON] [--legacy a=b] [--out file]");
  process.exit(1);
}

const figma = JSON.parse(fs.readFileSync(figmaFile, "utf8"));
const code = fs.readFileSync(codeFile, "utf8");
const camel = (s) => s.replace(/[^\w ]/g, "").trim().split(/\s+/).map((w, i) => (i ? w[0].toUpperCase() + w.slice(1) : w[0].toLowerCase() + w.slice(1))).join("");
const clean = (o) => String(o).replace(/\*$/, "");

// Figma side: one entry per code-level prop. The swap property "🔄 X" belongs to the boolean "X".
const fProps = {};
for (const [name, def] of Object.entries(figma.props)) {
  if (name.startsWith("🔄")) continue;
  const key = MAP[name] ?? camel(name);
  const isBool = def.type === "BOOLEAN" || (def.type === "VARIANT" && def.options?.every((o) => ["true", "false"].includes(clean(o))));
  fProps[key] = { figma: name, type: def.type, options: isBool ? null : def.options?.map(clean) ?? null, default: isBool ? String(def.default) : clean(def.options?.find((o) => String(o).endsWith("*")) ?? def.default ?? "") };
}

// Code side: propTypes keys with their options and description, defaults from the signature.
const at = code.search(/\w+\.propTypes\s*=\s*\{/);
if (at < 0) { console.error(`No Component.propTypes block in ${codeFile}`); process.exit(1); }
const block = code.slice(at, code.indexOf("\n};", at));
const cProps = {};
let desc = "";
for (const line of block.split("\n").slice(1)) {
  const d = line.match(/^\s*\/\*\*\s*(.*?)\s*\*\/\s*$/);
  if (d) { desc = d[1]; continue; }
  const m = line.match(/^\s{2}(\w+):\s*(.*)$/);
  if (!m) continue;
  const one = m[2].match(/oneOf\(\[(.*?)\]\)/);
  cProps[m[1]] = { options: one && !/^\s*false\s*$/.test(one[1]) && m[2].startsWith("PropTypes.oneOf(") ? [...one[1].matchAll(/"([^"]*)"/g)].map((x) => x[1]) : null, description: desc, deprecated: /^@deprecated/i.test(desc) };
  desc = "";
}
const sig = code.match(/export (?:function|const) \w+[^(]*\(\s*\{([\s\S]*?)\}\s*(?:,\s*\w+)?\s*\)/);
for (const m of sig ? sig[1].matchAll(/(\w+)\s*=\s*("[^"]*"|true|false|[\w.]+)/g) : []) if (cProps[m[1]]) cProps[m[1]].default = m[2].replace(/"/g, "");

const callers = (prop, option) => {
  const pat = option ? `${prop}=["{]+${option}` : `\\b${prop}\\b(=|\\s|/>)`;
  try {
    const out = execFileSync("grep", ["-rlE", pat, SRC], { encoding: "utf8" });
    return out.split("\n").filter((f) => f && !f.includes(codeFile.replace(/index\.js$/, "")) && !/\.stories\.|\.mdx$/.test(f) && new RegExp(`<${figma.name}\\b`).test(fs.readFileSync(f, "utf8"))).length;
  } catch { return 0; }
};

const items = [];
const add = (i) => items.push({ id: `${i.kind}:${i.prop}${i.option ? `=${i.option}` : ""}`, decision: null, ...i });
for (const [p, f] of Object.entries(fProps)) {
  const c = cProps[p] ?? cProps[Object.keys(LEGACY).find((k) => LEGACY[k] === p)];
  if (!c) { add({ kind: "added-prop", prop: p, detail: `Figma "${f.figma}" (${f.type}${f.options ? `: ${f.options.join(" | ")}` : ""}) has no prop in code.` }); continue; }
  if (f.options && c.options) {
    for (const o of f.options.filter((o) => !c.options.includes(o))) add({ kind: "added-option", prop: p, option: o, detail: `Figma has ${p}="${o}", code does not.` });
  }
  if (f.default !== undefined && c.default !== undefined && f.default !== c.default && f.type !== "BOOLEAN")
    add({ kind: "default-changed", prop: p, detail: `Default is "${c.default}" in code, "${f.default}" in Figma. Callers that rely on the default render differently.`, from: c.default, to: f.default });
}
const covered = new Set([...Object.keys(fProps), ...Object.values(LEGACY).length ? Object.keys(LEGACY) : []]);
for (const [p, c] of Object.entries(cProps)) {
  if (["className", "children", "style"].includes(p)) continue; // not a Figma concept
  if (!covered.has(p)) add({ kind: "removed-prop", prop: p, deprecated: c.deprecated, callers: callers(p), detail: `Code has "${p}" but Figma does not. ${c.description}` });
  else if (fProps[p]?.options && c.options)
    for (const o of c.options.filter((o) => !fProps[p].options.includes(o))) add({ kind: "removed-option", prop: p, option: o, callers: callers(p, o), detail: `Code has ${p}="${o}" but Figma does not.` });
}

const doc = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : { components: {} };
doc.components[figma.name] = { figmaNode: figma.nodeId, figmaPage: figma.page, code: codeFile, readAt: figma.readAt, items };
fs.mkdirSync(OUT.replace(/\/[^/]*$/, "") || ".", { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(doc, null, 2) + "\n");

const count = (k) => items.filter((i) => i.kind === k).length;
console.log(`${figma.name}: ${count("added-prop") + count("added-option")} additions (safe), ${count("default-changed")} default changes, ${count("removed-prop") + count("removed-option")} removals (need a decision)`);
for (const i of items) console.log(`  ${i.kind.padEnd(15)} ${i.prop}${i.option ? `="${i.option}"` : ""}${i.callers !== undefined ? `  (${i.callers} caller files)` : ""}${i.deprecated ? "  [already deprecated]" : ""}`);
console.log(`Wrote ${OUT}. Open Storybook > Guide/Sync review, answer the removals, save; the answers land in review-decisions.json.`);
