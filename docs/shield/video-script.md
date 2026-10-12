# Video script: Figma → Storybook skill (for the PM)

Audience: the PM who proposed the idea (ex-Android, full-stack, designer). Technical, so no
design-system 101. Language: English. Target: about 6:45 (a 5:30 cut is at the bottom).
Style: motion graphics in Remotion, real screenshots for results. No screen recording.

Every number below was measured in the tests (sources in brackets). Nothing is estimated.

| # | Scene | Time |
|---|---|---|
| 1 | One door | 0:25 |
| 2 | The pipeline | 0:30 |
| 3 | The pieces | 1:00 |
| 4 | The Figma index: where to jump | 1:00 |
| 5 | Foundation results | 0:45 |
| 6 | Components: Figma vs Storybook (Button, Input) | 1:25 |
| 7 | A run in screenshots | 0:15 |
| 8 | Token savings | 0:30 |
| 9 | Three starting points | 0:30 |
| 10 | Limits and next | 0:30 |

---

## 1. One door (0:00 – 0:25)

**Visual:** Figma file on the left, Storybook on the right. Where an "export tokens" step used
to sit between them, the gap closes into one arrow labelled "skill".

**Narration:**
"Getting a design system from Figma into code usually has a hand-off in the middle: export the
tokens, wire them in, rebuild the components, check them by eye. This skill is one door instead.
It reads Figma directly, generates tokens, Foundations pages and components in Storybook, and
proves that what it built matches Figma."

---

## 2. The pipeline (0:25 – 0:55)

**Visual:** left-to-right diagram, each box appears as it is named: Figma Desktop + Desktop Bridge
plugin → figma-console MCP → local receiver → scripts → project (tokens, Tailwind theme,
Foundations, components) → proof.

**Narration:**
"Figma Desktop runs a plugin, the Desktop Bridge. Through the figma-console MCP the AI can run
JavaScript inside the Figma file. Anything big is written straight to disk by a small local
server, bundled scripts turn those files into code, and a last stage checks the result against
Figma. Foundation first, then components."

---

## 3. The pieces (0:55 – 1:55)

**Visual:** one card per piece, about 10 seconds each, the real file or output on screen. The
last line is a single strip for the pieces that get one sentence.

| Piece | On-screen | Narration |
|---|---|---|
| **dumpServer.py** | terminal: `dumpServer: listening on 127.0.0.1:9232`, then `.figma-dump/` filling with files | "A tiny local server on port 9232. The plugin posts big reads to it and they land as files, so they never pass through the AI's context. It also serves the plugin scripts." |
| **Loader + ARGS** | the 3-line loader snippet, `ARGS = { NAMES: ["Button"], DEPTH: 8 }` | "Plugin scripts used to be pasted into every call, about 4 KB each. Now the call fetches the script from the server and passes ARGS, the parameters. About 280 bytes." |
| **toBruecke** | `Wrote src/tokens/design_token.json: 903 variables in 10 collections + styles` | "We read variables, scopes and styles from Figma ourselves and write them in the Tokens Brücke shape. Anything that already consumes a Brücke export keeps working, with nobody exporting anything." |
| **buildTokens** | tokens.css, tailwind.tokens.js, Foundations pages listed | "buildTokens turns that file into CSS variables, a Tailwind 3 theme and the typo-* text-style classes; buildTokenDocs writes the Foundations pages." |

**One-sentence strip (text only, 8 seconds):**
`inventory` lists every page and set (106 pages, 219 sets in SHIELD) · `analyzeComponent` and
`variantClasses` say what drives what and which token class each variant uses · `initStorybook`
detects the stack and adds only what is missing · `checkConfig` maps collection roles.

---

## 4. The Figma index: where to jump (1:55 – 2:55)

This is the main point of the work: an update must know where to look in Figma, with no scan.

**Visual:** `tokens.index.json` on screen; one entry highlighted and traced with an arrow:

```
+Theme/color/background/primary/hovered   Figma name
  id  VariableID:4509:19190               Figma variable ID   ← the jump target
  → --theme-color-background-primary-hovered
  → bg-primary-hovered
  → {Color.rose.950}
  → Light #4c0519 / Dark #fecdd3
```

then `figma-index.json`: `Button → nodeId 7:21282, page Button, 360 variants, story actions-button`.

**Narration:**
"The index is the map back into Figma. Every one of the 714 variables has its Figma ID next to
its CSS variable, its classes and its values; so do the 58 text styles and 23 effects. Each built
component has a pointer too: the Button is node 7:21282, on the Button page, 360 variants. When
the design changes, the skill does not scan the file. It checks that the IDs still resolve, then
reads exactly that node. We tested it: reading the Button by its ID returned the same file as
reading it by name, and a made-up ID was reported missing right away."

**Accuracy notes (keep on a caption or in the voice, do not drop):**
- IDs are stable inside one Figma file. A duplicated file gets new IDs, so after a copy the pointers
  are rebuilt; `resolveIds` shows that.
- An update still re-reads the foundation file (one read of the variables, seconds). The IDs remove the
  scan for components and the guesswork about where a token came from.
- The saving from skipping the page scan (the cold-file case that timed out) is not measured yet.
  The test pages were already loaded: 0.9 s by ID vs 1.4 s by name.

**Numbers:** 714 / 714 tokens, 58 / 58 text styles, 23 / 23 effects with IDs; 10 of 10 sampled IDs
resolved to the expected name; 1 invalid ID flagged.

---

## 5. Foundation results (2:55 – 3:40)

**Visual:** real Storybook screenshots, Light then Dark toggle on Colors. Slow pan over each page:
Colors (palette ramps and semantic tokens), Typography, Spacing and Sizing, Radius and Borders,
Effects. Where possible, Figma's Graphene variables panel beside it.

