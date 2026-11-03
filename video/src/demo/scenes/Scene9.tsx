import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { c, mono } from "../../theme";
import { useStarts } from "../../timing";
import { Stage } from "../../showcase/Stage";
import { Sfx, demoSentences } from "../shell";

/** Scene 9: motion blur. The same fast animation twice: plain, and inside <CameraMotionBlur> (the scene is drawn several times
 *  inside each frame, a little apart in time, and the copies are blended). The shutter angle then opens up to 360. */
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const W = 560;
const H = 300;

const Mover: React.FC = () => {
  const frame = useCurrentFrame();
  const x = 30 + (W - 130) * (0.5 + 0.5 * Math.sin(frame / 5.5));
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: x, top: 60, width: 70, height: 70, borderRadius: 18, background: c.rose }} />
      <div style={{ position: "absolute", left: W / 2 - 4, top: 168, width: 8, height: 110, marginTop: 0, background: c.amber, borderRadius: 4, transformOrigin: "50% 100%", transform: `rotate(${frame * 18}deg)` }} />
    </div>
  );
};

const Panel: React.FC<{ left: number; label: string; note: string; children: React.ReactNode }> = ({ left, label, note, children }) => (
  <div style={{ position: "absolute", left, top: 150, width: W, height: H + 70, background: c.panel, border: `1px solid ${c.line}`, borderRadius: 18, overflow: "hidden" }}>
    <div style={{ position: "absolute", left: 22, top: 14, fontFamily: mono, fontSize: 20, color: c.text }}>{label}</div>
    <div style={{ position: "absolute", left: 22, top: 40, fontFamily: mono, fontSize: 16, color: c.faint }}>{note}</div>
    <div style={{ position: "absolute", left: 0, top: 70, width: W, height: H }}>{children}</div>
  </div>
);

export const Scene9: React.FC = () => {
  const frame = useCurrentFrame();
  const s = useStarts(demoSentences("scene9"));
  const angle = interpolate(frame, [s[1] + 20, s[1] + 70], [180, 360], clamp);
  const open = Math.round(angle);
  return (
    <Stage title="Motion blur" subtitle="Fast moves read smoother when each frame holds a little of the time around it." at={frame}>
      <Panel left={60} label="plain" note="one picture per frame">
        <Mover />
      </Panel>
      <Panel left={660} label="<CameraMotionBlur>" note={`samples 10 · shutterAngle ${open}°`}>
        <CameraMotionBlur samples={10} shutterAngle={open}>
          <Mover />
        </CameraMotionBlur>
      </Panel>
      <Sfx name="whoosh" at={s[0] + 6} volume={0.4} />
      <Sfx name="pop" at={s[1] + 6} volume={0.4} />
    </Stage>
  );
};
