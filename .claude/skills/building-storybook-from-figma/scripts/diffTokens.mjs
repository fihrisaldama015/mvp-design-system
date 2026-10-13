// Compare a generated Brücke-shaped design_token.json with another export, per collection.
// Usage: node scripts/figma/diffTokens.mjs <generated.json> <reference.json> [maxExamples] [--ignore-style-id]
import fs from "node:fs";

const [, , genPath, snapPath, maxArg] = process.argv;
const gen = JSON.parse(fs.readFileSync(genPath, "utf8"));
const snap = JSON.parse(fs.readFileSync(snapPath, "utf8"));
const MAX = Number(maxArg ?? 6);
// A copy of a Figma file gets new style IDs, so styleId never matches a copy: ignore it.
const IGNORE_STYLE_ID = process.argv.includes("--ignore-style-id");
// Hex colours compare case-insensitively (#8B0836 == #8b0836).
const lower = (v) => (typeof v === "string" && /^#[0-9a-f]{3,8}$/i.test(v) ? v.toLowerCase() : v);
const norm = (f, v) => (IGNORE_STYLE_ID && f === "$extensions" && v && "styleId" in v ? { ...v, styleId: undefined } : lower(v));

function flatten(o, path = [], acc = new Map()) {
  if (o && typeof o === "object" && "$value" in o) acc.set(path.join("/"), o);
  else for (const [k, v] of Object.entries(o || {})) if (!k.startsWith("$")) flatten(v, [...path, k], acc);
  return acc;
}

const collections = Object.keys(snap).filter((k) => k !== "$extensions");
for (const c of collections) {
  const a = flatten(gen[c]);
  const b = flatten(snap[c]);
  const onlyGen = [...a.keys()].filter((k) => !b.has(k));
  const onlySnap = [...b.keys()].filter((k) => !a.has(k));
  const changed = [];
  const fieldCount = {};
  for (const [k, v] of b) {
    if (!a.has(k)) continue;
    const g = a.get(k);
    const fields = ["$type", "$value", "$description", "scopes", "$extensions"].filter(
      (f) => JSON.stringify(norm(f, g[f])) !== JSON.stringify(norm(f, v[f])),
    );
    if (fields.length) {
      changed.push({ k, fields, gen: g, snap: v });
      for (const f of fields) fieldCount[f] = (fieldCount[f] || 0) + 1;
    }
  }
  const same = b.size - changed.length - onlySnap.length;
  const status = !onlyGen.length && !onlySnap.length && !changed.length ? "IDENTICAL" : "DIFF";
  console.log(`\n## ${c}: ${status}  snapshot=${b.size} generated=${a.size} identical=${same} changed=${changed.length} new=${onlyGen.length} missing=${onlySnap.length}`);
  if (Object.keys(fieldCount).length) console.log("   changed fields:", JSON.stringify(fieldCount));
  for (const x of changed.slice(0, MAX))
    for (const f of x.fields) console.log(`   ~ ${x.k} [${f}] gen=${JSON.stringify(x.gen[f])} snap=${JSON.stringify(x.snap[f])}`);
  if (onlyGen.length) console.log("   + new:", onlyGen.slice(0, MAX * 3).join(", "), onlyGen.length > MAX * 3 ? "..." : "");
  if (onlySnap.length) console.log("   - missing:", onlySnap.slice(0, MAX * 3).join(", "));
}
