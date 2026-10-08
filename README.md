# mvp-design-system

An **Equipment Loan Tracker**, built on purpose the way a quick vibe-coded MVP
looks: plain Tailwind, no design tokens, no shared components, and every page
styled a little differently. It is the "before" picture for an experiment: how
good a workflow can we build when the design system (tokens in Figma, components
and patterns in Storybook) is the source of truth for designers, developers and
AI?

No login and no backend: the data is demo data in memory (a reload resets it).

## What is in it

| Route | Page |
|---|---|
| `/` | Dashboard: late-loans banner, stat cards, equipment by category, recent loans |
| `/equipment` | Equipment list (60 items): search, filter, paging, add (modal), delete, tooltips |
| `/equipment/:id` | Equipment detail: tabs, edit (drawer), delete (danger dialog) |
| `/loans` | Loan log: filters, CSV export, mark returned, empty state |
| `/loans/:id` | Loan detail: timeline, extend, notes |
| `/loans/new` | Lend equipment: 3-step flow |
| `/people/:id` | Borrower profile: avatar card, open loans with an action menu, history |
| `/reports` | Reports: line chart, donut, top borrowers, skeleton while loading |
| `/settings` | Settings: loan rules, reminders, table density |
| any other | 404 page |

## Stack

Same as swt-fe: React 18, rsbuild 2, Tailwind 3 (plain config), react-router 6,
lucide-react, formik + yup, dayjs. Imports such as `components/...` and `data/...`
resolve to `src/` (see `rsbuild.config.js`).

## Run

```bash
npm install
npm run dev        # http://localhost:5002
npm run build      # output in build/
```

## Deploy (Vercel)

`vercel.json` is ready: build command `npm run build`, output `build`, and a
rewrite to `index.html` so routes like `/equipment/EQ-002` work on reload.

## Docs

- `docs/plan.md`: the stages of the experiment and what is done.
- `docs/inconsistencies.md`: the differences planted between pages on purpose,
  so the "after" can be compared with the "before".
