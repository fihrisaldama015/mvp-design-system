// Finds a Chrome / Chromium / Edge binary on Linux, macOS and Windows.
// Order: env CHROME_PATH, then the usual install locations, then the PATH.
// Usage: import { findChrome } from "./findChrome.mjs"   or   node findChrome.mjs
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const env = process.env;
const WIN = ["LOCALAPPDATA", "PROGRAMFILES", "PROGRAMFILES(X86)"].filter((k) => env[k]).flatMap((k) => [
  path.join(env[k], "Google", "Chrome", "Application", "chrome.exe"),
  path.join(env[k], "Microsoft", "Edge", "Application", "msedge.exe"),
  path.join(env[k], "Chromium", "Application", "chrome.exe"),
]);
const MAC = ["Google Chrome", "Chromium", "Microsoft Edge"].map((n) => `/Applications/${n}.app/Contents/MacOS/${n}`);
const NAMES = ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser", "microsoft-edge", "chrome"];

export function findChrome() {
  if (env.CHROME_PATH) return fs.existsSync(env.CHROME_PATH) ? env.CHROME_PATH : null;
  for (const p of process.platform === "win32" ? WIN : process.platform === "darwin" ? MAC : []) if (fs.existsSync(p)) return p;
  const lookup = process.platform === "win32" ? "where" : "which";
  for (const n of NAMES) {
    const r = spawnSync(lookup, [n], { encoding: "utf8" });
    if (r.status === 0 && r.stdout.trim()) return r.stdout.trim().split(/\r?\n/)[0];
  }
  return null;
}

export const chromeHelp = () => ({
  linux: "Install Chrome or Chromium (Debian/Ubuntu: sudo apt install chromium, Fedora: sudo dnf install chromium), or set CHROME_PATH to the binary.",
  darwin: "Install Chrome (brew install --cask google-chrome, or download it), or set CHROME_PATH to the binary.",
  win32: "Install Chrome (winget install Google.Chrome) or use the Edge that ships with Windows; or set CHROME_PATH to chrome.exe.",
})[process.platform] ?? "Install Chrome or set CHROME_PATH.";

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const c = findChrome();
  console.log(c ?? `No Chrome found. ${chromeHelp()}`);
  process.exit(c ? 0 : 1);
}
