// Word timings in video frames, for the kinetic captions: .align/words.json (npm run transcribe, seconds from the start of
// each audio file) + src/audioTiming.json (npm run align, the frame where each audio starts) -> src/wordTiming.json.
//   { "scene1": [["Getting", 15, 24], ["a", 24, 28], ...] }  (word, start frame, end frame)
// Run it after `npm run align`. A scene without words keeps the plain sentence captions.
import fs from "node:fs";

// `node scripts/words.mjs demo` does the demo video (.align/demo-words.json + src/demo/audioTiming.json -> src/demo/wordTiming.json).
const SET = process.argv[2] === "demo" ? "demo" : "";
const WORDS = SET ? ".align/demo-words.json" : ".align/words.json";
const TIMING = SET ? "src/demo/audioTiming.json" : "src/audioTiming.json";
const OUT = SET ? "src/demo/wordTiming.json" : "src/wordTiming.json";
const FPS = 30;
const words = fs.existsSync(WORDS) ? JSON.parse(fs.readFileSync(WORDS, "utf8")) : null;
const timing = fs.existsSync(TIMING) ? JSON.parse(fs.readFileSync(TIMING, "utf8")) : {};
if (!words) { console.error(`No ${WORDS}. Run the transcription first (see the README).`); process.exit(1); }

const out = {};
for (const [scene, list] of Object.entries(words)) {
  const t = timing[scene];
  if (!t) { console.log(`skip ${scene}: not in ${TIMING} (run the align step)`); continue; }
  out[scene] = list.map(([word, start, end]) => [word, t.audioStart + Math.round(start * FPS), t.audioStart + Math.max(Math.round(end * FPS), Math.round(start * FPS) + 1)]);
  console.log(`${scene}: ${out[scene].length} words, ${out[scene][0][1]} .. ${out[scene].at(-1)[2]} of ${t.durationFrames} frames`);
}
fs.writeFileSync(OUT, JSON.stringify(out) + "\n");
console.log(`wrote ${OUT}`);
