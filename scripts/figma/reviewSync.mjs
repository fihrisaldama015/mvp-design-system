// Review step before a component that already exists is synced from Figma: what is
// added (safe), what is gone from Figma but still in code (needs a human decision),
// and which defaults change. Writes .figma-dump/sync-review.json, which the Storybook
// page "Guide/Sync review" shows; the dev's answers come back as review-decisions.json.
//   node scripts/figma/reviewSync.mjs --verify <components.Name.json>   after RE-READING the node from Figma: is it still what the review was made from?
//   node scripts/figma/reviewSync.mjs --done "<Name>"                    after applying the answers: close the review (decisions file is kept as *.applied.json)
// Usage: node scripts/figma/reviewSync.mjs <components.Name.json> <src/components/x/index.js>
//          [--map '{"Dismiss":"onDismiss"}']   Figma property -> code prop (default: camelCase)
//          [--legacy tone=status,...]          old code prop that Figma replaced (not "removed")
//          [--behavior value,onChange,...]     code-only props that are data or behaviour, not looks (never flagged as removed)
//          [--also src/components/field/index.js]  a wrapper whose props count as this component's API (label, hint, required in Field)
//          [--ignore "State,Label"]           Figma properties that are not props (CSS state, show/hide switches for text that already has a prop)
//          [--out .figma-dump/sync-review.json] [--src src]
import fs from "node:fs";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const [, , figmaFile, codeFile, ...rest] = process.argv;
const flag = (n, d) => (rest.includes(n) ? rest[rest.indexOf(n) + 1] : d);
const OUT0 = flag("--out", ".figma-dump/sync-review.json");
const DUMP = flag("--dump", ".figma-dump");
// Same data, ignoring the read time: if this changed, Figma changed (or the read was different).
const hashOf = (d) => { const { readAt, ...rest } = d; return crypto.createHash("sha1").update(JSON.stringify(rest)).digest("hex").slice(0, 12); };
const load = () => (fs.existsSync(OUT0) ? JSON.parse(fs.readFileSync(OUT0, "utf8")) : { components: {} });

if (process.argv[2] === "--verify") {
  const fresh = JSON.parse(fs.readFileSync(process.argv[3], "utf8"));
  const entry = load().components[fresh.name];
  if (!entry) { console.error(`No review stored for "${fresh.name}" in ${OUT0}.`); process.exit(2); }
  if (entry.sourceHash === hashOf(fresh)) { console.log(`${fresh.name}: Figma node ${fresh.nodeId} is unchanged since the review (read ${entry.readAt}). Safe to apply.`); process.exit(0); }
  console.log(`${fresh.name}: Figma node ${fresh.nodeId} CHANGED since the review (read ${entry.readAt}). Run reviewSync again and have the dev answer again; do not apply the old answers.`);
  process.exit(1);
}
if (process.argv[2] === "--done") {
  const name = process.argv[3];
  const doc = load();
  if (!doc.components[name]) { console.error(`No review stored for "${name}".`); process.exit(2); }
  delete doc.components[name];
  fs.writeFileSync(OUT0, JSON.stringify(doc, null, 2) + "\n");
  // Only this component's answers leave the file; the answers of other pending reviews stay.
  const d = `${DUMP}/review-decisions.json`;
  const kept = `${DUMP}/review-decisions.${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.applied.json`;
  if (fs.existsSync(d)) {
    const file = JSON.parse(fs.readFileSync(d, "utf8"));
    // "Input - Single Select" is a prefix of "Input - Single Select/Base/...": match the name exactly, then the id ("removed-prop:x").
    const isMine = (k) => k.startsWith(`${name}/`) && /^[a-z]+(-[a-z]+)?:/.test(k.slice(name.length + 1));
    const mine = Object.fromEntries(Object.entries(file.decisions ?? {}).filter(([k]) => isMine(k)));
    const rest = Object.fromEntries(Object.entries(file.decisions ?? {}).filter(([k]) => !isMine(k)));
    if (Object.keys(mine).length) fs.writeFileSync(kept, JSON.stringify({ ...file, decisions: mine }, null, 2) + "\n");
    if (Object.keys(rest).length) fs.writeFileSync(d, JSON.stringify({ ...file, decisions: rest }, null, 2) + "\n");
    else fs.unlinkSync(d);
    console.log(`Closed the review of ${name}; ${Object.keys(mine).length} answer(s) kept in ${kept}${Object.keys(rest).length ? `, ${Object.keys(rest).length} answer(s) of other components stay in ${d}` : ""}.`);
  } else console.log(`Closed the review of ${name} (there was no decisions file).`);
  process.exit(0);
}

