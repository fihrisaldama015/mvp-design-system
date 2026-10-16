# Demo run-sheet

A note for the person recording; Claude does not read it. Browser on the left, Claude Code on the right.

## The easy way: `next.mjs` in a third terminal

Run `next.mjs` in **its own terminal window that is outside the recording**, never inside Claude Code. A `!` command typed in Claude Code goes into the conversation and Claude answers it, which clutters the video and mixes up the sessions (it happened in the third take). The third terminal is also your teleprompter: it prints the step, **WHERE** to do it (which window), the hint, and copies the prompt.

Open it once: `cd ~/WORK/BLUE_SILO/TRMS/Repo/mvp-design-system` and run `node demo/next.mjs` there for every step (the dev repo needs nothing: the same log and counter serve both). Then click the window named after WHERE and paste with Ctrl+Shift+V.

Forms: `--part A|B|D` (fresh counter and `marks.log` at that part's zero step; the old log is kept), `--again` (show the current step again and copy its prompt, no mark: use it when you pasted something else by mistake), `--back` or `--prev` (move the counter back so the next call shows the same step again, no mark), `--peek` (what is next, no mark), `--goto D1`, `--list`, `--reset`. An unknown option is an error, not a step. The steps live in `demo/steps.json`; the tables below show them for reference.

## Marks (by hand)

A mark writes one line (time, id, label) to `demo/marks.log`; the edit uses it to find each step in the recording. Type it **just before** the step starts. Inside Claude Code the `!` prefix runs it in the shell without involving the model.

- In the vibe repo: `! node demo/mark.mjs <id> "<label>"`
- In the dev repo the script is not there, so use the full path (`M` below):
  `M=~/WORK/BLUE_SILO/TRMS/Repo/mvp-design-system/demo/mark.mjs` then `! node $M <id> "<label>"`. Shell variables do not survive between `!` commands in every setup, so if `$M` is empty, paste the full path.

`A0` and `B0` are time zero of each part: start the screen recording, then type the mark at once. Before a take run `node demo/next.mjs --reset`; the old log is kept under another name.

## Before recording (not filmed)

| Terminal | Commands |
|---|---|
| 1, vibe | `cd ~/WORK/BLUE_SILO/TRMS/Repo/mvp-design-system`, `git checkout demo/start`, `npm run storybook` (leave it running, port 6006) |
| 2, vibe | same folder, `npm run dev` (port 5002) |
| 3, dev | `cd ~/WORK/BLUE_SILO/TRMS/Repo/mvp-dev`, `git checkout demo/start`, `npm run dev` (port 5003) |

Storybook must be running **before** `claude` starts in the vibe repo: the Storybook MCP connects at start.
Reset between takes: vibe `git reset --hard demo/start && git clean -fd src`; dev `git reset --hard demo/start && git clean -fd src docs`. Both discard uncommitted work.

## Part A: the vibe repo (branch demo/start)

Clear the terminal, `cd` to the vibe repo, start `claude`.

| Id | Do | Type or paste | Expect |
|---|---|---|---|
| A0 | start the screen recording | `node demo/next.mjs --part A` in the third terminal | |
| A1 | in the browser open `localhost:5002/reservations`, click the first row | `! node demo/mark.mjs A1 "no detail page yet"` first | 404 page |
| A2 | ask for the page | `! node demo/mark.mjs A2 "ask for the page"`, then the prompt: `Build the reservation detail page at /reservations/:id. Read Storybook first and use only its components.` | Claude reads Storybook (docs-list, docs-show), writes `src/pages/ReservationDetail.js` and the route |
| A3 | when Claude is done: reload the browser, click the first row | `! node demo/mark.mjs A3 "the new page"` first | detail page with the conflict banner, stepper, tabs, table, drawer, cancel dialog |
| A4 | proof of consistency | `! node demo/mark.mjs A4 "ui-check"`, then `! npm run ui-check` | the design system copy matches `ui-lock.json` |

Then `/exit`.

## Part B: the dev repo (branch demo/start)

Clear the terminal, `cd ~/WORK/BLUE_SILO/TRMS/Repo/mvp-dev`, start `claude`.

| Id | Do | Type or paste | Expect |
|---|---|---|---|
| B0 | start of the dev session | `node demo/next.mjs --goto B0` (not `--part B`: that would archive the A marks of a one-video take) | |
| B1 | in the browser open `localhost:5003/reservations`, click the first row | mark `B1 "no detail page in dev"` first | 404 page in dev too |
| B2 | which page | mark `B2 "slice, which page"`, then `/slice-vibe`; answer `ReservationDetail` | a list of pages with their vibe routes, then the question |
| B3 | Claude runs the script | mark `B3 "slice report"` (right after you answer) | report: route `/reservations/:id` from the vibe, providers mounted, sidebar present, build ok, runtime ok on `/reservations/RS-1001`, usually `unknown-prop 1` on Textarea |
| B4 | the result in dev | mark `B4 "dev result"` first; reload `localhost:5003`, click the first row | the same detail page, with the banner |
| B5 | the evidence | mark `B5 "report file"` first; open `docs/slices/ReservationDetail.md` | duration, files, components, findings |

## Part D: gaps found by the slice are closed once, in the dev repo (about 4 minutes)

Recorded right after B, in the same dev state: the page is sliced, anything the PM built outside the design system (for example a `Timeline` in `src/proposed/`) has been promoted in the dev repo, and the slice report is on screen. Stay on the current branch: do not switch branches.
The finding in D1 and D2 is whatever the report shows. The page Claude writes differs from take to take, so the D2 prompt is built from the report and never names a component by hand.

Dev repo with `claude` open, a `claude` session already open in the vibe repo for D3 and D4 (D3 is a `!` command there), and the third terminal for `next.mjs`. Start with `node demo/next.mjs --part D` (it archives the log of A and B; the zero of Part D is its own).

| Id | Do | Type or paste | Expect |
|---|---|---|---|
| D0 | start the screen recording | `--part D` as above | |
| D1 | the finding | `node demo/next.mjs`, then point at the Scan table | `unknown-prop` lines with the component, property and line |
| D2 | fix it in the component, not in the page | the same command copies the prompt; paste it and press Enter | the component's propTypes and story change in the dev repo; the page is untouched |
| D3 | the vibe side follows | the same command copies `! npm run pull-ui && npm run ui-check`; run it in the vibe repo | the fixed component's docs and any promoted component arrive in the vibe copy; the copy matches the lock |
| D4 | the vibe page uses the promoted component | the same command copies the prompt; paste it in the vibe `claude` | the page imports from `components/<name>`; `src/proposed/<name>` is deleted |
| D5 | the slice is clean | the same command copies `/slice-vibe ReservationDetail` | Conflicts none, proposed-import 0, unknown-prop 0, runtime ok |

If the report has no `unknown-prop` line the command says so instead of copying a prompt: skip D2 and say so in the narration.
`demo/part-d` (both repos) is a fixed start state for recording Part D on its own, with a known `Button` finding; use it only for that: switching to it from a dirty A and B state is refused by git, or would mix two pages.

## Optional contrast (Part C)

`/slice-vibe` is not run on legacy pages. To show what a page built without the design system costs, point at `docs/slices/DEMO.md` in the dev repo (baseline: 42 hand-written elements and 2 arbitrary values over six older pages).

## If a take goes wrong

Reset both repos as above and start again from the step before. A fallback recording of each part is better than one long take.
