# Planted inconsistencies (the "before")

Every page was written with its own habits, as a fast MVP usually ends up. This
is the list to compare against once the design system is in. It was written from
the code, page by page.

| Page | Colours | Page title | Main button | Table or list | Status badge | Form or overlay | Feedback |
|---|---|---|---|---|---|---|---|
| Dashboard | gray + blue | `text-3xl font-bold` | `bg-blue-600 rounded-md` | raw `<table>`, `divide-y`, uppercase header | pill (`rounded-full`), emerald / amber / red | none | none |
| Equipment list | slate + indigo | `text-xl font-semibold` | `bg-indigo-600 rounded-lg` | bordered card, zebra rows | small rectangle (`rounded`), green / yellow / red | centered modal, formik + yup | `window.confirm` on delete |
| Equipment detail | zinc + orange | `text-2xl font-extrabold` | `bg-orange-500 rounded` | rows built with `flex` (no table) | uppercase pill with tracking, emerald / orange / rose | right drawer, `useState` validation | none |
| Lend equipment | emerald + gray | `text-2xl font-semibold text-emerald-800` | `rounded-full bg-emerald-600` | none | none | hand-made 3-step stepper, `border-2 rounded-xl` fields | `alert()` |
| Loan log | neutral + gray | `text-2xl font-semibold` | red `bg-rose-500` for "Mark returned" | table with borders on every cell | coloured dot and text, no background | native date and select filters | `window.confirm` |
| Settings | gray + sky | `text-lg font-bold` | `bg-sky-600` | none | none | hand-made toggle, native radio | green "Saved!" box |

Shared bits that are also not in one place:

- The sidebar uses `blue-600` for the active link while pages use their own accent.
- Pagination: text Previous / Next on Equipment, numbered squares on Loan log.
- Search box: only on Equipment, with its own icon and focus ring.
- Page padding and the gap under the title differ from page to page.
- No component is shared: buttons, inputs, badges, tables and tabs are all written inline.
- No design tokens: colours are raw Tailwind palette names (gray, slate, zinc, neutral).
