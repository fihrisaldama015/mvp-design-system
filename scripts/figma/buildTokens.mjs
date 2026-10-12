// Turn src/tokens/design_token.json (Tokens Brücke shape, see toBruecke.mjs) into:
//   src/tokens/tokens.css          CSS custom properties, always on (:root), plus one
//                                  [data-theme="<mode>"] block per extra mode (Dark)
//   src/tokens/tailwind.tokens.js  the Tailwind theme that points at those variables
//
// Variable names follow swt-fe's designTokenCore.js: slugify(collection + path), e.g.
// Color.zinc.50 -> --color-zinc-50, .Brand.neutral.500 -> --brand-neutral-500,
// +Theme.color.text.body -> --theme-color-text-body. Colours are "r g b" channels so
// Tailwind opacity modifiers (bg-x/20) keep working; aliases stay var() chains, so
// repointing a brand ramp in Figma changes one line and the chain follows.
//
// Usage: node scripts/figma/buildTokens.mjs [tokens.json] [outDir]
import fs from "node:fs";
import path from "node:path";

const [, , inArg = "src/tokens/design_token.json", outArg = "src/tokens"] = process.argv;
const doc = JSON.parse(fs.readFileSync(inArg, "utf8"));
const meta = doc.$extensions?.["tokens-bruecke-meta"] ?? {};
const VARIABLE_COLLECTIONS = meta.variableCollections ?? Object.keys(doc).filter((k) => !k.startsWith("$") && !k.endsWith("-styles"));

const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const isAlias = (v) => typeof v === "string" && /^\{.+\}$/.test(v);
const aliasSlug = (v) => slugify(v.slice(1, -1));
// Figma names marked with ❌ are deprecated by the designer: never emit them.
const isDeprecated = (p) => p.some((seg) => seg.includes("❌"));

// ---------- 1. Flatten every variable ----------
const tokens = []; // { collection, path[], slug, type, value, modes, scopes }
const bySlug = new Map();
for (const collection of VARIABLE_COLLECTIONS) {
  (function walk(node, at) {
    for (const [k, v] of Object.entries(node || {})) {
      if (k.startsWith("$") || !v || typeof v !== "object") continue;
      if ("$value" in v) {
        const p = [...at, k];
        if (isDeprecated(p)) continue;
        // Mock text for the designs (TEXT_CONTENT), not styling: no CSS for it.
        if ((v.scopes || []).includes("TEXT_CONTENT")) continue;
        const slug = slugify([collection, ...p].join("."));
        if (bySlug.has(slug)) throw new Error(`Name collision: --${slug}`);
        const t = { collection, path: p, slug, type: v.$type, value: v.$value, modes: v.$extensions?.mode ?? {}, scopes: v.scopes || [] };
        tokens.push(t);
        bySlug.set(slug, t);
      } else walk(v, [...at, k]);
    }
  })(doc[collection], []);
}

// Follow an alias chain to the literal token (needed for colour alpha).
function resolve(t, seen = new Set()) {
  if (!isAlias(t.value)) return t;
  const target = bySlug.get(aliasSlug(t.value));
  if (!target || seen.has(target.slug)) return null;
  seen.add(target.slug);
  return resolve(target, seen);
}

function hexToRgba(hex) {
  const m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(hex);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: m[2] ? Math.round((parseInt(m[2], 16) / 255) * 1000) / 1000 : 1 };
}

const warnings = [];
function cssValue(t, value) {
  if (isAlias(value)) {
    const target = aliasSlug(value);
    if (!bySlug.has(target)) {
      warnings.push(`--${t.slug}: alias to missing ${value}, skipped`);
      return null;
    }
    return `var(--${target})`;
  }
  switch (t.type) {
    case "color": {
      const c = hexToRgba(value);
      if (!c) return warnings.push(`--${t.slug}: unsupported colour ${value}`), null;
      return `${c.r} ${c.g} ${c.b}`; // alpha is applied by Tailwind (see colorRef)
    }
    case "dimension":
      return `${value.value}${value.unit}`;
    case "number":
    case "fontWeight":
      return String(value);
    case "string":
      return t.scopes.includes("FONT_FAMILY") || /font-family/.test(t.path.join("/")) ? `"${value}"` : `"${value}"`;
    default:
      return String(value);
  }
}

