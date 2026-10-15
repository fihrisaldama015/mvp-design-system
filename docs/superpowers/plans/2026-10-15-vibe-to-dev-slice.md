# Vibe to dev slice: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A PM builds a page in the vibe repo with the design system's components; a developer runs `/slice-vibe <page>` in a new dev repo and gets the page, a scan of what needs attention, and a report with numbers.

**Architecture:** The dev repo (`../mvp-dev`) owns the components and the Storybook. The vibe repo (this one) holds a generated copy, made by `npm run pull-ui` and guarded by `ui-lock.json`. `/slice-vibe` is a Claude Code command in the dev repo that runs one script (copy the page, scan it against the dev components, add the route, verify, write a report).

**Tech Stack:** Node 22 (`node:test`), React 18, rsbuild, Tailwind 3, Storybook, Claude Code commands.

**Spec:** `docs/superpowers/specs/2026-10-15-vibe-to-dev-slice-design.md` (phase 4, moving the review service, and the real `swt-fe` are separate plans).

## Global Constraints

- Commits: no `Co-Authored-By` line and not the word "PM" in a message. Do not push, and do not create a remote repository, without asking.
- Generated files are never hand-edited: `src/tokens/*`, `src/foundations/*.mdx`, and (after Task 2) everything `pull-ui` copies.
- The handoff scripts (`pull-ui`, the slice scanner, `check`) are a **second skill**, `.claude/skills/design-system-handoff`, separate from `building-storybook-from-figma`. It is edited in this (vibe) repo and copied to `mvp-dev` at the end of Task 3; it runs in place (no `scripts/` copy, no `sync-skill`). The Figma skill is not touched.
- Semantic Tailwind classes only (no hex, no arbitrary values); icons `lucide-react` only; text in plain English.
- Build pages from Storybook components; never hand-write a button, input, badge, table, modal, drawer, toast, tabs or tooltip.

## Review Focus

- Pulling from a source that is not a git repo (no commit to record): must not crash; the lock says `commit: null`. Tested in Task 2.
- A component folder deleted in the dev repo must disappear from the vibe copy on the next pull. Tested in Task 2.
- A page that imports a file that does not exist: reported as `broken`, no crash. Tested in Task 3.
- A file the page needs already exists in the dev repo with different content: not overwritten, reported as a conflict. Tested in Task 3.
- JSX like `<Button onClick={() => a > b} kind="outlined">`: the `>` inside braces must not end the tag early. Tested in Task 3.

---

### Task 1: Create `mvp-dev` (the dev codebase)

**Files:**
- Create: `../mvp-dev/` (new local git repo, no remote)
- Modify (in the new repo): `package.json` (name), `src/App.js`, `CLAUDE.md`

**Interfaces:**
- Produces: `../mvp-dev` with `src/components`, `src/tokens`, `src/foundations`, `.storybook`, the skill, and the sample pages Dashboard and EquipmentList; Storybook builds with 0 errors. Task 2 and 3 use it as `UI_SOURCE` and as the slice target.

- [ ] **Step 1: Copy the repo without the video, builds, and the vibe-only docs**

```bash
cd /home/aldam/WORK/BLUE_SILO/TRMS/Repo
mkdir mvp-dev
rsync -a --exclude node_modules --exclude .git --exclude build --exclude storybook-static \
  --exclude .figma-dump --exclude video --exclude docs/superpowers --exclude docs/shield/video-assets \
  --exclude .vercel --exclude '.env*' mvp-design-system/ mvp-dev/
```

- [ ] **Step 2: Keep only the sample pages (so the slice target does not already hold the demo page)**

```bash
cd mvp-dev/src/pages
ls | grep -vE '^(Dashboard|EquipmentList|NotFound|Review)\.js$|^review$' | xargs rm -rf
```

Replace `src/App.js` with:

```js
import { Route, Routes } from "react-router-dom";
import Layout from "components/Layout";
import Dashboard from "pages/Dashboard";
import EquipmentList from "pages/EquipmentList";
import NotFound from "pages/NotFound";
import Review from "pages/Review";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/equipment" element={<EquipmentList />} />
        <Route path="/review" element={<Review />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
```

(`Layout` stays at `components/Layout` here; in the vibe repo it moves to `app/` in Task 2. The dev repo keeps its own app shell.)

- [ ] **Step 3: Rename, init git, install**

```bash
cd ../.. && sed -i 's/"name": "mvp-design-system"/"name": "mvp-dev"/' package.json
git init -q -b main && npm install
```

- [ ] **Step 4: Write the dev `CLAUDE.md` header**

Replace the first paragraph of `CLAUDE.md` with:

```markdown
# mvp-dev rules

The dev codebase. It owns the design system (`src/components`, `src/tokens`, `src/foundations`, the Storybook) and receives pages from the vibe repo
with `/slice-vibe <page>`. The vibe repo keeps a generated copy of the design system (`npm run pull-ui` there); a change to a component is made here, never there.
```

