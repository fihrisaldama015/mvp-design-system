// Print the inventory saved by plugin/inventory.js, one line per page. Optional filter
// (case-insensitive) on page or set name: node scripts/figma/listSets.mjs button [--ids]
import fs from "node:fs";
const withIds = process.argv.includes("--ids");
const filter = (process.argv.slice(2).find((a) => !a.startsWith("--")) || "").toLowerCase();
const inv = JSON.parse(fs.readFileSync(".figma-dump/inventory.json", "utf8"));
console.log(`# ${inv.file}`);
for (const p of inv.pages) {
  const sets = p.sets.filter((s) => !filter || p.page.toLowerCase().includes(filter) || s.name.toLowerCase().includes(filter));
  const nameOf = (s) => (typeof s === "string" ? s : s.name);
  const singles = p.singles.filter((s) => !filter || p.page.toLowerCase().includes(filter) || nameOf(s).toLowerCase().includes(filter));
  if (!sets.length && !singles.length) continue;
  const parts = sets.map((s) => `${s.name} (${s.variants}v, ${s.props}p${withIds && s.id ? `, ${s.id}` : ""})`).concat(singles.map((s) => `${nameOf(s)} (single${withIds && s.id ? `, ${s.id}` : ""})`));
  console.log(`${p.page.trim()}: ${parts.join("; ")}`);
}
