// The local review store, as one function: handle(request, { store, env }) -> { status, body }.
// Used as the tool's fallback when no review service is configured (reviewClient.mjs, file store in
// .figma-dump/review-store). The rules are in reviewLogic.mjs (pure); this file is auth + routing + the file store.
// Nothing here imports Node HTTP; it is plain data in, data out.
//
// Local fallback only: the real service is the design-review repo (reference/review-service.md); this file keeps the same rules for one machine.
// Routes (path inside the local store, no URL prefix):
//   GET    /                       reviewer | tool   list: summaries + counts
//   GET    /:slug                  reviewer | tool   one review, with items, answers, audit
//   PUT    /:slug                  tool              publish a review (reviewSync --publish); same sourceHash keeps the answers
//   POST   /:slug/decision         reviewer | tool   { answers: {itemId: choice}, migrateBy, reviewer, version }; 409 when version is stale
//   POST   /:slug/applied          tool              the agent applied the answers (reviewSync --done)
// Auth (local only): the in-process caller passes a fixed key header; nobody can answer in the local store.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { decide, markApplied, publish, slug, summary } from "./reviewLogic.mjs";

export { CHOICES, slug, summary } from "./reviewLogic.mjs";

const KEY = (s) => `review:${s}`;
const now = () => new Date().toISOString();
const same = (a, b) => {
  const x = Buffer.from(String(a ?? "")), y = Buffer.from(String(b ?? ""));
  return x.length === y.length && x.length > 0 && crypto.timingSafeEqual(x, y);
};

// ---- stores: get(key) -> object | null, set(key, object), list() -> objects ----
export function fileStore(dir) {
  const file = (k) => path.join(dir, `${k.replace(/[^a-z0-9:-]/gi, "_").replace(":", "-")}.json`);
  return {
    async get(k) { try { return JSON.parse(fs.readFileSync(file(k), "utf8")); } catch { return null; } },
    async set(k, v) { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(file(k), JSON.stringify(v, null, 2) + "\n"); },
    async list() { try { return fs.readdirSync(dir).filter((f) => f.startsWith("review-")).map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"))); } catch { return []; } },
  };
}

const bad = (status, error, extra = {}) => ({ status, body: { error, ...extra } });
const ok = (body, status = 200) => ({ status, body });

// A store failure (disk error) is a 502 with the reason, not a stack trace.
export async function handle(request, ctx) {
  try { return await route(request, ctx); } catch (e) { return bad(502, `The store failed: ${e.message}`); }
}

async function route({ method, path: p = "", body, headers = {} }, { store, env = {} }) {
  const h = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  if (!env.REVIEW_PASSWORD && !env.REVIEW_API_KEY) return bad(503, "The review API is not configured (set REVIEW_PASSWORD and REVIEW_API_KEY).");
  if (!store) return bad(503, "No store configured.");
  const isTool = same(h["x-review-key"], env.REVIEW_API_KEY);
  const isReviewer = same(h["x-review-password"], env.REVIEW_PASSWORD);
  if (!isTool && !isReviewer) return bad(401, "Missing or wrong password / key.");

  const [s, action, ...more] = p.split("/").filter(Boolean);
  if (more.length) return bad(404, "No such route.");

  if (!s) {
    if (method !== "GET") return bad(405, "Use GET.");
    const reviews = (await store.list()).filter(Boolean).map(summary).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const count = (st) => reviews.filter((r) => r.status === st).length;
    return ok({ reviews, counts: { pending: count("pending"), answered: count("answered"), applied: count("applied") } });
  }

  const doc = await store.get(KEY(s));

  if (!action) {
    if (method === "GET") return doc ? ok(doc) : bad(404, `No review "${s}".`);
    if (method === "PUT") {
      if (!isTool) return bad(403, "Only the tool (x-review-key) can publish a review.");
      if (!body?.component || slug(body.component) !== s) return bad(400, "component must be set and its slug must equal the URL.");
      return commit(store, s, publish(doc, body, now()), doc);
    }
    return bad(405, "Use GET or PUT.");
  }

  if (!doc) return bad(404, `No review "${s}".`);

  if (action === "decision") {
    if (method !== "POST") return bad(405, "Use POST.");
    const { answers, migrateBy, reviewer, version } = body ?? {};
    return commit(store, s, decide(doc, { answers, migrateBy, version, by: reviewer }, now()), doc);
  }

  if (action === "applied") {
    if (method !== "POST") return bad(405, "Use POST.");
    if (!isTool) return bad(403, "Only the tool (x-review-key) can mark a review as applied.");
    if (doc.status === "applied") return bad(409, "This review was already applied.");
    return commit(store, s, markApplied(doc, now()), doc);
  }

  return bad(404, "No such route.");
}

// A logic Result -> a response; writes the document only when it changed (the logic returns the same object when nothing changed).
async function commit(store, s, r, prev) {
  if (!r.ok) return bad(r.status, r.error, r.current ? { current: r.current } : {});
  if (r.doc !== prev) await store.set(KEY(s), r.doc);
  return ok(r.doc, r.status);
}
