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

// The route the page preview opens on: the first one whose url was resolved to a configured sample (url set and not the bare path), else the first route.
// Entries that are not objects are skipped; undefined when there is none.
export function defaultRoute(routes) {
  if (!Array.isArray(routes)) return undefined;
  const valid = routes.filter((r) => r && typeof r === "object");
  return valid.find((r) => typeof r.url === "string" && r.url !== "" && r.url !== r.path) ?? valid[0];
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

// The audit action in plain English (same strings as the service). Unknown text passes through; non-strings give "".
const EVENT_LABELS = {
  published: "Sent for review",
  "published (new cycle)": "Sent for review again, as a new review",
  "Figma changed: earlier answers dropped": "Figma changed: earlier answers were cleared, please answer again",
  "republished (same Figma state, answers kept)": "Synced again, nothing changed",
  decided: "Decision saved",
  applied: "Applied in the code",
};
export const eventLabel = (action) => (typeof action !== "string" ? "" : Object.hasOwn(EVENT_LABELS, action) ? EVENT_LABELS[action] : action);

// The same local date text the page shows; "" for a missing or invalid date.
export function defaultFormat(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString();
}

// Where a review stands: three steps (`current` = how many are finished) and a line for each, from the current cycle of the audit.
export function timelineSteps(audit, status, format = defaultFormat) {
  const entries = Array.isArray(audit) ? audit.filter((a) => a && typeof a === "object") : [];
  const starts = (a, text) => typeof a.action === "string" && a.action.startsWith(text);
  const isMarker = (a) => starts(a, "published") || starts(a, "Figma changed");
  const at = entries.findLastIndex(isMarker);
  const marker = at >= 0 ? entries[at] : null;
  const cycle = at >= 0 ? entries.slice(at) : entries;
  const last = (action) => cycle.findLast((a) => a.action === action);
  const text = (label, when) => [label, safe(format, when)].filter(Boolean).join(" ");
  const current = { pending: 1, answered: 2, applied: 3 }[status] ?? 1;

  const decided = last("decided");
  const applied = last("applied");
  return {
    labels: ["Sent for review", "Decided", "Applied in code"],
    current,
    details: [
      marker ? (starts(marker, "Figma changed") ? `${text("Figma changed", marker.at)}, review reopened` : text("Sent for review", marker.at)) : "",
      current >= 2 ? (decided ? [decided.by ? `Decided by ${decided.by}` : "Decided", safe(format, decided.at)].filter(Boolean).join(", ") : "Decided") : "Waiting for a decision",
      current === 3 ? (applied ? text("Applied", applied.at) : "Applied") : "Waiting for the developer",
    ],
  };
}

function safe(format, when) {
  try { return when ? String(format(when) ?? "") : ""; } catch { return ""; }
}

// The two prop sets the preview renders for a review item, { with, without, hint? }, or null when there is nothing to show.
// A removed prop uses spec.examples[prop], else is rendered on and off when its default is a boolean.
// A removed option needs spec.examples["prop=option"]. Any other kind, or malformed input, gives null.
export function previewProps(spec, item) {
  if (!spec || typeof spec !== "object" || !item || typeof item !== "object") return null;
  const from = (example) => (example && typeof example === "object" ? { with: example.with, without: example.without, ...(example.hint ? { hint: example.hint } : {}) } : null);
  if (item.kind === "removed-prop") {
    const example = from(spec.examples?.[item.prop]);
    if (example) return example;
    if (item.default === "true" || item.default === "false") return { with: { [item.prop]: true }, without: { [item.prop]: false } };
    return null;
  }
  if (item.kind === "removed-option") return from(spec.examples?.[`${item.prop}=${item.option}`]);
  return null;
}

// The captions under the two preview panels. A removed option names the option; a removed prop keeps the on/off wording.
export function previewNotes(prop, option) {
  if (option) return { without: `How it looks in Figma, which no longer has "${option}"`, with: `The current code, with ${prop} set to "${option}"` };
  return { without: "How the component looks in Figma", with: `The current code, with ${prop} on` };
}

// What kind of event an audit entry is, to pick its icon and how loud it is in the activity log.
export function activityKind(action) {
  if (typeof action !== "string") return "other";
  if (action === "decided") return "decided";
  if (action === "applied") return "applied";
  if (action.startsWith("Figma changed")) return "reopened";
  if (action.startsWith("republished")) return "synced";
  if (action.startsWith("published")) return "published";
  return "other";
}

// Who did it, in words a designer or PM knows: the tool's entries are the Figma sync, or the developer when applied.
export function actorLabel(entry) {
  const by = entry && typeof entry.by === "string" ? entry.by.trim() : "";
  if (by === "tool") return entry.action === "applied" ? "Developer" : "Figma sync";
  return by || "Someone";
}

// A review item id as a person reads it: "removed-prop:searchable" -> searchable, "removed-option:kind=outlined" -> kind="outlined".
export function itemName(id) {
  if (typeof id !== "string") return "";
  const rest = id.slice(id.indexOf(":") + 1);
  if (!id.includes(":")) return id;
  const eq = rest.indexOf("=");
  return eq < 0 ? rest : `${rest.slice(0, eq)}="${rest.slice(eq + 1)}"`;
}

// For each answered item: the answer, who gave it, when, the reason and the migrate-by date, from the current cycle of the
// audit (an earlier cycle's decision never shows). Missing parts are empty strings, so an old document still renders.
export function decisionDetails(audit, answers, migrateBy) {
  const entries = Array.isArray(audit) ? audit.filter((a) => a && typeof a === "object") : [];
  const at = entries.findLastIndex((a) => typeof a.action === "string" && (a.action.startsWith("published") || a.action.startsWith("Figma changed")));
  const cycle = at >= 0 ? entries.slice(at) : entries;
  const out = {};
  for (const [id, choice] of Object.entries(answers && typeof answers === "object" ? answers : {})) {
    if (!choice) continue;
    const entry = cycle.findLast((a) => a.action === "decided" && a.changes && typeof a.changes === "object" && Object.hasOwn(a.changes, id));
    out[id] = {
      choice,
      by: typeof entry?.by === "string" ? entry.by : "",
      at: typeof entry?.at === "string" ? entry.at : "",
      note: typeof entry?.note === "string" ? entry.note : "",
      migrateBy: typeof migrateBy?.[id] === "string" ? migrateBy[id] : "",
    };
  }
  return out;
}

// One plain sentence for someone who does not read code: what this review item is about.
export function changeSentence(component, item) {
  const name = typeof component === "string" && component ? component : "This component";
  if (!item || typeof item !== "object") return "";
  if (item.kind === "removed-option") return `In ${name}, the ${item.prop} "${item.option}" is not in Figma any more.`;
  if (item.kind === "removed-prop") return `In ${name}, the "${item.prop}" setting is not in Figma any more.`;
  return "";
}

// The developer's comment on a property, without the @deprecated tag (the page shows that as its own badge).
export const developerNote = (description) => (typeof description === "string" ? description.replace(/^@deprecated\s*/i, "").trim() : "");
