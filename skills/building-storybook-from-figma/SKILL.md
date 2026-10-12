---
name: building-storybook-from-figma
description: Use when a React + Tailwind project needs its design tokens, Tailwind theme, Storybook Foundations pages or Storybook components generated or updated from a Figma design system (variables, text and effect styles, component sets), read through the figma-console MCP and its Desktop Bridge plugin; also when replacing a manual Tokens Brücke export, or when Storybook does not match Figma.
---

# Building Storybook from Figma

## Overview

Figma is the source of truth. Read it **only** through the Desktop Bridge plugin, save
big reads to disk (never through the chat), turn them into files with the bundled
scripts, and prove every result against Figma before calling it done. Foundation first,
components second, pages last.

Never call write tools (`figma_set_*`, `figma_create_*`, `figma_import_tokens`) on the user's files.

## Which case is it?

Look at the project first (`ls`, `package.json`). Do not assume a stack.

| Case | What the project has | Start at |
|---|---|---|
| A. Project, no Storybook (most common) | a React app or boilerplate | Setup, then `node <skill>/scripts/initStorybook.mjs` (reports the stack, `--write` adds `.storybook/`), then Phase 1 |
| B. Storybook exists | `.storybook/` | Phase 1 to update tokens, Phase 2 for a component |
| C. Empty folder | nothing | copy `templates/starter/` (our stack: React 18, rsbuild, Tailwind 3), `npm install`, then case A |

**Supported today: React 18 + Tailwind 3** (bundler rsbuild, vite or webpack). Not supported yet:
Tailwind 4, no Tailwind, Next.js. `initStorybook.mjs` stops on them and says why; tell the user it
is a limit of the skill. The workflow differs there (another theme output, another class
check) and there is no template for it yet. `--force` still adds Storybook and `tokens.css`
(plain CSS variables), but do not promise more than that.

## Setup (once per machine / project)

1. Figma Desktop (Linux: IliyaBrook/figma-linux AppImage) + **Desktop Bridge** plugin
   (Plugins → Development → Import plugin from manifest).
2. figma-console MCP in **local** mode: `claude mcp add figma-console -s user -- npx -y figma-console-mcp@latest`.
   Local mode needs no pairing code and can target several open files (`fileKey`).
3. View-only file? Plugins only run where you can edit: the user saves a **copy** to drafts.
   A copy is a snapshot (and gets new style IDs).
4. Copy `scripts/` of this skill to the project's `scripts/figma/`, and
   `templates/figma-tokens.config.json` to the project root.
5. Start the receiver in the background: `python3 scripts/figma/dumpServer.py 9232 .figma-dump`.
   It exits with a message if the port is taken (`kill $(lsof -ti :9232)`, then start again).
   `curl localhost:9232/ping` shows where data lands. It receives data (`POST /save`) and serves
   the plugin scripts (`GET /script`). The plugin may only call `localhost:9223-9232`.
6. `figma_list_open_files`, then `figma_navigate(url, lock: true)` for the file you work in, and run
   `selfTest.js` through the loader (below) once: it proves the plugin reaches the receiver.
   `figma_execute` takes a `fileKey`, but **`figma_export_tokens` and the other tools use the
   locked file**: navigate to the foundation file before exporting tokens, and back to the
   component file before reading components. "The export contains 0 tokens" means the wrong file is locked.

### Running a plugin script (the loader)

Never paste a plugin script. Pass this to `figma_execute` (`fileKey`, `timeout: 30000`),
changing only the script name and `ARGS`:

```js
const src = await (await fetch("http://localhost:9232/script?name=readFoundation.js")).text();
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
return await new AsyncFunction("ARGS", src)({ PORT: 9232 });
```

`ARGS` per script: `readComponents.js` `{ NAMES: ["Button"], DEPTH: 8 }`,
`exportVariants.js` `{ SET, WHERE, EACH }`; `readFoundation.js`, `inventory.js`, `selfTest.js`: `{}`.
A timeout on the first call of a big file is a cold page load: call it again.

## Phases

| Phase | Do | Proof |
|---|---|---|
| 0. Look | `inventory.js` (saves `inventory.json`), then `node scripts/figma/listSets.mjs [filter]` | the set you need, with variant count |
| 1. Foundation | `reference/foundation.md` | `checkConfig.mjs` roles ok; diff vs last Brücke export identical for unchanged collections; `checkUtilities.mjs`; Foundations pages render |
| 2. Components | `reference/components.md` (Button is the worked example) | Figma export vs Storybook sheet; hover/press values equal tokens |
| 3. Storybook | case A and C: `reference/storybook-setup.md` | `bash scripts/figma/renderCheck.sh` → 0 errors; manifest has props |

Phase 3 comes before the Foundations pages can be seen; do it right after the tokens build
when the project has no Storybook.

## Rules that came from real failures

- **Big reads go to disk** through the receiver (components, inventory, tokens): never into the chat.
- **Read scopes from Figma** (`readFoundation.js`): `figma_export_tokens` drops both `[]` and `ALL_SCOPES`.
- **Check the roles** in `figma-tokens.config.json` against the file (`checkConfig.mjs`); its defaults are Graphene's names.
- **Keep Figma's order** (the export is alphabetical: opacity-0, 10, 100, 20 …).
- **Tailwind name clash → `-color`**: a text colour named like a `text-*` utility
  (`color/text/base` vs `text-base` font size) becomes `text-base-color`.
- **Variants are a matrix, not components**: Kind × Status × Size become props;
  `State` becomes CSS states (`hover:`/`active:` for buttons; for form controls "pressed"
  with a caret is focus, "filled" means it has a value); `md*` marks the default size.
- **Every class is a token class, written in full** in a map. No hex, no arbitrary values, and no
  `` `border-${status}` ``: Tailwind cannot see a class built from a string.
- Storybook decorators do not run on docs-only pages: follow the theme through the channel.
- Docs CSS overrides previews inside tables: wrap them in `sb-unstyled`.
- `interact.mjs` scopes the selector to `#storybook-root` for you; give it the element that carries the style.

## Red flags — stop and fix

- Writing a value you did not read from Figma ("looks like 8px").
- Calling a component done without the Figma vs Storybook sheet and the state check (`interact.mjs`).
- Pasting hundreds of tokens, variants or a plugin script into the chat.
- `text-base` (or another utility) suddenly changing colour after a token build.
- Overwriting a project's own `tailwind.config.js`, `index.css` or bundler config instead of merging.
