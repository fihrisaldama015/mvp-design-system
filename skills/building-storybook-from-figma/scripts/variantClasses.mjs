// For each variant of a component (optionally filtered), print the Tailwind class of
// every token bound to it: fill → bg-*, stroke → border-*, text fill → text-*, height →
// h-*, padding → p*, gap → gap-*, radius → rounded-*, text style → typo-*.
// This is the Figma → class table you write the component from.
//
// Usage: node scripts/figma/variantClasses.mjs <components.Name.json> ["Prop=value,Prop=value"] [--node "Label"]
import fs from "node:fs";

const [, , file, filterArg = "", ...rest] = process.argv;
const nodeFilter = rest.includes("--node") ? rest[rest.indexOf("--node") + 1] : null;
const data = JSON.parse(fs.readFileSync(file, "utf8"));
const index = JSON.parse(fs.readFileSync("src/tokens/tokens.index.json", "utf8"));
const classesOf = new Map(index.tokens.map((t) => [t.figma, t.classes]));
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const filter = Object.fromEntries(filterArg.split(",").filter(Boolean).map((kv) => kv.split("=")));
const variants = data.variants.filter((v) => Object.entries(filter).every(([k, val]) => v.props[k] === val));
const varying = Object.keys(data.variants[0].props).filter((k) => !(k in filter));

// The index lists one example class per token (spacing as p-*); swap the utility prefix
// when the use is different (gap-*, py-*).
function cls(token, prefix) {
  if (!token) return null;
  const list = classesOf.get(token) || [];
  const hit = list.find((c) => c.startsWith(`${prefix}-`)) || list.find((c) => c === prefix);
  if (hit) return hit;
  if (list[0]) return list[0].replace(/^[a-z]+(?=-)/, prefix);
  return `?${token}`;
}
function lines(node, path, out) {
  const here = path ? `${path} > ${node.name}` : "root";
  if (node.hidden) return out;
  const show = !nodeFilter || here.includes(nodeFilter);
  if (show) {
    const parts = [];
    // Text and icon vectors take their colour from text-* (icons use currentColor).
    const textNode = node.type === "TEXT" || node.type === "VECTOR";
    for (const f of node.fills || []) if (f.var) parts.push(cls(f.var, textNode ? "text" : "bg"));
    for (const s of node.strokes || []) if (s.var) parts.push(cls(s.var, "border"));
    if (node.strokeVar) parts.push(cls(node.strokeVar, "border"));
    if (node.hVar) parts.push(cls(node.hVar, "h"));
    if (node.layout) {
      const [t, r, b, l] = node.layout.padVar;
      if (t && t === b) parts.push(cls(t, "py"));
      if (l && l === r) parts.push(cls(l, "px"));
      if (node.layout.gapVar) parts.push(cls(node.layout.gapVar, "gap"));
    }
    if (node.radiusVar) parts.push(cls(node.radiusVar, "rounded"));
    if (node.textStyle) parts.push(`typo-${slug(node.textStyle.replace("/", " "))}`);
    if (node.dash) parts.push("border-dashed");
    if (node.instanceOf) parts.push(`[${node.instanceOf} ${node.w}px]`);
    if (parts.length) out.push(`  ${here}: ${parts.filter(Boolean).join(" ")}`);
  }
  for (const c of node.children || []) lines(c, here, out);
  return out;
}

for (const v of variants) {
  console.log(varying.map((k) => `${k}=${v.props[k]}`).join(" "));
  console.log(lines(v.spec, "", []).join("\n"));
}
console.log(`\n${variants.length} variant(s)`);
