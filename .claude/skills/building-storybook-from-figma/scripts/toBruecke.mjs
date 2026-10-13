// Build a Tokens Brücke-shaped design_token.json straight from Figma, so the designer
// no longer has to export with the Brücke plugin. Same file shape that swt-fe's
// scripts/syncDesignTokens.js reads.
//
// Inputs (all written to one folder by the steps in docs/shield/foundation.md):
//   tokens.dtcg.json   figma_export_tokens (format dtcg, legacy dialect, px)
//   collections.json   plugin/readFoundation.js: collections in Figma order + modes
//   scopes.json        plugin/readFoundation.js: real variable scopes (the export
//                      drops [] and ["ALL_SCOPES"], so they cannot come from it)
//   styles.json        plugin/readFoundation.js: text / effect / paint styles
//
// Usage: node scripts/figma/toBruecke.mjs <inputDir> <out.json>
import fs from "node:fs";
import path from "node:path";

const [, , inDir, outPath] = process.argv;
if (!inDir || !outPath) {
  console.error("Usage: node scripts/figma/toBruecke.mjs <inputDir> <out.json>");
  process.exit(1);
}
const read = (f) => JSON.parse(fs.readFileSync(path.join(inDir, f), "utf8"));
const src = read("tokens.dtcg.json");
const collections = read("collections.json");
const realScopes = read("scopes.json");
const styles = fs.existsSync(path.join(inDir, "styles.json")) ? read("styles.json") : null;

const byId = new Map(collections.map((c) => [c.id, c]));

// Leaf tokens of the export, with their path under the top-level slug.
const leaves = [];
(function walk(node, at) {
  if (node && typeof node === "object" && "$value" in node) {
    leaves.push({ at, token: node });
    return;
  }
  for (const [k, v] of Object.entries(node || {})) if (!k.startsWith("$")) walk(v, [...at, k]);
})(src, []);

// Keep Figma's order (collection order, then variable order inside it), like Brücke does.
// The export is alphabetical (opacity-0, opacity-10, opacity-100, opacity-20 ...).
// scopes.json lists every collection's variables in Figma order.
const orderOf = new Map();
collections.forEach((c, ci) => Object.keys(realScopes[c.name] || {}).forEach((name, vi) => orderOf.set(`${c.name}/${name}`, ci * 100000 + vi)));
const orderKey = ({ at, token }) => orderOf.get(`${byId.get(token.$extensions["figma-console-mcp"].collectionId).name}/${at.slice(1).join("/")}`) ?? Infinity;
leaves.sort((a, b) => orderKey(a) - orderKey(b));

// The export names collections by slug ("+Theme" -> "theme"); learn slug -> real name.
const slugToName = new Map();
for (const { at, token } of leaves) slugToName.set(at[0], byId.get(token.$extensions["figma-console-mcp"].collectionId).name);

const isHex = (v) => typeof v === "string" && /^#[0-9a-f]{3,8}$/i.test(v);
// "{brand.neutral.950}" -> "{.Brand.neutral.950}"
const ref = (r) => {
  const parts = r.slice(1, -1).split(".");
  const name = slugToName.get(parts[0]);
  if (!name) throw new Error(`Unknown alias collection in ${r}`);
  return `{${[name, ...parts.slice(1)].join(".")}}`;
};

// Brücke picks the DTCG type of a FLOAT variable from its scope.
function typeFor(resolvedType, scopes) {
  if (resolvedType === "COLOR") return "color";
  if (resolvedType === "STRING") return "string";
  if (resolvedType === "BOOLEAN") return "boolean";
  if (scopes.includes("OPACITY")) return "number";
  if (scopes.includes("FONT_WEIGHT")) return "fontWeight";
  return "dimension";
}

function literal(type, value, scopes) {
  if (type === "color") return isHex(value) ? value.toLowerCase() : value;
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (type === "dimension") return { value: n, unit: "px" };
  // Figma stores opacity as a percentage (5 = 5%); Brücke writes 0..1.
  if (type === "number" && scopes.includes("OPACITY")) return Math.round((n / 100) * 10000) / 10000;
  if (type === "number" || type === "fontWeight") return n;
  return value;
}

const out = {};
for (const c of collections) out[c.name] = {};

