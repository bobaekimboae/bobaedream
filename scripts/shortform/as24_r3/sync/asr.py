import json, sys, subprocess, numpy as np
def load(p):
    b=subprocess.run(['ffmpeg','-v','error','-i',p,'-f','f32le','-ac','1','-ar','16000','-'],capture_output=True,check=True).stdout
    return np.frombuffer(b,np.float32)
from faster_whisper import WhisperModel
R3 = "/tmp/claude-0/-home-claude/9795e62c-2b83-5ed5-9b9a-75716025bfc2/scratchpad/sk1113/r3/"
m = WhisperModel("small", device="cpu", compute_type="int8")
out = {}
for n in sys.argv[1:]:
    for tag, path in (("tl", f"{R3}out{n}/voice.wav"), ("src", f"{R3}v{n}.mp3")):
        segs, _ = m.transcribe(load(path), language="ko", word_timestamps=True, vad_filter=False, beam_size=5)
        out[f"{n}_{tag}"] = [[w.word.strip(), round(w.start, 3), round(w.end, 3)] for s in segs for w in s.words]
        print(n, tag, len(out[f"{n}_{tag}"]), flush=True)
    json.dump(out, open("asr.json", "w"), ensure_ascii=False)
