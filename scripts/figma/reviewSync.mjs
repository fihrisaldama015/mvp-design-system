// Review step before a component that already exists is synced from Figma: what is added (safe), what is gone
// from Figma but still in code (needs a human decision), and which defaults change. The review is published to the
// review service (reviewClient.mjs; reference/review-service.md), or a local store when none is configured. Designers and product
// owners answer on the project's /review page; the answers live in the service; the sync flow reads them (--answers).
// Where each removal is used comes from the usage scan (usageScan.mjs), not from grep.
//   node scripts/figma/reviewSync.mjs --verify <components.Name.json>   after RE-READING the node from Figma: is it still what the review was made from?
//   node scripts/figma/reviewSync.mjs --answers "<Name>"                 print the answers and who gave them
//   node scripts/figma/reviewSync.mjs --plan "<Name>" [--json]          what to change in the code for each answer (scans the current code; refuses when the scan skipped files)
//   node scripts/figma/reviewSync.mjs --done "<Name>"                    after applying the answers: checks the gates (usage, Waiting for Figma), then marks the review as applied
// Only what changes how a component LOOKS is compared: options of a variant (kind="outlined") and on/off switches (searchable).
// Data (columns, rows, options), content (label, children), handlers and behaviour (a permission code) stay as the code has them; the
// run lists them under "not compared". The code file can be left out when review.components["<Figma name>"].code in figma-tokens.config.json
// names it; that entry can also hold component, also, map, legacy, ui, behavior and ignore (the flags below win over it).
// Usage: node scripts/figma/reviewSync.mjs <components.Name.json> [<src/components/x/index.js>]
//          [--component Input]                 which `X.propTypes` block is the component, when the file holds several (a re-export is followed)
//          [--ui badge,active]                 code props to compare although they are not an enum or a switch
//          [--map '{"Dismiss":"onDismiss"}']   Figma property -> code prop (default: camelCase)
//          [--legacy tone=status,...]          old code prop that Figma replaced (not "removed")
//          [--behavior type,code,...]          code-only props that are behaviour although they look like an enum or a switch (never flagged as removed)
//          [--also src/components/field/index.js]  a wrapper whose props count as this component's API (label, hint, required in Field)
//          [--ignore "State,Label"]           Figma properties that are not props (CSS state, show/hide switches for text that already has a prop)
//          [--preview-url https://<preview-origin>]  the candidate's preview deployment (the page shows the route there next to the current one); default: the project's
//                                       "Candidate preview URL" in the dashboard. A review where Figma ADDS something stops without one: --no-preview goes on anyway
//          [--file <figmaFileKey>]   (the key makes the reviewers' "Open in Figma" link; default: figma-index.json)
import fs from "node:fs";
import crypto from "node:crypto";
import { reviewApi, reviewPage } from "./reviewClient.mjs";
import { probeText, scanUsage } from "./usageScan.mjs";
import { usageFor } from "./usageCore.mjs";
import { doneGate, planGate, previewNeeded } from "./reviewGate.mjs";
import { buildPlan, planText } from "./reviewPlan.mjs";
import { ALWAYS_BEHAVIOR, findBlocks, isUiProp, readBlock, resolveCode, signatureDefaults } from "./codeProps.mjs";

const [, , figmaFile, third, ...others] = process.argv;
const codeArg = third && !third.startsWith("--") ? third : undefined; // the code file may come from the config instead
const rest = codeArg ? others : [third, ...others].filter((x) => x !== undefined);
const flag = (n, d) => (rest.includes(n) ? rest[rest.indexOf(n) + 1] : d);
// Same data, ignoring the read time: if this changed, Figma changed (or the read was different).
const hashOf = (d) => { const { readAt, ...rest } = d; return crypto.createHash("sha1").update(JSON.stringify(rest)).digest("hex").slice(0, 12); };
const fail = (m, code = 2) => { console.error(m); process.exit(code); };
const makeApi = () => { try { return reviewApi(); } catch (e) { return fail(e.message); } }; // a config error is a message, not a stack trace
const readJson = (f) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return {}; } };
const scan = () => {
  const review = readJson("figma-tokens.config.json").review ?? {};
  const u = review.usage ?? {};
  return scanUsage(process.cwd(), { routeSamples: review.routeSamples ?? {}, routeFiles: u.routeFiles, aliases: u.aliases ?? {}, ...(u.app ? { app: u.app } : {}) });
};

