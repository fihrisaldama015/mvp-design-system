// Word timings in video frames, for the kinetic captions: .align/words.json (npm run transcribe, seconds from the start of
// each audio file) + src/audioTiming.json (npm run align, the frame where each audio starts) -> src/wordTiming.json.
//   { "scene1": [["Getting", 15, 24], ["a", 24, 28], ...] }  (word, start frame, end frame)
// Run it after `npm run align`. A scene without words keeps the plain sentence captions.
import fs from "node:fs";

const FPS = 30;
const words = fs.existsSync(".align/words.json") ? JSON.parse(fs.readFileSync(".align/words.json", "utf8")) : null;
const timing = fs.existsSync("src/audioTiming.json") ? JSON.parse(fs.readFileSync("src/audioTiming.json", "utf8")) : {};
if (!words) { console.error("No .align/words.json. Run `npm run transcribe` first (see the README)."); process.exit(1); }

const out = {};
for (const [scene, list] of Object.entries(words)) {
  const t = timing[scene];
  if (!t) { console.log(`skip ${scene}: not in src/audioTiming.json (run npm run align)`); continue; }
  out[scene] = list.map(([word, start, end]) => [word, t.audioStart + Math.round(start * FPS), t.audioStart + Math.max(Math.round(end * FPS), Math.round(start * FPS) + 1)]);
  console.log(`${scene}: ${out[scene].length} words, ${out[scene][0][1]} .. ${out[scene].at(-1)[2]} of ${t.durationFrames} frames`);
}
fs.writeFileSync("src/wordTiming.json", JSON.stringify(out) + "\n");
console.log("wrote src/wordTiming.json");
