# Plan

Goal: test a design system workflow from scratch, where the design system is the
source of truth for designers, developers and AI. The order follows "foundation
first": tokens, then components, then patterns.

The target flow (from the team discussion):

```
PM -> vibe coding -> MVP -> confirm with HL (high level)
  if ok:  designer slices to Figma -> designer updates Figma
          -> PM slices Figma back into the vibe coding -> developers consume it
  if not: iterate with HL
```

## Stages

| # | Stage | Status |
|---|---|---|
| 1 | **MVP with plain Tailwind.** Twelve pages, 60 items, no tokens, no shared components, inconsistent on purpose (`docs/inconsistencies.md`). Batch 1 added: loan detail, borrower profile, reports, 404, toasts, tooltip, action menu, banners, danger dialog, loading / empty / error states. Batch 2 added: maintenance tickets with a comment thread, CSV import, filter popover, bottom sheet, notification dropdown, Ctrl + K search and two photo viewers. Twelve pages. | Done |
| 2 | **Foundation: design tokens.** A token source (start with the same kind of Figma export swt-fe uses: `design-token-kit`, `tokens:sync`), colours / text / spacing as CSS variables that Tailwind reads. | Next |
| 3 | **Components and patterns in Storybook.** Shared Button, Input, Select, Badge, Tabs, Table, Modal, Drawer, then the page patterns (list, detail, form flow, dashboard, settings). Components manifest and the Storybook MCP server so AI can read it. Components (28, 105 stories, plain Tailwind, best variant chosen per component, see `Guide/Component choices`) are done; page patterns are not. | Components done, patterns next |
| 4 | **Migrate the MVP** to the design system, page by page, and compare with `docs/inconsistencies.md`. | |
| 5 | **Test as an AI consumer.** A fresh AI session builds a new page using only Storybook (MCP) and the project rules. Count how many times it guesses. | |
| 6 | **Test the change flow.** Change one token, sync it, and see what moves in Storybook. | |
| 7 | **Deploy** Storybook and the app to Vercel; write up what worked and what is still manual. | |

## Left out for now

- A calendar view and drag-and-drop (heavy; only if asked).
- Chromatic (later, once the components exist).
- Login and a real backend.
- A Figma token source (until it exists, tokens start as a JSON file).
