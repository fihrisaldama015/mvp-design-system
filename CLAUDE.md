# mvp-design-system rules

Equipment Loan Tracker: a dummy app used to test a design-system workflow
(tokens in Figma, components in Storybook, AI consumers). Same stack as swt-fe:
React 18, rsbuild, Tailwind 3, formik + yup, react-router-dom 6.

## First time on this machine (set up before anything else)

If the user says "setup", or `node` / the Figma tools are missing: run `node scripts/figma/doctor.mjs` (add `--json` if easier to read).
Fix each `FAIL` line with the user's approval (install Node, Python, Chrome, ...), then run it again until it is clean. Per-OS steps and
known differences (Windows, macOS): `.claude/skills/building-storybook-from-figma/reference/setup.md`. If `node` itself is missing,
install it first (Windows `winget install OpenJS.NodeJS.LTS`, macOS `brew install node`). Two steps stay manual and you can only guide
them: in Figma Desktop import the Desktop Bridge plugin from `~/.figma-console-mcp/plugin/manifest.json`
(Plugins > Development > Import plugin from manifest) and run it, and approve the project MCP servers when Claude Code asks.
The skill `building-storybook-from-figma` lives in `.claude/skills/` (nothing to install). Start the receiver with `npm run figma:receiver`.

## Build pages from Storybook

- Storybook is the source of truth for the UI. **Before building or changing a
  page, read Storybook**: `npm run storybook`, then use the MCP server
  (`docs-list`, `docs-show`). `Guide/Introduction` has the rules and
  `Guide/Component choices` says why each variant was chosen.
- Import shared components with `components/<name>`; never write a button, input,
  badge, table, modal, drawer, toast, tabs or tooltip by hand.
- Do not guess a prop, an import path or a colour class. If Storybook has no
  component for it, ask before adding one; extend an existing component with a
  prop when you can.
- Design tokens come from Figma (Graphene) and are generated: `src/tokens/*` and
  `src/foundations/*.mdx` are never edited by hand. Read `Foundations/Overview` in
  Storybook. Semantic classes first (`text-default`, `bg-surface`, `border-default`,
  `rounded-default`, `h-component-md`, `p-page-padding`), then the scale (`p-4`,
  `rounded-lg`); no hex, no arbitrary values (`p-[13px]`). Dark mode is
  `<html data-theme="dark">`; components need no `dark:` variants.
- On a page use Tailwind only for layout (flex, grid, gap, width, margin), not to
  restyle a component.
- Icons: `lucide-react` only. Text in plain English, sentence case.

- Story code is Storybook code: ignore `fn()` (from `storybook/test`), `useArgs()` and `updateArgs` in it. They only make the story interactive. Copy the JSX, not those helpers.

## Adding a shared component

- Folder `src/components/<kebab-name>/index.js` plus `<Name>.stories.js`, in the same commit.
- `propTypes` with a `/** */` description for every prop (this feeds the props table and the AI manifest).
- A `/** */` comment above the component: what it is and when to use it.
- One story per state; render the real component (no demo wrappers); state in args via `useArgs()`, handlers via `fn()`.
- Story `title`: `Actions/`, `Forms/`, `Data/`, `Feedback/`, `Overlays/` or `Navigation/`.
- Overlays (`position: fixed`) set `parameters.docs.story = { inline: false, iframeHeight }`.

## Updating the tokens from Figma

See `docs/shield/foundation.md`. In short: open Graphene in Figma Desktop with the
Desktop Bridge plugin, run `python3 scripts/figma/dumpServer.py 9232 <dir>`, then
`figma_export_tokens` + `figma_execute(scripts/figma/plugin/readFoundation.js)`, then
`node scripts/figma/toBruecke.mjs <dir> src/tokens/design_token.json`,
`node scripts/figma/buildTokens.mjs` and `node scripts/figma/buildTokenDocs.mjs`.
`node scripts/figma/checkUtilities.mjs "<classes>"` shows what a class compiles to.

## Commands

- `npm run dev` — the app (port 5002)
- `npm run storybook` — Storybook at http://localhost:6006 (starts through `.storybook/run.mjs`, which sets `NODE_PATH=src`; do not call `storybook dev` directly or the AI manifest loses its props)
- `npm run build-storybook` — static build in `storybook-static/`; serve it with a server that keeps `iframe.html?id=...` queries (not plain `npx serve`)
- `npm run build` — production build of the app