**Narration:**
"What comes out of the foundation step: Graphene's 903 variables in 10 collections become 714 CSS
variables, with Dark as a data-theme override. The colour palette and semantic tokens, the text
styles, spacing and sizing, radius and borders, and the effects: six Foundations pages, generated,
not written by hand."

**Numbers:** 903 variables / 10 collections; 714 CSS variables; 58 text styles; 23 effects; 6 pages.

---

## 6. Components: Figma vs Storybook (3:40 – 5:05)

**6a. Button (3:40 – 4:30)**
**Visual:** the Figma Button set (360 variants) collapses into a props table: `kind` ×4,
`status` ×6, `size` ×3, `loading`, `disabled`, `prefixIcon`, `suffixIcon`; "State" shown as hover
and press, not a prop. Then the comparison sheet, Figma on top and Storybook below.

**Narration:**
"The Button is 360 variants in Figma. In code it is one component. Kind, status and size become
props; hover and press are CSS states. Top: Figma. Bottom: Storybook. Twenty-four combinations of
kind and status, side by side."

**Proof panel (each line turns green):**
1. Figma vs Storybook sheet, 24 combinations: match.
2. `interact.mjs`: hover the filled primary button. Initial `rgb(139, 8, 54)`, hover `rgb(76, 5, 25)`.
   The token `+Theme/color/background/primary/hovered` is `#4c0519`. Equal.
3. Disabled and loading colours read the same way and equal their tokens.
4. `checkUtilities`: every class resolves to CSS.
5. `renderCheck`: every story opens, 18 pages, 0 errors.

**6b. Input (4:30 – 5:05)**
**Visual:** the two Input comparison images: statuses (default, info, success, warning, danger, each
with placeholder and filled value) and sizes (sm, md, lg, plus disabled and read-only). Figma on top,
Storybook below. The focus image is not used.

**Narration:**
"Input is 84 variants, same method. Statuses, sizes, disabled and read-only all match Figma, with
the label, info icon and caption. A fresh agent built it using only the skill."

---

## 7. A run in screenshots (5:05 – 5:20)

**Visual:** four stills in a row, each with a one-line caption: Figma Button set open → the loader
call and the files landing in `.figma-dump/` → `build-storybook` finishing → the Button story.
No narration beyond the captions.

---

## 8. Token savings (5:20 – 5:50)

**Visual:** a before/after bar per measured item, then one baseline number.

| Item | Before | After |
|---|---|---|
| Plugin script per call | pasted, about 4 KB | loader, about 280 bytes |
| Component inventory in the chat | about 12 KB | about 200 bytes (the list is saved to disk) |
| Button read (360 variants) | would not fit in a chat | 959,930 bytes saved to disk |
| Foundation reads | in the chat | 1.4 KB + 51 KB + 56 KB saved to disk |
| Token export | in the chat | 638 KB saved to disk |

**Narration:**
"All the big data now goes to disk. The first test of the skill, building Input with a fresh agent,
used about 184 thousand tokens. Most of it came from reading a 775-line analysis output, pasting
the same 5 KB script again and again, and the agent writing its own browser helper. Those gaps are
closed in the skill."

**Honesty note:** 184 thousand is the baseline from before the fixes. The later runs (empty folder,
boilerplate, Vite) were done inline, with knowledge of the first run, and the session's token counter
is not a clean per-run measure, so no new total is claimed. A like-for-like number needs a fresh agent
on the same Input task.

---

## 9. Three starting points (5:50 – 6:20)

**Visual:** three cards, then the `initStorybook` report in a terminal.

| Case | What the project has | What we tested |
|---|---|---|
| **A. Project without Storybook** | an app or boilerplate | the MVP from the commit before it had Storybook, on **rsbuild** and again on **Vite**: Storybook 18 pages, 0 errors; the app builds; 0 of 167 colour classes it uses went missing; Button props in the AI manifest |
| **B. Storybook already exists** | `.storybook/` | update tokens or one component (the Button and Input pilots) |
| **C. Empty folder** | nothing | starter template (React 18, rsbuild, Tailwind 3), then as A: 6 Foundations pages, Button identical to the first run |

**Narration:**
"Three starting points. A project with no Storybook: the skill detects the stack and adds only what
is missing; it never overwrites your files. We ran it on the MVP before it had Storybook, on rsbuild
and on Vite. A project that already has Storybook: update tokens or one component. And an empty
folder: a starter template, then the same flow."

---

## 10. Limits and next (6:20 – 6:50)

**Visual:** a short list, supported items green, others grey; then one roadmap line.

**Narration:**
"Today it supports React 18 with Tailwind 3. Tailwind 4, projects without Tailwind, and Next.js are
not supported yet: the skill stops and says why, because the workflow differs there and there is no
template. Webpack, and Dark mode in the component comparison, are not tested yet. Next: the other
stacks, and more components through the same pipeline."

---

## Cut list for about 5:30
Drop scene 7, cut scene 3 to the three cards dumpServer, loader and toBruecke (no strip), cut scene 8
to the table only (no narration), and trim scene 5 to Colors and Typography.

## Not in the video (not approved, not included)
The self-testing story (bugs found and fixed), the designer findings, the "read-only" statement,
a Dark-mode toggle beyond Colors, the glossary end card, the before/after-manual timing, and the
AI-builds-a-page demo (to be tried later on one MVP page).

## Assets
Captured and listed per scene in `docs/shield/video-assets/README.md` (screenshots, terminal text and PNG, Figma exports).
Optional and not captured: the Graphene variables panel in Figma (scene 5).
