// Finds the DOM elements a React component renders by walking React's fiber tree, so the review page can outline every
// instance of a component inside a preview frame without touching the component. Pure: no DOM globals, tested with fake fibers.

export const HOST_COMPONENT = 5; // React 18 fiber tag of a DOM element

// The outermost DOM elements a component fiber renders (a fragment gives several). Text nodes are skipped.
export function hostNodes(fiber) {
  const out = [];
  const stack = fiber?.child ? [fiber.child] : [];
  while (stack.length) {
    const f = stack.pop();
    if (f.sibling) stack.push(f.sibling);
    if (f.tag === HOST_COMPONENT) { if (f.stateNode) out.push(f.stateNode); } else if (f.child) stack.push(f.child);
  }
  return out;
}

// Every DOM element rendered by an instance of one of `types` (component functions, or forwardRef and memo objects, matched
// by identity so it also works in a minified build where names are gone). Iterative: a deep tree cannot overflow the stack.
export function findComponentNodes(rootFiber, types) {
  const found = new Set();
  const stack = rootFiber ? [rootFiber] : [];
  while (stack.length) {
    const f = stack.pop();
    if (f.sibling) stack.push(f.sibling);
    if (f.child) stack.push(f.child);
    if (types.has(f.type) || (f.elementType && types.has(f.elementType))) for (const n of hostNodes(f)) found.add(n);
  }
  return found;
}

// The component values a module exports: functions and forwardRef or memo objects. Plain data is left out.
export function componentTypes(mod) {
  const out = new Set();
  for (const v of Object.values(mod ?? {})) if (typeof v === "function" || (v && typeof v === "object" && "$$typeof" in v)) out.add(v);
  return out;
}
