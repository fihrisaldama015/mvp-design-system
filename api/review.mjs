// Vercel function for the sync-review API (logic: scripts/figma/reviewCore.mjs, contract in the skill's
// reference/review-service.md). Needs these env vars in the Vercel project:
//   REVIEW_PASSWORD   shared password for designers / product owners
//   REVIEW_API_KEY    key for the sync tool (reviewSync --publish)
//   KV_REST_API_URL + KV_REST_API_TOKEN   (Vercel KV) or UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
// vercel.json rewrites /api/review/:path* to this function with ?path=:path*.
import { handle, storeFromEnv } from "../scripts/figma/reviewCore.mjs";

export default async function handler(req, res) {
  const url = new URL(req.url, "http://localhost");
  const r = await handle(
    { method: req.method, path: url.searchParams.get("path") ?? "", body: req.body, headers: req.headers },
    { store: storeFromEnv(process.env), env: process.env },
  );
  res.setHeader("Cache-Control", "no-store");
  res.status(r.status).json(r.body);
}
