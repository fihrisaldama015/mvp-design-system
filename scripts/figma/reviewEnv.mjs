// How a project hands the review page's two settings (service URL, project key) to its bundle, and a check that the values it has reach the page.
// The dashboard hands out PUBLIC_REVIEW_*; a project may read them under another name (SWT: process.env.REACT_APP_*, defined one by one in
// rsbuild.config.js). Used by install.mjs (writes review.config.js the way the project reads settings) and doctor.mjs (says why the page is
// "not set up"). Only variable NAMES are read or printed, never a value.
import fs from "node:fs";
import path from "node:path";

export const SETTINGS = [
  { pub: "PUBLIC_REVIEW_SERVICE_URL", legacy: "REACT_APP_REVIEW_SERVICE_URL" },
  { pub: "PUBLIC_REVIEW_PROJECT", legacy: "REACT_APP_REVIEW_PROJECT" },
];
const BUNDLERS = ["rsbuild.config.js", "rsbuild.config.mjs", "rsbuild.config.ts", "vite.config.js", "vite.config.mjs", "vite.config.ts", "webpack.config.js"];

const read = (f) => { try { return fs.readFileSync(f, "utf8"); } catch { return ""; } };

/** The text of the project's bundler config files (empty when there is none). */
export const bundlerText = (dir) => BUNDLERS.map((f) => read(path.join(dir, f))).join("\n");

/** "react-app-define": the bundler defines process.env.REACT_APP_* one by one (SWT). Otherwise "public": import.meta.env.PUBLIC_*. */
export const envConvention = (dir) => (/["']process\.env\.REACT_APP_/.test(bundlerText(dir)) ? "react-app-define" : "public");

/** The template's import.meta.env.PUBLIC_REVIEW_* reads, rewritten to the project's convention. */
export function forConvention(templateText, convention) {
  if (convention !== "react-app-define") return templateText;
  let out = templateText;
  for (const s of SETTINGS) out = out.split(`import.meta.env.${s.pub}`).join(`process.env.${s.legacy}`);
  return out;
}

/** The review settings a config file reads (process.env.X or import.meta.env.X), in order of appearance. */
export function namesRead(configText) {
  const names = [];
  for (const m of configText.matchAll(/(?:process\.env|import\.meta\.env)\.([A-Z0-9_]+)/g)) {
    if (SETTINGS.some((s) => s.pub === m[1] || s.legacy === m[1]) && !names.includes(m[1])) names.push(m[1]);
  }
  return names;
}

/** Names of the variables that have a value in the project's .env files (not the .example one) and in the process environment. */
export function envKeys(dir, processEnv = process.env) {
  const keys = new Set();
  let files = [];
  try { files = fs.readdirSync(dir).filter((f) => /^\.env(\..+)?$/.test(f) && !/example|sample|template/i.test(f)); } catch { /* no folder */ }
  for (const f of files) {
    for (const line of read(path.join(dir, f)).split("\n")) {
      const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
      if (m && m[2].trim() !== "" && !/^\s*#/.test(line)) keys.add(m[1]);
    }
  }
  for (const [k, v] of Object.entries(processEnv || {})) if (v) keys.add(k);
  return keys;
}

/**
 * Why the review page might not get its settings. Returns [{ found, fix }], empty when all is well.
 *   configText  the project's src/review-kit/review.config.js
 *   keys        envKeys(...)
 *   bundler     bundlerText(...)  (empty: the define check is skipped; create-react-app exposes REACT_APP_* itself)
 */
export function diagnose({ configText, keys, bundler }) {
  const problems = [];
  for (const name of namesRead(configText)) {
    const s = SETTINGS.find((x) => x.pub === name || x.legacy === name);
    const alt = name === s.pub ? s.legacy : s.pub;
    const viaProcess = name === s.legacy && new RegExp(`process\\.env\\.${name}\\b`).test(configText);
    const mapped = new RegExp(`process\\.env\\.${alt}\\b`).test(bundler); // the bundler falls back to the other name
    if (keys.has(name)) {
      if (viaProcess && bundler && !new RegExp(`["']process\\.env\\.${name}["']`).test(bundler)) {
        problems.push({
          found: `${name} is set but not defined in the bundler config, so the app will not see it`,
          fix: `Add "process.env.${name}": JSON.stringify(process.env.${name} || "") to the define of the bundler config (rsbuild: source.define)`,
        });
      }
      continue;
    }
    if (keys.has(alt) && !(viaProcess && mapped)) {
      problems.push({
        found: `The review page reads ${name}, but the project's env has ${alt}`,
        fix: viaProcess
          ? `Let the bundler read both: "process.env.${name}": JSON.stringify(process.env.${name} || process.env.${alt} || "") in its define, or rename the variable`
          : `Rename ${alt} to ${name}, or read ${alt} in review.config.js`,
      });
      continue;
    }
    if (!keys.has(alt)) {
      problems.push({
        found: `${name} is not set`,
        fix: `Copy the page settings from the project's Connect page in the review dashboard into .env.local or .env (step 4)`,
      });
    }
  }
  return problems;
}
