import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import narration from "../narration.json";
import { c, mono } from "../theme";
import { Scene, Term } from "../components/Frame";
import { T } from "../terminalText";
import { useStarts } from "../timing";
import { ramp, window12 } from "../anim";

const NARRATION = narration.scene4;
// Excerpts of the real files (formatting compacted).
const ENTRY = `$ node -e "..." src/tokens/tokens.index.json
{
  "figma": "+Theme/color/background/primary/hovered",
  "id": "VariableID:4509:19190",
  "cssVar": "--theme-color-background-primary-hovered",
  "classes": ["bg-primary-hovered"],
  "alias": "{Color.rose.950}",
  "value": { "Light": "#4c0519", "Dark": "#fecdd3" }
}`;
const FIGMA_INDEX = `$ cat figma-index.json
{
  "components": {
    "Button": {
      "figmaFileKey": "o4wdbN7PjV2ugCKDcc2pXd",
      "fileName": "SHIELD - Base Component (Copy)",
      "nodeId": "7:21282",
      "page": { "name": "Button", "id": "7:18915" },
      "variants": 360,
      "props": ["Kind", "Status", "State", "Size", "..."],
      "story": "actions-button",
      "code": "src/components/button"
    }
  }
}`;
const CHAIN: [string, string, string][] = [
  ["Figma name", "+Theme/color/background/primary/hovered", c.text],
  ["Figma ID", "VariableID:4509:19190", c.rose],
  ["CSS variable", "--theme-color-background-primary-hovered", c.text],
  ["class", "bg-primary-hovered", c.text],
  ["value", "Light #4c0519 · Dark #fecdd3", c.text],
];

const Count: React.FC<{ label: string; n: number; of: number; at: number }> = ({ label, n, of, at }) => {
  const f = useCurrentFrame();
  const v = Math.round(n * ramp(f, at, at + 40));
  return (
    <div style={{ opacity: ramp(f, at, at + 12), display: "flex", alignItems: "baseline", gap: 14, marginBottom: 18 }}>
      <span style={{ fontFamily: mono, fontSize: 56, fontWeight: 600, color: c.green, minWidth: 190 }}>{v}/{of}</span>
      <span style={{ fontSize: 26, color: c.dim }}>{label} have an ID</span>
    </div>
  );
};

