// Has the Foundation changed in Figma since the tokens in the repo were exported? Read-only for the repo.
// 1. The agent re-reads Figma into .figma-dump (the same steps as an export, reference/foundation.md steps 1-3).
// 2. This script builds a fresh Brücke file from that dump into .figma-dump/check/ and compares it per collection with src/tokens/design_token.json.
// Nothing in src/ changes, except with --record when nothing changed: it stamps source.checkedAt in tokens.index.json
// (so the age check restarts) and figma-ids.json.
// Usage: node scripts/figma/checkFoundation.mjs [--record] [--against src/tokens/design_token.json] [--dump .figma-dump] [--max-age-min 30]
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const DUMP = opt("--dump", ".figma-dump");
const AGAINST = opt("--against", "src/tokens/design_token.json");
const MAX_AGE = Number(opt("--max-age-min", "30"));
const here = path.dirname(fileURLToPath(import.meta.url));

// The dump must be a fresh read, or we would compare the repo with an old copy of itself.
const need = ["tokens.dtcg.json", "collections.json", "scopes.json", "styles.json"];
const missing = need.filter((f) => !fs.existsSync(path.join(DUMP, f)));
const old = need.filter((f) => fs.existsSync(path.join(DUMP, f)) && (Date.now() - fs.statSync(path.join(DUMP, f)).mtimeMs) / 60000 > MAX_AGE);
if (missing.length || old.length) {
  console.error(`checkFoundation: the dump in ${DUMP} is not a fresh read of Figma.${missing.length ? ` Missing: ${missing.join(", ")}.` : ""}${old.length ? ` Older than ${MAX_AGE} min: ${old.join(", ")}.` : ""}\nRe-read first (figma_navigate to the foundation file, figma_export_tokens, readFoundation.js; reference/foundation.md steps 1 to 3), then run this again.`);
  process.exit(2);
}

const out = path.join(DUMP, "check", "design_token.json");
fs.mkdirSync(path.dirname(out), { recursive: true });
const run = (script, a) => spawnSync(process.execPath, [path.join(here, script), ...a], { encoding: "utf8" });
const built = run("toBruecke.mjs", [DUMP, out]);
if (built.status !== 0) { console.error(`checkFoundation: toBruecke failed.\n${built.stderr || built.stdout}`); process.exit(2); }
const diff = run("diffTokens.mjs", [out, AGAINST, "8"]);
const lines = diff.stdout.split("\n");
const sections = lines.filter((l) => /^## /.test(l)).map((l) => { const m = l.match(/^## (.+?): (IDENTICAL|DIFF)\s+(.*)$/); return m ? { name: m[1], same: m[2] === "IDENTICAL", detail: m[3] } : null; }).filter(Boolean);
const changed = sections.filter((s) => !s.same);

console.log(`Foundation check: Figma (read just now) vs ${AGAINST}`);
for (const s of sections) console.log(`  ${s.same ? "same   " : "CHANGED"} ${s.name}  ${s.same ? "" : s.detail}`);
if (!changed.length) {
  console.log("\nNo change: the tokens in the repo match Figma.");
  if (args.includes("--record")) {
    const stamp = new Date().toISOString();
    for (const f of ["src/tokens/tokens.index.json", "src/tokens/figma-ids.json"]) {
      if (!fs.existsSync(f)) continue;
      const j = JSON.parse(fs.readFileSync(f, "utf8"));
      if (j.source) j.source.checkedAt = stamp; else j.checkedAt = stamp;
      fs.writeFileSync(f, JSON.stringify(j, null, 2) + "\n");
    }
    console.log(`Recorded checkedAt ${stamp}; the age check restarts. Commit src/tokens/tokens.index.json and figma-ids.json.`);
  }
  process.exit(0);
}
console.log(`\n${changed.length} collection(s) changed in Figma since the export. Details:\n${lines.filter((l) => /^\s+[~+-] /.test(l)).slice(0, 40).join("\n")}\n\nNext: npm run tokens:build (reference/foundation.md step 4), then review the diff of src/tokens and src/foundations, and run the Storybook checks.`);
process.exit(1);
