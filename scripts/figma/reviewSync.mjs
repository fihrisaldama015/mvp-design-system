// Review step before a component that already exists is synced from Figma: what is added (safe), what is gone
// from Figma but still in code (needs a human decision), and which defaults change. The review is published to the
// review service (reviewClient.mjs; reference/review-service.md), or a local store when none is configured. Designers and product
// owners answer on the project's /review page; the answers live in the service; the sync flow reads them (--answers).
// Where each removal is used comes from the usage scan (usageScan.mjs), not from grep.
//   node scripts/figma/reviewSync.mjs --verify <components.Name.json>   after RE-READING the node from Figma: is it still what the review was made from?
//   node scripts/figma/reviewSync.mjs --answers "<Name>"                 print the answers and who gave them
//   node scripts/figma/reviewSync.mjs --done "<Name>"                    after applying the answers: checks the gates (usage, Waiting for Figma), then marks the review as applied
// Usage: node scripts/figma/reviewSync.mjs <components.Name.json> <src/components/x/index.js>
//          [--map '{"Dismiss":"onDismiss"}']   Figma property -> code prop (default: camelCase)
//          [--legacy tone=status,...]          old code prop that Figma replaced (not "removed")
//          [--behavior value,onChange,...]     code-only props that are data or behaviour, not looks (never flagged as removed)
//          [--also src/components/field/index.js]  a wrapper whose props count as this component's API (label, hint, required in Field)
//          [--ignore "State,Label"]           Figma properties that are not props (CSS state, show/hide switches for text that already has a prop)
//          [--preview-url https://<preview-origin>]  the candidate's preview deployment (the page shows the route there next to the current one)
//          [--src src] [--file <figmaFileKey>]   (the key makes the reviewers' "Open in Figma" link; default: figma-index.json)
import fs from "node:fs";
import crypto from "node:crypto";
import { reviewApi, reviewPage } from "./reviewClient.mjs";
import { scanUsage } from "./usageScan.mjs";
import { usageFor } from "./usageCore.mjs";
import { doneGate } from "./reviewGate.mjs";

const [, , figmaFile, codeFile, ...rest] = process.argv;
const flag = (n, d) => (rest.includes(n) ? rest[rest.indexOf(n) + 1] : d);
// Same data, ignoring the read time: if this changed, Figma changed (or the read was different).
const hashOf = (d) => { const { readAt, ...rest } = d; return crypto.createHash("sha1").update(JSON.stringify(rest)).digest("hex").slice(0, 12); };
const fail = (m, code = 2) => { console.error(m); process.exit(code); };
const makeApi = () => { try { return reviewApi(); } catch (e) { return fail(e.message); } }; // a config error is a message, not a stack trace
const readJson = (f) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return {}; } };
const scan = () => scanUsage(process.cwd(), { routeSamples: readJson("figma-tokens.config.json").review?.routeSamples ?? {} });

if (["--verify", "--answers", "--done"].includes(process.argv[2])) {
  const api = makeApi();
  const mode = process.argv[2];
  try {
    if (mode === "--verify") {
      const fresh = JSON.parse(fs.readFileSync(process.argv[3], "utf8"));
      const entry = await api.get(fresh.name);
      if (!entry) fail(`No review stored for "${fresh.name}" (${api.url}).`);
      if (entry.sourceHash === hashOf(fresh)) { console.log(`${fresh.name}: Figma node ${fresh.nodeId} is unchanged since the review (read ${entry.readAt}). Safe to apply.`); process.exit(0); }
      console.log(`${fresh.name}: Figma node ${fresh.nodeId} CHANGED since the review (read ${entry.readAt}). Run reviewSync again and have the reviewers answer again; do not apply the old answers.`);
      process.exit(1);
    }
    const name = process.argv[3];
    const d = await api.get(name);
    if (!d) fail(`No review "${name}" (${api.url}).`);
    if (mode === "--answers") {
      console.log(JSON.stringify({ component: d.component, status: d.status, version: d.version, sourceHash: d.sourceHash, answers: d.answers, migrateBy: d.migrateBy ?? {}, previewUrl: d.previewUrl ?? null, decidedBy: d.audit.filter((a) => a.action === "decided").map((a) => ({ by: a.by, at: a.at })) }, null, 2));
      process.exit(0);
    }
    let usage;
    try { usage = scan(); } catch (e) { fail(`Cannot check what still uses "${name}": the usage scan failed (${e.message}). Not marking it applied.`); }
    for (const w of usage.warnings ?? []) console.warn(`usage: skipped ${w}`);
    const gate = doneGate(d, usage);
    if (!gate.ok) fail(gate.reason);
    await api.applied(name);
    for (const b of gate.burnDown) console.log(`Deprecated "${b.prop}": ${b.now} use(s) now, ${b.before ?? "unknown"} at publish; migrate by ${b.migrateBy}.`);
    console.log(`Marked "${name}" as applied (${api.url}).\nLast step of a synced component: node scripts/figma/indexComponent.mjs "${name}" --file <figmaFileKey> --story <story id> --code <dir>  (writes figma-index.json; commit it).`);
    process.exit(0);
  } catch (e) { fail(e.message); }
}

