// Keeps the project's runnable copy scripts/figma/ equal to the skill's scripts
// (.claude/skills/building-storybook-from-figma/scripts/, the source: edit there only).
// Works on Linux, macOS and Windows (no rsync).
// Usage: node scripts/figma/syncSkill.mjs [--check]     (--check only lists differences, exit 1 if any)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SRC = ".claude/skills/building-storybook-from-figma/scripts";
const DST = "scripts/figma";
const walk = (d, base = d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name), base) : [path.relative(base, path.join(d, e.name))])) : []);

// Files that differ (or are missing) in DST compared to SRC, relative to `root`.
export function diffScripts(root = process.cwd()) {
  const src = path.join(root, SRC), dst = path.join(root, DST);
  if (!fs.existsSync(src)) return null; // this project has no skill source
  return walk(src).filter((f) => { const t = path.join(dst, f); return !fs.existsSync(t) || !fs.readFileSync(t).equals(fs.readFileSync(path.join(src, f))); });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const diff = diffScripts();
  if (diff === null) { console.error(`syncSkill: ${SRC} not found. Run it from the project root.`); process.exit(1); }
  if (process.argv.includes("--check")) {
    console.log(diff.length ? `${DST} differs from the skill in ${diff.length} file(s): ${diff.join(", ")}\nRun: npm run sync-skill` : `${DST} matches the skill.`);
    process.exit(diff.length ? 1 : 0);
  }
  for (const f of diff) { fs.mkdirSync(path.dirname(path.join(DST, f)), { recursive: true }); fs.copyFileSync(path.join(SRC, f), path.join(DST, f)); }
  console.log(diff.length ? `Copied ${diff.length} file(s) to ${DST}: ${diff.join(", ")}` : `${DST} already matches the skill.`);
}
