import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { c, mono } from "../theme";
import { Scene, Shot, useIn } from "../components/Frame";
import { sentenceStarts, splitSentences } from "../timing";

const NARRATION = splitSentences(
  "Getting a design system from Figma into code usually has a hand-off in the middle: export the tokens, wire them in, rebuild the components, check them by eye. This skill is one door instead. It reads Figma directly, generates tokens, Foundations pages and components in Storybook, and proves that what it built matches Figma."
);
const STEPS = ["export the tokens", "wire them in", "rebuild the components", "check them by eye"];

export const Scene1: React.FC = () => {
  const f = useCurrentFrame();
  const { durationInFrames: total } = useVideoConfig();
  const s = sentenceStarts(NARRATION, total);
  const collapse = interpolate(f, [s[1], s[1] + 40], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const arrow = interpolate(f, [s[1] + 20, s[1] + 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tags = useIn(s[2]);
  return (
    <Scene n={1} title="One door" narration={NARRATION}>
      <div style={{ position: "absolute", left: 90, top: 362, ...useIn(0) }}>
        <Shot src="assets/figma/figma-button-set.png" width={700} label="Figma · SHIELD Button set (360 variants)" />
      </div>
      <div style={{ position: "absolute", right: 90, top: 250, ...useIn(10) }}>
        <Shot src="assets/storybook/ui-button-matrix.png" width={700} label="Storybook · the same Button as one component" />
      </div>
      {/* the hand-off chain in the middle */}
      <div style={{ position: "absolute", left: 820, top: 285, width: 280, display: "flex", flexDirection: "column", gap: 16, alignItems: "stretch", opacity: collapse, transform: `scaleY(${0.4 + 0.6 * collapse})`, transformOrigin: "top" }}>
        {STEPS.map((t, i) => {
          const at = 40 + i * 36;
          const o = interpolate(f, [at, at + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={t} style={{ opacity: o, background: c.panel, border: `1px dashed ${c.faint}`, borderRadius: 14, padding: "16px 18px", color: c.dim, fontSize: 24, textAlign: "center" }}>
              {t}
            </div>
          );
        })}
      </div>
      {/* the one door */}
      <div style={{ position: "absolute", left: 800, top: 462, width: 320, opacity: arrow }}>
        <div style={{ position: "relative", height: 8, borderRadius: 4, background: `linear-gradient(90deg, ${c.faint}, ${c.rose})`, width: `${arrow * 100}%` }}>
          <div style={{ position: "absolute", right: -6, top: -14, width: 0, height: 0, borderTop: "18px solid transparent", borderBottom: "18px solid transparent", borderLeft: `26px solid ${c.rose}` }} />
        </div>
        <div style={{ marginTop: 26, textAlign: "center", fontSize: 40, fontWeight: 700, color: c.rose, fontFamily: mono }}>skill</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 770, display: "flex", justifyContent: "center", gap: 14, ...tags }}>
        {["reads Figma directly", "tokens", "Foundations pages", "components", "proof it matches"].map((t, i) => (
          <span key={t} style={{ padding: "8px 18px", borderRadius: 999, background: c.panel2, border: `1px solid ${i === 4 ? c.green : c.line}`, color: i === 4 ? c.green : c.text, fontSize: 24, fontWeight: 600 }}>{t}</span>
        ))}
      </div>
    </Scene>
  );
};
