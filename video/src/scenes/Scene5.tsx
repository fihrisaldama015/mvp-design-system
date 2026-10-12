import React from "react";
import { Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import narration from "../narration.json";
import { c, mono } from "../theme";
import { Scene } from "../components/Frame";
import { useStarts } from "../timing";
import { ramp, window12 } from "../anim";

const NARRATION = narration.scene5;
// [tab label, file, natural height]
const PAGES: [string, string, number][] = [
  ["Colors · Light", "colors-light", 1500],
  ["Colors · Dark", "colors-dark", 1500],
  ["Typography", "typography", 1800],
  ["Spacing and sizing", "spacing-sizing", 1800],
  ["Radius and borders", "radius-borders", 1500],
  ["Effects", "effects", 1500],
];
const VW = 1180;
const VH = 640;
// the docs content sits in x 100..1140 of the 1440px screenshot: crop to that and scale up
const CROP_X = 100;
const K = VW / 1040;

export const Scene5: React.FC = () => {
  const f = useCurrentFrame();
  const { durationInFrames: total } = useVideoConfig();
  const s = useStarts(NARRATION);
  const d0 = s[1] - s[0];
  const d1 = total - s[1];
  // when each page starts: Colors Light and Dark share sentence 0, the other four share sentence 1
  const starts = [s[0], s[0] + Math.round(d0 * 0.5), s[1], s[1] + Math.round(d1 * 0.28), s[1] + Math.round(d1 * 0.52), s[1] + Math.round(d1 * 0.76)];
  const ends = [...starts.slice(1), Infinity];
  return (
    <Scene n={5} title="Foundation results" narration={NARRATION}>
      <div style={{ position: "absolute", left: 90, top: 112, display: "flex", gap: 10 }}>
        {PAGES.map(([t], i) => {
          const on = f >= starts[i] && f < ends[i];
          return <span key={t} style={{ padding: "8px 16px", borderRadius: 10, fontSize: 21, fontWeight: 600, background: on ? c.rose : c.panel2, color: on ? "#0d1017" : c.dim, border: `1px solid ${on ? c.rose : c.line}` }}>{t}</span>;
        })}
      </div>
      <div style={{ position: "absolute", left: 90, top: 170, width: VW, height: VH, overflow: "hidden", borderRadius: 16, border: `1px solid ${c.line}`, background: "#fff", boxShadow: "0 18px 60px rgba(0,0,0,0.5)" }}>
        {PAGES.map(([t, file, h], i) => {
          const o = window12(f, starts[i], ends[i], 14);
          const prog = ramp(f, starts[i], ends[i] === Infinity ? total : ends[i]);
          const range = h * K - VH;
          return <Img key={t} src={staticFile(`assets/storybook/${file}.png`)} style={{ position: "absolute", left: -CROP_X * K, top: -range * prog, width: 1440 * K, opacity: o }} />;
        })}
      </div>
      {/* numbers */}
      <div style={{ position: "absolute", left: 1330, top: 190, width: 520 }}>
        {[
          ["903", "variables", "10 collections", s[0] + 10],
          ["714", "CSS variables", "Dark = data-theme override", s[0] + 50],
          ["58", "text styles", "typo-* classes", s[0] + 90],
          ["23", "effects", "shadows and blurs", s[0] + 130],
          ["6", "Foundations pages", "generated, not written", s[1] + 20],
        ].map(([n, label, sub, at]) => (
          <div key={label as string} style={{ opacity: ramp(f, at as number, (at as number) + 14), transform: `translateY(${(1 - ramp(f, at as number, (at as number) + 14)) * 14}px)`, marginBottom: 26 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
              <span style={{ fontFamily: mono, fontSize: 66, fontWeight: 600, color: c.rose, minWidth: 150 }}>{n}</span>
              <span style={{ fontSize: 30, fontWeight: 600, color: c.text }}>{label}</span>
            </div>
            <div style={{ fontSize: 22, color: c.dim, marginLeft: 166, marginTop: -4 }}>{sub}</div>
          </div>
        ))}
      </div>
    </Scene>
  );
};
