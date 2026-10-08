# mvp-design-system rules

Equipment Loan Tracker: a dummy app used to test a design-system workflow
(tokens in Figma, components in Storybook, AI consumers). Same stack as swt-fe:
React 18, rsbuild, Tailwind 3, formik + yup, react-router-dom 6.

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
- Plain Tailwind for now (no tokens yet). On a page use Tailwind only for
  layout (flex, grid, gap, width, margin), not to restyle a component.
- Icons: `lucide-react` only. Text in plain English, sentence case.

- Story code is Storybook code: ignore `fn()` (from `storybook/test`), `useArgs()` and `updateArgs` in it. They only make the story interactive. Copy the JSX, not those helpers.

## Adding a shared component

- Folder `src/components/<kebab-name>/index.js` plus `<Name>.stories.js`, in the same commit.
- `propTypes` with a `/** */` description for every prop (this feeds the props table and the AI manifest).
- A `/** */` comment above the component: what it is and when to use it.
- One story per state; render the real component (no demo wrappers); state in args via `useArgs()`, handlers via `fn()`.
- Story `title`: `Actions/`, `Forms/`, `Data/`, `Feedback/`, `Overlays/` or `Navigation/`.
- Overlays (`position: fixed`) set `parameters.docs.story = { inline: false, iframeHeight }`.

## Commands

- `npm run dev` — the app (port 5002)
- `npm run storybook` — Storybook at http://localhost:6006 (starts through `.storybook/run.mjs`, which sets `NODE_PATH=src`; do not call `storybook dev` directly or the AI manifest loses its props)
- `npm run build-storybook` — static build in `storybook-static/`; serve it with a server that keeps `iframe.html?id=...` queries (not plain `npx serve`)
- `npm run build` — production build of the app
