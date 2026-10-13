# Alert (SHIELD → code): a component that already existed

Source: SHIELD `Alert`, node `6:13250` on the page `Alert`, 60 variants, 9 properties. Read by node ID
(`readComponents.js` `ARGS.IDS`), analysed with `analyzeComponent.mjs` and `variantClasses.mjs`.
This is the pilot for the case "the project already has the component and Figma describes it differently".

## What drives what

| Figma property | Drives | Code |
|---|---|---|
| Kind `filled / outlined / dashed / full page` | fill, stroke, which sides have a border, radius | `kind` |
| Status `default / info / success / warning / danger` | colours, default icon | `status` |
| Size `sm / md* / lg` | padding, gaps, icon 16 / 20 / 24, text styles | `size` |
| Invert (only `filled` has it) | solid ↔ pale | `invert` |
| BOOLEAN Prefix Icon + INSTANCE_SWAP | icon before the text | `prefixIcon` (element, or `false` to hide) |
| BOOLEAN Dismiss | x icon on the right | `onDismiss` (shown when given) |
| BOOLEAN Message / Description | the two text layers | `title` / `children` (shown when given) |

Variants that exist: filled 30 (5 statuses × 3 sizes × invert), outlined 15, dashed 3 (status `default` only), full page 12 (4 statuses, no `default`).

## The existing component against Figma

The repo's `Alert` was `tone × title × children × action × className`. The comparison the skill makes first:

| Group | Repo | Figma | What we did |
|---|---|---|---|
| **Mapped** (same idea, different name) | `tone` `info / success / warning / danger` | `Status` `default / info / success / warning / danger` | renamed to `status`; `default` added; default value changed from `info` to `default` |
| **Mapped** (look) | one look: pale fill, border, dark text | `Kind` | the old look is `kind="outlined"`; Figma's default kind is `filled` |
| **Mapped** (parts) | `title` bold, `children` | `Message` (medium) and `Description` layers | names kept (Figma has no text properties for them); weight is now `typo-medium-*` |
| **Only in Figma** | none | `size`, `invert`, `kind` dashed / full page, Prefix Icon swap, Dismiss | added as props |
| **Only in code** | `action` (slot on the right), `className` | none | kept, documented as "not in Figma" |
| **Behaviour** | icon chosen by tone | icon chosen by status, 5 icons | same idea; `default` uses a star |

Callers of the shared `Alert` outside its own stories: **0** (the pages still draw their alert boxes with plain Tailwind).
Decision by the rule in `reference/existing-component.md`: few callers → **A, change the API in place**. No `AlertV2`, no
compatibility alias (there is nothing to keep compatible with).

### Migration table (old → new)

| Old | New |
|---|---|
| `<Alert tone="info">` | `<Alert kind="outlined" status="info">` (same look) or `<Alert status="info">` (Figma's default look, solid) |
| `tone="success"` / `"warning"` / `"danger"` | `status="success"` / `"warning"` / `"danger"` (+ `kind="outlined"` for the old look) |
| no `tone` (was `info`) | `status="info"`: the default is now `default` (neutral) |
| `action={...}` | unchanged |
| the icon (automatic) | unchanged; `prefixIcon={false}` hides it |

## Colours (Light; Dark follows the tokens)

| Kind | Fill | Border | Message + icon | Description + dismiss |
|---|---|---|---|---|
| filled, default | `bg-default-default` | none | `text-default` | `text-default` |
| filled, info / success / danger | `bg-<status>-default` | none | `text-base-color` | `text-base-color` |
| filled, warning | `bg-warning-default` | none | `text-default` | `text-default` |
| filled + invert, default | `bg-default-invert-default` | none | `text-base-color` | `text-base-color` |
| filled + invert, others | `bg-<status>-invert-default` | none | `text-default` | `text-default` |
| outlined | default: `bg-default-default`; others `bg-<status>-invert-default` | `border border-<status>` (default: `border-default`) | `text-<status>` (default: `text-default`) | `text-default` |
| dashed, full page | as outlined | `border-b` only | as outlined | as outlined |

Sizes: sm `py-3 px-3 gap-2.5`, md `py-3.5 px-3.5 gap-3`, lg `py-4 px-4 gap-3.5`; icon 16 / 20 / 24.

## Checks

- Figma vs Storybook, all 15 kind × status combinations at md (`docs/shield/img/alert-figma-vs-storybook.png`):
  fills, borders (including the bottom-only ones), radius, icons and text styles match.
- Computed colours in the browser equal the tokens: filled info `rgb(29, 78, 216)`, outlined warning border `rgb(161, 98, 7)`,
  inverted success `rgb(220, 252, 231)` with title `rgb(3, 7, 18)`, full-page danger border `rgb(185, 28, 28)` and radius 0.
- Every class passes `checkUtilities.mjs`; `renderCheck.sh`: 181 pages, 0 errors.
- Not checked: sizes sm and lg and Invert against Figma images, Dark mode.

## Notes for the designer

- `dashed` is not dashed: the set has a **bottom border only** (1px) with the radius; `full page` is the same without the radius.
- `dashed` exists only for status `default`, `full page` only for the other four. In code the missing combinations reuse the nearest variant.
- Status `default` has a smaller description and a tighter gap than the other statuses at md and lg (xs vs sm at md). Kept as drawn.
- `Invert` exists only for `filled`, and means opposite things: for `default` it turns pale into dark, for the others solid into pale.
- Message and Description are plain layers without TEXT properties.
- The dismiss icon is bare (no button states). `IconButton` in the repo is not synced yet, so the dismiss is drawn inside Alert as a plain button.
