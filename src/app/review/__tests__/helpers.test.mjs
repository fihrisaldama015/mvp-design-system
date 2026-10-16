import test from "node:test";
import assert from "node:assert/strict";
import { frameUrls, publishedNote, validMigrateBy, missingDates, safeRouteUrl, mustChangePassword, changeText } from "../helpers.js";

test("frame urls join the origin and the route", () => {
  const r = frameUrls({ url: "/reservations" }, "https://x-abc.vercel.app/", "http://localhost:5002");
  assert.deepEqual(r, { now: "http://localhost:5002/reservations", after: "https://x-abc.vercel.app/reservations", sample: true });
});

test("no previewUrl gives only the Now frame", () => {
  const r = frameUrls({ url: "/reservations" }, null, "http://localhost:5002");
  assert.equal(r.after, null);
  assert.equal(r.now, "http://localhost:5002/reservations");
});

test("a route without a url has no frames", () => {
  assert.deepEqual(frameUrls({ path: "/loans/:id", url: null }, "https://p.app", "http://localhost:5002"), { now: null, after: null, sample: false });
});

test("a previewUrl that is not a valid url is ignored", () => {
  assert.equal(frameUrls({ url: "/a" }, "not a url", "http://o").after, null);
});

test("published note compares pages (routes), only when they differ", () => {
  assert.equal(publishedNote(3, { count: 9, routes: [1, 2, 3, 4, 5] }), "5 pages when this was published");
  assert.equal(publishedNote(2, { count: 9, routes: [1, 2] }), null);
  assert.equal(publishedNote(2, undefined), null);
  assert.equal(publishedNote(2, { count: 1 }), null);
  assert.equal(publishedNote(2, { routes: [1] }), "1 page when this was published");
});

test("only a plain path is accepted as a route url", () => {
  for (const url of ["//evil.example/x", "https://evil.example", "javascript:alert(1)", "reservations", ""]) {
    assert.deepEqual(frameUrls({ path: "/a", url }, "https://p.app", "http://o"), { now: null, after: null, sample: false }, url);
  }
  assert.equal(safeRouteUrl("/reservations/new"), true);
  assert.equal(safeRouteUrl("//host"), false);
  assert.equal(safeRouteUrl(null), false);
});

test("the locked-account answer is recognised", () => {
  assert.equal(mustChangePassword({ status: 403, json: { error: "Change your password first." } }), true);
  assert.equal(mustChangePassword({ status: 403, json: { error: "No access to this project." } }), false);
  assert.equal(mustChangePassword({ status: 401, json: { error: "Change your password first." } }), false);
  assert.equal(mustChangePassword(null), false);
});

test("history change lines use plain labels and the date when known", () => {
  const labels = { "keep-deprecated": "Keep it, but mark it as old" };
  assert.equal(changeText("keep-deprecated", labels, "2026-12-31"), "Keep it, but mark it as old (migrate by 2026-12-31)");
  assert.equal(changeText("keep-deprecated", labels, undefined), "Keep it, but mark it as old");
  assert.equal(changeText(null, labels), "answer cleared");
  assert.equal(changeText("other", labels), "other");
});

test("migrate-by must be a real YYYY-MM-DD date", () => {
  assert.equal(validMigrateBy("2026-12-31"), true);
  assert.equal(validMigrateBy("2026-02-30"), false);
  assert.equal(validMigrateBy("31/12/2026"), false);
  assert.equal(validMigrateBy(""), false);
  assert.equal(validMigrateBy(undefined), false);
});

test("missingDates lists keep-deprecated items without a valid date", () => {
  const changes = { a: "keep-deprecated", b: "keep-deprecated", c: "follow-figma", d: "keep-deprecated" };
  assert.deepEqual(missingDates(changes, { a: "2026-12-01", b: "", d: "bad" }), ["b", "d"]);
});
