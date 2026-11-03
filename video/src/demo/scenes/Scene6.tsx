import React from "react";
import { Loop, interpolate, useCurrentFrame } from "remotion";
import { c, mono } from "../../theme";
import { useStarts } from "../../timing";
import { Stage } from "../../showcase/Stage";
import { Transitions, TRANSITIONS_FRAMES } from "../../showcase/Transitions";
import { Sfx, demoSentences } from "../shell";

/** Scene 6: transitions between scenes, and sound as layers. The transition clip plays at half size on the left; on the
 *  right a small mixer shows a voice lane, an effects lane and a music lane whose level ducks under the voice. */
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const D = 60;
const T = 20;
const PLAY = 120; // frames of the mixer's looping playhead

export const Scene6: React.FC = () => {
  const frame = useCurrentFrame();
  const s = useStarts(demoSentences("scene6"));
  const left = interpolate(frame, [2, 20], [0, 1], clamp);
  const mixer = interpolate(frame, [s[1] - 4, s[1] + 14], [0, 1], clamp);
  const ruler = interpolate(frame, [s[3] - 4, s[3] + 14], [0, 1], clamp);
  const ph = ((frame - s[1]) % PLAY) / PLAY;
  const lane = (top: number, name: string, color: string, children: React.ReactNode) => (
    <div style={{ position: "absolute", left: 24, right: 24, top, height: 62 }}>
      <div style={{ position: "absolute", left: 0, top: -2, fontFamily: mono, fontSize: 17, color }}>{name}</div>
      <div style={{ position: "absolute", left: 120, right: 0, top: 0, height: 62, background: c.panel2, borderRadius: 10, overflow: "hidden" }}>{children}</div>
    </div>
  );
  const voice: [number, number][] = [[0.04, 0.38], [0.5, 0.9]];
  const speaking = voice.some(([a, b]) => ph >= a && ph <= b);
  const duck = (p: number) => (voice.some(([a, b]) => p >= a - 0.02 && p <= b + 0.02) ? 0.25 : 0.8);
  const points = Array.from({ length: 61 }, (_, i) => `${(i / 60) * 100},${100 - duck(i / 60) * 90}`).join(" ");
  return (
    <Stage title="Scenes and sound" subtitle="Transitions between scenes, and every sound is a layer placed by frame." at={frame}>
      <div style={{ position: "absolute", left: 40, top: 130, width: 640, height: 360, opacity: left, overflow: "hidden", borderRadius: 14, border: `1px solid ${c.line}` }}>
        <div style={{ width: 1280, height: 720, transform: "scale(0.5)", transformOrigin: "top left" }}><Loop durationInFrames={TRANSITIONS_FRAMES}><Transitions /></Loop></div>
      </div>
      <div style={{ position: "absolute", left: 720, top: 130, width: 500, height: 360, background: c.panel, border: `1px solid ${c.line}`, borderRadius: 18, opacity: mixer }}>
        {lane(48, "voice", c.rose, voice.map(([a, b], i) => <div key={i} style={{ position: "absolute", left: `${a * 100}%`, width: `${(b - a) * 100}%`, top: 14, height: 34, background: c.rose, borderRadius: 8, opacity: 0.9 }} />))}
        {lane(132, "effects", c.amber, [0.1, 0.34, 0.52, 0.7, 0.86].map((a, i) => <div key={i} style={{ position: "absolute", left: `${a * 100}%`, top: 20, width: 14, height: 22, borderRadius: 7, background: c.amber }} />))}
        {lane(216, "music", c.green, (
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
            <polyline points={points} fill="none" stroke={c.green} strokeWidth={2.5} vectorEffect="non-scaling-stroke" />
          </svg>
        ))}
        <div style={{ position: "absolute", left: 24 + 120 + ph * (500 - 48 - 120), top: 30, width: 2, height: 270, background: c.text }} />
        <div style={{ position: "absolute", left: 24, bottom: 18, fontFamily: mono, fontSize: 17, color: speaking ? c.rose : c.faint }}>{speaking ? "voice on: music ducks" : "voice off: music comes up"}</div>
      </div>
      <div style={{ position: "absolute", left: 40, top: 520, width: 1180, display: "flex", justifyContent: "space-between", fontFamily: mono, fontSize: 20, color: c.dim, opacity: ruler }}>
        {["frame 0", "frame 150", "frame 300", "frame 450", "frame 600"].map((f) => <span key={f} style={{ borderLeft: `2px solid ${c.line}`, paddingLeft: 10 }}>{f}</span>)}
      </div>
      {[0, 1, 2, 3].map((k) => <Sfx key={k} name="whoosh" at={(k + 1) * (D - T) - 4} volume={0.4} />)}
      <Sfx name="pop" at={s[1] + 8} volume={0.45} />
    </Stage>
  );
};
