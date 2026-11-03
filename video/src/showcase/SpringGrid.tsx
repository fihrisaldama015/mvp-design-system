import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { c, mono } from "../theme";
import { ramp } from "../anim";
import { CurveChart, Stage } from "./Stage";

/** Showcase clip: four spring() settings side by side, each with the chart of its response. The dashed line is the
 *  target: a bounce shows as the curve going above it. damping = bounce (lower bounces more), stiffness = speed. */
const CELLS = [
  { name: "stiff, no bounce", damping: 30, stiffness: 220, color: c.blue },
  { name: "bouncy", damping: 7, stiffness: 220, color: c.rose },
  { name: "soft and slow", damping: 18, stiffness: 40, color: c.amber },
  { name: "wobbly", damping: 5, stiffness: 60, color: c.green },
];
const CYCLE = 110;

export const SpringGrid: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = frame % CYCLE;
  const visible = ramp(f, 0, 8) * (1 - ramp(f, CYCLE - 10, CYCLE));
  const t = f - 8;
  return (
    <Stage title="spring(): two numbers" subtitle="damping: lower bounces more · stiffness: higher is faster" at={f}>
      {CELLS.map((cell, i) => {
        const left = 60 + (i % 2) * 610;
        const top = 160 + Math.floor(i / 2) * 270;
        const value = (tt: number) => spring({ frame: tt, fps, config: { damping: cell.damping, stiffness: cell.stiffness } });
        const trackW = 560 - 56 - 56 - 64;
        return (
          <div key={cell.name} style={{ position: "absolute", left, top, width: 560, height: 240, background: c.panel, border: `1px solid ${c.line}`, borderRadius: 20 }}>
            <div style={{ position: "absolute", left: 28, top: 24, fontSize: 26, fontWeight: 600 }}>{cell.name}</div>
            <div style={{ position: "absolute", left: 28, top: 64, fontFamily: mono, fontSize: 19, color: c.dim, lineHeight: 1.5 }}>damping {cell.damping}<br />stiffness {cell.stiffness}</div>
            <CurveChart x={300} y={20} w={236} h={120} tMax={70} now={t} value={value} color={cell.color} ymax={1.4} />
            <div style={{ position: "absolute", left: 28, right: 28, top: 195, height: 2, background: c.line }} />
            <div style={{ position: "absolute", left: 28 + trackW * value(Math.max(0, t)), top: 167, width: 56, height: 56, borderRadius: 14, background: cell.color, opacity: visible, boxShadow: `0 0 24px ${cell.color}66` }} />
          </div>
        );
      })}
    </Stage>
  );
};
