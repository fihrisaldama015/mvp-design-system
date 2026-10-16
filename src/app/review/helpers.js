// Small pure rules for the review page (tested in __tests__/helpers.test.mjs).

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

// The two iframe addresses for one affected page. `route.url` is a concrete path or null (a route with
// parameters and no sample). `after` is null without a usable previewUrl.
export function frameUrls(route, previewUrl, origin) {
  if (!route || route.url === null || route.url === undefined) return { now: null, after: null, sample: false };
  let after = null;
  try {
    if (previewUrl) after = new URL(route.url, new URL(previewUrl).origin).href;
  } catch { /* not a url: show only the Now frame */ }
  return { now: `${origin.replace(/\/$/, "")}${route.url}`, after, sample: true };
}

// "N pages when this was published", only when it differs from today's count.
export function publishedNote(currentCount, published) {
  if (!published || typeof published.count !== "number" || published.count === currentCount) return null;
  return `${plural(published.count, "page", "pages")} when this was published`;
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
