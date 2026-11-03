import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { evolvePath } from "@remotion/paths";
import { Circle, Star, Triangle } from "@remotion/shapes";
import { noise2D } from "@remotion/noise";
import { c, mono } from "../../theme";
import { useStarts } from "../../timing";
import { Stage } from "../../showcase/Stage";
import { Sfx, demoSentences } from "../shell";

/** Scene 10: more tools. A path that draws itself (evolvePath), and shapes whose position and turn come from noise. */
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const PATH = "M 30 190 C 90 30, 150 30, 210 120 S 330 250, 390 110 S 470 20, 520 90";
const COLORS = [c.rose, c.amber, c.blue, c.green];

export const Scene10: React.FC = () => {
  const frame = useCurrentFrame();
  const s = useStarts(demoSentences("scene10"));
  const title = interpolate(frame, [s[0] - 8, s[0] + 10, s[1] - 14, s[1] + 4], [0, 1, 1, 0], clamp);
  const left = interpolate(frame, [s[1] - 6, s[1] + 10], [0, 1], clamp);
  const right = interpolate(frame, [s[2] - 6, s[2] + 10], [0, 1], clamp);
  const progress = interpolate(frame, [s[1] + 6, s[1] + 86], [0, 1], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 3) });
  const evolved = evolvePath(progress, PATH);
  const cells = Array.from({ length: 15 }, (_, i) => i);
  return (
    <Stage title="" subtitle="" at={frame}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 250, textAlign: "center", fontSize: 96, fontWeight: 800, color: c.text, opacity: title, letterSpacing: -2 }}>And there is more</div>
      <div style={{ position: "absolute", left: 60, top: 150, width: 580, height: 330, background: c.panel, border: `1px solid ${c.line}`, borderRadius: 18, opacity: left, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 22, top: 14, fontFamily: mono, fontSize: 19, color: c.text }}>evolvePath(progress, d)</div>
        <div style={{ position: "absolute", left: 22, top: 40, fontFamily: mono, fontSize: 16, color: c.faint }}>@remotion/paths · progress {progress.toFixed(2)}</div>
        <svg viewBox="0 0 560 280" style={{ position: "absolute", left: 10, top: 56, width: 560, height: 270 }}>
          <path d={PATH} fill="none" stroke={c.line} strokeWidth={4} strokeLinecap="round" />
          <path d={PATH} fill="none" stroke={c.rose} strokeWidth={7} strokeLinecap="round" strokeDasharray={evolved.strokeDasharray} strokeDashoffset={evolved.strokeDashoffset} />
        </svg>
      </div>
      <div style={{ position: "absolute", left: 680, top: 150, width: 540, height: 330, background: c.panel, border: `1px solid ${c.line}`, borderRadius: 18, opacity: right, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 22, top: 14, fontFamily: mono, fontSize: 19, color: c.text }}>noise2D(seed, x, y)</div>
        <div style={{ position: "absolute", left: 22, top: 40, fontFamily: mono, fontSize: 16, color: c.faint }}>@remotion/shapes · @remotion/noise</div>
        {cells.map((i) => {
          const col = i % 5;
          const row = Math.floor(i / 5);
          const dx = noise2D("x", col * 0.7, frame * 0.018 + row) * 22;
          const dy = noise2D("y", col * 0.7 + 9, frame * 0.018 + row) * 22;
          const rot = noise2D("r", col, row + frame * 0.012) * 90;
          const fill = COLORS[i % COLORS.length];
          const kind = i % 3;
          return (
            <div key={i} style={{ position: "absolute", left: 38 + col * 96 + dx, top: 92 + row * 78 + dy, transform: `rotate(${rot}deg)` }}>
              {kind === 0 ? <Star points={5} innerRadius={14} outerRadius={30} fill={fill} /> : kind === 1 ? <Circle radius={22} fill={fill} /> : <Triangle length={50} direction="up" fill={fill} />}
            </div>
          );
        })}
      </div>
      <Sfx name="whoosh" at={s[0] + 2} volume={0.4} />
      <Sfx name="whoosh" at={s[1] + 4} volume={0.35} />
      <Sfx name="pop" at={s[1] + 86} volume={0.45} />
      <Sfx name="pop" at={s[2] + 6} volume={0.45} />
    </Stage>
  );
};
