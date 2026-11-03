import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { c, inter, mono } from "../../theme";
import { useStarts } from "../../timing";
import { Stage } from "../../showcase/Stage";
import { Sfx, demoSentences } from "../shell";

/** Scene 5: the captions are kinetic. A big sample line pops in word by word, and while the voice says "change the spring
 *  settings" the settings move (soft, then bouncy) and the same line animates with the new feel. */
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const WORDS = ["Each", "word", "pops", "in", "as", "it", "is", "spoken"];
const CYCLE = 110;
const STEP = 6;

type Cfg = { damping: number; stiffness: number };
const SOFT: Cfg = { damping: 22, stiffness: 60 };
const NORMAL: Cfg = { damping: 14, stiffness: 190 };
const BOUNCY: Cfg = { damping: 5, stiffness: 230 };

const Slider: React.FC<{ label: string; value: number; min: number; max: number; color: string }> = ({ label, value, min, max, color }) => (
  <div style={{ marginBottom: 22 }}>
    <div style={{ display: "flex", justifyContent: "space-between", fontFamily: mono, fontSize: 22, color: c.text }}>
      <span>{label}</span><span style={{ color }}>{Math.round(value)}</span>
    </div>
    <div style={{ position: "relative", height: 8, marginTop: 12, background: c.panel2, borderRadius: 4 }}>
      <div style={{ position: "absolute", left: 0, top: 0, height: 8, width: `${((value - min) / (max - min)) * 100}%`, background: color, borderRadius: 4 }} />
      <div style={{ position: "absolute", left: `calc(${((value - min) / (max - min)) * 100}% - 11px)`, top: -7, width: 22, height: 22, borderRadius: 11, background: c.text }} />
    </div>
  </div>
);

export const Scene5: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = useStarts(demoSentences("scene5"));
  // the settings: normal, then (at the third sentence) soft, then bouncy
  const toSoft = interpolate(frame, [s[2] + 4, s[2] + 24], [0, 1], clamp);
  const toBouncy = interpolate(frame, [s[2] + 96, s[2] + 116], [0, 1], clamp);
  const mix = (a: number, b: number, k: number) => a + (b - a) * k;
  const cfg: Cfg = {
    damping: mix(mix(NORMAL.damping, SOFT.damping, toSoft), BOUNCY.damping, toBouncy),
    stiffness: mix(mix(NORMAL.stiffness, SOFT.stiffness, toSoft), BOUNCY.stiffness, toBouncy),
  };
  const intro = interpolate(frame, [2, 20], [0, 1], clamp);
  const local = (frame - 8) % CYCLE;
  const cycleVis = interpolate(local, [CYCLE - 14, CYCLE - 2], [1, 0], clamp);
  const label = toBouncy > 0.5 ? "bouncy" : toSoft > 0.5 ? "soft" : "normal";
  return (
    <Stage title="The captions you are reading" subtitle="Word timestamps in, a spring per word out." at={frame}>
      <div style={{ position: "absolute", left: 60, top: 150, width: 760, height: 330, background: c.panel, border: `1px solid ${c.line}`, borderRadius: 20, opacity: intro, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 40, top: 40, right: 40, display: "flex", flexWrap: "wrap", gap: "6px 22px", fontFamily: inter, fontSize: 82, fontWeight: 700, lineHeight: 1.08, color: c.text, opacity: cycleVis }}>
          {WORDS.map((w, i) => {
            const p = spring({ frame: local - i * STEP, fps, config: cfg });
            const shown = interpolate(local - i * STEP, [0, 5], [0, 1], clamp);
            const speaking = local - i * STEP >= 0 && local - i * STEP < STEP;
            return <span key={w} style={{ display: "inline-block", opacity: shown, transform: `translateY(${(1 - p) * 34}px) scale(${0.85 + 0.15 * p})`, color: speaking ? c.rose : c.text }}>{w}</span>;
          })}
        </div>
      </div>
      <div style={{ position: "absolute", left: 860, top: 150, width: 360, height: 330, background: c.panel, border: `1px solid ${c.line}`, borderRadius: 20, opacity: intro, padding: "26px 30px", boxSizing: "border-box" }}>
        <div style={{ fontFamily: mono, fontSize: 18, color: c.faint, marginBottom: 22 }}>spring config · {label}</div>
        <Slider label="damping" value={cfg.damping} min={1} max={30} color={c.blue} />
        <Slider label="stiffness" value={cfg.stiffness} min={20} max={300} color={c.amber} />
      </div>
      <Sfx name="whoosh" at={s[2] + 2} volume={0.35} />
      <Sfx name="pop" at={s[2] + 100} volume={0.5} />
    </Stage>
  );
};
