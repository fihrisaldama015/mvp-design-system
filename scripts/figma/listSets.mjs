// Print the inventory saved by plugin/inventory.js, one line per page. Optional filter
// (case-insensitive) on page or set name: node scripts/figma/listSets.mjs button
import fs from "node:fs";
const filter = (process.argv[2] || "").toLowerCase();
const inv = JSON.parse(fs.readFileSync(".figma-dump/inventory.json", "utf8"));
console.log(`# ${inv.file}`);
for (const p of inv.pages) {
  const sets = p.sets.filter((s) => !filter || p.page.toLowerCase().includes(filter) || s.name.toLowerCase().includes(filter));
  const singles = p.singles.filter((s) => !filter || p.page.toLowerCase().includes(filter) || s.toLowerCase().includes(filter));
  if (!sets.length && !singles.length) continue;
  const parts = sets.map((s) => `${s.name} (${s.variants}v, ${s.props}p)`).concat(singles.map((s) => `${s} (single)`));
  console.log(`${p.page.trim()}: ${parts.join("; ")}`);
}
