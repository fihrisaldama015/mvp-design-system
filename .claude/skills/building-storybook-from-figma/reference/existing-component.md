# The project already has the component, and Figma describes it differently

Examples: the repo's Button has `variant="primary|secondary|danger|ghost"`, Figma has `Kind × Status`; the repo's
Alert has `tone`, Figma has `Status`, `Kind`, `Size`. Do not guess and do not create `ButtonV2`.

## Steps

1. **Callers.** Count where the component is used outside its own folder and stories
   (`grep -rnE "<Name\b" src | grep -v "src/components/<name>/"`). Pages that draw the same thing with plain markup are not callers.
2. **Compare** the component's props with Figma's (after `analyzeComponent.mjs`), in four groups:
   - *mapped*: same idea, different name or values (`variant` → `kind` + `status`, `tone` → `status`);
   - *only in Figma*: add them as props, named like Figma (camelCase, same options);
   - *only in code*: keep when Figma has no equivalent, say "not in Figma" in the prop description and in the component doc;
   - *behaviour and defaults*: changed defaults are the silent breakers (`<Button>` used to be primary, the Figma default status is neutral).
3. **Decide** (after the review above for anything removed). Figma wins on names, options and looks. Then:
   - **A. Change the API in place** when the callers are few: update every caller in the same change.
   - **C. Compatibility layer** when they are many and cannot move at once: one component with the Figma API; the old prop is still
     accepted, mapped to the new ones, with a development-only `console.warn`; remove it once the callers moved (log the removal).
     *Not exercised yet: no component with many callers has been synced.*
   - **Never a second component** (`ButtonV2`): two sources of truth, two entries in Storybook and in the AI manifest, and the rename
     at the end touches every caller anyway.
   A starting threshold: up to about 10 callers → A, more → C. Adjust it after a real case.
4. **Write it down before editing callers:** the comparison table and the old → new migration table go into `docs/<ds>/<component>.md`
   and a line into the changelog (`docs/<ds>/changelog.md`). Show the tables to the owner first when callers will change.
5. **Build and prove** as in `components.md`. A rename of a prop is a change of the component's API: say so in the commit message.

## Review before anything changes (removals need a human)

Additions from Figma are safe: they go in without asking. A prop or option that **code has and Figma no longer has**
(a `searchable` on Select, a `size="xl"`) must never disappear silently.

1. `node scripts/figma/reviewSync.mjs .figma-dump/components.<Name>.json src/components/<x>/index.js [--map '{"Dismiss":"onDismiss"}'] [--legacy tone=status]`
   lists *additions*, *default changes* and *removals* (with how many caller files use each) and **publishes the review to the review store**
   (`reference/review-service.md`): the shared API when `REVIEW_API_URL` + `REVIEW_API_KEY` (or `.figma-dump/review-api.json`) are set, so
   designers and product owners see it on the page **/review** of the deployed app; otherwise a local store (`npm run review:api` + `npm run dev`).
   The review and the answers live in the store, **not in git and not on one machine** (with the shared API). The Figma reads stay local (`.figma-dump/`).
   What travels in git is the *outcome*: the code, the component doc and the commit message. Record the decision there (who decided, what, why:
   `docs/<ds>/<component>.md`; the store keeps who and when in `audit`).
   **Make it understandable for people who do not read code.** The page explains each removal in plain words and, for a visual property, shows the
   real component twice (without the property, as Figma has it; with it, as the code has it) so a designer can compare by clicking. That preview comes from
   `src/pages/review/previews.js`, one entry per component folder: when a review involves a visual property of a component that has no entry, **add one**
   (the real component, sample props, and for a property that is not an on/off switch the `with` / `without` props). Run `reviewSync` with `--file <figmaFileKey>`
   (or keep `figma-index.json` up to date) so the page can link "Open in Figma" to the node.
   The page also links "Open in Storybook" (`storybookUrl` in `figma-tokens.config.json` + the story id in `figma-index.json`): it is the fallback for a property without a live preview, so set both.
