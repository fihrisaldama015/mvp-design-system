import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";
import { useStarts } from "../../timing";
import { Motion } from "../../showcase/Motion";
import { SpringGrid } from "../../showcase/SpringGrid";
import { Sfx, demoSentences } from "../shell";

/** Scene 3: the motion clip (three curves) while the voice goes through them, then the four spring settings. The pop sounds
 *  fall on the real overshoot of the springs: frame 19 of the lane cycle, frame 15 of the grid cycle. */
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const MOTION_CYCLE = 90;
const POP_IN_CYCLE = 19;

export const Scene3: React.FC = () => {
  const frame = useCurrentFrame();
  const s = useStarts(demoSentences("scene3"));
  const swap = s[4] - 10;
  const fadeOut = interpolate(frame, [swap, swap + 12], [1, 0], clamp);
  const fadeIn = interpolate(frame, [swap, swap + 12], [0, 1], clamp);
  const motionPops: number[] = [];
  for (let k = 0; POP_IN_CYCLE + k * MOTION_CYCLE < swap; k += 1) {
    const at = POP_IN_CYCLE + k * MOTION_CYCLE;
    if (at >= s[3] - 4) motionPops.push(at);
  }
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: fadeOut }}><Motion /></AbsoluteFill>
      <Sequence from={swap}>
        <AbsoluteFill style={{ opacity: fadeIn }}><SpringGrid /></AbsoluteFill>
      </Sequence>
      <Sfx name="whoosh" at={swap - 6} volume={0.5} />
      {motionPops.map((at) => <Sfx key={at} name="pop" at={at} volume={0.5} />)}
      <Sfx name="pop" at={swap + 15} volume={0.55} />
    </AbsoluteFill>
  );
};
