import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile } from "remotion";
import timing from "./audioTiming.json";
import wordTiming from "./wordTiming.json";
import narration from "./narration.json";
import { c } from "../theme";
import { KineticCaption } from "../components/KineticCaption";
import { BareContext } from "../showcase/Stage";
import { KineticContext, StartsContext, WordTiming, WordsContext } from "../timing";

/** What every scene of the demo video shares: the voice (from the measured timing), the kinetic captions, the background,
 *  and a 1280x720 drawing area scaled up to 1664x936 so the clips of the slides can be reused as they are. */
type T = { audio: string; audioStart: number; durationFrames: number; starts: number[] };
const table = timing as Record<string, T>;
const wordTable = wordTiming as unknown as Record<string, WordTiming[]>;
const text = narration as Record<string, string[]>;

export const FPS = 30;
export const TAIL = 36; // frames after the voice ends (set by scripts/align.mjs)
export const SCALE = 1.3;
export const sceneOrder = Object.keys(text);
export const demoFrames = (id: string) => table[id].durationFrames;
export const demoSentences = (id: string) => text[id];
export const sceneTiming = (id: string) => table[id];
export const DEMO_TOTAL = sceneOrder.reduce((n, id) => n + (table[id]?.durationFrames ?? 0), 0);

/** The frame (inside the scene) at which the first spoken word that matches `re` starts, or `fallback`. */
export const wordFrame = (id: string, re: RegExp, fallback = 0) => wordTable[id]?.find(([w]) => re.test(w))?.[1] ?? fallback;

export const Backdrop: React.FC = () => (
  <AbsoluteFill
    style={{
      background: c.bg,
      backgroundImage: "radial-gradient(circle at 15% 0%, rgba(251,113,133,0.13), transparent 52%), linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
      backgroundSize: "100% 100%, 52px 52px, 52px 52px",
    }}
  />
);

export const DemoScene: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => {
  const t = table[id];
  return (
    <StartsContext.Provider value={t.starts}>
      <WordsContext.Provider value={wordTable[id] ?? null}>
        <KineticContext.Provider value>
          <BareContext.Provider value>
            <Backdrop />
            <div style={{ position: "absolute", left: (1920 - 1280 * SCALE) / 2, top: 0, width: 1280, height: 720, transform: `scale(${SCALE})`, transformOrigin: "top left" }}>{children}</div>
            <KineticCaption sentences={text[id]} />
            <Sequence from={t.audioStart}>
              <Audio src={staticFile(t.audio)} />
            </Sequence>
          </BareContext.Provider>
        </KineticContext.Provider>
      </WordsContext.Provider>
    </StartsContext.Provider>
  );
};

/** A sound effect that starts at frame `at` of the scene. The files come from `npm run sfx`. */
export const Sfx: React.FC<{ name: string; at: number; volume?: number }> = ({ name, at, volume = 0.6 }) => (
  <Sequence from={at} layout="none">
    <Audio src={staticFile(`audio/demo/sfx/${name}.wav`)} volume={volume} />
  </Sequence>
);

/** The music bed under the whole video. It sits low while someone speaks and comes up in the gaps (between scenes, at the
 *  start and at the end): a volume curve per frame, `volumes` of the voice measured from the same timing as the captions. */
export const Music: React.FC<{ scenes: string[] }> = ({ scenes }) => {
  let at = 0;
  const voice: [number, number][] = scenes.map((id) => {
    const t = table[id];
    const span: [number, number] = [at + t.audioStart, at + t.durationFrames - TAIL];
    at += t.durationFrames;
    return span;
  });
  const total = at;
  const volume = (f: number) => {
    let v = 0.75; // in the gaps
    for (const [a, b] of voice) v = Math.min(v, interpolate(f, [a - 12, a + 6, b - 6, b + 18], [0.75, 0.2, 0.2, 0.75], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
    return v * interpolate(f, [0, 45, total - 120, total], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  };
  return <Audio src={staticFile("audio/demo/music.mp3")} volume={volume} />;
};
