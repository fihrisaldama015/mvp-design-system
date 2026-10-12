# Foundation from Figma (Graphene) without the Brücke plugin

Goal: build the same `design_token.json` the designer exports today with the Tokens
Brücke plugin, but read straight from Figma, so the manual export step can go.
Tested on 2026-10-12 against swt-fe's committed Brücke export (exported 2026-09-03).

## Result

**The converter reproduces the Brücke export exactly.** Every part of Graphene that
did not change since 2026-09-03 comes out identical, token for token. All remaining
differences are real design changes made in Figma after that export.

| Part | Result vs the Brücke export of 2026-09-03 |
|---|---|
| Color (244), Border (14), Spacing (35), Breakpoints (5), Opacity (15), Sizing (40) | **Identical** |
| Effect styles (23 shadows / blurs), Color styles (0) | **Identical** |
| Typography styles (54) | **Identical** (style IDs ignored: a Figma copy gets new IDs) + 4 new |
| Typography (31) | 30 identical, 1 design change |
| .Brand (91) | 80 identical, 11 design changes |
| Annotation (4) | identical + 1 new |
| +Theme (320 → 423) | 284 identical, 19 changed, 120 new, 17 removed / renamed (design changes) |

swt-fe's own pipeline (`buildCss` + `tokenMap.js`) runs on the generated file without
errors. Comparing the CSS it produces (order ignored), the only differences are the
design changes below.

## Design changes since the last Brücke export (2026-09-03)

These are in Figma now but not in swt-fe yet:

- `Typography/line-height/lg`: 28px → **24px** (also used by text style Regular/text-xl).
- `.Brand/brand-2/*` (11 tokens): `Color.orange.*` → **`Color.amber.*`**.
- Dark mode text colours in `+Theme`: `color/text/body` and `placeholder` neutral.500 → 400,
  `invert/placeholder` 500 → 400, `caption` 400 → 300, `disabled` 600 → 500.
- `+Theme/tv page spacing/page/page-padding` and `page-gap` changed (Light and Dark).
- New in `+Theme`: `color/text/true black`, `color/text/true white`, `page spacing/Drawer Content Gap`,
  `sizing/dropdown xl`; `page spacing/Multi Form Spacing` renamed to `Multi Forms Spacing`.
- 115 new / 16 removed content strings in `+Theme/content (SWT|CMT|CTT)/...` (mock text
  for the designs: station names, roles, training types; renames such as
  `Schedule Option 1` → `Option 1`).
- New: `Annotation/Note`, text styles `Caps Header/text-base|lg|xl|2xl`.

Side finding (not caused by this work): swt-fe's committed `src/styles/tokens.css` is not
reproducible from its own `design_token.json` — the `--color-primary` line is not
produced by the generator, so it was added by hand.

## Rules the converter had to learn (Brücke's format)

- Collections are top-level keys with their real names (`+Theme`, `.Brand`); the
  southleft export slugs them (`theme`, `brand`), and aliases follow:
  `{brand.neutral.50}` → `{.Brand.neutral.50}`.
- `$value` is the default mode; `$extensions.mode` lists every mode only for
  multi-mode collections (`{}` otherwise).
- FLOAT type comes from the scope: `OPACITY` → `number` (divided by 100: 5 → 0.05),
  `FONT_WEIGHT` → `fontWeight`, anything else → `dimension` `{ value, unit: "px" }`.
- Colours are lowercase hex (`#rrggbb`, `#rrggbbaa` with alpha).
- `scopes` must be read from Figma: the export drops both `[]` and `["ALL_SCOPES"]`.
- An unbound text-style weight (`"Bold"`) becomes its number (`700`).
- `$extensions["tokens-bruecke-meta"].createdAt` is kept, so swt-fe's rollback guard
  in `syncDesignTokens.js` keeps working.

## Steps (what the skill will do)

