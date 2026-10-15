---
name: design-system-pull
description: Use in a prototype (vibe coding) repo that must share the dev repo's design system, to copy the dev repo's components, tokens and stories into it (pull-ui, ui-lock.json) and to check that the copy was not edited by hand or left behind.
---

# Design system pull (vibe repo side)

The dev repo owns the components, tokens and Storybook. This repo holds a generated copy.

- `npm run pull-ui` copies the design system and writes `ui-lock.json`; `npm run ui-check` and the session hook warn when the copy was edited by hand
  or the dev repo moved on. New components go in `src/proposed/`.
- Contract with the dev repo's `design-system-slice` skill: `ui-lock.json` is `{ source: { path, commit, dirty }, pulledAt, files: { [relPath]: sha1 } }`;
  the dev side reads `source.commit` to tell whether this copy is current.
- Spec: `docs/superpowers/specs/2026-10-15-vibe-to-dev-slice-design.md`.
