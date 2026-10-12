import path from "node:path";
import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

export default defineConfig({
  plugins: [pluginReact()],
  resolve: { alias: { components: path.resolve("src/components"), utils: path.resolve("src/utils") } },
});