const MAP = JSON.parse(flag("--map", "{}"));
const LEGACY = Object.fromEntries((flag("--legacy", "") || "").split(",").filter(Boolean).map((p) => p.split("=")));
const BEHAVIOR = new Set(["id", "name", "ref", "className", "style", "children", "value", "defaultValue", "onChange", "onClick", "onBlur", "onFocus", ...flag("--behavior", "").split(",").filter(Boolean)]);
const IGNORE = new Set((flag("--ignore", "") || "").split(",").filter(Boolean));
const ALSO = (flag("--also", "") || "").split(",").filter(Boolean);
const SRC = flag("--src", "src");
if (!figmaFile || !codeFile) {
  console.error("Usage: node scripts/figma/reviewSync.mjs <components.Name.json> <src/components/x/index.js> [--map JSON] [--legacy a=b] [--out file]");
  process.exit(1);
}

const api = makeApi(); // before any work: a broken review config stops the run early
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

// Where each item is used: the usage scan of routed pages (usageScan.mjs). callers = uses, callerRoutes = the route paths.
let usage;
try { usage = scan(); } catch (e) { fail(`The usage scan failed (${e.message}); publishing without it would hide who is affected.`); }
for (const w of usage.warnings) console.warn(`usage: skipped ${w}`);
const callers = (it) => { const u = usageFor(usage, COMP, it); return { callers: u.count, callerRoutes: u.routes.map((r) => r.path) }; };

const items = [];
const add = (i) => items.push({ id: `${i.kind}:${i.prop}${i.option ? `=${i.option}` : ""}`, decision: null, ...i });
for (const [p, f] of Object.entries(fProps)) {
  const c = cProps[p] ?? cProps[Object.keys(LEGACY).find((k) => LEGACY[k] === p)];
  if (!c) { add({ kind: "added-prop", prop: p, figmaName: f.figma, options: f.options ?? undefined, detail: `Figma "${f.figma}" (${f.type}${f.options ? `: ${f.options.join(" | ")}` : ""}) has no prop in code.` }); continue; }
  if (f.options && c.options) {
    for (const o of f.options.filter((o) => !c.options.some((x) => x.toLowerCase() === o.toLowerCase()))) add({ kind: "added-option", prop: p, option: o, detail: `Figma has ${p}="${o}", code does not.` });
  }
  if (f.type === "VARIANT" && f.options && f.default !== undefined && c.default !== undefined && f.default !== c.default)
    add({ kind: "default-changed", prop: p, detail: `Default is "${c.default}" in code, "${f.default}" in Figma. Callers that rely on the default render differently.`, from: c.default, to: f.default });
}
const covered = new Set([...Object.keys(fProps), ...Object.values(LEGACY).length ? Object.keys(LEGACY) : []]);
for (const [p, c] of Object.entries(cProps)) {
  if (BEHAVIOR.has(p) || /^on[A-Z]/.test(p)) continue; // data / behaviour (handlers too): Figma does not draw it
  if (!covered.has(p)) add({ kind: "removed-prop", prop: p, deprecated: c.deprecated, description: c.description, default: c.default, onByDefault: cProps[p].default === "true", detail: `Code has "${p}" but Figma does not. ${c.description}` });
  else if (fProps[p]?.options && c.options)
    for (const o of c.options.filter((o) => !fProps[p].options.some((x) => x.toLowerCase() === o.toLowerCase()))) add({ kind: "removed-option", prop: p, option: o, detail: `Code has ${p}="${o}" but Figma does not.` });
}

for (const i of items) if (i.kind.startsWith("removed")) Object.assign(i, callers(i));
const usageByItem = Object.fromEntries(items.filter((i) => i.kind.startsWith("removed")).map((i) => [i.id, { count: i.callers, routes: i.callerRoutes }]));
try {
  const idx = (() => { try { return JSON.parse(fs.readFileSync("figma-index.json", "utf8")).components?.[figma.name]; } catch { return null; } })();
  const cfg = readJson("figma-tokens.config.json");
  await api.publish({ component: figma.name, jsxName: COMP, storybookUrl: cfg.storybookUrl || null, storyId: idx?.story ?? null, figmaFileKey: flag("--file", idx?.figmaFileKey ?? null), figmaNode: figma.nodeId, figmaPage: figma.page?.name ?? figma.page, code: codeFile, readAt: figma.readAt, sourceHash: hashOf(figma), items, usage: { at: usage.generatedAt, byItem: usageByItem }, ...(flag("--preview-url") ? { previewUrl: flag("--preview-url") } : {}) });
} catch (e) { fail(`Could not publish the review: ${e.message}`); }

const count = (k) => items.filter((i) => i.kind === k).length;
console.log(`${figma.name}: ${count("added-prop") + count("added-option")} additions (safe), ${count("default-changed")} default changes, ${count("removed-prop") + count("removed-option")} removals (need a decision)`);
for (const i of items) console.log(`  ${i.kind.padEnd(15)} ${i.prop}${i.option ? `="${i.option}"` : ""}${i.callers !== undefined ? `  (${i.callers} use(s) on ${i.callerRoutes.length} page(s)${i.onByDefault ? ", ON by default: all of them get it" : ""})` : ""}${i.deprecated ? "  [already deprecated]" : ""}`);
console.log(`Published to ${api.url}. Reviewers answer at ${reviewPage()}; the removals wait there. Tell the dev; do not apply anything until the review shows "answered".`);
