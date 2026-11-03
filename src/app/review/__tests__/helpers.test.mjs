import test from "node:test";
import assert from "node:assert/strict";
import { embedUrl, frameUrls, publishedNote, validMigrateBy, missingDates, safeRouteUrl, mustChangePassword, changeText, daysLeft, deadlineText, usageTrend, trendText, eventLabel, timelineSteps, defaultRoute, previewProps, previewNotes, activityKind, actorLabel, itemName, decisionDetails } from "../helpers.js";

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

const fmt = (at) => (at ? `<${at}>` : "");

test("eventLabel maps every known audit action and passes unknown text through", () => {
  assert.equal(eventLabel("published"), "Published for review");
  assert.equal(eventLabel("published (new cycle)"), "Published again, new review");
  assert.equal(eventLabel("Figma changed: earlier answers dropped"), "Figma changed: earlier answers were cleared, please answer again");
  assert.equal(eventLabel("republished (same Figma state, answers kept)"), "Synced again, nothing changed");
  assert.equal(eventLabel("decided"), "Answered");
  assert.equal(eventLabel("applied"), "Applied by the developer");
  assert.equal(eventLabel("something else"), "something else");
  assert.equal(eventLabel(undefined), "");
  assert.equal(eventLabel(5), "");
});

test("timelineSteps pending: published done, answered waiting", () => {
  const t = timelineSteps([{ at: "A", action: "published", by: "x" }], "pending", fmt);
  assert.deepEqual(t, { labels: ["Published", "Answered", "Applied"], current: 1, details: ["Published <A>", "Waiting for the reviewers", "Waiting for the developer"] });
});

test("timelineSteps answered: names the last decider", () => {
  const audit = [{ at: "A", action: "published" }, { at: "B", action: "decided", by: "ann" }, { at: "C", action: "decided", by: "bob" }];
  const t = timelineSteps(audit, "answered", fmt);
  assert.equal(t.current, 2);
  assert.deepEqual(t.details, ["Published <A>", "Answered by bob, <C>", "Waiting for the developer"]);
});

test("timelineSteps applied: all three with dates", () => {
  const audit = [{ at: "A", action: "published" }, { at: "B", action: "decided", by: "ann" }, { at: "C", action: "applied", by: "dev" }];
  const t = timelineSteps(audit, "applied", fmt);
  assert.equal(t.current, 3);
  assert.deepEqual(t.details, ["Published <A>", "Answered by ann, <B>", "Applied <C>"]);
});

test("timelineSteps uses only the current cycle", () => {
  const audit = [{ at: "A", action: "published" }, { at: "B", action: "decided", by: "old" }, { at: "C", action: "published (new cycle)" }];
  const t = timelineSteps(audit, "pending", fmt);
  assert.deepEqual(t.details, ["Published <C>", "Waiting for the reviewers", "Waiting for the developer"]);
  assert.equal(timelineSteps(audit, "answered", fmt).details[1], "Answered");
});

test('timelineSteps "Figma changed" marker says the review was reopened', () => {
  const audit = [{ at: "A", action: "published" }, { at: "B", action: "decided", by: "old" }, { at: "C", action: "Figma changed: earlier answers dropped" }];
  const t = timelineSteps(audit, "pending", fmt);
  assert.deepEqual(t.details, ["Figma changed <C>, review reopened", "Waiting for the reviewers", "Waiting for the developer"]);
});

test("republished is not a cycle marker", () => {
  const audit = [{ at: "A", action: "published" }, { at: "B", action: "decided", by: "ann" }, { at: "C", action: "republished (same Figma state, answers kept)" }];
  const t = timelineSteps(audit, "answered", fmt);
  assert.deepEqual(t.details, ["Published <A>", "Answered by ann, <B>", "Waiting for the developer"]);
});

