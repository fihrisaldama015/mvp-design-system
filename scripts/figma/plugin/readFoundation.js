// Run through figma_execute (Desktop Bridge) in the FOUNDATION file. Read-only:
// nothing in the Figma file is created, changed or removed.
// Saves collections.json, scopes.json and styles.json through the local receiver
// (scripts/figma/dumpServer.py, port 9232), so big data never goes through the chat.
const PORT = (typeof ARGS !== "undefined" && ARGS.PORT) || 9232;
const save = async (name, data) => (await fetch(`http://localhost:${PORT}/save?name=${name}`, { method: "POST", body: JSON.stringify(data, null, 2) })).text();
const px = (v) => ({ value: Math.round(v * 1000) / 1000, unit: "px" });
const hx = (n) => Math.round(n * 255).toString(16).padStart(2, "0");
const hex8 = (c) => "#" + hx(c.r) + hx(c.g) + hx(c.b) + hx(c.a ?? 1);

const colls = await figma.variables.getLocalVariableCollectionsAsync();
const collName = new Map(colls.map((c) => [c.id, c.name]));
async function alias(bound) {
  if (!bound) return null;
  const v = await figma.variables.getVariableByIdAsync(bound.id);
  return v ? `{${collName.get(v.variableCollectionId)}.${v.name.split("/").join(".")}}` : null;
}
function put(root, name, value) {
  const parts = name.split("/");
  let node = root;
  for (const p of parts.slice(0, -1)) node = node[p] ??= {};
  node[parts.at(-1)] = value;
}

const collections = colls.map((c) => ({ id: c.id, name: c.name, modes: c.modes.map((m) => m.name), defaultMode: c.modes.find((m) => m.modeId === c.defaultModeId).name }));

const scopes = {};
for (const c of colls) {
  scopes[c.name] = {};
  for (const id of c.variableIds) {
    const v = await figma.variables.getVariableByIdAsync(id);
    scopes[c.name][v.name] = v.scopes;
  }
}

const typo = {};
for (const s of await figma.getLocalTextStylesAsync()) {
  const bv = s.boundVariables || {};
  const lh = s.lineHeight.unit === "PIXELS" ? px(s.lineHeight.value) : s.lineHeight.unit === "PERCENT" ? `${s.lineHeight.value}%` : "auto";
  const ls = s.letterSpacing.unit === "PERCENT" ? `${Math.round(s.letterSpacing.value * 100) / 100}%` : px(s.letterSpacing.value);
  put(typo, s.name, {
    $type: "typography",
    $value: {
      fontFamily: (await alias(bv.fontFamily)) ?? s.fontName.family,
      fontWeight: (await alias(bv.fontWeight)) ?? s.fontName.style,
      fontStyle: /italic/i.test(s.fontName.style) ? "italic" : "normal",
      fontSize: (await alias(bv.fontSize)) ?? px(s.fontSize),
      lineHeight: (await alias(bv.lineHeight)) ?? lh,
      letterSpacing: (await alias(bv.letterSpacing)) ?? ls,
      paragraphSpacing: (await alias(bv.paragraphSpacing)) ?? px(s.paragraphSpacing),
      paragraphIndent: (await alias(bv.paragraphIndent)) ?? px(s.paragraphIndent),
      textDecoration: s.textDecoration,
      textCase: s.textCase,
    },
    $description: s.description || "",
    $extensions: { styleId: s.id },
  });
}

const effects = {};
for (const s of await figma.getLocalEffectStylesAsync()) {
  const shadows = s.effects.filter((e) => e.type === "DROP_SHADOW" || e.type === "INNER_SHADOW");
  const blur = s.effects.find((e) => e.type === "LAYER_BLUR" || e.type === "BACKGROUND_BLUR");
  if (shadows.length)
    put(effects, s.name, {
      $type: "shadow",
      $value: shadows.map((e) => ({ inset: e.type === "INNER_SHADOW", color: hex8(e.color), offsetX: px(e.offset.x), offsetY: px(e.offset.y), blur: px(e.radius), spread: px(e.spread ?? 0) })),
    });
  else if (blur) put(effects, s.name, { $type: "blur", $value: { role: blur.type === "LAYER_BLUR" ? "layer" : "background", blur: px(blur.radius) } });
}

const paints = {};
for (const s of await figma.getLocalPaintStylesAsync()) {
  const p = s.paints[0];
  put(paints, s.name, { $type: "color", $value: p && p.type === "SOLID" ? hex8({ ...p.color, a: p.opacity ?? 1 }) : null });
}

return {
  collections: await save("collections.json", collections),
  scopes: await save("scopes.json", scopes),
  styles: await save("styles.json", { "Typography-styles": typo, "Effect-styles": effects, "Color-styles": paints }),
};
