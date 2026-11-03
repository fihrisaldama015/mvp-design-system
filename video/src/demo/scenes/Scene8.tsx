import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { c, mono } from "../../theme";
import { useStarts } from "../../timing";
import { Three } from "../../showcase/Three";
import { Sfx, demoSentences } from "../shell";

/** Scene 8: real 3D. The lit objects and the orbiting camera of the 3D clip, with two labels that say what drives them. */
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const Scene8: React.FC = () => {
  const frame = useCurrentFrame();
  const s = useStarts(demoSentences("scene8"));
  const lights = interpolate(frame, [s[0] + 40, s[0] + 56], [0, 1], clamp);
  const driven = interpolate(frame, [s[1] + 4, s[1] + 20], [0, 1], clamp);
  const chip = (text: string, opacity: number) => (
    <div style={{ fontFamily: mono, fontSize: 21, color: c.text, background: c.panel, border: `1px solid ${c.line}`, borderRadius: 12, padding: "8px 18px", opacity }}>{text}</div>
  );
  return (
    <>
      <Three />
      <div style={{ position: "absolute", left: 110, top: 178, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 12 }}>
        {chip("ambientLight · directionalLight · pointLight", lights)}
        {chip("camera.position = f(frame)", driven)}
      </div>
      <Sfx name="whoosh" at={s[0] + 4} volume={0.4} />
      <Sfx name="pop" at={s[0] + 40} volume={0.4} />
      <Sfx name="pop" at={s[1] + 4} volume={0.45} />
    </>
  );
};
