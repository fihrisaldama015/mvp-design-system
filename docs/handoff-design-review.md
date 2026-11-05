# Design review: handoff for the next agent

Written 2026-11-05 so a new agent (or a new session) can continue without asking the developer to explain again.
The developer is Muhamad Fihris Aldama (they/them). They work in Indonesian; they work with a PM and designers.

## What this is

An internal flow where the **design (Figma) and the code of a component are compared, and designers / product owners decide** what happens to
what differs. Three parts:

| Part | Where | What |
|---|---|---|
| **The skill** `building-storybook-from-figma` | `mvp-design-system/.claude/skills/building-storybook-from-figma/` (source). Runnable copy in `scripts/figma/` (`npm run sync-skill`). | `reviewSync.mjs` compares a Figma dump with the code and publishes a review; `usageScan.mjs` finds where each property is used; `install.mjs` puts the skill into a project; `templates/review-kit/` is the review page. |
| **The service** `design-review` | `/home/aldam/WORK/BLUE_SILO/TRMS/Repo/design-review` (Express + Mongoose + React dashboard). Live: `https://design-review-jet.vercel.app` (Vercel + Atlas). | Projects, project tokens (`drp_...`), accounts, reviews, decisions, audit log. `main` = `87b0d63` (pushed, includes delete project). |
| **The review page** | The kit, installed in a project at `src/review-kit/`, mounted at `/review`. | The page designers / PMs use. Same look in every project. |

Projects: `mvp-design-system` (this repo, a dummy app to test the flow; Figma = "Graphene"), `swt-fe` (`/home/aldam/WORK/BLUE_SILO/TRMS/Repo/swt-fe`, the real
app; its own Figma is **SWT3.0**, page designs and tokens, no per-component pages; **never read yet, the link is still needed**).
Reference docs: `.claude/skills/building-storybook-from-figma/reference/review-service.md` (contract, config, "Order for a new project", routing probe),
`SKILL.md`. CLAUDE.md of this repo lists the rules for the AI consumer.

## State right now (check with git; this can be out of date)

- `mvp-design-system`, branch `feat/review-ui-only-detect`: everything committed (last feature commit `39d37b1`, then this doc). **Not pushed.**
- `swt-fe`, branch `chore/design-review-skill` (made from `dev`): everything of ours committed (last `e73e494d1`). **Not pushed.**
  Two untracked files `Aturan-Design-Token-v1.0.pdf` and `Kontrak-Design-Token-v0.1.docx` are not ours: never add them.
- `design-review`, `main` = `db232bb`, pushed (approved by the developer): delete project + the Candidate preview URL field. Vercel deploy was not confirmed from here (no `gh`): the dashboard Settings tab shows "Danger zone" and "Candidate preview URL" when it is live.
- mvp `feat/tech-sharing-video` (a Remotion talk, 26+ commits, 9.5 MB wavs) is local only. Unrelated to this flow.
- Tests: `npm test` in mvp = **194 pass** (skill scripts, usage, kit, installer). Service: `npm test` in `design-review` = **95 pass**.
- A demo project `swt-demo` exists on the service with 4 reviews (Button, Input, Alert, SelectV2) made from **mvp's Graphene dumps compared with SWT's code**. It is demo
  data (the design is not SWT3.0). The project token was pasted in a chat: **revoke it** (dashboard, Tokens tab) when the demo is over; a project can now be deleted (Settings, Danger zone).
- SWT config lives in `swt-fe/.env` (git-ignored): `REVIEW_API_URL` (ends `/api/v1`), `REVIEW_PROJECT`, `REVIEW_API_KEY` (token) for the tool; `REACT_APP_REVIEW_SERVICE_URL` (origin only)
  and `REACT_APP_REVIEW_PROJECT` for the page. **`.env.local` and `.env.stage` are tracked in git in SWT: never put the token there.**
- SWT dev server: `npm run dev` in `swt-fe`, port 5001, page at `http://localhost:5001/review`. (A stale dev server from an earlier test once served the wrong env: check `ss -ltnp | grep 5001`.)

## Decisions made (do not re-litigate)

