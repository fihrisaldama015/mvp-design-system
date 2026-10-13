# Select: SHIELD "Input - Single Select/Base" (existing component, feature dropped by Figma)

Second test of `reference/existing-component.md`, and the first with a **removal**: the repo's Select had a
search box in its menu, Figma's Select has none. Figma node `7:94371` (30 variants, page "Input - Single Select"),
code `src/components/select/index.js`. Baseline before the sync: commit `0b00c48` (Select with `searchable`, on by default).

## What Figma has (and does not)

Figma draws **the control only**: label, required mark, prefix icon (plus), value or placeholder, chevron, caption.
Properties: `Size` sm/md*/lg, `Status` Default/Danger, `Disabled`, `Read-only`, `State` (default, hovered, filled,
pressed...), booleans for label, caption, prefix and suffix icon, `Clearable Icon`, `Required`. **There is no menu**
(`Expanded` only turns the chevron up) **and no search.** The menu in code is ours; it uses the same tokens.

## Review (`reviewSync.mjs`, answered on the page /review)

```
node scripts/figma/reviewSync.mjs .figma-dump/components.Input-Single-Select-Base.json src/components/select/index.js \
  --behavior options --legacy error=status --ignore "State,Label,Caption,Placeholder,Label Elements,Value Text" \
  --map '{"Read-only":"readOnly","Clearable Icon":"clearable","Label Text":"label","Caption Text":"caption","Placeholder Text":"placeholder"}'
```

| Group | Items |
|---|---|
| Safe additions | `size`, `readOnly`, `clearable`, `prefixIcon`, `suffixIcon`, `label`, `required`, `caption` |
| Mapped | `error` → `status="danger"` (both kept) |
| Default changes | none (Figma md is the default, as in code) |
| **Gone from Figma** | **`searchable`**: 0 app callers, 2 story files, **on by default, so every caller gets it** |

**Decision (the dev, on the review page, saved 2026-10-13 11:11 and again 11:14 WIB): keep it as deprecated.**
How it happened, for the record: the agent first applied this outcome itself in a test run, *before* the dev had answered (a mistake: the
agent must never answer for the dev; the rule is now in the skill). The dev then answered on the page with the same choice, the agent re-read
the Figma node (unchanged, hash `460b1f89d95c`) and confirmed the code matches the saved answer; the review was closed with `--done`.

## What "deprecated" did here

- `searchable` stays and works; `propTypes` description starts with `@deprecated ...` (it reaches the AI manifest: checked in
  `manifests/components.json`).
- The default flipped to **off**: new pages get the plain Figma look. The story `SearchableDeprecated` shows it; there is no story that
  presents search as a normal option.
- A dev-only `console.warn` fires once per page load when a caller passes `searchable`.
- Callers: the two story files relied on the default. Stories are examples, so they follow the new default (no search). A *product*
  caller that relied on it would get `searchable` added explicitly in the same change (0 here).
- Removal later: when `reviewSync` shows 0 callers passing it, delete the prop and log it in the changelog.

## Colours and layout (shared with Input)

Size, border per status and focus ring come from `components/field/control.js`, moved out of Input (Input renders the same,
`renderCheck` unchanged). Select adds only the menu. Hover border `rgb(139, 8, 54)` equals `border-primary`.

## Checks

| Check | Result |
|---|---|
| Figma vs Storybook sheet: default, danger, sm, md, lg, disabled, read-only | match (`docs/shield/img/select-figma-vs-storybook.png`); the third sheet column is cropped at the right by the screenshot, not by the component |
| Default story has no search box; no deprecation warning | yes |
| `SearchableDeprecated`: search filters ("lap" → Laptop), "No results", warning once | yes |
| Hover border = token | yes |
| `checkUtilities` | all classes resolve (`z-[70]` was already in the project) |
| `renderCheck` / app build | 191 pages, 0 errors / ok |
| Not checked | Dark mode; Figma states `filled`/`pressed` side by side; keyboard flow of the new box (clicks and typing were driven) |

## What the test taught the skill

1. **Real Figma data crashed the review page.** `page` is `{name, id}`, not a string.
2. **Default-on props reach every caller.** Counting callers that *pass* `searchable` gives 0; the right number is callers of the component.
   `reviewSync` now says "ON by default: all of them get it".
3. **Callers are counted as app and story files** separately (stories are examples, products are not).
4. **Figma's name is not the JSX name** (`Input - Single Select/Base` vs `<Select>`).
5. **Behaviour is not looks.** `value`, `onChange`, `options`, every `on*` handler are never "gone from Figma" (`--behavior`).
6. **A wrapper's props count** (`--also`), Figma properties that are not props are skipped (`--ignore`: CSS state, show/hide switches).
7. **The re-run proves the sync**: it converged to a single line, `searchable [already deprecated]`. It also showed that I had
   over-extended Select (`info`, status `info/success/warning`) by copying Input; Figma's Select has only `default`/`danger`.

## Notes for the designer

- The Select has no menu in Figma: option list, selected tick, hover row, empty state and search are all undesigned.
- `Status` has only Default and Danger here, while Input has five.
- `Info` icon next to the label exists in Input, not in Select.
