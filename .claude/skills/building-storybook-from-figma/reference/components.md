# Phase 2 — Components (Figma component set → React component + stories)

Needs Phase 1 done: classes come from `src/tokens/tokens.index.json`.

## Steps per component

1. **Find it.** `inventory.js` (loader) saves `inventory.json`; `node scripts/figma/listSets.mjs <name>`
   prints the matching sets. Skip blocks (`~` pages) and internal parts (names starting with `.`)
   unless asked; build parts only as needed.
2. **Read every variant to disk.** Loader (SKILL.md) with `readComponents.js` and
   `ARGS = { NAMES: ["<Name>"], DEPTH: 8 }` (one set per call), `fileKey`, **`timeout: 30000`**
   → `.figma-dump/components.<Name>.json`.
3. **Find what drives what.**
   `node scripts/figma/analyzeComponent.mjs .figma-dump/components.<Name>.json [--values]`
   → groups attributes by the variant properties that decide them (hidden layers skipped,
   layer names case-insensitive; `--all` includes hidden layers).
4. **Get the classes.**
   `node scripts/figma/variantClasses.mjs .figma-dump/components.<Name>.json "Size=md*,Disabled=false"`
   → per variant, per layer: `bg-* border-* text-* h-* px-* py-* gap-* rounded-* typo-*`.
   `?Collection/name` = token without a class (fix the token mapping, never hardcode);
   `~class` = guessed by swapping the utility, may not exist (check it);
   `border(1px, not a token)` = unbound stroke weight; `border-b (sides 0/0/1/0px)` = a border on some sides only; `[stroke OUTSIDE]` = outside stroke (a ring).
5. **Write the component** (`src/components/<kebab>/index.js`) from those tables.
6. **Stories** (`<Name>.stories.js`): one per meaningful state + one matrix story of the
   main axes for the visual check.
7. **Prove it.** Serve the build on its own port: `python3 -m http.server 6011 -d storybook-static &`
   (`renderCheck.sh` uses 6010; stop servers with `kill $(lsof -ti :6011)`, never `pkill -f`).
   - Static look: loader with `exportVariants.js` and `ARGS = { SET, WHERE, EACH }` → `fig-*.png`;
     `node scripts/figma/interact.mjs <story-id> "#storybook-root" --shot sb.png` (cropped, 2×);
     `python3 scripts/figma/compareSheet.py sheet.png sb.png <fig files>` and **look at it**. Pass the
     Figma files **in the order of the story's grid** (the shell glob is alphabetical): build the list
     in a loop over the same kinds and statuses. The matrix story carries the same optional parts
     (icons, labels) as the exported variants, or the sheets differ for a reason that is not a bug.
   - States: `node scripts/figma/interact.mjs <story-id> "<the styled element>" hover press` (or
     `focus type=Hi`) prints computed colours per step; they must equal the token values in
     `src/tokens/tokens.index.json`. Select the element that carries the style (an input's
     wrapper, not the `<input>`). A focus look: add `--shot` after `focus`.
   - `node scripts/figma/checkUtilities.mjs "<every class used>"`, then `bash scripts/figma/renderCheck.sh`.
   - `node scripts/figma/indexComponent.mjs <Name> --file <figmaFileKey> --story <story id> --code <dir>` records where the set lives (`figma-index.json`).
   - Write `docs/<ds>/<component>.md`: what drives what, colour table, API, checks, notes for the designer.

## The project has its own tokens (case D, e.g. swt-fe)

