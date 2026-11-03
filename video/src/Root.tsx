import React from "react";
import { Composition, Series } from "remotion";
import { FPS, H, W } from "./theme";
import { SCENES } from "./scenes";
import { SceneShell, sceneFrames } from "./audio";
import { KineticContext } from "./timing";

const TOTAL = SCENES.reduce((n, s) => n + sceneFrames(s.id, s.seconds), 0);

const Full: React.FC<{ kinetic?: boolean }> = ({ kinetic = false }) => (
  <KineticContext.Provider value={kinetic}>
  <Series>
    {SCENES.map(({ id, seconds, Component }) => (
      <Series.Sequence key={id} durationInFrames={sceneFrames(id, seconds)}>
        <SceneShell id={id.toLowerCase()}>
          <Component />
        </SceneShell>
      </Series.Sequence>
    ))}
  </Series>
  </KineticContext.Provider>
);

export const Root: React.FC = () => (
  <>
    <Composition id="ShieldVideo" component={Full} durationInFrames={TOTAL} fps={FPS} width={W} height={H} />
    {/* The same video with kinetic captions (word by word). Needs `npm run words`; a scene without words keeps its plain captions. */}
    <Composition id="ShieldVideoKinetic" component={Full} defaultProps={{ kinetic: true }} durationInFrames={TOTAL} fps={FPS} width={W} height={H} />
    {SCENES.map(({ id, seconds, Component }) => {
      const Alone: React.FC<{ kinetic?: boolean }> = ({ kinetic = false }) => (
        <KineticContext.Provider value={kinetic}>
          <SceneShell id={id.toLowerCase()}>
            <Component />
          </SceneShell>
        </KineticContext.Provider>
      );
      const frames = sceneFrames(id.toLowerCase(), seconds);
      return (
        <React.Fragment key={id}>
          <Composition id={id} component={Alone} durationInFrames={frames} fps={FPS} width={W} height={H} />
          <Composition id={`${id}Kinetic`} component={Alone} defaultProps={{ kinetic: true }} durationInFrames={frames} fps={FPS} width={W} height={H} />
        </React.Fragment>
      );
    })}
  </>
);
