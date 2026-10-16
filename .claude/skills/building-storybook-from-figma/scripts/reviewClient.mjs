// How the scripts (reviewSync, reviewState) reach the review store. One interface, two backends:
//   service   env REVIEW_API_URL + REVIEW_PROJECT + REVIEW_API_KEY, or the file .figma-dump/review-api.json
//             { "url": "https://<service>/api/v1", "project": "mvp", "token": "drp_...", "reviewPage": "https://<app>/review" }
//             (per machine, never in git; `key` is accepted as an alias of `token`). Requests go to
//             ${url}/projects/${project}/reviews with `Authorization: Bearer <project token>`.
//   local     nothing configured: the same logic (reviewCore.mjs) runs in this process on files in .figma-dump/review-store/.
//             Nobody can answer there: reviewers need the review service.
import fs from "node:fs";
import { fileStore, handle, slug } from "./reviewCore.mjs";

export const LOCAL_DIR = ".figma-dump/review-store";
const LOCAL_ENV = { REVIEW_PASSWORD: "local-password", REVIEW_API_KEY: "local-key" };
const trim = (u) => String(u).replace(/\/$/, "");

export function reviewConfig() {
  const e = process.env;
  if (e.REVIEW_API_URL && e.REVIEW_PROJECT && e.REVIEW_API_KEY) return { url: trim(e.REVIEW_API_URL), project: e.REVIEW_PROJECT, token: e.REVIEW_API_KEY };
  try {
    const j = JSON.parse(fs.readFileSync(".figma-dump/review-api.json", "utf8"));
    const token = j.token ?? j.key;
    if (j.url && j.project && token) return { url: trim(j.url), project: j.project, token, ...(j.reviewPage ? { reviewPage: j.reviewPage } : {}) };
  } catch { /* not configured */ }
  return null;
}

// The page where reviewers answer, for messages.
export const reviewPage = (cfg = reviewConfig()) => cfg?.reviewPage ?? (cfg ? "the project's /review page (the reviewers log in there with their own account)" : "the project's /review page (reviewers can answer there once the review service is configured)");

export function reviewApi(cfg = reviewConfig(), { timeoutMs = 8000, localDir = LOCAL_DIR } = {}) {
  const verbs = (call) => ({
    list: () => call("GET"),
    get: (component) => call("GET", `/${slug(component)}`),
    publish: (doc) => call("PUT", `/${slug(doc.component)}`, doc),
    applied: (component) => call("POST", `/${slug(component)}/applied`, {}),
  });
  if (!cfg) {
    const store = fileStore(localDir);
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
    url: `${cfg.url}/projects/${cfg.project}`, shared: true,
    ...verbs(async (method, p = "", body) => {
      let r;
      try {
        // redirect: "manual": never follow a redirect, or the token would travel to wherever it points (a login page).
        r = await fetch(`${cfg.url}/projects/${encodeURIComponent(cfg.project)}/reviews${p}`, { method, redirect: "manual", headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(timeoutMs) });
      } catch (e) { throw new Error(`Review API ${cfg.url} is not reachable (${e.cause?.code ?? e.message}).`); }
      if (r.status >= 300 && r.status < 400) {
        const to = r.headers.get("location") ?? "";
        throw new Error(`Review API ${cfg.url} answered with a redirect to ${to.slice(0, 60)}...${/vercel\.com\/sso/.test(to) ? " The deployment is protected by Vercel Authentication, so tools and reviewers without a Vercel login cannot reach it: use the production domain or turn Deployment Protection off for this project (the service has its own accounts and project tokens)." : ""}`);
      }
      const j = await r.json().catch(() => ({}));
      if (r.status === 404 && method === "GET") return null;
      if (r.status === 401 && (j.protection?.vercel_auth_enabled || /Protected (by Vercel|deployment)/.test(`${j.message ?? ""} ${j.error?.message ?? ""}`))) throw new Error(`Review API ${cfg.url} is behind Vercel Authentication ("Protected deployment"): tools and reviewers without a Vercel login cannot reach it. Use the production domain, or turn Deployment Protection off for this project (the service has its own accounts and project tokens).`);
      if (!r.ok) throw new Error(`Review API ${method} ${p || "/"} -> ${r.status}: ${typeof j.error === "string" ? j.error : JSON.stringify(j.error ?? j).slice(0, 120)}`);
      return j;
    }),
  };
}
