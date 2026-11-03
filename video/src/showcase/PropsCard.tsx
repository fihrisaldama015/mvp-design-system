import React from "react";
import { AbsoluteFill, Series, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";
import { c, inter, mono } from "../theme";
import { Stage } from "./Stage";

/** Showcase clips: a composition whose look is decided by its props. `propsSchema` makes the Studio show a panel to edit
 *  them (sliders, a colour picker, a text field) without touching the code; the same props are what `--props` and
 *  `calculateMetadata` feed when you render from a script or data. */
export const propsSchema = z.object({
  title: z.string(),
  accent: zColor(),
  damping: z.number().min(1).max(40),
  stiffness: z.number().min(20).max(300),
});
export type CardProps = z.infer<typeof propsSchema>;

export const defaultCardProps: CardProps = { title: "Design review", accent: "#fb7185", damping: 10, stiffness: 120 };

const Json: React.FC<{ props: CardProps }> = ({ props }) => (
  <div style={{ position: "absolute", left: 60, top: 170, width: 480, height: 420, background: c.panel, border: `1px solid ${c.line}`, borderRadius: 20, padding: "26px 30px", fontFamily: mono, fontSize: 24, lineHeight: 1.7, color: c.dim }}>
    <div style={{ color: c.faint, marginBottom: 6 }}>props</div>
    <div>{"{"}</div>
    <div style={{ paddingLeft: 24 }}>
      title: <span style={{ color: c.green }}>"{props.title}"</span>,<br />
      accent: <span style={{ color: props.accent }}>"{props.accent}"</span>,<br />
      damping: <span style={{ color: c.amber }}>{props.damping}</span>,<br />
      stiffness: <span style={{ color: c.amber }}>{props.stiffness}</span>
    </div>
    <div>{"}"}</div>
  </div>
);

const Result: React.FC<{ props: CardProps }> = ({ props }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - 6, fps, config: { damping: props.damping, stiffness: props.stiffness } });
  const q = spring({ frame: frame - 16, fps, config: { damping: props.damping, stiffness: props.stiffness } });
  return (
    <div style={{ position: "absolute", left: 600, top: 170, width: 620, height: 420, background: c.panel2, border: `1px solid ${c.line}`, borderRadius: 20, overflow: "hidden", fontFamily: inter }}>
      <div style={{ position: "absolute", left: 40, top: 76, fontSize: 54, fontWeight: 700, whiteSpace: "nowrap", color: c.text, transform: `translateY(${(1 - p) * 90}px)`, opacity: Math.min(1, p * 2) }}>{props.title}</div>
      <div style={{ position: "absolute", left: 40, top: 160, height: 10, borderRadius: 5, background: props.accent, width: 440 * q }} />
      <div style={{ position: "absolute", left: 40, top: 200, fontSize: 22, color: c.dim }}>the same component, other props</div>
      <div style={{ position: "absolute", left: 40, top: 290, width: 70, height: 70, borderRadius: 18, background: props.accent, transform: `translateX(${480 * q}px)`, boxShadow: `0 0 30px ${props.accent}66` }} />
    </div>
  );
};

/** One card with the props it gets. Registered in Root with the schema, so the Studio shows the props panel. */
export const PropsCard: React.FC<CardProps> = (props) => {
  const frame = useCurrentFrame();
  return (
    <Stage title="Props: one composition, many videos" subtitle="Edit the props in the Studio, or pass --props when you render." at={frame}>
      <Json props={props} />
      <Result props={props} />
    </Stage>
  );
};

const VARIANTS: CardProps[] = [
  defaultCardProps,
  { title: "Release notes", accent: "#60a5fa", damping: 30, stiffness: 220 },
  { title: "Weekly summary", accent: "#4ade80", damping: 5, stiffness: 70 },
];
export const VARIANT_FRAMES = 75;

/** The clip for the slide: the same card with three prop sets, one after the other. */
export const PropsClip: React.FC = () => (
  <AbsoluteFill>
    <Series>
      {VARIANTS.map((v, i) => (
        <Series.Sequence key={i} durationInFrames={VARIANT_FRAMES}>
          <PropsCard {...v} />
        </Series.Sequence>
      ))}
    </Series>
  </AbsoluteFill>
);
export const PROPS_CLIP_FRAMES = VARIANTS.length * VARIANT_FRAMES;