const MAP = JSON.parse(flag("--map", "{}"));
const LEGACY = Object.fromEntries((flag("--legacy", "") || "").split(",").filter(Boolean).map((p) => p.split("=")));
const BEHAVIOR = new Set(["id", "name", "ref", "className", "style", "children", "value", "defaultValue", "onChange", "onClick", "onBlur", "onFocus", ...flag("--behavior", "").split(",").filter(Boolean)]);
const IGNORE = new Set((flag("--ignore", "") || "").split(",").filter(Boolean));
const ALSO = (flag("--also", "") || "").split(",").filter(Boolean);
const OUT = flag("--out", ".figma-dump/sync-review.json");
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
  if (name.startsWith("🔄") || IGNORE.has(name)) continue;
  const key = MAP[name] ?? camel(name);
  if (def.type === "INSTANCE_SWAP" && /\d$/.test(key)) continue; // "Prefix Icon2" swap belongs to the boolean "Prefix Icon"
  const isBool = def.type === "BOOLEAN" || (def.type === "VARIANT" && def.options?.every((o) => ["true", "false"].includes(clean(o))));
  fProps[key] = { figma: name, type: def.type, options: isBool ? null : def.options?.map(clean) ?? null, default: isBool ? String(def.default) : clean(def.options?.find((o) => String(o).endsWith("*")) ?? def.default ?? "") };
}

