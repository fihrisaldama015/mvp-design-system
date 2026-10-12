import React from "react";
import { Composition, Series } from "remotion";
import { FPS, H, W } from "./theme";
import { SCENES } from "./scenes";
import { SceneShell, sceneFrames } from "./audio";

const TOTAL = SCENES.reduce((n, s) => n + sceneFrames(s.id, s.seconds), 0);

const Full: React.FC = () => (
  <Series>
    {SCENES.map(({ id, seconds, Component }) => (
      <Series.Sequence key={id} durationInFrames={sceneFrames(id, seconds)}>
        <SceneShell id={id.toLowerCase()}>
          <Component />
        </SceneShell>
      </Series.Sequence>
    ))}
  </Series>
);

export const Root: React.FC = () => (
  <>
    <Composition id="ShieldVideo" component={Full} durationInFrames={TOTAL} fps={FPS} width={W} height={H} />
    {SCENES.map(({ id, seconds, Component }) => {
      const Alone: React.FC = () => (
        <SceneShell id={id.toLowerCase()}>
          <Component />
        </SceneShell>
      );
      return <Composition key={id} id={id} component={Alone} durationInFrames={sceneFrames(id.toLowerCase(), seconds)} fps={FPS} width={W} height={H} />;
    })}
  </>
);
