import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { c, inter, mono } from "../theme";
import { Caption } from "./Caption";

/** Scene wrapper: background, scene chip (number + name), captions. */
export const Scene: React.FC<{ n: number; title: string; narration: string[]; children: React.ReactNode }> = ({ n, title, narration, children }) => (
  <AbsoluteFill style={{ background: c.bg, fontFamily: inter, color: c.text }}>
    <div style={{ position: "absolute", top: 40, left: 56, display: "flex", alignItems: "center", gap: 14, fontSize: 22, color: c.dim, fontWeight: 600, letterSpacing: 0.4 }}>
      <span style={{ width: 34, height: 34, borderRadius: 10, background: c.panel2, border: `1px solid ${c.line}`, display: "grid", placeItems: "center", color: c.rose, fontFamily: mono, fontSize: 18 }}>{n}</span>
      {title}
    </div>
    {children}
    <Caption sentences={narration} />
  </AbsoluteFill>
);

/** Fade + rise in, starting at `at` frames. */
export const useIn = (at: number, dur = 18) => {
  const f = useCurrentFrame();
  const t = interpolate(f, [at, at + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return { opacity: t, transform: `translateY(${(1 - t) * 18}px)` } as React.CSSProperties;
};

export const usePop = (at: number) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - at, fps, config: { damping: 16, stiffness: 140 } });
};

/** Screenshot on a rounded card with an optional label bar. */
export const Shot: React.FC<{ src: string; width: number; label?: string; style?: React.CSSProperties; ratio?: number }> = ({ src, width, label, style, ratio }) => (
  <div style={{ width, borderRadius: 18, overflow: "hidden", background: "#fff", border: `1px solid ${c.line}`, boxShadow: "0 18px 60px rgba(0,0,0,0.45)", ...style }}>
    {label && <div style={{ background: c.panel2, color: c.dim, fontSize: 20, fontWeight: 600, padding: "10px 18px", borderBottom: `1px solid ${c.line}` }}>{label}</div>}
    <Img src={staticFile(src)} style={{ display: "block", width: "100%", height: ratio ? width / ratio : "auto" }} />
  </div>
);

export const Pill: React.FC<{ children: React.ReactNode; color?: string; style?: React.CSSProperties }> = ({ children, color = c.rose, style }) => (
  <span style={{ display: "inline-block", padding: "6px 14px", borderRadius: 999, border: `1px solid ${color}`, color, fontSize: 20, fontWeight: 600, ...style }}>{children}</span>
);
