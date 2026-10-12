/**
 * Runs the Storybook CLI with NODE_PATH set to src/, e.g.
 * `node .storybook/run.mjs build -o storybook-static`.
 *
 * Why: the components manifest (what AI agents read through the Storybook MCP
 * server) uses plain Node module resolution, not rsbuild's aliases. With
 * src/ on NODE_PATH, `components/...` and `utils/...` imports resolve, so each
 * component gets its props and description, and the manifest keeps the
 * imports as the app writes them (`from "components/button"`). NODE_PATH is
 * only read when Node starts, so it has to be set for a new process.
 */
/* global process */
import { spawn } from "node:child_process";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const storybookPkg = require.resolve("storybook/package.json");
const cli = path.join(path.dirname(storybookPkg), require(storybookPkg).bin);

const nodePath = [path.join(root, "src"), process.env.NODE_PATH].filter(Boolean).join(path.delimiter);

const child = spawn(process.execPath, [cli, ...process.argv.slice(2)], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, NODE_PATH: nodePath },
});
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
