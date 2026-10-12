import React from "react";
import { Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import narration from "../narration.json";
import { c, mono } from "../theme";
import { Chip, Scene, Shot, Term } from "../components/Frame";
import { T } from "../terminalText";
import { useStarts } from "../timing";
import { ramp, window12 } from "../anim";

const NARRATION = narration.scene6;
/** Screenshot cropped to its top `keep` source pixels (the rest is empty canvas). */
const Cropped: React.FC<{ src: string; width: number; nat: [number, number]; keep: number }> = ({ src, width, nat, keep }) => (
  <div style={{ width, height: (keep * width) / nat[0], overflow: "hidden", borderRadius: 16, border: `1px solid ${c.line}`, boxShadow: "0 18px 60px rgba(0,0,0,0.5)", background: "#fff" }}>
    <Img src={staticFile(src)} style={{ display: "block", width }} />
  </div>
);
const CHECKS = [
  "Figma vs Storybook sheet, 24 combinations",
  "hover and press equal the token (rgb(76, 5, 25) = #4c0519)",
  "disabled and loading colours equal their tokens",
  "every class resolves to CSS (checkUtilities)",
  "every story renders: 18 pages, 0 errors (renderCheck)",
];
const PROPS: [string, string[]][] = [
  ["kind", ["filled", "outlined", "dashed", "text"]],
  ["status", ["default", "primary", "info", "success", "warning", "danger"]],
  ["size", ["sm", "md", "lg"]],
  ["flags", ["loading", "disabled"]],
  ["slots", ["prefixIcon", "suffixIcon", "children"]],
];

export const Scene6: React.FC = () => {
  const f = useCurrentFrame();
  const { durationInFrames: total } = useVideoConfig();
  const s = useStarts(NARRATION);
  const P1 = window12(f, 0, s[2]);
  const P2 = window12(f, s[2], s[3]);
  const P3 = window12(f, s[3], s[5]);
  const P4 = window12(f, s[5], s[6]);
  const P5 = window12(f, s[6], Infinity);
  return (
    <Scene n={6} title="Components: Figma vs Storybook" narration={NARRATION}>
      {/* 1: the Figma set */}
      <div style={{ position: "absolute", inset: 0, opacity: P1 }}>
        <div style={{ position: "absolute", left: 90, top: 170, fontSize: 36, fontWeight: 700 }}>Button <span style={{ color: c.dim, fontWeight: 400 }}>· SHIELD, 360 variants</span></div>
        <div style={{ position: "absolute", left: 90, top: 260 }}><Shot src="assets/figma/figma-button-set.png" width={1740} /></div>
        <div style={{ position: "absolute", left: 90, top: 760, display: "flex", gap: 12, opacity: ramp(f, s[0] + 40, s[0] + 56) }}>
          {["Kind ×4", "Status ×6", "State ×3", "Size ×3", "Disabled", "Loading"].map((t) => <Chip key={t}>{t}</Chip>)}
        </div>
      </div>
      {/* 2: props */}
      <div style={{ position: "absolute", inset: 0, opacity: P2 }}>
        <div style={{ position: "absolute", left: 90, top: 170, fontSize: 36, fontWeight: 700 }}>One component <span style={{ color: c.dim, fontWeight: 400 }}>· props from the Figma properties</span></div>
        <div style={{ position: "absolute", left: 90, top: 260, width: 1200 }}>
          {PROPS.map(([k, vs], i) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 18, opacity: ramp(f, s[2] + i * 12, s[2] + 14 + i * 12) }}>
              <span style={{ width: 130, fontFamily: mono, fontSize: 28, color: c.rose, fontWeight: 600 }}>{k}</span>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>{vs.map((v) => <Chip key={v} style={{ padding: "7px 16px", fontSize: 22 }}>{v}</Chip>)}</div>
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", left: 1330, top: 270, width: 500, padding: 28, background: c.panel, border: `2px solid ${c.rose}`, borderRadius: 18, opacity: ramp(f, s[2] + 70, s[2] + 86) }}>
          <div style={{ fontSize: 26, fontWeight: 700 }}>State is not a prop</div>
          <div style={{ marginTop: 12, fontFamily: mono, fontSize: 24, color: c.dim, lineHeight: 1.6 }}>hovered → <span style={{ color: c.text }}>hover:</span><br />pressed → <span style={{ color: c.text }}>active:</span></div>
        </div>
      </div>
      {/* 3: the sheet */}
      <div style={{ position: "absolute", inset: 0, opacity: P3 }}>
        <div style={{ position: "absolute", left: 420, top: 150 }}>
          <Img src={staticFile("assets/results/button-figma-vs-storybook.png")} style={{ width: 1272, borderRadius: 16, border: `1px solid ${c.line}`, boxShadow: "0 18px 60px rgba(0,0,0,0.5)", background: "#fff", display: "block" }} />
        </div>
        <div style={{ position: "absolute", left: 90, top: 300, opacity: ramp(f, s[3] + 6, s[3] + 20) }}><Chip color={c.blue} solid>Figma</Chip></div>
        <div style={{ position: "absolute", left: 90, top: 640, opacity: ramp(f, s[3] + 26, s[3] + 40) }}><Chip color={c.rose} solid>Storybook</Chip></div>
      </div>
      {/* 4: the checks */}
      <div style={{ position: "absolute", inset: 0, opacity: P4 }}>
        <div style={{ position: "absolute", left: 90, top: 200, width: 900 }}>
          <div style={{ fontSize: 34, fontWeight: 700, marginBottom: 26 }}>Five checks</div>
          {CHECKS.map((t, i) => {
            const at = s[5] + 20 + i * 38;
            const on = ramp(f, at, at + 12);
            return (
              <div key={t} style={{ display: "flex", gap: 18, alignItems: "center", marginBottom: 22, fontSize: 28, color: on > 0.5 ? c.text : c.faint }}>
                <span style={{ width: 40, height: 40, borderRadius: 20, display: "grid", placeItems: "center", background: on > 0.5 ? c.green : c.panel2, color: "#0d1017", fontWeight: 800, fontSize: 24, border: `1px solid ${on > 0.5 ? c.green : c.line}` }}>{on > 0.5 ? "✓" : ""}</span>
                {t}
              </div>
            );
          })}
        </div>
        <div style={{ position: "absolute", left: 1040, top: 220, width: 800, opacity: ramp(f, s[5] + 50, s[5] + 66) }}>
          <Term text={T["11-interact"]} size={21} hot={["rgb(76, 5, 25)"]} />
        </div>
      </div>
      {/* 5: Input */}
      <div style={{ position: "absolute", inset: 0, opacity: P5 }}>
        <div style={{ position: "absolute", left: 90, top: 150, opacity: ramp(f, s[6], s[6] + 14) }}>
          <Cropped src="assets/results/input-figma-vs-storybook-statuses.png" width={690} nat={[2616, 2856]} keep={2100} />
        </div>
        <div style={{ position: "absolute", left: 830, top: 170, opacity: ramp(f, s[7], s[7] + 14) }}>
          <Cropped src="assets/results/input-figma-vs-storybook-sizes.png" width={1000} nat={[2600, 1228]} keep={1000} />
        </div>
        <div style={{ position: "absolute", left: 830, top: 600, display: "flex", gap: 12, flexWrap: "wrap", width: 1000, opacity: ramp(f, s[8], s[8] + 14) }}>
          {["84 variants", "5 statuses", "3 sizes", "disabled", "read-only", "built by a fresh agent, using only the skill"].map((t, i) => <Chip key={t} color={i === 5 ? c.green : undefined} style={i === 5 ? { borderColor: c.green, color: c.green } : undefined}>{t}</Chip>)}
        </div>
      </div>
    </Scene>
  );
};