2. The reviewers open `/review`, enter the shared password and their name, answer the removals and **Save answers**. They can answer some now and
   the rest later; a second save by someone else is refused (409) until they reload, so nobody overwrites an answer unseen.
3. The agent reads the answers with `node scripts/figma/reviewSync.mjs --answers "<Name>"` and applies them. Nothing is removed before the review is *answered*.
   **The agent never answers for the reviewers**: it does not use the page, call the decision route, or pick a default.
   After `reviewSync` it tells the dev where the page is, what each removal means (callers, on by default or not), and stops until `reviewState` says
   *answered*. Pending = no removal, no deprecation, no default flip. Testing the flow with a stand-in answer is fine only on a scratch store and must be said out loud.
4. **Before applying: is the review still true?** The review was made from a Figma read at a certain time (`readAt`). Re-read the node
   (`readComponents.js`, `ARGS.IDS = ["<nodeId>"]`, one second) and run `node scripts/figma/reviewSync.mjs --verify .figma-dump/components.<Name>.json`.
   *unchanged* (it ignores the read time) -> apply; *CHANGED* -> run `reviewSync.mjs` again (publishing a changed Figma state drops the old answers, the
   audit says so) and have the reviewers answer again. It hashes everything the read contains, so a changed fill or token also shows.
   **A waiting review does not block other work.** The dev may say "sync X first" (e.g. while a product owner or tech lead decides). Keep syncing other
   components: each is its own review in the store, the page lists all of them, and `--done "<Name>"` only closes its own. Before touching a component
   that shares code with a pending one (Select and Input share `components/field/control`), say so to the dev. When the dev comes back, start with
   `reviewState.mjs`, then re-read and `--verify` that component, since Figma may have moved on.
5. **After applying and proving:** `node scripts/figma/reviewSync.mjs --done "<Name>"` marks the review *applied* (refused while removals are unanswered).
   **A new session finds the state in the store**, not in memory: `node scripts/figma/reviewState.mjs` says *waiting for the reviewers*, *answered, not applied*,
   or nothing; if the store cannot be reached it says so and must not be read as "nothing pending".

| Answer | What the agent does |
|---|---|
| **Remove it, follow Figma** | Delete the prop; update the callers in the same change (see the caller count), log it in the changelog. |
| **Keep it as deprecated** | The prop stays and still works, so existing callers are untouched. Its `propTypes` description starts with `@deprecated <why, what replaces it>`; its default is **off** (new pages get the plain Figma look); the component doc and changelog list it with a removal note; no story shows it as a normal option. A development-only `console.warn` fires when a caller passes it. |
| **Keep it, ask the designer** | Stays as a normal prop, described as "not in Figma"; the designer gets the item in the notes. |

Deprecated is not option C: C maps an old *name* to a new one while callers move; deprecated keeps a *feature* that Figma dropped.
Re-running `reviewSync.mjs` lists a deprecated prop again with `[already deprecated]`, so it is removed once the callers are gone.
Details that matter (found on SHIELD Select, `docs/shield/select.md`):
- A prop that is **on by default reaches every caller**: count callers of the component, not only those that pass the prop (`reviewSync` does).
  When the default flips to off, a *product* caller that relied on it gets the prop explicitly in the same change; stories follow the new default.
- Pass `--behavior` (data), `--ignore` (Figma properties that are not props), `--also <wrapper>` (props the wrapper supplies), `--map` / `--legacy`
  so the list only holds real design differences. Handlers (`on*`) and `value`, `id`, `className`, `children` are never "gone from Figma".
- Do not extend a component with options Figma lacks by copying a sibling (Select got Input's five statuses; Figma's has two): re-run `reviewSync`
  after the sync, it must converge to the deprecated items only.
*Tried on SHIELD Select (a real removal, "keep as deprecated") and on the old Alert from git. Option C is still not exercised.*

## Worked examples

- `docs/shield/alert.md`: callers 0 → A; mapped / only in Figma / only in code table; migration table.
- Button (changelog): `variant` → `kind` + `status`, `leftIcon` / `rightIcon` → `prefixIcon` / `suffixIcon`, default changed; 14 call sites
  in 12 files updated in the same commit.
