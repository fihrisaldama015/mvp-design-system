# Phase 3 — Storybook for a project that has none

Run from the **project root**, with the skill's script (it reads the templates next to it):

```bash
node <skill>/scripts/initStorybook.mjs          # report: stack found, files it would write
node <skill>/scripts/initStorybook.mjs --write  # write the missing files, print the npm command
```

It detects bundler, React, Tailwind and router, **stops** on a case it does not cover
(existing `.storybook/`, Next.js, React < 18) and notes Tailwind 4 / none. It never
overwrites a file and never runs npm: run the `npm i` lines it prints.

| Found | Storybook framework | Router decorator |
|---|---|---|
| `@rsbuild/core` | `storybook-react-rsbuild@^3.6` (uses the project's `rsbuild.config.js`) | only if `react-router-dom` is installed |
| `vite` | `@storybook/react-vite` | same |
| `react-scripts` / `webpack` | `@storybook/react-webpack5` | same |

What it writes (and what each is for):

- `.storybook/run.mjs`: runs the Storybook CLI with `NODE_PATH=src`, so react-docgen resolves
  `components/...` imports. Without it the AI manifest has no props. Scripts:
  `storybook` → `node .storybook/run.mjs dev -p 6006 --no-open`, `build-storybook` → `... build -o storybook-static`,
  `tokens:build` → `toBruecke` + `buildTokens` + `buildTokenDocs` (see `foundation.md`).
- `.storybook/main.mjs`: stories `../src/**/*.mdx` + `*.stories.js`; addons docs (with
  `remarkPlugins: [remarkGfm]` for Markdown tables), a11y, mcp; `features: { componentsManifest: true }`.
- `.storybook/preview.js`: imports `../src/index.css`; Theme toolbar applied in a decorator **and**
  through the channel (`setGlobals` / `globalsUpdated`) for docs-only pages; `storySort`.
- `.mcp.json` → `http://localhost:6006/mcp`; `src/foundations/TokenBlocks.js` (previews use `sb-unstyled`);
  `.gitignore` lines `storybook-static/`, `.figma-dump/`.

Then: **the project's own `src/index.css` must import `./tokens/tokens.css` and its
`tailwind.config.js` must use the generated theme** (`foundation.md`). Merge into what exists.

Install versions that worked: `storybook@^10.6`, `storybook-react-rsbuild@^3.6`,
`@storybook/addon-docs`, `@storybook/addon-a11y`, `@storybook/addon-mcp`, `remark-gfm`,
`prop-types`, `clsx`, `tailwind-merge@^2` (v3 needs Tailwind 4).

Project `CLAUDE.md`: read Storybook first (MCP `docs-list` / `docs-show`), tokens are
generated (never edit `src/tokens/*` or `src/foundations/*.mdx`), semantic classes first.

Story conventions: render the real component (no wrapper), state via `useArgs()`, handlers
via `fn()`, slots as JSX args, overlays with `parameters.docs.story = { inline: false, iframeHeight }`,
no `={undefined}` args (they print into "Show code" and the manifest).

Serve a static build with a server that keeps `iframe.html?id=` queries
(`python3 -m http.server`, or `serve` with `cleanUrls: false`); Vercel works as is.
