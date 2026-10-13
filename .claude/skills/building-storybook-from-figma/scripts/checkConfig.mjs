// After plugin/readFoundation.js: show which Figma collection plays which role in
// figma-tokens.config.json, and which collections no role uses. Exit 1 when a role points
// at a collection that does not exist (fix the config; do not rename in Figma).
// Usage: node scripts/figma/checkConfig.mjs
import fs from "node:fs";
const colls = JSON.parse(fs.readFileSync(".figma-dump/collections.json", "utf8"));
const cfg = JSON.parse(fs.readFileSync("figma-tokens.config.json", "utf8"));
const names = colls.map((c) => c.name);
const used = new Set();
let bad = 0;
console.log(`Design system: ${cfg.designSystem}`);
for (const [role, name] of Object.entries(cfg.collections)) {
  const c = colls.find((x) => x.name === name);
  if (c) used.add(name);
  else bad++;
  console.log(`${c ? "ok     " : "MISSING"} ${role.padEnd(11)} -> ${name}${c ? `  (${c.modes.join(", ")})` : ""}`);
}
const unused = names.filter((n) => !used.has(n));
if (unused.length) console.log(`\nCollections no role uses (skipped): ${unused.join(", ")}`);
if (bad) console.log(`\n${bad} role(s) point at a collection that is not in the file. Collections in the file: ${names.join(", ")}`);
process.exit(bad ? 1 : 0);