// ---------- 2. tokens.css ----------
const lines = [];
const modeBlocks = new Map(); // mode name -> lines
for (const collection of VARIABLE_COLLECTIONS) {
  const own = tokens.filter((t) => t.collection === collection);
  if (!own.length) continue;
  lines.push(`  /* ${collection} */`);
  for (const t of own) {
    const v = cssValue(t, t.value);
    if (v !== null) lines.push(`  --${t.slug}: ${v};`);
    const modeNames = Object.keys(t.modes);
    for (const m of modeNames.slice(1)) {
      if (JSON.stringify(t.modes[m]) === JSON.stringify(t.modes[modeNames[0]])) continue;
      const mv = cssValue(t, t.modes[m]);
      if (mv === null) continue;
      if (!modeBlocks.has(m)) modeBlocks.set(m, []);
      modeBlocks.get(m).push(`  --${t.slug}: ${mv};`);
    }
  }
}

// Effect styles: box shadows and blurs.
const shadowCss = (layers) =>
  layers
    .map((s) => {
      const c = hexToRgba(s.color);
      return `${s.inset ? "inset " : ""}${s.offsetX.value}px ${s.offsetY.value}px ${s.blur.value}px ${s.spread.value}px rgb(${c.r} ${c.g} ${c.b} / ${c.a})`;
    })
    .join(", ");
const effects = []; // { group, name, slug, type, css }
for (const [group, entries] of Object.entries(doc["Effect-styles"] || {})) {
  for (const [name, e] of Object.entries(entries)) {
    const css = e.$type === "shadow" ? shadowCss(e.$value) : `${e.$value.blur.value}px`;
    effects.push({ group, name, slug: slugify(name), type: e.$type, role: e.$value.role, css });
  }
}
if (effects.length) {
  lines.push("  /* Effect styles */");
  for (const e of effects) lines.push(`  --${e.slug}: ${e.css};`);
}

const header = `/* Generated by scripts/figma/buildTokens.mjs from src/tokens/design_token.json.
 * Source: Figma ${meta.figmaFileKey ?? "(unknown file)"}, exported ${meta.createdAt ?? "?"}. Do not edit by hand. */\n`;
let css = `${header}:root {\n${lines.join("\n")}\n}\n`;
for (const [m, block] of modeBlocks) css += `\n[data-theme="${slugify(m)}"] {\n${block.join("\n")}\n}\n`;

// ---------- 3. Tailwind theme ----------
// Colours: rgb(var(--x) / <alpha-value>); a colour that is transparent by design keeps its alpha.
function colorRef(t) {
  const lit = resolve(t);
  const c = lit && hexToRgba(lit.value);
  return c && c.a < 1 ? `rgb(var(--${t.slug}) / ${c.a})` : `rgb(var(--${t.slug}) / <alpha-value>)`;
}
const setPath = (obj, keys, val) => {
  let o = obj;
  for (const k of keys.slice(0, -1)) {
    if (typeof o[k] === "string") o[k] = { DEFAULT: o[k] };
    o = o[k] ??= {};
  }
  const last = keys.at(-1);
  if (o[last] && typeof o[last] === "object") o[last].DEFAULT = val;
  else o[last] = val;
};
const k = (seg) => slugify(seg);
// +Theme number tokens -> short utility keys, dropping the grouping words Figma uses:
// border/radius/default -> default, border/radius-button/sm -> button-sm,
// sizing/component sm -> component-sm, page spacing/page/page-padding -> page-padding,
// tv page spacing/page/page-gap -> tv-page-gap, sticker size/Size 1 -> sticker-size-1.
function semanticName(p) {
  if (p[0] === "border" && p[1] === "radius") return p.slice(2).join("-");
  if (p[0] === "border" && p[1].startsWith("radius-")) return `${p[1].slice(7)}-${p.slice(2).join("-")}`;
  if (p[0] === "border") return p.slice(1).join("-");
  if (p[0] === "sizing") return p.slice(1).join("-");
  if (p[0] === "page-spacing") return p.at(-1);
  if (p[0] === "tv-page-spacing") return `tv-${p.at(-1)}`;
  if (p[0] === "sticker-size") return `sticker-${p[1]}`;
  return p.join("-");
}

