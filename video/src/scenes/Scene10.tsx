import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import narration from "../narration.json";
import { c, mono } from "../theme";
import { Scene } from "../components/Frame";
import { useStarts } from "../timing";
import { ramp } from "../anim";

const NARRATION = narration.scene10;
const Col: React.FC<{ title: string; color: string; items: string[]; note?: string; at: number; left: number }> = ({ title, color, items, note, at, left }) => {
  const f = useCurrentFrame();
  const o = ramp(f, at, at + 16);
  return (
    <div style={{ position: "absolute", left, top: 190, width: 540, opacity: o, transform: `translateY(${(1 - o) * 20}px)` }}>
      <div style={{ fontSize: 30, fontWeight: 700, color, marginBottom: 20 }}>{title}</div>
      {items.map((t) => (
        <div key={t} style={{ padding: "16px 22px", marginBottom: 12, background: c.panel, border: `1px solid ${color}`, borderRadius: 14, fontSize: 28, fontWeight: 600, color: c.text }}>{t}</div>
      ))}
      {note && <div style={{ marginTop: 14, fontSize: 23, color: c.dim, lineHeight: 1.4 }}>{note}</div>}
    </div>
  );
};

export const Scene10: React.FC = () => {
  const f = useCurrentFrame();
  const { durationInFrames: total } = useVideoConfig();
  const s = useStarts(NARRATION);
  const next = ramp(f, s[3], s[3] + 18);
  return (
    <Scene n={10} title="Limits and next" narration={NARRATION}>
      <Col title="Supported" color={c.green} items={["React 18", "Tailwind 3", "rsbuild", "Vite"]} at={s[0]} left={70} />
      <Col title="Not yet" color={c.faint} items={["Tailwind 4", "No Tailwind", "Next.js"]} note="The skill stops and says why. The workflow differs and there is no template yet." at={s[1]} left={680} />
      <Col title="Not tested yet" color={c.amber} items={["Webpack", "Dark mode in the component comparison"]} at={s[2]} left={1290} />
      <div style={{ position: "absolute", left: 70, right: 70, top: 700, padding: "26px 36px", background: c.panel, border: `2px solid ${c.rose}`, borderRadius: 20, display: "flex", alignItems: "center", gap: 24, opacity: next, transform: `translateY(${(1 - next) * 20}px)` }}>
        <span style={{ fontFamily: mono, fontSize: 28, color: c.rose, fontWeight: 700 }}>NEXT</span>
        <span style={{ fontSize: 32, fontWeight: 600 }}>the other stacks → more components, through the same pipeline</span>
      </div>
    </Scene>
  );
};
