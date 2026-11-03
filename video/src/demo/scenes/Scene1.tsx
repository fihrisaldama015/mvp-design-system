import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { c, inter, mono } from "../../theme";
import { useStarts } from "../../timing";
import { Stage } from "../../showcase/Stage";
import { DEMO_TOTAL, Sfx, demoSentences } from "../shell";

/** Scene 1: the title, then a terminal that types the render command and counts the frames it renders. */
const CMD = "npm run render";

export const Scene1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = useStarts(demoSentences("scene1"));
  const title = spring({ frame: frame - 4, fps, config: { damping: 13, stiffness: 110 } });
  const sub = interpolate(frame, [26, 44], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const typed = Math.max(0, Math.min(CMD.length, Math.floor((frame - s[1]) / 2.6)));
  const typingDone = s[1] + Math.ceil(CMD.length * 2.6);
  const run0 = typingDone + 14;
  const run1 = run0 + 70;
  const p = interpolate(frame, [run0, run1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const frames = Math.round(p * DEMO_TOTAL);
  const done = frame >= run1;
  const out = interpolate(frame, [s[2] - 6, s[2] + 14], [1, 0.0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cursor = Math.floor(frame / 15) % 2 === 0;
  return (
    <Stage title="" subtitle="" at={frame}>
      <div style={{ position: "absolute", left: 70, top: 110, fontFamily: inter, color: c.text, opacity: Math.min(1, title * 1.6), transform: `translateY(${(1 - title) * 40}px)` }}>
        <div style={{ fontSize: 132, fontWeight: 800, letterSpacing: -4, lineHeight: 1 }}>Video as code</div>
        <div style={{ fontSize: 44, fontWeight: 600, color: c.rose, marginTop: 14, opacity: sub }}>Claude + Remotion</div>
      </div>
      <div style={{ position: "absolute", left: 70, top: 380, width: 760, height: 215, background: c.panel, border: `1px solid ${c.line}`, borderRadius: 18, fontFamily: mono, opacity: frame < s[1] - 10 ? 0.35 : 1 }}>
        <div style={{ display: "flex", gap: 8, padding: "16px 20px" }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((col) => <div key={col} style={{ width: 12, height: 12, borderRadius: 6, background: col }} />)}
        </div>
        <div style={{ padding: "4px 28px", fontSize: 30, color: c.text }}>
          <span style={{ color: c.green }}>$</span> {CMD.slice(0, typed)}
          {typed < CMD.length && cursor && <span style={{ color: c.rose }}>▌</span>}
        </div>
        {frame >= run0 - 4 && (
          <div style={{ padding: "18px 28px 0", fontSize: 24, color: c.dim }}>
            <div style={{ height: 14, background: c.panel2, borderRadius: 7, overflow: "hidden" }}>
              <div style={{ width: `${p * 100}%`, height: "100%", background: done ? c.green : c.rose }} />
            </div>
            <div style={{ marginTop: 14, color: done ? c.green : c.dim, fontVariantNumeric: "tabular-nums" }}>
              {done ? `Rendered ${DEMO_TOTAL} frames` : `frame ${frames} / ${DEMO_TOTAL}`}
            </div>
          </div>
        )}
      </div>
      <div style={{ position: "absolute", right: 70, top: 400, display: "flex", flexDirection: "column", gap: 14, alignItems: "flex-end", fontFamily: mono, fontSize: 24, color: c.dim, opacity: out }}>
        <span>1920 × 1080</span>
        <span>30 frames per second</span>
        <span>React + TypeScript</span>
      </div>
      <Sfx name="impact" at={6} volume={0.7} />
      {Array.from({ length: 7 }, (_, k) => <Sfx key={k} name="key" at={s[1] + Math.round(k * 5.2)} volume={0.45} />)}
      <Sfx name="click" at={run1} volume={0.6} />
    </Stage>
  );
};
