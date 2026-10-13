// How the scripts (reviewSync, reviewState) reach the review store. One interface, two backends, the same code (reviewCore.mjs):
//   shared API   env REVIEW_API_URL + REVIEW_API_KEY, or the file .figma-dump/review-api.json { "url": "...", "key": "..." }
//                (per machine, not in git). The URL ends in /api/review, e.g. https://mvp.example.com/api/review.
//   local        nothing configured: the same logic runs in this process on files in .figma-dump/review-store/. Start
//                `npm run review:api` (same files) and `npm run dev` to answer on /review (password "local-password").
import fs from "node:fs";
import { fileStore, handle, slug } from "./reviewCore.mjs";

export const LOCAL_DIR = ".figma-dump/review-store";
const LOCAL_ENV = { REVIEW_PASSWORD: "local-password", REVIEW_API_KEY: "local-key" };

export function reviewConfig() {
  if (process.env.REVIEW_API_URL && process.env.REVIEW_API_KEY) return { url: process.env.REVIEW_API_URL.replace(/\/$/, ""), key: process.env.REVIEW_API_KEY };
  try {
    const j = JSON.parse(fs.readFileSync(".figma-dump/review-api.json", "utf8"));
    if (j.url && j.key) return { url: String(j.url).replace(/\/$/, ""), key: j.key };
  } catch { /* not configured */ }
  return null;
}

// The page where reviewers answer, for messages.
export const reviewPage = (cfg = reviewConfig()) => (cfg ? `${cfg.url.replace(/\/api\/review$/, "")}/review` : "http://localhost:5002/review (npm run review:api, npm run dev; password local-password)");

export function reviewApi(cfg = reviewConfig(), { timeoutMs = 8000 } = {}) {
  const verbs = (call) => ({
    list: () => call("GET"),
    get: (component) => call("GET", `/${slug(component)}`),
    publish: (doc) => call("PUT", `/${slug(doc.component)}`, doc),
    applied: (component) => call("POST", `/${slug(component)}/applied`, {}),
  });
  if (!cfg) {
    const store = fileStore(LOCAL_DIR);
    return {
      url: "local", shared: false,
      ...verbs(async (method, p = "", body) => {
        const r = await handle({ method, path: p, body, headers: { "x-review-key": LOCAL_ENV.REVIEW_API_KEY } }, { store, env: LOCAL_ENV });
        if (r.status === 404 && method === "GET") return null;
        if (r.status >= 400) throw new Error(`Local review store ${method} ${p || "/"} -> ${r.status}: ${r.body.error}`);
        return r.body;
      }),
    };
  }
  return {
    url: cfg.url, shared: true,
    ...verbs(async (method, p = "", body) => {
      let r;
      try {
        // redirect: "manual": never follow a redirect, or the key would travel to wherever it points (a login page).
        r = await fetch(`${cfg.url}${p}`, { method, redirect: "manual", headers: { "x-review-key": cfg.key, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(timeoutMs) });
      } catch (e) { throw new Error(`Review API ${cfg.url} is not reachable (${e.cause?.code ?? e.message}).`); }
      if (r.status >= 300 && r.status < 400) {
        const to = r.headers.get("location") ?? "";
        throw new Error(`Review API ${cfg.url} answered with a redirect to ${to.slice(0, 60)}...${/vercel\.com\/sso/.test(to) ? " The deployment is protected by Vercel Authentication, so tools and reviewers without a Vercel login cannot reach it: use the production domain or turn Deployment Protection off for this project (the API has its own password and key)." : ""}`);
      }
      const j = await r.json().catch(() => ({}));
      if (r.status === 404 && method === "GET") return null;
      if (r.status === 401 && (j.protection?.vercel_auth_enabled || /Protected (by Vercel|deployment)/.test(`${j.message ?? ""} ${j.error?.message ?? ""}`))) throw new Error(`Review API ${cfg.url} is behind Vercel Authentication ("Protected deployment"): tools and reviewers without a Vercel login cannot reach it. Use the production domain, or turn Deployment Protection off for this project (the API has its own password and key).`);
      if (!r.ok) throw new Error(`Review API ${method} ${p || "/"} -> ${r.status}: ${typeof j.error === "string" ? j.error : JSON.stringify(j.error ?? j).slice(0, 120)}`);
      return j;
    }),
  };
}
