# Pilot 2: Input (SHIELD → code)

Source: SHIELD "Input" component set — 84 variants (State 6 × Size 3 × Status 5, plus
Disabled and Read-only, each only in `State=default, Status=default`). Read with
`scripts/figma/plugin/readComponents.js` (with a deeper depth limit, see "Notes for the
skill"), analysed with `analyzeComponent.mjs` and `variantClasses.mjs`.

## What drives what

| Figma property | Drives | Code |
|---|---|---|
| Size `sm / md* / lg` | box height, padding, gap, radius; value / placeholder text style; label and caption text style; info icon size; gap label–box–caption | `size` prop (table below) |
| Status `default / info / success / warning / danger` | box border in every state, focus ring colour; caption red only for `danger` | `status` prop (`error` = shortcut for `danger`) |
| State `hovered` | border → `border/primary` (status default only); placeholder → `text/body` | `group-hover/control:` classes |
| State `pressed` (caret shown) | 3px outside ring `background/<status>/invert/focused`, 1px gap `border/base`, border → primary | `group-focus-within/control:` (it is the focus state, not `:active`) |
| State `filled*` | value shown instead of placeholder, clear (x) icon shown | the input has a value; `clearable` shows the x |
| Disabled | box `bg-disabled border-disabled`; label `text/placeholder`; asterisk and info icon hidden | `disabled` prop |
| Read-only | box `bg-disabled`, border `border/invert/default`, value shown, no clear icon | `readOnly` prop |
| BOOLEAN Label / Label Elements / Required / Info Icon | label row parts | `label`, `required`, `info` (tooltip text) |
| BOOLEAN Caption + TEXT Caption Text | caption under the box | `caption` |
| BOOLEAN Prefix Icon / Suffix Icon | icons (no INSTANCE_SWAP property in Figma: always "Icon / plus") | `prefixIcon`, `suffixIcon` (lucide element, sized 22px) |
| BOOLEAN Clearable Icon | x button in filled states | `clearable`, `onClear` |
| TEXT Placeholder Text / Value Text | | `placeholder`, `value` / `defaultValue` |

## Size table

| Size | Box | Text | Label | Info icon | Caption | Gap label–box–caption |
|---|---|---|---|---|---|---|
| sm | `h-component-sm px-3 gap-2 rounded-form-sm` | `typo-regular-text-sm` | `typo-medium-text-xs` | 12px | `typo-regular-text-xs` | `gap-0.5` |
| md | `h-component-md px-3 gap-2.5 rounded-form-md` | `typo-regular-text-sm` | `typo-medium-text-sm` | 16px | `typo-regular-text-xs` | `gap-1` |
| lg | `h-component-lg px-4 gap-3 rounded-form-lg` | `typo-regular-text-base` | `typo-medium-text-base` | 16px | `typo-regular-text-sm` | `gap-1.5` |

Prefix, suffix and clear icons are 22px (`text-caption`) in every size. Figma's vertical
padding (`space-2 / 2-5 / 3`) is left out: the height token fixes the box and, for lg,
12 + 24 + 12 = 48px would not fit in 44px.

## Colours (all Graphene semantic tokens)

| | Default | Hover | Focus | Disabled | Read-only |
|---|---|---|---|---|---|
| Box fill | `bg-surface` | same | same | `bg-disabled` | `bg-disabled` |
| Border, status default | `border-invert-default` | `border-primary` | `border-primary` | `border-disabled` | `border-invert-default` |
| Border, status `s` | `border-s` | same | same | – | – |
| Focus ring | – | – | `bg-<s|primary>-invert-focused` 3px + `border-base` 1px gap | – | (kept for keyboard users) |
| Placeholder | `text-placeholder` | `text-body` | `text-placeholder` | `text-placeholder` | – |
| Value | `text-default` | | | | `text-default` |
| Label / asterisk / info | `text-default` / `text-danger` / `text-caption` | | | `text-placeholder`, no asterisk, no icon | as default |
| Caption | `text-caption`; `text-danger` for status danger | | | | |

The focus ring is two absolutely placed spans behind the box (`-inset-1` with the
invert/focused background, `-inset-px` with a `border-base` border), because the Figma
stroke is bound to a **background** variable and ring / outline classes only reuse the
border set: `ring-primary-invert-focused` does not exist.

## Input and Field

`Field` (label / hint / error around any control) stays. Decision:

- `Input` carries its own `label`, `required`, `info`, `caption` (the SHIELD component
  has them) and is used bare inside a Field. Inside a Field it takes the Field's `id`,
  error state (→ `status="danger"`) and caption id (`aria-describedby`).
- Label and caption are shared parts (`components/field/parts.js`: `FieldLabel`,
  `FieldCaption`, `FIELD_GAP`). `Field` now uses them at md size, so
  `<Field label error><Input /></Field>` looks the same as
  `<Input label caption status="danger" />`, and Textarea / Select / DatePicker in a
  Field get the SHIELD label too.
- Old API kept: `error` (bool), `type`, `placeholder`, `disabled`, `className`, `id`,
  ref to the native input. `className` now lands on the outer element (layout only).

## Checked

- Figma export vs Storybook, same scale: `img/input-figma-vs-storybook-statuses.png`
  (5 statuses × empty / filled), `img/input-figma-vs-storybook-sizes.png` (sm / md / lg,
  disabled, read-only), `img/input-figma-vs-storybook-focus.png` (pressed vs focused).
  Heights, borders, radius, text styles, colours, icons, caption colour match.
- Hover and focus in Chrome (CDP): border `#e5e7eb` → `#8b0836` (= `border/primary`);
  focus ring `rgb(255,228,230)` (= `background/primary/invert/focused`), gap `#ffffff`
  (= `border/base`). Clear button empties a controlled input, fires `onChange`, keeps focus.
- Every class compiles (`checkUtilities.mjs`); `renderCheck.sh`: 170 stories / docs, 0 errors;
  the manifest lists all Input props.

## Notes for the designer

- Disabled hides the whole "Label Elements" frame and uses a separate "Label" frame
  instead (different layer names between variants).
- Inconsistencies: `pressed / sm / info|success|warning|danger` has padding 8 / 8
  instead of 8 / 12; `pressed / lg / info` White Space radius is `radius-form/md`;
  `pressed / lg` root gap is `space-1` instead of `space-1-5`; `hovered` Caption gap is 10.
- Hidden layers carry different text styles than the visible ones (e.g. lg hidden
  Value is text-sm), which makes automatic analysis noisy.
- `text/body` and `text/placeholder` are the same colour in Light, so the hover
  placeholder change is invisible there.
- Prefix / Suffix icons have no instance-swap property (always "Icon / plus").
- No focused state for Read-only, no Disabled / Read-only for the other statuses.
- No value colour for Disabled (no disabled variant shows a value): code keeps
  `text-default`, as on the hidden Value layer.
- Outside strokes make the Figma ring corners rounder than the box; code uses the same
  `radius-form` token on the ring.
