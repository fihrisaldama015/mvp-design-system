import React from "react";
import { Composition, Series } from "remotion";
import { FPS, H, W } from "./theme";
import { SCENES } from "./scenes";
import { SceneShell, sceneFrames } from "./audio";
import { KineticContext } from "./timing";
import { Motion } from "./showcase/Motion";
import { SpringGrid } from "./showcase/SpringGrid";
import { KineticCompare } from "./showcase/KineticCompare";
import { Transitions, TRANSITIONS_FRAMES } from "./showcase/Transitions";
import { Three, THREE_FRAMES } from "./showcase/Three";
import { DemoScene, Music, demoFrames } from "./demo/shell";
import { Scene1 } from "./demo/scenes/Scene1";
import { Scene2 } from "./demo/scenes/Scene2";
import { Scene3 } from "./demo/scenes/Scene3";
import { PROPS_CLIP_FRAMES, PropsCard, PropsClip, defaultCardProps, propsSchema } from "./showcase/PropsCard";

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

// The demo video: a scene is { id, component }. The video plays them in order, with the music under all of them.
const DEMO: { id: string; Component: React.FC }[] = [
  { id: "scene1", Component: Scene1 },
  { id: "scene2", Component: Scene2 },
  { id: "scene3", Component: Scene3 },
];
const DEMO_FRAMES = DEMO.reduce((n, d) => n + demoFrames(d.id), 0);
const DemoVideo: React.FC = () => (
  <>
    <Series>
      {DEMO.map(({ id, Component }) => (
        <Series.Sequence key={id} durationInFrames={demoFrames(id)}>
          <DemoScene id={id}><Component /></DemoScene>
        </Series.Sequence>
      ))}
    </Series>
    <Music scenes={DEMO.map((d) => d.id)} />
  </>
);

export const Root: React.FC = () => (
  <>
    <Composition id="ShieldVideo" component={Full} durationInFrames={TOTAL} fps={FPS} width={W} height={H} />
    {/* The same video with kinetic captions (word by word). Needs `npm run words`; a scene without words keeps its plain captions. */}
    <Composition id="ShieldVideoKinetic" component={Full} defaultProps={{ kinetic: true }} durationInFrames={TOTAL} fps={FPS} width={W} height={H} />
    {/* Short clips for the tech-sharing slides (1280x720, muted). Render: see the README, "Showcase clips". */}
    <Composition id="DemoMotion" component={Motion} durationInFrames={180} fps={FPS} width={1280} height={720} />
    <Composition id="DemoSpring" component={SpringGrid} durationInFrames={220} fps={FPS} width={1280} height={720} />
    <Composition id="DemoTransitions" component={Transitions} durationInFrames={TRANSITIONS_FRAMES} fps={FPS} width={1280} height={720} />
    {/* DemoProps has a schema: open it in the Studio and edit the props in the side panel. DemoPropsClip is the slide's clip. */}
    <Composition id="DemoProps" component={PropsCard} schema={propsSchema} defaultProps={defaultCardProps} durationInFrames={90} fps={FPS} width={1280} height={720} />
    <Composition id="DemoPropsClip" component={PropsClip} durationInFrames={PROPS_CLIP_FRAMES} fps={FPS} width={1280} height={720} />
    <Composition id="DemoThree" component={Three} durationInFrames={THREE_FRAMES} fps={FPS} width={1280} height={720} />
    <Composition id="DemoVideo" component={DemoVideo} durationInFrames={DEMO_FRAMES} fps={FPS} width={1920} height={1080} />
    {DEMO.map(({ id, Component }) => {
      const One: React.FC = () => (<DemoScene id={id}><Component /></DemoScene>);
      return <Composition key={`demo-${id}`} id={`Demo-${id}`} component={One} durationInFrames={demoFrames(id)} fps={FPS} width={1920} height={1080} />;
    })}
    <Composition id="DemoKinetic" component={KineticCompare} durationInFrames={230} fps={FPS} width={1280} height={720} />
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
