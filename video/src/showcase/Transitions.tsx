import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { flip } from "@remotion/transitions/flip";
import { c, inter, mono } from "../theme";
import { ramp } from "../anim";
import { Stage } from "./Stage";

/** Showcase clip: <TransitionSeries> between five cards, four different transitions. A scene lasts 60 frames and each
 *  transition overlaps 20, so scene i starts at frame 40 * i and the transition after it runs from 40 * i + 40. */
const D = 60;
const T = 20;
const CARDS = [
  { letter: "A", title: "Tokens", color: "#3b82f6" },
  { letter: "B", title: "Components", color: "#f59e0b" },
  { letter: "C", title: "Storybook", color: "#10b981" },
  { letter: "D", title: "Pages", color: "#e11d48" },
  { letter: "E", title: "Review", color: "#8b5cf6" },
];
const NAMES = ["fade()", "slide()", "wipe()", "flip()"];

// Left-aligned, so two cards crossfading read as two titles replacing each other instead of a pile of centred letters.
const Card: React.FC<{ letter: string; title: string; color: string }> = ({ letter, title, color }) => (
  <AbsoluteFill style={{ background: `linear-gradient(135deg, ${color}, ${color}aa)`, justifyContent: "flex-end", padding: 48, fontFamily: inter, color: "#fff" }}>
    <div style={{ position: "absolute", left: 48, top: 40, width: 76, height: 76, borderRadius: 20, background: "rgba(255,255,255,0.22)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, fontWeight: 800 }}>{letter}</div>
    <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05 }}>{title}</div>
  </AbsoluteFill>
);

export const Transitions: React.FC = () => {
  const frame = useCurrentFrame();
  const transitions = [
    <TransitionSeries.Transition key="t0" presentation={fade()} timing={linearTiming({ durationInFrames: T })} />,
    <TransitionSeries.Transition key="t1" presentation={slide()} timing={linearTiming({ durationInFrames: T })} />,
    <TransitionSeries.Transition key="t2" presentation={wipe()} timing={linearTiming({ durationInFrames: T })} />,
    <TransitionSeries.Transition key="t3" presentation={flip()} timing={linearTiming({ durationInFrames: T })} />,
  ];
  const items: React.ReactElement[] = [];
  CARDS.forEach((card, i) => {
    items.push(
      <TransitionSeries.Sequence key={`s${i}`} durationInFrames={D}>
        <Card {...card} />
      </TransitionSeries.Sequence>,
    );
    if (i < transitions.length) items.push(transitions[i]);
  });
  // The chip names the transition while it runs (and a little before and after, so it can be read).
  const active = NAMES.findIndex((_, i) => frame >= 40 * i + 34 && frame < 40 * i + 70);
  const show = active >= 0 ? ramp(frame, 40 * active + 34, 40 * active + 42) * (1 - ramp(frame, 40 * active + 62, 40 * active + 70)) : 0;
  return (
    <Stage title="Between scenes: <TransitionSeries>" subtitle="Scenes overlap for 20 frames; the presentation decides how one replaces the other." at={frame}>
      <div style={{ position: "absolute", left: 90, top: 160, width: 1100, height: 360, borderRadius: 22, overflow: "hidden", border: "1px solid rgba(255,255,255,0.12)", background: c.panel }}>
        <TransitionSeries>{items}</TransitionSeries>
      </div>
      <div style={{ position: "absolute", left: 90, right: 90, top: 556, textAlign: "center", fontFamily: mono, fontSize: 28, color: c.text, opacity: show }}>
        presentation={"{"}<span style={{ color: c.rose, fontWeight: 600 }}>{NAMES[Math.max(0, active)]}</span>{"}"}
      </div>
    </Stage>
  );
};
export const TRANSITIONS_FRAMES = CARDS.length * D - (CARDS.length - 1) * T;
