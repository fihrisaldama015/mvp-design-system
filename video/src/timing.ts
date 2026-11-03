import React, { createContext, useContext } from "react";
import { useVideoConfig } from "remotion";
import { FPS } from "./theme";

export const sec = (s: number) => Math.round(s * FPS);

/** Start frame of each sentence when `sentences` are spread over `total` frames by length. */
export const sentenceStarts = (sentences: string[], total: number, lead = 15, tail = 20) => {
  const span = total - lead - tail;
  const weights = sentences.map((s) => s.length + 12);
  const sum = weights.reduce((a, b) => a + b, 0);
  let at = lead;
  return sentences.map((_, i) => {
    const start = Math.round(at);
    at += (weights[i] / sum) * span;
    return start;
  });
};

/** "A. B. C" -> ["A.", "B.", "C"] (splits after . ? ! followed by a space). */
export const splitSentences = (text: string) => text.split(/(?<=[.?!])\s+(?=[A-Z"])/).map((s) => s.trim()).filter(Boolean);

/** Sentence start frames measured from the audio (src/audioTiming.json), provided per scene by SceneShell. */
export const StartsContext = createContext<number[] | null>(null);

/** Start frame of each narration sentence: measured from the audio when it exists, else spread by length. */
export const useStarts = (sentences: string[]) => {
  const { durationInFrames } = useVideoConfig();
  const measured = useContext(StartsContext);
  return measured && measured.length === sentences.length ? measured : sentenceStarts(sentences, durationInFrames);
};

/** [word, start frame, end frame] of every spoken word of a scene (src/wordTiming.json), provided per scene by SceneShell. */
export type WordTiming = [string, number, number];
export const WordsContext = createContext<WordTiming[] | null>(null);
/** True when the captions should be kinetic (word by word). Set by the root from the composition's `kinetic` prop. */
export const KineticContext = createContext<boolean>(false);

/** The start frame of each token of `sentence`: the narration tokens are matched to the spoken words that fall in
 *  [from, to). When the counts match it is one to one; otherwise the tokens spread over the spoken words in order.
 *  Returns null when no word was spoken in that window (the caption then shows the whole sentence at once). */
export const tokenStarts = (sentence: string, words: WordTiming[], from: number, to: number): { tokens: string[]; starts: number[]; ends: number[] } | null => {
  const tokens = sentence.split(/\s+/).filter(Boolean);
  const spoken = words.filter(([, s]) => s >= from && s < to);
  if (!tokens.length || !spoken.length) return null;
  const pick = (j: number) => spoken[Math.min(spoken.length - 1, tokens.length === 1 ? 0 : Math.round((j * (spoken.length - 1)) / (tokens.length - 1)))];
  return { tokens, starts: tokens.map((_, j) => pick(j)[1]), ends: tokens.map((_, j) => pick(j)[2]) };
};
