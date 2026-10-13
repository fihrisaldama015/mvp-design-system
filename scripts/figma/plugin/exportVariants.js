// Run through figma_execute (Desktop Bridge) in the COMPONENT file. Read-only
// (exportAsync does not change the file). Exports PNGs (2x) of the variants of SET
// that match WHERE, one per value of EACH, to the local receiver as
// fig-<set>-<each value>.png, for a side-by-side check against Storybook.
const _A = typeof ARGS !== "undefined" ? ARGS : {};
const SET = _A.SET || "Button";
const ID = _A.ID; // node ID of the set (figma-index.json / inventory): skips the whole-file search
const WHERE = _A.WHERE || { State: "default", Size: "md*", Disabled: "false", Loading: "false" };
const EACH = _A.EACH || ["Kind", "Status"]; // one image per combination of these properties
const PORT = _A.PORT || 9232;

let set = null;
if (ID) set = await figma.getNodeByIdAsync(ID);
if (!set) { await figma.loadAllPagesAsync(); set = figma.root.findOne((n) => n.type === "COMPONENT_SET" && n.name === SET); }
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const saved = [];
for (const v of set.children) {
  const p = v.variantProperties;
  if (!Object.entries(WHERE).every(([k, val]) => p[k] === val)) continue;
  const name = `fig-${slug(SET)}-${EACH.map((k) => slug(p[k])).join("-")}.png`;
  const bytes = await v.exportAsync({ format: "PNG", constraint: { type: "SCALE", value: 2 } });
  await fetch(`http://localhost:${PORT}/save?name=${name}`, { method: "POST", body: bytes });
  saved.push(name);
}
return saved;