for (const { at, token } of leaves) {
  const meta = token.$extensions["figma-console-mcp"];
  const coll = byId.get(meta.collectionId);
  const name = at.slice(1).join("/");
  const scopes = realScopes[coll.name]?.[name];
  if (!scopes) throw new Error(`No scopes for ${coll.name}/${name}: re-read scopes.json from the same file`);
  const type = typeFor(meta.figmaResolvedType, scopes);
  const perMode = meta.lastSyncedValue || {};
  const valueIn = (m) => {
    const v = perMode[m];
    if (!v) return undefined;
    return "reference" in v ? ref(v.reference) : literal(type, v.literal, scopes);
  };
  const mode = {};
  if (coll.modes.length > 1) for (const m of coll.modes) mode[m] = valueIn(m);

  let node = out[coll.name];
  const keys = at.slice(1);
  for (const k of keys.slice(0, -1)) node = node[k] ??= {};
  node[keys.at(-1)] = {
    $type: type,
    $value: valueIn(coll.defaultMode),
    $description: token.$description ?? "",
    scopes,
    $extensions: { mode },
  };
}

// Brücke turns a font style name that is not bound to a variable into its numeric weight.
const WEIGHTS = { thin: 100, hairline: 100, "extra light": 200, "ultra light": 200, light: 300, regular: 400, normal: 400, book: 400, medium: 500, "semi bold": 600, semibold: 600, "demi bold": 600, bold: 700, "extra bold": 800, "ultra bold": 800, black: 900, heavy: 900 };
if (styles) {
  (function fixWeights(node) {
    if (node && node.$type === "typography") {
      const w = node.$value.fontWeight;
      if (typeof w === "string" && !w.startsWith("{")) node.$value.fontWeight = WEIGHTS[w.toLowerCase().replace("italic", "").trim()] ?? w;
      return;
    }
    for (const [k, v] of Object.entries(node || {})) if (!k.startsWith("$")) fixWeights(v);
  })(styles["Typography-styles"]);
  Object.assign(out, styles);
}

const exportMeta = src.$extensions["figma-console-mcp"];
out.$extensions = {
  // Same key and createdAt as a Brücke export, so syncDesignTokens.js's rollback guard keeps working.
  "tokens-bruecke-meta": {
    useDTCG: true,
    spec: "https://www.designtokens.org/tr/2025.10/format/",
    colorMode: "hex",
    variableCollections: collections.map((c) => c.name),
    createdAt: exportMeta.exportedAt,
    generator: `figma-console-mcp ${exportMeta.mcpVersion} + scripts/figma/toBruecke.mjs`,
    figmaFileKey: exportMeta.figmaFileKey,
  },
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n");

// Sidecar: where every token lives in Figma (file key + variable / collection / style IDs).
// design_token.json stays in the plain Brücke shape; buildTokens.mjs copies these IDs into
// tokens.index.json. IDs come from the export (variableId, collectionId) and from styles.json.
const ids = { figmaFileKey: src.$extensions?.["figma-console-mcp"]?.figmaFileKey ?? null, exportedAt: src.$extensions?.["figma-console-mcp"]?.exportedAt ?? null, collections: {}, variables: {}, textStyles: {}, effectStyles: {} };
for (const c of collections) ids.collections[c.name] = c.id;
for (const { at, token } of leaves) {
  const ext = token.$extensions["figma-console-mcp"];
  ids.variables[`${byId.get(ext.collectionId).name}/${at.slice(1).join("/")}`] = ext.variableId;
}
const flat = (node, at, into) => {
  if (node && typeof node === "object" && "$value" in node) { if (node.$extensions?.styleId) into[at.join("/")] = node.$extensions.styleId; return; }
  for (const [k, v] of Object.entries(node || {})) if (!k.startsWith("$")) flat(v, [...at, k], into);
};
if (styles) { flat(styles["Typography-styles"], [], ids.textStyles); flat(styles["Effect-styles"], [], ids.effectStyles); }
fs.writeFileSync(path.join(path.dirname(outPath), "figma-ids.json"), JSON.stringify(ids, null, 2) + "\n");
console.log(`Wrote ${outPath}: ${leaves.length} variables in ${collections.length} collections${styles ? " + styles" : ""}`);
