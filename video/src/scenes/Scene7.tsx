import React from "react";
import { useCurrentFrame } from "remotion";
import { c } from "../theme";
import { Scene, Shot, Term } from "../components/Frame";
import { T } from "../terminalText";
import { ramp } from "../anim";

const Step: React.FC<{ n: number; caption: string; at: number; left: number; top: number; children: React.ReactNode }> = ({ n, caption, at, left, top, children }) => {
  const f = useCurrentFrame();
  const o = ramp(f, at, at + 16);
  return (
    <div style={{ position: "absolute", left, top, opacity: o, transform: `translateY(${(1 - o) * 24}px)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
        <span style={{ width: 42, height: 42, borderRadius: 21, display: "grid", placeItems: "center", background: c.rose, color: "#0d1017", fontWeight: 800, fontSize: 24 }}>{n}</span>
        <span style={{ fontSize: 28, fontWeight: 600, color: c.text }}>{caption}</span>
      </div>
      {children}
    </div>
  );
};

export const Scene7: React.FC = () => (
  <Scene n={7} title="A run in screenshots">
    <Step n={1} caption="Figma: the Button set (360 variants)" at={10} left={90} top={130}>
      <Shot src="assets/figma/figma-button-set.png" width={840} />
    </Step>
    <Step n={2} caption="Loader call → the files land in .figma-dump/" at={110} left={990} top={130}>
      <Term text={T["03-dump-folder"]} size={22} width={840} hot={["components.Button.json"]} />
    </Step>
    <Step n={3} caption="build-storybook, then renderCheck" at={210} left={90} top={540}>
      <Term text={T["10-build-and-rendercheck"]} size={22} width={840} hot={["errors: 0"]} />
    </Step>
    <Step n={4} caption="The Button story" at={310} left={990} top={650}>
      <Shot src="assets/storybook/ui-button-filled.png" width={540} />
    </Step>
  </Scene>
);
