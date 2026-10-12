// Read components.<Name>.json (from plugin/readComponents.js) and work out which
// variant property drives which visual attribute. Turns a 360-variant matrix into a
// short spec: "Size drives height / padding / text style", "Kind + Status + State
// drive the fill", with the token behind each value.
//
// Usage: node scripts/figma/analyzeComponent.mjs <components.Name.json> [--values]
import fs from "node:fs";

const [, , file, ...flags] = process.argv;
const data = JSON.parse(fs.readFileSync(file, "utf8"));
const SHOW_VALUES = flags.includes("--values");
const propNames = Object.keys(data.variants[0].props);

// Flatten a spec tree into "path.attribute" -> value (value = token name when bound).
function flatten(node, p, out) {
  const put = (k, v) => v !== undefined && v !== null && (out[`${p} .${k}`] = typeof v === "object" ? JSON.stringify(v) : String(v));
  put("hidden", node.hidden ? "hidden" : "shown");
  put("height", node.hVar ?? (node.layout?.sizing?.[1] === "FIXED" || node.type === "INSTANCE" || node.type === "VECTOR" ? node.h : undefined));
  if (node.wVar) put("width", node.wVar);
  if (node.layout) {
    put("padding", node.layout.padVar.some(Boolean) ? node.layout.padVar : node.layout.pad);
    put("gap", node.layout.gapVar ?? node.layout.gap);
  }
  put("radius", node.radiusVar ?? node.radius);
  if (node.fills) put("fill", node.fills.map((f) => f.var ?? f.hex ?? f.type));
  if (node.strokes) put("stroke", node.strokes.map((f) => f.var ?? f.hex ?? f.type));
  if (node.strokes) put("strokeWeight", node.strokeVar ?? node.strokeWeight);
  if (node.dash) put("dash", node.dash);
  put("effect", node.effect);
  put("opacity", node.opacity);
  if (node.type === "TEXT") put("textStyle", node.textStyle ?? `${node.fontSize}/${node.fontWeight}`);
  if (node.type === "INSTANCE") put("instance", node.instanceOf);
  for (const c of node.children || []) flatten(c, `${p} > ${c.name}`, out);
  return out;
}

const rows = data.variants.map((v) => ({ props: v.props, attrs: flatten(v.spec, "root", {}) }));
const allAttrs = [...new Set(rows.flatMap((r) => Object.keys(r.attrs)))].sort();

// Smallest set of properties that fully determines an attribute (singles, then pairs, then triples).
const subsets = [];
for (let size = 1; size <= propNames.length; size++) {
  (function combo(start, acc) {
    if (acc.length === size) return subsets.push(acc);
    for (let i = start; i < propNames.length; i++) combo(i + 1, [...acc, propNames[i]]);
  })(0, []);
}
function drivers(attr) {
  const values = new Set(rows.map((r) => r.attrs[attr] ?? "∅"));
  if (values.size === 1) return { constant: [...values][0] };
  for (const set of subsets) {
    const seen = new Map();
    let ok = true;
    for (const r of rows) {
      const key = set.map((p) => r.props[p]).join("|");
      const val = r.attrs[attr] ?? "∅";
      if (seen.has(key) && seen.get(key) !== val) { ok = false; break; }
      seen.set(key, val);
    }
    if (ok) return { by: set, table: seen };
  }
  return { by: ["(no small set)"], table: new Map() };
}

console.log(`# ${data.name}: ${data.variants.length} variants`);
console.log(`Properties: ${Object.entries(data.props).map(([k, d]) => `${k}${d.options ? `[${d.options.join("|")}]` : `:${d.type}`}${d.default !== undefined ? `=${d.default}` : ""}`).join(", ")}`);
console.log(`Default variant: ${data.defaultVariant}\n`);
const groups = new Map();
for (const attr of allAttrs) {
  const d = drivers(attr);
  const key = d.constant !== undefined ? "constant" : d.by.join(" + ");
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push({ attr, d });
}
for (const [key, list] of [...groups].sort((a, b) => (a[0] === "constant") - (b[0] === "constant"))) {
  console.log(`## ${key === "constant" ? "Same in every variant" : `Driven by ${key}`}`);
  for (const { attr, d } of list) {
    if (d.constant !== undefined) console.log(`- ${attr} = ${d.constant}`);
    else {
      const distinct = new Set(d.table.values());
      console.log(`- ${attr} (${distinct.size} values)`);
      if (SHOW_VALUES) for (const [k, v] of d.table) console.log(`    ${k} → ${v}`);
    }
  }
  console.log("");
}
