# Phase 1 — Foundation (tokens → CSS → Tailwind → Foundations pages)

Target format: **Tokens Brücke DTCG** (`design_token.json`), so projects already fed by
a Brücke export (e.g. swt-fe's `scripts/syncDesignTokens.js`) keep working.

## Steps

1. Open the foundation file (copy) in Figma Desktop, plugin running; `figma_navigate(url, lock: true)`.
2. `figma_export_tokens` → `format: "dtcg"`, `dtcgDialect: "legacy"`, `sizeUnit: "px"`,
   `resolveAliases: false`, `strategy: "replace"`, `outputPath: ".figma-dump/tokens.dtcg.json"`.
3. `figma_execute` with `scripts/figma/plugin/readFoundation.js` (writes
   `collections.json`, `scopes.json`, `styles.json` to `.figma-dump/`).
4. `npm run tokens:build`, i.e.
   `node scripts/figma/toBruecke.mjs .figma-dump src/tokens/design_token.json`
   `&& node scripts/figma/buildTokens.mjs && node scripts/figma/buildTokenDocs.mjs`.
5. Prove it:
   - Against the last Brücke export (if any):
     `node scripts/figma/diffTokens.mjs src/tokens/design_token.json <old.json> 50 --ignore-style-id`.
     Unchanged collections must say IDENTICAL; every other line must be a real design change.
   - Classes: `node scripts/figma/checkUtilities.mjs "bg-primary-default text-body rounded-default h-component-md typo-semi-bold-text-sm"`.
   - `npm run build-storybook && bash scripts/figma/renderCheck.sh`, then look at the
     Foundations pages in Light and Dark (toolbar Theme).

## Outputs

| File | Content |
|---|---|
| `src/tokens/design_token.json` | Brücke-shaped tokens + styles; `$extensions["tokens-bruecke-meta"].createdAt` kept |
| `src/tokens/tokens.css` | Always-on variables on `:root`; extra modes in `[data-theme="<mode>"]` |
| `src/tokens/tailwind.tokens.js` | Tailwind theme + text-style plugin (`typo-*` classes) |
| `src/tokens/tokens.index.json` | Token → CSS var → classes → value per mode |
| `src/foundations/*.mdx` | Foundations pages with literal data (AI-readable via the docs manifest) |

`tailwind.config.js`: spread `tokens.theme` (replace colors, spacing, borderRadius,
borderWidth, fontSize, screens, boxShadow + `none`), put opacity / blur / backdropBlur /
fontWeight and `tokens.extend` under `extend`, `plugins: tokens.plugins`,
`darkMode: ["selector", '[data-theme="dark"]']`. `index.css` imports the font and
`./tokens/tokens.css`; body uses the semantic background and text colour.

## Brücke format rules (all verified against a real export)

- Top-level keys are the real collection names (`+Theme`, `.Brand`); the southleft export
  slugs them — map back through `collections.json`. Aliases: `{.Brand.neutral.50}`.
- `$value` = default mode; `$extensions.mode` = every mode, only for multi-mode collections.
- FLOAT type from scope: OPACITY → `number` (÷100), FONT_WEIGHT → `fontWeight`, else `dimension` `{value, unit:"px"}`.
- Lowercase hex, `#rrggbbaa` with alpha. Unbound text-style weight name → number (Bold → 700).
- Key order per token: `$type, $value, $description, scopes, $extensions`; variable order = Figma's.

## Tailwind mapping rules (`buildTokens.mjs`)

- Variable name = `--` + slug(collection.path): `--color-zinc-50`, `--brand-neutral-500`, `--theme-color-text-body`.
- Colours are `r g b` channels → `rgb(var(--x) / <alpha-value>)`; alias chains stay `var()`.
- Semantic colours split per utility: `color/text/*` → `text-*`, `color/background/*` → `bg-*`,
  `color/border/*` → `border-*` (+ `ring-*`, `outline-*`).
- Semantic numbers routed by **Figma scope**: CORNER_RADIUS → `rounded-*`, GAP/WIDTH_HEIGHT → spacing
  (`p-page-padding`, `h-component-md`, `w-modal-md`), STROKE_FLOAT → `border-*`.
- Clashes: text colour named like a `text-*` utility → `-color`; semantic key = palette name → palette keeps its shades, semantic becomes `DEFAULT`.
- Skipped: TEXT_CONTENT strings (mock copy) and names containing ❌ (deprecated).
- Collection roles and naming groups live in `figma-tokens.config.json`; edit that, not the scripts.
