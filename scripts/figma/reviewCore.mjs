// The sync-review API, as one function: handle(request, { store, env }) -> { status, body }.
// The same logic runs in a Vercel function (api/review.mjs, KV store), in the local dev server
// (reviewApi.mjs, file store) and is the contract a backend implements later (Express + Mongo in swt:
// docs "review-service" in the skill's reference/). Nothing here imports Node HTTP; it is plain data in, data out.
//
// Routes (path is what follows /api/review):
//   GET    /                       reviewer | tool   list: summaries + counts
//   GET    /:slug                  reviewer | tool   one review, with items, answers, audit
//   PUT    /:slug                  tool              publish a review (reviewSync --publish); same sourceHash keeps the answers
//   POST   /:slug/decision         reviewer | tool   { answers: {itemId: choice}, reviewer, version }; 409 when version is stale
//   POST   /:slug/applied          tool              the agent applied the answers (reviewSync --done)
// Auth: header x-review-password (shared password, for designers / product owners) or x-review-key (the tool).
// Both come from env (REVIEW_PASSWORD, REVIEW_API_KEY). Missing env = the API refuses everything (503), never open.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const CHOICES = ["follow-figma", "keep-deprecated", "keep"];
export const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
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

// Upstash / Vercel KV (Redis over REST: POST the command as a JSON array to the base URL).
export function kvStore({ url, token, fetchImpl = fetch }) {
  const cmd = async (...c) => {
    const r = await fetchImpl(url, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(c) });
    const j = await r.json();
    if (!r.ok || j.error) throw new Error(`KV ${c[0]} failed: ${j.error ?? r.status}`);
    return j.result;
  };
  return {
    async get(k) { const v = await cmd("GET", k); return v ? JSON.parse(v) : null; },
    async set(k, v) { await cmd("SET", k, JSON.stringify(v)); },
    async list() { const keys = await cmd("KEYS", "review:*"); return Promise.all(keys.map((k) => this.get(k))); },
  };
}

export function storeFromEnv(env) {
  const url = env.KV_REST_API_URL ?? env.UPSTASH_REDIS_REST_URL, token = env.KV_REST_API_TOKEN ?? env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? kvStore({ url, token }) : null;
}

// ---- document helpers ----
const removals = (d) => d.items.filter((i) => i.kind.startsWith("removed"));
const unanswered = (d) => removals(d).filter((i) => !d.answers[i.id]).map((i) => i.id);
const statusOf = (d) => (d.status === "applied" ? "applied" : unanswered(d).length ? "pending" : "answered");
export const summary = (d) => ({ slug: slug(d.component), component: d.component, status: d.status, removals: removals(d).length, unanswered: unanswered(d).length, additions: d.items.length - removals(d).length, figmaNode: d.figmaNode, readAt: d.readAt, updatedAt: d.updatedAt, version: d.version });
const bad = (status, error, extra = {}) => ({ status, body: { error, ...extra } });
const ok = (body, status = 200) => ({ status, body });

// A store failure (KV down, wrong token) is a 502 with the reason, not a stack trace.
export async function handle(request, ctx) {
  try { return await route(request, ctx); } catch (e) { return bad(502, `The store failed: ${e.message}`); }
}

async function route({ method, path: p = "", body, headers = {} }, { store, env = {} }) {
  const h = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  if (!env.REVIEW_PASSWORD && !env.REVIEW_API_KEY) return bad(503, "The review API is not configured (set REVIEW_PASSWORD and REVIEW_API_KEY).");
  if (!store) return bad(503, "No store configured (set KV_REST_API_URL and KV_REST_API_TOKEN).");
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
      const b = body ?? {};
      if (!b.component || slug(b.component) !== s) return bad(400, "component must be set and its slug must equal the URL.");
      if (!Array.isArray(b.items) || !b.sourceHash) return bad(400, "items (array) and sourceHash are required.");
      const t = now();
      const base = { component: b.component, jsxName: b.jsxName ?? null, figmaFileKey: b.figmaFileKey ?? null, figmaNode: b.figmaNode ?? null, figmaPage: b.figmaPage ?? null, code: b.code ?? null, readAt: b.readAt ?? null, sourceHash: b.sourceHash, items: b.items };
      let next;
      if (doc && doc.sourceHash === b.sourceHash && doc.status !== "applied") {
        next = { ...doc, ...base, updatedAt: t, audit: [...doc.audit, { at: t, by: "tool", action: "republished (same Figma state, answers kept)" }] };
      } else {
        const why = !doc ? "published" : doc.status === "applied" ? "published (new cycle)" : "Figma changed: earlier answers dropped";
        next = { ...base, answers: {}, status: "pending", version: (doc?.version ?? 0) + 1, createdAt: doc?.createdAt ?? t, updatedAt: t, audit: [...(doc?.audit ?? []), { at: t, by: "tool", action: why }] };
      }
      next.status = statusOf(next);
      await store.set(KEY(s), next);
      return ok(next, doc ? 200 : 201);
    }
    return bad(405, "Use GET or PUT.");
  }

  if (!doc) return bad(404, `No review "${s}".`);

  if (action === "decision") {
    if (method !== "POST") return bad(405, "Use POST.");
    const { answers, reviewer, version } = body ?? {};
    if (typeof reviewer !== "string" || !reviewer.trim() || reviewer.length > 80) return bad(400, "reviewer (a name, up to 80 characters) is required.");
    if (!answers || typeof answers !== "object") return bad(400, "answers must be an object { itemId: choice }.");
    if (doc.status === "applied") return bad(409, "This review was already applied.", { current: doc });
    if (version !== doc.version) return bad(409, "Someone else changed this review. Reload and check before saving.", { current: doc });
    const valid = new Set(removals(doc).map((i) => i.id));
    for (const [id, choice] of Object.entries(answers)) {
      if (!valid.has(id)) return bad(400, `Unknown item "${id}": only removals need an answer.`);
      if (choice !== null && !CHOICES.includes(choice)) return bad(400, `Choice for "${id}" must be one of ${CHOICES.join(", ")}.`);
    }
    const t = now();
    const merged = { ...doc.answers };
    const changes = {};
    for (const [id, choice] of Object.entries(answers)) {
      if (choice === null) { if (merged[id]) { delete merged[id]; changes[id] = null; } } else if (merged[id] !== choice) { merged[id] = choice; changes[id] = choice; }
    }
    if (!Object.keys(changes).length) return ok(doc);
    const next = { ...doc, answers: merged, version: doc.version + 1, updatedAt: t, audit: [...doc.audit, { at: t, by: reviewer.trim(), action: "decided", changes }] };
    next.status = statusOf(next);
    await store.set(KEY(s), next);
    return ok(next);
  }

  if (action === "applied") {
    if (method !== "POST") return bad(405, "Use POST.");
    if (!isTool) return bad(403, "Only the tool (x-review-key) can mark a review as applied.");
    const t = now();
    const next = { ...doc, status: "applied", version: doc.version + 1, updatedAt: t, audit: [...doc.audit, { at: t, by: "tool", action: "applied" }] };
    await store.set(KEY(s), next);
    return ok(next);
  }

  return bad(404, "No such route.");
}