const colors = { inherit: "inherit", current: "currentColor", transparent: "transparent", black: "#000", white: "#fff" };
const textColor = {};
const backgroundColor = {};
const borderColor = {};
const spacing = {};
const extendSpacing = {};
const borderRadius = {};
const borderWidth = {};
const fontSize = {};
const fontWeight = {};
const opacity = {};
const screens = {};
const report = []; // what each token became, for the Foundations docs

for (const t of tokens) {
  const p = t.path.map(k);
  const v = `var(--${t.slug})`;
  if (t.type === "color") {
    if (t.collection === "Color") setPath(colors, p, colorRef(t));
    else if (t.collection === ".Brand") setPath(colors, ["brand", ...p], colorRef(t));
    else if (t.collection === "+Theme" && p[0] === "color") {
      const [, kind, ...rest] = p;
      const target = { text: textColor, background: backgroundColor, border: borderColor }[kind];
      if (target) setPath(target, rest, colorRef(t));
      else setPath(colors, [kind, ...rest], colorRef(t)); // e.g. color/bullet/base-1 -> bullet-base-1
    } else setPath(colors, [k(t.collection), ...p], colorRef(t)); // Annotation
    continue;
  }
  if (t.collection === "Spacing" && p[0].startsWith("space-")) {
    spacing[p[0].slice(6).replace(/-(\d)$/, ".$1").replace(/^0\.5$/, "0.5")] = v;
  } else if (t.collection === "Sizing" && p[0].startsWith("size-")) {
    spacing[p[0].slice(5).replace(/^(\d+)-(\d)$/, "$1.$2")] ??= v;
  } else if (t.collection === "Border" && p[0] === "radius") {
    const name = p[1].replace(/^rounded-?/, "") || "DEFAULT";
    borderRadius[name] = v;
  } else if (t.collection === "Border" && p[0] === "width") {
    const name = p[1].replace(/^border-/, "");
    borderWidth[name] = v;
    if (name === "1") borderWidth.DEFAULT ??= v;
  } else if (t.collection === "Typography" && p[0] === "font-size") {
    const lh = bySlug.get(slugify(`Typography.line-height.${t.path[1]}`));
    const entry = lh ? [v, { lineHeight: `var(--${lh.slug})` }] : v;
    fontSize[p[1]] = entry;
    if (p[1] === "md") fontSize.base = entry; // Graphene's "md" is Tailwind's "base"
  } else if (t.collection === "Typography" && p[0] === "font-weight") {
    fontWeight[{ regular: "normal", "semi-bold": "semibold" }[p[1]] ?? p[1]] = v;
  } else if (t.collection === "Opacity") {
    opacity[p[0].replace(/^opacity-/, "")] = v;
  } else if (t.collection === "Breakpoints") {
    screens[p[0]] = cssValue(t, t.value); // media queries cannot read var()
  } else if (t.collection === "+Theme") {
    // Semantic numbers: the Figma scope says which utility they belong to.
    const name = semanticName(p);
    if (t.scopes.includes("CORNER_RADIUS")) borderRadius[name] = v;
    else if (t.scopes.includes("STROKE_FLOAT")) borderWidth[name === "width-default" ? "DEFAULT" : name] = v;
    else if (t.scopes.some((x) => x === "GAP" || x === "WIDTH_HEIGHT" || x === "ALL_SCOPES")) extendSpacing[name] = v;
  } else continue;
}

const boxShadow = {};
const blur = {};
const backdropBlur = {};
for (const e of effects) {
  const v = `var(--${e.slug})`;
  if (e.type === "shadow") boxShadow[e.name === "shadow" ? "DEFAULT" : e.name.replace(/^shadow-/, "")] = v;
  else if (e.role === "background") backdropBlur[e.name === "background-blur" ? "DEFAULT" : e.name.replace(/^background-blur-/, "")] = v;
  else blur[e.name === "blur" ? "DEFAULT" : e.name.replace(/^blur-/, "")] = v;
}

