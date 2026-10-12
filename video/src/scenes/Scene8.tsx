import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { c, mono } from "../theme";
import { Scene } from "../components/Frame";
import { sentenceStarts } from "../timing";
import { ramp } from "../anim";

const NARRATION = [
  "All the big data now goes to disk.",
  "The first test of the skill, building Input with a fresh agent, used about 184 thousand tokens.",
  "Most of it came from reading a 775-line analysis output, pasting the same 5 KB script again and again, and the agent writing its own browser helper.",
  "Those gaps are closed in the skill.",
];
// [label, before bytes, after bytes, before label, after label, drop]
const BARS: [string, number, number, string, string, string][] = [
  ["readFoundation.js per call", 4056, 234, "4,056 B pasted", "234 B loader", "−94%"],
  ["readComponents.js per call", 6723, 270, "6,723 B pasted", "≈270 B loader", "−96%"],
  ["component inventory in the chat", 12000, 200, "≈12 KB", "≈200 B", "−98%"],
];
const DISK: [string, string][] = [
  ["Button read (360 variants)", "959,930 B"],
  ["Foundation reads", "1.4 + 51 + 56 KB"],
  ["Token export", "638 KB"],
];
const CAUSES = ["775-line analysis output read", "the same 5 KB script pasted again and again", "the agent wrote its own browser helper"];
const MAXW = 700;

export const Scene8: React.FC = () => {
  const f = useCurrentFrame();
  const { durationInFrames: total } = useVideoConfig();
  const s = sentenceStarts(NARRATION, total);
  return (
    <Scene n={8} title="Token savings" narration={NARRATION}>
      <div style={{ position: "absolute", left: 90, top: 150, width: 1060 }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: c.rose, marginBottom: 20 }}>What goes through the chat, per call</div>
        {BARS.map(([label, b, a, bl, al, drop], i) => {
          const at = s[0] + i * 26;
          const grow = ramp(f, at, at + 30);
          return (
            <div key={label} style={{ marginBottom: 26, opacity: ramp(f, at, at + 10) }}>
              <div style={{ fontSize: 24, color: c.dim, marginBottom: 8 }}>{label}</div>
              <div style={{ height: 30, width: MAXW * grow, borderRadius: 8, background: c.faint, position: "relative" }}>
                <span style={{ position: "absolute", left: MAXW * grow + 14, top: 0, fontFamily: mono, fontSize: 22, color: c.dim, whiteSpace: "nowrap" }}>{bl}</span>
              </div>
              <div style={{ height: 30, marginTop: 8, width: Math.max(6, (MAXW * a * grow) / b), borderRadius: 8, background: c.green, position: "relative" }}>
                <span style={{ position: "absolute", left: Math.max(6, (MAXW * a * grow) / b) + 14, top: 0, fontFamily: mono, fontSize: 22, color: c.green, whiteSpace: "nowrap" }}>{al}  <b style={{ marginLeft: 12, fontSize: 28 }}>{drop}</b></span>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 1240, top: 150, width: 600 }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: c.rose, marginBottom: 20 }}>Saved to disk instead</div>
        {DISK.map(([k, v], i) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "16px 22px", marginBottom: 12, background: c.panel, border: `1px solid ${c.line}`, borderRadius: 14, opacity: ramp(f, s[0] + 60 + i * 18, s[0] + 74 + i * 18) }}>
            <span style={{ fontSize: 24, color: c.dim }}>{k}</span>
            <span style={{ fontFamily: mono, fontSize: 24, color: c.text }}>{v}</span>
          </div>
        ))}
      </div>
      {/* baseline */}
      <div style={{ position: "absolute", left: 90, top: 640, width: 1740, background: c.panel, border: `2px solid ${c.amber}`, borderRadius: 20, padding: "22px 34px", opacity: ramp(f, s[1], s[1] + 16) }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 24 }}>
          <span style={{ fontFamily: mono, fontSize: 64, fontWeight: 600, color: c.amber }}>≈184k</span>
          <span style={{ fontSize: 28, color: c.text }}>tokens: the first test, Input built by a fresh agent <span style={{ color: c.dim }}>(baseline, before the fixes)</span></span>
        </div>
        <div style={{ display: "flex", gap: 28, marginTop: 14 }}>
          {CAUSES.map((t, i) => {
            const closed = ramp(f, s[3] + i * 14, s[3] + 12 + i * 14);
            return (
              <span key={t} style={{ fontSize: 23, color: closed > 0.5 ? c.green : c.dim, opacity: ramp(f, s[2] + i * 24, s[2] + 14 + i * 24), textDecoration: closed > 0.5 ? "line-through" : "none" }}>
                {closed > 0.5 ? "✓ " : "• "}{t}
              </span>
            );
          })}
        </div>
      </div>
      <div style={{ position: "absolute", left: 90, top: 845, fontSize: 20, color: c.faint, opacity: ramp(f, s[3] + 30, s[3] + 46) }}>The total after the fixes has not been re-measured yet.</div>
    </Scene>
  );
};