The data is the same (the project's tokens come from the same Figma foundation); the **classes** are not: the project's Tailwind
maps only what it chose to (SWT: colours such as `bg-primary-default`, `text-default`, `bg-surface`, `border-primary`, and `fontSize`; **no**
`h-component-*`, **no** `typo-*`). Then:

1. **Do not run the whole Phase 1** here (`buildTokens.mjs`, `buildTokenDocs.mjs`): it would replace the project's `tokens.css` and Tailwind mapping. What the skill may do is
   **export only**: read the foundation through the Desktop Bridge (`reference/foundation.md`) and write the project's `design_token.json` (Brücke shape, `toBruecke.mjs`; it reproduced
   SWT's Brücke export exactly on 2026-10-12), replacing the project's `--fetch` from GitHub. The project's own build (`tokens:build`: `buildCss` + `tokenMap.js` + docs) then makes
   `tokens.css`. Keep its rollback guard (`exportedAt`). Run `diffTokens.mjs <new> <project's file> --ignore-style-id` first and show the developer what changed; `+Theme/content (...)` strings are mock text, not design.
   The foundation file (Graphene) is a different Figma file from the components (Shield): open the right one before each read.
2. **Class source = the project, not `tokens.index.json`.** Read its `tailwind.config.js` and the custom properties in its `tokens.css`. For each
   value `variantClasses.mjs` prints, in this order: (a) a class the project already has (`checkUtilities.mjs` equivalent: grep the config), (b) a standard
   Tailwind class with the same value (`h-9` for a 36px height, `text-sm`), written with the project's custom property when one exists
   (`h-[var(--sizing-component-md)]` only if the variable is in `tokens.css`), (c) otherwise stop and ask. **Never a hex, never an invented class.**
   Adding classes to the project's Tailwind config changes a shared build: only with the developer's OK, after a pilot of two or three components shows the pattern.
3. **Check the token switch.** If the project's tokens are behind a switch (SWT: `data-tokens="on"`, off by default today), the Storybook preview must turn it
   on, or the stories show the built-in fallback colours and not the Figma ones (SWT's `.storybook/preview.js` does since 2026-11-16). The switch is transitional: the team's
   direction is tokens always on, a separate app-wide change (it alters every page: check the `diffTokens` list first). Not part of a component change.
4. **Names follow the project.** The component exists with another API (Shield `Kind` + `Status` vs SWT `type`): the project's API wins; add the Figma
   difference as an additive prop or put it through the review (`existing-component.md`, `review.components[...].map`).
5. **Stories use the project's conventions**: copy the shape of its best existing story, not the matrix-first shape above. For SWT: `title: "Components/<Name>"`,
   `component`, default `args`, `argTypes` with `control` (and `if: { arg, eq }` for dependent props), one story per meaningful state with a `/** */` line saying when
   it is used, a `decorators` width, alias imports (`components/<name>`), `useArgs` from `storybook/preview-api` only for interactive ones, and the Figma link:

   ```js
   parameters: { design: { type: "figma", url: "https://www.figma.com/design/<fileKey>/?node-id=<id with dashes>" } },
   ```

   The `fileKey` and node id come from `figma-index.json` (`indexComponent.mjs`), so the link is never typed by hand. Use the key of the **Shield** file for components.
6. Docs per component (`docs/<ds>/<name>.md`) only where the project has such a folder.

## Translation rules (Figma → code)

| Figma | Code |
|---|---|
| VARIANT property (Kind, Status, Size …) | prop with the same options, camelCase name, lowercase values |
| `md*` (asterisk) | the default option (not `set.defaultVariant`, which is just the first one) |
| `State` = hovered / pressed / focused (buttons, links) | `hover:` / `active:` / `focus-visible:` classes, **not** a prop |
| Form control `State` = pressed with a caret, focused | focus (`focus-within:` on the wrapper), not `:active` |
| Form control `State` = filled / filled-hovered | "has a value" (show clear button etc.), not a CSS state |
| Read-only / Disabled variants | props; take their colours from those variants |
| A combination that has no variant (e.g. Disabled only for status default) | reuse the nearest variant, write the choice in the component doc |
| Disabled / Loading variants | `disabled` / `loading` props; disabled replaces colours (no hover) |
| BOOLEAN property that shows a layer | optional prop; render the part only when given |
| TEXT property | prop or `children` (main label → `children`) |
| INSTANCE_SWAP icon | icon prop taking a lucide element; the component sets its size from the variant (`[Icon … 18px]`) |
| SLOT | `children` |
| Bound variable | its token class from `variantClasses.mjs`; never the hex next to it |
| Text style | `typo-<style>` class |

## Worked examples

- `docs/shield/button.md` — Button (360 variants): pure visual variants.
- `docs/shield/input.md` — Input (84 variants): boolean / text props, focus ring from a
  background token, filled state, Field wrapper.

## Worked example: SHIELD Button (360 variants)

`analyzeComponent.mjs` said: Size → height, padding, gap, icon size; Kind + Status (+ State,
Disabled) → fill, stroke, text colour; Loading → label hidden, `loader-circle` 16px;
radius and text style constant. `variantClasses.mjs` gave, for `Size=md*`:

```
filled  primary  root: bg-primary-default h-component-md py-2.5 px-4 gap-2 rounded-default   Label: text-base-color typo-semi-bold-text-sm
outlined primary root: bg-surface border-primary border …   hovered: bg-default-hovered   Label: text-primary
```

Resulting shape (full file: `src/components/button/index.js` in the reference project):

```js
const STATUS = { filled: { primary: "bg-primary-default text-base-color hover:bg-primary-hovered active:bg-primary-pressed", … } };
const SIZE = { sm: "h-component-sm px-4 gap-2", md: "h-component-md px-4 gap-2", lg: "h-component-lg px-5 gap-3" };
export const Button = forwardRef(function Button({ kind = "filled", status = "default", size = "md", loading, disabled, prefixIcon, suffixIcon, … }, ref) { … });
```

Props: `kind, status, size, loading, disabled, prefixIcon, suffixIcon, as, type`, each
with a `/** */` description in `propTypes` (feeds the Storybook manifest).

## Cases without a direct class

- **Stroke bound to a background token** (focus rings often use `background/*/invert/focused`):
  `ring-*` / `outline-*` only know border colours. Draw it with an extra element that uses the
  `bg-*` token (absolutely placed span behind the box), or a `box-shadow` from a `--theme-*`
  variable. Never fall back to hex.
- **Class names in full.** Keep every class as a literal string in a map (`{ primary: "border-primary" }`),
  never `` `border-${status}` ``: Tailwind scans the source for whole class names and drops the rest.
- **Fixed height vs padding**: when padding + line height exceed the height token, keep the
  height token (`h-component-*`) and drop the vertical padding.

## The project already has a wrapper (e.g. Field with label / hint / error)

When the Figma component carries its own label and caption (SHIELD Input does), give the
component those props **and** keep the wrapper working: move label / caption into shared
parts both use, let the component read the wrapper's context (id, error → status, caption
id), and render bare inside the wrapper. Every existing caller must keep rendering.

## The component already exists with another API

Compare, decide (change in place, or a compatibility layer when callers are many), and write the migration table down:
`existing-component.md`. Never a `ButtonV2`.

## Common mistakes

- Making `State` a prop, or one story per Figma variant (hundreds).
- Layer names differ between variants (`Prefix` / `prefix`): compare by role, report it to the designer.
- Moving call sites: changing a component's API means updating every caller in the same change.