- [ ] **Step 5: Verify, then commit**

Run: `npm run build && npm run build-storybook && bash scripts/figma/renderCheck.sh && node scripts/figma/doctor.mjs`
Expected: build OK; `checked N stories and docs pages, errors: 0`; `0 to fix`.

```bash
git add -A && git commit -q -m "chore: dev codebase for the vibe-to-dev demo, split from mvp-design-system"
```

---

### Task 2: `pull-ui`, the lock, and the vibe repo's side

**Files (in `mvp-design-system`):**
- Create: `.claude/skills/design-system-handoff/SKILL.md`, `scripts/pullUi.mjs`, `scripts/check.mjs`, `scripts/__tests__/pullUi.test.mjs` (all under the skill folder)
- Modify: `.claude/settings.json` (session hook), `package.json`, `rsbuild.config.js`, `src/App.js`, `CLAUDE.md`
- Move: `src/components/{Layout,Notifications,CommandPalette}.js` to `src/app/`
- Create: `src/proposed/.gitkeep`

**Interfaces:**
- Produces: `designSystemFiles(root): string[]` (repo-relative paths), `pullUi({ source, target }): lock`, `checkLock(target): null | { lock, edited, added, behind }`; `check.mjs [--quiet]` is the CLI over `checkLock` where `behind` is `null | { commits: number, changed: string[] }`. Task 3 does not use them; `check.mjs` and the session hook do.
- The lock file `ui-lock.json`: `{ source: { path, commit, dirty }, pulledAt, files: { [relPath]: sha1 } }`.

- [ ] **Step 1: Write the failing tests** (`__tests__/pullUi.test.mjs`)

```js
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { checkLock, designSystemFiles, pullUi } from "../pullUi.mjs";

const CHECK = fileURLToPath(new URL("../check.mjs", import.meta.url));

const mk = (files) => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "ui-"));
  for (const [f, c] of Object.entries(files)) { fs.mkdirSync(path.dirname(path.join(d, f)), { recursive: true }); fs.writeFileSync(path.join(d, f), c); }
  return d;
};
const SRC = {
  "src/components/button/index.js": "button v1",
  "src/components/button/Button.stories.js": "story",
  "src/components/helper/index.js": "no story, so not design system",
  "src/tokens/tokens.css": "tokens",
  ".storybook/main.mjs": "main",
};
const git = (d, ...a) => execFileSync("git", ["-C", d, "-c", "user.email=t@t", "-c", "user.name=t", ...a], { encoding: "utf8" });

test("only component folders with a story are design system", () => {
  const files = designSystemFiles(mk(SRC));
  assert.ok(files.includes("src/components/button/index.js"));
  assert.ok(!files.some((f) => f.includes("helper")));
});

test("pull copies, records hashes and leaves app-level files alone", () => {
  const source = mk(SRC), target = mk({ "src/app/Layout.js": "mine", "src/pages/Home.js": "page" });
  const lock = pullUi({ source, target });
  assert.equal(fs.readFileSync(path.join(target, "src/components/button/index.js"), "utf8"), "button v1");
  assert.equal(fs.readFileSync(path.join(target, "src/app/Layout.js"), "utf8"), "mine");
  assert.ok(lock.files["src/tokens/tokens.css"]);
  assert.ok(fs.readFileSync(path.join(target, "src/components/GENERATED.md"), "utf8").includes("Do not edit"));
  assert.equal(lock.source.commit, null); // not a git repo: no crash
  assert.equal(checkLock(target).behind, null);
});

test("a folder removed in the source is removed in the copy", () => {
  const source = mk(SRC), target = mk({});
  pullUi({ source, target });
  fs.rmSync(path.join(source, "src/components/button"), { recursive: true });
  pullUi({ source, target });
  assert.ok(!fs.existsSync(path.join(target, "src/components/button/index.js")));
});

test("checkLock names edited and added files", () => {
  const source = mk(SRC), target = mk({});
  pullUi({ source, target });
  fs.writeFileSync(path.join(target, "src/components/button/index.js"), "edited by hand");
  fs.writeFileSync(path.join(target, "src/tokens/extra.css"), "new");
  const r = checkLock(target);
  assert.deepEqual(r.edited, ["src/components/button/index.js"]);
  assert.deepEqual(r.added, ["src/tokens/extra.css"]);
});

test("checkLock says how far behind a git source is and what changed", () => {
  const source = mk(SRC), target = mk({});
  git(source, "init", "-q"); git(source, "add", "-A"); git(source, "commit", "-q", "-m", "one");
  pullUi({ source, target });
  fs.writeFileSync(path.join(source, "src/components/button/index.js"), "button v2");
  git(source, "commit", "-qam", "two");
  const { behind } = checkLock(target);
  assert.equal(behind.commits, 1);
  assert.deepEqual(behind.changed, ["src/components/button/index.js"]);
});

test("check.mjs is silent when the copy is fresh and speaks when a file was edited", () => {
  const source = mk(SRC), target = mk({});
  pullUi({ source, target });
  const run = () => execFileSync("node", [CHECK, "--quiet"], { cwd: target, encoding: "utf8" });
  assert.equal(run(), "");
  fs.writeFileSync(path.join(target, "src/components/button/index.js"), "edited by hand");
  assert.match(run(), /changed by hand/);
});
```

