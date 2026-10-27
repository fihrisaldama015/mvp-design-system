# Review demo prep Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** What the PM demo needs on top of the finished review service: a reason on every decision, a "Reviews" queue in the service UI, remaining usage and deadline on the review card, and a `reviewSync --plan` that tells the developer (or Claude Code) exactly what to change for each decision.

**Spec:** `docs/superpowers/specs/2026-10-16-design-review-service-design.md`; backlog `docs/design-review-backlog.md` (D16, Q11).

**Repos:** MVP = `/home/aldam/WORK/BLUE_SILO/TRMS/Repo/mvp-design-system` (branch `feat/review-demo-prep`, from `main`). Service = `/home/aldam/WORK/BLUE_SILO/TRMS/Repo/design-review` (branch `main`, remote `origin`; **do not push**: the controller pushes after review).

## Global Constraints

- Skill scripts are edited in `.claude/skills/building-storybook-from-figma/scripts/` and copied with `npm run sync-skill`. `reviewLogic.mjs` in the skill and `server/src/reviewLogic.mjs` in the service must stay **byte-identical** (`cmp`). Change the skill copy first, then copy it.
- Pages use design-system components only (read each component's propTypes: never pass a prop it does not declare); Tailwind for layout only; semantic classes (`text-default`, `bg-surface`, `border-default`...); no hex, no arbitrary values; icons `lucide-react`; UI text plain English, sentence case.
- Never print or log a token, a password or `.figma-dump/review-api.json` contents.
- Tests first for logic. `npm test` (MVP) and `npm -w server test` + `npm -w web run build` (service) must pass before each commit. Commit messages end with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- No browser is available: say what was not seen.

## Shared contracts

**C1. Decision note.** `POST /decision` body gets an optional `note`. `decide(doc, { answers, migrateBy, version, by, note }, at)`: `note` is trimmed; `undefined`/empty = none; a non-string -> `400 "note must be text."`; longer than 500 characters -> `400 "note must be at most 500 characters."`. When the decision changes something and the note is non-empty, the `decided` audit entry gets `note`. A no-op decision ignores the note.

**C2. Summary additions** (all optional for old documents). `summary(doc)` keeps its fields and adds: `jsxName`, `answered` (removals that have an answer), `choices` (sorted distinct answered choices), `lastDecision` (`{ by, at, note? }` of the last `decided` audit entry, else `null`), `deadline` (earliest `migrateBy` date of an item answered `keep-deprecated`, else `null`), `usageCount` (sum of `usage.byItem[id].count` over removal items, `null` when no usage was published).

**C3. `reviewSync --plan "<Name>" [--json]`.** Reads the review from the service, scans the CURRENT code (`scanUsage`, `usageFor`) and prints what to change. Text first (readable by a person and by Claude Code), `--json` prints `{ component, status, version, steps: [{ id, kind, choice, title, note?, actions: [{ type: "edit"|"run"|"wait", file?, line?, text }] }], finalChecks: [string] }`. Kinds: `follow-figma`, `keep-deprecated`, `keep`, `unanswered`, `safe-addition`. Exit 0 when printed; 2 with a message on a config error or an unknown review (same style as `--answers`).

---

### Task 1: Logic, summary and `--plan` in the skill (MVP repo)

**Files:**
- Modify: `.claude/skills/building-storybook-from-figma/scripts/reviewLogic.mjs` (C1, C2), its tests `__tests__/reviewLogic.test.mjs`
- Create: `.claude/skills/building-storybook-from-figma/scripts/reviewPlan.mjs` (pure: `buildPlan(doc, usageResult) -> plan`, `planText(plan) -> string`), `__tests__/reviewPlan.test.mjs`
- Modify: `reviewSync.mjs` (`--plan`; `--answers` also prints each decision's `note`), `reviewState.mjs` and `doctor.mjs` (the "answered, not applied" hint names `--plan`), `reference/review-service.md` (document `note`, summary fields, `--plan`)
- Create: `.claude/commands/apply-review.md` (slash command `/apply-review`: the steps for Claude Code, below)

**Interfaces:**
- Produces: `buildPlan(doc, { usageFor, uses })`: the caller passes, per removal item, the result of `usageFor(usage, doc.jsxName, item)` as `usageByItem: { [itemId]: { count, routes, uses } }` where each use is `{ file, line, attrs }`: `buildPlan(doc, usageByItem) -> plan` (C3 JSON shape). `planText(plan)`.
- Plan content per item: `follow-figma` removed-prop -> an `edit` action for the component (`doc.code`, "remove `<prop>` from propTypes and from the component"), an `edit` action per use (`file:line`, "remove the `<prop>` attribute"), a `run` action `npm run usage` ("must report 0 uses"), `run` `reviewSync --done`; `follow-figma` removed-option -> an `edit` action per use ("`<prop>="<option>"` is no longer in Figma: use one of the remaining options"); `keep-deprecated` -> an `edit` action if `item.deprecated` is false ("start the propTypes description of `<prop>` with `@deprecated`"), a `wait` action with the deadline `migrateBy` and the remaining uses (file:line), and a `run` for `--done` (it passes and prints the burn-down); `keep` -> a single `wait` ("Figma changes first: do not change code; publish again after the design is updated"); unanswered -> `wait`. Added items (`added-prop`, `added-option`, `default-changed`) -> one `safe-addition` step per item pointing to `reference/existing-component.md`. A decision note is copied into the step as `note`. Order: unanswered first is NOT wanted; steps follow `doc.items` order. `finalChecks`: re-read the Figma node and `reviewSync --verify <file>` unchanged; `npm test`; `npm run build`; `reviewSync --done "<Name>"`.
- `.claude/commands/apply-review.md` tells Claude Code to: run `node scripts/figma/reviewState.mjs`; stop and tell the dev if nothing is `answered-not-applied` or a review is still waiting; run `--answers "<Name>"` then `--plan "<Name>"`; show the plan and apply the `edit` actions (never answer for the reviewers; never edit `src/components`, `src/tokens` etc. in the vibe repo: if the plan says to change the component, say it is a dev-repo change and stop); re-read the Figma node if the bridge is available, otherwise ask the dev whether to verify against the saved dump; `--verify`; `npm test`; `npm run build`; `--done`; report what was done and what remains (kept deprecations with their deadline).

- [ ] **Step 1: Failing tests** (names; assert the exact values of the contracts above): `decide stores a trimmed note on the audit entry`, `a note over 500 characters is 400`, `a non-string note is 400`, `an empty note adds no note key`, `a no-op decision ignores the note`, `summary reports answered, choices, lastDecision with note, deadline and usageCount`, `summary of an old document has nulls and zeros, not errors`, `buildPlan follow-figma removed-prop lists the component edit, one edit per use, usage and done`, `buildPlan keep-deprecated lists deadline and remaining uses and a deprecated edit only when not deprecated`, `buildPlan keep is a single wait`, `buildPlan unanswered is a wait`, `buildPlan copies the note`, `planText mentions every file:line`.
- [ ] **Step 2: Run, expect FAIL.**
- [ ] **Step 3: Implement** `reviewLogic.mjs` changes (pure, dependency-free), `reviewPlan.mjs`, `--plan` in `reviewSync.mjs` (scan with `scanUsage` as `--done` does; refuse like `--done` when the scan reports warnings: "Cannot count usage: the scan skipped ..."), `--answers` notes, hints, docs, slash command.
- [ ] **Step 4: `npm run sync-skill`, `npm test`, `npm run build` pass.** Try `--plan` against a stub service or the local store (no network) and paste the real text output in your report.
- [ ] **Step 5: Commit** — `feat: decision notes, richer summary and reviewSync --plan`.

---

### Task 2: Service: note, Reviews tab, history (service repo)

**Files:**
- Modify (copy, do not edit): `server/src/reviewLogic.mjs` <- the skill's file after Task 1
- Modify: `server/src/routes/reviews.mjs` (pass `body.note` to `decide`; history entries include `note`), tests `server/test/reviews.test.mjs`
- Modify: `web/src/pages/ProjectDetail.js` (new first tab **Reviews**; History table shows the note under "What"); create `web/src/pages/ReviewsTab.js` if the file grows

**Interfaces:**
- Consumes: C1, C2 and the existing `GET /projects/:project/reviews` (`{ reviews: [summary], counts }`), `GET /projects/:project/history`.
- **Reviews tab:** a table with columns Component (name + `jsxName`), Status (Badge: Waiting for an answer / Answered / Applied), Decision (the `choices` in plain words, or "-"), Last decision (`lastDecision.by`, how long ago, the note's first 80 characters), Migrate by (the `deadline` and an "overdue" Badge when it is before today and the status is not applied, else "-"), Usage at last sync (`usageCount`, "-" when null), and an "Open the review page" link (the project's `reviewUrl`, hidden when unset). A status filter (design-system Select: All, Waiting for an answer, Answered, Applied), newest first (`updatedAt`), an empty state ("No reviews yet: they appear when the developer publishes one"), counts line from `counts`. Default tab for everyone; members see it too.
- [ ] **Step 1: Failing tests (server):** `decision stores the note and history returns it`, `note too long is 400 through the route`, `list returns the C2 summary fields`.
- [ ] **Step 2: Run, expect FAIL.** **Step 3: Implement** (route, tab, history). **Step 4:** `npm -w server test`, `npm -w web run build` pass; `cmp` of the two `reviewLogic.mjs`.
- [ ] **Step 5: Commit** in the service repo — `feat: decision notes and a Reviews queue tab`. Do not push.

---

### Task 3: Review page: remaining usage, deadline, note (MVP repo)

**Files:** `src/pages/Review.js`, `src/app/review/helpers.js`, `src/app/review/__tests__/helpers.test.mjs`.

**Interfaces:**
- Helpers (pure, tested first): `daysLeft(dateString, today = new Date()) -> number|null` (whole days, negative when overdue, `null` for an invalid date), `deadlineText(dateString, today) -> string` ("Migrate by 2026-10-31 (4 days left)", "(due today)", "(overdue by 2 days)", singular for 1), `usageTrend(usageHistory, itemId) -> number[]` (counts in order, last 6), `trendText(counts) -> string` ("3 -> 3 -> 1", "" for fewer than 2).
- On each removal card ("Where it stands"): uses now in this build (from `usageFor`) next to the count at the last sync (`doc.usage.byItem[id].count`), the trend text when it exists, and for a saved `keep-deprecated` answer the `deadlineText` of `doc.migrateBy[id]` with a danger Badge when overdue. An optional "Why? (optional)" text field (design-system `Textarea`; max 500, with a counter) is sent as `note` with the decision (only when the user typed something); the history list shows each decision's `note` under its line. The note field is cleared after a successful save.
- [ ] **Step 1: Failing tests** for the four helpers (edge cases: invalid date, today, 1 day, overdue, history with other item ids, fewer than 2 points). **Step 2: FAIL.** **Step 3: Implement** helpers and page. **Step 4:** `npm test`, `npm run build` pass. **Step 5: Commit** — `feat: review card shows remaining usage, deadline and a decision note`.

---

### Task 4: Demo data and run sheet (controller)

Branch `demo/*` data: the simulated visual scenario (`Alert kind="outlined"` removed from a COPY of the real Figma export, labelled as simulated), the draft branch used as the candidate, `figma-tokens.config.json` `review.routeSamples` for `/reservations/:id`, the updated `demo/review/*` scripts and run sheet, reset of the live review, the push of the service and of `main`.

## Review Focus

1. A note containing markup or very long words must not break the card or the History table (rendered as text, wrapped).
2. A review published before this change (no `note`, no `lastDecision`, no `usage`) must still render in the Reviews tab and on the page.
3. `--plan` on a review whose scan has warnings must refuse like `--done`, never print a plan that hides uses.
4. A `keep-deprecated` item whose `migrateBy` is missing or invalid must not crash the deadline text.
5. The slash command must never tell Claude to edit generated design-system files in the vibe repo.
