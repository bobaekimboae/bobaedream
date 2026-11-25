# T8 2단계: Qwen3-TTS 0.6B CustomVoice로 같은 5문장 생성 (로컬·무료). 블라인드 청취용
import json, time, torch, soundfile as sf
from qwen_tts import Qwen3TTSModel
S = {s['id']: s for s in json.load(open('/home/claude/work/al/docs/shortform/oss_test1_aligner/sentences20.json'))}
IDS = ['s15_hwan_huracan', 's16_hwan_huracan', 's17_hwan_huracan', 's18_hwan_huracan', 's20_hwan_huracan']
torch.set_num_threads(2)
m = Qwen3TTSModel.from_pretrained('Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice', device_map='cpu', dtype=torch.float32)
print('speakers', m.get_supported_speakers())
log = []
for spk in ['Sohee', 'Ryan']:
    for sid in IDS:
        t = time.time(); w, sr = m.generate_custom_voice(text=S[sid]['text'], language='Korean', speaker=spk)
        dt = time.time() - t; dur = len(w[0]) / sr
        sf.write(f'/home/claude/work/t8/out/{sid}_{spk}.wav', w[0], sr)
        log.append(dict(sid=sid, spk=spk, sec=round(dt, 1), audio=round(dur, 2), rtf=round(dt / dur, 2))); print(log[-1], flush=True)
json.dump(log, open('/home/claude/work/t8/out/gen_log.json', 'w'), ensure_ascii=False, indent=1)