- [ ] **Step 2: Run, expect FAIL**

Run: `node --test '.claude/skills/design-system-handoff/scripts/__tests__/*.test.mjs'`
Expected: FAIL (`Cannot find module '../pullUi.mjs'`).

- [ ] **Step 3: Write `pullUi.mjs`**

```js
// Copies the design system from the dev repo into this (vibe) repo and records ui-lock.json.
// Usage: node .claude/skills/design-system-handoff/scripts/pullUi.mjs [--source ../mvp-dev]      (env UI_SOURCE also works)
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const ROOTS = ["src/tokens", "src/foundations", "src/guide", "src/utils", ".storybook"];
const sha = (f) => crypto.createHash("sha1").update(fs.readFileSync(f)).digest("hex");
const walk = (dir, base = dir) =>
  fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name), base) : [path.relative(base, path.join(dir, e.name))])) : [];

// Files that belong to the design system, relative to the repo root: component folders that have a *.stories.js, and the fixed roots.
export function designSystemFiles(root) {
  const out = [];
  const comps = path.join(root, "src/components");
  if (fs.existsSync(comps)) {
    for (const e of fs.readdirSync(comps, { withFileTypes: true })) {
      if (!e.isDirectory()) continue; // loose files (Layout.js ...) are app level
      const files = walk(path.join(comps, e.name));
      if (files.some((f) => f.endsWith(".stories.js"))) out.push(...files.map((f) => path.join("src/components", e.name, f)));
    }
  }
  for (const r of ROOTS) out.push(...walk(path.join(root, r)).map((f) => path.join(r, f)));
  return out.sort();
}

const gitOut = (dir, ...a) => execFileSync("git", ["-C", dir, ...a], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();

export function pullUi({ source, target }) {
  const src = designSystemFiles(source);
  for (const f of designSystemFiles(target)) if (!src.includes(f)) fs.rmSync(path.join(target, f)); // gone in the source = gone here
  const files = {};
  for (const f of src) {
    fs.mkdirSync(path.dirname(path.join(target, f)), { recursive: true });
    fs.copyFileSync(path.join(source, f), path.join(target, f));
    files[f] = sha(path.join(target, f));
  }
  let commit = null, dirty = false;
  try { commit = gitOut(source, "rev-parse", "HEAD"); dirty = gitOut(source, "status", "--porcelain") !== ""; } catch { /* not a git repo */ }
  fs.writeFileSync(path.join(target, "src/components/GENERATED.md"), `Generated by \`npm run pull-ui\` from ${path.resolve(source)}. Do not edit: a change to a component is made in the dev repo.\n`);
  const lock = { source: { path: path.resolve(source), commit, dirty }, pulledAt: new Date().toISOString(), files };
  fs.writeFileSync(path.join(target, "ui-lock.json"), JSON.stringify(lock, null, 2) + "\n");
  return lock;
}

export function checkLock(target) {
  const f = path.join(target, "ui-lock.json");
  if (!fs.existsSync(f)) return null;
  const lock = JSON.parse(fs.readFileSync(f, "utf8"));
  const edited = Object.entries(lock.files).filter(([rel, h]) => !fs.existsSync(path.join(target, rel)) || sha(path.join(target, rel)) !== h).map(([rel]) => rel);
  const added = designSystemFiles(target).filter((rel) => !(rel in lock.files));
  let behind = null;
  if (lock.source.commit && fs.existsSync(lock.source.path)) {
    try {
      const n = Number(gitOut(lock.source.path, "rev-list", "--count", `${lock.source.commit}..HEAD`));
      const changed = n ? gitOut(lock.source.path, "diff", "--name-only", `${lock.source.commit}..HEAD`, "--", "src/components").split("\n").filter(Boolean) : [];
      behind = { commits: n, changed };
    } catch { behind = null; }
  }
  return { lock, edited, added, behind };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf("--source");
  const source = i > 0 ? process.argv[i + 1] : process.env.UI_SOURCE ?? "../mvp-dev";
  if (!fs.existsSync(path.join(source, "src/components"))) { console.error(`pull-ui: ${source} has no src/components. Pass --source <dev repo>.`); process.exit(1); }
  const lock = pullUi({ source, target: process.cwd() });
  console.log(`Pulled ${Object.keys(lock.files).length} files from ${lock.source.path} (${lock.source.commit?.slice(0, 7) ?? "no git"}${lock.source.dirty ? ", uncommitted changes in the source" : ""}). ui-lock.json written.`);
}
```

- [ ] **Step 4: Run, expect PASS**

Run: `node --test '.claude/skills/design-system-handoff/scripts/__tests__/*.test.mjs'`
Expected: 6 tests pass.

- [ ] **Step 5: The check, the skill file, the hook, scripts, and the app-level move**

Create `.claude/skills/design-system-handoff/scripts/check.mjs`:

```js
// Is the copy of the design system in this repo still the dev repo's? Used by the SessionStart hook (--quiet) and `npm run ui-check`.
import { checkLock } from "./pullUi.mjs";

