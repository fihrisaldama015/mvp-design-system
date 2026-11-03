import { componentTypes, findComponentNodes } from "app/review/highlightCore";

// Inside a preview frame of the review page: when the page asks, outline every instance of one design-system component
// (for example every Alert), so the reviewers see what a decision touches without guessing. It listens for a message from the
// parent window only and changes nothing in the app but a data attribute and one style rule. It keeps watching the DOM, so an
// instance that appears later (a step done, a menu opened) is outlined as soon as it shows.

const ATTR = "data-review-highlight";
const STYLE_ID = "review-highlight-style";
// The padding is the outline offset: nothing moves in the layout.
const CSS = `[${ATTR}] { outline: 2px solid rgb(var(--theme-color-border-invert-danger, 220 38 38)); outline-offset: 6px; border-radius: 4px; }`;

let types = null;
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
  for (const n of findComponentNodes(rootFiber(), types)) n.setAttribute(ATTR, "");
}

function schedule() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(mark);
}

async function turnOn(folder) {
  if (!/^[a-z0-9-]+$/.test(folder)) return;
  try {
    types = componentTypes(await import(`../../components/${folder}/index.js`));
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
  observer?.disconnect();
  mark();
}

export function installHighlight() {
  if (window.self === window.top) return; // only inside a frame
  window.addEventListener("message", (e) => {
    if (e.source !== window.parent) return;
    const d = e.data;
    if (!d || d.type !== "review-highlight") return;
    if (d.on && typeof d.folder === "string") turnOn(d.folder); else turnOff();
  });
}
