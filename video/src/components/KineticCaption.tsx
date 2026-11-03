import React, { useContext } from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { c, inter } from "../theme";
import { WordsContext, tokenStarts, useStarts } from "../timing";

/** The numbers to tune by hand. Everything about the motion of a word is here. */
export const KINETIC = {
  rise: 16, // px a word travels up while it appears
  fromScale: 0.86, // a word starts a little smaller
  spring: { damping: 14, stiffness: 190, mass: 0.6 }, // lower damping = more bounce; higher stiffness = faster
  fadeFrames: 5, // frames to go from invisible to visible
  hold: 8, // frames the sentence fades out at its end
  activeColor: c.rose, // the word being spoken
};

/** Narration as kinetic captions: one sentence at a time, each word pops in the moment it is spoken and the word being
 *  spoken is highlighted. Needs the word timings (npm run words); without them it shows the sentence at once. */
export const KineticCaption: React.FC<{ sentences: string[] }> = ({ sentences }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const words = useContext(WordsContext);
  const starts = useStarts(sentences);
  if (!sentences.length || frame < starts[0]) return null;
  const idx = starts.reduce((acc, s, i) => (frame >= s ? i : acc), 0);
  const last = idx + 1 >= starts.length;
  const from = starts[idx];
  const to = last ? durationInFrames : starts[idx + 1];
  const t = words ? tokenStarts(sentences[idx], words, from, to) : null;
  const fade = interpolate(frame, [from, from + 6, to - KINETIC.hold, to], [0, 1, 1, last ? 1 : 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", padding: 56, pointerEvents: "none" }}>
      <div style={{ maxWidth: 1560, textAlign: "center", fontFamily: inter, fontSize: 38, lineHeight: 1.4, fontWeight: 600, color: c.text, background: "rgba(13,16,23,0.82)", border: `1px solid ${c.line}`, borderRadius: 16, padding: "16px 30px", opacity: fade }}>
        {t
          ? t.tokens.map((token, j) => {
              const p = spring({ frame: frame - t.starts[j], fps, config: KINETIC.spring });
              const shown = interpolate(frame, [t.starts[j], t.starts[j] + KINETIC.fadeFrames], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              const speaking = frame >= t.starts[j] && frame < t.ends[j];
              return (
                <span key={j} style={{ display: "inline-block", marginRight: "0.3em", opacity: shown, transform: `translateY(${(1 - p) * KINETIC.rise}px) scale(${KINETIC.fromScale + (1 - KINETIC.fromScale) * p})`, color: speaking ? KINETIC.activeColor : c.text }}>
                  {token}
                </span>
              );
            })
          : sentences[idx]}
      </div>
    </AbsoluteFill>
  );
};