const quiet = process.argv.includes("--quiet");
const r = checkLock(process.cwd());
if (!r) { if (!quiet) console.log("No ui-lock.json: this repo does not copy the design system from a dev repo."); process.exit(0); }
const lines = [];
if (r.edited.length || r.added.length) lines.push(`Design system files were changed by hand (${[...r.edited, ...r.added].slice(0, 4).join(", ")}). A change to a component belongs in the dev repo; \`npm run pull-ui\` restores the copy.`);
if (r.behind?.commits) lines.push(`The dev repo is ${r.behind.commits} commit(s) ahead${r.behind.changed.length ? `; components changed: ${r.behind.changed.slice(0, 4).join(", ")}` : ""}. Run \`npm run pull-ui\`.`);
if (lines.length) { console.log(lines.join("\n")); process.exit(quiet ? 0 : 1); }
if (!quiet) console.log(`Design system copy matches ${r.lock.source.commit?.slice(0, 7) ?? "the source"}.`);
```

Create `.claude/skills/design-system-handoff/SKILL.md`:

```markdown
---
name: design-system-handoff
description: Use when a prototype repo (vibe coding) and a dev codebase must share one design system, to copy the dev repo's components into the prototype (pull-ui, ui-lock.json), check the copy, or slice a finished prototype page into the dev repo (/slice-vibe).
---

# Design system handoff (vibe repo and dev repo)

The dev repo owns the components, tokens and Storybook. The vibe repo holds a generated copy.

- In the vibe repo: `npm run pull-ui` copies the design system and writes `ui-lock.json`; `npm run ui-check` and the session hook warn when the copy was
  edited by hand or the dev repo moved on. New components go in `src/proposed/`.
- In the dev repo: `/slice-vibe <PageName>` runs `scripts/sliceVibe.mjs` (copy the page, scan it against the dev components, add the route, build, write
  `docs/slices/<PageName>.md`).
- Spec: `docs/superpowers/specs/2026-10-15-vibe-to-dev-slice-design.md`.
```

Add to `.claude/settings.json`, in the `SessionStart` hooks list, `{ "type": "command", "command": "node .claude/skills/design-system-handoff/scripts/check.mjs --quiet" }`.

Edit `package.json` scripts: add `"pull-ui": "node .claude/skills/design-system-handoff/scripts/pullUi.mjs"`, `"ui-check": "node .claude/skills/design-system-handoff/scripts/check.mjs"` and `"test": "node --test '.claude/skills/design-system-handoff/scripts/__tests__/*.test.mjs'"`. Then:

```bash
mkdir -p src/app src/proposed && touch src/proposed/.gitkeep
git mv src/components/Layout.js src/components/Notifications.js src/components/CommandPalette.js src/app/
grep -rln 'components/\(Layout\|Notifications\|CommandPalette\)' src | xargs sed -i 's#components/\(Layout\|Notifications\|CommandPalette\)#app/\1#g'
```

In `rsbuild.config.js` add to `resolve.alias`: `app: "./src/app", proposed: "./src/proposed",`.

- [ ] **Step 6: Update the vibe `CLAUDE.md`, pull once, verify, commit**

Add under "Build pages from Storybook":

```markdown
- `src/components`, `src/tokens`, `src/foundations`, `src/guide`, `src/utils` and `.storybook` are a **generated copy** of the dev repo's design system
  (`npm run pull-ui`). Never edit them; `npm run ui-check` (and the session hook) warn when they differ from `ui-lock.json`. A change to a component is made in the dev repo.
- A component that does not exist yet: build it in `src/proposed/<kebab-name>/` (with a story) and use it freely in the prototype. The developer decides at
  slice time whether it is promoted to the dev repo. Properties marked `@deprecated` in the manifest are not used in new pages.
