import React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { c, mono } from "../theme";
import { ramp } from "../anim";
import { CurveChart, Stage } from "./Stage";

/** Showcase clip: the same move (same distance, same start) with three curves. Each lane has trails (the gaps between
 *  them show the speed) and a chart of its curve. 1280x720, loops every 90 frames. */
const X0 = 330;
const X1 = 830;
const CYCLE = 90;
const START = 8;
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));

export const Motion: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = frame % CYCLE;
  const curves = [
    (t: number) => clamp01(t / 50),
    (t: number) => Easing.out(Easing.cubic)(clamp01(t / 50)),
    (t: number) => spring({ frame: t, fps, config: { damping: 10, stiffness: 100 } }),
  ];
  const lanes = [
    { name: "interpolate()", note: "linear: constant speed", color: c.blue },
    { name: "Easing.out(cubic)", note: "fast start, soft landing", color: c.amber },
    { name: "spring()", note: "overshoots, then settles", color: c.rose },
  ];
  const visible = ramp(f, 0, 8) * (1 - ramp(f, CYCLE - 10, CYCLE));
  const t = f - START;
  return (
    <Stage title="Same move, three curves" subtitle="Same distance, same start frame. Only the curve differs: watch the spacing of the outlines." at={f}>
      {lanes.map((lane, i) => {
        const y = 200 + i * 160;
        const pos = (tt: number) => X0 + (X1 - X0) * curves[i](tt);
        return (
          <React.Fragment key={lane.name}>
            <div style={{ position: "absolute", left: 60, top: y + 4, width: 262 }}>
              <div style={{ fontFamily: mono, fontSize: 22, fontWeight: 600, color: lane.color }}>{lane.name}</div>
              <div style={{ fontSize: 18, color: c.faint, marginTop: 4 }}>{lane.note}</div>
            </div>
            <div style={{ position: "absolute", left: X0, width: X1 - X0 + 56, top: y + 28, height: 2, background: c.line }} />
            {t > 0 && Array.from({ length: 6 }, (_, k) => k + 1).map((k) => (
              // Trails are outlines only, few and faint: they show the spacing without competing with the box.
              <div key={k} style={{ position: "absolute", left: pos(Math.max(0, t - 4 * k)) + 4, top: y + 8, width: 48, height: 48, borderRadius: 12, border: `2px solid ${lane.color}`, opacity: visible * 0.5 * (1 - k / 7) }} />
            ))}
            <div style={{ position: "absolute", left: pos(t), top: y + 4, width: 56, height: 56, borderRadius: 14, background: lane.color, opacity: visible, boxShadow: `0 0 28px ${lane.color}66` }} />
            <CurveChart x={950} y={y - 6} w={270} h={104} tMax={60} now={t} value={curves[i]} color={lane.color} />
          </React.Fragment>
        );
      })}
    </Stage>
  );
};
