import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { c, mono } from "../../theme";
import { useStarts } from "../../timing";
import { Stage } from "../../showcase/Stage";
import { Sfx, demoSentences, wordFrame } from "../shell";

/** Scene 7: the camera is math. A page (a mock dashboard) is the "world"; the camera is one CSS transform: scale for a zoom,
 *  translate for a pan, rotateX with perspective for a tilt. Each move starts on the word that names it, and the readout
 *  shows the exact value, so "twenty degrees" is twenty degrees. */
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const Scene7: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = useStarts(demoSentences("scene7"));
  const fz = wordFrame("scene7", /^zoom/i, s[1] + 6);
  const fp = wordFrame("scene7", /^pan/i, fz + 50);
  const ft = wordFrame("scene7", /^tilt/i, fp + 60);
  const f20 = wordFrame("scene7", /^(twenty|20)/i, s[2] + 40);
  const fr = wordFrame("scene7", /^roll/i, f20 + 60);
  const bump = (a: number, len: number) => Math.sin(Math.PI * interpolate(frame, [a, a + len], [0, 1], clamp));
  const scale = 1 + 0.32 * bump(fz - 2, 56);
  const tx = 170 * Math.sin(2 * Math.PI * interpolate(frame, [fp - 2, fp + 70], [0, 1], clamp));
  const up = spring({ frame: frame - f20, fps, config: { damping: 16, stiffness: 70 } });
  const back = spring({ frame: frame - fr, fps, config: { damping: 18, stiffness: 70 } });
  const rx = 20 * up * (1 - back);
  const intro = interpolate(frame, [2, 22], [0, 1], clamp);
  const row = (label: string, value: string, on: boolean) => (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 24, fontFamily: mono, fontSize: 24, color: on ? c.rose : c.dim, padding: "8px 0" }}>
      <span>{label}</span><span style={{ color: on ? c.text : c.faint }}>{value}</span>
    </div>
  );
  const card = (left: number, top: number, w: number, h: number, children?: React.ReactNode) => (
    <div style={{ position: "absolute", left, top, width: w, height: h, background: c.panel2, border: `1px solid ${c.line}`, borderRadius: 14, padding: 16, boxSizing: "border-box" }}>{children}</div>
  );
  return (
    <Stage title="The camera is just math" subtitle="Zoom, pan and tilt are three numbers applied to the whole scene." at={frame}>
      <div style={{ position: "absolute", left: 60, top: 150, width: 800, height: 440, overflow: "hidden", border: `1px solid ${c.line}`, borderRadius: 18, background: c.bg, opacity: intro }}>
       <div style={{ position: "absolute", inset: 0, perspective: 1100 }}>
        <div style={{ position: "absolute", left: 10, top: 20, width: 780, height: 400, transformOrigin: "50% 50%", transform: `translate3d(${tx}px, 0, 0) scale(${scale}) rotateX(${rx}deg)`, background: c.panel, border: `1px solid ${c.line}`, borderRadius: 18, boxShadow: "0 30px 60px rgba(0,0,0,0.45)", overflow: "hidden" }}>
          <div style={{ display: "flex", gap: 8, padding: "14px 18px" }}>{["#ff5f57", "#febc2e", "#28c840"].map((col) => <div key={col} style={{ width: 11, height: 11, borderRadius: 6, background: col }} />)}</div>
          {card(24, 56, 240, 120, <div style={{ fontFamily: mono, fontSize: 15, color: c.faint }}>reviews<div style={{ fontSize: 44, color: c.text, marginTop: 8 }}>12</div></div>)}
          {card(284, 56, 240, 120, <div style={{ fontFamily: mono, fontSize: 15, color: c.faint }}>answered<div style={{ fontSize: 44, color: c.green, marginTop: 8 }}>9</div></div>)}
          {card(544, 56, 232, 120, <div style={{ fontFamily: mono, fontSize: 15, color: c.faint }}>waiting<div style={{ fontSize: 44, color: c.amber, marginTop: 8 }}>3</div></div>)}
          {card(24, 196, 500, 176, (
            <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
              <polyline points="0,32 14,26 28,29 42,18 56,22 70,10 84,14 100,4" fill="none" stroke={c.rose} strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
            </svg>
          ))}
          {card(544, 196, 232, 176, <div style={{ width: 120, height: 44, borderRadius: 12, background: c.rose, color: c.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: mono, fontSize: 20, fontWeight: 600 }}>Save</div>)}
        </div>
       </div>
      </div>
      <div style={{ position: "absolute", left: 900, top: 150, width: 320, background: c.panel, border: `1px solid ${c.line}`, borderRadius: 18, padding: "18px 26px", boxSizing: "border-box", opacity: intro }}>
        <div style={{ fontFamily: mono, fontSize: 17, color: c.faint, marginBottom: 6 }}>camera</div>
        {row("zoom", `scale(${scale.toFixed(2)})`, frame >= fz - 2 && frame < fp - 2)}
        {row("pan", `translateX(${Math.round(tx)}px)`, frame >= fp - 2 && frame < ft)}
        {row("tilt", `rotateX(${Math.round(rx)}°)`, frame >= ft)}
        <div style={{ marginTop: 14, fontFamily: mono, fontSize: 15, color: c.faint }}>perspective(1100px)</div>
      </div>
      <Sfx name="whoosh" at={fz - 8} volume={0.4} />
      <Sfx name="whoosh" at={fp - 8} volume={0.4} />
      <Sfx name="whoosh" at={f20 - 6} volume={0.45} />
      <Sfx name="pop" at={f20 + 22} volume={0.5} />
      <Sfx name="whoosh" at={fr - 6} volume={0.4} />
    </Stage>
  );
};
