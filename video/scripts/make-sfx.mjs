// Make the sound effects and the music bed of the demo video with ffmpeg alone: sine waves, shaped noise and filters.
// Nothing is downloaded, so there is no license to check. Output (44.1 kHz):
//   public/audio/demo/sfx/<name>.wav   short effects          public/audio/demo/music.mp3 and music-soft.mp3   a bright C major bed, about 3:30
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

// Music: a bright, friendly bed in C major at 100 bpm. Four chords (C, G, Am, F), two bars each, looped to cover the video:
// a warm pad, a soft bass, an eighth-note pluck arpeggio, and (in music.mp3 only) a very light kick and hat.
// Two versions: music.mp3 (with the light beat) and music-soft.mp3 (pad, bass and plucks only). Pick one in src/demo/shell.tsx.
const EIGHTH = 0.3, BAR = 2.4, CHORD = 4.8, LOOPS = 11, TARGET_MEAN_DB = -28;
const prog = [
  { name: "C", pad: [261.63, 329.63, 392.0], arp: [523.25, 659.25, 783.99, 1046.5], bass: 130.81 },
  { name: "G", pad: [196.0, 246.94, 293.66], arp: [392.0, 493.88, 587.33, 783.99], bass: 98.0 },
  { name: "Am", pad: [220.0, 261.63, 329.63], arp: [440.0, 523.25, 659.25, 880.0], bass: 110.0 },
  { name: "F", pad: [174.61, 220.0, 261.63], arp: [349.23, 440.0, 523.25, 698.46], bass: 87.31 },
];
const pattern = [0, 1, 2, 3, 2, 1, 2, 3, 0, 1, 2, 3, 2, 1, 3, 2];
const env = `min(1,t/0.25)*min(1,(${CHORD}-t)/0.25)`;
const tonal = (ch, pluckGain) => {
  const pad = ch.pad.map((f) => `sin(2*PI*${f}*t)+sin(2*PI*${(f * 1.002).toFixed(3)}*t)`).join("+");
  const plucks = pattern.map((idx, k) => {
    const f = ch.arp[idx], t0 = (k * EIGHTH).toFixed(2);
    return `gte(t,${t0})*lt(t,${(k * EIGHTH + 0.7).toFixed(2)})*min(1,(t-${t0})*300)*(sin(2*PI*${f}*(t-${t0}))+0.35*sin(4*PI*${f}*(t-${t0})))*exp(-(t-${t0})*7)`;
  }).join("+");
  return `'(0.05*(${pad}))*${env}+0.09*sin(2*PI*${ch.bass}*t)*${env}+${pluckGain}*(${plucks})'`;
};
const drums = () => {
  const kicks = [0, 1.2, 2.4, 3.6].map((k) => `gte(t,${k})*lt(t,${k + 0.3})*0.42*sin(2*PI*(120*(t-${k})-200*(t-${k})*(t-${k})))*exp(-(t-${k})*13)`).join("+");
  const hats = pattern.map((_, k) => { const h = (k * EIGHTH + 0.15).toFixed(2); return `gte(t,${h})*lt(t,${(k * EIGHTH + 0.21).toFixed(2)})*0.07*(random(0)*2-1)*exp(-(t-${h})*70)`; }).join("+");
  return `'${kicks}+${hats}'`;
};
function music(file, withDrums) {
  const parts = [];
  for (const ch of prog) {
    const t = `${dir}/m-${ch.name}-tonal.wav`;
    ff(["-f", "lavfi", "-i", `aevalsrc=${tonal(ch, 0.17)}:s=${SR}:d=${CHORD}`, "-af", "lowpass=f=5200", "-ac", "2", t]);
    if (withDrums) {
      const d = `${dir}/m-${ch.name}-drums.wav`, mix = `${dir}/m-${ch.name}.wav`;
      ff(["-f", "lavfi", "-i", `aevalsrc=${drums()}:s=${SR}:d=${CHORD}`, "-af", "lowpass=f=9000", "-ac", "2", d]);
      ff(["-i", t, "-i", d, "-filter_complex", "amix=inputs=2:normalize=0", mix]);
      fs.rmSync(t); fs.rmSync(d); parts.push(mix);
    } else parts.push(t);
  }
  const loop = `${dir}/m-loop.wav`;
  ff([...parts.flatMap((p) => ["-i", p]), "-filter_complex", `${parts.map((_, i) => `[${i}]`).join("")}concat=n=${parts.length}:v=0:a=1`, loop]);
  parts.forEach((p) => fs.rmSync(p));
  // Level: bring the loop to the same mean level for both versions, so the ducking in the video behaves the same.
  const probe = spawnSync("ffmpeg", ["-hide_banner", "-i", loop, "-af", "volumedetect", "-f", "null", "-"], { encoding: "utf8" }).stderr;
  const mean = parseFloat(/mean_volume: (-?[\d.]+) dB/.exec(probe)[1]);
  const total = BAR * 2 * prog.length * LOOPS;
  const length = Math.round(total);
  ff(["-stream_loop", String(LOOPS - 1), "-i", loop, "-t", String(length), "-af", `volume=${(TARGET_MEAN_DB - mean).toFixed(2)}dB,alimiter=limit=0.8,afade=t=in:d=3,afade=t=out:st=${length - 6}:d=6`, "-c:a", "libmp3lame", "-b:a", "128k", `${dir}/${file}`]);
  fs.rmSync(loop);
  return length;
}
const secondsA = music("music.mp3", true);
const secondsB = music("music-soft.mp3", false);
for (const old of ["chord-Am9.wav", "chord-Fmaj7.wav", "chord-Cmaj7.wav", "chord-G.wav"]) fs.rmSync(`${dir}/${old}`, { force: true });
console.log(`sfx: ${fs.readdirSync(`${dir}/sfx`).join(", ")}\nmusic: ${dir}/music.mp3 (${secondsA} s, light beat), ${dir}/music-soft.mp3 (${secondsB} s, no drums)`);
