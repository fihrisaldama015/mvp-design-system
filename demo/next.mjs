// Advances the demo one step: logs its mark, copies its prompt to the clipboard and prints what to do.
// node demo/next.mjs            next step        --peek   show the next step only     --back   go one step back (no mark; also --prev)
//                               --again  show the current step again and copy its prompt (no mark)
// node demo/next.mjs --part D   start a part at its zero step with a fresh counter and log
// node demo/next.mjs --goto D1  jump to a step   --reset  start over (keeps the old log under another name)  --list   show all steps
import { appendFileSync, existsSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const here = (f) => new URL(f, import.meta.url);
const steps = JSON.parse(readFileSync(here("./steps.json"), "utf8"));
const stateFile = process.env.DEMO_STATE ? process.env.DEMO_STATE : here("./.step").pathname;
const logFile = process.env.DEMO_LOG ? process.env.DEMO_LOG : here("./marks.log").pathname;

const read = () => (existsSync(stateFile) ? Number(readFileSync(stateFile, "utf8")) : -1);
const write = (n) => writeFileSync(stateFile, String(n));

// The first tool that works wins; false when none is installed.
export function copy(text) {
  const tools = [["wl-copy"], ["xclip", "-selection", "clipboard"], ["pbcopy"], ["clip.exe"]];
  return tools.some(([cmd, ...args]) => spawnSync(cmd, args, { input: text, stdio: ["pipe", "ignore", "ignore"], timeout: 3000 }).status === 0);
}

// The first unknown-prop finding of the newest slice report under docs/slices (run from the dev repo).
export function promptFromReport(dir = "docs/slices") {
  if (!existsSync(dir)) return { error: `no ${dir} folder here: run this from the dev repo` };
  const reports = readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => `${dir}/${f}`)
    .filter((f) => readFileSync(f, "utf8").startsWith("# Slice report:"))
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  const line = reports.length && readFileSync(reports[0], "utf8").split("\n").find((l) => /^- unknown-prop: .* has no property "/.test(l));
  const m = line && line.match(/unknown-prop: (\S+) (\w+) has no property "([^"]+)"/);
  if (!m) return { error: reports.length ? `no unknown-prop finding in ${reports[0]}: use the fallback in RUNSHEET.md` : "no slice report found" };
  const [, where, comp, prop] = m;
  return { report: reports[0], prompt: `The slice reported: ${comp} has no property "${prop}" (${where}). Check whether ${comp} already passes ${prop} through to the DOM and what its docs say. If it does, declare ${prop} in its propTypes with a description and add or update a story for it. Do not change the page.` };
}

function show(step, copied) {
  console.log(`\n${step.id}  ${step.label}`);
  if (step.where) console.log(`WHERE: ${step.where}`);
  console.log(step.hint);
  if (step.prompt) console.log(copied ? "\n(prompt copied: paste it with Ctrl+Shift+V)" : `\n(no clipboard tool found, type this)\n${step.prompt}`);
  console.log("");
}

const arg = process.argv[2];
const KNOWN = ["--list", "--reset", "--back", "--prev", "--previous", "--again", "--peek", "--part", "--goto"];
if (arg && arg.startsWith("--") && !KNOWN.includes(arg)) { console.error(`unknown option ${arg}; options: ${KNOWN.join(" ")}`); process.exit(2); }
const i = read();

// Shows a step; builds its prompt from the report when it asks for that; copies the prompt.
function present(step) {
  if (step.promptFrom === "report") {
    const r = promptFromReport();
    if (r.error) { show(step, false); console.log(r.error + "\n"); return; }
    step.prompt = r.prompt;
    console.log(`(from ${r.report})`);
  }
  show(step, step.prompt ? copy(step.prompt) : false);
}
if (arg === "--list") { steps.forEach((s, n) => console.log(`${n === i ? ">" : " "} ${s.id}  ${s.label}`)); process.exit(0); }
function reset() {
  rmSync(stateFile, { force: true });
  // The old log is kept (marks-<time>.log), never deleted: it is what the edit of that take needs.
  if (existsSync(logFile)) { const kept = logFile.replace(/marks\.log$/, `marks-${new Date().toISOString().replace(/[:.]/g, "-")}.log`); renameSync(logFile, kept); console.log(`old marks kept as ${kept}`); }
}
if (arg === "--reset") { reset(); console.log("step counter reset"); process.exit(0); }
if (arg === "--back" || arg === "--prev" || arg === "--previous") { write(Math.max(i - 1, -1)); console.log(`counter moved back: the next call shows ${steps[Math.max(i, 0)].id} again`); process.exit(0); }
if (arg === "--again") { if (i < 0) { console.log("no step yet"); process.exit(0); } present(steps[i]); process.exit(0); }
if (arg === "--peek") { const s = steps[i + 1]; s ? show(s, false) : console.log("no more steps"); process.exit(0); }

let n = i + 1;
if (arg === "--part") {
  // Start a part from its zero step (A0, B0, D0) with a fresh counter and a fresh marks.log.
  const id = `${process.argv[3]}0`;
  n = steps.findIndex((s) => s.id === id);
  if (n < 0) { console.error(`no part ${process.argv[3]}; parts: ${steps.filter((s) => s.id.endsWith("0")).map((s) => s.id[0]).join(" ")}`); process.exit(1); }
  reset();
} else if (arg === "--goto") {
  n = steps.findIndex((s) => s.id === process.argv[3]);
  if (n < 0) { console.error(`unknown step ${process.argv[3]}; ids: ${steps.map((s) => s.id).join(" ")}`); process.exit(1); }
}
const step = steps[n];
if (!step) { console.log("that was the last step"); process.exit(0); }
appendFileSync(logFile, JSON.stringify({ at: new Date().toISOString(), id: step.id, label: step.label }) + "\n");
write(n);
present(step);
