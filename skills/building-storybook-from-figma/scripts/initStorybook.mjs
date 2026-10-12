// Detect the project's stack and add Storybook the way that stack needs. Never overwrites a
// file that exists; never runs npm. Run from the project root.
//   node scripts/figma/initStorybook.mjs            report only (what it found, what it would do)
//   node scripts/figma/initStorybook.mjs --write    write the missing files, then print the npm command
// Templates are read from templates/storybook/ next to this skill (or ../templates/storybook).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const write = process.argv.includes("--write");
const here = path.dirname(fileURLToPath(import.meta.url));
const tplDir = ["../templates/storybook", "../../templates/storybook", "./templates/storybook"].map((p) => path.resolve(here, p)).find((p) => fs.existsSync(p));
const exists = (f) => fs.existsSync(f);
const pkg = exists("package.json") ? JSON.parse(fs.readFileSync("package.json", "utf8")) : null;
if (!pkg) { console.error("No package.json here. Start from templates/starter (empty folder) or cd to the project root."); process.exit(1); }
const deps = { ...pkg.dependencies, ...pkg.devDependencies };
const has = (n) => n in deps;
const major = (n) => (deps[n] ? parseInt(String(deps[n]).replace(/[^\d.]/g, ""), 10) : null);

// ---- detect ----
const bundler = has("@rsbuild/core") ? "rsbuild" : has("vite") ? "vite" : has("next") ? "next" : has("react-scripts") || has("webpack") ? "webpack" : null;
const FRAMEWORK = { rsbuild: ["storybook-react-rsbuild", "^3.6"], vite: ["@storybook/react-vite", "^10.6"], webpack: ["@storybook/react-webpack5", "^10.6"] };
const found = {
  bundler,
  react: major("react"),
  tailwind: major("tailwindcss"),
  router: has("react-router-dom"),
  srcDir: exists("src"),
  existingStorybook: exists(".storybook"),
  tokens: exists("src/tokens/tokens.css"),
};
console.log("Found:", JSON.stringify(found));
const stop = (why) => { console.log(`\nSTOP: ${why}`); process.exit(2); };
if (found.existingStorybook) stop(".storybook/ already exists: update tokens or components instead (SKILL.md, case 2).");
if (!bundler) stop("no bundler found in package.json (rsbuild, vite, webpack).");
if (bundler === "next") stop("Next.js needs @storybook/nextjs; not covered by the templates. Ask before choosing.");
if (found.react && found.react < 18) stop(`React ${found.react}: the templates assume 18.`);
const notes = [];
if (found.tailwind == null) notes.push("No Tailwind: tokens.css (plain CSS variables) still works, but buildTokens.mjs emits a Tailwind 3 theme you cannot use.");
if (found.tailwind >= 4) notes.push("Tailwind 4: buildTokens.mjs emits a Tailwind 3 theme; the last step needs a different output (@theme).");
const [fwPkg, fwVer] = FRAMEWORK[bundler];

