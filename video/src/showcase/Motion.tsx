import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { c, inter, mono } from "../theme";
import { ramp } from "../anim";

/** Showcase clip: the same move (same distance, same start) with three curves. 1280x720, loops every 90 frames. */
const LANES = [
  { name: "interpolate()", note: "linear: constant speed", color: c.blue },
  { name: "Easing.out(cubic)", note: "fast start, soft landing", color: c.amber },
  { name: "spring()", note: "overshoots, then settles", color: c.rose },
];
const X0 = 330;
const X1 = 1130;
const CYCLE = 90;
const START = 8;

export const Motion: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = frame % CYCLE;
  const t = f - START;
  const progress = [
    interpolate(t, [0, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    interpolate(t, [0, 50], [0, 1], { easing: Easing.out(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    spring({ frame: t, fps, config: { damping: 10, stiffness: 100 } }),
  ];
  const visible = ramp(f, 0, 8) * (1 - ramp(f, CYCLE - 10, CYCLE));
  return (
    <AbsoluteFill style={{ background: c.bg, fontFamily: inter, color: c.text }}>
      <div style={{ position: "absolute", left: 60, top: 44, fontSize: 38, fontWeight: 600 }}>Same move, three curves</div>
      <div style={{ position: "absolute", left: 60, top: 100, fontSize: 24, color: c.dim }}>Same distance, same start frame. Only the curve differs.</div>
      {LANES.map((lane, i) => {
        const y = 230 + i * 150;
        return (
          <React.Fragment key={lane.name}>
            <div style={{ position: "absolute", left: 60, top: y - 6, width: 262 }}>
              <div style={{ fontFamily: mono, fontSize: 22, fontWeight: 600, color: lane.color }}>{lane.name}</div>
              <div style={{ fontSize: 18, color: c.faint, marginTop: 4 }}>{lane.note}</div>
            </div>
            <div style={{ position: "absolute", left: X0, width: X1 - X0 + 64, top: y + 30, height: 2, background: c.line }} />
            <div style={{ position: "absolute", left: X0 + (X1 - X0) * progress[i], top: y, width: 64, height: 64, borderRadius: 16, background: lane.color, opacity: visible }} />
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};
