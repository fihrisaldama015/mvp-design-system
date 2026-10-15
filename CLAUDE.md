# mvp-design-system rules

Equipment Loan Tracker: a dummy app used to test a design-system workflow
(tokens in Figma, components in Storybook, AI consumers). Same stack as swt-fe:
React 18, rsbuild, Tailwind 3, formik + yup, react-router-dom 6.

## First time on this machine (set up before anything else)

This belongs to the dev workflow (the Figma sync stays here only until phase 4): do not start it from this repo without the developer.

If the user says "setup", or `node` / the Figma tools are missing: run `node scripts/figma/doctor.mjs` (add `--json` if easier to read).
Fix each `FAIL` line with the user's approval (install Node, Python, Chrome, ...), then run it again until it is clean. Per-OS steps and
known differences (Windows, macOS): `.claude/skills/building-storybook-from-figma/reference/setup.md`. If `node` itself is missing,
install it first (Windows `winget install OpenJS.NodeJS.LTS`, macOS `brew install node`). Two steps stay manual and you can only guide
them: in Figma Desktop import the Desktop Bridge plugin from `~/.figma-console-mcp/plugin/manifest.json`
(Plugins > Development > Import plugin from manifest) and run it, and approve the project MCP servers when Claude Code asks.
The skill `building-storybook-from-figma` lives in `.claude/skills/` (nothing to install). Start the receiver with `npm run figma:receiver`.
The skill's scripts (`.claude/skills/.../scripts/`) are the source; `scripts/figma/` is the copy the project runs. After editing the skill run `npm run sync-skill` (`doctor` warns when they differ).

## Resuming a sync (new session, after sleep or restart)

This belongs to the dev workflow and is not to be started from the vibe repo without the developer.

You do not remember the earlier session; the review store does. At the start of any Figma sync work run `node scripts/figma/reviewState.mjs`
(`doctor` shows the same as `sync-review`; the SessionStart hook runs it quietly). It says whether a review is **waiting for the reviewers**
(do not apply anything; tell the dev they answer on the page `/review`; other components can be synced meanwhile) or **answered, not applied**
(`reviewSync.mjs --answers "<Name>"`, re-read the node from Figma, `reviewSync.mjs --verify <file>`: unchanged -> apply, then
`reviewSync.mjs --done "<Name>"`; changed -> run reviewSync again and have the reviewers answer again). If it says the store cannot be reached, do not
assume nothing is pending. Never answer for the reviewers. Procedure: `reference/existing-component.md`; the store and its API: `reference/review-service.md`.

## Are the tokens still current?

This belongs to the dev workflow and is not to be started from the vibe repo without the developer.

The SessionStart hook (or `node scripts/figma/foundationAge.mjs`) says when the Foundation was last exported or checked. After 7 days
(`staleAfterDays` in `figma-tokens.config.json`) it asks you to **ask the dev first**: checking needs Figma Desktop, the Desktop Bridge
plugin and the receiver running. Never start it on your own. If the dev agrees: `reference/foundation.md`, "Checking for changes".

## Build pages from Storybook

- Storybook is the source of truth for the UI. **Before building or changing a
  page, read Storybook**: `npm run storybook`, then use the MCP server
  (`docs-list`, `docs-show`). `Guide/Introduction` has the rules and
  `Guide/Component choices` says why each variant was chosen.
- Import shared components with `components/<name>`; never write a button, input,
  badge, table, modal, drawer, toast, tabs or tooltip by hand.
- Do not guess a prop, an import path or a colour class. If Storybook has no
  component for it, ask the developer (components are changed in the dev repo) or use
  `src/proposed/`.
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
- `src/components`, `src/tokens`, `src/foundations`, `src/guide`, `src/utils` and `.storybook` are a **generated copy** of the dev repo's design system
  (`npm run pull-ui`). Never edit them; `npm run ui-check` (and the session hook) warn when they differ from `ui-lock.json`. A change to a component is made in the dev repo.
- A component that does not exist yet: build it in `src/proposed/<kebab-name>/` (with a story) and use it freely in the prototype. The developer decides at
  slice time whether it is promoted to the dev repo. Properties marked `@deprecated` in the manifest are not used in new pages.
- App-specific helpers go in `src/app/`, not in `src/utils` or `src/guide`: those two folders are mirrored from the dev repo and a vibe-only file there is deleted by the next `pull-ui`.

## Adding a shared component

Shared components are added in the dev repo (`/home/aldam/WORK/BLUE_SILO/TRMS/Repo/mvp-dev`), not here. Here a new component goes in
`src/proposed/<kebab-name>/` with a story. Format for a proposed component: `propTypes` with a `/** */` description for every prop and a `/** */` comment
above the component (what it is, when to use it); one story per state rendering the real component, story `title` `Actions/`, `Forms/`, `Data/`,
`Feedback/`, `Overlays/` or `Navigation/`; overlays (`position: fixed`) set `parameters.docs.story = { inline: false, iframeHeight }`.

## Updating the tokens from Figma

Token updates and Figma syncs are done in the dev repo's workflow, not here. The Figma skill files (`scripts/figma/`,
`.claude/skills/building-storybook-from-figma`) stay in this repo only until the review service moves (phase 4). An AI consumer in this repo must tell
the developer instead of running a token update or a Figma sync. `node scripts/figma/checkUtilities.mjs "<classes>"` (read only) still shows what a class compiles to.

## Commands

- `npm run dev` — the app (port 5002)
- `npm run storybook` — Storybook at http://localhost:6006 (starts through `.storybook/run.mjs`, which sets `NODE_PATH=src`; do not call `storybook dev` directly or the AI manifest loses its props)
- `npm run build-storybook` — static build in `storybook-static/`; serve it with a server that keeps `iframe.html?id=...` queries (not plain `npx serve`)
- `npm run build` — production build of the app
