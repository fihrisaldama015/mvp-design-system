import React from "react";
import { c, inter } from "../theme";
import { Caption } from "../components/Caption";
import { KineticContext, StartsContext, WordsContext, WordTiming } from "../timing";
import timing from "../audioTiming.json";
import wordTiming from "../wordTiming.json";
import narration from "../narration.json";
import { Stage } from "./Stage";
import { useCurrentFrame } from "remotion";

/** Showcase clip: the same narration as captions the old way (a sentence at a time) and the new way (word by word, the
 *  spoken word highlighted). Real timing from Scene 1 (the voice-over's word timestamps). The captions are the real
 *  components, drawn at 1920x380 and scaled down into each panel. */
const SENTENCES = (narration as Record<string, string[]>).scene1;
const STARTS = (timing as Record<string, { starts: number[] }>).scene1.starts;
const WORDS = (wordTiming as unknown as Record<string, WordTiming[]>).scene1;
const SCALE = 0.6;

const Panel: React.FC<{ label: string; note: string; kinetic: boolean; top: number; color: string }> = ({ label, note, kinetic, top, color }) => (
  <div style={{ position: "absolute", left: 60, top, width: 1160, height: 250, background: c.panel, border: `1px solid ${c.line}`, borderRadius: 20, overflow: "hidden" }}>
    <div style={{ position: "absolute", left: 28, top: 20, fontFamily: inter, fontSize: 24, fontWeight: 700, color }}>{label}</div>
    <div style={{ position: "absolute", left: 28 + 120, top: 25, fontFamily: inter, fontSize: 19, color: c.dim }}>{note}</div>
    <div style={{ position: "absolute", left: 4, top: 30, width: 1920, height: 380, transform: `scale(${SCALE})`, transformOrigin: "top left" }}>
      <KineticContext.Provider value={kinetic}>
        <Caption sentences={SENTENCES} />
      </KineticContext.Provider>
    </div>
  </div>
);

export const KineticCompare: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Stage title="Captions: sentence vs word" subtitle="Same voice, same timing. The word timestamps come from the transcript." at={frame}>
      <StartsContext.Provider value={STARTS}>
        <WordsContext.Provider value={WORDS}>
          <Panel label="Before" note="one sentence at a time" kinetic={false} top={152} color={c.dim} />
          <Panel label="After" note="each word pops in as it is spoken; the spoken word is highlighted" kinetic top={418} color={c.rose} />
        </WordsContext.Provider>
      </StartsContext.Provider>
    </Stage>
  );
};
