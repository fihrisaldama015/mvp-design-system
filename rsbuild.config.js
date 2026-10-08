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
  server: { port: 5002 },
});
