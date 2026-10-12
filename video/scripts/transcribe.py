# Optional, makes `npm run align` precise: transcribe each scene's audio with word timestamps
# (faster-whisper, small.en model) and write .align/words.json. align.mjs then finds each sentence
# start by aligning the transcript to the narration text, and snaps it to the pause just before the word.
#
# Setup once:   python3 -m venv .venv && .venv/bin/pip install faster-whisper
# Run:          .venv/bin/python scripts/transcribe.py [scene3 scene5 ...]
import json, os, re, subprocess, sys
import numpy as np
from faster_whisper import WhisperModel

MODEL = os.environ.get("WHISPER_MODEL", "small.en")
audio_dir = "public/audio"
only = sys.argv[1:]
files = sorted(f for f in os.listdir(audio_dir) if re.match(r"^scene\d+\.(mp3|wav|m4a|ogg)$", f, re.I)) if os.path.isdir(audio_dir) else []
os.makedirs(".align", exist_ok=True)
out = json.load(open(".align/words.json")) if os.path.exists(".align/words.json") else {}
model = WhisperModel(MODEL, device="cpu", compute_type="int8")
for f in files:
    sc = re.sub(r"\.\w+$", "", f).lower()
    if only and sc not in only:
        continue
    # decode through ffmpeg ourselves: no dependency on the PyAV version
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", f"{audio_dir}/{f}", "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True).stdout
    segs, _ = model.transcribe(np.frombuffer(raw, dtype=np.float32), word_timestamps=True, language="en", beam_size=5, condition_on_previous_text=False)
    out[sc] = [[w.word.strip(), round(w.start, 2), round(w.end, 2)] for s in segs for w in s.words]
    print(f"{sc}: {len(out[sc])} words")
json.dump(out, open(".align/words.json", "w"))
print(".align/words.json written. Now: npm run align")
