import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import narration from "../narration.json";
import { c, mono } from "../theme";
import { Scene, Term } from "../components/Frame";
import { T } from "../terminalText";
import { useStarts } from "../timing";
import { ramp } from "../anim";

const NARRATION = narration.scene9;

const Card: React.FC<{ letter: string; title: string; has: string; tested: string[]; at: number; active: boolean; style: React.CSSProperties }> = ({ letter, title, has, tested, at, active, style }) => {
  const f = useCurrentFrame();
  const o = ramp(f, at, at + 16);
  return (
    <div style={{ position: "absolute", opacity: o, transform: `translateY(${(1 - o) * 20}px)`, background: c.panel, border: `2px solid ${active ? c.rose : c.line}`, borderRadius: 20, padding: "24px 28px", ...style }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ width: 46, height: 46, borderRadius: 14, display: "grid", placeItems: "center", background: active ? c.rose : c.panel2, color: active ? "#0d1017" : c.text, fontFamily: mono, fontWeight: 700, fontSize: 28 }}>{letter}</span>
        <span style={{ fontSize: 32, fontWeight: 700 }}>{title}</span>
      </div>
      <div style={{ marginTop: 10, fontSize: 22, color: c.dim }}>project has: {has}</div>
      <ul style={{ margin: "12px 0 0", paddingLeft: 26, fontSize: 23, lineHeight: 1.5, color: c.text }}>{tested.map((t) => <li key={t}>{t}</li>)}</ul>
    </div>
  );
};

export const Scene9: React.FC = () => {
  const f = useCurrentFrame();
  const { durationInFrames: total } = useVideoConfig();
  const s = useStarts(NARRATION);
  const cur = f >= s[4] ? 2 : f >= s[3] ? 1 : f >= s[1] ? 0 : -1;
  return (
    <Scene n={9} title="Three starting points" narration={NARRATION}>
      <Card letter="A" title="Project without Storybook" has="an app or boilerplate" at={s[1]} active={cur === 0} style={{ left: 70, top: 150, width: 860 }}
        tested={["MVP from before it had Storybook, on rsbuild and on Vite", "Storybook: 18 pages, 0 errors; the app still builds", "0 of 167 colour classes it uses went missing", "Button props appear in the AI manifest"]} />
      <Card letter="B" title="Storybook already exists" has=".storybook/" at={s[3]} active={cur === 1} style={{ left: 70, top: 560, width: 420 }}
        tested={["update tokens", "or one component (Button, Input)"]} />
      <Card letter="C" title="Empty folder" has="nothing" at={s[4]} active={cur === 2} style={{ left: 510, top: 560, width: 420 }}
        tested={["starter template (React 18, rsbuild, Tailwind 3)", "then the same flow as A"]} />
      <div style={{ position: "absolute", left: 980, top: 160, width: 870, opacity: ramp(f, s[1] + 40, s[1] + 56) }}>
        <Term text={T["09-initstorybook"]} size={22} lines={[0, 14]} hot={["Storybook framework: storybook-react-rsbuild"]} />
      </div>
    </Scene>
  );
};
