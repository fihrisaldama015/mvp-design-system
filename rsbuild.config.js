import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

// Same shape as swt-fe: bare imports such as "components/..." and "data/..."
// resolve to src/, so the project can later get the same Storybook setup.
export default defineConfig({
  plugins: [pluginReact({ swcReactOptions: { runtime: "automatic" } })],
  source: { entry: { index: "./src/index.js" } },
  resolve: {
    alias: {
      components: "./src/components",
      pages: "./src/pages",
      data: "./src/data",
      utils: "./src/utils",
    },
  },
  html: { title: "Equipment Loan Tracker" },
  output: { distPath: { root: "build" } },
  // /api/review: the sync-review API. On Vercel it is api/review.mjs; locally `npm run review:api` serves it.
  server: { port: 5002, proxy: { "/api/review": "http://127.0.0.1:9233" } },
});