const COMP = code.match(/(\w+)\.propTypes\s*=\s*\{/)?.[1] ?? figma.name; // the name used in JSX (Figma's name can differ: "Input - Single Select/Base" is Select)
// Code side: propTypes keys with their options and description (of the file and of any --also wrapper), defaults from the signature.
const cProps = {};
function readPropTypes(text, file) {
  const at = text.search(/\w+\.propTypes\s*=\s*\{/);
  if (at < 0) { console.error(`No Component.propTypes block in ${file}`); process.exit(1); }
  let desc = "";
  let open = null; // a /** ... */ comment that spans several lines
  for (const line of text.slice(at, text.indexOf("\n};", at)).split("\n").slice(1)) {
    if (open !== null) { const end = line.match(/^\s*\*?\s*(.*?)\s*\*\/\s*$/); if (end) { desc = `${open} ${end[1]}`.trim(); open = null; } else open += ` ${line.replace(/^\s*\*\s?/, "").trim()}`; continue; }
    const start = line.match(/^\s*\/\*\*\s*(.*)$/);
    if (start && !start[1].includes("*/")) { open = start[1].trim(); continue; }
    const d = line.match(/^\s*\/\*\*\s*(.*?)\s*\*\/\s*$/);
    if (d) { desc = d[1]; continue; }
    const m = line.match(/^\s{2}(\w+):\s*(.*)$/);
    if (!m) continue;
    const one = m[2].match(/oneOf\(\[(.*?)\]\)/);
    cProps[m[1]] = { options: one && m[2].startsWith("PropTypes.oneOf(") ? [...one[1].matchAll(/"([^"]*)"/g)].map((x) => x[1]) : null, description: desc, deprecated: /^@deprecated/i.test(desc), via: file === codeFile ? undefined : file };
    desc = "";
  }
}
readPropTypes(code, codeFile);
for (const f of ALSO) readPropTypes(fs.readFileSync(f, "utf8"), f);
const sig = code.match(/export (?:function|const) \w+[^(]*\(\s*\{([\s\S]*?)\}\s*(?:,\s*\w+)?\s*\)/);
for (const m of sig ? sig[1].matchAll(/(\w+)\s*=\s*("[^"]*"|true|false|[\w.]+)/g) : []) if (cProps[m[1]]) cProps[m[1]].default = m[2].replace(/"/g, "");

// Files that use the component. A prop that is ON by default reaches every caller, so then count the callers of the component, not those that pass the prop.
const fileHits = (pat) => {
  try {
    const own = codeFile.replace(/index\.js$/, "");
    const files = execFileSync("grep", ["-rlE", pat, SRC], { encoding: "utf8" }).split("\n").filter((f) => f && !f.includes(own) && !/\.mdx$/.test(f) && new RegExp(`<${COMP}\\b`).test(fs.readFileSync(f, "utf8")));
    return { app: files.filter((f) => !/\.stories\./.test(f)).length, stories: files.filter((f) => /\.stories\./.test(f)).length };
  } catch { return { app: 0, stories: 0 }; }
};
const callers = (prop, option) => {
  const byDefault = !option && ["true"].includes(cProps[prop]?.default);
  const hits = fileHits(byDefault ? `<${COMP}\\b` : option ? `${prop}=["{]+${option}` : `\\b${prop}\\b(=|\\s|/>)`);
  return { ...hits, byDefault };
};

const items = [];
const add = (i) => items.push({ id: `${i.kind}:${i.prop}${i.option ? `=${i.option}` : ""}`, decision: null, ...i });
for (const [p, f] of Object.entries(fProps)) {
  const c = cProps[p] ?? cProps[Object.keys(LEGACY).find((k) => LEGACY[k] === p)];
  if (!c) { add({ kind: "added-prop", prop: p, detail: `Figma "${f.figma}" (${f.type}${f.options ? `: ${f.options.join(" | ")}` : ""}) has no prop in code.` }); continue; }
  if (f.options && c.options) {
    for (const o of f.options.filter((o) => !c.options.some((x) => x.toLowerCase() === o.toLowerCase()))) add({ kind: "added-option", prop: p, option: o, detail: `Figma has ${p}="${o}", code does not.` });
  }
  if (f.type === "VARIANT" && f.options && f.default !== undefined && c.default !== undefined && f.default !== c.default)
    add({ kind: "default-changed", prop: p, detail: `Default is "${c.default}" in code, "${f.default}" in Figma. Callers that rely on the default render differently.`, from: c.default, to: f.default });
}
const covered = new Set([...Object.keys(fProps), ...Object.values(LEGACY).length ? Object.keys(LEGACY) : []]);
for (const [p, c] of Object.entries(cProps)) {
  if (BEHAVIOR.has(p) || /^on[A-Z]/.test(p)) continue; // data / behaviour (handlers too): Figma does not draw it
  if (!covered.has(p)) add({ kind: "removed-prop", prop: p, deprecated: c.deprecated, ...(() => { const k = callers(p); return { callers: k.app, storyCallers: k.stories, onByDefault: k.byDefault }; })(), detail: `Code has "${p}" but Figma does not. ${c.description}` });
  else if (fProps[p]?.options && c.options)
    for (const o of c.options.filter((o) => !fProps[p].options.some((x) => x.toLowerCase() === o.toLowerCase()))) add({ kind: "removed-option", prop: p, option: o, ...(() => { const k = callers(p, o); return { callers: k.app, storyCallers: k.stories }; })(), detail: `Code has ${p}="${o}" but Figma does not.` });
}

const doc = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : { components: {} };
doc.components[figma.name] = { figmaNode: figma.nodeId, figmaPage: figma.page?.name ?? figma.page, code: codeFile, readAt: figma.readAt, sourceHash: hashOf(figma), items };
fs.mkdirSync(OUT.replace(/\/[^/]*$/, "") || ".", { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(doc, null, 2) + "\n");

const count = (k) => items.filter((i) => i.kind === k).length;
console.log(`${figma.name}: ${count("added-prop") + count("added-option")} additions (safe), ${count("default-changed")} default changes, ${count("removed-prop") + count("removed-option")} removals (need a decision)`);
for (const i of items) console.log(`  ${i.kind.padEnd(15)} ${i.prop}${i.option ? `="${i.option}"` : ""}${i.callers !== undefined ? `  (${i.callers} app + ${i.storyCallers} story files${i.onByDefault ? ", ON by default: all of them get it" : ""})` : ""}${i.deprecated ? "  [already deprecated]" : ""}`);
console.log(`Wrote ${OUT}. Open Storybook > Guide/Sync review, answer the removals, save; the answers land in review-decisions.json.`);
