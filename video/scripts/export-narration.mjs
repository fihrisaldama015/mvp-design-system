// Write the narration to narration/sceneN.txt (one sentence per line) and narration/ALL.txt, for the TTS.
// The text is the same source the captions use (src/narration.json), so audio and captions cannot drift.
import fs from "node:fs";
const n = JSON.parse(fs.readFileSync("src/narration.json", "utf8"));
fs.mkdirSync("narration", { recursive: true });
let all = "";
for (const [id, sentences] of Object.entries(n)) {
  fs.writeFileSync(`narration/${id}.txt`, sentences.join("\n") + "\n");
  all += `# ${id}  (${sentences.length} sentences)\n${sentences.join("\n")}\n\n`;
}
fs.writeFileSync("narration/ALL.txt", all);
console.log(`narration/: ${Object.keys(n).length} scenes. Audio goes to public/audio/<scene>.mp3 (or .wav / .m4a / .ogg), then: npm run align`);
