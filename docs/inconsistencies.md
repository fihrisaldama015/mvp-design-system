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
| Loan detail | violet | `text-2xl font-bold text-violet-900`, with a `Loans / L-001` breadcrumb | `border-violet-600` outline and `bg-violet-600` filled, `rounded-md` | none (vertical timeline with dots) | square-ish tag (`rounded-md`), violet / red / green | none (notes textarea, "Saved ✓" on the button) | red left-border banner when late |
| Borrower profile | teal | `text-xl font-bold` name inside a side card | `rounded-full bg-teal-600` (error retry) | list rows with `divide-y`, kebab menu per row | none (text colour only: late in red) | custom dropdown menu, "Loading profile..." text, dashed error box | black toast bottom-left with Undo |
| Reports | stone + amber | `text-2xl font-black` | `h-8` segmented buttons and a dark `EXPORT` button in capitals | small `text-xs` table | none | inline-SVG line chart and donut | skeleton blocks while loading |
| Maintenance | rose | `text-2xl font-bold text-rose-900`, with a count under it | `bg-rose-600 rounded-lg` | rows built with a CSS grid and a coloured left border | priority chip (`rounded-md`) plus a status dot | filter popover with checkboxes and chips, bottom sheet for a new ticket, `...` action menu | rose flash box |
| Ticket detail | rose + gray | `text-2xl font-bold text-rose-900` | `bg-green-600` resolve, `bg-rose-600` send | none (chat bubbles) | none | comment box with Ctrl + Enter, single-photo popup | none |
| Import | lime | `text-2xl font-bold text-lime-900` | `bg-lime-600 rounded-lg` | `<table>` with red rows for problems | none ("OK" / red text) | drop zone, 4-step flow with a progress bar | success screen |
| 404 | gray | `text-5xl font-black text-gray-300` with an emoji | text link | none | none | none | none |

Overlays and feedback, one style each (nothing is shared):

| What | Where | Style |
|---|---|---|
| Modal | Equipment list (add) | centered, `rounded-xl`, dark backdrop |
| Drawer | Equipment detail (edit) | right side, 380px, underline-only fields |
| Danger dialog | Equipment detail (delete) | centered, `rounded-2xl`, red icon, "Keep it / Yes, delete" |
| Native dialogs | Equipment list (delete), Loan log (return), Lend flow (`alert`) | `window.confirm`, `alert` |
| Toast A | Equipment list | dark slate, top right, check icon |
| Toast B | Loan log | emerald pill, bottom centre |
| Toast C | Borrower profile | black bar, bottom left, with Undo |
| Inline "Saved" | Settings, loan note | green box / button text |
| Tooltip | Equipment list icons (custom), Dashboard badges (native `title`) | two different kinds |
| Action menu | Borrower profile rows (kebab, vertical), Maintenance rows (`...`, horizontal) | two custom dropdowns |
| Popover | Maintenance filters | checkbox list + chips, closes on outside click |
| Bottom sheet | Maintenance (new ticket) | slides from the bottom, 640px wide |
| Command palette | Header, Ctrl + K | centred, grouped results, arrow keys |
| Notification dropdown | Header bell | cyan tabs, "Mark all as read" |
| Photo viewer | Equipment detail (full screen, arrows, wraps) and Ticket detail (single popup) | two different lightboxes |
| Banners | Dashboard (amber box), Loan detail (red left border), Equipment detail (yellow box) | three styles for the same idea |
| Loading | Equipment list (spinner), Reports (skeleton), Profile (pulsing text) | three styles |
| Empty | Equipment list (plain text row), Loan log (emoji + text), Profile (dashed box) | three styles |
| Error | Borrower profile (dashed box with Retry) | one-off |

Words and formats that disagree:

- Terms: a problem is a "ticket" in Maintenance, a "problem" in its form and a "note" on a loan. "Equipment" in the sidebar and list, "Total items" / "Borrowed" / "Late" / "In repair" on the Dashboard, "Asset" in the detail dialog and "On loan" / "Overdue" in the log.
- Dates: `5 Oct` (Dashboard), `05/10/26` (Loan log), `28 Sep 2026` (Equipment detail), `2026-10-05` (Loan detail), "3 days ago" (Profile).
- Letter case: "Add equipment", "Mark returned" (log), "Mark Returned" (profile menu), "EXPORT" (Reports).
- Control size: `h-14` search box in the header and `h-8` (Reports), `py-2` (most buttons), `py-3` fields (Lend flow), `py-1.5` (Loan log).
- Icons: lucide everywhere, plus emoji (🔍 404, 📭 empty log, ✉ ☎ on the profile) and inline SVG (charts).

Shared bits that are also not in one place:

- The sidebar uses `blue-600` for the active link while pages use their own accent.
- Pagination: text Previous / Next on Equipment, numbered squares on Loan log.
- Search box: only on Equipment, with its own icon and focus ring.
- Page padding and the gap under the title differ from page to page.
- No component is shared: buttons, inputs, badges, tables and tabs are all written inline.
- No design tokens: colours are raw Tailwind palette names (gray, slate, zinc, neutral).
