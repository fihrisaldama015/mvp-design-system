# Review service demo: run sheet (screen recording)

Story: Figma changes the design system. The design review service shows the reviewers which pages are affected, takes their
decision with a reason, keeps the history, and the developer (Claude Code) reads the decisions, applies them, and cannot close
a review while pages still use what was removed.

Two reviews, two kinds of decision:

| Review | What changed in Figma | Decision shown | Data |
|---|---|---|---|
| Select, `searchable` | the search box is gone from the Select (13 Oct export) | **keep it, but mark it as old (deprecated)** with a migrate-by date | real Figma export |
| Alert, Kind `outlined` | the outlined Alert is gone: pages would look different | **remove it, to match Figma** (pages move to another kind) | **SIMULATED**: a copy of the real export with that option removed. Say "simulated". |

Service: https://design-review-jet.vercel.app (project `mvp`). Apps: **Now** http://localhost:5002 (this checkout, branch
`demo/review-now`), **From Figma** http://localhost:5003 (an export of branch `demo/review-candidate`: the draft with the decisions applied).
Commands are in `demo/review/`.

## Before recording (10 minutes)

1. In the service UI (Members tab) create the two reviewer accounts: a **designer** and a **PM**, with real names (the history shows the name). Log in once with each and change the temporary password.
2. `cd /home/aldam/WORK/BLUE_SILO/TRMS/Repo/mvp-design-system && git checkout demo/review-now`
3. `demo/review/start.sh` (both apps), then `demo/review/check.sh`: only OK lines. The last lines list the two reviews waiting for an answer.
4. If the reviews were answered before: `demo/review/reset.sh` (asks for YES; deletes the live reviews of project `mvp`, puts the pages back, publishes both again).
5. Tabs: `http://localhost:5002/review` (logged in as the designer), a second browser profile logged in as the PM, and the service UI (project `mvp`, tab **Reviews**).
6. Terminal ready in the repo, **no Claude Code session open yet** (its start hook reads the state at start).

## The flow (about 10 minutes)

| # | Who | Do | Say / show |
|---|---|---|---|
| 1 | Developer | `demo/review/publish.sh` | The sync found two things Figma dropped. The scan says where they are used: "searchable: 3 uses on 2 pages", "kind outlined: 2 uses on 2 pages". Nothing changed in code. |
| 2 | Service | UI, tab **Reviews** | The queue: both reviews "Waiting for an answer", with usage at the last sync. |
| 3 | PM | `/review`, Select card | Plain English, the two pages that use it, "Where it stands". Pick the page, compare Now and From Figma: open the dropdown on the left, there is a search box. |
| 4 | PM | Choose "Keep it, but mark it as old", set Migrate by, write a reason ("Search is used on the equipment list, migrate after the new filter ships"), Save | The reason and the date are part of the history. |
| 5 | Designer | `/review`, Alert card | The two pages where the outlined alert is used. In "Page to preview" pick **`/reservations/:id`** (sample RS-1001, which overlaps RS-1008, so the alert is on screen with no clicks): outlined on the left, filled on the right. On `/reservations/new` the alert shows only after choosing equipment that overlaps another reservation, so say that instead of previewing it. |
| 6 | Designer | Choose "Remove it, to match Figma", reason ("Outlined is gone from the design system"), Save | |
| 7 | Service | Reviews tab, then History | Both are "Answered", with who decided, when, and why. The developer's queue, without asking anyone. |
| 8 | Developer | Open Claude Code in the repo | The start hook prints the state by itself: two reviews "answered, not applied". Nobody told Claude. |
| 9 | Developer | `/apply-review` | Claude reads the answers and the plan (`reviewSync --answers`, `--plan`): for Alert the exact files and lines to change, for Select the deadline and the remaining uses. It asks whether to re-read Figma or continue on the saved dump (say continue: it is the saved export). |
| 10 | Developer | Let Claude apply, then test and build | The Alert pages change from outlined to another kind. Select is left alone: it stays deprecated until the date. Claude never answers for the reviewers and does not touch the design-system components in this repo. |
| 11 | Developer | `reviewSync --done` for each (Claude runs them) | Alert: closes only when the scan finds 0 uses. Select: passes and prints the burn-down (uses now, at the last sync, the deadline). |
| 12 | Reviewer | Refresh `/review` or the Reviews tab | Alert is **Applied**. Select shows the deadline and what remains to migrate. |

Fallback if Claude stalls on step 10: `demo/review/migrate.sh` (pages take the candidate's version), then `--done` by hand.

## After recording

`demo/review/unmigrate.sh`, `demo/review/stop.sh`. To record again: `demo/review/reset.sh`.

## How the preview works (for the PM)

The review does not draw "the Figma version" by itself. It compares **two runs of the same app**:

| Frame | What it is | In this demo | In real life |
|---|---|---|---|
| Now | the app as it is today | `localhost:5002`, branch `demo/review-now` | production, or the branch under review |
| With the Figma version | the same app after the decision is applied: a draft of the developer's change | `localhost:5003`, an export of branch `demo/review-candidate` | a preview deployment of the developer's branch (Vercel), given to the sync as `--preview-url` |

- The two ports are **two versions of one project**, not two projects (production and a preview of a branch).
- The service stores **no code, no screenshots and no copy of the app**: the review, the decisions with their reasons, a short usage summary and the candidate's address.
- **The draft is a git branch**, not a folder: one source of truth, and `--done` checks the real code.
- Inside the frames the app loads with `?embed=1` (no sidebar, no top bar). "Open in a new tab" opens the whole app.
- The small boxes "With it / Without it" on a review card are the component-level comparison. Same order as the page frames below: the current code on the left (Now), the Figma version on the right.
- A frame is only as reachable as its address: `localhost` works on the presenter's machine (share the screen).

## What this demo does not show (say it before someone asks)

- The Alert review is **simulated** (a real Figma export with one option removed). The Select review is the real export.
- The candidate is a local copy. In swt (stage and production only) the page shows the current page only; component comparison goes through Storybook preview deployments (decided, not built).
- No notification yet when a decision arrives (planned: Lark, from the service). Today the developer sees it in the Reviews tab, in the CLI, or when a Claude Code session starts.
- After a review is applied, the next sync of the same component starts a new review (a kept deprecation is not carried over yet).
- The service runs on Vercel + Atlas now; moving to the VPS waits for approval.
