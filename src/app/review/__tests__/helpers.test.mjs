import test from "node:test";
import assert from "node:assert/strict";
import { embedUrl, frameUrls, publishedNote, validMigrateBy, missingDates, safeRouteUrl, mustChangePassword, changeText, daysLeft, deadlineText, usageTrend, trendText } from "../helpers.js";

test("frame urls join the origin and the route", () => {
  const r = frameUrls({ url: "/reservations" }, "https://x-abc.vercel.app/", "http://localhost:5002");
  assert.deepEqual(r, {
    now: "http://localhost:5002/reservations", after: "https://x-abc.vercel.app/reservations",
    nowEmbed: "http://localhost:5002/reservations?embed=1", afterEmbed: "https://x-abc.vercel.app/reservations?embed=1", sample: true,
  });
});

test("embed urls add embed=1 and keep what is already in the query", () => {
  assert.equal(embedUrl("http://o/a"), "http://o/a?embed=1");
  assert.equal(embedUrl("http://o/a?x=1"), "http://o/a?x=1&embed=1");
  assert.equal(embedUrl("http://o/a?embed=0"), "http://o/a?embed=1");
  assert.equal(embedUrl(null), null);
});

test("no previewUrl gives only the Now frame", () => {
  const r = frameUrls({ url: "/reservations" }, null, "http://localhost:5002");
  assert.equal(r.after, null);
  assert.equal(r.afterEmbed, null);
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

const today = new Date(2026, 9, 27, 15, 30);

test("daysLeft counts whole days, negative when overdue, null when invalid", () => {
  assert.equal(daysLeft("2026-10-31", today), 4);
  assert.equal(daysLeft("2026-10-27", today), 0);
  assert.equal(daysLeft("2026-10-28", today), 1);
  assert.equal(daysLeft("2026-10-25", today), -2);
  assert.equal(daysLeft("2026-02-30", today), null);
  assert.equal(daysLeft("soon", today), null);
  assert.equal(daysLeft(undefined, today), null);
  assert.equal(daysLeft("", today), null);
});

test("deadline text says how many days are left, due today or overdue", () => {
  assert.equal(deadlineText("2026-10-31", today), "Migrate by 2026-10-31 (4 days left)");
  assert.equal(deadlineText("2026-10-28", today), "Migrate by 2026-10-28 (1 day left)");
  assert.equal(deadlineText("2026-10-27", today), "Migrate by 2026-10-27 (due today)");
  assert.equal(deadlineText("2026-10-26", today), "Migrate by 2026-10-26 (overdue by 1 day)");
  assert.equal(deadlineText("2026-10-25", today), "Migrate by 2026-10-25 (overdue by 2 days)");
  assert.equal(deadlineText("bad", today), "");
  assert.equal(deadlineText(undefined, today), "");
});

test("usage trend lists the counts of one item in order, last 6", () => {
  const h = [{ at: "a", counts: { x: 3, y: 9 } }, { at: "b", counts: { y: 1 } }, { at: "c", counts: { x: 3 } }, { at: "d", counts: { x: 1 } }];
  assert.deepEqual(usageTrend(h, "x"), [3, 3, 1]);
  assert.deepEqual(usageTrend(h, "z"), []);
  const long = Array.from({ length: 9 }, (_, i) => ({ counts: { x: i } }));
  assert.deepEqual(usageTrend(long, "x"), [3, 4, 5, 6, 7, 8]);
  assert.deepEqual(usageTrend(undefined, "x"), []);
  assert.deepEqual(usageTrend([null, { counts: null }, { counts: { x: "n" } }], "x"), []);
});

test("trend text needs two points", () => {
  assert.equal(trendText([3, 3, 1]), "3 -> 3 -> 1");
  assert.equal(trendText([2, 1]), "2 -> 1");
  assert.equal(trendText([2]), "");
  assert.equal(trendText([]), "");
  assert.equal(trendText(undefined), "");
});
