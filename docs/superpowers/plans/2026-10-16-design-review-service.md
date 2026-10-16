# Design review service (demo phase) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A standalone review service (projects, project tokens, reviewer accounts, review documents, decision history) on Vercel + MongoDB Atlas, with the MVP's `/review` page and the Figma skill moved onto it, and the `Select searchable` case working end to end.

**Architecture:** New repo `design-review` (npm workspaces `server/` + `web/`). `server/` is an Express app (`createApp`) that Vercel runs as one function and the VPS later runs with `app.listen`; review rules are a pure module (`reviewLogic.mjs`) shared with the skill's local fallback. The MVP keeps everything that needs its code: the usage scan (built into `usage.json`), live previews and the `/review` page, which logs in against the service.

**Tech Stack:** Node 22, Express 4, Mongoose 8, bcryptjs, jsonwebtoken, node:test + supertest + mongodb-memory-server; web: React 18, rsbuild, Tailwind 3, the design system via pull-ui, lucide-react.

**Spec:** `docs/superpowers/specs/2026-10-16-design-review-service-design.md`

## Global Constraints

- Same stack as swt and the MVP: React 18 + rsbuild + Tailwind 3; Express + Mongoose. No Next.js, no framework only for Vercel.
- MongoDB database `design_review`. No Atlas-only features (Atlas Search, Triggers, Data API). Indexes are created by the code at start (`ensureIndexes()`), never in a dashboard.
- Every document carries `orgId` (one org for now: env `ORG_ID`, default `"blue-silo"`).
- The project token never reaches a browser. It is stored only as a SHA-256 hash and shown once at creation. Format `drp_` + 32 random bytes base64url.
- Reviewer identity comes from the session (signed JWT, 8 h, env `SESSION_SECRET`), never from the request body.
- Passwords: bcryptjs, cost 10; a new password is at least 10 characters.
- API base path `/api/v1`. Errors are `{ "error": "..." }` with `400 401 403 404 409 502 503`, as today.
- UI copy in plain English, sentence case; icons from `lucide-react` only. Pages use design system components (no hand-written button, input, table...).
- Two containers later on the VPS (`design-review-fe`, `design-review-be`); this plan stops at Vercel and adds no Dockerfiles.
- Skill script edits are made in `.claude/skills/building-storybook-from-figma/scripts/` and copied with `npm run sync-skill`.

## Decisions this plan adds to the spec

