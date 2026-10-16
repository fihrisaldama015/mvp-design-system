import test from "node:test";
import assert from "node:assert/strict";
import { frameUrls, publishedNote, validMigrateBy, missingDates } from "../helpers.js";

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

test("published note only when the counts differ", () => {
  assert.equal(publishedNote(3, { count: 5 }), "5 pages when this was published");
  assert.equal(publishedNote(1, { count: 1 }), null);
  assert.equal(publishedNote(2, undefined), null);
  assert.equal(publishedNote(2, { count: 1 }), "1 page when this was published");
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
