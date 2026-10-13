// Local sync-review API for development and tests: the same routes as the deployed one (reviewCore.mjs),
// storing files in .figma-dump/review-store/. The MVP's dev server proxies /api/review to it (rsbuild.config.js).
// Env: REVIEW_PASSWORD, REVIEW_API_KEY (defaults for local use only: "local-password" / "local-key").
// Usage: node scripts/figma/reviewApi.mjs [port=9233] [dir=.figma-dump/review-store]
import http from "node:http";
import { fileStore, handle } from "./reviewCore.mjs";

const port = Number(process.argv[2] ?? 9233);
const store = fileStore(process.argv[3] ?? ".figma-dump/review-store");
const env = { REVIEW_PASSWORD: process.env.REVIEW_PASSWORD ?? "local-password", REVIEW_API_KEY: process.env.REVIEW_API_KEY ?? "local-key" };

const server = http.createServer(async (req, res) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  let body;
  try { body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : undefined; } catch { res.writeHead(400, { "Content-Type": "application/json" }); return res.end('{"error":"Body is not valid JSON."}'); }
  const url = new URL(req.url, "http://localhost");
  const r = await handle({ method: req.method, path: url.pathname.replace(/^\/api\/review\/?/, ""), body, headers: req.headers }, { store, env });
  res.writeHead(r.status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(r.body));
});
server.on("error", (e) => { console.error(e.code === "EADDRINUSE" ? `reviewApi: port ${port} is in use (kill $(lsof -ti :${port}) on Linux/macOS; see reference/setup.md for Windows).` : e.message); process.exit(1); });
server.listen(port, "127.0.0.1", () => console.log(`reviewApi: http://127.0.0.1:${port}/api/review  (store ${process.argv[3] ?? ".figma-dump/review-store"}; password "${env.REVIEW_PASSWORD}" for local use)`));
