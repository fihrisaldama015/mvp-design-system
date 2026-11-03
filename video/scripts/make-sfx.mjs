// Make the sound effects and the music bed of the demo video with ffmpeg alone: sine waves, shaped noise and filters.
// Nothing is downloaded, so there is no license to check. Output (44.1 kHz):
//   public/audio/demo/sfx/<name>.wav   short effects          public/audio/demo/music.mp3   a quiet ambient pad, about 3:20
// Run: npm run sfx   (needs ffmpeg on the PATH). The files are generated, so they are not committed; re-run to get them.
import { spawnSync } from "node:child_process";
import fs from "node:fs";

const SR = 44100;
const dir = "public/audio/demo";
fs.mkdirSync(`${dir}/sfx`, { recursive: true });

function ff(args) {
  const r = spawnSync("ffmpeg", ["-v", "error", "-y", ...args], { encoding: "utf8" });
  if (r.status !== 0) { console.error(r.stderr || r.error); process.exit(1); }
}
// aevalsrc: an expression of t (seconds). random(0) is white noise. Stereo out, a short fade-out so nothing clicks at the end.
function effect(name, expr, seconds, filters = "") {
  const chain = [filters, `afade=t=out:st=${Math.max(0, seconds - 0.03).toFixed(3)}:d=0.03`, "alimiter=limit=0.9"].filter(Boolean).join(",");
  ff(["-f", "lavfi", "-i", `aevalsrc=${expr}:s=${SR}:d=${seconds}`, "-af", chain, "-ac", "2", `${dir}/sfx/${name}.wav`]);
}

// A keyboard key: a click of high noise.
effect("key", "'0.8*(random(0)*2-1)*exp(-t*95)'", 0.07, "highpass=f=1500,lowpass=f=8000");
// A soft UI click.
effect("click", "'0.7*sin(2*PI*1400*t)*exp(-t*160)+0.3*(random(0)*2-1)*exp(-t*220)'", 0.06);
// A very short, light tick: for a second counter, a marker that locks, a key word.
effect("tick", "'0.55*sin(2*PI*2200*t)*exp(-t*150)'", 0.06);
// A pop: a sine whose pitch falls quickly.
effect("pop", "'0.8*sin(2*PI*(900*t-1500*t*t))*exp(-t*22)'", 0.2);
// A whoosh: noise with a smooth swell in and out.
effect("whoosh", "'(random(0)*2-1)*sin(PI*t/0.7)*sin(PI*t/0.7)*0.7'", 0.7, "highpass=f=300,lowpass=f=4800");
// A low impact for the title.
effect("impact", "'0.9*sin(2*PI*58*t)*exp(-t*4.5)+0.35*(random(0)*2-1)*exp(-t*40)'", 1.4, "lowpass=f=2600");
// A soft bell chord for the end.
effect("chime", "'0.33*(sin(2*PI*880*t)*exp(-t*2.2)+0.6*sin(2*PI*1318.5*t)*exp(-t*2.6)+0.4*sin(2*PI*1760*t)*exp(-t*3.2))'", 2.6, "aecho=0.8:0.6:140:0.3");
// A riser: noise and a rising tone that swell.
effect("riser", "'(random(0)*2-1)*pow(t/2.4,2)*0.45+0.25*sin(2*PI*(200*t+250*t*t))*(t/2.4)'", 2.4, "lowpass=f=9000");

// Music: four chords, A minor 9, F major 7, C major 7, G, looped to nine chords; each is a pad of slightly detuned sines.
const chords = {
  Am9: [110, 164.81, 220, 261.63, 329.63, 493.88],
  Fmaj7: [87.31, 130.81, 220, 261.63, 329.63],
  Cmaj7: [130.81, 196, 246.94, 329.63, 392],
  G: [98, 146.83, 196, 220, 293.66],
};
const order = ["Am9", "Fmaj7", "Cmaj7", "G", "Am9", "Fmaj7", "Cmaj7", "G", "Am9"];
const CHORD = 26, XFADE = 4;
const pad = (freqs) => `'0.07*(${freqs.map((f) => `sin(2*PI*${f}*t)+sin(2*PI*${(f * 1.004).toFixed(2)}*t)`).join("+")})'`;
for (const [name, freqs] of Object.entries(chords)) {
  ff(["-f", "lavfi", "-i", `aevalsrc=${pad(freqs)}:s=${SR}:d=${CHORD}`, "-af", "lowpass=f=1500,tremolo=f=0.18:d=0.25,aecho=0.7:0.5:700|1100:0.25|0.18", "-ac", "2", `${dir}/chord-${name}.wav`]);
}
const inputs = order.flatMap((n) => ["-i", `${dir}/chord-${n}.wav`]);
let graph = "";
let last = "[0]";
for (let i = 1; i < order.length; i += 1) { graph += `${last}[${i}]acrossfade=d=${XFADE}[x${i}];`; last = `[x${i}]`; }
const total = order.length * CHORD - (order.length - 1) * XFADE;
graph += `${last}volume=0.9,afade=t=in:d=3,afade=t=out:st=${total - 6}:d=6,alimiter=limit=0.8[out]`;
ff([...inputs, "-filter_complex", graph, "-map", "[out]", "-c:a", "libmp3lame", "-b:a", "128k", `${dir}/music.mp3`]);
for (const n of Object.keys(chords)) fs.rmSync(`${dir}/chord-${n}.wav`);
console.log(`sfx: ${fs.readdirSync(`${dir}/sfx`).join(", ")}\nmusic: ${dir}/music.mp3 (${total} s)`);
