import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { c, inter, mono } from "../theme";
import { ramp } from "../anim";

/** Showcase clip: four spring() settings side by side. damping = bounce (lower bounces more), stiffness = speed. */
const CELLS = [
  { name: "stiff, no bounce", damping: 30, stiffness: 220, color: c.blue },
  { name: "bouncy", damping: 7, stiffness: 220, color: c.rose },
  { name: "soft and slow", damping: 18, stiffness: 40, color: c.amber },
  { name: "wobbly", damping: 5, stiffness: 60, color: c.green },
];
const CYCLE = 100;

export const SpringGrid: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = frame % CYCLE;
  const visible = ramp(f, 0, 8) * (1 - ramp(f, CYCLE - 10, CYCLE));
  return (
    <AbsoluteFill style={{ background: c.bg, fontFamily: inter, color: c.text }}>
      <div style={{ position: "absolute", left: 60, top: 40, fontSize: 38, fontWeight: 600 }}>spring(): two numbers</div>
      <div style={{ position: "absolute", left: 60, top: 96, fontSize: 24, color: c.dim }}>damping: lower bounces more · stiffness: higher is faster</div>
      {CELLS.map((cell, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const left = 60 + col * 610;
        const top = 170 + row * 260;
        const p = spring({ frame: f - 8, fps, config: { damping: cell.damping, stiffness: cell.stiffness } });
        return (
          <div key={cell.name} style={{ position: "absolute", left, top, width: 560, height: 220, background: c.panel, border: `1px solid ${c.line}`, borderRadius: 20 }}>
            <div style={{ position: "absolute", left: 28, top: 22, fontSize: 26, fontWeight: 600 }}>{cell.name}</div>
            <div style={{ position: "absolute", left: 28, top: 62, fontFamily: mono, fontSize: 20, color: c.dim }}>damping {cell.damping} · stiffness {cell.stiffness}</div>
            <div style={{ position: "absolute", left: 28, right: 28, top: 164, height: 2, background: c.line }} />
            <div style={{ position: "absolute", left: 28 + (560 - 56 - 56 - 64) * p, top: 134, width: 56, height: 56, borderRadius: 14, background: cell.color, opacity: visible }} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
