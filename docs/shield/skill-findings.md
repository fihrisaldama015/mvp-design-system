# Skill findings: phase 3 test from an empty folder

Test: `building-storybook-from-figma` used only from the skill, in
`../shield-storybook-test` (empty folder), 2026-10-12. Result: tokens, Tailwind theme and
6 Foundations pages built from Graphene, `build-storybook` ok, `renderCheck.sh` 6 pages,
0 errors. Components (phase 2) not tested yet.

## Gaps and decisions

| # | Gap | Decision |
|---|---|---|
| 1 | A receiver left running on port 9232 swallowed the data (new one failed to bind silently, files went to another repo's `.figma-dump`). | **Fix.** `dumpServer.py`: fail loudly if the port is taken, resolve the output dir to an absolute path, answer a GET `/ping` with the dir it writes to. |
| 2 | No templates for `tailwind.config.js`, `postcss.config.js`, `rsbuild.config.js`, `src/index.css`; only prose in `foundation.md`. | **Fix.** Add them as templates for the truly empty folder. Existing boilerplates only get the parts they lack. |
| 3 | `main.mjs` / `preview.js` assume the project's own `rsbuild.config.js` and `react-router-dom`; `TokenBlocks.js` is not under `templates/storybook/`. | **Done** as proposed: `initStorybook.mjs` detects the stack first; the empty folder is case C on our starter. |
| 4 | `figma-tokens.config.json` defaults are Graphene's collection names. | **Fix.** Make the roles explicit in setup (read the collection names from `collections.json`, then set the roles) so another design system is not a silent mismatch. |
| 5 | Every plugin script (≈4 KB for `readFoundation.js`, more for `readComponents.js`) is pasted through the chat into `figma_execute`. | **Fix. Tested, works** (see below). |

## Proposal for #3: start from what the project has

Cases, in order of how often they happen:

1. **A project or boilerplate without Storybook** (the main case). Detect, do not assume:
   bundler (rsbuild / vite / webpack / next), React version, Tailwind version, CSS entry,
   import aliases, router. Pick the Storybook framework package from the bundler; add the
   router decorator only if `react-router-dom` is installed; reuse the project's bundler config.
2. **A project that already has Storybook**: update tokens or one component (already covered).
3. **A truly empty folder**: use our stack (React 18, rsbuild, Tailwind 3) from the
   starter templates of #2, then continue as case 1. Not the main use, so one short reference file.

Limit stated in the skill (decided by the owner): **supported = React 18 + Tailwind 3**. Tailwind 4, no
Tailwind and Next.js are limits for now: `initStorybook.mjs` stops with the reason (`--force` still
adds Storybook and `tokens.css`). Their workflow differs and there is no template yet; a later phase.

## Proposal for #5: bootstrap loader

The receiver also serves the plugin scripts (`GET /script?name=readFoundation.js`). The
call to `figma_execute` becomes a few lines: fetch the script, run it, pass the constants:

```js
const src = await (await fetch("http://localhost:9232/script?name=readFoundation.js")).text();
return await new (Object.getPrototypeOf(async function () {}).constructor)("ARGS", src)({ PORT: 9232 });
```

**Tested 2026-10-12:** the plugin sandbox allows `new AsyncFunction`. `selfTest.js` ran
and returned `ARGS`; `readFoundation.js` through the loader wrote `collections.json`,
`scopes.json` and `styles.json` byte-identical (`cmp`) to the pasted-script run. The call is
about 280 bytes instead of ≈4 KB.

Still to do in the skill:
- `dumpServer.py`: the version in `shield-storybook-test/scripts/figma/` has the three routes
  (`POST /save`, `GET /script`, `GET /ping`), an absolute output dir and a loud error when the
  port is taken (checked: a second start exits 1 with the `kill $(lsof -ti :PORT)` hint).
- Plugin scripts read `ARGS` instead of "edit the constants at the top": `readFoundation.js`
  done (`ARGS.PORT`); `readComponents.js` (`NAMES`, `DEPTH`) and `exportVariants.js`
  (`SET`, `WHERE`, `EACH`) not yet. Keep the old default when `ARGS` is missing.
- `SKILL.md`: replace "copy to `.figma-dump/run-*.js`, edit, paste" with the loader snippet;
  add `plugin/selfTest.js` as the first check after starting the receiver.

## Phase 2 test (Button in the same empty folder, 2026-10-12)

Result: Button built from the skill only: 24-combination Figma vs Storybook sheet matches;
hover, press, disabled and loading colours equal the tokens; `renderCheck.sh` 18 pages, 0
errors. Written up in `shield-storybook-test/docs/button.md`. Adding a component to a project
that has just been given Storybook is the same flow as the "Storybook already exists" case.

New gaps:

| # | Gap | Fix |
|---|---|---|
| 6 | `inventory.js` returns ≈12 KB inline through the chat, and the first call timed out (cold page load); the retry worked. | Save `inventory.json` through the receiver and return only counts; say in SKILL.md "a timeout on the first call is a cold load, call again". |
| 7 | Building class names (`` `border-${status}` ``) hides them from Tailwind's scanner; my first draft did this. | One line in `components.md`: write every class in full in a map. |
| 8 | `interact.mjs` with selector `button` matched a Storybook-injected element (wrong colours, no error). | Docs: use `#storybook-root button`; the script could default to prefixing `#storybook-root `. |
| 9 | `compareSheet.py` needs the Figma files in the same order as the Storybook grid; the file glob is alphabetical. | Say it in `components.md` (build the list in story order), or sort by an order argument. |
| 10 | The matrix story must carry the same optional parts as the Figma export (icons), otherwise the sheets differ for a reason that is not a bug. | One line in `components.md`. |


## Fixes applied to the skill and re-tested (2026-10-12)

| # | Change | Where |
|---|---|---|
| 1 | Receiver: loud error when the port is taken, absolute dir, `/ping` | `scripts/dumpServer.py` |
| 2 | Starter files for a truly empty folder | `templates/starter/` (package.json, rsbuild, postcss, tailwind, `index.css`) |
| 3 | Stack detection; writes only the missing `.storybook/` files, never npm | `scripts/initStorybook.mjs`, `reference/storybook-setup.md` |
| 4 | Roles checked against the file; unused collections listed | `scripts/checkConfig.mjs` |
| 5 | Loader instead of pasting; plugin scripts read `ARGS`; `selfTest.js` | `SKILL.md`, `scripts/plugin/*` |
| 6 | Inventory saved to disk, `listSets.mjs` prints it; cold-load timeout noted | `plugin/inventory.js`, `listSets.mjs` |
| 7, 9, 10 | Class names in full; compare in story order; same optional parts in the matrix | `reference/components.md` |
| 8 | `interact.mjs` scopes the selector to `#storybook-root` | `scripts/interact.mjs` |
| 11 | New: `toBruecke.mjs` and `buildTokenDocs.mjs` did not create `src/tokens` / `src/foundations` (the first test only worked because the folder was made by hand) | both scripts |
| 12 | New: `figma_export_tokens` uses the locked file, not `fileKey`; with two files open it read the wrong one ("0 tokens", nothing written) | `SKILL.md` setup step 6 |
| 13 | New: wiring tokens into an existing project: merge snippet for `tailwind.config.js`, class check, before/after screenshot | `reference/foundation.md` |

### Test results

| Case | Folder | Result |
|---|---|---|
| C, empty folder, new | `shield-test-empty` | starter + `initStorybook --write` + tokens + Foundations: build ok, 6 pages 0 errors; output identical to the first run (only timestamps differ). Button: sheet pixel-identical to the first test, hover/press equal tokens, 18 pages 0 errors. |
| A, boilerplate without Storybook (MVP at `96b0e84`) | `shield-boilerplate-test` | project files kept (only `package.json` scripts/deps, `.gitignore`, `tailwind.config.js` and `index.css` merged by hand); 0 of 167 colour classes the app uses went missing; app `npm run build` ok; Storybook 18 pages 0 errors; manifest has all 11 Button props (NODE_PATH works with the project's `components` alias). Dashboard before/after: same layout, Inter font and a few px of line-height shift. |

| A, boilerplate on Vite (MVP source, bundler swapped; `.js` files hold JSX) | `shield-vite-test` | `initStorybook` picks `@storybook/react-vite`; app `vite build` ok; Storybook 18 pages 0 errors; manifest has 11 Button props; hover/press colours equal the tokens. It took three fixes (14-16 below). |

Also checked in a temp folder: without `react-router-dom` the generated `preview.js` has no router; with Next.js `initStorybook` stops. Not tested: webpack (CRA), Tailwind 4 (a limit now), Dark mode in the sheets.

Found by the Vite test:

| # | Gap | Fix |
|---|---|---|
| 14 | The Vite builder parses `.storybook/preview.*` before esbuild runs; a project config that limits JSX to `src/` (the common `esbuild.include` snippet) made the preview fail with a parse error. | The template `preview.js` has no JSX (`createElement`), so it works with any loader config. Rsbuild re-checked: 18 pages, 0 errors. |
| 15 | `renderCheck.sh` said "0 errors" on a failed build (a stale `index.json`) and on a Storybook with no preview file (no CSS, no theme). | It now fails without `storybook-static/iframe.html` or without `.storybook/preview.*`. |
| 16 | `initStorybook.mjs` refused to run again after a run that stopped half way (`.storybook/` existed). | It stops only when `main.*` and `preview.*` both exist; otherwise it writes the missing files and keeps the rest. |

Project side, not the skill's job: a Vite project that keeps JSX in `.js` files needs its own esbuild loader setting (the test project has it); Storybook and the new component files follow the project's convention.


## Figma IDs in the index (owner's main task), 2026-10-12

Goal: an update must know where to look in Figma, without scanning the file.

| Piece | What was added |
|---|---|
| Tokens | `readFoundation.js` also saves effect style IDs (text styles already had them); `toBruecke.mjs` writes `src/tokens/figma-ids.json` (file key, collection, variable, text-style and effect-style IDs, from the export's `variableId` / `collectionId`); `buildTokens.mjs` copies them into `tokens.index.json` (`id` per token, text style, effect; `collectionIds`). `design_token.json` keeps its Brücke shape. |
| Components | `inventory.js` saves page and set node IDs (`listSets.mjs --ids`); `readComponents.js` takes `ARGS.IDS` and saves page, file name and read time; `indexComponent.mjs` writes `figma-index.json` at the project root. |
| Check | `plugin/resolveIds.js`: given IDs and the names the index expects, says which are missing or renamed. |

Tested (Graphene and SHIELD copies, `shield-test-empty`):
- 714 of 714 tokens, 58 of 58 text styles and 23 of 23 effects have an ID in the index.
- `resolveIds`: 10 real IDs (6 variables, 2 text styles, 2 effect styles) resolve to the expected names; a made-up ID is reported missing.
- Button read by node ID (`7:21282`) vs by name: the two dumps are identical apart from `readAt`. Time with the pages already loaded: 0.9 s by ID, 1.4 s by name.

Limits, so the video does not over-claim:
- IDs are stable inside one Figma file. A duplicated file (our "(Copy)" files) gets new IDs, so the pointers must be rebuilt after a copy; `resolveIds` shows that.
- The by-ID read skips `loadAllPagesAsync`, which is what timed out on the first inventory call of a cold file. That saving was not measured: the pages were already loaded in the test.
- An update still re-reads the foundation file (one read, seconds). The IDs remove the scan for components and the guesswork about where a token came from; they do not remove that read.


## Existing-component test: Alert (2026-10-13)

The repo already had `Alert` (`tone`, `title`, `children`, `action`); SHIELD describes it with `Kind`, `Status`, `Size`, `Invert`.
Procedure written as `reference/existing-component.md`; the case is documented in `docs/shield/alert.md` and `docs/shield/changelog.md`.

| # | Gap found | Fix |
|---|---|---|
| 14 | Per-side stroke weights were lost: `dashed` and `full page` are bottom-border-only, but the dump kept only the top weight and `variantClasses` printed "0px, not a token". | `readComponents.js` saves `strokeSides` when the sides differ; `variantClasses.mjs` prints `border-b (sides 0/0/1/0px)` |
| 15 | No written rule for a component that already exists with another API. | `reference/existing-component.md`: compare (mapped / only Figma / only code / defaults), decide A or C by callers, never `V2`, write the migration table |
| 16 | `exportVariants.js` scanned the whole file: the call timed out at 30 s and kept the plugin busy, so the next calls timed out too. | takes `ARGS.ID` (node ID): 15 exports in 0.94 s |
| 17 | `interact.mjs` always used a 1400×1000 viewport, so tall matrix stories were cut off (silently blank below). | `--size WxH` |

Not exercised: option C (compatibility layer), because no component with many callers has been synced yet. Candidates with callers:
components used by other components (Modal by ConfirmDialog, Spinner by Button).

## Shared review store (designers and product owners answer, not the dev)

The review of a removal moved from a Storybook page on the dev's machine to a page `/review` of the deployed app, backed by a store (KV on the
MVP, Mongo in swt): `reference/review-service.md`. The five-route API is one file (`reviewCore.mjs`), tested with a local server (20 cases: auth,
conflict 409, republish keeps / drops answers, applied, new cycle), a stand-in KV server, and the page in headless Chrome (11 checks: wrong password,
partial save, conflict reload). Not run on Vercel or against a real KV store.

| # | Gap found | Fix |
|---|---|---|
| 18 | Review state was per machine (`.figma-dump`), so another dev or a designer could not see or answer it, and a text file on the server would vanish at each deploy. | the store + API; `reviewSync` publishes, `reviewState` / `--answers` / `--verify` / `--done` read it; the same code runs in-process for a local store |
| 19 | A store failure surfaced as a raw error; an unreachable store looked like "nothing pending". | `502` with the reason; `reviewState` says "state unknown, do not assume nothing is pending" and exits 1 |
| 20 | `--done` closed a review that still had unanswered removals. | refused while `pending` |
| 21 | Two reviewers could overwrite each other. | `version` on every save, `409` with the current document; the page reloads it |
