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