if (["--verify", "--answers", "--plan", "--done"].includes(process.argv[2])) {
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
    const name = process.argv.slice(3).find((a) => !a.startsWith("--"));
    const d = await api.get(name);
    if (!d) fail(`No review "${name}" (${api.url}).`);
    if (mode === "--answers") {
      console.log(JSON.stringify({ component: d.component, status: d.status, version: d.version, sourceHash: d.sourceHash, answers: d.answers, migrateBy: d.migrateBy ?? {}, previewUrl: d.previewUrl ?? null, decidedBy: d.audit.filter((a) => a.action === "decided").map((a) => ({ by: a.by, at: a.at, ...(a.note ? { note: a.note } : {}) })) }, null, 2));
      process.exit(0);
    }
    let usage;
    try { usage = scan(); } catch (e) { fail(mode === "--plan" ? `Cannot count usage for "${name}": the usage scan failed (${e.message}).` : `Cannot check what still uses "${name}": the usage scan failed (${e.message}). Not marking it applied.`); }
    for (const w of usage.warnings ?? []) console.warn(`usage: skipped ${w}`);
    if (mode === "--plan") {
      const pg = planGate(d, usage);
      if (!pg.ok) fail(pg.reason);
      const removalItems = (d.items ?? []).filter((i) => i.kind.startsWith("removed"));
      const byItem = Object.fromEntries(removalItems.map((i) => [i.id, usageFor(usage, d.jsxName, i)]));
      const plan = buildPlan(d, byItem);
      console.log(process.argv.includes("--json") ? JSON.stringify(plan, null, 2) : planText(plan));
      process.exit(0);
    }
    const gate = doneGate(d, usage);
    if (!gate.ok) fail(gate.reason);
    await api.applied(name);
    for (const b of gate.burnDown) console.log(`Deprecated "${b.prop}": ${b.now} use(s) now, ${b.before ?? "unknown"} at publish; migrate by ${b.migrateBy}.`);
    console.log(`Marked "${name}" as applied (${api.url}).\nLast step of a synced component: node scripts/figma/indexComponent.mjs "${name}" --file <figmaFileKey> --story <story id> --code <dir>  (writes figma-index.json; commit it).`);
    process.exit(0);
  } catch (e) { fail(e.message); }
}

if (!figmaFile) {
  console.error("Usage: node scripts/figma/reviewSync.mjs <components.Name.json> [<src/components/x/index.js>] [--component Name] [--map JSON] [--legacy a=b] [--ui a,b] [--behavior a,b] [--ignore A,B] [--also file]");
  process.exit(1);
}

const api = makeApi(); // before any work: a broken review config stops the run early
const figma = JSON.parse(fs.readFileSync(figmaFile, "utf8"));
const entry = readJson("figma-tokens.config.json").review?.components?.[figma.name] ?? {}; // per component: code, component, also, map, legacy, ui, behavior, ignore
const list = (v) => (Array.isArray(v) ? v : String(v ?? "").split(",").map((x) => x.trim()).filter(Boolean));
const MAP = { ...(entry.map ?? {}), ...JSON.parse(flag("--map", "{}")) };
const LEGACY = { ...(entry.legacy ?? {}), ...Object.fromEntries((flag("--legacy", "") || "").split(",").filter(Boolean).map((p) => p.split("="))) };
const BEHAVIOR = [...list(entry.behavior), ...list(flag("--behavior", ""))];
const UI = [...list(entry.ui), ...list(flag("--ui", ""))];
const IGNORE = new Set([...list(entry.ignore), ...list(flag("--ignore", ""))]);
const ALSO = [...list(entry.also), ...list(flag("--also", ""))];
const codeFile = codeArg ?? entry.code;
if (!codeFile) fail(`No code file for "${figma.name}": pass it as the second argument, or set review.components["${figma.name}"].code in figma-tokens.config.json.`, 1);
let resolved;
try { resolved = resolveCode({ codeFile, component: flag("--component", entry.component), figmaName: figma.name }); } catch (e) { fail(e.message, 1); }
const code = resolved.text;
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

const COMP = resolved.component; // the name used in JSX (Figma's name can differ: "Input - Single Select/Base" is Select)
// Code side: the props of that block (and of any --also wrapper) with their kind, options and description; defaults from the signature.
const cProps = readBlock(code, resolved.at, { file: resolved.file });
for (const f of ALSO) {
  const t = fs.readFileSync(f, "utf8");
  const b = findBlocks(t)[0];
  if (!b) fail(`No Component.propTypes block in ${f}`, 1);
  Object.assign(cProps, readBlock(t, b.at, { file: f, via: true }));
}
for (const [k, v] of Object.entries(signatureDefaults(code, COMP))) if (cProps[k]) cProps[k].default = v;

