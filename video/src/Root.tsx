import React from "react";
import { Composition, Series } from "remotion";
import { FPS, H, W } from "./theme";
import { sec } from "./timing";
import { SCENES, TOTAL_FRAMES } from "./scenes";

const Full: React.FC = () => (
  <Series>
    {SCENES.map(({ id, seconds, Component }) => (
      <Series.Sequence key={id} durationInFrames={sec(seconds)}>
        <Component />
      </Series.Sequence>
    ))}
  </Series>
);

export const Root: React.FC = () => (
  <>
    <Composition id="ShieldVideo" component={Full} durationInFrames={TOTAL_FRAMES} fps={FPS} width={W} height={H} />
    {SCENES.map(({ id, seconds, Component }) => (
      <Composition key={id} id={id} component={Component} durationInFrames={sec(seconds)} fps={FPS} width={W} height={H} />
    ))}
  </>
);