export const Scene4: React.FC = () => {
  const f = useCurrentFrame();
  const { durationInFrames: total } = useVideoConfig();
  const s = useStarts(NARRATION);
  const A = window12(f, 0, s[2]);
  const B = window12(f, s[2], s[3]);
  const C = window12(f, s[3], s[5]);
  const D = window12(f, s[5], Infinity);
  return (
    <Scene n={4} title="The Figma index: where to jump" narration={NARRATION}>
      {/* A: one entry, traced */}
      <div style={{ position: "absolute", inset: 0, opacity: A }}>
        <div style={{ position: "absolute", left: 60, right: 60, top: 120, display: "flex", gap: 12, alignItems: "stretch" }}>
          {CHAIN.map(([k, v, col], i) => (
            <React.Fragment key={k}>
              <div style={{ flex: 1, opacity: ramp(f, 20 + i * 26, 38 + i * 26), background: c.panel, border: `2px solid ${k === "Figma ID" ? c.rose : c.line}`, borderRadius: 14, padding: "14px 16px" }}>
                <div style={{ fontSize: 18, color: c.dim, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8 }}>{k}</div>
                <div style={{ marginTop: 6, fontFamily: mono, fontSize: 20, color: col, wordBreak: "break-all", lineHeight: 1.3 }}>{v}</div>
              </div>
              {i < CHAIN.length - 1 && <div style={{ alignSelf: "center", color: c.faint, fontSize: 28, opacity: ramp(f, 30 + i * 26, 48 + i * 26) }}>→</div>}
            </React.Fragment>
          ))}
        </div>
        <div style={{ position: "absolute", left: 70, top: 330, opacity: ramp(f, 60, 80) }}>
          <Term text={ENTRY} size={22} width={1100} hot={["VariableID"]} />
        </div>
        <div style={{ position: "absolute", left: 1230, top: 380 }}>
          <Count label="tokens" n={714} of={714} at={s[1]} />
          <Count label="text styles" n={58} of={58} at={s[1] + 20} />
          <Count label="effects" n={23} of={23} at={s[1] + 40} />
        </div>
      </div>
      {/* B: component pointer */}
      <div style={{ position: "absolute", inset: 0, opacity: B }}>
        <div style={{ position: "absolute", left: 90, top: 190, fontSize: 36, fontWeight: 700, color: c.text }}>figma-index.json <span style={{ color: c.dim, fontWeight: 400 }}>· one pointer per built component</span></div>
        <div style={{ position: "absolute", left: 90, top: 270 }}>
          <Term text={FIGMA_INDEX} size={22} width={1040} hot={["nodeId"]} />
        </div>
        <div style={{ position: "absolute", left: 1190, top: 330, width: 640 }}>
          {[["file", "SHIELD · o4wdbN7P…"], ["node", "7:21282"], ["page", "Button"], ["variants", "360"], ["story", "actions-button"]].map(([k, v], i) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "14px 22px", marginBottom: 10, background: c.panel, border: `1px solid ${k === "node" ? c.rose : c.line}`, borderRadius: 12, opacity: ramp(f, s[2] + 6 + i * 12, s[2] + 20 + i * 12) }}>
              <span style={{ color: c.dim, fontSize: 24 }}>{k}</span>
              <span style={{ fontFamily: mono, fontSize: 26, color: k === "node" ? c.rose : c.text }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
      {/* C: the update flow, no scan */}
      <div style={{ position: "absolute", inset: 0, opacity: C }}>
        <div style={{ position: "absolute", left: 90, right: 90, top: 330, display: "flex", gap: 22, alignItems: "center" }}>
          {[["1  resolveIds", "do the saved IDs still resolve to the same names?"], ["2  read by ID", "readComponents  ARGS.IDS = [ \"7:21282\" ]"], ["3  diff", "what changed → update the component"]].map(([t, d], i) => (
            <React.Fragment key={t}>
              <div style={{ flex: 1, opacity: ramp(f, s[3] + 10 + i * 40, s[3] + 28 + i * 40), background: c.panel, border: `2px solid ${i === 1 ? c.rose : c.line}`, borderRadius: 18, padding: "28px 26px", minHeight: 190 }}>
                <div style={{ fontFamily: mono, fontSize: 32, fontWeight: 600, color: c.text }}>{t}</div>
                <div style={{ marginTop: 14, fontSize: 24, color: c.dim, lineHeight: 1.35 }}>{d}</div>
              </div>
              {i < 2 && <div style={{ color: c.faint, fontSize: 40, opacity: ramp(f, s[3] + 30 + i * 40, s[3] + 46 + i * 40) }}>→</div>}
            </React.Fragment>
          ))}
        </div>
        <div style={{ position: "absolute", left: 90, top: 600, fontSize: 28, color: c.dim, opacity: ramp(f, s[3] + 120, s[3] + 140) }}>No inventory. No page scan.</div>
      </div>
      {/* D: the test */}
      <div style={{ position: "absolute", inset: 0, opacity: D }}>
        <div style={{ position: "absolute", left: 90, top: 200 }}>
          <Term text={T["08-resolveids"]} size={21} width={900} hot={["missing", "bogus"]} />
        </div>
        <div style={{ position: "absolute", left: 1040, top: 215, width: 790 }}>
          {[["10 of 10", "sampled IDs resolved to the expected name", c.green], ["1", "made-up ID reported missing", c.amber], ["identical", "Button read by ID = by name (0.9 s vs 1.4 s)", c.green]].map(([big, small, col], i) => (
            <div key={big} style={{ display: "flex", alignItems: "baseline", gap: 20, marginBottom: 22, opacity: ramp(f, s[5] + 12 + i * 30, s[5] + 28 + i * 30) }}>
              <span style={{ fontFamily: mono, fontSize: 44, fontWeight: 600, color: col, minWidth: 310 }}>{big}</span>
              <span style={{ fontSize: 26, color: c.dim, lineHeight: 1.3 }}>{small}</span>
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", left: 90, right: 90, top: 770, fontSize: 22, color: c.faint, lineHeight: 1.5, opacity: ramp(f, s[5] + 110, s[5] + 130) }}>
          IDs are stable inside one Figma file; a duplicated file gets new IDs, so the pointers are rebuilt (resolveIds shows it). An update still re-reads the foundation file (seconds): the IDs remove the component scan, not that read.
        </div>
      </div>
    </Scene>
  );
};
