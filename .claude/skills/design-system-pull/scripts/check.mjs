// Is the copy of the design system in this repo still the dev repo's? Used by the SessionStart hook (--quiet) and `npm run ui-check`.
import { checkLock } from "./pullUi.mjs";

const quiet = process.argv.includes("--quiet");
const r = checkLock(process.cwd());
if (!r) { if (!quiet) console.log("No ui-lock.json: this repo does not copy the design system from a dev repo."); process.exit(0); }
const lines = [];
if (r.edited.length || r.added.length) lines.push(`Design system files were changed by hand (${[...r.edited, ...r.added].slice(0, 4).join(", ")}). A change to a component belongs in the dev repo; \`npm run pull-ui\` restores the copy.`);
if (r.behind?.commits) lines.push(`The dev repo is ${r.behind.commits} commit(s) ahead${r.behind.changed.length ? `; components changed: ${r.behind.changed.slice(0, 4).join(", ")}` : ""}. Run \`npm run pull-ui\`.`);
if (lines.length) { console.log(lines.join("\n")); process.exit(quiet ? 0 : 1); }
if (!quiet) console.log(`Design system copy matches ${r.lock.source.commit?.slice(0, 7) ?? "the source"}.`);
