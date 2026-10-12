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

## When to use

- New project: create tokens, Tailwind theme, Foundations pages and components from Figma.
- Existing Storybook: update tokens or one component after a design change.
- Replace the designer's manual Tokens Brücke export with a read from Figma.

Not for: Figma files you may edit through the plugin by mistake — this skill only reads.
Never call write tools (`figma_set_*`, `figma_create_*`, `figma_import_tokens`) on the user's files.

## Setup (once per machine / project)

1. Figma Desktop (Linux: IliyaBrook/figma-linux AppImage) + **Desktop Bridge** plugin
   (Plugins → Development → Import plugin from manifest).
2. figma-console MCP in **local** mode: `claude mcp add figma-console -s user -- npx -y figma-console-mcp@latest`.
   Local mode needs no pairing code and can target several open files (`fileKey`).
3. View-only file? Plugins only run where you can edit: the user saves a **copy** to drafts.
   A copy is a snapshot (and gets new style IDs).
4. Copy `scripts/` of this skill to the project's `scripts/figma/`, and
   `templates/figma-tokens.config.json` to the project root; set the collection roles.
5. Start the receiver: `python3 scripts/figma/dumpServer.py 9232 .figma-dump` (background).
   The plugin may only call `localhost:9223-9232`; it POSTs big data there.

## Phases

| Phase | Do | Proof |
|---|---|---|
| 0. Look | `figma_list_open_files`, `figma_navigate(url, lock: true)`; inventory with `plugin/inventory.js` | inventory doc |
| 1. Foundation | see `reference/foundation.md` | diff vs last Brücke export is identical for unchanged collections; `checkUtilities.mjs`; Foundations pages render |
| 2. Components | see `reference/components.md` (Button is the worked example) | Figma export vs Storybook sheet; hover/press values equal tokens |
| 3. Storybook | new project: `reference/storybook-setup.md` | `bash scripts/figma/renderCheck.sh` → 0 errors; manifest has props |

Run `figma_execute` scripts by pasting the file content as `code` with `fileKey` set.

## Rules that came from real failures

- **Big reads go to disk** through the receiver. One component set can be 1 MB.
- **Read scopes from Figma** (`readFoundation.js`): `figma_export_tokens` drops both `[]` and `ALL_SCOPES`.
- **Keep Figma's order** (the export is alphabetical: opacity-0, 10, 100, 20 …).
- **Tailwind name clash → `-color`**: a text colour named like a `text-*` utility
  (`color/text/base` vs `text-base` font size) becomes `text-base-color`.
- **Variants are a matrix, not components**: Kind × Status × Size become props;
  `State` hovered/pressed become `hover:`/`active:`; `md*` marks the default size.
- **Every class must be a token class.** No hex, no arbitrary values.
- Storybook decorators do not run on docs-only pages: follow the theme through the channel.
- Docs CSS overrides previews inside tables: wrap them in `sb-unstyled`.

## Red flags — stop and fix

- Writing a value you did not read from Figma ("looks like 8px").
- Calling a component done without the Figma vs Storybook sheet.
- Pasting hundreds of tokens or variants into the chat.
- `text-base` (or another utility) suddenly changing colour after a token build.
