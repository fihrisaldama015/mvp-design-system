// Puts the skill into a project, or checks that it is in. Safe to run again: it never overwrites the project's own files.
//
//   node <skill>/scripts/install.mjs [--target <project>] [--from <skill folder>] [--dry-run] [--check] [--build-hooks] [--no-kit] [--kit-dir <dir>]
//
// It does four things in the target project (default: the current folder):
//   1. copies the skill (without its tests: a project's jest would run their fixtures) to .claude/skills/building-storybook-from-figma/ (the source the AI reads and `sync-skill` copies from);
//   2. copies its scripts to scripts/figma/ (the runnable copy; tests are left out) and the plugin scripts with them;
//   3. creates figma-tokens.config.json from the template when there is none (an existing one is never touched);
//   4. adds the npm scripts below to package.json when the name is free, and the ignore lines to .gitignore;
//   5. puts the review page kit (templates/review-kit) in src/review-kit/ (--kit-dir to change, --no-kit to skip): the shared page, which is
//      replaced on every run, plus review.config.js, which is the project's and created once.
// A script name that is taken with another value is reported, not replaced. `predev` / `prebuild` (they run the usage scan so the review
// page has fresh data) are only touched with --build-hooks, and then chained after what is there: "<yours> && npm run usage".
// --check changes nothing: it lists what an install would change and exits 1 when anything differs.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const SKILL = ".claude/skills/building-storybook-from-figma";
export const SCRIPTS_DST = "scripts/figma";
export const NPM_SCRIPTS = {
  doctor: "node scripts/figma/doctor.mjs",
  usage: "node scripts/figma/usageScan.mjs",
  "sync-skill": "node scripts/figma/syncSkill.mjs",
  "figma:receiver": "node scripts/figma/receiver.mjs 9232 .figma-dump",
};
export const BUILD_HOOKS = ["predev", "prebuild"];
export const KIT_DIR = "src/review-kit";
export const GITIGNORE = [".figma-dump", `${KIT_DIR}/usage.json`];

const walk = (d, base = d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
  if (e.name === "node_modules" || e.name === ".DS_Store") return [];
  return e.isDirectory() ? walk(path.join(d, e.name), base) : [path.relative(base, path.join(d, e.name))];
}) : []);
const noTests = (f) => f.split(path.sep).includes("__tests__");
const same = (a, b) => fs.existsSync(b) && fs.readFileSync(a).equals(fs.readFileSync(b));

/** The skill folder to install from: --from, else the folder this file belongs to, else the target's own copy. */
export function findSkill(from, target) {
  const here = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  for (const c of [from && path.resolve(from), here, path.join(process.cwd(), SKILL), path.join(target, SKILL)]) if (c && fs.existsSync(path.join(c, "SKILL.md"))) return c;
  throw new Error(`Cannot find the skill (a folder with SKILL.md). Pass --from <folder of ${path.basename(SKILL)}>.`);
}

function copyTree(srcDir, dstDir, { skip = () => false, write }) {
  const acts = [];
  for (const f of walk(srcDir)) {
    if (skip(f)) continue;
    const s = path.join(srcDir, f), d = path.join(dstDir, f);
    if (same(s, d)) continue;
    acts.push({ what: fs.existsSync(d) ? "update" : "add", file: path.relative(process.cwd(), d) || d });
    if (write) { fs.mkdirSync(path.dirname(d), { recursive: true }); fs.copyFileSync(s, d); }
  }
  return acts;
}

