import json, re, subprocess, sys
from cha_nlbe_cars import CARS
R = "/home/claude/bobaedream/public/assets/shortform/"
U = "/mnt/user-data/uploads/autostudio_analysis/sk1113/src/"
def dur(f): return float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",f],capture_output=True,text=True).stdout)
def silences(f):
    e = subprocess.run(["ffmpeg","-i",f,"-af","silencedetect=n=-38dB:d=0.12","-f","null","-"],capture_output=True,text=True).stderr
    st = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", e)]; en = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", e)]
    return list(zip(st, en))
def build(n):
    c = CARS[n]; S = c["s"]; v = f"v{n}.mp3"; D = dur(v); vd = dur(U + f"{n}_shortform.mp4")
    sil = [p for p in silences(v) if 0.2 < p[0] < D - 0.2]
    lens = [len(x[0].replace(" ", "")) for x in S]; tot = sum(lens); sp0 = sil[0][0] if False else 0.0
    gaps, cum, used = [], 0, set()
    for i in range(len(S) - 1):
        cum += lens[i]; E = D * cum / tot
        cand = [p for p in sil if abs((p[0] + p[1]) / 2 - E) < 1.6 and p not in used and (not gaps or p[0] > gaps[-1][0])]
        if not cand: cand = sorted([p for p in sil if p not in used and (not gaps or p[0] > gaps[-1][0])], key=lambda p: abs(p[0] - E))[:1]
        g = max(cand, key=lambda p: (p[1] - p[0]) - 0.15 * abs((p[0] + p[1]) / 2 - E)); gaps.append(g); used.add(g)
    assert len(gaps) == len(S) - 1, (n, len(gaps))
    lead = silences(v)[0][1] if silences(v) and silences(v)[0][0] < 0.05 else 0.0
    ab = []; prev = lead
    for g in gaps: ab.append((prev, g[0])); prev = g[1]
    tail_end = [p for p in silences(v) if p[0] > D - 1.5]; last_b = tail_end[0][0] if tail_end else D
    ab.append((prev, last_b))
    L = 0.25; be = c["ed"] == "be"
    END = round(ab[-1][1] + L + 1.3, 2)
    sents, chips, cuts, sfx = [], [], [], []
    bounds = [0.0] + [round(ab[k][0] + L - 0.08, 2) for k in range(1, len(S))] + [END]
    for k, (txt, W, C) in enumerate(S):
        a, b = ab[k]; at = round(a + L, 2)
        disp = txt.replace(", ", " ").rstrip(".")
        sents.append({"a": round(a - 0.03, 2), "b": round(b + 0.05, 2), "at": at, "text": disp})
        need = bounds[k + 1] - bounds[k]
        tot = sum(w[1] - w[0] for w in W); scale = need / tot
        # 창 길이 비율대로 나누고, 모자라면 창 끝을 늘린다(원본 끝을 넘지 않게)
        for w in W:
            l = (w[1] - w[0]) * scale; s0 = w[0]; s1 = min(vd - 0.05, s0 + l)
            if s1 - s0 < l: s0 = max(0, s1 - l)
            if be and l > 3.0 and s0 + l + 0.4 < vd:  # 벨기에 컷 1.9~2.6초: 긴 컷은 둘로(가운데 0.4초 건너뜀)
                h = l / 2; cuts.append([round(s0, 3), round(s0 + h, 3)]); cuts.append([round(s0 + h + 0.4, 3), round(s0 + l + 0.4, 3)])
            else: cuts.append([round(s0, 3), round(s0 + l, 3)])
        for ci, (ct, cy, kind) in enumerate(C):
            last = k == len(S) - 1
            t0 = round(at + (0.05 if be else 0.4) + ci * 1.7, 2)
            if kind == "big": t1 = END if last else round(min(bounds[k + 1], at + 2.6), 2)
            else: t1 = round(min(t0 + (1.8 if be else 1.6), bounds[k + 1] + (0.0 if be else 0.3)), 2)
            ch = {"text": ct, "t0": t0, "t1": t1, "cy": cy}
            if kind == "big": ch["big"] = True
            if kind == "num" and be: ch["hide_cap"] = True
            chips.append(ch)
    # 효과음: NL = 훅 + 칩 43%(옵션 칩 하나 걸러), BE = 1개(첫 숫자 칩)
    if be:
        sfx.append({"file": R + "sfx/ding.wav", "t": next(x["t0"] for x in chips if x.get("hide_cap")), "vol": 0.35})
    else:
        sfx.append({"file": R + "sfx/ding.wav", "t": 0.25, "vol": 0.5})
        small = [x for x in chips if not x.get("big")]
        for x in small[1::2]: sfx.append({"file": R + "sfx/ding.wav", "t": x["t0"], "vol": 0.45})
    spec = {"car": c["slug"], "end": END, "voice": v, "flash": [], "sentences": sents, "callouts": [], "chips": chips,
            "tidy": True, "cap_size": 64, "lbl_size": 72, "chip_big": 96, "chip_small": 64, "be_clean": be,
            "cap_cy": 1229 if be else 1190, "cuts": cuts, "src_vol": 0.0, "hard_cuts": True, "edit": c["ed"], "sfx": sfx}
    if be: spec.update({"bgm": R + "bgm/bobae_showroom_v1.mp3", "bgm_vol": 0.3})
    json.dump(spec, open(f"spec{n}.json", "w"), ensure_ascii=False, indent=1)
    shots = [b - a for a, b in cuts]
    print(n, c["ed"], "end", END, "cuts", len(cuts), "avg %.2f" % (sum(shots) / len(shots)), "min %.2f" % min(shots), "chips", len(chips), "sfx", len(sfx))
for n in (sys.argv[1:] or CARS): build(n)
