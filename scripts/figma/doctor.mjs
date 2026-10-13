// Checks that this machine can run the Figma -> Storybook skill, and says how to fix what is missing.
// Every line is: status (OK / WARN / FAIL), what was found, and the fix for THIS operating system.
// Written to be read by a person or by the Claude Code session running on that machine, which can
// run the fix itself (ask the user first before installing anything).
// Usage: node scripts/figma/doctor.mjs [--port 9232] [--json]
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { findChrome, chromeHelp } from "./findChrome.mjs";

const args = process.argv.slice(2);
const PORT = args.includes("--port") ? args[args.indexOf("--port") + 1] : "9232";
const P = process.platform;
const OS = { linux: "Linux", darwin: "macOS", win32: "Windows" }[P] ?? P;
const pick = (o) => o[P] ?? o.linux;
const run = (cmd, a = []) => { const r = spawnSync(cmd, a, { encoding: "utf8", shell: P === "win32", timeout: 15000 }); return r.status === 0 ? (r.stdout || r.stderr).trim() : null; };
const results = [];
const add = (id, status, found, fix = "") => results.push({ id, status, found, fix });

// Node
const major = Number(process.versions.node.split(".")[0]);
major >= 18 ? add("node", "OK", `Node ${process.versions.node}`) : add("node", "FAIL", `Node ${process.versions.node} is too old`, pick({ win32: "winget install OpenJS.NodeJS.LTS", darwin: "brew install node", linux: "Install Node 18+ (nvm, or your package manager)" }));

// git, npm
run("git", ["--version"]) ? add("git", "OK", run("git", ["--version"])) : add("git", "FAIL", "git not found", pick({ win32: "winget install Git.Git", darwin: "xcode-select --install", linux: "sudo apt install git" }));
run("npm", ["--version"]) ? add("npm", "OK", `npm ${run("npm", ["--version"])}`) : add("npm", "FAIL", "npm not found (comes with Node)", "Reinstall Node and reopen the terminal.");

// Python: only for dumpServer.py and compareSheet.py
const py = ["python3", "python", "py"].find((c) => run(c, ["--version"])?.startsWith("Python 3"));
py ? add("python", "OK", `${run(py, ["--version"])} (command: ${py})`, py === "python3" ? "" : `Use "${py}" where the docs say python3.`)
   : add("python", "FAIL", "Python 3 not found; dumpServer.py needs it", pick({ win32: "winget install Python.Python.3.12, then reopen the terminal (the command is then python or py)", darwin: "brew install python", linux: "sudo apt install python3" }));
if (py) run(py, ["-c", "import PIL"]) !== null ? add("pillow", "OK", "Pillow (PIL) is installed") : add("pillow", "WARN", "Pillow missing; only compareSheet.py (side-by-side images) needs it", `${py} -m pip install pillow`);

// Chrome
const chrome = findChrome();
chrome ? add("chrome", "OK", chrome) : add("chrome", "FAIL", "No Chrome / Chromium / Edge found (interact.mjs and renderCheck need one)", chromeHelp());

// bash: renderCheck.sh
if (P === "win32") run("bash", ["--version"]) ? add("bash", "OK", "bash found") : add("bash", "WARN", "No bash; renderCheck.sh needs Git Bash or WSL", "Install Git for Windows (it brings Git Bash) and run: bash scripts/figma/renderCheck.sh");

// Receiver
try {
  const r = await fetch(`http://127.0.0.1:${PORT}/ping`, { signal: AbortSignal.timeout(2000) });
  add("receiver", "OK", `dumpServer is running on ${PORT}, writing to ${(await r.json()).dir}`);
} catch {
  const free = run(...(P === "win32" ? ["netstat", ["-ano"]] : ["lsof", ["-ti", `:${PORT}`]]));
  const busy = P === "win32" ? new RegExp(`:${PORT}\\s`).test(free ?? "") : Boolean(free);
  busy ? add("receiver", "FAIL", `Port ${PORT} is in use by something that is not dumpServer`, pick({ win32: `netstat -ano | findstr :${PORT}   then   taskkill /PID <pid> /F`, darwin: `kill $(lsof -ti :${PORT})`, linux: `kill $(lsof -ti :${PORT})` }))
       : add("receiver", "WARN", `dumpServer is not running on ${PORT}`, `${py ?? "python3"} scripts/figma/dumpServer.py ${PORT} .figma-dump   (keep it running)`);
}

// Desktop Bridge plugin manifest
const manifests = [path.join(os.homedir(), ".figma-console-mcp", "plugin", "manifest.json")];
const mf = manifests.find((m) => fs.existsSync(m));
mf ? add("bridge-manifest", "OK", `Desktop Bridge manifest: ${mf}`, "Figma Desktop: Plugins > Development > Import plugin from manifest, pick that file, then run Figma Desktop Bridge.")
   : add("bridge-manifest", "WARN", "Desktop Bridge manifest not found yet", "Add the MCP (next line) and start it once; it writes ~/.figma-console-mcp/plugin/manifest.json. Or find it inside the figma-console-mcp package: figma-desktop-bridge/manifest.json.");

// figma-console MCP registered with Claude Code
const mcp = run("claude", ["mcp", "list"]);
mcp === null ? add("mcp", "WARN", "Could not run `claude mcp list` (Claude Code CLI not on PATH?)", "Check by hand that figma-console is configured.")
  : /figma-console/.test(mcp) ? add("mcp", /figma-console.*(✔|Connected)/.test(mcp) ? "OK" : "WARN", "figma-console MCP is registered", /Connected|✔/.test(mcp) ? "" : "It is registered but not connected: open Figma Desktop and run the Desktop Bridge plugin.")
  : add("mcp", "FAIL", "figma-console MCP is not registered", "claude mcp add figma-console -s user -- npx -y figma-console-mcp@latest");

// Skill + project
const skillDirs = [path.join(os.homedir(), ".claude", "skills", "building-storybook-from-figma"), path.join(process.cwd(), ".claude", "skills", "building-storybook-from-figma")];
skillDirs.some((d) => fs.existsSync(d)) ? add("skill", "OK", "Skill is installed") : add("skill", "WARN", "Skill building-storybook-from-figma not found in ~/.claude/skills or .claude/skills", pick({ win32: "xcopy /E /I skills\\building-storybook-from-figma %USERPROFILE%\\.claude\\skills\\building-storybook-from-figma", darwin: "cp -R skills/building-storybook-from-figma ~/.claude/skills/", linux: "cp -R skills/building-storybook-from-figma ~/.claude/skills/" }));
fs.existsSync("package.json") ? add("project", "OK", "package.json found in this folder") : add("project", "WARN", "No package.json here; run doctor from the project root", "cd to the project (or the empty folder for the starter template).");

const mark = { OK: "OK  ", WARN: "WARN", FAIL: "FAIL" };
if (args.includes("--json")) console.log(JSON.stringify({ os: OS, node: process.versions.node, results }, null, 2));
else {
  console.log(`doctor: ${OS}, Node ${process.versions.node}\n`);
  for (const r of results) console.log(`${mark[r.status]}  ${r.id.padEnd(16)} ${r.found}${r.fix ? `\n      fix: ${r.fix}` : ""}`);
  const f = results.filter((r) => r.status === "FAIL").length, w = results.filter((r) => r.status === "WARN").length;
  console.log(`\n${f} to fix, ${w} warnings.${f ? " Fix the FAIL lines first, then run doctor again." : ""}`);
}
process.exit(results.some((r) => r.status === "FAIL") ? 1 : 0);
