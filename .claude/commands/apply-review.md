---
description: Apply the reviewers' answers for a Figma sync review (reviewState, --answers, --plan, verify, test, build, --done)
argument-hint: "[component name]"
---

Apply the answered design review for a component. Component: $ARGUMENTS (if empty, take it from step 1).

Rules that always hold:
- Never answer for the reviewers and never change a review's answers. Only they decide, on the `/review` page.
- In the vibe repo `src/components`, `src/tokens`, `src/foundations`, `src/guide`, `src/utils` and `.storybook` are a generated copy of the dev repo. Never edit them. If a plan step
  says to change the component file, tell the developer it is a dev-repo change and stop. Only edit the pages that use the component.
- If any command fails or refuses, show the message and stop; do not work around it.

Steps:
1. Run `node scripts/figma/reviewState.mjs`. If no review is `answered-not-applied`, or the review is waiting for the reviewers or for Figma, say so and stop. Apply nothing.
2. Run `node scripts/figma/reviewSync.mjs --answers "<Name>"`, then `node scripts/figma/reviewSync.mjs --plan "<Name>"`. Show the plan to the developer, with the reviewers' notes.
3. Do the `edit` actions of the plan, step by step (page files only, as above). Do not act on `wait` steps: a `keep` waits for Figma, a `keep-deprecated` waits for its deadline.
4. Re-read the component node from Figma if the Desktop Bridge is available, then run `node scripts/figma/reviewSync.mjs --verify <components.Name.json>`. If the bridge is not available,
   ask the developer whether to verify against the saved dump. If `--verify` says the node changed, stop: the reviewers must answer again.
5. Run `npm test` and `npm run build`. Both must pass.
6. Run `node scripts/figma/reviewSync.mjs --done "<Name>"`. If it refuses, report the reason; do not force it.
7. Report what was done and what remains: kept deprecations with their migrate-by date and remaining uses, kept items waiting for Figma, and anything that needs the dev repo.