function indentOf(text) { return /^\{\s*\n(\t| +)"/.exec(text)?.[1] ?? "  "; }

/** package.json scripts: { text, changes[], conflicts[] }. Existing names are kept; build hooks are chained, never replaced. */
export function mergeScripts(text, { buildHooks = false } = {}) {
  const pkg = JSON.parse(text);
  pkg.scripts ??= {};
  const changes = [], conflicts = [];
  for (const [k, v] of Object.entries(NPM_SCRIPTS)) {
    if (pkg.scripts[k] === undefined) { pkg.scripts[k] = v; changes.push(`scripts.${k}`); }
    else if (pkg.scripts[k] !== v) conflicts.push(`scripts.${k} is "${pkg.scripts[k]}", the skill uses "${v}"; left as it is`);
  }
  if (buildHooks) {
    for (const k of BUILD_HOOKS) {
      const cur = pkg.scripts[k];
      if (cur === undefined) { pkg.scripts[k] = "npm run usage"; changes.push(`scripts.${k}`); }
      else if (!/\bnpm run usage\b/.test(cur)) { pkg.scripts[k] = `${cur} && npm run usage`; changes.push(`scripts.${k} (chained after "${cur}")`); }
    }
  }
  return { text: changes.length ? `${JSON.stringify(pkg, null, indentOf(text))}\n` : text, changes, conflicts };
}

/** .gitignore: the lines to add (the file's own lines are not touched). */
export function mergeIgnore(text) {
  const have = new Set(text.split(/\r?\n/).map((l) => l.trim()));
  const missing = GITIGNORE.filter((l) => !have.has(l));
  const out = missing.length ? `${text}${text && !text.endsWith("\n") ? "\n" : ""}${text ? "\n" : ""}# design review (skill building-storybook-from-figma)\n${missing.join("\n")}\n` : text;
  return { text: out, missing };
}

/** Does the whole install. write:false only reports. Returns { actions[], conflicts[], notes[], changed }. */
export function install({ target = process.cwd(), from, write = true, buildHooks = false, kit = true, kitDir = KIT_DIR } = {}) {
  target = path.resolve(target);
  if (!fs.existsSync(path.join(target, "package.json"))) throw new Error(`${target} has no package.json: run it from the project root or pass --target.`);
  const skill = findSkill(from, target);
  const actions = [], conflicts = [], notes = [];
  const skillDst = path.join(target, SKILL);
  if (path.resolve(skill) !== path.resolve(skillDst)) actions.push(...copyTree(skill, skillDst, { skip: noTests, write })); // fixtures in __tests__ look like tests to the project's own runner (jest)
  else notes.push("the skill is already in this project; only the runnable copy and the config are checked");
  actions.push(...copyTree(path.join(skill, "scripts"), path.join(target, SCRIPTS_DST), { skip: noTests, write }));
  const cfg = path.join(target, "figma-tokens.config.json");
  if (!fs.existsSync(cfg)) {
    actions.push({ what: "add", file: "figma-tokens.config.json" });
    if (write) fs.copyFileSync(path.join(skill, "templates/figma-tokens.config.json"), cfg);
  }
  if (kit) {
    const tpl = path.join(skill, "templates/review-kit"), dst = path.join(target, kitDir);
    actions.push(...copyTree(tpl, dst, { skip: (f) => f === "review.config.js", write }));
    const usageCore = path.join(skill, "scripts/usageCore.mjs"), usageDst = path.join(dst, "usageCore.js");
    if (!same(usageCore, usageDst)) { actions.push({ what: fs.existsSync(usageDst) ? "update" : "add", file: path.relative(process.cwd(), usageDst) }); if (write) { fs.mkdirSync(dst, { recursive: true }); fs.copyFileSync(usageCore, usageDst); } }
    for (const [name, from] of [["review.config.js", path.join(tpl, "review.config.js")], ["usage.json", null]]) {
      const f = path.join(dst, name);
      if (fs.existsSync(f)) continue;
      actions.push({ what: "add", file: path.relative(process.cwd(), f) });
      if (write) { fs.mkdirSync(dst, { recursive: true }); if (from) fs.copyFileSync(from, f); else fs.writeFileSync(f, `${JSON.stringify({ components: {}, warnings: [] }, null, 2)}\n`); } // usage.json: empty until `npm run usage`
    }
    notes.push(`the review page is in ${kitDir}: mount it (<Route path="/review" element={<ReviewPage />} /> with import { ReviewPage } from "${kitDir.replace(/^src\//, "")}"), set the service URL and project in ${kitDir}/review.config.js, and call installHighlight in the app entry (see ${kitDir}/index.js). The page needs react and lucide-react.`);
  }
  const pkgFile = path.join(target, "package.json");
  const pkg = mergeScripts(fs.readFileSync(pkgFile, "utf8"), { buildHooks });
  for (const c of pkg.changes) actions.push({ what: "set", file: `package.json ${c}` });
  conflicts.push(...pkg.conflicts);
  if (write && pkg.changes.length) fs.writeFileSync(pkgFile, pkg.text);
  const giFile = path.join(target, ".gitignore");
  const gi = mergeIgnore(fs.existsSync(giFile) ? fs.readFileSync(giFile, "utf8") : "");
  for (const l of gi.missing) actions.push({ what: "add", file: `.gitignore ${l}` });
  if (write && gi.missing.length) fs.writeFileSync(giFile, gi.text);
  if (!buildHooks) notes.push('the review page needs fresh usage data: add --build-hooks (predev/prebuild run "npm run usage"), or run "npm run usage" yourself');
  return { actions, conflicts, notes, changed: actions.length > 0 };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const a = process.argv.slice(2);
  const val = (k) => (a.includes(k) ? a[a.indexOf(k) + 1] : undefined);
  const check = a.includes("--check"), dry = a.includes("--dry-run");
  try {
    const r = install({ target: val("--target"), from: val("--from"), write: !check && !dry, buildHooks: a.includes("--build-hooks"), kit: !a.includes("--no-kit"), kitDir: val("--kit-dir") });
    const verb = check || dry ? "would" : "did";
    for (const x of r.actions) console.log(`${verb} ${x.what}: ${x.file}`);
    for (const c of r.conflicts) console.warn(`kept: ${c}`);
    for (const n of r.notes) console.log(`note: ${n}`);
    console.log(r.changed ? (check || dry ? `${r.actions.length} change(s) pending.` : `Done: ${r.actions.length} change(s). Next: node scripts/figma/doctor.mjs`) : "Nothing to do: the skill is installed and up to date.");
    process.exit(check && r.changed ? 1 : 0);
  } catch (e) { console.error(`install: ${e.message}`); process.exit(2); }
}
