// Drive one Storybook story in headless Chrome (CDP): hover, focus, press, type, and read
// computed styles after each step; optionally screenshot the element, cropped, at 2x.
// Serve the static build first: python3 -m http.server 6011 -d storybook-static
//
// Usage: node scripts/figma/interact.mjs <story-id> <css selector> [steps...] [--props a,b] [--shot out.png] [--port 6011]
//   steps: hover | focus | press | type=<text> | blur
//   e.g.  node scripts/figma/interact.mjs actions-button--primary button hover press --props background-color
//         node scripts/figma/interact.mjs forms-input--all-statuses "#storybook-root" --shot sb.png
import { spawn } from "node:child_process";
import fs from "node:fs";

const args = process.argv.slice(2);
const opt = (name, def) => (args.includes(name) ? args.splice(args.indexOf(name), 2)[1] : def);
const props = opt("--props", "background-color,border-color,color,box-shadow,outline-color").split(",");
const shot = opt("--shot", null);
const port = opt("--port", "6011");
const [storyId, selector, ...steps] = args;
const CHROME = ["google-chrome", "chromium", "chromium-browser"].find((c) => { try { return spawn("which", [c]).pid; } catch { return false; } });

const chrome = spawn(CHROME, ["--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--remote-debugging-port=9399", "--window-size=1400,1000", "about:blank"], { stdio: "ignore" });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await wait(2000);
const tabs = await (await fetch("http://127.0.0.1:9399/json")).json();
const ws = new WebSocket(tabs.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (x) => (await send("Runtime.evaluate", { expression: x, returnByValue: true })).result.value;

try {
  await send("Emulation.setDeviceMetricsOverride", { width: 1400, height: 1000, deviceScaleFactor: 2, mobile: false });
  await send("Page.navigate", { url: `http://localhost:${port}/iframe.html?id=${storyId}&viewMode=story` });
  await wait(3500);
  const q = JSON.stringify(selector);
  const box = await ev(`(()=>{const e=document.querySelector(${q});if(!e)return null;const b=e.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height}})()`);
  if (!box) throw new Error(`No element for ${selector}`);
  const read = async (label) => {
    const v = await ev(`(()=>{const s=getComputedStyle(document.querySelector(${q}));return ${JSON.stringify(props)}.map(p=>p+": "+s.getPropertyValue(p))})()`);
    console.log(`${label.padEnd(10)} ${v.join(" | ")}`);
  };
  const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
  await read("initial");
  for (const step of steps) {
    if (step === "hover") await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: cx, y: cy });
    else if (step === "press") await send("Input.dispatchMouseEvent", { type: "mousePressed", x: cx, y: cy, button: "left", clickCount: 1 });
    else if (step === "focus") await ev(`(document.querySelector(${q}).matches("input,textarea,select,button,[tabindex]")?document.querySelector(${q}):document.querySelector(${q}).querySelector("input,textarea,select,button,[tabindex]")).focus()`);
    else if (step === "blur") await ev(`document.activeElement && document.activeElement.blur()`);
    else if (step.startsWith("type=")) await send("Input.insertText", { text: step.slice(5) });
    await wait(300);
    await read(step);
  }
  if (shot) {
    const b = await ev(`(()=>{const e=document.querySelector(${q});const b=e.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height}})()`);
    const pad = 8;
    const res = await send("Page.captureScreenshot", { clip: { x: Math.max(0, b.x - pad), y: Math.max(0, b.y - pad), width: b.w + pad * 2, height: b.h + pad * 2, scale: 1 } });
    fs.writeFileSync(shot, Buffer.from(res.data, "base64"));
    console.log(`screenshot ${shot}`);
  }
} finally {
  ws.close();
  chrome.kill();
}
