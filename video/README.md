# PM video (Remotion)

```bash
npm install
npm run studio          # preview in the Remotion studio (copies the assets first)
npm run render          # out/shield-video.mp4
```

Scenes live in `src/scenes/`, in the order and with the planned length of `src/scenes/index.ts`
(follows `../docs/shield/video-script.md`). The narration text for captions and for the voice is one file:
`src/narration.json`.

## Voice-over: audio first, the video follows

The TTS gets words and punctuation only, no timestamps, so the video is timed from the audio, not the other way round.

1. `npm run narration` writes `narration/scene1.txt` ... (one sentence per line) and `narration/ALL.txt`.
2. Generate one audio file per scene from `narration/sceneN.txt` and save it as `public/audio/sceneN.mp3`
   (`.wav`, `.m4a`, `.ogg` also work). Scene 7 has no narration. Tips:
   - keep each sentence's full stop: the pause after it is what marks the sentence;
   - generate the whole scene in one file (a pause between sentences is enough, no marker needed);
   - the TTS may mispronounce names (Brücke, ARGS, MCP, rsbuild): respell them for the TTS only
     (for example "Bruecke"). Keep the same number of sentences, since the captions use the original text.
3. `npm run align` measures each file and writes `src/audioTiming.json`: the scene lasts as long as its audio
   (plus a short lead and tail), and every caption and animation that keys off a sentence starts when that
   sentence is spoken. It prints each sentence's start time and marks a scene `CHECK` when the pauses do not
   match the sentences well.
4. `npm run studio` or `npm run render`. A scene without audio keeps its planned length and the length-based timing.

Re-run `npm run align` after replacing any audio file. To go back to the silent version, empty
`src/audioTiming.json` (`{}`) and the scenes return to their planned timing.
