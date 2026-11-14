import json, sys, subprocess, numpy as np
from faster_whisper import WhisperModel
def load(p):
    return np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',p,'-f','f32le','-ac','1','-ar','16000','-'],capture_output=True,check=True).stdout, np.float32)
R4 = "/tmp/claude-0/-home-claude/9795e62c-2b83-5ed5-9b9a-75716025bfc2/scratchpad/sk1113/r4/"
m = WhisperModel("small", device="cpu", compute_type="int8"); out = {}
for n in sys.argv[1:]:
    segs, _ = m.transcribe(load(f"{R4}out{n}/voice.wav"), language="ko", word_timestamps=True, beam_size=5)
    out[n] = [[w.word.strip(), round(w.start, 3), round(w.end, 3)] for s in segs for w in s.words]
    print(n, flush=True); json.dump(out, open("asr_r4.json", "w"), ensure_ascii=False)
