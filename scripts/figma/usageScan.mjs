// Where each design-system component is used: every capitalised JSX tag imported from components/* or proposed/*,
// with its attributes and the routes whose pages render that file. Written to src/app/review/usage.json for the review page.
//
// Limits: a page loaded lazily (React.lazy, import()) is not followed, and a route table that is not plain
// <Route path="..." element={<Page />} /> JSX is not understood. Both mean "no usage found", never an error.
//
// jsxTags, attrNames, resolveImport and the import walk are copied from the dev repo's design-system-slice/scripts/sliceScan.mjs
// (collectPage); routes are read as a tree so a pathless layout route reaches its children.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ALIASES = { pages: "src/pages", data: "src/data", utils: "src/utils", components: "src/components", app: "src/app", proposed: "src/proposed" };
const posix = (p) => p.split(path.sep).join("/");

// Copied from sliceScan.mjs, plus the tag's start index. Braces and quotes are skipped so `onClick={() => a > b}` does not end the tag.
function jsxTags(code) {
  const tags = [], re = /<([A-Z][A-Za-z0-9]*)(?=[\s/>])/g;
  let m;
  while ((m = re.exec(code))) {
    let i = re.lastIndex, depth = 0, quote = null, attrs = "";
    for (; i < code.length; i++) {
      const ch = code[i];
      if (quote) { if (ch === quote) quote = null; attrs += ch; continue; }
      if (ch === '"' || ch === "'" || ch === "`") { quote = ch; attrs += ch; continue; }
      if (ch === "{") depth++;
      if (ch === "}") depth--;
      if (ch === ">" && depth === 0) break;
      attrs += ch;
    }
    tags.push({ name: m[1], attrs, index: m.index, line: code.slice(0, m.index).split("\n").length });
  }
  return tags;
}

// { name: value } of a tag's attributes: "x" -> "x", bare or {true} -> true, {false} -> false, anything else -> "expr". Spreads are skipped.
export function attrValues(attrs) {
  const out = {};
  let i = 0;
  const s = attrs.replace(/\/\s*$/, "");
  while (i < s.length) {
    if (s[i] === "{") { i = skipBraces(s, i); continue; } // {...props}
    const m = /^[A-Za-z_][\w-]*/.exec(s.slice(i));
    if (!m) { i++; continue; }
    const name = m[0];
    i += name.length;
    let j = i;
    while (/\s/.test(s[j] ?? "")) j++;
    if (s[j] !== "=") { out[name] = true; continue; }
    j++;
    while (/\s/.test(s[j] ?? "")) j++;
    if (s[j] === '"' || s[j] === "'") {
      const end = s.indexOf(s[j], j + 1);
      out[name] = s.slice(j + 1, end < 0 ? s.length : end);
      i = end < 0 ? s.length : end + 1;
    } else if (s[j] === "{") {
      const end = skipBraces(s, j), expr = s.slice(j + 1, end - 1).trim();
      out[name] = expr === "true" ? true : expr === "false" ? false : "expr";
      i = end;
    } else i = j;
  }
  return out;
}

// Index just after the `}` that closes the `{` at `from`; quotes inside are skipped.
function skipBraces(s, from) {
  let depth = 0, quote = null;
  for (let i = from; i < s.length; i++) {
    const ch = s[i];
    if (quote) { if (ch === quote) quote = null; continue; }
    if (ch === '"' || ch === "'" || ch === "`") { quote = ch; continue; }
    if (ch === "{") depth++;
    if (ch === "}" && --depth === 0) return i + 1;
  }
  return s.length;
}

// Copied from sliceScan.mjs: null = a package import, undefined = an alias/relative import that does not resolve.
function resolveImport(root, from, spec) {
  let base;
  if (spec.startsWith(".")) base = path.resolve(path.dirname(from), spec);
  else { const [alias, ...rest] = spec.split("/"); if (!ALIASES[alias]) return null; base = path.join(root, ALIASES[alias], ...rest); }
  for (const c of [base, `${base}.js`, `${base}.jsx`, path.join(base, "index.js")]) if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  return undefined;
}

// The file and everything it imports through the app's aliases or relative paths (as collectPage in sliceScan.mjs).
function collectFiles(root, entry) {
  const seen = new Set(), queue = [entry];
  while (queue.length) {
    const f = queue.pop();
    if (seen.has(f)) continue;
    seen.add(f);
    for (const m of fs.readFileSync(f, "utf8").matchAll(/from\s+["']([^"']+)["']/g)) {
      const r = resolveImport(root, f, m[1]);
      if (r) queue.push(r);
    }
  }
  return [...seen];
}