```

Run: `npm run pull-ui -- --source ../mvp-dev && npm test && npm run build && npm run build-storybook && bash scripts/figma/renderCheck.sh && npm run ui-check`
Expected: pull reports the file count; 6 tests pass; builds OK; `errors: 0`; `Design system copy matches ...`.

```bash
git add -A && git commit -q -m "feat: design-system-handoff skill with pull-ui, ui-lock and its check; app-level files move to src/app"
```

---

### Task 3: `/slice-vibe` (scanner, script, command): written in the skill, copied to `mvp-dev`

**Files:**
- Create (in this repo, in the skill): `.claude/skills/design-system-handoff/scripts/sliceScan.mjs`, `sliceVibe.mjs`, `__tests__/sliceScan.test.mjs`
- Create (in `mvp-dev`): a copy of the skill folder, `.claude/commands/slice-vibe.md`
- Modify (in `mvp-dev`): `package.json` (script `test`, same glob as here)

**Interfaces:**
- Produces from `sliceScan.mjs`: `loadComponents(devRoot): { [Name]: { props: Set, deprecated: Set } }`; `jsxTags(code): { name, attrs, line }[]`; `attrNames(attrs): string[]`; `scanPage(code, file, components): { kind, file, line, detail }[]` (kinds: `unknown-prop`, `deprecated-prop`, `proposed-import`, `hand-written`, `hex-colour`, `arbitrary-value`); `collectPage(vibeRoot, entryAbs): { files: string[], broken: { file, spec }[] }`; `copyPageFiles(vibeRoot, devRoot, files): { copied: string[], conflicts: string[] }`.
- `sliceVibe.mjs <vibeRepo> <PageName>` writes `docs/slices/<PageName>.md` and exits 0 when nothing blocks.

- [ ] **Step 1: Write the failing tests** (`.claude/skills/design-system-handoff/scripts/__tests__/sliceScan.test.mjs`)

```js
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { attrNames, collectPage, copyPageFiles, jsxTags, loadComponents, scanPage } from "../sliceScan.mjs";

const mk = (files) => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "slice-"));
  for (const [f, c] of Object.entries(files)) { fs.mkdirSync(path.dirname(path.join(d, f)), { recursive: true }); fs.writeFileSync(path.join(d, f), c); }
  return d;
};
const DEV = mk({
  "src/components/button/index.js": `export function Button() {}
Button.propTypes = {
  /** How it looks. */
  kind: PropTypes.string,
  /**
   * @deprecated Use kind.
   */
  variant: PropTypes.string,
};`,
});
const components = loadComponents(DEV);

test("loadComponents reads props and @deprecated, also across lines", () => {
  assert.ok(components.Button.props.has("kind"));
  assert.ok(components.Button.deprecated.has("variant"));
});

test("an arrow function with > inside an attribute does not end the tag early", () => {
  const code = `<Button onClick={() => a > b} kind="outlined" disabled>Go</Button>`;
  const [t] = jsxTags(code);
  assert.deepEqual(attrNames(t.attrs).sort(), ["disabled", "kind", "onClick"]);
});

test("scanPage flags unknown and deprecated properties, hand-written elements, hex and arbitrary values", () => {
  const code = `<Button leftIcon={x} variant="primary" kind="filled">a</Button>
<button className="p-[13px] text-[#8b0836]">b</button>`;
  const kinds = scanPage(code, "P.js", { ...components, Button: components.Button }).map((f) => f.kind);
  assert.ok(kinds.includes("unknown-prop"));
  assert.ok(kinds.includes("deprecated-prop"));
  assert.ok(kinds.includes("hand-written"));
  assert.ok(kinds.includes("arbitrary-value"));
  assert.ok(kinds.includes("hex-colour"));
});

test("scanPage flags a proposed component", () => {
  assert.equal(scanPage(`import X from "proposed/x";`, "P.js", components)[0].kind, "proposed-import");
});

test("collectPage follows aliases and reports a broken import without crashing", () => {
  const vibe = mk({ "src/pages/P.js": `import D from "data/d";\nimport Gone from "pages/Gone";`, "src/data/d.js": "export default 1;" });
  const { files, broken } = collectPage(vibe, path.join(vibe, "src/pages/P.js"));
  assert.equal(files.length, 2);
  assert.deepEqual(broken.map((b) => b.spec), ["pages/Gone"]);
});

test("copyPageFiles copies new files and refuses to overwrite a different one", () => {
  const vibe = mk({ "src/pages/P.js": "page", "src/data/d.js": "data" });
  const dev = mk({ "src/data/d.js": "DIFFERENT" });
  const r = copyPageFiles(vibe, dev, [path.join(vibe, "src/pages/P.js"), path.join(vibe, "src/data/d.js")]);
  assert.deepEqual(r.copied, ["src/pages/P.js"]);
  assert.deepEqual(r.conflicts, ["src/data/d.js"]);
  assert.equal(fs.readFileSync(path.join(dev, "src/data/d.js"), "utf8"), "DIFFERENT");
});
```

- [ ] **Step 2: Run, expect FAIL**

Run: `npm test`
Expected: FAIL (`Cannot find module '../sliceScan.mjs'`).

- [ ] **Step 3: Write `sliceScan.mjs`**

```js
import fs from "node:fs";
import path from "node:path";

const ALIASES = { pages: "src/pages", data: "src/data", utils: "src/utils", components: "src/components", app: "src/app", proposed: "src/proposed" };
const SKIP = /^(key|ref|className|children|style|id|on[A-Z]\w*|aria-[\w-]+|data-[\w-]+)$/;
const HAND = { button: "Button", input: "Input", select: "Select", textarea: "Textarea", table: "DataTable" };

