# Phase 1 — Foundation (tokens → CSS → Tailwind → Foundations pages)

Target format: **Tokens Brücke DTCG** (`design_token.json`), so projects already fed by
a Brücke export (e.g. swt-fe's `scripts/syncDesignTokens.js`) keep working.

## Steps

1. Open the foundation file (copy) in Figma Desktop, plugin running; `figma_navigate(url, lock: true)`.
2. `figma_export_tokens` → `format: "dtcg"`, `dtcgDialect: "legacy"`, `sizeUnit: "px"`,
   `resolveAliases: false`, `strategy: "replace"`, `outputPath: ".figma-dump/tokens.dtcg.json"`.
3. Run `readFoundation.js` through the loader (SKILL.md; writes `collections.json`,
   `scopes.json`, `styles.json` to `.figma-dump/`), then `node scripts/figma/checkConfig.mjs`:
   every role in `figma-tokens.config.json` must say `ok`. Fix the config, not Figma.
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

### Wire the tokens into the project

New project: `templates/starter/` already has both files. **Existing project: merge, do not
overwrite** (keep its `content`, plugins, other theme keys).

`tailwind.config.js`:

```js
import tokens from "./src/tokens/tailwind.tokens.js";
const { fontWeight, opacity, blur, backdropBlur, ...replaced } = tokens.theme;
export default {
  content: ["./src/**/*.{js,jsx,mdx}"],            // add mdx: the Foundations pages use classes
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    ...replaced,                                    // replaces colors, spacing, borderRadius, borderWidth, fontSize, screens, boxShadow, fontFamily
    boxShadow: { ...replaced.boxShadow, none: "none" },
    extend: { ...tokens.extend, fontWeight, opacity, blur, backdropBlur },
  },
  plugins: tokens.plugins,                          // the typo-* text styles
};
```

`src/index.css`: `@import "./tokens/tokens.css";` before the `@tailwind` lines, the font
import, and `body { @apply bg-surface text-body; font-family: var(--typography-font-family-default), sans-serif; }`.
An existing project with plain Tailwind classes: the swap replaces `theme.colors`, so check what the
app uses still exists (Graphene keeps the whole Tailwind palette, so usually nothing is lost):

```bash
grep -rohE "\b(bg|text|border|ring|divide|from|to|fill|stroke|placeholder|outline)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)(-[0-9]+)?\b" src --include='*.js' | sort -u > .figma-dump/used.txt
node scripts/figma/checkUtilities.mjs "$(tr '\n' ' ' < .figma-dump/used.txt)" | grep -c '^MISS'   # 0 = nothing lost
```

Then `npm run build` and compare one page before and after: the look stays, but the font becomes
the token font and line heights follow the token font sizes (a few px shift).
