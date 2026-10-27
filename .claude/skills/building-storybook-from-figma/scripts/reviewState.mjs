// Is a sync review waiting? Asks the review store (reviewClient.mjs): the review service when it is configured, otherwise the
// local store in .figma-dump/review-store. With the service the state is the same on every machine: a new Claude
// session does not remember the earlier one, the store does.
// States: waiting-for-dev (removals unanswered), waiting-for-figma (every answer is "keep": the design changes first),
// answered-not-applied.
// Usage: node scripts/figma/reviewState.mjs [--quiet]   (--quiet prints only when a review is pending; used by the SessionStart hook)
//        or import { reviewState } from "./reviewState.mjs"  (async; throws when the service cannot be reached)
import { fileURLToPath } from "node:url";
import { reviewApi, reviewConfig, reviewPage } from "./reviewClient.mjs";

// The reviews that are not applied yet: [{ name, figmaNode, readAt, removals, additions, unanswered: [ids], state }]
export async function reviewState(_root, { timeoutMs = 8000 } = {}) {
  const api = reviewApi(reviewConfig(), { timeoutMs });
  const listed = await api.list();
  if (!listed) throw new Error(`The review service did not know ${api.url} (404): check the project key in REVIEW_PROJECT or .figma-dump/review-api.json.`);
  const { reviews } = listed;
  const out = [];
  for (const r of reviews.filter((x) => x.status !== "applied")) {
    const doc = await api.get(r.component);
    const removals = doc ? doc.items.filter((i) => i.kind.startsWith("removed")) : [];
    const unanswered = removals.filter((i) => !doc.answers[i.id]).map((i) => i.id);
    const onlyKeep = r.status !== "pending" && removals.length > 0 && removals.every((i) => doc.answers[i.id] === "keep");
    const kept = removals.filter((i) => doc.answers[i.id] === "keep").map((i) => i.id);
    out.push({ kept, name: r.component, figmaNode: r.figmaNode, readAt: r.readAt, removals: r.removals, additions: r.additions, unanswered, state: r.status === "pending" ? "waiting-for-dev" : onlyKeep ? "waiting-for-figma" : "answered-not-applied" });
  }
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const quiet = process.argv.includes("--quiet");
  let cfg, st;
  try { cfg = reviewConfig(); st = await reviewState(process.cwd(), { timeoutMs: quiet ? 3000 : 8000 }); }
  catch (e) { console.log(`Sync review state unknown: ${e.message}${quiet ? "" : " Do not assume there is nothing pending."}`); process.exit(quiet ? 0 : 1); }
  if (!st.length && !quiet) console.log(`No sync review pending (${cfg ? cfg.url : "local store"}).`);
  if (st.length && quiet) console.log("Sync review pending (a previous session left it):");
  for (const c of st) {
    const waiting = c.state === "waiting-for-dev";
    console.log(`${c.name} (Figma ${c.figmaNode}, read ${c.readAt}): ${c.additions} additions, ${c.removals} removals, ${waiting ? `${c.unanswered.length} unanswered` : c.state === "waiting-for-figma" ? "every removal was answered keep" : "all removals answered, not applied yet"}`);
    console.log(waiting
      ? `  -> Do NOT apply. Tell the dev the reviewers answer at ${reviewPage(cfg)}; wait. Other components can be synced meanwhile.`
      : c.state === "waiting-for-figma"
      ? `  -> Waiting for Figma: the reviewers kept every removed property, so the design changes first. Do NOT apply. Tell the designer; after Figma is updated, re-read the node and run reviewSync again to publish a new review.`
      : c.kept.length ? `  -> Mixed answers: apply the non-keep answers (reviewSync.mjs --answers "${c.name}"), but --done will refuse until the kept ${c.kept.length === 1 ? "property is" : "properties are"} resolved in Figma (${c.kept.join(", ")}); the state stays answered-not-applied.`
      : `  -> Get the answers: reviewSync.mjs --answers "${c.name}", then reviewSync.mjs --plan "${c.name}" (what to change; or ask the developer to run /apply-review). Re-read the node from Figma (readComponents.js with ARGS.IDS), reviewSync.mjs --verify on that file; unchanged: apply the answers, then reviewSync.mjs --done "${c.name}".`);
  }
}