// What the dev repo's components accept: { Button: { props, deprecated } }, from each Component.propTypes block.
export function loadComponents(root) {
  const out = {}, base = path.join(root, "src/components");
  for (const d of fs.readdirSync(base, { withFileTypes: true })) {
    const file = path.join(base, d.name, "index.js");
    if (!d.isDirectory() || !fs.existsSync(file)) continue;
    const code = fs.readFileSync(file, "utf8");
    for (const [, name] of code.matchAll(/export (?:const|function) ([A-Z]\w*)/g)) {
      const block = code.match(new RegExp(`${name}\\.propTypes\\s*=\\s*\\{([\\s\\S]*?)\\n\\};`))?.[1];
      if (block === undefined) continue;
      const props = new Set(), deprecated = new Set();
      let comment = "";
      for (const line of block.split("\n")) {
        const key = line.match(/^\s{2}(\w+):/);
        if (key) { props.add(key[1]); if (/@deprecated/.test(comment)) deprecated.add(key[1]); comment = ""; } else comment += ` ${line}`;
      }
      out[name] = { props, deprecated };
    }
  }
  return out;
}

// The attribute text of every <Component ...> tag. Braces and quotes are skipped so `onClick={() => a > b}` does not end the tag.
export function jsxTags(code) {
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
    tags.push({ name: m[1], attrs, line: code.slice(0, m.index).split("\n").length });
  }
  return tags;
}

export function attrNames(attrs) {
  let flat = "", depth = 0, quote = null;
  for (const ch of attrs) {
    if (quote) { if (ch === quote) quote = null; continue; }
    if (ch === '"' || ch === "'" || ch === "`") { quote = ch; continue; }
    if (ch === "{") { depth++; continue; }
    if (ch === "}") { depth--; continue; }
    if (depth === 0) flat += ch;
  }
  return [...flat.matchAll(/(?:^|\s)([A-Za-z_][\w-]*)(?=\s|=|\/|$)/g)].map((m) => m[1]);
}

