// How the scripts (reviewSync, reviewState) reach the review store. One interface, two backends:
//   service   env REVIEW_API_URL + REVIEW_PROJECT + REVIEW_API_KEY (in the shell, .env.local or .env), or the file .figma-dump/review-api.json
//             { "url": "https://<service>/api/v1", "project": "mvp", "token": "drp_...", "reviewPage": "https://<app>/review" }
//             (per machine, never in git). `token` is a project token made in the service UI (starts with drp_). Requests go to
//             ${url}/projects/${project}/reviews with `Authorization: Bearer <project token>`.
//   local     nothing configured: the same logic (reviewCore.mjs) runs in this process on files in .figma-dump/review-store/.
//             Nobody can answer there: reviewers need the review service.
import fs from "node:fs";
import { fileStore, handle, slug } from "./reviewCore.mjs";

export const LOCAL_DIR = ".figma-dump/review-store";
const LOCAL_ENV = { REVIEW_PASSWORD: "local-password", REVIEW_API_KEY: "local-key" };
const trim = (u) => String(u).replace(/\/$/, "");
const FILE = ".figma-dump/review-api.json";
const TEMPLATE = '{ "url": "https://<service>/api/v1", "project": "<project key>", "token": "drp_..." }';
const HOW = `The token is a project token created in the service UI (it starts with drp_).`;
const NEEDS = `${FILE} needs ${TEMPLATE}. ${HOW}`;
const badToken = (where) => new Error(`The review token in ${where} is not a project token (a project token starts with drp_). Create a project token in the service UI and use it as \`token\`. ${NEEDS}`);

// KEY=VALUE lines of a .env file. Blank lines, # comments and lines that are not a setting are skipped; "export " is allowed; a value may be
// in single or double quotes (then # inside it is text), otherwise a trailing " # comment" is dropped. No variable expansion.
export function parseEnvFile(text) {
  const out = {};
  for (const raw of String(text ?? "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    const q = v[0];
    if ((q === '"' || q === "'") && v.indexOf(q, 1) > 0) v = v.slice(1, v.indexOf(q, 1));
    else v = v.replace(/\s+#.*$/, "");
    out[m[1]] = v;
  }
  return out;
}

// The three settings can sit in the shell, or in a .env file of the project folder next to the app's PUBLIC_ ones: .env.local (git-ignored)
// or .env. Per setting the first one found wins: the shell, then .env.local, then .env. Only these names are read; nothing is put into process.env.
const ENV_FILES = [".env.local", ".env"];
const KEYS = ["REVIEW_API_URL", "REVIEW_PROJECT", "REVIEW_API_KEY"];
function envValues() {
  const files = ENV_FILES.map((f) => { try { return parseEnvFile(fs.readFileSync(f, "utf8")); } catch { return {}; } });
  return Object.fromEntries(KEYS.map((k) => [k, [process.env[k], ...files.map((o) => o[k])].map((x) => x?.trim()).find(Boolean)])); // whitespace-only counts as not set
}

// null only when nothing is configured at all; a partial or old-format config throws, so it is never mistaken for "no review".
export function reviewConfig() {
  const e = envValues();
  const oldApi = (url) => { if (/\/api\/review\/?$/.test(url)) throw new Error(`The review URL ${url} is the old /api/review API, which is gone: the design review service lives at a url ending in /api/v1.`); };
  const finish = (url, project, token, reviewPage, where) => { oldApi(url); if (!String(token).startsWith("drp_")) throw badToken(where); return { url: trim(url), project, token, ...(reviewPage ? { reviewPage } : {}) }; };
  if (e.REVIEW_API_URL || e.REVIEW_PROJECT || e.REVIEW_API_KEY) {
    const missing = [["REVIEW_API_URL", e.REVIEW_API_URL], ["REVIEW_PROJECT", e.REVIEW_PROJECT], ["REVIEW_API_KEY", e.REVIEW_API_KEY]].filter(([, v]) => !v).map(([k]) => k);
    if (missing.length) throw new Error(`Review config is incomplete: ${missing.join(", ")} not set (all of REVIEW_API_URL, REVIEW_PROJECT, REVIEW_API_KEY are needed, in the shell, .env.local or .env).`);
    return finish(e.REVIEW_API_URL, e.REVIEW_PROJECT, e.REVIEW_API_KEY, undefined, "REVIEW_API_KEY");
  }
  let text;
  try { text = fs.readFileSync(FILE, "utf8"); } catch { return null; }
  let j;
  try { j = JSON.parse(text); } catch (err) { throw new Error(`${FILE} is not valid JSON (${err.message}).`); }
  const token = j.token;
  if (j.url && !j.project) throw new Error(`${FILE} has no \`project\`: the review API now lives at the design review service (url ends in /api/v1). ${NEEDS}`);
  const missing = [["url", j.url], ["project", j.project], ["token", token]].filter(([, v]) => !v).map(([k]) => `\`${k}\``);
  if (missing.length) throw new Error(`${FILE} has no ${missing.join(", ")}. ${NEEDS}`);
  return finish(j.url, j.project, token, j.reviewPage, FILE);
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
      } catch (e) { throw new Error(`Review API ${cfg.url} is not reachable (${e.cause?.code ?? e.cause?.message ?? e.message}).`); }
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
