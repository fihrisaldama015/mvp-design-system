// Where each design-system component is used: every capitalised JSX tag imported from components/* or proposed/*,
// with its attributes and the routes whose pages render that file. Written to src/app/review/usage.json for the review page.
//
// Known limits (each means a use may be missed; none is an error):
// - routes are read by two adapters: JSX (<Route path="..." element={<Page />} />) and config arrays ({ path: "...", component: Page }
//   or element: <Page />). Any other way of declaring routes (createBrowserRouter objects with children, file-based routing, a
//   generated table) is NOT read: `node scripts/figma/usageScan.mjs --probe` says what was read, and when it is little or nothing
//   the usage numbers must not be trusted (see "Routing probe" in reference/review-service.md);
// - nested `children: []` in a config array are not followed;
// - member tags (<UI.Select>) and namespace/barrel imports (import * as UI, export * from) are not recorded;
// - a path-ful parent route element that renders <Outlet /> does not add its files to its children (only pathless layouts do);
// - comment stripping is textual: `//` counts as a comment only at the start of a line or after whitespace (not in "http://").
//
// jsxTags, attrNames, resolveImport and the import walk are copied from the dev repo's design-system-slice/scripts/sliceScan.mjs
// (collectPage); routes are read as a tree so a pathless layout route reaches its children.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cleanHowToSee } from "./usageCore.mjs";

const ALIASES = { pages: "src/pages", data: "src/data", utils: "src/utils", components: "src/components", app: "src/app", proposed: "src/proposed" };
const posix = (p) => p.split(path.sep).join("/");

