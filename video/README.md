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
3. Find where each sentence starts. Two ways:
   - `npm run align` alone: finds the pauses in the audio (ffmpeg) and picks the ones that fit the sentences. Quick, but TTS
     pauses at commas and colons as long as between sentences, so it can pick a pause inside a sentence. Not reliable.
   - Precise (recommended): once, `python3 -m venv .venv && .venv/bin/pip install faster-whisper`; then
     `npm run transcribe` (word timestamps, about 30 s for all scenes) and `npm run align`. The transcript is aligned to
     the narration text and each sentence start is snapped to the pause just before it. Checked on the real TTS audio:
     every boundary landed on a 0.5 to 0.8 s pause.
   `align` writes `src/audioTiming.json`: the scene lasts as long as its audio (plus a short lead and tail), and every
   caption and animation that keys off a sentence starts when that sentence is spoken. It prints each start time and marks
   a scene `CHECK` when it is not sure.
4. `npm run studio` or `npm run render`. A scene without audio keeps its planned length and the length-based timing.

Audio files and `src/audioTiming.json` are specific to one recording: they are not committed unless you decide to.

Re-run `npm run align` after replacing any audio file. To go back to the silent version, empty
`src/audioTiming.json` (`{}`) and the scenes return to their planned timing.