- **Optimistic lock:** the document's existing `version` field, not Mongoose `__v` (`versionKey: false`). Write with `{ projectId, slug, version: expected }` in the filter; no match is `409` with the current document.
- **Roles:** `users.role` is `admin | member`. An admin manages everything and may review every project; a member reviews the projects they have a membership for. Memberships carry no role.
- **Admin routes** (not in the spec's table): projects, tokens, members, history, `GET /me` (Task 4, Task 5).
- **`keep-deprecated` needs `migrateBy`** (`YYYY-MM-DD`) per item, stored in `doc.migrateBy`.
- **Burn-down:** every publish appends `{ at, counts: { itemId: n } }` to `doc.usageHistory` (kept across cycles, last 50).
- **Page before/after:** the tool may publish `previewUrl` (the candidate's preview deployment origin). The page shows the route from the current app next to the same route on `previewUrl`.
- The skill's KV store, `api/review.mjs`, `npm run review:api` and the `/api/review` proxy are removed. The local file store stays only as the tool's fallback when nothing is configured.

## Review Focus

1. **Vercel preview behind Vercel Authentication:** the "after" frame shows a Vercel login, not the page. Expected: every frame has an "Open in a new tab" link and a note telling the dev to turn Deployment Protection off for previews (Task 10 test `page preview shows open links`).
2. **A route with parameters** (`/loans/:id`) uses the component. Expected: it is listed. It is previewed only when `review.routeSamples` in `figma-tokens.config.json` gives a concrete path; otherwise "No preview: add a sample path" (Task 8 test `param route without sample has no url`).
3. **Session expires while answering.** Expected: `401` with `"Your session expired. Log in again."`; the page keeps the unsaved choices and shows the login form (Task 3 test `expired session is 401`, Task 10 keeps the draft in state).
4. **A token used on the wrong project, or a revoked token.** Expected: `403` / `401`, never a write (Task 5 tests `token of project A cannot publish to B`, `revoked token is 401`).
5. **Two reviewers save at the same moment.** Expected: exactly one succeeds and the other gets `409` with the current document (Task 5 test `concurrent decisions: one 409`).

---

## File structure

New repo `/home/aldam/WORK/BLUE_SILO/TRMS/Repo/design-review`:

| Path | Responsibility |
|---|---|
| `package.json` | npm workspaces `["server", "web"]`, scripts `test`, `dev:server`, `dev:web`, `build` |
| `server/src/reviewLogic.mjs` | copy of the skill's pure review rules (Task 1), unchanged |
| `server/src/models.mjs` | Mongoose schemas `Project, Token, User, Membership, Review` + `ensureIndexes()` |
| `server/src/db.mjs` | `connect(uri)`: one cached connection per process, then `ensureIndexes()` |
| `server/src/auth.mjs` | password hashing, sessions, project tokens, `authenticate` middleware, `canUseProject` |
| `server/src/routes/auth.mjs` | `/auth/login`, `/auth/password`, `/me` |
| `server/src/routes/projects.mjs` | projects, tokens, members (admin) |
| `server/src/routes/reviews.mjs` | reviews, decision, applied, history |
| `server/src/cors.mjs` | allowed origins: `WEB_ORIGIN` plus every project's `allowedOrigins` |
| `server/src/app.mjs` | `createApp({ env })`: wires the above, error handler |
| `server/src/listen.mjs` | local / VPS entry: connect, `app.listen(PORT)` |
| `server/scripts/seed.mjs` | first admin from env |
| `server/test/*.test.mjs` | node:test + supertest + mongodb-memory-server (`test/helpers.mjs`) |
| `api/index.mjs`, `vercel.json` | the Vercel function and rewrites; static `web/build` |
| `web/` | service UI (rsbuild): login, password, projects, tokens, members, history |

This repo (`mvp-design-system`):

| Path | Responsibility |
|---|---|
| `.claude/skills/building-storybook-from-figma/scripts/reviewLogic.mjs` | pure review rules (new) |
| `…/scripts/reviewCore.mjs` | local file-store wrapper on `reviewLogic` (KV removed) |
| `…/scripts/usageCore.mjs` | pure: `usageFor(usage, jsxName, item)` |
| `…/scripts/usageScan.mjs` | scan routed pages -> `src/app/review/usage.json` |
| `…/scripts/reviewClient.mjs`, `reviewSync.mjs`, `reviewState.mjs`, `doctor.mjs` | the service config, usage summary, `--done` gates |
| `…/scripts/__tests__/*.test.mjs` | tests for the four modules above |
| `…/reference/review-service.md` | rewritten for the service |
| `src/app/review/serviceClient.js` | browser client for the service |
| `src/pages/Review.js`, `src/pages/review/PagePreview.js` | the page |

---

### Task 1: Pure review rules (`reviewLogic.mjs`) in the skill

**Files:**
- Create: `.claude/skills/building-storybook-from-figma/scripts/reviewLogic.mjs`
- Modify: `.claude/skills/building-storybook-from-figma/scripts/reviewCore.mjs` (use the new module; delete `kvStore`, `storeFromEnv`)
- Delete: `api/review.mjs`; the `/api/review` rewrite in `vercel.json`; `review:api` in `package.json`; the proxy in `rsbuild.config.js`; `…/scripts/reviewApi.mjs`
- Modify: `package.json` `test` script to `node --test '.claude/skills/*/scripts/__tests__/*.test.mjs'`
- Test: `.claude/skills/building-storybook-from-figma/scripts/__tests__/reviewLogic.test.mjs`

**Interfaces:**
- Produces (all pure, no I/O; `at` is an ISO string passed in):
  - `CHOICES = ["follow-figma", "keep-deprecated", "keep"]`, `slug(s) -> string`, `statusOf(doc) -> "pending"|"answered"|"applied"`, `summary(doc) -> object` (same fields as today)
  - `publish(prev: doc|null, body, at) -> Result`
  - `decide(doc, { answers, migrateBy = {}, version, by }, at) -> Result`
  - `markApplied(doc, at) -> Result`
  - `Result = { ok: true, status: 200|201, doc } | { ok: false, status: 400|409, error: string, current?: doc }`
- `publish` keeps today's rules (same `sourceHash` and not applied keeps answers; otherwise a new cycle with `version + 1`) and adds: optional `usage` and `previewUrl` (must start with `https://` or `http://localhost`) copied onto the doc; `usageHistory` appended with `{ at, counts }` from `body.usage.byItem` (last 50 kept, carried across cycles).
- `decide` keeps today's validation and adds: a `keep-deprecated` answer needs `migrateBy[itemId]` matching `/^\d{4}-\d{2}-\d{2}$/`, else `400` `Choose a migrate-by date for "<id>".`; a `null` answer also deletes `doc.migrateBy[id]`.

- [ ] **Step 1: Write the failing tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { publish, decide, markApplied } from "../reviewLogic.mjs";

const T = "2026-10-16T00:00:00.000Z";
const body = { component: "Input - Single Select/Base", sourceHash: "h1", items: [{ id: "removed-prop:searchable", kind: "removed-prop", prop: "searchable" }],
  usage: { at: T, byItem: { "removed-prop:searchable": { count: 2, routes: ["/reservations", "/reservations/new"] } } } };

test("first publish is 201, pending, version 1, history has the count", () => {
  const r = publish(null, body, T);
  assert.equal(r.status, 201); assert.equal(r.doc.status, "pending"); assert.equal(r.doc.version, 1);
  assert.deepEqual(r.doc.usageHistory, [{ at: T, counts: { "removed-prop:searchable": 2 } }]);
});
test("same sourceHash keeps answers; new sourceHash drops them", () => {
  const d = decide(publish(null, body, T).doc, { answers: { "removed-prop:searchable": "follow-figma" }, version: 1, by: "Dina" }, T).doc;
  assert.equal(publish(d, body, T).doc.answers["removed-prop:searchable"], "follow-figma");
  assert.deepEqual(publish(d, { ...body, sourceHash: "h2" }, T).doc.answers, {});
});
test("keep-deprecated without migrateBy is 400", () => {
  const r = decide(publish(null, body, T).doc, { answers: { "removed-prop:searchable": "keep-deprecated" }, version: 1, by: "Dina" }, T);
  assert.equal(r.status, 400); assert.match(r.error, /migrate-by date/);
});
test("keep-deprecated with migrateBy is stored", () => {
  const r = decide(publish(null, body, T).doc, { answers: { "removed-prop:searchable": "keep-deprecated" }, migrateBy: { "removed-prop:searchable": "2026-12-01" }, version: 1, by: "Dina" }, T);
  assert.equal(r.doc.migrateBy["removed-prop:searchable"], "2026-12-01"); assert.equal(r.doc.status, "answered");
});
test("stale version is 409 with current", () => {
  const r = decide(publish(null, body, T).doc, { answers: {}, version: 7, by: "Dina" }, T);
  assert.equal(r.status, 409); assert.equal(r.current.version, 1);
});
test("previewUrl must be http(s)", () => {
  assert.equal(publish(null, { ...body, previewUrl: "javascript:alert(1)" }, T).status, 400);
});
test("applied doc refuses decisions", () => {
  const a = markApplied(publish(null, body, T).doc, T).doc;
  assert.equal(decide(a, { answers: {}, version: a.version, by: "Dina" }, T).status, 409);
});
```

- [ ] **Step 2: Run, expect FAIL** — `node --test .claude/skills/building-storybook-from-figma/scripts/__tests__/reviewLogic.test.mjs` → `Cannot find module '../reviewLogic.mjs'`.

- [ ] **Step 3: Implement `reviewLogic.mjs`** by moving the document rules out of `reviewCore.mjs` `route()` (lines 57–147 today) into the three functions; `reviewCore.handle` keeps auth + `fileStore` and calls them. Header comment: "Pure review rules. Copied verbatim into design-review/server/src/reviewLogic.mjs; change both."

- [ ] **Step 4: Run all tests, expect PASS** — `npm test`.

- [ ] **Step 5: Remove the KV path** (files listed above), `npm run sync-skill`, `npm run build` passes, `node scripts/figma/doctor.mjs` shows no new FAIL.

- [ ] **Step 6: Commit** — `refactor: pure review rules in reviewLogic, KV path removed`.

---

### Task 2: Service repo, models, database, seed

**Files:**
- Create: `design-review/package.json`, `.gitignore` (`node_modules`, `.env*`, `build`, `.vercel`), `README.md` (how to run, env list)
- Create: `server/package.json` (`"type": "module"`; deps `express@4.21.2 mongoose@8.9.5 bcryptjs@2.4.3 jsonwebtoken@9.0.2 cors@2.8.5`; dev `supertest@7.0.0 mongodb-memory-server@10.1.3`; `"test": "node --test test/"`)
- Create: `server/src/reviewLogic.mjs` (copy from Task 1), `server/src/models.mjs`, `server/src/db.mjs`, `server/scripts/seed.mjs`
- Test: `server/test/helpers.mjs`, `server/test/models.test.mjs`

**Interfaces:**
- Produces: `models.mjs` exports `Project, Token, User, Membership, Review` and `ensureIndexes() -> Promise<void>`; `db.mjs` exports `connect(uri) -> Promise<mongoose.Connection>` (returns the same promise on later calls); `helpers.mjs` exports `startDb() -> Promise<{ uri, stop }>`, `makeAdmin(fields?) -> Promise<user>`, `makeProject(fields?) -> Promise<project>`.
- Schemas (all with `orgId: { type: String, required: true }`, `timestamps: true`, `versionKey: false`): fields and unique indexes exactly as the spec's table; `Review` uses `strict: false` for `items, answers, audit, usage, usageHistory, migrateBy` and has `projectId, slug` required; `User.role` enum `["admin","member"]`; `Token.hash` unique.
- `seed.mjs`: reads `MONGO_URL, ORG_ID, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD`; creates the admin with `mustChangePassword: true` when the email does not exist; prints `Admin <email> created` or `Admin <email> exists, unchanged`; exit 1 with a sentence when an env var is missing.

- [ ] **Step 1: Write the failing test** `models.test.mjs`: after `ensureIndexes()`, inserting two `Review` with the same `{ projectId, slug }` rejects with code `11000`; two users with the same `{ orgId, email }` reject; the same email in another org is accepted.
- [ ] **Step 2: Run, expect FAIL** — `npm -w server test` → module not found.
- [ ] **Step 3: Implement** `models.mjs`, `db.mjs` (cache the promise in a module variable; `ensureIndexes` = `Model.createIndexes()` for each), `helpers.mjs` (`MongoMemoryServer.create()`), `seed.mjs`.
- [ ] **Step 4: Run, expect PASS.** Also run `MONGO_URL=<memory uri> SEED_ADMIN_EMAIL=a@x.io SEED_ADMIN_PASSWORD=temp-password-1 node server/scripts/seed.mjs` twice: `created`, then `exists, unchanged`.
- [ ] **Step 5: Commit** — `git init`, `feat: service repo, models and seed`.

---

### Task 3: Auth (login, password, sessions, project tokens)

**Files:**
- Create: `server/src/auth.mjs`, `server/src/routes/auth.mjs`, `server/src/app.mjs`
- Test: `server/test/auth.test.mjs`

**Interfaces:**
- Produces from `auth.mjs`:
  - `hashPassword(p) -> Promise<string>`, `checkPassword(p, hash) -> Promise<boolean>`
  - `signSession(user, env) -> string` (JWT `{ sub: userId, org }`, `expiresIn: "8h"`)
  - `newProjectToken() -> { token, hash }`, `hashToken(t) -> string` (sha256 hex)
  - `authenticate(env)` Express middleware: `Authorization: Bearer drp_…` → `req.auth = { kind: "tool", projectId }` (token not revoked, `lastUsedAt` updated); other bearer → verify JWT → `req.auth = { kind: "user", user }`. Missing → `401 "Log in first."`; bad or expired JWT → `401 "Your session expired. Log in again."`; unknown or revoked token → `401 "Unknown or revoked project token."`. A user with `mustChangePassword` gets `403 "Change your password first."` on every route except `/auth/password` and `/me`.
  - `canUseProject(auth, project) -> boolean` (tool: same project id; admin: true; member: has a membership)
- `createApp({ env }) -> express.Application`; all routes under `/api/v1`; JSON body limit `1mb`; unknown route `404 "No such route."`; a thrown Mongo error → `502 "The store failed: <message>"`; no `SESSION_SECRET` or `MONGO_URL` → every route `503 "The review service is not configured (set …)."`.
- Routes: `POST /api/v1/auth/login { email, password }` → `200 { token, user: { id, email, name, role, mustChangePassword } }`, wrong → `401 "Wrong email or password."`; `POST /api/v1/auth/password { current, next }` → `204`, `next.length < 10` → `400`; `GET /api/v1/me` → the user object.

- [ ] **Step 1: Write the failing tests** (supertest on `createApp`): `login returns a token`; `wrong password is 401`; `mustChangePassword blocks /projects with 403`; `password change clears mustChangePassword`; `expired session is 401` (sign with `expiresIn: -1`); `no SESSION_SECRET is 503`.
- [ ] **Step 2: Run, expect FAIL.**
- [ ] **Step 3: Implement** `auth.mjs`, `routes/auth.mjs`, `app.mjs`.
- [ ] **Step 4: Run, expect PASS** — `npm -w server test`.
- [ ] **Step 5: Commit** — `feat: login, password change, sessions and project tokens`.

---

### Task 4: Projects, tokens, members (admin routes)

**Files:**
- Create: `server/src/routes/projects.mjs`
- Test: `server/test/projects.test.mjs`

**Interfaces:**
- Consumes: `authenticate`, `canUseProject`, `newProjectToken`, `hashPassword` (Task 3).
- `:project` in every URL is the project `key` (`/^[a-z0-9-]{2,40}$/`), looked up in the caller's org; unknown → `404`.
- Routes (users only; a tool token gets `403` on all of them):
  - `GET /projects` → admin: all; member: the ones with a membership. `POST /projects` (admin) `{ key, name, figmaFileKey?, storybookUrl?, reviewUrl?, allowedOrigins: string[], hasPreviewBuilds: boolean }` → `201`; duplicate key → `409`. `PATCH /projects/:project` (admin) same fields except `key`.
  - `GET /projects/:project/tokens` (admin) → `[{ id, label, createdAt, lastUsedAt, revokedAt }]` (never `hash`). `POST` `{ label }` → `201 { id, label, token }` (the only time `token` is returned). `DELETE /projects/:project/tokens/:id` → sets `revokedAt`, `204`.
  - `GET /projects/:project/members` (admin) → `[{ id, email, name }]`. `POST { email, name }` → creates the user when missing (`role: "member"`, `mustChangePassword: true`, generated 14-char temporary password) and the membership; `201 { user, tempPassword? }` (`tempPassword` only when the user was created). `DELETE /projects/:project/members/:userId` → `204`.
  - `allowedOrigins` entries must be origins (`new URL(o).origin === o`), else `400`.

- [ ] **Step 1: Write the failing tests:** `admin creates a project`; `member cannot create a project (403)`; `token is returned once and listed without hash`; `DELETE token sets revokedAt` (the 401 on use is Task 5's test); `adding a member twice keeps one membership and no new tempPassword`; `allowedOrigins with a path is 400`.
- [ ] **Step 2: Run, expect FAIL.** **Step 3: Implement.** **Step 4: Run, expect PASS.**
- [ ] **Step 5: Commit** — `feat: admin routes for projects, tokens and members`.

---

### Task 5: Reviews (project-scoped), atomic decisions, history

**Files:**
- Create: `server/src/routes/reviews.mjs`
- Test: `server/test/reviews.test.mjs`

**Interfaces:**
- Consumes: `reviewLogic` (Task 1 copy), `authenticate`, `canUseProject`.
- Routes under `/api/v1/projects/:project/reviews` with the spec's rules: `GET /` (`{ reviews: [summary], counts }`), `GET /:slug`, `PUT /:slug` (tool only, else `403 "Only the project token can publish a review."`), `POST /:slug/decision` (users only; `by` = `user.name || user.email`; body `{ answers, migrateBy?, version }`), `POST /:slug/applied` (tool only). `GET /api/v1/projects/:project/history` → the last 200 audit entries of all its reviews, newest first: `[{ component, slug, at, by, action, changes }]`.
- `canUseProject` false → `403 "No access to this project."`.
- Writes: new doc → `Review.create` (duplicate key → `409`); existing doc → `Review.findOneAndUpdate({ projectId, slug, version: prev.version }, next, { new: true })`; `null` → `409 "Someone else changed this review. Reload and check before saving."` with `current` (re-read).

- [ ] **Step 1: Write the failing tests:** `publish with token then reviewer reads it`; `token of project A cannot publish to B (403)`; `revoked token is 401`; `member without membership is 403`; `decision records by from the session, ignores body.reviewer`; `concurrent decisions: one 409`:

```js
const send = (t) => request(app).post(`/api/v1/projects/mvp/reviews/${slug}/decision`).set("Authorization", `Bearer ${t}`)
  .send({ version: 1, answers: { "removed-prop:searchable": "follow-figma" } });
const codes = (await Promise.all([send(dina), send(rudi)])).map((r) => r.status).sort();
assert.deepEqual(codes, [200, 409]);
```

  and `history lists published and decided, newest first`.
- [ ] **Step 2: Run, expect FAIL.** **Step 3: Implement.** **Step 4: Run, expect PASS.**
- [ ] **Step 5: Commit** — `feat: project-scoped review routes with atomic decisions and history`.

---

### Task 6: CORS, Vercel entry, local entry

**Files:**
- Create: `server/src/cors.mjs`, `server/src/listen.mjs`, `api/index.mjs`, `vercel.json`
- Modify: `server/src/app.mjs` (use cors before routes)
- Test: `server/test/cors.test.mjs`

**Interfaces:**
- `cors.mjs`: `allowedOrigins(env) -> Promise<Set<string>>` = `env.WEB_ORIGIN` plus every project's `allowedOrigins` in the org, cached 60 s; middleware answers preflight for allowed origins only (methods `GET,POST,PUT,PATCH,DELETE`, header `Authorization, Content-Type`, no credentials). A disallowed origin gets no CORS headers (the browser blocks it); requests without `Origin` (the tool) pass.
- `api/index.mjs`: `await connect(process.env.MONGO_URL)` once, then before handing to the app restore the path: `req.url = "/api/v1/" + (query.path ?? "") + <other query params>` (same trick as today's `api/review.mjs`).
- `vercel.json`: `buildCommand: "npm -w web run build"`, `outputDirectory: "web/build"`, rewrites `/api/v1/:path*` → `/api/index?path=:path*`, then `/(.*)` → `/index.html`.
- `listen.mjs`: `PORT` (default 9300), connect, listen, log `design-review-be on http://localhost:<port>/api/v1`. Root scripts: `dev:server` = `node --env-file=server/.env server/src/listen.mjs`.

- [ ] **Step 1: Write the failing tests:** `preflight from a project origin is allowed`; `preflight from an unknown origin has no Access-Control-Allow-Origin`; `request without Origin passes`.
- [ ] **Step 2: Run, expect FAIL.** **Step 3: Implement.** **Step 4: Run, expect PASS**, and locally `npm run dev:server` + `curl -s localhost:9300/api/v1/me` → `401 {"error":"Log in first."}`.
- [ ] **Step 5: Commit** — `feat: cors, vercel function and local entry`.

---

### Task 7: Service UI (`web/`)

**Files:**
- Create: `web/package.json`, `web/rsbuild.config.js` (aliases as the MVP: `components, pages, app, utils`; dev port 5010; proxy `/api/v1` → `http://localhost:9300`), `web/tailwind.config.js`, `web/postcss.config.js` (copy the MVP's), `web/src/index.js`, `web/src/App.js`
- Copy the design system: `node /home/aldam/WORK/BLUE_SILO/TRMS/Repo/mvp-design-system/.claude/skills/design-system-pull/scripts/pullUi.mjs --source /home/aldam/WORK/BLUE_SILO/TRMS/Repo/mvp-dev`, run inside `web/` (writes `web/src/components…` and `web/ui-lock.json`; never edited by hand)
- Create: `web/src/app/api.js` (fetch wrapper: base `/api/v1`, session in `sessionStorage` key `dr-session`, a `401` clears it and goes to `/login`), pages `Login.js`, `ChangePassword.js`, `Projects.js`, `ProjectDetail.js` (tabs: Settings, Tokens, Members, History)

**Interfaces:**
- Consumes: every route of Tasks 3–5.
- Behaviour that needs a decision:
  - after login, `mustChangePassword` → `/password` before anything else
  - a new token is shown once in an Alert with a copy button, "You will not see this token again."
  - adding a member shows the temporary password once, the same way
  - History is a table: when, who, component, what (`changes` rendered as `prop: choice`)
  - each project shows a link "Open the review page" (`reviewUrl`)

- [ ] **Step 1: Build check** — `npm -w web run build` passes.
- [ ] **Step 2: Run against the local server** (`npm run dev:server` with a memory or Atlas `MONGO_URL`, seeded admin; `npm -w web run dev`): log in, forced password change, create project `mvp` with origin `http://localhost:5002`, create a token (shown once), add a member (temp password shown once), History empty state. Screenshot each with the browser.
- [ ] **Step 3: Commit** — `feat: service UI for login, projects, tokens, members and history`.

---

### Task 8: Usage scan in the skill

**Files:**
- Create: `…/scripts/usageCore.mjs`, `…/scripts/usageScan.mjs`
- Modify: `package.json` scripts: `"usage": "node scripts/figma/usageScan.mjs"`, `"predev": "npm run usage"`, `"prebuild": "npm run usage"`; `.gitignore` add `src/app/review/usage.json`
- Test: `…/scripts/__tests__/usage.test.mjs`

**Interfaces:**
- `usageScan.mjs` exports `scanUsage(root, { app = "src/App.js", excludeRoutes = ["/review"], routeSamples = {} }) -> Usage` and, run as a script, writes `src/app/review/usage.json` (`routeSamples` from `figma-tokens.config.json` → `review.routeSamples`).
- `Usage = { generatedAt, components: { [jsxName]: [{ file, line, attrs: { [prop]: string|true|false|"expr" }, routes: [{ path, url }] }] } }`; `url` is `path` when it has no `:param`, else `routeSamples[path] ?? null`.
- Routes: read `<Route path="…" element={<Name />}>` from `app`, with `import Name from "pages/…"` / `"app/…"`; a `<Route element={<Layout />}>` without a path gives its files' usages every child route. Files per route: the page and its alias/relative imports, as `collectPage` does in the dev repo's `sliceScan.mjs` (copy `jsxTags`, `attrNames` and the import walk; do not import across repos). Attribute values: `"x"` → `"x"`, bare or `{true}` → `true`, `{false}` → `false`, other expressions → `"expr"`.
- `usageCore.mjs` (pure, imported by `reviewSync.mjs` and by the browser): `usageFor(usage, jsxName, item) -> { count, routes: [{ path, url }], uses }`:
  - `removed-prop` with `item.onByDefault` → every use where `attrs[prop] !== false`
  - `removed-prop` otherwise → uses where `prop in attrs` and `attrs[prop] !== false`
  - `removed-option` → uses where `attrs[prop] === item.option`
  - anything else → every use. Routes are de-duplicated by `path`.

- [ ] **Step 1: Write the failing tests** on a fixture app in `__tests__/fixtures/app/` (an `App.js` with a Layout route, `/reservations`, `/reservations/new`, `/loans/:id`, `/review`): `finds Select on both reservation routes`; `review route is excluded`; `param route without sample has no url`; `param route with sample has its url`; `layout usage reaches every child route`; `usageFor: onByDefault counts uses that do not pass false`; `usageFor: removed-option matches the literal value`.
- [ ] **Step 2: Run, expect FAIL.** **Step 3: Implement.** **Step 4: Run, expect PASS**; `npm run usage` on this repo lists `Select` on `/reservations` and `/reservations/new` and nothing for `/review`.
- [ ] **Step 5: `npm run sync-skill`, commit** — `feat: usage scan of routed pages for the review page`.

---

### Task 9: Skill talks to the service

**Files:**
- Modify: `…/scripts/reviewClient.mjs`, `reviewSync.mjs`, `reviewState.mjs`, `doctor.mjs`; `…/reference/review-service.md` (rewrite: the service, its config, the local fallback, limits); `.claude/skills/building-storybook-from-figma/SKILL.md` line 78 wording; `CLAUDE.md` "Resuming a sync" if it names `/api/review`
- Test: `…/scripts/__tests__/reviewClient.test.mjs`

**Interfaces:**
- `reviewConfig() -> { url, project, token, reviewPage? } | null` from env `REVIEW_API_URL, REVIEW_PROJECT, REVIEW_API_KEY` or `.figma-dump/review-api.json` `{ "url": "https://<service>/api/v1", "project": "mvp", "token": "drp_…", "reviewPage": "https://<app>/review" }`.
- `reviewApi(cfg)` keeps `list, get, publish, applied` with the same return values; requests go to `${url}/projects/${project}/reviews…` with `Authorization: Bearer <token>`; keeps `redirect: "manual"` and the Vercel-protection messages. With no config: the local file store via `reviewCore.handle`, as today.
- `reviewSync <figma.json> <code.js>`: replaces the grep-based `callers` with `scanUsage` + `usageFor` (`callers` = count of uses in app files; `storyCallers` dropped); sends `usage: { at, byItem }`; new flag `--preview-url <origin>` → `previewUrl`.
- `reviewSync --done "<Name>"`: refuses (exit 2) while a `follow-figma` item still has uses: `"<prop>" still used on <n> page(s): <paths>. Migrate them first.`; refuses while any answer is `keep`: `Waiting for Figma: "<prop>" was kept, so the design changes first. Publish again after Figma is updated.`.
- `reviewState`: state `waiting-for-figma` when every unapplied answer is `keep` (the SessionStart message says so instead of "answered, not applied").

- [ ] **Step 1: Write the failing tests** with a stub `http.createServer` that records requests: `publish sends Bearer token to the project path`; `no config uses the local store`; `redirect is reported, not followed`.
- [ ] **Step 2: Run, expect FAIL.** **Step 3: Implement** the four scripts and the docs. **Step 4: Run, expect PASS**; `npm run sync-skill`; `node scripts/figma/doctor.mjs` clean of new FAILs.
- [ ] **Step 5: Commit** — `feat: the Figma skill publishes to the design review service`.

---

### Task 10: The MVP `/review` page on the service

**Files:**
- Create: `src/app/review/serviceClient.js`, `src/pages/review/PagePreview.js`
- Modify: `src/pages/Review.js`; `.env.example` (new, committed: `PUBLIC_REVIEW_SERVICE_URL=http://localhost:9300`, `PUBLIC_REVIEW_PROJECT=mvp`)

**Interfaces:**
- `serviceClient.js`: `SERVICE = import.meta.env.PUBLIC_REVIEW_SERVICE_URL`, `PROJECT = import.meta.env.PUBLIC_REVIEW_PROJECT`; `login(email, password) -> { token, user }`; `changePassword(session, current, next)`; `call(session, method, path, body) -> { status, ok, json }` to `${SERVICE}/api/v1/projects/${PROJECT}/reviews${path}`; session in `sessionStorage` key `review-session`.
- `Review.js` changes:
  - the password form becomes email + password (and the change-password form when `mustChangePassword`)
  - the "Your name" field is removed
  - a `401` keeps `draft` and shows the login form above the cards
  - `keep-deprecated` shows a date Input "Migrate by", sent as `migrateBy`
  - each removal lists its pages from `usageFor(usage, doc.jsxName, item)` (import `usage.json` and `../../scripts/figma/usageCore.mjs`), with "N pages when this was published" from `doc.usage.byItem[item.id].count` when the two differ
  - a "Decision history" `<details>` lists `doc.audit`
- `PagePreview({ route, previewUrl })`: two iframes side by side (`h-96`, `w-full`): "Now" = `window.location.origin + route.url`, "With the Figma version" = `previewUrl + route.url`; without `previewUrl`: only "Now" and "No candidate preview published yet"; `route.url === null`: "No preview: add a sample path for <path> in figma-tokens.config.json (review.routeSamples)". Every frame has an "Open in a new tab" link and the caption "Blank or a Vercel login? Turn off Deployment Protection for preview deployments.".

- [ ] **Step 1: Build check** — `npm run build` passes (`prebuild` runs the usage scan).
- [ ] **Step 2: Run locally end to end:** service on 9300 (Task 6), project `mvp` with origin `http://localhost:5002`, `.figma-dump/review-api.json` with its token, re-publish the pending `Input - Single Select/Base` review (`reviewSync.mjs` on the latest dump), `npm run dev`, log in as the member. Check:
  - `/reservations` and `/reservations/new` listed
  - the "Now" frame renders
  - a `keep-deprecated` answer without a date is refused
  - with a date it is saved and shows in the service UI History
  - two tabs saving at once: the second shows the 409 alert
  - `page preview shows open links`: both links present
- [ ] **Step 3: Commit** — `feat: review page logs in to the review service and shows affected pages`.

---

### Task 11: Deploy and demo run

Manual account steps are the user's (creating the Atlas cluster and the Vercel project); the agent guides and verifies.

- [ ] **Step 1 (user):** Atlas free cluster, database user with `readWrite` on `design_review`, Network Access `0.0.0.0/0` (Vercel has no fixed IPs). Connection string into the service's Vercel env `MONGO_URL`, plus `SESSION_SECRET` (`openssl rand -base64 48`), `ORG_ID=blue-silo`, `WEB_ORIGIN=https://<service>.vercel.app`.
- [ ] **Step 2:** deploy `design-review` to Vercel; `curl -s https://<service>/api/v1/me` → `401 {"error":"Log in first."}` (proves the rewrite reaches the function); run `seed.mjs` once from the dev machine with the Atlas `MONGO_URL`.
- [ ] **Step 3:** in the service UI create project `mvp` (`allowedOrigins`: the MVP production origin and `http://localhost:5002`, `reviewUrl`, `storybookUrl`, `figmaFileKey`, `hasPreviewBuilds: true`), a token for the dev machine, a reviewer account.
- [ ] **Step 4:** MVP Vercel env `PUBLIC_REVIEW_SERVICE_URL`, `PUBLIC_REVIEW_PROJECT=mvp`; deploy; `.figma-dump/review-api.json` points at the service.
- [ ] **Step 5 (candidate preview for the Select case):**
  - in `mvp-dev`, branch `candidate/select-no-searchable` removes `searchable` from Select
  - in a worktree of this repo, `pull-ui --source` that branch and run `vercel deploy`, which gives the preview URL
  - `reviewSync.mjs … --preview-url <url>`
  - confirm the preview opens without a Vercel login
- [ ] **Step 6:** run the demo:
  - publish; the reviewer logs in
  - two affected pages show, Now vs With the Figma version
  - decide `follow-figma`; History shows it
  - `reviewSync --done` refuses while the usages exist
  - migrate the usages on the candidate branch, scan, then `--done` passes
  - record the result in `docs/<ds>/select.md` as today
- [ ] **Step 7: Commit** any doc fixes found on the way — `docs: review service deploy notes`.