test("timelineSteps survives an old document: missing audit, bad dates, unknown status", () => {
  assert.deepEqual(timelineSteps(undefined, undefined), { labels: ["Published", "Answered", "Applied"], current: 1, details: ["", "Waiting for the reviewers", "Waiting for the developer"] });
  assert.equal(timelineSteps("nope", "weird").current, 1);
  const t = timelineSteps([{ action: "published", at: "garbage" }, { action: "decided", at: "garbage" }, { action: "applied" }], "applied");
  assert.deepEqual(t.details, ["Published", "Answered", "Applied"]);
  assert.equal(timelineSteps([{ action: "decided", by: "z", at: "2026-01-01T00:00:00Z" }], "answered", fmt).details[0], "");
  assert.doesNotThrow(() => timelineSteps([null, {}, { action: 3 }], "answered"));
});

test("defaultRoute prefers the first route with a configured sample", () => {
  const routes = [{ path: "/reservations/new", url: "/reservations/new" }, { path: "/reservations/:id", url: "/reservations/RS-1001" }, { path: "/b/:id", url: "/b/1" }];
  assert.equal(defaultRoute(routes), routes[1]);
});

test("defaultRoute falls back to the first route when none has a sample", () => {
  const routes = [{ path: "/a", url: "/a" }, { path: "/b/:id", url: "" }, { path: "/c/:id", url: null }];
  assert.equal(defaultRoute(routes), routes[0]);
});

test("defaultRoute of an empty or missing list is undefined", () => {
  assert.equal(defaultRoute([]), undefined);
  assert.equal(defaultRoute(undefined), undefined);
  assert.equal(defaultRoute("nope"), undefined);
});

test("defaultRoute skips malformed entries", () => {
  const good = { path: "/a/:id", url: "/a/1" };
  assert.equal(defaultRoute([null, 3, "x", good]), good);
  const first = { path: "/a", url: "/a" };
  assert.equal(defaultRoute([null, first]), first);
  assert.equal(defaultRoute([null, 3]), undefined);
});

test("previewProps uses an example for a removed prop", () => {
  const ex = { with: { a: 1 }, without: {} };
  assert.deepEqual(previewProps({ examples: { action: ex } }, { kind: "removed-prop", prop: "action", default: "true" }), { with: { a: 1 }, without: {} });
});

test("previewProps renders a boolean removed prop on and off", () => {
  assert.deepEqual(previewProps({}, { kind: "removed-prop", prop: "invert", default: "false" }), { with: { invert: true }, without: { invert: false } });
  assert.deepEqual(previewProps({}, { kind: "removed-prop", prop: "x", default: "true" }), { with: { x: true }, without: { x: false } });
});

test("previewProps returns null for a removed prop with no example and no boolean default", () => {
  assert.equal(previewProps({}, { kind: "removed-prop", prop: "size", default: "md" }), null);
  assert.equal(previewProps({ examples: {} }, { kind: "removed-prop", prop: "size" }), null);
});

test("previewProps uses the prop=option example for a removed option", () => {
  const spec = { examples: { "kind=outlined": { with: { kind: "outlined" }, without: { kind: "filled" } } } };
  assert.deepEqual(previewProps(spec, { kind: "removed-option", prop: "kind", option: "outlined" }), { with: { kind: "outlined" }, without: { kind: "filled" } });
});

test("previewProps returns null for a removed option without an example", () => {
  assert.equal(previewProps({ examples: { kind: { with: {}, without: {} } } }, { kind: "removed-option", prop: "kind", option: "outlined" }), null);
  assert.equal(previewProps({}, { kind: "removed-option", prop: "kind", option: "outlined" }), null);
});

test("previewProps carries the example hint", () => {
  const spec = { examples: { "kind=outlined": { with: {}, without: {}, hint: "Compare." }, action: { with: {}, without: {} } } };
  assert.equal(previewProps(spec, { kind: "removed-option", prop: "kind", option: "outlined" }).hint, "Compare.");
  assert.equal("hint" in previewProps(spec, { kind: "removed-prop", prop: "action" }), false);
});

test("previewProps returns null for other kinds and malformed input", () => {
  assert.equal(previewProps({}, { kind: "removed-component" }), null);
  assert.equal(previewProps(null, { kind: "removed-prop", prop: "a", default: "true" }), null);
  assert.equal(previewProps({}, null), null);
  assert.equal(previewProps(undefined, undefined), null);
  assert.equal(previewProps("x", 3), null);
  assert.equal(previewProps({ examples: { a: null } }, { kind: "removed-prop", prop: "a" }), null);
});

