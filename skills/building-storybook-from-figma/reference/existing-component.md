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
3. **Decide.** Figma wins on names, options and looks. Then:
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

## Worked examples

- `docs/shield/alert.md`: callers 0 → A; mapped / only in Figma / only in code table; migration table.
- Button (changelog): `variant` → `kind` + `status`, `leftIcon` / `rightIcon` → `prefixIcon` / `suffixIcon`, default changed; 14 call sites
  in 12 files updated in the same commit.
