# Phase 3 — Storybook for a project that has none (React + Tailwind 3 + rsbuild)

Templates are in `templates/storybook/`; adapt the framework line for Vite
(`@storybook/react-vite`) when the project does not use rsbuild.

1. Install (exact versions that worked): `storybook@^10.6`, `storybook-react-rsbuild@^3.6`,
   `@storybook/addon-docs`, `@storybook/addon-a11y`, `@storybook/addon-mcp`, `remark-gfm`,
   `prop-types`, `clsx`, `tailwind-merge@^2` (v3 needs Tailwind 4).
2. `.storybook/run.mjs` (sets `NODE_PATH=src` so react-docgen resolves `components/...`
   imports — without it the AI manifest has no props). Scripts:
   `"storybook": "node .storybook/run.mjs dev -p 6006 --no-open"`,
   `"build-storybook": "node .storybook/run.mjs build -o storybook-static"`,
   `"tokens:build": "node scripts/figma/toBruecke.mjs .figma-dump src/tokens/design_token.json && node scripts/figma/buildTokens.mjs && node scripts/figma/buildTokenDocs.mjs"`.
3. `.storybook/main.mjs`: stories `../src/**/*.mdx` + `*.stories.js`, addons docs (with
   `remarkPlugins: [remarkGfm]` for Markdown tables), a11y, mcp;
   `features: { componentsManifest: true }`.
4. `.storybook/preview.js`: import `../src/index.css`; Theme toolbar (`globalTypes.theme`)
   applied in a decorator **and** through the channel (`setGlobals` / `globalsUpdated`) for
   docs-only pages; `storySort` with `Guide`, `Foundations`, then component groups.
5. `.mcp.json`: `{ "mcpServers": { "storybook": { "type": "http", "url": "http://localhost:6006/mcp" } } }`.
6. `src/foundations/TokenBlocks.js` from `templates/` (previews use `sb-unstyled`).
7. `.gitignore`: `storybook-static/`, `.figma-dump/`.
8. Project `CLAUDE.md`: read Storybook first (MCP `docs-list` / `docs-show`), tokens are
   generated (never edit `src/tokens/*` or `src/foundations/*.mdx`), semantic classes first.

Story conventions: render the real component (no wrapper), state via `useArgs()`, handlers
via `fn()`, slots as JSX args, overlays with `parameters.docs.story = { inline: false, iframeHeight }`,
no `={undefined}` args (they print into "Show code" and the manifest).

Serve a static build with a server that keeps `iframe.html?id=` queries
(`python3 -m http.server`, or `serve` with `cleanUrls: false`); Vercel works as is.
