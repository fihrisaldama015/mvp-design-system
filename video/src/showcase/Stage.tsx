import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { c, inter, mono } from "../theme";

/** The common look of the showcase clips: a dark stage with a faint grid, the title, and a frame counter
 *  (the idea of Remotion on screen: a video is a function of the frame number). `at` is the frame to show. */
export const Stage: React.FC<{ title: string; subtitle: string; at: number; children: React.ReactNode }> = ({ title, subtitle, at, children }) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: c.bg, fontFamily: inter, color: c.text }}>
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(circle at 15% 0%, rgba(251,113,133,0.13), transparent 52%), linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`,
          backgroundSize: "100% 100%, 40px 40px, 40px 40px",
        }}
      />
      <div style={{ position: "absolute", left: 60, top: 40, fontSize: 40, fontWeight: 700, letterSpacing: -0.5 }}>{title}</div>
      <div style={{ position: "absolute", left: 60, top: 98, fontSize: 22, color: c.dim }}>{subtitle}</div>
      <div style={{ position: "absolute", right: 60, top: 52, fontFamily: mono, fontSize: 20, color: c.faint }}>
        frame <span style={{ color: c.text }}>{String(at).padStart(3, "0")}</span> · {(at / fps).toFixed(1)} s
      </div>
      {children}
    </AbsoluteFill>
  );
};

/** A small chart of a curve: faint full curve, bright part up to `now`, a dot at `now`. value(t) for t = 0..tMax. */
export const CurveChart: React.FC<{ x: number; y: number; w: number; h: number; tMax: number; now: number; value: (t: number) => number; color: string; ymax?: number }> = ({ x, y, w, h, tMax, now, value, color, ymax = 1.3 }) => {
  const px = (t: number) => (t / tMax) * w;
  const py = (v: number) => h - (v / ymax) * h;
  const pts = Array.from({ length: tMax + 1 }, (_, t) => [px(t), py(value(t))] as const);
  const d = (list: readonly (readonly [number, number])[]) => list.map(([a, b], i) => `${i ? "L" : "M"}${a.toFixed(1)} ${b.toFixed(1)}`).join(" ");
  const upto = Math.max(0, Math.min(tMax, Math.floor(now)));
  const cur = [px(Math.max(0, Math.min(tMax, now))), py(value(Math.max(0, Math.min(tMax, now))))] as const;
  return (
    <svg style={{ position: "absolute", left: x, top: y, overflow: "visible" }} width={w} height={h}>
      <rect x={0} y={0} width={w} height={h} rx={10} fill="rgba(255,255,255,0.03)" stroke={c.line} />
      <line x1={0} x2={w} y1={py(1)} y2={py(1)} stroke={c.faint} strokeDasharray="5 5" />
      <path d={d(pts)} fill="none" stroke={color} strokeOpacity={0.25} strokeWidth={3} />
      <path d={d(pts.slice(0, upto + 1))} fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" />
      <circle cx={cur[0]} cy={cur[1]} r={7} fill={color} />
    </svg>
  );
};