1. **A review compares only what LOOKS different**: options of a variant (`kind="outlined"`) and on/off switches. Data (`columns`, `rows`, `options`), content (`label`, `children`), handlers
   (`onX`) and `id/name/ref/className/style/value/defaultValue` are listed as "not compared" and never become a decision. Per component the project can override in
   `figma-tokens.config.json`: `review.components["<Figma name>"] = { code, component, also, map, legacy, ui, behavior, ignore }` (SWT: Button `behavior:["type"]`; "Input - Single Select" code = `select-v2`, behavior `usePortal`).
   The code file is chosen by component name (a re-export is followed; several blocks and no match is an error).
2. **The skill is project-agnostic** (SWT now, other projects later). `install.mjs` copies the skill and scripts (never `__tests__`: a project's jest would run the fixtures), creates
   `figma-tokens.config.json`, adds npm scripts without replacing any (`--build-hooks` chains `predev`/`prebuild`), `.gitignore` lines, and the review kit. Re-running updates the kit; `review.config.js` is the project's and is never overwritten.
3. **The review page is a kit with its own CSS and building blocks** (`rk-` classes, no Tailwind, no host components) so designers see the same page in every project. Needs only `react` and `lucide-react`. The kit is replaced on every install:
   edit it in `.claude/skills/building-storybook-from-figma/templates/review-kit/`, never in a project's `src/review-kit/` (only `review.config.js` is theirs). Page URL is `/review`, in the app, outside its auth layout (SWT: outside `InitialApp`).
4. **Usage scan** (`usageScan.mjs`): routes are read by two adapters (JSX `<Route>`, config arrays `{path, component}`), lazy imports and bare `src/` imports are followed. **Run `node scripts/figma/usageScan.mjs --probe` on any new project first**; a blind scan stops a review
   (`--blind-usage` overrides). `npm run usage` GENERATES `src/review-kit/usage.json` from the code (it does not copy anything); it is bundled into the page. `reviewSync` also scans at publish time and stores a snapshot.
5. **Parameter routes (`/:id`)**: no id is invented. A route with a parameter opens its list page (longest shorter route without a parameter) and says to click a row; `review.routeSamples` (real path) overrides.
6. **"Where it is used"** (page): a list of routes with the file that uses it and a badge **Always on** (a plain value) or **Depends on data** (a condition/spread). Frames (page now / page with the Figma version) are offered for "Always on" pages and
   for pages with `review.howToSee` steps; "Depends on data" pages have no frames. A drawer/dialog use gets a generic note; the real click path must be written in `review.howToSee` (SWT: SelectV2 `/v2/asset-tracking` is written).
7. **Side-by-side preview ("See the difference") is the core value for PM/designers**. A switch (even without a default, e.g. `disabled`) is rendered on/off automatically; other props need an example in `review.config.js` `previews[<component folder>]`
   (`Component`, `sample`, `controlled`, `wide`, `examples`, `hint`, example `notes`). SWT has Button, Input, Alert, `select-v2`.
8. **Highlight** outlines only the instances whose prop is on (read from React fiber props), default ON, remembered per session, and the frame reports "N highlighted" or "None on screen right now".
9. **Project delete** exists (service): admin only, Settings > Danger zone, lists what is lost (reviews, tokens, member list; accounts stay), asks to type the project key; server requires `confirm` = key.

## Known gaps / to do (in the developer's priority order)

1. **Preview URL of the candidate build ("figma-draft") — BUILT AND PUSHED, NOT TESTED WITH A REAL FIGMA-DRAFT BUILD (2026-11-05).** Service `main` in `design-review` (field `candidatePreviewUrl` in Settings, returned with the review list and as the default `previewUrl` of a review; 96 tests); skill: `reviewSync` reads it, `previewNeeded` in `reviewGate.mjs` stops when Figma adds something and no URL exists (`--no-preview` to go on). Still to do: confirm the Vercel deploy, set the URL for `swt-demo`, and try a real `figma-draft` build (local is fine). Original brief: The right-hand frame ("With the Figma version") and any review where Figma ADDS something (added props/options: the current code does not have them, so the
   side-by-side cannot render them) need a deployment built from a branch where the Figma changes are applied (`figma-draft`; mvp has the pattern: `--preview-url` + Vercel branch alias). Today it is a manual flag
   (`reviewSync.mjs --preview-url https://<origin>`), stored in the review as `previewUrl`; **nothing tells the AI/dev it is needed, and there is no place to keep it**. Design agreed in principle by the developer (to build, local first is fine):
   - keep the URL in the **dashboard, per project** (Settings: "Candidate preview URL"; the project already has `hasPreviewBuilds`), served by the API, so the tool and the page read it instead of a flag;
   - `reviewSync` takes it from the project (flag still overrides) and **at review time**, not later, **stops and tells the AI/dev when it is needed and missing**: when items are `added-*` or a frame is wanted and no URL exists ("deploy the figma-draft branch, then set the URL in the dashboard or pass --preview-url");
   - document this in SKILL.md / `reference/review-service.md` ("Order for a new project") so an agent making a review knows to ask for it. It matters while the review is made, not after.
2. **Previews from Storybook stories** instead of hand-written `previews` entries: the developer asked why the box needs config when Storybook already has the story. Idea: `previews[key] = fromStory(module)` using the story's `args`; stories with `render`/`useArgs` need care. Not built.
3. **SWT3.0 Figma**: need the link / file key, then dumps (Figma Desktop + Desktop Bridge + `npm run figma:receiver`), priority by use: button, toastAlert, table, checkbox, input, pagination-v2, modal-v2, drawer, selectOption, select-v2. Until then the `swt-demo` data is mvp-design vs SWT-code (a demo, not a decision).
4. Usage scan treats `components/button` and `components/button/version-2` as one "Button" (7 vs 278 files in SWT). Not fixed.
5. Saving answers to the real service was **not tested from the page** (only the service tests and a mock). Staging deploy of SWT (`build:stage`, `.env.stage`) and SWT's origin in the project's `allowedOrigins` are not done; the SWT pipeline is the SWT team's.
6. Highlight and frames were verified in mvp and with SWT's login page, **not on authenticated SWT pages** (needs login + backend).
7. Push/merge: nothing of mvp or swt-fe is pushed; each push needs the developer's explicit OK, on a branch, never `main` directly (the service was the exception, approved).
8. Older open items: rotate the project token and admin password that were pasted in chats; "Reload anyway" bug seen in Zen browser (not reproducible in Chrome; needs: does the dialog close, banner text, console error); service Vercel region (`regions` sin1) once Atlas region is known; the mvp-dev copy of the skill lacks the `.env.local` reader; check Remotion/Claude brand usage and company license.

## How to run and check

```
# mvp (skill source of truth)
npm test                                  # 194 tests
npm run sync-skill                        # skill scripts -> scripts/figma/ (never edit scripts/figma by hand)
node scripts/figma/install.mjs --check    # is mvp up to date; add --target ../swt-fe for SWT; --dry-run / --no-kit / --kit-dir
# a project (SWT)
node scripts/figma/usageScan.mjs --probe  # how routes were read; lists routes still without a page
npm run usage                             # writes src/review-kit/usage.json
node scripts/figma/reviewSync.mjs ../mvp-design-system/.figma-dump/components.Button.json [src/components/button/index.js]
node scripts/figma/reviewState.mjs        # what is pending on the service
# service
cd ../design-review && npm test && (cd web && npx rsbuild build)
```
Dumps of the mvp Figma are in `mvp-design-system/.figma-dump/components.*.json` (Alert, Button, Input, Input-Single-Select(-Base); `*.simulated*` are fakes).

## How the developer likes to work

- Answers in **Indonesian**, short, honest about what was and was not tested; no overclaiming. Plain English in UI text, sentence case.
- Work directly; do not spawn subagents for small or medium work. Save tokens (weekly limit was at 98% on 2026-11-05).
- **Never push or merge without an explicit yes**; new branch, not `main`. Commit only when asked ("commit" was approved case by case). Never `git add` files that are not ours.
- Do not put secrets in tracked files or in chat; the token goes in git-ignored `.env`.
- Verify in a real browser when it is UI: headless Chrome through the DevTools protocol plus a small mock of the service (scratch scripts, not in the repo; the mock needs `POST /api/v1/auth/login`, `GET /api/v1/projects/<p>/reviews` and `/reviews/<slug>`).
- Look at what the PM/designer sees: something that cannot be seen on the page (a drawer that is closed, a prop that is off) must be explained, not shown as an empty box.