// Where each item is used: the usage scan of routed pages (usageScan.mjs). callers = uses, callerRoutes = the route paths.
let usage;
try { usage = scan(); } catch (e) { fail(`The usage scan failed (${e.message}); publishing without it would hide who is affected.`); }
for (const w of usage.warnings) console.warn(`usage: skipped ${w}`);
if (usage.routing?.blind && !process.argv.includes("--blind-usage")) {
  // "Used in 0 places" for a project whose routes were not read is a false answer that looks like a real one.
  fail(`${probeText(usage.routing)}\n\nNothing was published. Fix the scan above, or pass --blind-usage to publish without usage numbers (every "used in" will be 0).`);
}
if (usage.routing?.noSample?.length) console.warn(`usage: ${usage.routing.noSample.length} route(s) have a parameter, no sample path (review.routeSamples) and no list page above them, so the review page shows "No preview" for them. List: node scripts/figma/usageScan.mjs --probe`);
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
const notCompared = []; // code-only props that are data, content or behaviour: the code keeps them, the review does not look at them
for (const [p, c] of Object.entries(cProps)) {
  if (ALWAYS_BEHAVIOR.includes(p) || BEHAVIOR.includes(p)) continue; // the project says: not looks
  if (!covered.has(p) && !isUiProp(p, c.kind, { ui: UI })) { notCompared.push(p); continue; }
  if (!covered.has(p)) add({ kind: "removed-prop", prop: p, deprecated: c.deprecated, description: c.description, default: c.default, codeKind: c.kind, onByDefault: cProps[p].default === "true", detail: `Code has "${p}" but Figma does not. ${c.description}` });
  else if (fProps[p]?.options && c.options)
    for (const o of c.options.filter((o) => !fProps[p].options.some((x) => x.toLowerCase() === o.toLowerCase()))) add({ kind: "removed-option", prop: p, option: o, detail: `Code has ${p}="${o}" but Figma does not.` });
}

for (const i of items) if (i.kind.startsWith("removed")) Object.assign(i, callers(i));
const usageByItem = Object.fromEntries(items.filter((i) => i.kind.startsWith("removed")).map((i) => [i.id, { count: i.callers, routes: i.callerRoutes }]));
// The candidate build: the flag, else the project's address in the dashboard (it travels with the list of reviews).
const listed = await api.list().catch(() => null);
const previewUrl = flag("--preview-url", null) ?? listed?.project?.candidatePreviewUrl ?? null;
const stop = previewNeeded(items, previewUrl, { allowNone: rest.includes("--no-preview") });
if (stop) fail(`Nothing was published.\n${stop}`);
try {
  const idx = (() => { try { return JSON.parse(fs.readFileSync("figma-index.json", "utf8")).components?.[figma.name]; } catch { return null; } })();
  const cfg = readJson("figma-tokens.config.json");
  await api.publish({ component: figma.name, jsxName: COMP, storybookUrl: cfg.storybookUrl || null, storyId: idx?.story ?? null, figmaFileKey: flag("--file", idx?.figmaFileKey ?? null), figmaNode: figma.nodeId, figmaPage: figma.page?.name ?? figma.page, code: codeFile, readAt: figma.readAt, sourceHash: hashOf(figma), items, usage: { at: usage.generatedAt, byItem: usageByItem }, ...(flag("--preview-url") ? { previewUrl: previewUrl ?? null } : {}) });
} catch (e) { fail(`Could not publish the review: ${e.message}`); }

const count = (k) => items.filter((i) => i.kind === k).length;
console.log(`${figma.name}: ${count("added-prop") + count("added-option")} additions (safe), ${count("default-changed")} default changes, ${count("removed-prop") + count("removed-option")} removals (need a decision)`);
for (const i of items) console.log(`  ${i.kind.padEnd(15)} ${i.prop}${i.option ? `="${i.option}"` : ""}${i.callers !== undefined ? `  (${i.callers} use(s) on ${i.callerRoutes.length} page(s)${i.onByDefault ? ", ON by default: all of them get it" : ""})` : ""}${i.deprecated ? "  [already deprecated]" : ""}`);
const kinds = Object.values(cProps).reduce((a, c) => ({ ...a, [c.kind]: (a[c.kind] ?? 0) + 1 }), {});
console.log(`  read: ${resolved.file}, "${COMP}" (${Object.keys(cProps).length} props: ${Object.entries(kinds).map(([k, n]) => `${n} ${k}`).join(", ")})`);
for (const n of resolved.notes) console.warn(`  note: ${n}`);
if (notCompared.length) console.log(`  not compared (data, content or behaviour, not looks): ${notCompared.join(", ")}`);
console.log(`Published to ${api.url}. Reviewers answer at ${reviewPage()}; the removals wait there. Tell the dev; do not apply anything until the review shows "answered".`);
