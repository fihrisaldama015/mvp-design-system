import { mergeRsbuildConfig } from "@rsbuild/core";
import remarkGfm from "remark-gfm";

// Storybook for the shared UI components (src/components). It uses the
// Rsbuild builder, so it loads the app's own rsbuild.config.js: the same
// aliases (components/, utils/, ...), the same SWC / React setup and the same
// Tailwind config, with no second bundler config to keep in sync.
const config = {
  framework: "storybook-react-rsbuild",
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx)"],
  addons: [
    // remark-gfm: lets the Guide MDX pages use Markdown tables.
    { name: "@storybook/addon-docs", options: { mdxPluginOptions: { mdxCompileOptions: { remarkPlugins: [remarkGfm] } } } },
    "@storybook/addon-a11y",
    // MCP server for AI agents, served by the dev server at /mcp (npm run storybook).
    "@storybook/addon-mcp",
  ],
  // Components manifest: the machine-readable component docs (description,
  // props, import, story code) that AI agents read through the Storybook MCP
  // server. Served at /manifests/components.json and /manifests/docs.json.
  // Props, descriptions and imports need src/ on NODE_PATH, which the npm
  // scripts set through .storybook/run.mjs (a plain `storybook build` leaves
  // every component without props).
  features: { componentsManifest: true },
  rsbuildFinal: (rsbuildConfig) =>
    mergeRsbuildConfig(rsbuildConfig, {
      server: { open: false },
    }),
};

export default config;
