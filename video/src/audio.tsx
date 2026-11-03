import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import timing from "./audioTiming.json";
import wordTiming from "./wordTiming.json";
import { StartsContext, WordsContext, WordTiming, sec } from "./timing";

type T = { audio: string; audioStart: number; durationFrames: number; starts: number[] };
const table = timing as Record<string, T>;
const wordTable = wordTiming as unknown as Record<string, WordTiming[]>;

/** Frames a scene lasts: the measured audio when there is one, else the planned seconds. */
export const sceneFrames = (id: string, seconds: number) => table[id.toLowerCase()]?.durationFrames ?? sec(seconds);

/** Gives a scene its measured sentence starts and plays its audio (src/audioTiming.json, written by `npm run align`). */
export const SceneShell: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => {
  const t = table[id];
  return (
    <StartsContext.Provider value={t?.starts ?? null}>
      <WordsContext.Provider value={wordTable[id] ?? null}>
      {children}
      </WordsContext.Provider>
      {t && (
        <Sequence from={t.audioStart}>
          <Audio src={staticFile(t.audio)} />
        </Sequence>
      )}
    </StartsContext.Provider>
  );
};
