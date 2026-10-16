# Design review service (standalone) — design

Date: 2026-10-16. Status: agreed, not built.

## Why

The sync review (`reference/review-service.md`) works today as an API inside each app: a Vercel function with KV for the MVP, and a planned
Express + Mongo route in `system-setting-be` for swt. Every project that uses the Figma skill would need its own API, store, secrets and auth,
and swt would need backend work and a pipeline change. The skill is meant for other and upcoming projects, each with a different setup.

So the review store becomes **one standalone service**, in the role Chromatic plays for Storybook: a project plugs in with a project token,
and the review and decision history live in the service, per project. Internal only for now; multi-tenant is possible later.

## Principle

**The project computes, the service stores.** Everything that needs the project's code stays in the project: reading Figma, the diff, the
items, the usage scan, and rendering the real components. The service never needs a project's code, its Storybook build or screenshots.

| Project side (skill + tool + `/review` page) | Service |
|---|---|
| Read Figma, diff, items (exists today) | Projects, project tokens, reviewer accounts |
| Usage scan: component + prop -> file -> route (`usage.json`, built with the app) | Review documents (items, answers, status, version, audit) |
| `/review` page: renders the real components, before and after, and the usage list | A small usage summary per publish (text) |
| Reads the answers, applies them, marks the review applied | Decision history, per project |

## Decisions taken

- **Store:** MongoDB. Now MongoDB Atlas (free tier) behind the service on Vercel. Later, after approval, the service and its database move to
  the VPS (Docker) together: a VPS Mongo is not reachable from Vercel. The move starts with an empty database (no data migration).
