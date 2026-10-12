import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { c, mono } from "../theme";
import { Scene, Term } from "../components/Frame";
import { T } from "../terminalText";
import { sentenceStarts } from "../timing";
import { ramp, window12 } from "../anim";

const NARRATION = [
  "A tiny local server on port 9232.",
  "The plugin posts big reads to it and they land as files, so they never pass through the AI's context.",
  "It also serves the plugin scripts.",
  "Plugin scripts used to be pasted into every call, about 4 KB each.",
  "Now the call fetches the script from the server and passes ARGS, the parameters. About 280 bytes.",
  "We read variables, scopes and styles from Figma ourselves and write them in the Tokens Brücke shape.",
  "Anything that already consumes a Brücke export keeps working, with nobody exporting anything.",
  "buildTokens turns that file into CSS variables, a Tailwind 3 theme and the typo-* text-style classes; buildTokenDocs writes the Foundations pages.",
  "Four more pieces round it out: inventory, the component analysis, initStorybook and checkConfig.",
];
// which sentence each piece starts at; the last entry is the "four more" strip
const GROUP_START = [0, 3, 5, 7, 8];

const TB = T["05-tokens-build"].split("\n");
type Piece = { name: string; tag: string; bullets: string[]; text: string; size?: number; hot?: string[] };
const PIECES: Piece[] = [
  { name: "dumpServer.py", tag: "local receiver · port 9232", bullets: ["POST /save → files land in .figma-dump/", "GET /script → serves the plugin scripts", "Big reads never enter the AI's context"], text: T["01-dumpserver"], size: 24, hot: ["listening on", "already in use"] },
  { name: "Loader + ARGS", tag: "plugin scripts, not pasted", bullets: ["Before: the script pasted into every call (about 4 KB)", "Now: fetch it, run it, pass ARGS (234–280 bytes)", "ARGS = which component, how deep"], text: T["02-loader"], size: 26, hot: ["234 bytes"] },
  { name: "toBruecke", tag: "Figma → Tokens Brücke shape", bullets: ["903 variables in 10 collections + styles", "Same shape a Brücke export has", "Existing consumers keep working"], text: ["$ node scripts/figma/toBruecke.mjs .figma-dump src/tokens/design_token.json", TB[1]].join("\n"), size: 28, hot: ["903 variables"] },
  { name: "buildTokens", tag: "tokens → CSS, Tailwind 3, Foundations", bullets: ["714 CSS variables, Dark as data-theme", "Tailwind 3 theme + 58 typo-* text styles", "buildTokenDocs writes 6 Foundations pages"], text: ["$ node scripts/figma/buildTokens.mjs && node scripts/figma/buildTokenDocs.mjs", ...TB.slice(2)].join("\n"), size: 26, hot: ["714 variables", "58 text styles"] },
];
const MORE: [string, string][] = [
  ["inventory", "every page and set in the file, saved to disk (106 pages, 219 sets in SHIELD)"],
  ["analyzeComponent · variantClasses", "what drives what, and the token class for every variant"],
  ["initStorybook", "detects the stack and adds only what is missing"],
  ["checkConfig", "maps each collection role to a real Figma collection"],
];

export const Scene3: React.FC = () => {
  const f = useCurrentFrame();
  const { durationInFrames: total } = useVideoConfig();
  const s = sentenceStarts(NARRATION, total);
  const at = GROUP_START.map((g) => s[g]);
  return (
    <Scene n={3} title="The pieces" narration={NARRATION}>
      {PIECES.map((p, i) => {
        const o = window12(f, at[i], at[i + 1]);
        return (
          <div key={p.name} style={{ position: "absolute", inset: 0, opacity: o, transform: `translateX(${(1 - o) * 30}px)` }}>
            <div style={{ position: "absolute", left: 90, top: 320, width: 620 }}>
              <div style={{ fontFamily: mono, fontSize: 54, fontWeight: 600, color: c.text }}>{p.name}</div>
              <div style={{ marginTop: 8, fontSize: 26, color: c.rose, fontWeight: 600 }}>{p.tag}</div>
              <ul style={{ marginTop: 34, paddingLeft: 28, fontSize: 28, lineHeight: 1.55, color: c.dim }}>
                {p.bullets.map((b) => <li key={b}>{b}</li>)}
              </ul>
            </div>
            <div style={{ position: "absolute", left: 760, top: 290, width: 1070 }}>
              <Term text={p.text} size={p.size} hot={p.hot} />
            </div>
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 110, right: 110, top: 230, opacity: window12(f, at[4], Infinity) }}>
        <div style={{ fontSize: 30, color: c.rose, fontWeight: 700, marginBottom: 22 }}>Four more pieces</div>
        {MORE.map(([t, d], i) => (
          <div key={t} style={{ display: "flex", gap: 24, alignItems: "baseline", padding: "20px 28px", marginBottom: 14, background: c.panel, border: `1px solid ${c.line}`, borderRadius: 16, opacity: ramp(f, at[4] + i * 20, at[4] + i * 20 + 14) }}>
            <span style={{ fontFamily: mono, fontSize: 30, color: c.text, minWidth: 520, fontWeight: 600 }}>{t}</span>
            <span style={{ fontSize: 26, color: c.dim }}>{d}</span>
          </div>
        ))}
      </div>
    </Scene>
  );
};