// ---- what to write ----
const addons = (extra = "") => `    { name: "@storybook/addon-docs", options: { mdxPluginOptions: { mdxCompileOptions: { remarkPlugins: [remarkGfm] } } } },\n    "@storybook/addon-a11y",\n    "@storybook/addon-mcp",${extra}`;
const mainFiles = {
  rsbuild: `import { mergeRsbuildConfig } from "@rsbuild/core";
import remarkGfm from "remark-gfm";

// Rsbuild builder: it loads the project's own rsbuild.config.js (aliases, SWC, PostCSS / Tailwind).
const config = {
  framework: "${fwPkg}",
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx)"],
  addons: [
${addons()}
  ],
  // Machine-readable component docs for the Storybook MCP server (/manifests/components.json).
  // Props need src/ on NODE_PATH: the npm scripts set it through .storybook/run.mjs.
  features: { componentsManifest: true },
  rsbuildFinal: (rsbuildConfig) => mergeRsbuildConfig(rsbuildConfig, { server: { open: false } }),
};

export default config;
`,
  other: `import remarkGfm from "remark-gfm";

// ${fwPkg} loads the project's own bundler config.
const config = {
  framework: "${fwPkg}",
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx)"],
  addons: [
${addons()}
  ],
  // Props need src/ on NODE_PATH: the npm scripts set it through .storybook/run.mjs.
  features: { componentsManifest: true },
};

export default config;
`,
};
let preview = fs.readFileSync(path.join(tplDir, "preview.js"), "utf8");
if (!found.router) {
  preview = preview.replace(/import \{ MemoryRouter \} from "react-router-dom";\n/, "").replace(/\s*<MemoryRouter>\s*<Story \/>\s*<\/MemoryRouter>/, "\n      <Story />").replace("// Components use <Link> and useNavigate, so every story runs inside a router.\n", "");
}
const scripts = {
  storybook: "node .storybook/run.mjs dev -p 6006 --no-open",
  "build-storybook": "node .storybook/run.mjs build -o storybook-static",
  "tokens:build": "node scripts/figma/toBruecke.mjs .figma-dump src/tokens/design_token.json && node scripts/figma/buildTokens.mjs && node scripts/figma/buildTokenDocs.mjs",
};
const files = [
  [".storybook/main.mjs", bundler === "rsbuild" ? mainFiles.rsbuild : mainFiles.other],
  [".storybook/run.mjs", fs.readFileSync(path.join(tplDir, "run.mjs"), "utf8")],
  [".storybook/preview.js", preview],
  [".mcp.json", JSON.stringify({ mcpServers: { storybook: { type: "http", url: "http://localhost:6006/mcp" } } }, null, 2) + "\n"],
  ["src/foundations/TokenBlocks.js", fs.readFileSync(path.join(tplDir, "../TokenBlocks.js"), "utf8")],
];
const missingScripts = Object.keys(scripts).filter((k) => !pkg.scripts?.[k]);
const ignore = ["storybook-static/", ".figma-dump/"].filter((l) => !(exists(".gitignore") && fs.readFileSync(".gitignore", "utf8").split("\n").includes(l)));
const devDeps = [`storybook@^10.6`, `${fwPkg}@${fwVer}`, "@storybook/addon-docs", "@storybook/addon-a11y", "@storybook/addon-mcp", "remark-gfm"].filter((d) => !has(d.replace(/@[\^~]?[\d.]+$/, "")));
const runtime = ["prop-types", "clsx", "tailwind-merge@^2"].filter((d) => !has(d.replace(/@.*$/, "")));

console.log(`\nStorybook framework: ${fwPkg}${found.router ? "" : " (no react-router-dom: no router decorator)"}`);
for (const n of notes) console.log(`NOTE: ${n}`);
console.log("\nFiles:");
for (const [f] of files) console.log(`  ${exists(f) ? "keep (exists)" : write ? "write        " : "would write  "} ${f}`);
console.log(`package.json scripts to add: ${missingScripts.join(", ") || "none"}`);
console.log(`.gitignore lines to add: ${ignore.join(", ") || "none"}`);

if (write) {
  for (const [f, text] of files) {
    if (exists(f)) continue;
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, text);
  }
  if (missingScripts.length) {
    pkg.scripts = { ...pkg.scripts, ...Object.fromEntries(missingScripts.map((k) => [k, scripts[k]])) };
    fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
  }
  if (ignore.length) fs.appendFileSync(".gitignore", (exists(".gitignore") && !fs.readFileSync(".gitignore", "utf8").endsWith("\n") ? "\n" : "") + ignore.join("\n") + "\n");
}
console.log(`\nThen run:${devDeps.length ? `\n  npm i -D ${devDeps.join(" ")}` : ""}${runtime.length ? `\n  npm i ${runtime.join(" ")}` : ""}`);
if (!write) console.log("\n(report only: add --write to create the files)");
