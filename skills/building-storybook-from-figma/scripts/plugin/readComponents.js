// Run through figma_execute (Desktop Bridge) in the COMPONENT file. Read-only.
// For each component set in NAMES, saves every variant's visual spec — size, auto
// layout, radius, fills, strokes, effects, text — with the NAME of the variable or
// style bound to each value (e.g. "+Theme/color/background/primary/default"), so the
// code can use the matching token class. Saved as components.<set>.json through the
// local receiver (scripts/figma/dumpServer.py, port 9232).
//
// How to run: through the loader (SKILL.md), ARGS = { NAMES: ["Button"], DEPTH: 8, PORT: 9232 },
// figma_execute with fileKey and timeout: 30000.
// One set per call: a 945-variant set can take most of the 30 s.
const _A = typeof ARGS !== "undefined" ? ARGS : {};
const NAMES = _A.NAMES || (_A.IDS ? [] : ["Button"]);
const IDS = _A.IDS || []; // node IDs from inventory.json / figma-index.json: jump straight to the set, no page scan
const T0 = Date.now();
const DEPTH = _A.DEPTH ?? 8; // layers below the variant to read (text inside an input sits ~5 deep)
const INSTANCE_DEPTH = 6; // below this depth an instance (icon, nested part) keeps name + size only
const PORT = _A.PORT || 9232;
const save = async (name, data) => (await fetch(`http://localhost:${PORT}/save?name=${encodeURIComponent(name)}`, { method: "POST", body: JSON.stringify(data, null, 1) })).text();

const varCache = new Map();
async function varName(alias) {
  if (!alias || !alias.id) return null;
  if (varCache.has(alias.id)) return varCache.get(alias.id);
  const v = await figma.variables.getVariableByIdAsync(alias.id);
  let coll = "?";
  try { coll = (await figma.variables.getVariableCollectionByIdAsync(v.variableCollectionId)).name; } catch (e) { /* remote collection not readable */ }
  const name = v ? `${coll}/${v.name}` : null;
  varCache.set(alias.id, name);
  return name;
}
const styleCache = new Map();
async function styleName(id) {
  if (!id || typeof id !== "string") return null;
  if (!styleCache.has(id)) { const s = await figma.getStyleByIdAsync(id); styleCache.set(id, s ? s.name : null); }
  return styleCache.get(id);
}
const hx = (n) => Math.round(n * 255).toString(16).padStart(2, "0");
const hex = (c, a = 1) => "#" + hx(c.r) + hx(c.g) + hx(c.b) + (a < 1 ? hx(a) : "");
const round = (n) => (typeof n === "number" ? Math.round(n * 100) / 100 : n);

async function paints(list, bound) {
  if (!Array.isArray(list)) return undefined;
  const out = [];
  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    if (p.visible === false) continue;
    out.push({ type: p.type, hex: p.type === "SOLID" ? hex(p.color, p.opacity ?? 1) : undefined, var: await varName(bound && bound[i]) });
  }
  return out.length ? out : undefined;
}

async function spec(node, depth = 0) {
  const bv = node.boundVariables || {};
  const s = { name: node.name, type: node.type };
  if (node.visible === false) s.hidden = true;
  s.w = round(node.width); s.h = round(node.height);
  if ("layoutMode" in node && node.layoutMode !== "NONE") {
    s.layout = {
      mode: node.layoutMode,
      pad: [node.paddingTop, node.paddingRight, node.paddingBottom, node.paddingLeft].map(round),
      padVar: await Promise.all(["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"].map((k) => varName(bv[k]))),
      gap: round(node.itemSpacing), gapVar: await varName(bv.itemSpacing),
      align: [node.primaryAxisAlignItems, node.counterAxisAlignItems],
      sizing: [node.layoutSizingHorizontal, node.layoutSizingVertical],
    };
  }
  if (bv.height || bv.minHeight) s.hVar = await varName(bv.height || bv.minHeight);
  if (bv.width || bv.minWidth) s.wVar = await varName(bv.width || bv.minWidth);
  if ("cornerRadius" in node && (node.cornerRadius || bv.topLeftRadius)) {
    s.radius = node.cornerRadius === figma.mixed ? [node.topLeftRadius, node.topRightRadius, node.bottomRightRadius, node.bottomLeftRadius] : round(node.cornerRadius);
    s.radiusVar = await varName(bv.topLeftRadius);
  }
  const fills = await paints(node.fills, bv.fills); if (fills) s.fills = fills;
  const strokes = await paints(node.strokes, bv.strokes);
  if (strokes) { s.strokes = strokes; s.strokeAlign = node.strokeAlign; s.strokeWeight = round(node.strokeWeight === figma.mixed ? node.strokeTopWeight : node.strokeWeight); s.strokeVar = await varName(bv.strokeWeight || bv.strokeTopWeight); s.dash = node.dashPattern && node.dashPattern.length ? node.dashPattern : undefined;
    // per-side stroke weights (a bottom-only border has top 0): keep them when the sides differ
    if (node.strokeWeight === figma.mixed) s.strokeSides = [node.strokeTopWeight, node.strokeRightWeight, node.strokeBottomWeight, node.strokeLeftWeight].map(round); }
  if (node.effectStyleId) s.effect = await styleName(node.effectStyleId);
  if (node.opacity !== undefined && node.opacity < 1) s.opacity = round(node.opacity);
  if (node.type === "TEXT") {
    s.text = node.characters.slice(0, 60);
    s.textStyle = await styleName(node.textStyleId);
    s.fontSize = node.fontSize === figma.mixed ? "mixed" : node.fontSize;
    s.fontWeight = node.fontWeight === figma.mixed ? "mixed" : node.fontWeight;
  }
  if (node.type === "INSTANCE") {
    const main = await node.getMainComponentAsync();
    s.instanceOf = main ? (main.parent && main.parent.type === "COMPONENT_SET" ? `${main.parent.name} / ${main.name}` : main.name) : null;
    if (depth > INSTANCE_DEPTH) return s; // deep instances: name and size are enough
  }
  if ("children" in node && depth < DEPTH) s.children = await Promise.all(node.children.map((c) => spec(c, depth + 1)));
  return s;
}

const pageOf = (n) => { let p = n; while (p && p.type !== "PAGE") p = p.parent; return p ? { name: p.name, id: p.id } : null; };
const result = {};
if (!IDS.length) await figma.loadAllPagesAsync(); // by name the whole file has to be searched; by ID it does not
const targets = [];
for (const name of NAMES) targets.push({ key: name, set: figma.root.findOne((n) => n.type === "COMPONENT_SET" && n.name === name) });
for (const id of IDS) { const n = await figma.getNodeByIdAsync(id); targets.push({ key: id, set: n && n.type === "COMPONENT_SET" ? n : null }); }
for (const { key, set } of targets) {
  if (!set) { result[key] = "not found"; continue; }
  const name = set.name;
  const props = {};
  for (const [key, d] of Object.entries(set.componentPropertyDefinitions)) props[key.split("#")[0]] = { type: d.type, default: d.defaultValue, options: d.variantOptions };
  const variants = [];
  for (const v of set.children) variants.push({ props: v.variantProperties, spec: await spec(v) });
  const file = `components.${name.replace(/[^a-z0-9]+/gi, "-")}.json`;
  result[key] = { file, variants: variants.length, saved: await save(file, { name, nodeId: set.id, page: pageOf(set), fileName: figma.root.name, readAt: new Date().toISOString(), props, defaultVariant: set.defaultVariant ? set.defaultVariant.name : null, variants }) };
}
result.ms = Date.now() - T0;
return result;
