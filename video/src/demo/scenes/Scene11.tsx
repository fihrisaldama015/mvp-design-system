import React from "react";
import { Loop, OffthreadVideo, interpolate, staticFile, useCurrentFrame } from "remotion";
import { c, mono } from "../../theme";
import { useStarts } from "../../timing";
import { Stage } from "../../showcase/Stage";
import { Sfx, demoSentences } from "../shell";

/** Scene 11: a video inside a video (OffthreadVideo), played as it is, trimmed, and sped up; then the list of what can be
 *  put on screen, since anything that runs in a web page can. */
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Frame: React.FC<{ left: number; width: number; label: string; code: string; opacity: number; children: React.ReactNode }> = ({ left, width, label, code, opacity, children }) => (
  <div style={{ position: "absolute", left, top: 150, width, opacity }}>
    <div style={{ border: `1px solid ${c.line}`, borderRadius: 16, overflow: "hidden", background: "#000" }}>{children}</div>
    <div style={{ marginTop: 10, fontFamily: mono, fontSize: 19, color: c.text }}>{label}</div>
    <div style={{ marginTop: 2, fontFamily: mono, fontSize: 15, color: c.faint }}>{code}</div>
  </div>
);

export const Scene11: React.FC = () => {
  const frame = useCurrentFrame();
  const s = useStarts(demoSentences("scene11"));
  const a = interpolate(frame, [4, 20], [0, 1], clamp);
  const b = interpolate(frame, [s[0] + 40, s[0] + 56], [0, 1], clamp);
  const d = interpolate(frame, [s[0] + 80, s[0] + 96], [0, 1], clamp);
  const chips = ["HTML", "CSS", "SVG", "Canvas", "WebGL", "React"];
  return (
    <Stage title="A video in a video" subtitle="OffthreadVideo plays a file on the timeline, and you decide how." at={frame}>
      <Frame left={60} width={560} label="as it is" code="<OffthreadVideo src={clip} />" opacity={a}>
        <Loop durationInFrames={220} layout="none"><OffthreadVideo src={staticFile("clips/spring.mp4")} muted style={{ width: "100%", display: "block" }} /></Loop>
      </Frame>
      <Frame left={650} width={270} label="trimmed" code="startFrom={60} endAt={150}" opacity={b}>
        <Loop durationInFrames={90} layout="none"><OffthreadVideo src={staticFile("clips/transitions.mp4")} muted startFrom={60} endAt={150} style={{ width: "100%", display: "block" }} /></Loop>
      </Frame>
      <Frame left={950} width={270} label="sped up" code="playbackRate={2}" opacity={d}>
        <Loop durationInFrames={90} layout="none"><OffthreadVideo src={staticFile("clips/motion.mp4")} muted playbackRate={2} style={{ width: "100%", display: "block" }} /></Loop>
      </Frame>
      <div style={{ position: "absolute", left: 60, top: 568, display: "flex", gap: 16 }}>
        {chips.map((chip, i) => {
          const o = interpolate(frame, [s[1] + i * 6, s[1] + i * 6 + 12], [0, 1], clamp);
          return <div key={chip} style={{ opacity: o, transform: `translateY(${(1 - o) * 14}px)`, fontFamily: mono, fontSize: 26, color: c.text, background: c.panel, border: `1px solid ${c.line}`, borderRadius: 14, padding: "10px 24px" }}>{chip}</div>;
        })}
      </div>
      <Sfx name="whoosh" at={s[0] + 38} volume={0.35} />
      <Sfx name="whoosh" at={s[0] + 78} volume={0.35} />
      {chips.map((_, i) => <Sfx key={i} name="tick" at={s[1] + i * 6 + 4} volume={0.4} />)}
    </Stage>
  );
};