// Text styles -> component classes, e.g. "Semi Bold/text-sm" -> .typo-semi-bold-text-sm
const typo = {};
const toVar = (val) => (isAlias(val) ? `var(--${aliasSlug(val)})` : typeof val === "object" ? `${val.value}${val.unit}` : val);
for (const [group, entries] of Object.entries(doc["Typography-styles"] || {})) {
  for (const [name, s] of Object.entries(entries)) {
    const x = s.$value;
    typo[`.typo-${slugify(group)}-${slugify(name)}`] = {
      fontFamily: toVar(x.fontFamily),
      fontWeight: toVar(x.fontWeight),
      fontSize: toVar(x.fontSize),
      lineHeight: toVar(x.lineHeight),
      letterSpacing: x.letterSpacing === "0%" ? "0" : toVar(x.letterSpacing),
      ...(x.textCase === "UPPER" ? { textTransform: "uppercase" } : {}),
      ...(x.fontStyle === "italic" ? { fontStyle: "italic" } : {}),
    };
  }
}

const fontFamilyToken = bySlug.get("theme-typography-font-family-default") || bySlug.get("typography-font-family-default");
const fontFamily = fontFamilyToken ? { sans: [`var(--${fontFamilyToken.slug})`, "ui-sans-serif", "system-ui", "sans-serif"] } : {};

// A semantic text colour must not share a name with another text-* utility: Tailwind would
// put both rules in one class (text-base = font size AND colour). Such colours get "-color".
const TEXT_UTILITIES = new Set([...Object.keys(fontSize), "left", "center", "right", "justify", "start", "end", "ellipsis", "clip", "wrap", "nowrap", "balance", "pretty"]);
for (const key of Object.keys(textColor))
  if (TEXT_UTILITIES.has(key)) {
    textColor[`${key}-color`] = textColor[key];
    delete textColor[key];
  }

// A semantic key that equals a palette name (text "orange") must not replace the palette:
// keep the shades and add the semantic colour as DEFAULT (text-orange + text-orange-500).
for (const map of [textColor, backgroundColor, borderColor])
  for (const [key, val] of Object.entries(map)) if (typeof val === "string" && colors[key] && typeof colors[key] === "object") map[key] = { DEFAULT: val };

const tw = `// Generated by scripts/figma/buildTokens.mjs from src/tokens/design_token.json. Do not edit by hand.
// Tailwind theme pointing at the CSS variables in tokens.css. Semantic colours from +Theme
// are split per utility: text-*, bg-*, border-* (ring-* and outline-* reuse the border set).
import plugin from "tailwindcss/plugin.js";

export const theme = ${JSON.stringify({ colors, spacing, borderRadius, borderWidth, fontSize, fontWeight, opacity, screens, boxShadow, blur, backdropBlur, fontFamily }, null, 2)};

export const extend = ${JSON.stringify({ textColor, backgroundColor, borderColor, ringColor: borderColor, outlineColor: borderColor, spacing: extendSpacing }, null, 2)};

// Text styles from Figma as classes: <p className="typo-semi-bold-text-sm">.
export const textStyles = ${JSON.stringify(typo, null, 2)};

export const textStylesPlugin = plugin(({ addComponents }) => addComponents(textStyles));

export default { theme, extend, plugins: [textStylesPlugin] };
`;

