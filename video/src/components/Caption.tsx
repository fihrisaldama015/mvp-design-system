import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { c, inter } from "../theme";
import { useStarts } from "../timing";

/** Narration as captions: one sentence at a time, timed by length over the whole scene. */
export const Caption: React.FC<{ sentences: string[] }> = ({ sentences }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  if (!sentences.length) return null;
  const starts = useStarts(sentences);
  const idx = starts.reduce((acc, s, i) => (frame >= s ? i : acc), 0);
  const start = starts[idx];
  const end = idx + 1 < starts.length ? starts[idx + 1] : durationInFrames;
  const opacity = interpolate(frame, [start, start + 8, end - 8, end], [0, 1, 1, idx + 1 < starts.length ? 0 : 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (frame < starts[0]) return null;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", padding: 56, pointerEvents: "none" }}>
      <div style={{ maxWidth: 1560, textAlign: "center", fontFamily: inter, fontSize: 34, lineHeight: 1.35, fontWeight: 500, color: c.text, background: "rgba(13,16,23,0.82)", border: `1px solid ${c.line}`, borderRadius: 16, padding: "16px 30px", opacity }}>{sentences[idx]}</div>
    </AbsoluteFill>
  );
};
