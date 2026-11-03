import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { c, inter, mono } from "../../theme";
import { useStarts } from "../../timing";
import { Stage } from "../../showcase/Stage";
import { Sfx, demoSentences, wordFrame } from "../shell";

/** Scene 12: the close. Who does what, then the title again with a riser and a bell on the last word. */
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const Scene12: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = useStarts(demoSentences("scene12"));
  const claude = interpolate(frame, [s[0], s[0] + 16], [0, 1], clamp);
  const you = interpolate(frame, [s[1], s[1] + 16], [0, 1], clamp);
  const fade = interpolate(frame, [s[2] - 8, s[2] + 8], [1, 0], clamp);
  const lastWord = wordFrame("scene12", /^code/i, s[2] + 60);
  const title = spring({ frame: frame - (s[2] - 2), fps, config: { damping: 15, stiffness: 90 } });
  const push = 1 + 0.04 * interpolate(frame, [s[2], s[2] + 120], [0, 1], clamp);
  const list = (items: string[], opacity: number) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, opacity, transform: `translateY(${(1 - opacity) * 18}px)` }}>
      {items.map((t) => <div key={t} style={{ fontFamily: inter, fontSize: 32, color: c.text }}>{t}</div>)}
    </div>
  );
  return (
    <Stage title="" subtitle="" at={frame}>
      <div style={{ position: "absolute", inset: 0, opacity: fade }}>
        <div style={{ position: "absolute", left: 60, top: 150, width: 560, height: 300, background: c.panel, border: `1px solid ${c.line}`, borderRadius: 20, padding: "30px 36px", boxSizing: "border-box" }}>
          <div style={{ fontFamily: mono, fontSize: 22, color: c.rose, marginBottom: 20 }}>Claude</div>
          {list(["writes the scenes", "writes the helpers", "writes the scripts"], claude)}
        </div>
        <div style={{ position: "absolute", left: 660, top: 150, width: 560, height: 300, background: c.panel, border: `1px solid ${c.line}`, borderRadius: 20, padding: "30px 36px", boxSizing: "border-box" }}>
          <div style={{ fontFamily: mono, fontSize: 22, color: c.amber, marginBottom: 20 }}>You</div>
          {list(["write the script", "choose the voice", "judge the feel"], you)}
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 190, textAlign: "center", transform: `scale(${push})`, opacity: Math.min(1, title * 1.4) }}>
        <div style={{ fontFamily: inter, fontSize: 118, fontWeight: 800, letterSpacing: -3, color: c.text, transform: `translateY(${(1 - title) * 30}px)` }}>Video as code</div>
        <div style={{ fontFamily: mono, fontSize: 26, color: c.dim, marginTop: 22 }}>video/ · npm run studio · Remotion + Claude</div>
      </div>
      <Sfx name="click" at={s[0] + 2} volume={0.4} />
      <Sfx name="click" at={s[1] + 2} volume={0.4} />
      <Sfx name="riser" at={Math.max(0, lastWord - 70)} volume={0.35} />
      <Sfx name="chime" at={lastWord + 6} volume={0.55} />
    </Stage>
  );
};
