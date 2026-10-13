// Run through the loader (SKILL.md). Read-only. Checks that Figma IDs saved in the project
// still point at the same thing, without scanning the file.
// ARGS = { ITEMS: [{ id, kind: "variable" | "node" | "style", name }] } (name = what the index says it is)
// Returns one row per item: { id, found, name, same } and a summary. Use the rows that are not
// `same` to decide what to re-read; a missing or renamed ID means the file was duplicated or edited.
const _A = typeof ARGS !== "undefined" ? ARGS : {};
const out = [];
for (const it of _A.ITEMS || []) {
  let found = null;
  try {
    if (it.kind === "variable") { const v = await figma.variables.getVariableByIdAsync(it.id); found = v ? { name: v.name, type: v.resolvedType } : null; }
    else if (it.kind === "style") { const s = await figma.getStyleByIdAsync(it.id); found = s ? { name: s.name, type: s.type } : null; }
    else { const n = await figma.getNodeByIdAsync(it.id); found = n ? { name: n.name, type: n.type } : null; }
  } catch (e) { found = null; }
  out.push({ id: it.id, kind: it.kind, expected: it.name, found: !!found, name: found && found.name, same: !!found && (it.name == null || found.name === it.name || String(it.name).endsWith("/" + found.name) || found.name === String(it.name).split("/").slice(1).join("/")) });
}
return { checked: out.length, missing: out.filter((r) => !r.found).length, renamed: out.filter((r) => r.found && !r.same).length, rows: out.filter((r) => !r.found || !r.same) };
