// Reads a component's props from the code side of a review: which file and which `Component.propTypes = {` block to use,
// what each prop is (a looks prop, or data, content and behaviour), its options, description and default.
//
// Why it is a module of its own: a project does not always keep one component per `index.js`. swt-fe has `input/index.js` that holds
// `InputCustom` and only re-exports `Input` from `./Input`. Reading "the first propTypes block of the file" compared the Figma Input
// with the wrong component and said nothing. Here the block is picked by name, a re-export is followed, and an ambiguous file is an error.
//
// A review compares only what changes how a component LOOKS: an option of a variant (kind="outlined") or an on/off switch (searchable).
// Data (columns, rows, options), content (label, children), handlers and anything the project says is behaviour are not compared:
// the code of the project stays as it is. `isUiProp` is that rule.
import fs from "node:fs";
import path from "node:path";

const norm = (s) => String(s ?? "").replace(/[^a-z0-9]/gi, "").toLowerCase();

/** Every `Name.propTypes = {` in the text, in order: [{ component, at }]. */
export function findBlocks(text) {
  return [...text.matchAll(/(\w+)\.propTypes\s*=\s*\{/g)].map((m) => ({ component: m[1], at: m.index }));
}

/** What a prop is, from its name and the PropTypes expression: enum | bool | text | node | handler | data | other. */
export function kindOf(name, expr) {
  if (/^on[A-Z]/.test(name) || /^PropTypes\.func\b/.test(expr)) return "handler";
  if (/^PropTypes\.oneOf\(/.test(expr)) return "enum";
  if (/^PropTypes\.bool\b/.test(expr)) return "bool";
  if (/^PropTypes\.(string|number)\b/.test(expr)) return "text";
  if (/^PropTypes\.(node|element|elementType)\b/.test(expr)) return "node";
  if (/^PropTypes\.(array|arrayOf|object|objectOf|shape|exact|oneOfType|any|instanceOf)\b/.test(expr)) return "data";
  return "other";
}

/** Props that never describe looks, whatever their type. */
export const ALWAYS_BEHAVIOR = ["id", "name", "ref", "className", "style", "children", "value", "defaultValue"];

/** Is this code-only prop something a designer would see? Options of a variant and on/off switches are; data, content, handlers
 *  and the rest are not. `behavior` (names the project says are behaviour) beats `ui` (names the project says are looks). */
export function isUiProp(name, kind, { behavior = [], ui = [] } = {}) {
  if (ALWAYS_BEHAVIOR.includes(name) || behavior.includes(name)) return false;
  if (ui.includes(name)) return true;
  return kind === "enum" || kind === "bool";
}

/** The props of one block: { name: { kind, options, description, deprecated, via? } }. `via` is the file of a wrapper (--also). */
export function readBlock(text, at, { file, via = false } = {}) {
  const props = {};
  const end = text.indexOf("\n};", at);
  let desc = "";
  let open = null; // a /** ... */ comment that spans several lines
  for (const line of text.slice(at, end < 0 ? text.length : end).split("\n").slice(1)) {
    if (open !== null) {
      const close = line.match(/^\s*\*?\s*(.*?)\s*\*\/\s*$/);
      if (close) { desc = `${open} ${close[1]}`.trim(); open = null; } else open += ` ${line.replace(/^\s*\*\s?/, "").trim()}`;
      continue;
    }
    const start = line.match(/^\s*\/\*\*\s*(.*)$/);
    if (start && !start[1].includes("*/")) { open = start[1].trim(); continue; }
    const one = line.match(/^\s*\/\*\*\s*(.*?)\s*\*\/\s*$/);
    if (one) { desc = one[1]; continue; }
    const m = line.match(/^\s{2}(\w+):\s*(.*)$/);
    if (!m) continue;
    const opts = m[2].match(/oneOf\(\[(.*?)\]\)/);
    props[m[1]] = {
      kind: kindOf(m[1], m[2]),
      options: opts && m[2].startsWith("PropTypes.oneOf(") ? [...opts[1].matchAll(/"([^"]*)"/g)].map((x) => x[1]) : null,
      description: desc,
      deprecated: /^@deprecated/i.test(desc),
      via: via ? file : undefined,
    };
    desc = "";
  }
  return props;
}

/** The text between the braces of the destructured parameter of a component: `({ kind = "filled", size })` or
 *  `forwardRef(function Input({ size = "md" }, ref) {`. Brackets are counted, so a default such as `= {}` or an arrow function
 *  does not end it early. null when the component takes no destructured props. */
function paramObject(text, component) {
  const decl = (component && new RegExp(`(?:function|const)\\s+${component}\\b`).exec(text)) || /export (?:function|const) \w+/.exec(text);
  if (!decl) return null;
  const from = decl.index + decl[0].length;
  const open = /\(\s*\{/.exec(text.slice(from, from + 400)); // the first "(" that is followed by "{": forwardRef(function Name( { ...
  if (!open) return null;
  const start = from + open.index + open[0].length;
  let depth = 1;
  let i = start;
  for (; i < text.length && depth > 0; i += 1) {
    const ch = text[i];
    if (ch === '"' || ch === "'" || ch === "`") { // skip a string, escapes included
      for (i += 1; i < text.length && text[i] !== ch; i += 1) if (text[i] === "\\") i += 1;
    } else if ("{[(".includes(ch)) depth += 1;
    else if ("}])".includes(ch)) depth -= 1;
  }
  return depth === 0 ? text.slice(start, i - 1) : null;
}

/** Defaults from the signature of the component: `({ kind = "filled", loading = false })`. Only plain values count ("x", true, false,
 *  a number or a name); a rename (`status: statusProp`) or a function is not a default the design cares about. */
export function signatureDefaults(text, component) {
  const inner = paramObject(text, component);
  if (inner === null) return {};
  const parts = [];
  let depth = 0;
  let cur = "";
  for (let i = 0; i < inner.length; i += 1) {
    const ch = inner[i];
    if (ch === '"' || ch === "'" || ch === "`") {
      const at = i;
      for (i += 1; i < inner.length && inner[i] !== ch; i += 1) if (inner[i] === "\\") i += 1;
      cur += inner.slice(at, i + 1);
      continue;
    }
    if ("{[(".includes(ch)) depth += 1;
    else if ("}])".includes(ch)) depth -= 1;
    if (ch === "," && depth === 0) { parts.push(cur); cur = ""; } else cur += ch;
  }
  parts.push(cur);
  const out = {};
  for (const part of parts) {
    const m = part.trim().match(/^(\w+)\s*=\s*("[^"]*"|true|false|[\w.]+)$/);
    if (m) out[m[1]] = m[2].replace(/"/g, "");
  }
  return out;
}

function resolveFile(dir, rel) {
  if (!rel.startsWith(".")) return null; // a package, not this project's file
  const base = path.resolve(dir, rel);
  for (const c of [base, `${base}.js`, `${base}.jsx`, path.join(base, "index.js")]) if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  return null;
}

/** The file that `export { Name } from "./X"` (or `{ default as Name }`, `{ X as Name }`) points to, or null. */
export function reexportTarget(text, name, from) {
  for (const m of text.matchAll(/export\s*\{([^}]*)\}\s*from\s*["']([^"']+)["']/g)) {
    for (const part of m[1].split(",")) {
      const [orig, alias] = part.trim().split(/\s+as\s+/);
      if (norm(alias ?? orig) === norm(name)) { const f = resolveFile(path.dirname(from), m[2]); if (f) return f; }
    }
  }
  return null;
}

/**
 * Which block of which file is "the component". Order: the name given by --component or the project's config; then the folder name,
 * the file name and the Figma name; then a re-export of those names (`export { Input } from "./Input"`).
 * Returns { file, text, at, component, notes }. Throws an Error that says what to pass when it cannot tell.
 */
export function resolveCode({ codeFile, component, figmaName, depth = 0 }) {
  const text = fs.readFileSync(codeFile, "utf8");
  const blocks = findBlocks(text);
  const names = blocks.map((b) => b.component).join(", ") || "none";
  const found = (b, notes = []) => ({ file: codeFile, text, at: b.at, component: b.component, notes });
  if (component) {
    const hit = blocks.find((b) => norm(b.component) === norm(component));
    if (hit) return found(hit);
    const target = depth < 3 ? reexportTarget(text, component, codeFile) : null;
    if (target && target !== codeFile) return resolveCode({ codeFile: target, component, figmaName, depth: depth + 1 });
    throw new Error(`${codeFile} has no propTypes block for "${component}" (blocks in it: ${names}) and does not re-export it from a file of this project.`);
  }
  const parts = String(figmaName ?? "").split(/\s*[-/]\s*/);
  const hints = [path.basename(path.dirname(codeFile)), path.basename(codeFile).replace(/\.\w+$/, ""), figmaName, ...parts].filter((h) => h && norm(h) && norm(h) !== "index");
  for (const h of hints) {
    const hit = blocks.filter((b) => norm(b.component) === norm(h));
    if (hit.length === 1) return found(hit[0]);
  }
  if (depth < 3) {
    for (const h of hints) {
      const target = reexportTarget(text, h, codeFile);
      if (target && target !== codeFile) return resolveCode({ codeFile: target, component: h, figmaName, depth: depth + 1 });
    }
  }
  if (blocks.length === 1) {
    return found(blocks[0], [`The only propTypes block in ${codeFile} is for "${blocks[0].component}", which does not match "${hints[0]}" or the Figma name "${figmaName}". Pass --component ${blocks[0].component} (or the right name) to confirm which component this is.`]);
  }
  if (blocks.length === 0) throw new Error(`No Component.propTypes block in ${codeFile}.`);
  throw new Error(`${codeFile} has ${blocks.length} propTypes blocks (${names}) and none matches "${hints[0]}" or the Figma name "${figmaName}". Pass --component <Name>, or set "component" for it under review.components in figma-tokens.config.json.`);
}
