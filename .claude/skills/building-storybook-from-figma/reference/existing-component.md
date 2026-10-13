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
   lists *additions*, *default changes* and *removals* (with how many caller files use each) and writes `src/guide/sync-review.json`.
2. The dev opens Storybook > **Guide/Sync review** and answers every removal, then **Save answers**
   (needs `dumpServer.py` running; without it the page shows the JSON to copy into `.figma-dump/review-decisions.json`).
3. The agent reads `review-decisions.json` and applies it. Nothing is removed before this file exists.

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