- **No Atlas-only features** (Atlas Search, Triggers, Data API). Plain queries and indexes only, so the same code runs on a self-hosted Mongo.
- **Indexes are created by the code** at start (`createIndexes`), never in the Atlas dashboard, so a fresh database gets them.
- On the VPS: a database of its own and a Mongo user with `readWrite` on that database only, not inside the swt app database.
- **Stack: the same as swt and the MVP**, so the team can run and maintain it like its other services. Frontend React 18 + rsbuild +
  Tailwind 3 (and the design system's own components); backend Express + Mongoose. On Vercel the Express app is exported as one function
  (`api/index.js`, the Mongoose connection cached between calls) and the frontend is the static build; on the VPS the same app calls
  `app.listen` in Docker. No framework that exists only for the Vercel phase.
- **One repo for now** (`web/` + `server/`), so the API and the UI change in one commit. The VPS deploy follows swt: **two containers**,
  a frontend (`design-review-fe`, the static build) and a backend (`design-review-be`), like `swt-fe` and the swt micro backends, each with
  its own image. The repo can be split later without changing the images.
- **Every document carries `orgId`** from day one, with one org for now. No tenancy UI.
- **Projects are independent.** Each project has its own Figma file (`figmaFileKey`); the MVP and swt share one Figma file only because the MVP
  is an experiment. No "design system" grouping above projects for now.
- **Before/after of a whole page needs a preview build.** The MVP has one (Vercel preview deployments). swt has staging and production only,
  nothing below staging, so swt gets no page-level before/after (see "Previews").

## Data model (database `design_review`)

| Collection | Fields | Index |
|---|---|---|
| `projects` | `orgId, key, name, figmaFileKey, storybookUrl, reviewUrl, allowedOrigins[], hasPreviewBuilds, createdAt` | unique `{orgId, key}` |
| `tokens` | `projectId, label, hash, createdAt, lastUsedAt, revokedAt` (the token itself is shown once, only its hash is kept) | unique `hash` |
| `users` | `orgId, email, name, role: admin \| member, passwordHash, mustChangePassword, createdAt` (an admin manages everything and may review every project) | unique `{orgId, email}` |
| `memberships` | `userId, projectId` (a member reviews only these projects) | unique `{userId, projectId}` |
| `reviews` | the document of today (`component, jsxName, storyId, figmaNode, figmaPage, code, readAt, sourceHash, status, version, items, answers, audit`) plus `projectId` and `usage` | unique `{projectId, slug}` |

`usage` on a review: `{ at, byItem: { "removed-prop:searchable": { count, routes: ["/loans/new", "/reservations/new"] } } }`, sent with each
publish. It is the evidence for a decision (what was affected when it was taken) and, for `keep-deprecated`, the burn-down across syncs.

## API (`/api/v1`)

| Route | Auth | What |
|---|---|---|
| `POST /auth/login` | email + password | session token (signed, short-lived, e.g. 8 h) |
| `POST /auth/password` | session | change password (required when `mustChangePassword`) |
| `GET /projects/:project/reviews` | session or project token | `{ reviews: [summary], counts }` |
| `GET /projects/:project/reviews/:slug` | session or project token | the full document |
| `PUT /projects/:project/reviews/:slug` | project token | publish (same rules as today: same `sourceHash` keeps the answers) |
| `POST /projects/:project/reviews/:slug/decision` | session (reviewer of that project) | `{ answers, version }`; `by` comes from the session, not the body |
| `POST /projects/:project/reviews/:slug/applied` | project token | marks the review applied |

- `Authorization: Bearer <token>` for both. The **project token never reaches a browser**: it is for the tool (dev machine or CI), kept in
  `.figma-dump/review-api.json` / env, never in a committed file or a page bundle.
- CORS: a project's `/review` page may call the service only from that project's `allowedOrigins`.
- Errors and status codes as today (`400 401 403 404 409 502 503`). The logic stays `reviewCore.mjs` (`handle(request, { store, env })`)
  with a `mongoStore` (Mongoose; the document's own `version` is the lock: saved with `{ projectId, slug, version: expected }` in the filter, no match is `409`) added and a project
  scope around it. Express is a thin wrapper, as `api/review.mjs` is today.

## Decisions and what they mean

| Choice | Meaning | When the review is applied |
|---|---|---|
| `follow-figma` | the property goes; every usage is migrated (codemod or AI, done by the dev) | when the usage scan shows 0 usages left |
| `keep-deprecated` | `@deprecated` in code, new pages may not use it (slice-scan already blocks it); needs a `migrateBy` date | the deprecation is in code; the usage count is tracked on each sync until 0 |
| `keep` (Figma changes) | rare; a task for the designer | stays open until Figma changes and a new `sourceHash` is published |

A decision is taken per component change, not per page; the page list helps decide and then serves as the migration checklist.

## The project's `/review` page

The page of today gains the usage list and logs in against the service:

1. Login form (service account), then the list of reviews of this project.
2. A review: its items, and for each item the pages that use it (from `usage.json`).
3. Previews:
   - **Component level** (every project): a property removed in Figma is shown with the live component, prop on and off (as today). A visual
     change uses the deployed Storybook, production vs the preview deployment of the candidate branch (swt's Storybook is on Vercel, so swt
     has this).
   - **Page level, with preview builds** (the MVP): the route in two frames, production vs the candidate's preview deployment.
   - **Page level, without preview builds** (swt): the current page only, with the affected component highlighted. Highlighting needs a
     `data-ds="<Component>"` attribute on the components (a dev-repo change).
4. The decision is posted with the reviewer's session; the history comes from the service.

## The service UI (small)

Login, change password, projects (create, `allowedOrigins`, links), tokens (create, show once, revoke), members (add a reviewer with a
temporary password that must be changed at first login, so no email provider is needed), and the decision history per project with links to
the project's `/review` page.

## The skill

`reviewClient` takes `{ url, project, token }` (`.figma-dump/review-api.json` or `REVIEW_API_URL`, `REVIEW_PROJECT`, `REVIEW_API_KEY`). The
local file store stays as the fallback when no service is configured. `reviewSync --publish` also sends the usage summary.

## Phases

1. **Demo (MVP, Vercel + Atlas):** the service with the API, login and a minimal UI; the MVP `/review` page on the service; usage scan and
   list; the `Select searchable` case end to end (publish, two affected pages, before/after, decision, history).
2. **Approval:** service and database on the VPS (Docker), fresh database.
3. **swt:** project and token, `/review` in the staging build, component-level previews, current-page highlight.
4. **Multi-tenant**, only if it becomes a product.

## Not in scope

Screenshots or Storybook builds stored in the service; page-level before/after for projects without preview builds; email (invites, resets);
SSO; tenancy UI.

## Also agreed

- The `/review` page is React, as the MVP and swt are. A project on another stack writes its own page against the same API.
- The first admin is created by a seed script in `server/` (email and a temporary password from the environment, `mustChangePassword: true`);
  that admin creates the projects, tokens and reviewers in the service UI.
