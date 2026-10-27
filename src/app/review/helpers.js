// Small pure rules for the review page (tested in __tests__/helpers.test.mjs).

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

// The two iframe addresses for one affected page. `route.url` is a concrete path or null (a route with
// parameters and no sample). `after` is null without a usable previewUrl.
// Only a same-site path ("/reservations"): never "//host" or a scheme.
export const safeRouteUrl = (url) => typeof url === "string" && /^\/(?!\/)/.test(url);

// The same address with ?embed=1: the app then shows the page without its sidebar and top bar (see app/Layout.js),
// so a small frame is all content. "Open in a new tab" keeps the plain address (the whole app).
export function embedUrl(url) {
  if (!url) return null;
  const u = new URL(url);
  u.searchParams.set("embed", "1");
  return u.href;
}

export function frameUrls(route, previewUrl, origin) {
  if (!route || !safeRouteUrl(route.url)) return { now: null, after: null, sample: false };
  let after = null;
  try {
    if (previewUrl) after = new URL(route.url, new URL(previewUrl).origin).href;
  } catch { /* not a url: show only the Now frame */ }
  const now = new URL(route.url, origin.replace(/\/$/, "")).href;
  return { now, after, nowEmbed: embedUrl(now), afterEmbed: embedUrl(after), sample: true };
}

// "N pages when this was published" (pages = distinct routes), only when it differs from today's page count.
export function publishedNote(currentPages, published) {
  const n = published?.routes?.length;
  if (typeof n !== "number" || n === currentPages) return null;
  return `${plural(n, "page", "pages")} when this was published`;
}

// The service refuses everything but the password change while the account is locked.
export const mustChangePassword = (r) => Boolean(r && r.status === 403 && r.json?.error === "Change your password first.");

// One line of the decision history: the choice in plain English, with the migrate-by date when known.
export function changeText(choice, labels, date) {
  if (!choice) return "answer cleared";
  const label = labels[choice] ?? choice;
  return date ? `${label} (migrate by ${date})` : label;
}

export function validMigrateBy(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

// Item ids chosen as keep-deprecated whose migrate-by date is missing or not a real date.
export function missingDates(changes, dates) {
  return Object.keys(changes).filter((id) => changes[id] === "keep-deprecated" && !validMigrateBy(dates[id]));
}

// Whole days from today (local date) to a YYYY-MM-DD date: negative when overdue, null when the date is missing or not real.
export function daysLeft(dateString, today = new Date()) {
  if (!validMigrateBy(dateString)) return null;
  const [y, m, d] = dateString.split("-").map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) / 86400000);
}

// "Migrate by 2026-10-31 (4 days left)"; "" when the date is missing or invalid.
export function deadlineText(dateString, today = new Date()) {
  const n = daysLeft(dateString, today);
  if (n === null) return "";
  const state = n === 0 ? "due today" : n > 0 ? `${plural(n, "day", "days")} left` : `overdue by ${plural(-n, "day", "days")}`;
  return `Migrate by ${dateString} (${state})`;
}

// The counts of one item over the published usage history (each entry { at, counts }), oldest first, last 6.
export function usageTrend(usageHistory, itemId) {
  if (!Array.isArray(usageHistory)) return [];
  const counts = usageHistory.map((h) => h?.counts?.[itemId]).filter((c) => typeof c === "number" && Number.isFinite(c));
  return counts.slice(-6);
}

export const trendText = (counts) => (Array.isArray(counts) && counts.length >= 2 ? counts.join(" -> ") : "");

export const NOTE_MAX = 500;
