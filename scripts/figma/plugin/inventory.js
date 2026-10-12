// Run through figma_execute (Desktop Bridge) in the COMPONENT file. Read-only.
// Lists every page with its component sets (variant and property counts) and its
// single components. Small enough to return inline; docs/shield/inventory.md was
// written from this output.
await figma.loadAllPagesAsync();
const pages = [];
for (const page of figma.root.children) {
  const nodes = page.findAllWithCriteria({ types: ["COMPONENT_SET", "COMPONENT"] });
  const sets = nodes.filter((n) => n.type === "COMPONENT_SET");
  const singles = nodes.filter((n) => n.type === "COMPONENT" && (!n.parent || n.parent.type !== "COMPONENT_SET"));
  pages.push({
    page: page.name,
    sets: sets.map((s) => ({ name: s.name, variants: s.children.length, props: Object.keys(s.componentPropertyDefinitions || {}).length })),
    singles: singles.map((c) => c.name),
  });
}
return pages
  .filter((p) => p.sets.length || p.singles.length)
  .concat([{ emptyPages: pages.filter((p) => !p.sets.length && !p.singles.length).map((p) => p.page) }]);
