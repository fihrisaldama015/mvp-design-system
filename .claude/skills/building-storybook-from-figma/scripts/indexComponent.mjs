// Record where a component lives in Figma, in figma-index.json at the project root (commit it).
// Run after plugin/readComponents.js saved .figma-dump/components.<Name>.json.
// Usage: node scripts/figma/indexComponent.mjs <Name> --file <figmaFileKey> [--story actions-button] [--code src/components/button]
// Then an update reads the set by ID (readComponents.js ARGS.IDS) instead of scanning pages.
import fs from "node:fs";
const [name, ...rest] = process.argv.slice(2);
const opt = (k) => (rest.includes(k) ? rest[rest.indexOf(k) + 1] : undefined);
if (!name || !opt("--file")) { console.error("Usage: node scripts/figma/indexComponent.mjs <Name> --file <figmaFileKey> [--story <id>] [--code <dir>]"); process.exit(1); }
const dump = JSON.parse(fs.readFileSync(`.figma-dump/components.${name.replace(/[^a-z0-9]+/gi, "-")}.json`, "utf8"));
const file = "figma-index.json";
const idx = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : { $comment: "Where each built component lives in Figma. Read by ID: readComponents.js ARGS.IDS; verify with plugin/resolveIds.js.", components: {} };
idx.components[name] = {
  figmaFileKey: opt("--file"),
  fileName: dump.fileName ?? null,
  nodeId: dump.nodeId,
  page: dump.page ?? null,
  variants: dump.variants?.length ?? null,
  props: Object.keys(dump.props || {}),
  readAt: dump.readAt ?? null,
  ...(opt("--story") ? { story: opt("--story") } : {}),
  ...(opt("--code") ? { code: opt("--code") } : {}),
};
fs.writeFileSync(file, JSON.stringify(idx, null, 2) + "\n");
console.log(`figma-index.json: ${name} -> ${dump.nodeId} (${idx.components[name].page?.name ?? "page ?"}), ${idx.components[name].variants} variants`);
