# Changelog: components synced from SHIELD

One entry per component synced from Figma into the code: what the API was, what it is now, how to migrate, and how many
callers were touched. Newest first. The method is `.claude/skills/building-storybook-from-figma/reference/existing-component.md`.

## 2026-10-13 · Alert (existing component, callers 0)

Figma: `Alert`, node `6:13250`, 60 variants. Details and checks: `docs/shield/alert.md`.

- **Breaking, no callers affected** (the shared `Alert` had none outside its stories): `tone` → `status` (adds `default`, and the
  default moved from `info` to `default`); the old look is now `kind="outlined"`.
- **Added from Figma:** `kind` (`filled`, `outlined`, `dashed`, `full page`), `size` (`sm`, `md`, `lg`), `invert`, `prefixIcon`
  (element or `false`), `onDismiss`.
- **Kept, not in Figma:** `action`, `className`; `title` / `children` keep their names for the Message and Description layers.
- **Decision:** A (changed in place). No `AlertV2`, no compatibility alias: nothing to stay compatible with.
- **Skill fixes found by this case:** per-side stroke weights were lost (`dashed` and `full page` are bottom-border only);
  `exportVariants.js` takes a node ID (15 exports in 0.9 s; the by-name call timed out and blocked the plugin); `interact.mjs --size`.

## 2026-10-12 · Button (existing component, retro from the pilot, 14 call sites in 12 files)

Figma: SHIELD `Button`, 360 variants. Commit `2a5015d`.

- **Breaking, callers updated in the same commit:**

| Old | New |
|---|---|
| `variant="primary"` | `kind="filled" status="primary"` |
| `variant="secondary"` | `kind="outlined"` (status `default`) |
| `variant="danger"` | `kind="filled" status="danger"` |
| `variant="ghost"` | `kind="text"` |
| `leftIcon` / `rightIcon` | `prefixIcon` / `suffixIcon` |
| `<Button>` with no variant (was primary) | `<Button status="primary">`: **the default status is now neutral** |

- **Added from Figma:** `status` `info`, `success`, `warning`; `kind` `dashed`; `size` options match; `loading` and `disabled` kept.
- **Decision:** A (changed in place); the callers were updated in the same commit (the rule "an API change updates every caller").
  At the time there was no written procedure; `existing-component.md` is that procedure, written afterwards.
