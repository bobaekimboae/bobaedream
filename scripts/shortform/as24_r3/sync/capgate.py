"""자막 재발 방지 검사(렌더 뒤 자동 실행). 하나라도 기준을 넘으면 종료 코드 1 → 다음 단계(AE·업로드)로 넘어가지 않는다.
사용: python capgate.py <회차 폴더> [편 번호…]
기준
 G1 대사 어절이 자막에 하나도 빠지지 않는다(순서까지).
 G2 소리가 나는데(20ms RMS > 0.02) 자막이 0.25초 넘게 비는 곳이 없다.
 G3 0.12초 미만으로 스치는 강조 어절이 없다.
 G4 자막 바뀌는 시각이 30fps 프레임 경계에 있다(AE·캡컷이 한 프레임 늦게 바꾸지 않게).
 G5 문장 첫 어절의 노랑이 실제 소리 시작보다 0.15초 넘게 늦거나 0.15초 넘게 빠른 문장이 없다(무음으로 시작하는 문장은 소리 시작 기준).
 G6 받아쓰기가 글자까지 똑같이 들은 낱말의 가운데 시각이 그 어절 노랑 구간 안에 드는 비율 95% 이상(asr_r5.json 이 있을 때).
"""
import json, os, re, sys, subprocess, numpy as np
R = sys.argv[1].rstrip("/"); NS = sys.argv[2:] or ['01','03','05','06','09','12','14','16','18','19']
HERE = os.path.dirname(os.path.abspath(__file__)); ASR = os.path.join(HERE, "asr_r5.json")
A = json.load(open(ASR)) if os.path.exists(ASR) else {}
def norm(s): return re.sub(r"[^0-9A-Za-z가-힣]", "", s).lower()
def load(p): return np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',p,'-f','f32le','-ac','1','-ar','16000','-'],capture_output=True,check=True).stdout, np.float32)
fail = []; tot = dict(words=0, mid_ok=0, mid_n=0)
for n in NS:
    m = json.load(open(f"{R}/out{n}/manifest.json")); x = load(f"{R}/out{n}/voice.wav")
    rms = np.array([np.sqrt((x[i:i+320]**2).mean()) for i in range(0, len(x)-320, 320)])
    loud = lambda a, b: (rms[int(a/0.02):max(int(a/0.02)+1, int(b/0.02))] > 0.02).mean() > 0.3
    subs = sorted([i for i in m["items"] if i["kind"] == "sub"], key=lambda i: i["t0"]); cl = m["clips"]
    for s in subs:
        if s["t1"] - s["t0"] < 0.12: fail.append((n, "G3 짧음", s["text"], s["hi"], round(s["t1"]-s["t0"], 3)))
        for v in (s["t0"], s["t1"]):
            if abs(v * 30 - round(v * 30)) > 0.01: fail.append((n, "G4 프레임", s["text"], v)); break
    for k, (a, b, s0, s1, disp, tp) in enumerate(cl):
        nx = cl[k+1][2] if k+1 < len(cl) else 99
        words = disp.replace("|", " ").replace("/", " ").split(); tot["words"] += len(words)
        ins = [s for s in subs if s0 - 0.25 <= s["t0"] < nx - 0.05]
        shown = [s["text"].replace("|", " ").split()[s["hi"]] for s in ins]
        if shown != words: fail.append((n, "G1 빠짐·순서", disp, " ".join(shown)))
        t = s0
        for s in ins:
            if s["t0"] - t > 0.25 and loud(t, s["t0"]): fail.append((n, "G2 빈자막", disp[:20], round(t, 2), s["t0"]))
            t = max(t, s["t1"])
        if s1 - t > 0.25 and loud(t, s1): fail.append((n, "G2 빈자막(끝)", disp[:20], round(t, 2), round(s1, 2)))
        seg = rms[int(s0/0.02):int(s1/0.02)]
        on = s0 + (np.argmax(seg > 0.02) * 0.02 if (seg > 0.02).any() else 0)
        if ins and not (-0.15 <= ins[0]["t0"] - on <= 0.15): fail.append((n, "G5 첫어절", disp[:20], round(ins[0]["t0"] - on, 2)))
        if A.get(n):
            ref = [w for w in A[n] if s0 - 0.1 <= w[1] < min(nx, s1 + 0.3)]
            for s in ins:
                w = norm(s["text"].replace("|", " ").split()[s["hi"]]); hit = [r for r in ref if norm(r[0]) == w]
                if len(hit) == 1:
                    tot["mid_n"] += 1; mid = (hit[0][1] + hit[0][2]) / 2
                    tot["mid_ok"] += s["t0"] <= mid < s["t1"]
if tot["mid_n"] and tot["mid_ok"] / tot["mid_n"] < 0.95: fail.append(("전체", "G6 가운데시각", tot["mid_ok"], tot["mid_n"]))
print("자막 검사", R, "어절", tot["words"], "G6", f'{tot["mid_ok"]}/{tot["mid_n"]}', "실패", len(fail))
for f in fail: print("  ", f)
sys.exit(1 if fail else 0)