export function scanPage(code, file, components) {
  const findings = [], add = (kind, line, detail) => findings.push({ kind, file, line, detail });
  for (const t of jsxTags(code)) {
    const c = components[t.name];
    if (!c) continue;
    for (const a of attrNames(t.attrs)) {
      if (SKIP.test(a)) continue;
      if (!c.props.has(a)) add("unknown-prop", t.line, `${t.name} has no property "${a}"`);
      else if (c.deprecated.has(a)) add("deprecated-prop", t.line, `${t.name} property "${a}" is deprecated`);
    }
  }
  code.split("\n").forEach((l, i) => {
    if (/from ["'](?:components\/)?proposed\//.test(l)) add("proposed-import", i + 1, l.trim());
    for (const [el, name] of Object.entries(HAND)) if (components[name] && new RegExp(`<${el}[\\s>]`).test(l)) add("hand-written", i + 1, `<${el}> is written by hand; use ${name}`);
    if (/#[0-9a-fA-F]{6}\b/.test(l)) add("hex-colour", i + 1, l.trim().slice(0, 80));
    if (/\b[a-z-]+-\[[^\]]+\]/.test(l)) add("arbitrary-value", i + 1, l.trim().slice(0, 80));
  });
  return findings;
}

function resolveImport(root, from, spec) {
  let base;
  if (spec.startsWith(".")) base = path.resolve(path.dirname(from), spec);
  else { const [alias, ...rest] = spec.split("/"); if (!ALIASES[alias]) return null; base = path.join(root, ALIASES[alias], ...rest); }
  for (const c of [base, `${base}.js`, `${base}.jsx`, path.join(base, "index.js")]) if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  return undefined; // an alias or relative import that does not resolve is broken
}

// The page and everything it imports through the app's own aliases. A package import (react...) is ignored.
export function collectPage(root, entry) {
  const seen = new Set(), broken = [], queue = [entry];
  while (queue.length) {
    const f = queue.pop();
    if (seen.has(f)) continue;
    seen.add(f);
    for (const m of fs.readFileSync(f, "utf8").matchAll(/from\s+["']([^"']+)["']/g)) {
      const r = resolveImport(root, f, m[1]);
      if (r === undefined) broken.push({ file: f, spec: m[1] }); else if (r) queue.push(r);
    }
  }
  return { files: [...seen], broken };
}

// Only the page's own files (src/pages, src/data) travel; the design system already exists in the dev repo.
export function copyPageFiles(vibeRoot, devRoot, files) {
  const copied = [], conflicts = [];
  for (const abs of files) {
    const rel = path.relative(vibeRoot, abs);
    if (!/^src\/(pages|data)\//.test(rel)) continue;
    const dest = path.join(devRoot, rel);
    if (fs.existsSync(dest)) { if (!fs.readFileSync(dest).equals(fs.readFileSync(abs))) conflicts.push(rel); continue; }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(abs, dest);
    copied.push(rel);
  }
  return { copied, conflicts };
}
```

- [ ] **Step 4: Run, expect PASS**

Run: `npm test`
Expected: 12 tests pass (6 from Task 2, 6 new).

- [ ] **Step 5: Write `sliceVibe.mjs` and the command**

`.claude/skills/design-system-handoff/scripts/sliceVibe.mjs`:

```js
// node .claude/skills/design-system-handoff/scripts/sliceVibe.mjs <vibeRepo> <PageName>   (page = <vibeRepo>/src/pages/<PageName>.js)
import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { collectPage, copyPageFiles, loadComponents, scanPage } from "./sliceScan.mjs";

const [, , vibeArg, page] = process.argv;
if (!vibeArg || !page) { console.error("Usage: node .claude/skills/design-system-handoff/scripts/sliceVibe.mjs <vibeRepo> <PageName>"); process.exit(1); }
const vibe = path.resolve(vibeArg), dev = process.cwd(), t0 = Date.now(), started = new Date().toISOString();
const entry = path.join(vibe, "src/pages", `${page}.js`);
if (!fs.existsSync(entry)) { console.error(`No page ${entry}`); process.exit(1); }
const g = (...a) => execFileSync("git", ["-C", dev, ...a], { encoding: "utf8" }).trim();

// 1. version check: is the vibe copy of the design system the dev repo's current one?
let version = "no ui-lock.json in the vibe repo (run pull-ui there)";
try {
  const lock = JSON.parse(fs.readFileSync(path.join(vibe, "ui-lock.json"), "utf8"));
  const head = g("rev-parse", "HEAD");
  version = lock.source.commit === head ? `up to date (${head.slice(0, 7)})` : `pulled at ${lock.source.commit?.slice(0, 7)}, dev is at ${head.slice(0, 7)} (${g("rev-list", "--count", `${lock.source.commit}..HEAD`)} commits ahead)`;
} catch { /* keep the default text */ }

// 2. copy, 3. scan
const { files, broken } = collectPage(vibe, entry);
const { copied, conflicts } = copyPageFiles(vibe, dev, files);
const components = loadComponents(dev);
// The scan covers the page's own files only; the design system's internals are the dev repo's business.
const own = files.filter((f) => /^src\/(pages|data)\//.test(path.relative(vibe, f)));
const findings = own.flatMap((f) => scanPage(fs.readFileSync(f, "utf8"), path.relative(vibe, f), components));
const used = [...new Set(own.flatMap((f) => [...fs.readFileSync(f, "utf8").matchAll(/<([A-Z]\w*)[\s/>]/g)].map((m) => m[1])))].filter((n) => components[n]);

// 4. route, before the catch-all
const slug = page.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
const appFile = path.join(dev, "src/App.js");
let app = fs.readFileSync(appFile, "utf8"), route = "added";
if (app.includes(`pages/${page}"`)) route = "already there";
else if (!app.includes('path="*"')) route = "NOT added (no catch-all route found in src/App.js)";
else {
  app = app.replace(/(import [^\n]+ from "pages\/[^"]+";\n)(?![\s\S]*import [^\n]+ from "pages\/)/, `$1import ${page} from "pages/${page}";\n`);
  app = app.replace(/(\s*)<Route path="\*"/, `$1<Route path="/${slug}" element={<${page} />} />$1<Route path="*"`);
  fs.writeFileSync(appFile, app);
}

// 5. verify: build, and every Tailwind class in the copied page resolves
const build = spawnSync("npm", ["run", "build"], { cwd: dev, encoding: "utf8" });
const classes = [...new Set(copied.flatMap((f) => [...fs.readFileSync(path.join(dev, f), "utf8").matchAll(/className="([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/))))].filter(Boolean);
const chk = classes.length ? spawnSync("node", ["scripts/figma/checkUtilities.mjs", classes.join(" ")], { cwd: dev, encoding: "utf8" }) : { stdout: "" };
const missing = chk.stdout.split("\n").filter((l) => l.startsWith("MISS")).map((l) => l.split(/\s+/)[1]);

// 6. report
const count = (k) => findings.filter((f) => f.kind === k).length;
const secs = ((Date.now() - t0) / 1000).toFixed(1);
const report = `# Slice report: ${page}

Started ${started}; the script took ${secs} s (the agent's own time is not included).

| | |
|---|---|
| Design system copy | ${version} |
| Files copied | ${copied.length} (${copied.join(", ") || "none"}) |
| Conflicts (not overwritten) | ${conflicts.join(", ") || "none"} |
| Broken imports | ${broken.map((b) => `${path.relative(vibe, b.file)} -> ${b.spec}`).join("; ") || "none"} |
| Components used | ${used.join(", ") || "none"} |
| Route | /${slug}: ${route} |
| Build | ${build.status === 0 ? "ok" : "FAILED"} |
| Tailwind classes that do not resolve | ${missing.join(", ") || "none"} |

## Scan

| Finding | Count |
|---|---|
${["unknown-prop", "deprecated-prop", "proposed-import", "hand-written", "hex-colour", "arbitrary-value"].map((k) => `| ${k} | ${count(k)} |`).join("\n")}

${findings.map((f) => `- ${f.kind}: ${f.file}:${f.line} ${f.detail}`).join("\n")}
`;
fs.mkdirSync(path.join(dev, "docs/slices"), { recursive: true });
fs.writeFileSync(path.join(dev, `docs/slices/${page}.md`), report);
console.log(report);
process.exit(build.status === 0 && !conflicts.length && !broken.length ? 0 : 1);
```

`.claude/commands/slice-vibe.md`:

```markdown
---
description: Slice a page from the vibe repo into this dev codebase
argument-hint: <PageName> [path to the vibe repo, default ../mvp-design-system]
---

Slice the page `$ARGUMENTS` from the vibe repo into this repo.

1. Run `node .claude/skills/design-system-handoff/scripts/sliceVibe.mjs <vibe repo> <PageName>` and read the report it prints (`docs/slices/<PageName>.md`).
2. If the design system copy is behind, say which components changed; do not stop.
3. For every scan finding, fix it only when the fix is mechanical and safe (a renamed or deprecated property, a hand-written element that has a component), then run the script's checks again
   (`npm run build`). For a `proposed-import`, do not move the component: list it and ask the developer to promote it or replace it.
4. Leave data as the mock with a `// TODO(integration)` comment at each call site; backend work is the developer's next task.
5. Finish with: files copied, findings fixed and findings left (with why), build result, and the report path.
```

Create the command in `mvp-dev` (not here). It is committed in Step 6.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -q -m "feat: slice scanner and sliceVibe in the design-system-handoff skill"
rsync -a .claude/skills/design-system-handoff/ ../mvp-dev/.claude/skills/design-system-handoff/
cd ../mvp-dev && mkdir -p .claude/commands   # create .claude/commands/slice-vibe.md with the text above
# in mvp-dev/package.json add: "test": "node --test '.claude/skills/design-system-handoff/scripts/__tests__/*.test.mjs'"
npm test && git add -A && git commit -q -m "feat: /slice-vibe command and the design-system-handoff skill"
```

---

### Task 4: The demo run and the baseline

**Files:**
- Create (vibe repo): `src/pages/Reservations.js`, a route in `src/App.js`
- Create (dev repo): `docs/slices/Reservations.md` (by the command), `docs/slices/BASELINE.md`, `docs/slices/DEMO.md`

**Interfaces:**
- Consumes: Task 2 (`pull-ui`) and Task 3 (`sliceVibe.mjs`).
- Produces: `docs/slices/DEMO.md` with the numbers the PM sees.

- [ ] **Step 1: The PM's side (vibe repo)**

Run `npm run pull-ui -- --source ../mvp-dev`, start `npm run storybook`, then ask Claude (as the PM would): "Build a Reservations page: a table of upcoming equipment reservations with a status badge, a filter (Select), and a 'New reservation' button. Use only Storybook components; mock data in `src/data`." Add its route to the vibe `src/App.js`. Run `npm run build`.
Expected: the build passes and `grep -c "proposed/" src/pages/Reservations.js` is 0 (or each proposed component is named in the page).

- [ ] **Step 2: The developer's side (dev repo)**

In `../mvp-dev`, run Claude Code and `/slice-vibe Reservations ../mvp-design-system`.
Expected: `docs/slices/Reservations.md` written; build ok; route added. Write down the script duration and how long the whole command took (stopwatch).

- [ ] **Step 3: The deprecation point**

In the vibe page, temporarily add `searchable` to the Select, run `/slice-vibe Reservations` again on a scratch copy of the dev repo (`git stash` or a throwaway branch), and confirm the report has `deprecated-prop: 1`; remove the temporary change.

- [ ] **Step 4: The baseline (a page built against another component set)**

In the vibe repo find a commit whose pages used the old component API, and slice one of its pages into a scratch branch of the dev repo:

```bash
cd ../mvp-design-system
C=$(git log --format=%h -S'variant="' -- src/pages | tail -1)
mkdir -p /tmp/vibe-old && git archive $C src | tar -x -C /tmp/vibe-old
cd ../mvp-dev && git switch -c baseline-run
node .claude/skills/design-system-handoff/scripts/sliceVibe.mjs /tmp/vibe-old Dashboard
```

Expected: a report with the unknown-property, deprecated-property and hand-written counts. Copy it to `docs/slices/BASELINE.md`, then `git switch main` and delete the branch (`git branch -D baseline-run`).

- [ ] **Step 5: Write `docs/slices/DEMO.md`, commit**

Write only the measured numbers: the Reservations slice (files, findings, script seconds, total minutes by stopwatch) next to the baseline (findings by kind). Say what the baseline is and is not (an older page against the current components, not a real prototype).

```bash
git add -A && git commit -q -m "docs: slice demo results and baseline"
```
