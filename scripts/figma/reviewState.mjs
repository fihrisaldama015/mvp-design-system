// Is a sync review waiting? Reads src/guide/sync-review.json (made by reviewSync.mjs) and the dev's
// answers (.figma-dump/review-decisions.json, saved from Storybook > Guide/Sync review).
// A new Claude session starts here: it does not remember the earlier one, the files do.
// Usage: node scripts/figma/reviewState.mjs        (or import { reviewState } from "./reviewState.mjs")
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function reviewState(root = process.cwd()) {
  const read = (f) => { try { return JSON.parse(fs.readFileSync(path.join(root, f), "utf8")); } catch { return null; } };
  const review = read("src/guide/sync-review.json");
  const answers = read(".figma-dump/review-decisions.json")?.decisions ?? {};
  const out = [];
  for (const [name, c] of Object.entries(review?.components ?? {})) {
    const needs = c.items.filter((i) => i.kind.startsWith("removed"));
    const unanswered = needs.filter((i) => !answers[`${name}/${i.id}`]).map((i) => i.id);
    out.push({ name, figmaNode: c.figmaNode, readAt: c.readAt, removals: needs.length, additions: c.items.length - needs.length, unanswered, state: unanswered.length ? "waiting-for-dev" : "answered-not-applied" });
  }
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const st = reviewState();
  if (!st.length) console.log("No sync review pending.");
  for (const c of st) {
    console.log(`${c.name} (Figma ${c.figmaNode}, read ${c.readAt}): ${c.additions} additions, ${c.removals} removals, ${c.state === "waiting-for-dev" ? `${c.unanswered.length} unanswered: ${c.unanswered.join(", ")}` : "all removals answered, not applied yet"}`);
    console.log(c.state === "waiting-for-dev"
      ? "  -> Do NOT apply. Tell the dev to open Storybook > Guide/Sync review (/?path=/story/guide-sync-review--overview) and Save; wait."
      : "  -> Re-read the node from Figma (readComponents.js with ARGS.IDS), run reviewSync.mjs --verify on that file; unchanged: apply the answers, then reviewSync.mjs --done \"" + c.name + "\".");
  }
}
