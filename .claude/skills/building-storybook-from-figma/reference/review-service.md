# The review service (shared sync reviews)

When a component that already exists is synced from Figma, `reviewSync.mjs` finds what Figma no longer has (`reference/existing-component.md`).
Someone who is not the developer (a designer, a product owner) decides what to do with it, on a page, on the same domain as the app. This is
the service behind that page: **one JSON document per component**, an API of five routes, and a store.

Why not a file: the apps are deployed as static builds / Docker images, so a file written on the server disappears at the next deploy
(`swt-fe`: `docker compose pull && up -d`; the MVP on Vercel has no writable disk). Why not git: a designer cannot commit, and a commit to a
deploy branch triggers a deploy (swt's Bitbucket pipeline). So the documents live in a **store**, and the sync tool and the page talk to the same API.

## The contract

Base path `/api/review`. Auth by header: `x-review-password` (the shared password: designers and product owners) or `x-review-key` (the sync tool).
Both secrets come from the server's environment; with none configured the API answers `503` and refuses everything. `:slug` is the lowercase,
dash-separated component name (`Input - Single Select/Base` is `input-single-select-base`).

| Route | Who | What |
|---|---|---|
| `GET /` | reviewer, tool | `{ reviews: [summary], counts: { pending, answered, applied } }` |
| `GET /:slug` | reviewer, tool | the full document |
| `PUT /:slug` | tool | publish: `{ component, figmaNode, figmaPage, code, readAt, sourceHash, items }`. Same `sourceHash` as the stored one keeps the answers; a different one (Figma changed) or an applied review starts a new cycle with no answers |
| `POST /:slug/decision` | reviewer, tool | `{ reviewer, answers: { itemId: choice \| null }, version }`. `version` must equal the stored one, else `409` with the current document. Only removals take an answer; choices: `follow-figma`, `keep-deprecated`, `keep` |
| `POST /:slug/applied` | tool | marks the review applied (`reviewSync.mjs --done`) |

Document (one per component, key `review:<slug>`):

```json
{ "component": "Input - Single Select/Base", "jsxName": "Select", "figmaFileKey": "o4wdbN7PjV2ugCKDcc2pXd", "figmaNode": "7:94371", "figmaPage": "...", "code": "src/components/select/index.js",
  "readAt": "2026-10-13T04:48:49Z", "sourceHash": "460b1f89d95c",
  "status": "pending | answered | applied", "version": 3,
  "items": [ { "id": "removed-prop:searchable", "kind": "removed-prop", "prop": "searchable", "description": "Shows a search box ...", "default": "true", "detail": "...", "callers": 0, "storyCallers": 2, "onByDefault": true } ],
  "answers": { "removed-prop:searchable": "keep-deprecated" },
  "audit": [ { "at": "...", "by": "tool", "action": "published" }, { "at": "...", "by": "Dina", "action": "decided", "changes": { "removed-prop:searchable": "keep-deprecated" } } ],
  "createdAt": "...", "updatedAt": "..." }
```

The page turns these fields into plain language for people who do not read code: what the property does (`description`), who is affected (`callers`, `storyCallers`, `onByDefault`, `jsxName`), a link to the Figma node (`figmaFileKey` + `figmaNode`), and what each choice means. `figmaFileKey` comes from `--file` or `figma-index.json`.

`status` is derived: `pending` while a removal has no answer, `answered` when all have one, `applied` after `/applied`. Errors are `{ "error": "..." }`:
`400` bad input, `401` no or wrong secret, `403` a reviewer called a tool-only route, `404`, `409` stale version or already applied, `502` the store failed, `503` not configured.

The logic is one file, `scripts/figma/reviewCore.mjs` (`handle(request, { store, env })`), with two stores (`fileStore`, `kvStore`). Everything else is a thin wrapper.

## Where it runs

| Place | Wrapper | Store |
|---|---|---|
| The tool on a dev machine, nothing configured | in-process (`reviewClient.mjs`) | files in `.figma-dump/review-store/` |
| Local app (`npm run review:api` + `npm run dev`) | `scripts/figma/reviewApi.mjs`, port 9233, proxied by rsbuild | the same files |
| **MVP on Vercel** | `api/review.mjs` (a Vercel function), `vercel.json` rewrite | **KV** (Redis over REST) |
| **swt-fe, later** | routes in a backend (below) | MongoDB |

### MVP on Vercel (what you set up)

1. Create a KV store (Redis) for the Vercel project: Vercel dashboard > Storage / Marketplace > Upstash Redis (or Vercel KV if it is offered),
   connect it to the project. It adds `KV_REST_API_URL` + `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`; both are read).
   Check the plan limits and the price in the dashboard first; this was not checked here.
2. Add two environment variables: `REVIEW_PASSWORD` (give it to the designers / product owners) and `REVIEW_API_KEY` (a long random string, for the tool).
3. Deploy. The page is `/review` of the deployed app; the function is `/api/review`.
4. On each dev machine, once: `.figma-dump/review-api.json` = `{ "url": "https://<your-domain>/api/review", "key": "<REVIEW_API_KEY>" }`
   (or the env vars `REVIEW_API_URL` / `REVIEW_API_KEY`). `reviewSync` then publishes there and `reviewState` reads from there, on every machine.

*Written from the Upstash REST protocol and checked against a stand-in server and the local API, **not** run on Vercel or against a real KV store yet.*
Check on the first deploy: the rewrite in `vercel.json` (`/api/review/:path*` to `/api/review?path=:path*`) reaches the function, and a publish then a decision round-trips.

### swt (Express + Mongoose, later)

All nine backends are Express + Mongoose. A natural home is `system-setting-be` (settings domain, same pipeline, `MONGO_URL` from vault), enabled by
an env flag on stage only; or a small service of its own if the team wants dev tooling apart from a production service. The same five routes, the same JSON:

```js
// model: one document per component
const ReviewSchema = new Schema({
  slug: { type: String, unique: true, required: true },
  component: String, figmaNode: String, figmaPage: String, code: String, readAt: String, sourceHash: String,
  status: { type: String, enum: ["pending", "answered", "applied"] },
  items: [Schema.Types.Mixed], answers: Schema.Types.Mixed,
  audit: [{ at: Date, by: String, action: String, changes: Schema.Types.Mixed }],
}, { timestamps: true });   // `version` = Mongoose's __v: save with { __v: expected } in the filter and treat "no match" as 409
```

Auth: reviewers sign in with the existing login (JWT from `user-be`) and a role instead of the shared password, and `by` comes from the token; the tool uses a service
key from vault. The page (`pages/Review`, same component) and the skill do not change: only `REVIEW_API_URL` points at the backend. Build the page into
stage only (a build flag) so end users never see it. The Figma reads (`.figma-dump`) stay on the dev machine.

## Limits and risks (read before exposing it)

- **One shared password.** Anyone with it can answer as any name; the name is typed, not proven. There is no lockout or rate limit. Fine for an internal trial,
  not for sensitive data; in swt use the real login.
- **The URL is public** unless the host protects it. What is exposed behind the password is component prop names and Figma node ids. Use HTTPS only.
- **Not atomic on KV.** A decision reads the document, checks `version`, writes it back: two saves in the same few milliseconds can both pass. For a handful of
  reviewers that is acceptable; Mongo's `__v` filter closes it in swt.
- **The password is kept in the browser's session storage** until the tab closes.
- **A deploy does not lose data** (the store is separate from the app), but nothing backs the KV store up. Treat it as working state: the outcome is
  recorded in the component doc and the commit (`docs/<ds>/<component>.md`).
- The store holds only reviews; no loan or user data of the app.
