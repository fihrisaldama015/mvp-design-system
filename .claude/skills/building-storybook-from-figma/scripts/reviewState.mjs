// Is a sync review waiting? Asks the review store (reviewClient.mjs): the shared API when it is configured, otherwise the
// local store in .figma-dump/review-store. With the shared API the state is the same on every machine: a new Claude
// session does not remember the earlier one, the store does.
// Usage: node scripts/figma/reviewState.mjs [--quiet]   (--quiet prints only when a review is pending; used by the SessionStart hook)
//        or import { reviewState } from "./reviewState.mjs"  (async; throws when the shared API cannot be reached)
import { fileURLToPath } from "node:url";
import { reviewApi, reviewConfig, reviewPage } from "./reviewClient.mjs";

// The reviews that are not applied yet: [{ name, figmaNode, readAt, removals, additions, unanswered: [ids], state }]
export async function reviewState(_root, { timeoutMs = 8000 } = {}) {
  const api = reviewApi(reviewConfig(), { timeoutMs });
  const { reviews } = await api.list();
  const out = [];
  for (const r of reviews.filter((x) => x.status !== "applied")) {
    const waiting = r.status === "pending";
    const doc = waiting ? await api.get(r.component) : null;
    const unanswered = doc ? doc.items.filter((i) => i.kind.startsWith("removed") && !doc.answers[i.id]).map((i) => i.id) : [];
    out.push({ name: r.component, figmaNode: r.figmaNode, readAt: r.readAt, removals: r.removals, additions: r.additions, unanswered, state: waiting ? "waiting-for-dev" : "answered-not-applied" });
  }
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const quiet = process.argv.includes("--quiet");
  const cfg = reviewConfig();
  let st;
  try { st = await reviewState(process.cwd(), { timeoutMs: quiet ? 3000 : 8000 }); }
  catch (e) { console.log(`Sync review state unknown: ${e.message}${quiet ? "" : " Do not assume there is nothing pending."}`); process.exit(quiet ? 0 : 1); }
  if (!st.length && !quiet) console.log(`No sync review pending (${cfg ? cfg.url : "local store"}).`);
  if (st.length && quiet) console.log("Sync review pending (a previous session left it):");
  for (const c of st) {
    const waiting = c.state === "waiting-for-dev";
    console.log(`${c.name} (Figma ${c.figmaNode}, read ${c.readAt}): ${c.additions} additions, ${c.removals} removals, ${waiting ? `${c.unanswered.length} unanswered` : "all removals answered, not applied yet"}`);
    console.log(waiting
      ? `  -> Do NOT apply. Tell the dev the reviewers answer at ${reviewPage(cfg)}; wait. Other components can be synced meanwhile.`
      : `  -> Get the answers: reviewSync.mjs --answers "${c.name}". Re-read the node from Figma (readComponents.js with ARGS.IDS), reviewSync.mjs --verify on that file; unchanged: apply the answers, then reviewSync.mjs --done "${c.name}".`);
  }
}
