# Pilot 1: Button (SHIELD → code)

Source: SHIELD "Button" component set — 360 variants (Kind 4 × Status 6 × State 3 ×
Size 3 × Disabled × Loading). Read with `scripts/figma/plugin/readComponents.js`,
analysed with `node scripts/figma/analyzeComponent.mjs components.Button.json`.

## What drives what (from the analysis)

| Figma property | Drives | Code |
|---|---|---|
| Size `sm / md* / lg` | height, padding, gap, icon size | `size` prop: `h-component-sm/md/lg`, `px-4/4/5`, `gap-2/2/3`, icon 16/18/18 |
| Kind + Status | fill, border, text colour | `kind` + `status` props (table below) |
| State `hovered / pressed` | fill only | `hover:` / `active:` classes (not a prop) |
| Disabled | fill, border, text colour | `disabled` prop |
| Loading | hides label and icons, shows a 16px loader-circle | `loading` prop; label kept invisible so the width does not jump |
| (all variants) | radius `+Theme/border/radius/default`, text style `Semi Bold/text-sm` | `rounded-default`, `typo-semi-bold-text-sm` |

## Colours (all Graphene semantic tokens)

| Kind | Status default | Other statuses (`s` = primary, info, success, warning, danger) | Hovered / pressed | Disabled |
|---|---|---|---|---|
| filled | `bg-default-default text-default` | `bg-s-default text-base-color` | `bg-s-hovered` / `bg-s-pressed` | `bg-disabled text-disabled` |
| outlined | `bg-surface border-invert-default text-default` | `bg-surface border-s text-s` | `bg-default-hovered` / `bg-default-pressed` | `border-disabled text-disabled` (default keeps `border-invert-default`) |
| dashed | as outlined + `border-dashed` | as outlined | as outlined | as outlined |
| text | `bg-transparent text-default` | `bg-transparent text-s` | `bg-default-hovered` / `bg-default-pressed` | `text-disabled` |

## API change (old Button → SHIELD Button)

| Old | New |
|---|---|
| `variant="primary"` (old default) | `status="primary"` (new default is `kind="filled" status="default"`, as in Figma) |
| `variant="secondary"` | `kind="outlined"` |
| `variant="ghost"` | `kind="text"` |
| `variant="danger"` | `status="danger"` |
| `leftIcon` / `rightIcon` | `prefixIcon` / `suffixIcon` (Figma names; the button sizes the icon) |

All call sites in `src/components` were moved to the new API (ConfirmDialog, Pagination,
DatePicker, DateRangePicker and the stories).

## Checked

- Figma export vs Storybook, same scale: `img/button-figma-vs-storybook.png`. Colours,
  heights, radius, borders (solid / dashed), text colours and disabled match. Only the
  suffix icon differs (the story uses an arrow).
- Hover and press in Chrome: the computed background equals the token value
  (primary `#8b0836` → `#4c0519`; outlined `#ffffff` → `#e5e7eb` → `#d1d5db`).
- Every class compiles (`scripts/figma/checkUtilities.mjs`); all stories render.

## Notes for the designer

- Layer names differ between variants (`Prefix` and `prefix`), which makes automatic
  comparison harder. Same name in every variant is better.
- `primary/hovered` and `primary/pressed` are the same colour in Graphene.
- There is no focused state in Figma; code uses a `ring-primary` focus ring.