// Local names imported from components/* or proposed/*: default `import X from`, named `import { A, B as C } from`.
function designImports(code) {
  const names = new Set();
  for (const m of code.matchAll(/import\s+([^;]*?)\s+from\s+["'](?:components\/)?(?:components|proposed)\/[^"']*["']/g)) {
    const clause = m[1], named = clause.match(/\{([^}]*)\}/)?.[1];
    const def = clause.replace(/\{[^}]*\}/, "").replace(/,/g, "").trim();
    if (def && !def.startsWith("*")) names.add(def);
    for (const spec of named?.split(",") ?? []) { const n = spec.trim().split(/\s+as\s+/).pop(); if (n) names.add(n); }
  }
  return names;
}

// Routes with the files that render them: [{ path, files }]. A pathless <Route element={<Layout />}> adds its own files to each child route.
function routeTable(root, app) {
  const code = fs.readFileSync(app, "utf8");
  const imports = {}; // Name -> absolute file
  for (const m of code.matchAll(/import\s+(\w+)\s+from\s+["']([^"']+)["']/g)) { const r = resolveImport(root, app, m[2]); if (r) imports[m[1]] = r; }
  const events = [];
  for (const t of jsxTags(code)) if (t.name === "Route") events.push({ ...t, open: true });
  for (const m of code.matchAll(/<\/Route\s*>/g)) events.push({ index: m.index, open: false });
  events.sort((a, b) => a.index - b.index);
  const out = [], stack = [];
  for (const e of events) {
    if (!e.open) { stack.pop(); continue; }
    const pathAttr = e.attrs.match(/\bpath\s*=\s*["']([^"']*)["']/)?.[1];
    const elem = e.attrs.match(/\belement\s*=\s*\{\s*<(\w+)/)?.[1];
    const file = elem && imports[elem];
    const parentPath = [...stack].reverse().find((f) => f.path !== undefined)?.path ?? "";
    const full = pathAttr === undefined ? undefined : pathAttr.startsWith("/") ? pathAttr : `${parentPath.replace(/\/$/, "")}/${pathAttr}`;
    const self = { path: full, file };
    if (full !== undefined && file) {
      out.push({ path: full, files: [...stack.flatMap((f) => (f.path === undefined && f.file ? [f.file] : [])), file] });
    }
    if (!/\/\s*$/.test(e.attrs)) stack.push(self);
  }
  return out;
}

export function scanUsage(root, { app = "src/App.js", excludeRoutes = ["/review"], routeSamples = {} } = {}) {
  const components = {}, warnings = [];
  const routes = routeTable(root, path.join(root, app)).filter((r) => !excludeRoutes.includes(r.path));
  const fileRoutes = new Map(); // absolute file -> [{ path, url }]
  for (const r of routes) {
    const url = r.path.includes(":") || r.path.includes("*") ? routeSamples[r.path] ?? null : r.path;
    const files = new Set();
    for (const entry of r.files) {
      try { collectFiles(root, entry).forEach((f) => files.add(f)); } catch (e) { warnings.push(`${entry}: ${e.message}`); }
    }
    for (const f of files) {
      if (!fileRoutes.has(f)) fileRoutes.set(f, []);
      fileRoutes.get(f).push({ path: r.path, url });
    }
  }
  for (const [file, rts] of fileRoutes) {
    if (!/^(src\/(pages|app|data)\/)/.test(posix(path.relative(root, file)))) continue; // design-system files are not usage
    try {
      const code = fs.readFileSync(file, "utf8"), names = designImports(code);
      for (const t of jsxTags(code)) {
        if (!names.has(t.name)) continue;
        (components[t.name] ??= []).push({ file: posix(path.relative(root, file)), line: t.line, attrs: attrValues(t.attrs), routes: rts });
      }
    } catch (e) { warnings.push(`${file}: ${e.message}`); }
  }
  return { generatedAt: new Date().toISOString(), components, warnings };
}

// Script: node scripts/figma/usageScan.mjs -> src/app/review/usage.json. Never fails the build.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = process.cwd();
  let routeSamples = {};
  try { routeSamples = JSON.parse(fs.readFileSync(path.join(root, "figma-tokens.config.json"), "utf8")).review?.routeSamples ?? {}; } catch { /* no config or no key */ }
  let usage = { generatedAt: new Date().toISOString(), components: {}, warnings: [] };
  try { usage = scanUsage(root, { routeSamples }); } catch (e) { usage.warnings.push(e.message); }
  for (const w of usage.warnings) console.warn(`usage: skipped ${w}`);
  const out = path.join(root, "src/app/review/usage.json");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(usage, null, 2) + "\n");
  console.log(`usage: ${Object.keys(usage.components).length} components -> ${path.relative(root, out)}`);
}
