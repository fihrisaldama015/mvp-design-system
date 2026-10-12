# Video assets (for the Remotion scenes in ../video-script.md)

All files were produced from real runs on 2026-10-12 (project `shield-test-empty`, Graphene and SHIELD copies).
`terminal/*.txt` is the exact output (paths shortened); `terminal/png/` is the same text rendered as a terminal
window, for use as stills. In Remotion, rendering the `.txt` as text is sharper.

| Scene | Files |
|---|---|
| 2 pipeline | none (diagram built in Remotion) |
| 3 pieces | `terminal/01-dumpserver`, `02-loader`, `05-tokens-build` (toBruecke + buildTokens + docs), `04-listsets` |
| 4 index | `terminal/06-index-entry` (one token with its `id`), `07-figma-index`, `08-resolveids` |
| 5 foundation | `storybook/colors-light.png`, `colors-dark.png` (the Dark swatches change; the docs page background stays white, that is Storybook's own docs CSS), `typography.png`, `spacing-sizing.png`, `radius-borders.png`, `effects.png`, `overview.png`, `storybook/ui-foundations-colors.png` (full Storybook UI) |
| 6a Button | `figma/figma-button-set.png` (all 360 variants in one image), `results/button-figma-vs-storybook.png` (the comparison sheet), `storybook/ui-button-matrix.png`, `storybook/button-matrix.png`, `storybook/ui-button-filled.png`, `terminal/11-interact` (hover and press values vs the token), `terminal/10-build-and-rendercheck` |
| 6b Input | `results/input-figma-vs-storybook-statuses.png`, `results/input-figma-vs-storybook-sizes.png` (the focus image is not used) |
| 7 run in screenshots | four stills: `figma/figma-button-set.png` → `terminal/png/03-dump-folder.png` → `terminal/png/10-build-and-rendercheck.png` → `storybook/ui-button-filled.png` |
| 8 token savings | `terminal/03-dump-folder` (the files that did not go through the chat, with sizes) |
| 9 starting points | `terminal/09-initstorybook` (report on the MVP from before Storybook) |

Not captured: the Graphene variables panel in Figma (optional in scene 5); Figma's plugin API cannot screenshot the UI panels.
