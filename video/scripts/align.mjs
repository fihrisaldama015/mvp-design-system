// Measure the TTS audio and write src/audioTiming.json, so the video follows the voice:
// scene length = audio length, and every caption / animation that keys off a sentence starts when that
// sentence is spoken. One audio file per scene: public/audio/scene1.mp3 ... (scene7 has no narration).
//
// How the sentence starts are found: ffmpeg silencedetect lists the pauses; the pauses that best match
// the expected sentence boundaries (by text length, preferring longer pauses) are chosen with a small DP.
// Pauses inside a sentence (commas) are ignored. If it is not sure it says so; see the report.
//
// Usage: node scripts/align.mjs [scene3 scene5 ...]   (default: every audio file found)
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const FPS = 30, LEAD = 15, TAIL = 36; // frames before the voice starts / after it ends
const NOISE = process.env.NOISE ?? "-32dB", MIN_PAUSE = process.env.MIN_PAUSE ?? "0.15";
const narration = JSON.parse(fs.readFileSync("src/narration.json", "utf8"));
const dir = "public/audio";
const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /^scene\d+\.(mp3|wav|m4a|ogg)$/i.test(f)) : [];
const only = process.argv.slice(2);
const table = fs.existsSync("src/audioTiming.json") ? JSON.parse(fs.readFileSync("src/audioTiming.json", "utf8")) : {};

const run = (cmd, args) => spawnSync(cmd, args, { encoding: "utf8" });
const duration = (f) => parseFloat(run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).stdout);
const silences = (f) => {
  const err = run("ffmpeg", ["-hide_banner", "-i", f, "-af", `silencedetect=noise=${NOISE}:d=${MIN_PAUSE}`, "-f", "null", "-"]).stderr;
  const out = []; let start = null;
  for (const line of err.split("\n")) {
    const a = line.match(/silence_start: ([\d.]+)/), b = line.match(/silence_end: ([\d.]+) \| silence_duration: ([\d.]+)/);
    if (a) start = parseFloat(a[1]);
    if (b) { out.push({ start: start ?? parseFloat(b[1]) - parseFloat(b[2]), end: parseFloat(b[1]), dur: parseFloat(b[2]) }); start = null; }
  }
  if (start !== null) out.push({ start, end: Infinity, dur: Infinity }); // silence running to the end of the file
  return out;
};

let problems = 0;
for (const f of files) {
  const id = f.replace(/\.\w+$/, "").toLowerCase();
  if (only.length && !only.includes(id)) continue;
  const sentences = narration[id];
  if (!sentences) { console.log(`${id}: no narration text for this file, skipped`); continue; }
  const file = path.join(dir, f), total = duration(file), sil = silences(file);
  // speech runs from the end of a leading silence to the start of a trailing one
  const speechStart = sil.length && sil[0].start < 0.05 ? sil[0].end : 0;
  const tail = sil.length && sil[sil.length - 1].end === Infinity ? sil[sil.length - 1] : null;
  const speechEnd = tail ? tail.start : total;
  const inner = sil.filter((s) => s.start > speechStart + 0.05 && s.end !== Infinity);
  const k = sentences.length;
  const chars = sentences.map((s) => s.length + 8);
  const sum = chars.reduce((a, b) => a + b, 0);
  let acc = 0;
  const expected = chars.map((c) => { const t = speechStart + (acc / sum) * (speechEnd - speechStart); acc += c; return t; }); // expected start of each sentence
  let starts = expected.slice(), how = "spread by text length (no usable pauses)", worst = 0;
  if (k > 1 && inner.length >= k - 1) {
    // choose k-1 pauses, in order, minimising |resume time - expected| - 2*pause length
    const cost = (i, j) => Math.abs(inner[j].end - expected[i]) - 2 * inner[j].dur;
    const dp = Array.from({ length: k }, () => Array(inner.length).fill(Infinity)), from = Array.from({ length: k }, () => Array(inner.length).fill(-1));
    for (let j = 0; j < inner.length; j++) dp[1][j] = cost(1, j);
    for (let i = 2; i < k; i++) for (let j = i - 1; j < inner.length; j++) for (let p = i - 2; p < j; p++) { const v = dp[i - 1][p] + cost(i, j); if (v < dp[i][j]) { dp[i][j] = v; from[i][j] = p; } }
    let j = dp[k - 1].indexOf(Math.min(...dp[k - 1]));
    const pick = [];
    for (let i = k - 1; i >= 1; i--) { pick[i] = j; j = from[i][j]; }
    starts = [speechStart, ...pick.slice(1).map((jj) => inner[jj].end)];
    how = `${inner.length} pauses found, ${k - 1} used`;
    worst = Math.max(...starts.map((t, i) => Math.abs(t - expected[i])));
  }
  const avg = (speechEnd - speechStart) / k;
  const sure = k === 1 || (inner.length >= k - 1 && worst < Math.max(1.5, avg * 0.6));
  if (!sure) problems++;
  const lead = 0.1; // captions and visuals appear a touch before the word
  const frames = starts.map((t) => Math.max(LEAD, Math.round(LEAD + (t - lead) * FPS)));
  table[id] = { audio: `audio/${f}`, audioStart: LEAD, durationFrames: LEAD + Math.ceil(total * FPS) + TAIL, starts: frames, how, sure };
  console.log(`\n${id}  ${total.toFixed(1)} s  ${how}  ${sure ? "OK" : "CHECK"}`);
  starts.forEach((t, i) => console.log(`  ${String(i).padStart(2)}  ${t.toFixed(2).padStart(6)} s   ${sentences[i].slice(0, 70)}`));
}
fs.writeFileSync("src/audioTiming.json", JSON.stringify(table, null, 2) + "\n");
const missing = Object.keys(narration).filter((id) => !table[id]);
console.log(`\nsrc/audioTiming.json: ${Object.keys(table).length} scene(s) with audio${missing.length ? `; still without audio: ${missing.join(", ")}` : ""}`);
if (problems) console.log(`${problems} scene(s) marked CHECK: the pauses did not match the sentences well. Listen at those times, or regenerate with a clearer pause after each sentence (or one file per sentence).`);
