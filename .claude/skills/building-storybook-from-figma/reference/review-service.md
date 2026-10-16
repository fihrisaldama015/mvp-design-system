# The design review service (shared sync reviews)

When a component that already exists is synced from Figma, `reviewSync.mjs` finds what Figma no longer has (`reference/existing-component.md`).
Someone who is not the developer (a designer, a product owner) decides what to do with it, on the project's `/review` page. This is the
service behind that page: **one JSON document per component and project**, an HTTP API, and a MongoDB database (`design_review`).
The service is its own repo (`design-review`, Express + Mongoose); this skill is a client of it.

Why not a file or git: apps are static builds / Docker images, so a file written on the server disappears at the next deploy, and a designer
cannot commit (a commit to a deploy branch triggers a deploy). So the documents live in a **database**, and the sync tool and the page talk to the same API.

## The contract

Base `${url}/projects/${project}/reviews`, where `url` ends in `/api/v1`. Auth: `Authorization: Bearer <token>` (a project token for the tool, a
session for a reviewer). `:slug` is the lowercase, dash-separated component name (`Input - Single Select/Base` is `input-single-select-base`).

| Route | Auth | What |
|---|---|---|
| `POST /auth/login` | email + password | session token (signed, short-lived, 8 h) |
| `POST /auth/password` | session | change password (required when `mustChangePassword`) |
| `GET /projects/:project/reviews` | session or project token | `{ reviews: [summary], counts }` |
| `GET /projects/:project/reviews/:slug` | session or project token | the full document (404 when there is none) |
| `PUT /projects/:project/reviews/:slug` | project token | publish (same `sourceHash` keeps the answers; `400` when the URL slug is not the slug of `component`, or `items` is malformed) |
| `POST /projects/:project/reviews/:slug/decision` | session (reviewer of that project) | `{ answers, migrateBy, version }`; `by` comes from the session, not the body |
| `POST /projects/:project/reviews/:slug/applied` | project token | marks the review applied (`409` while still pending or already applied) |

Errors are `{ "error": "..." }` with `400 401 403 404 409 502 503`. The tool uses `list`, `get`, `publish`, `applied`; the decision route is for reviewers only
(the agent never answers for them).

Document fields the skill reads or sends: `component, jsxName, storybookUrl, storyId, figmaFileKey, figmaNode, figmaPage, code, readAt, sourceHash, items`
(each removal carries `callers` = number of uses and `callerRoutes` = their route paths), `usage` (`{ at, byItem: { itemId: { count, routes: [paths] } } }`,
sent with every publish), `previewUrl` (from `--preview-url`), and from the service `status, version, answers, migrateBy, usageHistory, audit`.
`usageHistory` is the burn-down: each publish appends `{ at, counts }` (last 50). `usage` never enters `sourceHash`, so a code change does not look like a Figma change.

## Config (per machine, never in git)

Environment `REVIEW_API_URL`, `REVIEW_PROJECT`, `REVIEW_API_KEY`, or the git-ignored file `.figma-dump/review-api.json`:

```json
{ "url": "https://<service>/api/v1", "project": "mvp", "token": "drp_...", "reviewPage": "https://<app>/review" }
```

`key` is accepted as an alias of `token`; `reviewPage` only feeds the messages that tell the dev where reviewers answer.

**Token handling.** The project token is shown once when an admin creates it in the service UI; the service keeps only its hash. Never commit it,
never put it in a page bundle or a `VITE_`/`PUBLIC_` variable, never paste it in a chat. A revoked token is `401`; a token of another project is `403`.
A redirect is never followed (the token would travel to wherever it points), and a Vercel Authentication wall is reported by name.

## The local fallback and its limits

With nothing configured the same review rules run in this process on files in `.figma-dump/review-store/` (`reviewCore.mjs`). It is for trying the flow:
nobody can answer there (there is no page and no accounts), the files live on this machine only, and nothing is project-scoped. Say so out loud when a
review was published locally; it is not a review.

## Where it runs (phases)

1. **Now: Vercel + MongoDB Atlas** (the demo). The service is a serverless function over Atlas; no Atlas-only features are used.
2. **Later: a VPS** (two containers, `design-review-fe` and `design-review-be`, a fresh database). Only `url` in the config changes.
3. swt gets its own project and token; its `/review` page is built into staging only.

## Decisions and what "applied" means

| Choice | Meaning | `--done` passes when |
|---|---|---|
| `follow-figma` | the property goes; every usage is migrated (codemod or AI, done by the dev) | the usage scan shows 0 uses left; otherwise `"<prop>" still used on <n> page(s): <paths>. Migrate them first.` |
| `keep-deprecated` | `@deprecated` in code, new pages may not use it; needs a `migrateBy` date (`YYYY-MM-DD`) | the deprecation is in code; `--done` prints the burn-down (uses now vs at publish), tracked on each sync until 0 |
| `keep` (Figma changes) | rare; a task for the designer | never: `Waiting for Figma: "<prop>" was kept, so the design changes first. Publish again after Figma is updated.` The review stays open until Figma changes and a new `sourceHash` is published |

`--done` also refuses while any removal is unanswered, and refuses (rather than passing) when the usage scan itself fails. Then it calls `applied`; the
service's `409` text (still pending, already applied) is shown as the error. `reviewState` shows `waiting-for-figma` when every unapplied answer is `keep`.

A decision is taken per component change, not per page; the usage list helps decide and then serves as the migration checklist.

## Usage scan and its limits

`callers`, `callerRoutes` and `usage` come from `usageScan.mjs` (routed pages that import design-system components), not from grep. It does not follow
lazy pages, route tables that are not plain `<Route element={<Page />}>` JSX, member tags (`<UI.Select>`) or barrel imports; a route with parameters is
previewed only when `review.routeSamples` in `figma-tokens.config.json` gives a concrete path. A missed use is possible, so read `--done` as "the scan sees none".

## Limits of page-level before/after

The page shows a route twice (current app and `previewUrl`) only for projects with preview builds (the MVP on Vercel). swt has no preview builds: there the
page shows the current page only, with component-level previews from the deployed Storybook; highlighting the affected component would need a `data-ds`
attribute on the components (a dev-repo change). A preview behind Vercel Authentication shows a login, not the page: turn Deployment Protection off for previews
(every frame has an "Open in a new tab" link).
