import React from "react";
import { interpolate, staticFile, useCurrentFrame } from "remotion";
import { useAudioData, visualizeAudio } from "@remotion/media-utils";
import { c, mono } from "../../theme";
import { useStarts } from "../../timing";
import { Stage } from "../../showcase/Stage";
import { Sfx, demoSentences, sceneTiming, sceneWords } from "../shell";

/** Scene 4: the voice first. The bars are this scene's own audio (visualizeAudio), the ticks are the word and sentence
 *  timestamps from the transcript, and the card at the end is the real audioTiming data of this scene. */
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const X0 = 60;
const W = 1160;
const BARS = 64;

export const Scene4: React.FC = () => {
  const frame = useCurrentFrame();
  const t = sceneTiming("scene4");
  const s = useStarts(demoSentences("scene4"));
  const words = sceneWords("scene4");
  const audioData = useAudioData(staticFile(t.audio));
  const F = t.durationFrames;
  const x = (f: number) => X0 + (f / F) * W;
  // The spectrum of this scene's audio. Speech lives in the lowest bins, so the first half is weighted up and drawn mirrored,
  // lows in the middle: it reads as a voice instead of a slope.
  const spectrum = audioData
    ? visualizeAudio({ fps: 30, frame: Math.max(0, frame - t.audioStart), audioData, numberOfSamples: BARS, optimizeFor: "speed" })
    : new Array(BARS).fill(0);
  const half = spectrum.slice(0, BARS / 2).map((v, i) => v * (1 + i * 0.45));
  const values = [...half].reverse().concat(half);
  const intro = interpolate(frame, [2, 20], [0, 1], clamp);
  const spoken = words.filter(([, a]) => a <= frame);
  const last = spoken.slice(-5);
  const wordsCard = interpolate(frame, [s[2] - 6, s[2] + 10], [0, 1], clamp);
  const jsonCard = interpolate(frame, [s[3] - 4, s[3] + 14], [0, 1], clamp);
  return (
    <Stage title="Voice first, video second" subtitle="The audio sets the schedule: every sentence and every word gets a frame." at={frame}>
      <div style={{ position: "absolute", left: X0, top: 150, width: W, height: 170, background: c.panel, border: `1px solid ${c.line}`, borderRadius: 18, opacity: intro, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 18, top: 12, fontFamily: mono, fontSize: 16, color: c.faint }}>{t.audio}</div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 85, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: 0 }}>
          {values.map((v, i) => {
            const h = Math.max(5, Math.min(130, Math.sqrt(v) * 150));
            return <div key={i} style={{ width: 10, height: h, marginTop: -h / 2, borderRadius: 5, background: c.rose, opacity: 0.45 + Math.min(0.55, v * 6) }} />;
          })}
        </div>
      </div>
      <div style={{ position: "absolute", left: X0, top: 345, width: W, height: 64, opacity: intro }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 34, height: 2, background: c.line }} />
        {words.map(([, a], i) => a <= frame && <div key={i} style={{ position: "absolute", left: x(a) - X0, top: 26, width: 2, height: 16, background: c.dim }} />)}
        {s.map((st, i) => st <= frame && (
          <div key={i} style={{ position: "absolute", left: x(st) - X0 - 1, top: 6 - Math.max(0, 12 - (frame - st)) * 1.2, width: 3, height: 56, background: c.green, borderRadius: 2 }}>
            <div style={{ position: "absolute", top: -2, left: 8, fontFamily: mono, fontSize: 16, color: c.green }}>{i + 1}</div>
          </div>
        ))}
        <div style={{ position: "absolute", left: x(Math.min(frame, F)) - X0 - 1, top: 0, width: 2, height: 64, background: c.text }} />
      </div>
      <div style={{ position: "absolute", left: X0, top: 436, width: 560, height: 210, background: c.panel, border: `1px solid ${c.line}`, borderRadius: 18, opacity: wordsCard, padding: "16px 22px", boxSizing: "border-box", fontFamily: mono }}>
        <div style={{ fontSize: 16, color: c.faint, marginBottom: 8 }}>word · start · end (frames)</div>
        {last.map(([w, a, b], i) => (
          <div key={a} style={{ display: "flex", gap: 20, fontSize: 21, color: i === last.length - 1 ? c.rose : c.text, lineHeight: 1.45 }}>
            <span style={{ width: 160 }}>{w}</span><span style={{ color: c.amber }}>{a}</span><span style={{ color: c.amber }}>{b}</span>
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 640, top: 436, width: 580, height: 210, background: c.panel, border: `1px solid ${c.line}`, borderRadius: 18, opacity: jsonCard, padding: "16px 24px", boxSizing: "border-box", fontFamily: mono, fontSize: 21, lineHeight: 1.5, color: c.text }}>
        <div style={{ fontSize: 16, color: c.faint, marginBottom: 8 }}>src/demo/audioTiming.json</div>
        <div><span style={{ color: c.green }}>"scene4"</span>: {"{"}</div>
        <div style={{ paddingLeft: 22 }}><span style={{ color: c.green }}>"audioStart"</span>: <span style={{ color: c.amber }}>{t.audioStart}</span>,</div>
        <div style={{ paddingLeft: 22 }}><span style={{ color: c.green }}>"starts"</span>: [<span style={{ color: c.amber }}>{t.starts.join(", ")}</span>],</div>
        <div style={{ paddingLeft: 22 }}><span style={{ color: c.green }}>"sure"</span>: <span style={{ color: c.blue }}>true</span></div>
        <div>{"}"}</div>
      </div>
      {s.map((st, i) => <Sfx key={i} name="tick" at={st} volume={0.45} />)}
      <Sfx name="click" at={s[2] + 2} volume={0.4} />
      <Sfx name="pop" at={s[3] + 4} volume={0.5} />
    </Stage>
  );
};
