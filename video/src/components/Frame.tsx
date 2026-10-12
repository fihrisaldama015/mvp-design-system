import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { c, inter, mono } from "../theme";
import { Caption } from "./Caption";

/** Scene wrapper: background, scene chip (number + name), captions. */
export const Scene: React.FC<{ n: number; title: string; narration?: string[]; children: React.ReactNode }> = ({ n, title, narration = [], children }) => (
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

/** Terminal capture (PNG). `from` / `to` crop it to a band of pixel rows of the source image. */
export const TermShot: React.FC<{ src: string; width: number; srcWidth: number; srcHeight: number; from?: number; to?: number; style?: React.CSSProperties }> = ({ src, width, srcWidth, srcHeight, from = 0, to, style }) => {
  const k = width / srcWidth;
  const bottom = to ?? srcHeight;
  return (
    <div style={{ width, height: (bottom - from) * k, overflow: "hidden", borderRadius: 14, border: `1px solid ${c.line}`, boxShadow: "0 18px 60px rgba(0,0,0,0.5)", background: "#16181d", ...style }}>
      <Img src={staticFile(src)} style={{ display: "block", width, marginTop: -from * k }} />
    </div>
  );
};

export const Chip: React.FC<{ children: React.ReactNode; color?: string; solid?: boolean; style?: React.CSSProperties }> = ({ children, color = c.line, solid, style }) => (
  <span style={{ display: "inline-block", padding: "10px 20px", borderRadius: 14, background: solid ? color : c.panel2, border: `1px solid ${solid ? color : c.line}`, color: solid ? "#0d1017" : c.text, fontSize: 24, fontWeight: 600, ...style }}>{children}</span>
);

export const Mono: React.FC<{ children: React.ReactNode; color?: string; size?: number }> = ({ children, color = c.rose, size = 24 }) => (
  <span style={{ fontFamily: mono, color, fontSize: size }}>{children}</span>
);

/** A terminal window rendered as text. Lines starting with "$" are commands, "//" are comments. */
export const Term: React.FC<{ text: string; size?: number; width?: number; lines?: [number, number]; hot?: string[]; style?: React.CSSProperties }> = ({ text, size = 26, width, lines, hot = [], style }) => {
  const all = text.split("\n");
  const shown = lines ? all.slice(lines[0], lines[1]) : all;
  return (
    <div style={{ width, borderRadius: 16, overflow: "hidden", border: `1px solid ${c.line}`, background: "#14171d", boxShadow: "0 18px 60px rgba(0,0,0,0.5)", ...style }}>
      <div style={{ display: "flex", gap: 9, padding: "13px 16px", background: "#1b1f27", borderBottom: `1px solid ${c.line}` }}>
        {["#ff5f56", "#ffbd2e", "#27c93f"].map((k) => <span key={k} style={{ width: 13, height: 13, borderRadius: 7, background: k }} />)}
      </div>
      <div style={{ padding: "20px 26px", fontFamily: mono, fontSize: size, lineHeight: 1.5 }}>
        {shown.map((l, i) => {
          const isCmd = l.startsWith("$ ");
          const isNote = l.startsWith("//") || l.startsWith("   ...");
          const isHot = hot.some((h) => l.includes(h));
          return (
            <div key={i} style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", minHeight: size * 1.5, color: isNote ? c.faint : isHot ? c.rose : c.text, fontWeight: isCmd ? 600 : 400, background: isHot ? "rgba(251,113,133,0.12)" : undefined, margin: isHot ? "0 -26px" : undefined, padding: isHot ? "0 26px" : undefined }}>
              {isCmd ? <><span style={{ color: c.green }}>$ </span>{l.slice(2)}</> : l}
            </div>
          );
        })}
      </div>
    </div>
  );
};