test("previewNotes words a removed option and keeps the boolean wording for a removed prop", () => {
  assert.deepEqual(previewNotes("kind", "outlined"), { without: 'How it looks in Figma, which no longer has "outlined"', with: 'The current code, with kind set to "outlined"' });
  assert.deepEqual(previewNotes("action"), { without: "How the component looks in Figma", with: "The current code, with action on" });
});

test("activityKind classifies every audit action and unknown text as other", () => {
  assert.equal(activityKind("published"), "published");
  assert.equal(activityKind("published (new cycle)"), "published");
  assert.equal(activityKind("Figma changed: earlier answers dropped"), "reopened");
  assert.equal(activityKind("republished (same Figma state, answers kept)"), "synced");
  assert.equal(activityKind("decided"), "decided");
  assert.equal(activityKind("applied"), "applied");
  assert.equal(activityKind("something else"), "other");
  assert.equal(activityKind(undefined), "other");
});

test("actorLabel names the sync tool and the developer, and keeps a person's name", () => {
  assert.equal(actorLabel({ by: "tool", action: "published" }), "Figma sync");
  assert.equal(actorLabel({ by: "tool", action: "applied" }), "Developer");
  assert.equal(actorLabel({ by: "  Siti Aminah ", action: "decided" }), "Siti Aminah");
  assert.equal(actorLabel({ action: "decided" }), "Someone");
  assert.equal(actorLabel(null), "Someone");
});

test("itemName strips the kind and quotes an option", () => {
  assert.equal(itemName("removed-prop:searchable"), "searchable");
  assert.equal(itemName("removed-option:kind=outlined"), 'kind="outlined"');
  assert.equal(itemName("plain"), "plain");
  assert.equal(itemName(undefined), "");
});

test("decisionDetails finds who decided each answered item in the current cycle", () => {
  const audit = [
    { at: "2026-11-01T01:00:00Z", by: "tool", action: "published" },
    { at: "2026-11-01T02:00:00Z", by: "Siti", action: "decided", changes: { "removed-prop:a": "keep" }, note: "first" },
    { at: "2026-11-01T03:00:00Z", by: "Budi", action: "decided", changes: { "removed-prop:a": "follow-figma", "removed-prop:b": "keep-deprecated" }, migrateBy: { "removed-prop:b": "2026-12-01" }, note: "second" },
  ];
  const d = decisionDetails(audit, { "removed-prop:a": "follow-figma", "removed-prop:b": "keep-deprecated" }, { "removed-prop:b": "2026-12-01" });
  assert.deepEqual(d["removed-prop:a"], { choice: "follow-figma", by: "Budi", at: "2026-11-01T03:00:00Z", note: "second", migrateBy: "" });
  assert.deepEqual(d["removed-prop:b"], { choice: "keep-deprecated", by: "Budi", at: "2026-11-01T03:00:00Z", note: "second", migrateBy: "2026-12-01" });
});

test("decisionDetails ignores an earlier cycle and survives old documents", () => {
  const audit = [
    { at: "2026-10-01T01:00:00Z", by: "tool", action: "published" },
    { at: "2026-10-01T02:00:00Z", by: "Siti", action: "decided", changes: { "removed-prop:a": "keep" } },
    { at: "2026-11-01T01:00:00Z", by: "tool", action: "Figma changed: earlier answers dropped" },
  ];
  assert.deepEqual(decisionDetails(audit, { "removed-prop:a": "keep" }, {}), { "removed-prop:a": { choice: "keep", by: "", at: "", note: "", migrateBy: "" } });
  assert.deepEqual(decisionDetails(undefined, undefined, undefined), {});
  assert.deepEqual(decisionDetails([null, 3, {}], { x: "keep" }, null), { x: { choice: "keep", by: "", at: "", note: "", migrateBy: "" } });
});
