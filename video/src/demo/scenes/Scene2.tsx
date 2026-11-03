import React, { useContext } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { c, inter, mono } from "../../theme";
import { StartsContext, WordsContext, useStarts } from "../../timing";
import { Stage } from "../../showcase/Stage";
import { Sfx, demoSentences } from "../shell";

/** Scene 2: a video is a function of the frame number. The counter reaches 45 exactly when the voice says "forty-five". */
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Panel: React.FC<{ left: number; top: number; width: number; height: number; children: React.ReactNode; opacity?: number }> = ({ left, top, width, height, children, opacity = 1 }) => (
  <div style={{ position: "absolute", left, top, width, height, background: c.panel, border: `1px solid ${c.line}`, borderRadius: 18, opacity, overflow: "hidden" }}>{children}</div>
);

export const Scene2: React.FC = () => {
  const frame = useCurrentFrame();
  const s = useStarts(demoSentences("scene2"));
  const words = useContext(WordsContext);
  void useContext(StartsContext);
  const f45 = words?.find(([w]) => /forty/i.test(w))?.[1] ?? s[1] + 90;
  const half = words?.find(([w]) => /^half/i.test(w))?.[1] ?? f45 + 30;
  const t0 = s[0] + 24;
  const n = Math.round(interpolate(frame, [t0, f45 + 4], [0, 45], clamp));
  const seconds = (n / 30).toFixed(1);
  const intro = interpolate(frame, [4, 24], [0, 1], clamp);
  const showSec = interpolate(frame, [half - 6, half + 8], [0, 1], clamp);
  const noTimers = interpolate(frame, [s[2] + 6, s[2] + 22], [0, 1], clamp);
  const noState = interpolate(frame, [s[2] + 40, s[2] + 56], [0, 1], clamp);
  const twins = interpolate(frame, [s[3] + 4, s[3] + 22], [0, 1], clamp);
  const boxX = (n / 90) * 360;
  const code = [
    ["// 0 to 1 between frames a and b", c.faint],
    ["const ramp = (f, a, b) =>", c.blue],
    ["  interpolate(f, [a, b], [0, 1],", c.text],
    ["    { extrapolateLeft: \"clamp\",", c.text],
    ["      extrapolateRight: \"clamp\" });", c.text],
  ] as const;
  const Mini: React.FC<{ label: string }> = ({ label }) => (
    <div style={{ width: 200, height: 110, background: c.panel2, border: `1px solid ${c.line}`, borderRadius: 14, position: "relative" }}>
      <div style={{ position: "absolute", left: 14, top: 10, fontFamily: mono, fontSize: 16, color: c.faint }}>{label}</div>
      <div style={{ position: "absolute", left: 14 + (45 / 90) * 150, top: 54, width: 36, height: 36, borderRadius: 10, background: c.rose }} />
    </div>
  );
  return (
    <Stage title="Frame in, picture out" subtitle="Remotion draws each frame from its number, nothing else." at={frame}>
      <Panel left={60} top={150} width={560} height={270} opacity={intro}>
        <div style={{ padding: "26px 30px", fontFamily: mono, fontSize: 21, lineHeight: 1.6 }}>
          {code.map(([line, color], i) => <div key={i} style={{ color, whiteSpace: "pre" }}>{line}</div>)}
        </div>
      </Panel>
      <Panel left={660} top={150} width={560} height={270} opacity={intro}>
        <div style={{ padding: "22px 30px", fontFamily: inter }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
            <span style={{ fontFamily: mono, fontSize: 20, color: c.faint }}>frame</span>
            <span style={{ fontFamily: mono, fontSize: 92, fontWeight: 600, color: c.text, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{String(n).padStart(3, "0")}</span>
            <span style={{ fontFamily: mono, fontSize: 36, color: c.rose, opacity: showSec }}>= {seconds} s</span>
          </div>
          <div style={{ position: "relative", marginTop: 34, height: 70 }}>
            <div style={{ position: "absolute", left: 0, right: 0, top: 34, height: 2, background: c.line }} />
            <div style={{ position: "absolute", left: boxX, top: 8, width: 54, height: 54, borderRadius: 14, background: c.rose, boxShadow: `0 0 26px ${c.rose}66` }} />
          </div>
          <div style={{ marginTop: 10, fontFamily: mono, fontSize: 18, color: c.faint }}>x = ramp(frame, 0, 90) × 360</div>
        </div>
      </Panel>
      <div style={{ position: "absolute", left: 60, top: 450, display: "flex", gap: 24, fontFamily: mono, fontSize: 26 }}>
        <div style={{ opacity: noTimers, color: c.text, background: c.panel, border: `1px solid ${c.line}`, borderRadius: 14, padding: "10px 22px" }}><span style={{ color: "#f87171" }}>✕</span> timers</div>
        <div style={{ opacity: noState, color: c.text, background: c.panel, border: `1px solid ${c.line}`, borderRadius: 14, padding: "10px 22px" }}><span style={{ color: "#f87171" }}>✕</span> hidden state</div>
      </div>
      <div style={{ position: "absolute", left: 640, top: 440, display: "flex", alignItems: "center", gap: 22, opacity: twins }}>
        <Mini label="render A · frame 45" />
        <span style={{ fontFamily: mono, fontSize: 40, color: c.green }}>=</span>
        <Mini label="render B · frame 45" />
      </div>
      {[10, 20, 30, 40].map((k) => <Sfx key={k} name="tick" at={t0 + Math.round(((f45 + 4 - t0) * k) / 45)} volume={0.4} />)}
      <Sfx name="pop" at={half - 4} volume={0.55} />
      <Sfx name="click" at={s[2] + 8} volume={0.45} />
      <Sfx name="click" at={s[2] + 42} volume={0.45} />
      <Sfx name="pop" at={s[3] + 6} volume={0.5} />
    </Stage>
  );
};
