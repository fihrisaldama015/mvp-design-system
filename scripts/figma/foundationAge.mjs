// How old is the Foundation (tokens) data, and is it time to ask the dev to check it against Figma?
// Age = now - the newest of source.exportedAt (an export) and source.checkedAt (a check that found no change),
// both in src/tokens/tokens.index.json. Threshold: figma-tokens.config.json "staleAfterDays" (default 7).
// Checking needs Figma Desktop, the Desktop Bridge plugin and the receiver, so the agent must ASK first.
// Usage: node scripts/figma/foundationAge.mjs [--quiet]   (--quiet prints only when stale; used by the SessionStart hook)
//        or import { foundationAge } from "./foundationAge.mjs"
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function foundationAge(root = process.cwd(), now = Date.now()) {
  const read = (f) => { try { return JSON.parse(fs.readFileSync(path.join(root, f), "utf8")); } catch { return null; } };
  const index = read("src/tokens/tokens.index.json");
  if (!index?.source?.exportedAt) return null;
  const staleAfterDays = read("figma-tokens.config.json")?.staleAfterDays ?? 7;
  const { exportedAt, checkedAt } = index.source;
  const last = Math.max(Date.parse(exportedAt), checkedAt ? Date.parse(checkedAt) : 0);
  const days = (now - last) / 86400000;
  return { designSystem: index.designSystem ?? "", exportedAt, checkedAt: checkedAt ?? null, days, staleAfterDays, stale: days >= staleAfterDays };
}

export const ASK = `ASK the dev first: "Check the tokens against Figma now?" It needs Figma Desktop with the foundation file open, the Desktop Bridge plugin running and the receiver (npm run figma:receiver). Only if the dev says yes, follow reference/foundation.md "Checking for changes". If no, carry on and do not ask again in this session.`;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const a = foundationAge();
  const quiet = process.argv.includes("--quiet");
  if (!a) { if (!quiet) console.log("No tokens exported yet (src/tokens/tokens.index.json has no source.exportedAt)."); }
  else if (a.stale) console.log(`Foundation tokens (${a.designSystem}) were last exported ${a.exportedAt}${a.checkedAt ? `, last checked ${a.checkedAt}` : ""}: ${Math.floor(a.days)} days ago, threshold ${a.staleAfterDays}.\n${ASK}`);
  else if (!quiet) console.log(`Foundation tokens are ${a.days.toFixed(1)} days old (exported ${a.exportedAt}${a.checkedAt ? `, checked ${a.checkedAt}` : ""}); check after ${a.staleAfterDays} days.`);
}
