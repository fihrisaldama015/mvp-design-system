import { componentTypes, findComponentNodes, propMatcher } from "./highlightCore";

// Inside a preview frame of the review page: when the page asks, outline every instance of one design-system component
// (for example every Alert), so the reviewers see what a decision touches without guessing. It listens for a message from the
// parent window only and changes nothing in the app but a data attribute and one style rule. It keeps watching the DOM, so an
// instance that appears later (a step done, a menu opened) is outlined as soon as it shows.

const ATTR = "data-review-highlight";
const STYLE_ID = "review-highlight-style";
// A strong red (danger 600; the border token is a pale 200 and looked transparent). The padding is the outline offset: nothing moves in the layout.
const CSS = `[${ATTR}] { outline: 3px solid rgb(var(--brand-danger-600, 220 38 38)); outline-offset: 6px; border-radius: 4px; }`;

let types = null;
let matcher = null;
let parent = null; // { window, origin }: who asked, to tell them how many instances are outlined
let last = -1;
let observer = null;
let queued = false;

function rootFiber() {
  const container = document.getElementById("root");
  const key = container && Object.keys(container).find((k) => k.startsWith("__reactContainer$"));
  const host = key ? container[key] : null;
  return host?.stateNode?.current ?? host ?? null;
}

function mark() {
  queued = false;
  document.querySelectorAll(`[${ATTR}]`).forEach((n) => n.removeAttribute(ATTR));
  if (!types) return;
  const nodes = findComponentNodes(rootFiber(), types, matcher);
  for (const n of nodes) n.setAttribute(ATTR, "");
  report(nodes.size);
}

function schedule() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(mark);
}

function report(count) {
  if (!parent || count === last) return;
  last = count;
  parent.window.postMessage({ type: "review-highlight-result", count }, parent.origin);
}

async function turnOn(folder, load, item) {
  if (!/^[a-z0-9-]+$/.test(folder)) return;
  matcher = propMatcher(item ?? {});
  last = -1;
  try {
    types = componentTypes(await load(folder));
  } catch {
    return; // no such component folder: nothing to outline
  }
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
  }
  observer ??= new MutationObserver(schedule); // child changes only: setting our own attribute does not loop
  observer.observe(document.body, { childList: true, subtree: true });
  schedule();
}

function turnOff() {
  types = null;
  matcher = null;
  observer?.disconnect();
  mark();
  last = -1;
}

// load(folder) returns the module of the component folder: the project passes `(folder) => import(`components/${folder}/index.js`)`
// (the import must be written in the project, where its bundler resolves it).
export function installHighlight(load) {
  if (window.self === window.top || typeof load !== "function") return; // only inside a frame
  window.addEventListener("message", (e) => {
    if (e.source !== window.parent) return;
    const d = e.data;
    if (!d || d.type !== "review-highlight") return;
    parent = { window: e.source, origin: e.origin };
    if (d.on && typeof d.folder === "string") turnOn(d.folder, load, d.item); else turnOff();
  });
}
