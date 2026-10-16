import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { reviewApi, reviewConfig } from "../reviewClient.mjs";
import { doneGate } from "../reviewGate.mjs";

// A stub service: records each request, answers with `reply(req)` -> { status, headers?, body? }.
async function stub(reply) {
  const seen = [];
  const server = http.createServer((req, res) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      seen.push({ method: req.method, url: req.url, auth: req.headers.authorization, key: req.headers["x-review-key"], body: raw ? JSON.parse(raw) : undefined });
      const r = reply(req);
      res.writeHead(r.status, { "Content-Type": "application/json", ...(r.headers ?? {}) });
      res.end(JSON.stringify(r.body ?? {}));
    });
  });
  await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
  return { seen, url: `http://127.0.0.1:${server.address().port}/api/v1`, close: () => new Promise((ok) => { server.closeAllConnections?.(); server.close(ok); }) };
}

test("publish sends Bearer token to the project path", async () => {
  const s = await stub(() => ({ status: 201, body: { ok: true } }));
  try {
    const api = reviewApi({ url: s.url, project: "mvp", token: "drp_abc" });
    await api.publish({ component: "Input - Single Select/Base", items: [] });
    assert.equal(s.seen[0].method, "PUT");
    assert.equal(s.seen[0].url, "/api/v1/projects/mvp/reviews/input-single-select-base");
    assert.equal(s.seen[0].auth, "Bearer drp_abc");
    assert.equal(s.seen[0].key, undefined);
  } finally { await s.close(); }
});

test("list, get and applied use the project path", async () => {
  const s = await stub(() => ({ status: 200, body: { reviews: [] } }));
  try {
    const api = reviewApi({ url: s.url, project: "mvp", token: "t" });
    await api.list(); await api.get("Select"); await api.applied("Select");
    assert.deepEqual(s.seen.map((r) => `${r.method} ${r.url}`), ["GET /api/v1/projects/mvp/reviews", "GET /api/v1/projects/mvp/reviews/select", "POST /api/v1/projects/mvp/reviews/select/applied"]);
  } finally { await s.close(); }
});

test("no config uses the local store", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "review-local-"));
  try {
    const api = reviewApi(null, { localDir: dir });
    assert.equal(api.shared, false);
    assert.equal(await api.get("Select"), null);
    await api.publish({ component: "Select", sourceHash: "h", items: [] });
    assert.equal((await api.get("Select")).component, "Select");
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test("a redirect is reported, not followed", async () => {
  const target = await stub(() => ({ status: 200 }));
  const s = await stub(() => ({ status: 307, headers: { Location: "https://vercel.com/sso-api?url=x" } }));
  try {
    const api = reviewApi({ url: s.url, project: "mvp", token: "t" });
    await assert.rejects(api.list(), /redirect.*Vercel Authentication/s);
    assert.equal(target.seen.length, 0);
  } finally { await s.close(); await target.close(); }
});

test("404 on get returns null", async () => {
  const s = await stub(() => ({ status: 404, body: { error: "No such review." } }));
  try { assert.equal(await reviewApi({ url: s.url, project: "mvp", token: "t" }).get("Nope"), null); } finally { await s.close(); }
});

test("an error answer names the status and the service's text", async () => {
  const s = await stub(() => ({ status: 409, body: { error: "The reviewers have not answered every removal yet." } }));
  try { await assert.rejects(reviewApi({ url: s.url, project: "mvp", token: "t" }).applied("Select"), /409.*not answered/); } finally { await s.close(); }
});

test("reviewConfig reads env, and accepts key as an alias of token in the file", () => {
  const keep = { ...process.env }, cwd = process.cwd();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "review-cfg-"));
  try {
    for (const k of ["REVIEW_API_URL", "REVIEW_PROJECT", "REVIEW_API_KEY"]) delete process.env[k];
    process.chdir(dir);
    assert.equal(reviewConfig(), null);
    fs.mkdirSync(".figma-dump");
    fs.writeFileSync(".figma-dump/review-api.json", JSON.stringify({ url: "https://s.example/api/v1/", project: "mvp", key: "k1", reviewPage: "https://app/review" }));
    assert.deepEqual(reviewConfig(), { url: "https://s.example/api/v1", project: "mvp", token: "k1", reviewPage: "https://app/review" });
    Object.assign(process.env, { REVIEW_API_URL: "https://e.example/api/v1", REVIEW_PROJECT: "p", REVIEW_API_KEY: "t2" });
    assert.deepEqual(reviewConfig(), { url: "https://e.example/api/v1", project: "p", token: "t2" });
  } finally { process.chdir(cwd); process.env = keep; fs.rmSync(dir, { recursive: true, force: true }); }
});

// --done gates
const use = (routes) => ({ attrs: { searchable: true }, routes: routes.map((p) => ({ path: p, url: p })) });
const scan = (uses) => ({ components: { Select: uses } });
const item = { id: "removed-prop:searchable", kind: "removed-prop", prop: "searchable" };
const docOf = (answer, extra = {}) => ({ component: "Select", jsxName: "Select", status: "answered", items: [item], answers: { [item.id]: answer }, migrateBy: {}, usage: { byItem: { [item.id]: { count: 3, routes: ["/a"] } } }, ...extra });

test("gate refuses follow-figma with remaining uses, naming the paths", () => {
  const g = doneGate(docOf("follow-figma"), scan([use(["/loans/new"]), use(["/reservations/new"])]));
  assert.equal(g.ok, false);
  assert.equal(g.reason, '"searchable" still used on 2 page(s): /loans/new, /reservations/new. Migrate them first.');
});

test("gate refuses a keep answer with the Waiting for Figma text", () => {
  const g = doneGate(docOf("keep"), scan([]));
  assert.equal(g.ok, false);
  assert.equal(g.reason, 'Waiting for Figma: "searchable" was kept, so the design changes first. Publish again after Figma is updated.');
});

test("gate passes when usage is 0", () => {
  assert.deepEqual(doneGate(docOf("follow-figma"), scan([])), { ok: true, burnDown: [] });
});

test("gate passes keep-deprecated and reports the burn-down", () => {
  const g = doneGate(docOf("keep-deprecated", { migrateBy: { [item.id]: "2026-12-01" } }), scan([use(["/a"])]));
  assert.equal(g.ok, true);
  assert.deepEqual(g.burnDown, [{ id: item.id, prop: "searchable", before: 3, now: 1, migrateBy: "2026-12-01" }]);
});

test("gate refuses keep-deprecated without migrateBy", () => {
  assert.equal(doneGate(docOf("keep-deprecated"), scan([])).ok, false);
});

test("gate refuses a pending doc", () => {
  const g = doneGate(docOf(undefined, { status: "pending", answers: {} }), scan([]));
  assert.equal(g.ok, false);
  assert.match(g.reason, /unanswered removals/);
});
