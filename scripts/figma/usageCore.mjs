// Pure rules over a Usage (see usageScan.mjs). No node: imports: the review page imports this in the browser too.

// What a review item touches: { count, routes: [{ path, url }] (unique by path), uses }.
export function usageFor(usage, jsxName, item) {
  const all = usage?.components?.[jsxName] ?? [];
  const has = (u) => item.prop in u.attrs;
  let uses;
  if (item.kind === "removed-prop") uses = all.filter((u) => (item.onByDefault ? u.attrs[item.prop] !== false : has(u) && u.attrs[item.prop] !== false));
  else if (item.kind === "removed-option") uses = all.filter((u) => u.attrs[item.prop] === item.option);
  else uses = all;
  const seen = new Map();
  for (const u of uses) for (const r of u.routes) if (!seen.has(r.path)) seen.set(r.path, { path: r.path, url: r.url });
  return { count: uses.length, routes: [...seen.values()], uses };
}
