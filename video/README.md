# Video (Remotion)

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

## Kinetic captions (word by word)

The captions normally show one sentence at a time. The kinetic version pops each word in the moment it is spoken and
highlights the word being spoken. It uses the word timestamps of the transcript, so it needs the precise setup above.

1. `npm run transcribe`, then `npm run align` (as in the voice-over steps).
2. `npm run words`: turns `.align/words.json` (seconds) and `src/audioTiming.json` (where each audio starts) into
   `src/wordTiming.json` (word, start frame, end frame). Re-run it after `align`.
3. Preview or render the kinetic version: the compositions `ShieldVideoKinetic` and `Scene1Kinetic` ... `Scene10Kinetic`
   (`npx remotion render src/index.ts ShieldVideoKinetic out/shield-kinetic.mp4`). The plain compositions are unchanged.

A scene without words (no audio, or not in `wordTiming.json`) keeps its plain captions. The numbers to tune by hand are
in `KINETIC` at the top of `src/components/KineticCaption.tsx`: how far a word rises, its start scale, the spring
(`damping` = bounce, `stiffness` = speed), the fade and the highlight colour.


## Showcase clips (tech-sharing slides)

Short muted clips for the slides, 1280x720. They need no audio and are tiny (about 100 kB):

```bash
r() { npx remotion render src/index.ts "$@"; }
r DemoMotion out/clips/motion.mp4 --codec=h264 --crf=26 --muted      # one move, three curves, trails and charts
r DemoSpring out/clips/spring.mp4 --codec=h264 --crf=26 --muted      # four spring() settings with their response charts
r DemoKinetic out/clips/kinetic.mp4 --codec=h264 --crf=26 --muted   # captions: sentence vs word (needs npm run words)
r DemoTransitions out/clips/transitions.mp4 --codec=h264 --crf=26 --muted   # TransitionSeries: fade, slide, wipe, flip
r DemoPropsClip out/clips/props.mp4 --codec=h264 --crf=26 --muted   # one composition, three prop sets
```

The compositions live in `src/showcase/` and are registered in `src/Root.tsx`. Browsers only autoplay a video that is muted,
so a slide uses `<video autoplay muted loop playsinline>`.

`DemoProps` is the same card with a zod schema: open it in `npm run studio` and edit `title`, `accent`, `damping` and
`stiffness` in the Props panel on the right. Keep every `remotion` and `@remotion/*` package on the same exact version
(no `^`); Remotion 4.0.535 asks for `zod` 4.5.4 (`npx remotion versions` says when something is off).

## The demo video (a video about making videos)

Script: `src/demo/narration.json` (8 scenes, about 310 words, about 3 minutes). Order of work, so it is rendered once:

1. `npm run narration:demo` writes `narration/demo/sceneN.txt` (one sentence per line) for the TTS.
2. Generate one voice file per scene (the whole scene in one file, the pause after each sentence kept) and save it as
   `public/audio/demo/scene1.wav` ... `scene8.wav`.
3. `npm run sfx` makes the sound effects (`public/audio/demo/sfx/`) and the music bed (`public/audio/demo/music.mp3`)
   with ffmpeg alone, nothing downloaded: two versions of a bright C major bed (`music.mp3` with a light beat, `music-soft.mp3`
   without drums); pick one with `MUSIC_FILE` in `src/demo/shell.tsx`. Open `out/sfx/audition.html` to listen.
4. Transcribe, align and make the word timings for the demo set (the same scripts, with `demo` first), then render once:
   `.venv/bin/python scripts/transcribe.py demo && node scripts/align.mjs demo && node scripts/words.mjs demo`
   (writes `src/demo/audioTiming.json` and `src/demo/wordTiming.json`).
