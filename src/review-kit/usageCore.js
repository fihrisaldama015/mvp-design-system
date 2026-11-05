// Pure rules over a Usage (see usageScan.mjs). No node: imports: the review page imports this in the browser too.

// The "how to see it" steps a project writes in figma-tokens.config.json (review.howToSee): { Component: { "/route": [steps] } }.
// Some components only show after the user did something on the page (fill in a step, pick an option). The steps say what to
// do. An entry is kept only when it is a list of 1 to 8 non-empty texts of at most 200 characters; the rest is dropped, with a reason.
export function cleanHowToSee(raw) {
  const clean = {}, dropped = [];
  if (raw == null) return { clean, dropped };
  if (typeof raw !== "object" || Array.isArray(raw)) return { clean, dropped: ['howToSee must be an object: { Component: { "/route": [steps] } }'] };
  for (const [component, routes] of Object.entries(raw)) {
    if (component === "__proto__") continue;
    if (!routes || typeof routes !== "object" || Array.isArray(routes)) { dropped.push(`${component}: expected { "/route": [steps] }`); continue; }
    for (const [route, steps] of Object.entries(routes)) {
      const ok = Array.isArray(steps) && steps.length >= 1 && steps.length <= 8 && steps.every((x) => typeof x === "string" && x.trim() && x.trim().length <= 200);
      if (!ok) { dropped.push(`${component} ${route}: steps must be 1 to 8 texts of at most 200 characters`); continue; }
      if (!Object.hasOwn(clean, component)) clean[component] = {};
      clean[component][route] = steps.map((x) => x.trim());
    }
  }
  return { clean, dropped };
}

const stepsFor = (usage, jsxName, path) => {
  const byRoute = usage?.howToSee && Object.hasOwn(usage.howToSee, jsxName) ? usage.howToSee[jsxName] : null;
  return byRoute && Object.hasOwn(byRoute, path) ? byRoute[path] : null;
};

// What a review item touches: { count, routes: [{ path, url, steps? }] (unique by path), uses }.
export function usageFor(usage, jsxName, item) {
  const all = usage?.components?.[jsxName] ?? [];
  const has = (u) => item.prop in u.attrs;
  const spread = (u) => "..." in u.attrs; // a spread can pass any prop
  let uses;
  if (item.kind === "removed-prop") uses = all.filter((u) => (item.onByDefault ? u.attrs[item.prop] !== false : (has(u) && u.attrs[item.prop] !== false) || spread(u)));
  else if (item.kind === "removed-option") uses = all.filter((u) => u.attrs[item.prop] === item.option || u.attrs[item.prop] === "expr" || spread(u));
  else uses = all;
  const seen = new Map();
  for (const u of uses) for (const r of u.routes) if (!seen.has(r.path)) { const steps = stepsFor(usage, jsxName, r.path); seen.set(r.path, { path: r.path, url: r.url, ...(steps ? { steps } : {}) }); }
  return { count: uses.length, routes: [...seen.values()], uses };
}