// Blanks JSX `{/* */}`, block and line comments, keeping newlines so line numbers hold. Not string-aware on purpose:
// an apostrophe in JSX text ("Don't") would otherwise start a string and hide the tags after it.
function stripComments(code) {
  const blank = (m) => m.replace(/[^\n]/g, " ");
  return code.replace(/\/\*[\s\S]*?\*\//g, blank).replace(/(^|\s)\/\/[^\n]*/g, (m, lead) => lead + blank(m.slice(lead.length)));
}

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
    if (s[i] === "{") { if (/^\{\s*\.\.\./.test(s.slice(i))) out["..."] = "expr"; i = skipBraces(s, i); continue; } // {...props}
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

// null = a package import, undefined = an alias/relative import that does not resolve. A bare path (`pages/home`) is looked up under
// src/ when it is not a known alias: that is what a baseUrl of "src" (jsconfig.json) does, as in swt-fe.
function resolveImport(root, from, spec, aliases = ALIASES) {
  let base;
  if (spec.startsWith(".")) base = path.resolve(path.dirname(from), spec);
  else {
    const [alias, ...rest] = spec.split("/");
    if (aliases[alias]) base = path.join(root, aliases[alias], ...rest);
    else if (fs.existsSync(path.join(root, "src", alias))) base = path.join(root, "src", spec);
    else if (fs.existsSync(path.join(root, "src", `${alias}.js`)) || fs.existsSync(path.join(root, "src", `${alias}.jsx`))) base = path.join(root, "src", spec);
    else return null;
  }
  for (const c of [base, `${base}.js`, `${base}.jsx`, path.join(base, "index.js"), path.join(base, "index.jsx")]) if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  return undefined;
}

// The file and everything it imports through the app's aliases or relative paths (as collectPage in sliceScan.mjs).
function collectFiles(root, entry, aliases) {
  const seen = new Set(), queue = [entry];
  while (queue.length) {
    const f = queue.pop();
    if (seen.has(f)) continue;
    seen.add(f);
    for (const m of fs.readFileSync(f, "utf8").matchAll(/(?:from\s+|\bimport\(\s*)["']([^"']+)["']/g)) { // import x from "…" and lazy(() => import("…"))
      const r = resolveImport(root, f, m[1], aliases);
      if (r) queue.push(r);
    }
  }
  return [...seen];
}

// Component name of a default import from components/<folder> or proposed/<folder>: the name in the folder's
// `export default function Name` / `export default Name` when index.js says so, else the folder's PascalCase name.
function defaultName(root, spec) {
  const [alias, folder] = spec.split("/");
  try {
    const code = fs.readFileSync(path.join(root, ALIASES[alias], folder, "index.js"), "utf8");
    const hit = code.match(/export default (?:function\s+)?([A-Z]\w*)/);
    if (hit) return hit[1];
  } catch { /* no such folder file */ }
  return folder.split(/[-_]/).map((w) => w[0]?.toUpperCase() + w.slice(1)).join("");
}

// Map local tag name -> component name, one import statement at a time (semicolons optional, lists may span lines).
// Default import: the folder's component name. `{ A as B }`: B is recorded as A. Namespace imports are skipped.
function designImports(code, root) {
  const names = new Map();
  for (const m of code.matchAll(/import\s+((?:[\w$]+\s*,?\s*)?(?:\{[^}]*\}|\*\s*as\s+[\w$]+)?)\s*from\s*["']([^"']+)["']/g)) {
    const spec = m[2];
    if (!/^(components|proposed)\//.test(spec)) continue;
    const clause = m[1], named = clause.match(/\{([^}]*)\}/)?.[1];
    const def = clause.replace(/\{[^}]*\}/, "").replace(/,/g, "").trim();
    if (def && !def.startsWith("*")) names.set(def, defaultName(root, spec));
    for (const part of named?.split(",") ?? []) {
      const [imported, local] = part.trim().split(/\s+as\s+/);
      if (imported) names.set(local ?? imported, imported);
    }
  }
  return names;
}

// Local name -> absolute file for the imports of a routes file: `import X from`, `import { A, B as C } from` and
// `const X = lazy(() => import("…"))` (also React.lazy, and over several lines).
function importMap(code, file, root, aliases) {
  const imports = {};
  for (const m of code.matchAll(/import\s+((?:[\w$]+\s*,?\s*)?(?:\{[^}]*\})?)\s*from\s*["']([^"']+)["']/g)) {
    const r = resolveImport(root, file, m[2], aliases);
    if (!r) continue;
    const def = m[1].replace(/\{[^}]*\}/, "").replace(/,/g, "").trim();
    if (def) imports[def] = r;
    for (const part of m[1].match(/\{([^}]*)\}/)?.[1].split(",") ?? []) {
      const [imported, local] = part.trim().split(/\s+as\s+/);
      if (imported) imports[local ?? imported] = r;
    }
  }
  for (const m of code.matchAll(/(?:const|let|var)\s+([\w$]+)\s*=\s*(?:React\.)?lazy\(\s*\(\s*\)\s*=>\s*import\(\s*["']([^"']+)["']/g)) {
    const r = resolveImport(root, file, m[2], aliases);
    if (r) imports[m[1]] = r;
  }
  return imports;
}

// The files that render an element: every imported component named in `element={<Guard><Page /></Guard>}`.
function elementFiles(attrs, imports) {
  const at = attrs.search(/\belement\s*=\s*\{/);
  if (at < 0) return [];
  const open = attrs.indexOf("{", at);
  const expr = attrs.slice(open, skipBraces(attrs, open));
  return [...new Set(jsxTags(expr).map((t) => imports[t.name]).filter(Boolean))];
}

// Adapter 1, JSX: routes with the files that render them: [{ path, files }]. A pathless <Route element={<Layout />}> adds its own files to each child route.
function jsxRoutes(code, imports) {
  const events = [];
  for (const t of jsxTags(code)) if (t.name === "Route") events.push({ ...t, open: true });
  for (const m of code.matchAll(/<\/Route\s*>/g)) events.push({ index: m.index, open: false });
  events.sort((a, b) => a.index - b.index);
  const out = [], stack = [];
  let seen = 0, read = 0;
  for (const e of events) {
    if (!e.open) { stack.pop(); continue; }
    seen += 1;
    const isIndex = attrValues(e.attrs).index === true;
    const pathAttr = e.attrs.match(/\bpath\s*=\s*["']([^"']*)["']/)?.[1];
    const files = elementFiles(e.attrs, imports);
    const parentPath = [...stack].reverse().find((f) => f.path !== undefined)?.path ?? "";
    const full = isIndex ? parentPath || "/" : pathAttr === undefined ? undefined : pathAttr.startsWith("/") ? pathAttr : `${parentPath.replace(/\/$/, "")}/${pathAttr}`;
    const self = { path: full, files };
    if (files.length) read += 1; // a layout without a path counts as read too
    if (full !== undefined && files.length) {
      out.push({ path: full, files: [...stack.flatMap((f) => (f.path === undefined ? f.files : [])), ...files] });
    }
    if (!/\/\s*$/.test(e.attrs)) stack.push(self);
  }
  return { routes: out, seen, read };
}

// Adapter 2, config arrays: `{ path: "/x", component: Page }` or `{ path: "/x", element: <Page /> }`. The object around each `path:` is read.
function configRoutes(code, imports) {
  const out = [];
  let seen = 0;
  for (const m of code.matchAll(/\bpath\s*:\s*["'`]([^"'`]*)["'`]/g)) {
    let start = m.index, depth = 0;
    for (; start > 0; start -= 1) { // the "{" that opens this object
      if (code[start] === "}") depth += 1;
      else if (code[start] === "{") { if (depth === 0) break; depth -= 1; }
    }
    const body = code.slice(start, skipBraces(code, start));
    const flat = body.replace(/children\s*:\s*\[[\s\S]*\]/, ""); // not followed
    seen += 1;
    const names = [flat.match(/\bcomponent\s*:\s*([A-Z][\w$]*)/)?.[1], ...jsxTags(flat.match(/\belement\s*:\s*(<[\s\S]*?\/>|<[\s\S]*?<\/\w+>)/)?.[1] ?? "").map((t) => t.name)].filter(Boolean);
    const files = [...new Set(names.map((n) => imports[n]).filter(Boolean))];
    if (files.length) out.push({ path: m[1], files });
  }
  return { routes: out, seen };
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== "node_modules" && e.name !== "__tests__") walk(f, out); } else if (/\.(js|jsx)$/.test(e.name)) out.push(f);
  }
  return out;
}

// Files that may declare routes: the ones the project names (`review.usage.routeFiles`), else the app file and everything under
// src/routes, src/router, src/routing, plus src/routes.js.
function routeFileList(root, app, explicit) {
  const abs = (f) => path.join(root, f);
  const files = explicit?.length ? explicit.map(abs) : [abs(app), abs("src/routes.js"), ...["src/routes", "src/router", "src/routing"].flatMap((d) => walk(abs(d)))];
  return [...new Set(files)].filter((f) => fs.existsSync(f) && fs.statSync(f).isFile());
}

// Routes of the whole project and a report of how they were found: { routes, report }. report.blind = nothing was read.
export function routeTable(root, { app = "src/App.js", routeFiles, aliases = ALIASES } = {}) {
  const routes = [], files = [];
  for (const file of routeFileList(root, app, routeFiles)) {
    const code = stripComments(fs.readFileSync(file, "utf8"));
    const imports = importMap(code, file, root, aliases);
    const jsx = jsxRoutes(code, imports), cfg = configRoutes(code, imports);
    routes.push(...jsx.routes, ...cfg.routes);
    if (jsx.seen || cfg.seen || jsx.routes.length || cfg.routes.length) {
      files.push({ file: posix(path.relative(root, file)), jsxTags: jsx.seen, jsxRoutes: jsx.read, pathKeys: cfg.seen, configRoutes: cfg.routes.length });
    }
  }
  return { routes, report: { files, routes: routes.length, blind: routes.length === 0 } };
}

export function scanUsage(root, { app = "src/App.js", routeFiles, aliases = {}, excludeRoutes = ["/review"], routeSamples = {}, howToSee = {} } = {}) {
  const components = {}, warnings = [];
  const al = { ...ALIASES, ...aliases };
  const table = routeTable(root, { app, routeFiles, aliases: al });
  const routes = table.routes.filter((r) => !excludeRoutes.includes(r.path));
  const fileRoutes = new Map(); // absolute file -> [{ path, url }]
  for (const r of routes) {
    const url = r.path.includes(":") || r.path.includes("*") ? routeSamples[r.path] ?? null : r.path;
    const files = new Set();
    for (const entry of r.files) {
      try { collectFiles(root, entry, al).forEach((f) => files.add(f)); } catch (e) { warnings.push(`${entry}: ${e.message}`); }
    }
    for (const f of files) {
      if (!fileRoutes.has(f)) fileRoutes.set(f, []);
      fileRoutes.get(f).push({ path: r.path, url });
    }
  }
  for (const [file, rts] of fileRoutes) {
    if (/^src\/(components|proposed|tokens|foundations|guide)\//.test(posix(path.relative(root, file)))) continue; // design-system files are not usage
    try {
      const code = stripComments(fs.readFileSync(file, "utf8")), names = designImports(code, root);
      for (const t of jsxTags(code)) {
        if (!names.has(t.name)) continue;
        (components[names.get(t.name)] ??= []).push({ file: posix(path.relative(root, file)), line: t.line, attrs: attrValues(t.attrs), routes: rts });
      }
    } catch (e) { warnings.push(`${file}: ${e.message}`); }
  }
  return { generatedAt: new Date().toISOString(), components, warnings, routing: table.report, ...(Object.keys(howToSee).length ? { howToSee } : {}) };
}

/** The probe: what was read, and what to do when it is little or nothing. Text for the developer and for the AI agent that runs it. */
export function probeText(report) {
  const lines = [`routing probe: ${report.routes} route(s) read from ${report.files.length} file(s)`];
  for (const f of report.files) lines.push(`  ${f.file}: ${f.jsxRoutes}/${f.jsxTags} <Route> with a page, ${f.configRoutes}/${f.pathKeys} \`path:\` entries with a component`);
  const partial = report.files.filter((f) => f.jsxRoutes < f.jsxTags || f.configRoutes < f.pathKeys);
  if (report.blind) {
    lines.push("", "BLIND: no route was read, so every \"used in N places\" number would be 0 and wrong. Do not show those numbers.");
  } else if (partial.length) {
    lines.push("", `PARTIAL: ${partial.map((f) => f.file).join(", ")} has routes whose page could not be found (an element that is not an imported component, a render function, a wrapper from another file).`);
  }
  if (report.blind || partial.length) {
    lines.push(
      "",
      "What to do (the scanner is a starting point, not a promise): open the project's router and read how routes are declared:",
      "  - routes in other files than src/App.js or src/routes/*  -> set review.usage.routeFiles in figma-tokens.config.json",
      "  - an import path that is neither relative nor under src/    -> set review.usage.aliases ({ \"@\": \"src\" })",
      "  - createBrowserRouter / nested `children` / file-based routes / a generated table -> add an adapter in usageScan.mjs",
      "    (jsxRoutes and configRoutes are the two examples: each returns [{ path, files }]), with a test in __tests__/usage.test.mjs",
      "Run --probe again until the counts match what the router declares.",
    );
  }
  return lines.join("\n");
}

// Script: node scripts/figma/usageScan.mjs [--probe] -> src/app/review/usage.json (--probe only prints how the routes were read). Never fails the build.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = process.cwd();
  let routeSamples = {}, rawSteps, cfgUsage = {};
  try {
    const review = JSON.parse(fs.readFileSync(path.join(root, "figma-tokens.config.json"), "utf8")).review;
    routeSamples = review?.routeSamples ?? {};
    rawSteps = review?.howToSee;
    cfgUsage = review?.usage ?? {};
  } catch { /* no config or no key */ }
  const { clean: howToSee, dropped } = cleanHowToSee(rawSteps);
  for (const d of dropped) console.warn(`usage: ignored howToSee ${d}`); // a config slip must not block the build or a review
  let usage = { generatedAt: new Date().toISOString(), components: {}, warnings: [] };
  try { usage = scanUsage(root, { routeSamples, howToSee, routeFiles: cfgUsage.routeFiles, aliases: cfgUsage.aliases ?? {}, ...(cfgUsage.app ? { app: cfgUsage.app } : {}) }); } catch (e) { usage.warnings.push(e.message); }
  if (process.argv.includes("--probe")) {
    if (usage.routing) console.log(probeText(usage.routing)); else console.log(`routing probe failed: ${usage.warnings.join("; ")}`);
    console.log(`design-system components found in those pages: ${Object.keys(usage.components).length}`);
  } else {
    for (const w of usage.warnings) console.warn(`usage: skipped ${w}`);
    if (usage.routing?.blind) console.warn("usage: BLIND, no route was read. Run `node scripts/figma/usageScan.mjs --probe`.");
    const out = path.join(root, "src/app/review/usage.json");
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, JSON.stringify(usage, null, 2) + "\n");
    console.log(`usage: ${Object.keys(usage.components).length} components -> ${path.relative(root, out)}`);
  }
}
