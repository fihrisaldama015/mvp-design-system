import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import narration from "../narration.json";
import { c, mono } from "../theme";
import { Scene, usePop } from "../components/Frame";
import { useStarts } from "../timing";

const NARRATION = narration.scene2;
// [title, detail, appears with sentence index]
const BOXES: [string, string, number][] = [
  ["Figma Desktop", "Desktop Bridge plugin", 0],
  ["figma-console MCP", "runs JS in the file", 1],
  ["Local receiver", "dumpServer.py · :9232", 2],
  ["Scripts", "read · analyse · build", 2],
  ["Project", "tokens · Tailwind · Storybook", 2],
  ["Proof", "vs Figma · states · render", 2],
];

const Box: React.FC<{ i: number; at: number; title: string; detail: string; accent?: string }> = ({ i, at, title, detail, accent }) => {
  const p = usePop(at);
  return (
    <div style={{ position: "absolute", left: 70 + i * 292, top: 380, width: 236, opacity: Math.min(1, p * 1.4), transform: `translateY(${(1 - p) * 30}px) scale(${0.9 + 0.1 * p})` }}>
      <div style={{ background: c.panel, border: `2px solid ${accent ?? c.line}`, borderRadius: 18, padding: "26px 18px", textAlign: "center", boxShadow: "0 14px 40px rgba(0,0,0,0.4)" }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: c.text, lineHeight: 1.15 }}>{title}</div>
        <div style={{ marginTop: 10, fontSize: 19, color: c.dim, fontFamily: mono, lineHeight: 1.3 }}>{detail}</div>
      </div>
    </div>
  );
};

export const Scene2: React.FC = () => {
  const f = useCurrentFrame();
  const { durationInFrames: total } = useVideoConfig();
  const s = useStarts(NARRATION);
  // boxes 2-5 share the long third sentence ("...local server, scripts, ..., a last stage checks"): stagger them across it
  const d = s[3] - s[2];
  const at = [s[0], s[1], s[2], s[2] + Math.round(d * 0.34), s[2] + Math.round(d * 0.62), s[2] + Math.round(d * 0.86)];
  const line = (i: number) => interpolate(f, [at[i + 1] - 6, at[i + 1] + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const phase = interpolate(f, [s[3], s[3] + 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <Scene n={2} title="The pipeline" narration={NARRATION}>
      {BOXES.map(([t, d], i) => (
        <Box key={t} i={i} at={at[i]} title={t} detail={d} accent={i === 5 ? c.green : i === 4 ? c.rose : undefined} />
      ))}
      {BOXES.slice(0, -1).map((_, i) => (
        <div key={i} style={{ position: "absolute", left: 70 + i * 292 + 236 + 6, top: 455, width: 44, height: 6, borderRadius: 3, background: c.faint, opacity: line(i), transformOrigin: "left", transform: `scaleX(${line(i)})` }}>
          <div style={{ position: "absolute", right: -4, top: -7, borderTop: "10px solid transparent", borderBottom: "10px solid transparent", borderLeft: `14px solid ${c.faint}` }} />
        </div>
      ))}
      {/* two phases */}
      <div style={{ position: "absolute", left: 70, top: 640, width: 1780, display: "flex", gap: 24, opacity: phase }}>
        <div style={{ flex: 1, background: c.panel, border: `1px solid ${c.line}`, borderRadius: 16, padding: "20px 28px" }}>
          <div style={{ color: c.rose, fontWeight: 700, fontSize: 26 }}>Foundation first</div>
          <div style={{ color: c.dim, fontSize: 22, marginTop: 6 }}>variables, text styles, effects → tokens → Tailwind theme → Foundations pages</div>
        </div>
        <div style={{ flex: 1, background: c.panel, border: `1px solid ${c.line}`, borderRadius: 16, padding: "20px 28px" }}>
          <div style={{ color: c.rose, fontWeight: 700, fontSize: 26 }}>Then components</div>
          <div style={{ color: c.dim, fontSize: 22, marginTop: 6 }}>component sets → props and token classes → stories → compared with Figma</div>
        </div>
      </div>
    </Scene>
  );
};
