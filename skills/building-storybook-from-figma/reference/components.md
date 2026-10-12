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
   `border(1px, not a token)` = unbound stroke weight; `[stroke OUTSIDE]` = outside stroke (a ring).
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

## Common mistakes

- Making `State` a prop, or one story per Figma variant (hundreds).
- Layer names differ between variants (`Prefix` / `prefix`): compare by role, report it to the designer.
- Moving call sites: changing a component's API means updating every caller in the same change.
