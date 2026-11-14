"""6회차: 최종 음성에서 문장마다 따로 받아쓰기(문장 글자를 힌트로)해 어절 시각을 다시 잡는다.
받아쓰기가 첫 낱말(가격은·보배드림 등)을 놓쳐 다음 낱말 시각이 앞 낱말에 붙던 문제를 고친다.
첫 어절 = 소리 시작(에너지), 못 맞춘 어절 = 앞뒤 맞춘 어절 사이를 글자 수로 나눔. 결과는 사양서 sentences[].w 에 원본 음성 기준 초로 쓴다."""
import json, re, sys, subprocess, difflib, numpy as np
from faster_whisper import WhisperModel
R = sys.argv[1]; NS = sys.argv[2:] or ['01','03','05','06','09','12','14','16','18','19']
def norm(s): return re.sub(r"[^0-9A-Za-z가-힣]", "", s).lower()
def load(p):
    return np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',p,'-f','f32le','-ac','1','-ar','16000','-'],capture_output=True,check=True).stdout, np.float32)
M = WhisperModel("small", device="cpu", compute_type="int8")
for n in NS:
    man = json.load(open(f"{R}/out{n}/manifest.json")); sp = json.load(open(f"{R}/spec{n}.json"))
    x = load(f"{R}/out{n}/voice.wav"); rep = []
    for k, (a, b, s0, s1, disp, tp) in enumerate(man["clips"]):
        words = " ".join(disp.replace("/", " ").replace("|", " ").split()).split()
        seg = x[int(max(0, s0 - 0.05) * 16000):int((s1 + 0.25) * 16000)]
        # 소리 시작·끝(20ms 창 RMS > 0.02)
        fr = np.array([np.sqrt((seg[i:i+320]**2).mean()) for i in range(0, len(seg)-320, 320)])
        on = np.argmax(fr > 0.02) * 0.02 + max(0, s0 - 0.05) if (fr > 0.02).any() else s0
        segs, _ = M.transcribe(seg, language="ko", word_timestamps=True, beam_size=5, initial_prompt=disp.replace("/", " ").replace("|", " "), vad_filter=False)
        aw = [(w.word.strip(), w.start + max(0, s0 - 0.05)) for s in segs for w in s.words]
        sc, st = [], []
        for w, t in aw:
            for ch in norm(w): sc.append(ch); st.append(t)
        dc, own, first = [], [], {}
        for i, w in enumerate(words):
            for ch in norm(w): first.setdefault(i, len(dc)); dc.append(ch); own.append(i)
        t = [None] * len(words)
        sm = difflib.SequenceMatcher(None, dc, sc, autojunk=False)
        for blk in sm.get_matching_blocks():
            for q in range(blk.size):
                ci = blk.a + q; i = own[ci]
                if first.get(i) == ci and t[i] is None: t[i] = st[blk.b + q]   # 어절의 첫 글자가 맞을 때만 믿는다
        t[0] = on
        for i in range(1, len(t)):                                            # 거꾸로 가는 값은 버린다
            if t[i] is not None and (t[i] <= t[i-1 if t[i-1] is not None else 0] + 0.08 if t[i-1] is not None else False): t[i] = None
        anchors = [(i, v) for i, v in enumerate(t) if v is not None]
        end_t = s1; ln = [len(norm(w)) or 1 for w in words]
        for (i0, v0), (i1, v1) in zip(anchors, anchors[1:] + [(len(words), end_t)]):
            if i1 - i0 > 1:
                tot = sum(ln[i0:i1]); acc = ln[i0]
                for i in range(i0 + 1, i1): t[i] = v0 + (v1 - v0) * acc / tot; acc += ln[i]
        sp["sentences"][k]["w"] = [round(a + (v - s0) * tp, 3) for v in t]
        rep.append((k, round(on - s0, 2), len(anchors), len(words)))
    json.dump(sp, open(f"{R}/spec{n}.json", "w"), ensure_ascii=False, indent=1)
    print(n, rep, flush=True)
