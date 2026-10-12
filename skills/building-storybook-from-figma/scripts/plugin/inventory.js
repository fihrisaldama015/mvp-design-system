// Run through the loader (SKILL.md) in the COMPONENT file. Read-only.
// Saves inventory.json (every page with its component sets and single components, with their node IDs) through
// the local receiver and returns only the counts, so the list never goes through the chat.
// Read it with: node scripts/figma/listSets.mjs [filter]
// The first call on a big file can time out (cold page load): call it again.
const _A = typeof ARGS !== "undefined" ? ARGS : {};
const PORT = _A.PORT || 9232;
await figma.loadAllPagesAsync();
const pages = [];
for (const page of figma.root.children) {
  const nodes = page.findAllWithCriteria({ types: ["COMPONENT_SET", "COMPONENT"] });
  const sets = nodes.filter((n) => n.type === "COMPONENT_SET");
  const singles = nodes.filter((n) => n.type === "COMPONENT" && (!n.parent || n.parent.type !== "COMPONENT_SET"));
  pages.push({
    page: page.name,
    pageId: page.id,
    sets: sets.map((s) => ({ name: s.name, id: s.id, variants: s.children.length, props: Object.keys(s.componentPropertyDefinitions || {}).length })),
    singles: singles.map((c) => ({ name: c.name, id: c.id })),
  });
}
const saved = await (await fetch(`http://localhost:${PORT}/save?name=inventory.json`, { method: "POST", body: JSON.stringify({ file: figma.root.name, pages }, null, 1) })).text();
return { file: figma.root.name, pages: pages.length, sets: pages.reduce((n, p) => n + p.sets.length, 0), saved };