1. Open the foundation file (a copy if you only have view access) in Figma Desktop and
   run the Desktop Bridge plugin. figma-console MCP in local mode.
2. Start the local receiver: `python3 scripts/figma/dumpServer.py 9232 <dir>`.
   The plugin may only talk to `localhost:9223-9232`; this lets it save big reads to
   disk instead of sending them through the chat.
3. `figma_export_tokens` with `format: "dtcg"`, `dtcgDialect: "legacy"`, `sizeUnit: "px"`,
   `resolveAliases: false`, `outputPath: <dir>/tokens.dtcg.json`.
4. `figma_execute` with `scripts/figma/plugin/readFoundation.js` (writes
   `collections.json`, `scopes.json`, `styles.json` to `<dir>`).
5. `node scripts/figma/toBruecke.mjs <dir> src/tokens/design_token.json`.
6. Check against the last export: `node scripts/figma/diffTokens.mjs src/tokens/design_token.json <previous.json> 50 --ignore-style-id`.

## Limits found

- The plugin only runs where you can edit, so with view-only access we read a **copy**.
  A copy is a snapshot: make a new copy when the designer publishes changes.
- Style IDs differ in a copy (new file, new IDs). Harmless for CSS; matters only if
  something looks styles up by ID.
- `figma_get_file_data` and `figma_get_design_system_kit` need a Figma REST token;
  everything above works without one.

## Step 2: CSS variables, Tailwind and the Foundations pages

`node scripts/figma/buildTokens.mjs` writes `src/tokens/tokens.css` (714 variables + 23
effects), `src/tokens/tailwind.tokens.js` and `src/tokens/tokens.index.json`;
`node scripts/figma/buildTokenDocs.mjs` writes `src/foundations/*.mdx`.

- **Always on.** Tokens live on `:root`; there is no `data-tokens` switch like in swt-fe.
  Extra modes become `[data-theme="<mode>"]` blocks (here only Dark, 147 overrides).
- **Same variable names as swt-fe** (`--color-zinc-50`, `--brand-neutral-500`,
  `--theme-color-text-body`); colours are `r g b` channels, aliases stay `var()` chains.
- **Tailwind, replaced by tokens:** colors, spacing, borderRadius, borderWidth, fontSize,
  screens, boxShadow (Graphene has every default Tailwind key, nothing is lost).
  **Extended:** opacity, blur, backdropBlur, fontWeight (Graphene has only some keys).
- **Semantic colours split per utility:** `+Theme/color/text/*` → `text-*`,
  `color/background/*` → `bg-*`, `color/border/*` → `border-*` / `ring-*` / `outline-*`.
- **Semantic numbers routed by their Figma scope:** CORNER_RADIUS → `rounded-*`,
  GAP / WIDTH_HEIGHT → spacing (`p-page-padding`, `h-component-md`, `w-modal-md`),
  STROKE_FLOAT → `border-*`.
- **Name clashes found and solved by rule:** a text colour named like another `text-*`
  utility gets `-color` (`color/text/base` → `text-base-color`, because `text-base` is a
  font size; without the rule Button's `text-base` turned white); a semantic key equal to
  a palette name keeps the palette (`text-orange` + `text-orange-500`).
- **Skipped:** TEXT_CONTENT strings (mock copy, not styling) and names marked ❌.
- **Text styles** become classes: `typo-semi-bold-text-sm`.
- **Foundations pages** write every token as literal props in the MDX, so the docs
  manifest (what AI reads through MCP) has the class, variable and Light / Dark value of
  each token. The toolbar **Theme** switch sets `data-theme` (also on docs-only pages,
  through the Storybook channel; decorators only run for stories).
- Storybook's docs CSS overrides font size and family inside tables; previews use
  `sb-unstyled` to render like the app.

Checked: Tailwind output per class (`scripts/figma/checkUtilities.mjs`), app build,
Storybook build, all 155 stories and docs pages rendered with no error, screenshots of
Colors (Light and Dark) and Typography.
