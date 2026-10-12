# Phase 2 — Components (Figma component set → React component + stories)

Needs Phase 1 done: classes come from `src/tokens/tokens.index.json`.

## Steps per component

1. **Find it.** `plugin/inventory.js` lists sets per page. Skip blocks (`~` pages) and
   internal parts (names starting with `.`) unless asked; build parts only as needed.
2. **Read every variant to disk.** Edit `NAMES` in `plugin/readComponents.js` (one set per
   call: a 945-variant set can take most of the 30 s limit) and run it with `figma_execute`
   → `.figma-dump/components.<Name>.json`.
3. **Find what drives what.**
   `node scripts/figma/analyzeComponent.mjs .figma-dump/components.<Name>.json`
   → groups attributes by the variant properties that decide them.
4. **Get the classes.**
   `node scripts/figma/variantClasses.mjs .figma-dump/components.<Name>.json "Size=md*,Disabled=false"`
   → per variant, per layer: `bg-* border-* text-* h-* px-* py-* gap-* rounded-* typo-*`.
   A `?Collection/name` means the token has no class: fix the token mapping, never hardcode.
5. **Write the component** (`src/components/<kebab>/index.js`) from those tables.
6. **Stories** (`<Name>.stories.js`): one per meaningful state + one matrix story of the
   main axes for the visual check.
7. **Prove it.**
   - `plugin/exportVariants.js` (set `SET`, `WHERE`, `EACH`) → `fig-*.png` in `.figma-dump/`.
   - Screenshot the matrix story at 2× (`google-chrome --headless=new --force-device-scale-factor=2 --screenshot=… "http://localhost:6010/iframe.html?id=<story-id>&viewMode=story"`).
   - `python3 scripts/figma/compareSheet.py sheet.png storybook.png .figma-dump/fig-<set>-*.png` and **look at it**.
   - Hover / press with CDP (`Input.dispatchMouseEvent`) and compare computed colours with token values.
   - `node scripts/figma/checkUtilities.mjs "<every class used>"`, then `renderCheck.sh`.
   - Write `docs/<ds>/<component>.md`: what drives what, colour table, API, checks, notes for the designer.

## Translation rules (Figma → code)

| Figma | Code |
|---|---|
| VARIANT property (Kind, Status, Size …) | prop with the same options, camelCase name, lowercase values |
| `md*` (asterisk) | the default option (not `set.defaultVariant`, which is just the first one) |
| `State` = hovered / pressed / focused | `hover:` / `active:` / `focus-visible:` classes, **not** a prop |
| Disabled / Loading variants | `disabled` / `loading` props; disabled replaces colours (no hover) |
| BOOLEAN property that shows a layer | optional prop; render the part only when given |
| TEXT property | prop or `children` (main label → `children`) |
| INSTANCE_SWAP icon | icon prop taking a lucide element; the component sets its size from the variant (`[Icon … 18px]`) |
| SLOT | `children` |
| Bound variable | its token class from `variantClasses.mjs`; never the hex next to it |
| Text style | `typo-<style>` class |

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

## Common mistakes

- Making `State` a prop, or one story per Figma variant (hundreds).
- Layer names differ between variants (`Prefix` / `prefix`): compare by role, report it to the designer.
- Moving call sites: changing a component's API means updating every caller in the same change.
