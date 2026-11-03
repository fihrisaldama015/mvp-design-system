// Write the narration to narration/sceneN.txt (one sentence per line) and narration/ALL.txt, for the TTS.
// The text is the same source the captions use (src/narration.json), so audio and captions cannot drift.
//   node scripts/export-narration.mjs          the Shield video   -> narration/, audio in public/audio/
//   node scripts/export-narration.mjs demo     the demo video     -> narration/demo/, audio in public/audio/demo/
import fs from "node:fs";
const set = process.argv[2] === "demo" ? "demo" : "";
const source = set ? `src/${set}/narration.json` : "src/narration.json";
const out = set ? `narration/${set}` : "narration";
const audio = set ? `public/audio/${set}/` : "public/audio/";
const n = JSON.parse(fs.readFileSync(source, "utf8"));
fs.mkdirSync(out, { recursive: true });
let all = "";
for (const [id, sentences] of Object.entries(n)) {
  fs.writeFileSync(`${out}/${id}.txt`, sentences.join("\n") + "\n");
  all += `# ${id}  (${sentences.length} sentences)\n${sentences.join("\n")}\n\n`;
}
fs.writeFileSync(`${out}/ALL.txt`, all);
const words = Object.values(n).flat().join(" ").split(/\s+/).length;
console.log(`${out}/: ${Object.keys(n).length} scenes, ${words} words. Audio goes to ${audio}<scene>.wav (or .mp3 / .m4a / .ogg), then: npm run align`);