// ---------- 4. Index for the Foundations docs: token -> CSS var -> utility -> value per mode ----------
const classesBySlug = new Map();
const addClass = (slug, cls) => (classesBySlug.get(slug) ?? classesBySlug.set(slug, []).get(slug)).push(cls);
function indexUtilities(obj, prefix, keys = []) {
  for (const [key, val] of Object.entries(obj || {})) {
    const next = key === "DEFAULT" ? keys : [...keys, key];
    const raw = Array.isArray(val) ? val[0] : val;
    if (raw && typeof raw === "object") indexUtilities(raw, prefix, next);
    else if (typeof raw === "string") {
      const m = /var\(--([a-z0-9-]+)\)/.exec(raw);
      if (m) addClass(m[1], next.length ? `${prefix}-${next.join("-")}` : prefix);
    }
  }
}
indexUtilities(colors, "bg");
indexUtilities(textColor, "text");
indexUtilities(backgroundColor, "bg");
indexUtilities(borderColor, "border");
indexUtilities(spacing, "p");
// Semantic sizes: show the utility a designer means (h- for component heights, w- for panels).
for (const [key, val] of Object.entries(extendSpacing)) {
  const prefix = /gap/.test(key) ? "gap" : /padding|spacing/.test(key) ? "p" : /^(modal|drawer|dropdown)/.test(key) ? "w" : "h";
  indexUtilities({ [key]: val }, prefix);
}
indexUtilities(fontFamily, "font");
indexUtilities(borderRadius, "rounded");
indexUtilities(borderWidth, "border");
indexUtilities(fontSize, "text");
indexUtilities(fontWeight, "font");
indexUtilities(opacity, "opacity");
indexUtilities(boxShadow, "shadow");
indexUtilities(blur, "blur");
indexUtilities(backdropBlur, "backdrop-blur");

// Resolve a token to its final literal in a mode (aliases followed, per-mode values used).
function literalIn(t, mode, seen = new Set()) {
  const raw = mode && t.modes[mode] !== undefined ? t.modes[mode] : t.value;
  if (!isAlias(raw)) {
    if (t.type === "dimension") return `${raw.value}${raw.unit}`;
    return raw;
  }
  const target = bySlug.get(aliasSlug(raw));
  if (!target || seen.has(target.slug)) return null;
  seen.add(target.slug);
  return literalIn(target, Object.keys(target.modes).length ? mode : null, seen);
}
for (const t of tokens) if (t.collection === "Breakpoints") addClass(t.slug, `${t.path[0]}:`);
for (const t of tokens)
  if (t.collection === "Typography" && t.path[0] === "line-height") addClass(t.slug, `text-${t.path[1]} (line height)`);
const modeNames = [...new Set(tokens.flatMap((t) => Object.keys(t.modes)))];
const index = {
  source: { figmaFileKey: meta.figmaFileKey ?? null, exportedAt: meta.createdAt ?? null },
  modes: modeNames,
  tokens: tokens.map((t) => ({
    figma: `${t.collection}/${t.path.join("/")}`,
    collection: t.collection,
    type: t.type,
    cssVar: `--${t.slug}`,
    classes: classesBySlug.get(t.slug) ?? [],
    alias: isAlias(t.value) ? t.value : null,
    value: Object.keys(t.modes).length ? Object.fromEntries(modeNames.map((m) => [m, literalIn(t, m)])) : literalIn(t, null),
    // Only aliases are shown as "points to"; a literal per-mode value is already in value.
    aliasByMode: Object.keys(t.modes).length ? Object.fromEntries(Object.entries(t.modes).map(([m, v]) => [m, isAlias(v) ? v : null])) : null,
  })),
  effects: effects.map((e) => ({ figma: `${e.group}/${e.name}`, type: e.type, cssVar: `--${e.slug}`, css: e.css, classes: classesBySlug.get(e.slug) ?? [] })),
  textStyles: Object.entries(typo).map(([cls, v]) => ({ className: cls.slice(1), ...v })),
};

fs.mkdirSync(outArg, { recursive: true });
fs.writeFileSync(path.join(outArg, "tokens.css"), css);
fs.writeFileSync(path.join(outArg, "tailwind.tokens.js"), tw);
fs.writeFileSync(path.join(outArg, "tokens.index.json"), JSON.stringify(index, null, 2) + "\n");
console.log(`Wrote ${outArg}/tokens.css (${tokens.length} variables, ${effects.length} effects, ${modeBlocks.size} extra mode block) and tailwind.tokens.js (${Object.keys(typo).length} text styles)`);
for (const w of warnings) console.warn("warning:", w);
