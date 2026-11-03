# Review product polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Four product fixes before the first release of the design review system: reviewers see only what they need and a missing review-page link is explained (1), the project list shows what waits for an answer (2), every review card shows a status timeline (3), and the history reads in plain language with a component filter (4).

**Spec:** the product review in the conversation of 2026-11-03 (items 1-4); background `docs/superpowers/specs/2026-10-16-design-review-service-design.md`, backlog `docs/design-review-backlog.md`.

**Repos and branches:**
- Service = `/home/aldam/WORK/BLUE_SILO/TRMS/Repo/design-review`, branch `feat/review-polish` (from `main`). Server `server/` (Express + Mongoose, `node:test`), web `web/` (React 18 + rsbuild, pulled design-system components in `web/src/components`: never edit them).
- MVP = a git worktree `/home/aldam/WORK/BLUE_SILO/TRMS/Repo/mvp-design-system-polish`, branch `feat/review-polish` (from `main`), with `node_modules` symlinked from the main checkout. **Never switch branches in `/home/aldam/WORK/BLUE_SILO/TRMS/Repo/mvp-design-system`: the demo apps are running from it.**
- **Do not push anything.** The controller asks the user first.

## Global Constraints

- Tests first for logic. Service: `npm -w server test` and `npm -w web run build` must pass before each commit. MVP: `npm test` and `npm run build`.
- UI uses design-system components only (read each component's propTypes: never pass a prop it does not declare; never write a button, input, badge, table, select by hand); Tailwind for layout only; semantic classes (`text-default`, `text-caption`, `bg-surface`, `border-default`, `typo-*`); no hex, no arbitrary values; icons `lucide-react`; UI text plain English, sentence case.
- Never print or log a token, a password or `.figma-dump/review-api.json` contents.
- Do not edit generated design-system folders (`web/src/components`, `src/components`, `src/tokens`...).
- No browser is available: say what was not seen.
- Commit messages end with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.

## Shared contracts

**C1. Friendly labels** (`server/src/eventLabels.mjs` in the service, pure; the MVP page gets its own copy in `src/app/review/helpers.js`, same strings).
- `eventLabel(action)`: `"published"` -> `"Published for review"`; `"published (new cycle)"` -> `"Published again, new review"`; `"Figma changed: earlier answers dropped"` -> `"Figma changed: earlier answers were cleared, please answer again"`; `"republished (same Figma state, answers kept)"` -> `"Synced again, nothing changed"`; `"decided"` -> `"Answered"`; `"applied"` -> `"Applied by the developer"`; anything else (including non-strings -> `""`) -> the action text unchanged.
- `choiceLabel(choice)`: `"follow-figma"` -> `"Remove it, to match Figma"`; `"keep-deprecated"` -> `"Keep it, but mark it as old"`; `"keep"` -> `"Keep it, and add it to Figma"`; `null`/`undefined` -> `"Answer cleared"`; anything else -> the text unchanged.
- `itemName(id)`: review item ids look like `kind:prop` or `kind:prop=option` (`removed-prop:searchable`, `removed-option:kind=outlined`). `removed-prop:searchable` -> `searchable`; `removed-option:kind=outlined` -> `kind="outlined"`; an id without `:` -> unchanged.
- `changeLines(changes, migrateBy)` -> array of strings, one per entry of `changes`: `` `${itemName(id)}: ${choiceLabel(choice)}${migrateBy?.[id] ? `, migrate by ${migrateBy[id]}` : ""}` ``. `undefined`/non-object `changes` -> `[]`.

---

### Task 1: Service: reviewer-friendly tabs, waiting counts, plain-language history (service repo)

Covers product items 1, 2 and 4. Three commits, in this order.

**Files:**
- Create: `server/src/eventLabels.mjs` (C1), `server/test/eventLabels.test.mjs`
- Modify: `server/src/routes/reviews.mjs` (history entries add `event` and `lines`), `server/src/routes/projects.mjs` (list adds `counts`), tests in `server/test/reviews.test.mjs`, `server/test/projects.test.mjs`
- Modify: `web/src/pages/ProjectDetail.js`, `web/src/pages/ReviewsTab.js` (only if the hint fits better there), `web/src/pages/Projects.js`

**Interfaces:**
- **Commit A, item 1 (web only).** In `ProjectDetail.js`: the **Settings** tab is admin only; a non-admin sees the tabs Reviews and History. Above the Reviews table, when `project.reviewUrl` is empty, show an `Alert` (`status="info"`, `kind="outlined"`): admin -> title `The review page link is not set`, text `Add it in Settings so reviewers can open the review page.`; member -> text `The link to the review page is not set yet. Ask an admin to add it.`. When the URL is set, no alert. A stale `tab` value that is not in the visible tabs must not render a blank page (fall back to Reviews).
- **Commit B, item 2.** `GET /projects` adds `counts: { pending, answered, applied }` (numbers, 0 when none) to every project in the response, computed with ONE `Review.aggregate` over the listed project ids (`$match` projectId in the ids already filtered by membership/org, `$group` by projectId and `status`). Counts are only for projects the caller may see; other responses that use `projectView` (create, patch) are unchanged. In `Projects.js` the table columns become: Name, Key, **Waiting for an answer** (a warning `Badge` with the count when > 0, else `-`), **Answered** (an info `Badge` with the count when > 0, else `-`), **Allowed origins** (admin only: not a column for members), and the existing review-page link. A project without `counts` (old server) shows `-` and does not crash.
- **Commit C, item 4.** `GET /projects/:project/history` entries keep every existing field and add `event` (`eventLabel(action)`) and `lines` (`changeLines(changes, migrateBy)`). In `History` (web): the "What" cell shows `event` on the first line (fallback `action` when `event` is missing), then each of `lines` (break-words, `text-caption`), then the note as today. Add a component filter above the table: design-system `Select` with `All components` plus the distinct component names (sorted), a `{n} shown` count when filtered, and the empty state `No decisions match this filter` when the filter removes everything. Under the card a caption: `Times are shown in your browser's time zone (<zone from Intl.DateTimeFormat().resolvedOptions().timeZone>).`.

- [ ] **Step 1: Failing tests** (names; assert exact values): `eventLabel maps every known audit action and passes unknown text through`, `choiceLabel maps the three choices, null and unknown`, `itemName strips the kind and quotes an option`, `changeLines lists one line per change with migrate by`, `changeLines of undefined is empty`, `history entries carry event and lines and keep the old fields`, `project list carries counts per project and 0 when there are no reviews`, `a member only gets counts for the projects they belong to`, `create and patch responses have no counts`.
- [ ] **Step 2: Run, expect FAIL.** **Step 3: Implement** in commits A, B, C. **Step 4:** `npm -w server test` and `npm -w web run build` pass after each commit.
- [ ] **Step 5: Commit** A `feat: reviewers see Reviews and History, and a missing review page link is explained`; B `feat: project list shows reviews waiting for an answer`; C `feat: history in plain language with a component filter`.

---

### Task 2: MVP review page: status timeline and plain history (MVP repo, worktree)

Covers product item 3.

**Files:** `src/pages/Review.js`, `src/app/review/helpers.js`, `src/app/review/__tests__/helpers.test.mjs`.

**Interfaces:**
- Helpers (pure, tested first), added to `helpers.js`: `eventLabel(action)` (C1, same strings), and `timelineSteps(audit, status, format = defaultFormat) -> { labels, current, details }`:
  - `labels` is always `["Published", "Answered", "Applied"]`.
  - `current` is the number of finished steps: `status` `"pending"` -> 1, `"answered"` -> 2, `"applied"` -> 3, anything else or missing -> 1.
  - The **current cycle** of `audit` starts at the last entry whose `action` starts with `"published"` or `"Figma changed"` (`"republished..."` is NOT a marker); no marker -> the whole audit; non-array -> `[]`.
  - `details[0]`: `` `Published ${format(at)}` `` from the cycle marker, or `` `Figma changed ${format(at)}, review reopened` `` when the marker action starts with `"Figma changed"`; empty string when there is no marker.
  - `details[1]`: when `current >= 2`: `` `Answered by ${by}, ${format(at)}` `` from the LAST `decided` entry in the cycle (just `Answered` when there is none); otherwise `Waiting for the reviewers`.
  - `details[2]`: when `current === 3`: `` `Applied ${format(at)}` `` from the last `applied` entry in the cycle (just `Applied` when none); otherwise `Waiting for the developer`.
  - `format(at)` returns `""` for an invalid or missing date and never throws; `defaultFormat` is the same local date text the page already uses (`new Date(iso).toLocaleString()`).
- Page: at the top of the review card (under the status badge, above the "Your decisions" progress bar) render the design-system `Stepper` (read its propTypes: `steps`, `current`) with `labels`, and under it a small `text-caption` line list of the three `details` (the empty ones are left out). Also use `eventLabel` in the card's decision history (`{a.by}: {eventLabel(a.action)}`) instead of the raw `a.action`.

- [ ] **Step 1: Failing tests:** `eventLabel maps every known audit action and passes unknown text through`, `timelineSteps pending: published done, answered waiting`, `timelineSteps answered: names the last decider`, `timelineSteps applied: all three with dates`, `timelineSteps uses only the current cycle` (an older cycle's decision must not show), `timelineSteps "Figma changed" marker says the review was reopened`, `republished is not a cycle marker`, `timelineSteps survives an old document: missing audit, bad dates, unknown status`.
- [ ] **Step 2: FAIL.** **Step 3: Implement** helpers and page. **Step 4:** `npm test` and `npm run build` pass. **Step 5: Commit** — `feat: review card shows a status timeline and a plain-language history`.

## Review Focus

1. A non-admin must never get another project's counts, and a member must not see the Settings, Tokens or Members tabs or content by a stale tab value.
2. A project, a review or a history entry from before this change (no `counts`, no `event`, no `note`, no audit) must still render.
3. The aggregate must not scan other organisations' reviews.
4. Text from notes or component names rendered as text, wrapped, never as markup.
5. The timeline of a review that was reopened ("Figma changed") must not show the earlier cycle's answer.
