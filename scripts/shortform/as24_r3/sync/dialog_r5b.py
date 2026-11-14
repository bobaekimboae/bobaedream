"""5회차 2단계: 옵션 문장을 옵션표 명칭으로 고친 대사(같은 목소리로 한 번 생성)로 바꾼다.
fix.mp3를 받아쓰기 쉼으로 26조각으로 나눠 해당 문장의 file/a/b/text/w를 교체하고, 칩 시각을 새 문장의 키워드 시각에 다시 맞춘다.
사용: python dialog_r5.py <r5 폴더> <fix.mp3> <fixasr.json(faster-whisper 낱말 [[낱말,시작,끝]...])>"""
import json, sys, os, subprocess, re
D, MP3, WJ = sys.argv[1:4]
NEW = [  # 2차(2026-11-14 「크고 같은 추상어 말고 인치 등 수치」): 확인된 공식 제원 수치만, 못 찾은 수치는 화면·옵션표 사실로
 ("01", 3, "옆모습은 지붕이 뒤로 떨어지는 패스트백이에요", None, None),
 ("01", 4, "트렁크는 기본 600리터고 2열을 접으면 1,800리터까지 늘어나요", None, None),
 ("01", 5, "선루프는 뒷좌석 위까지 닿는 파노라마죠", "✓ 선루프(파노라마)", "선루프"),
 ("03", 3, "트렁크는 기본 500리터고요", None, None),
 ("05", 1, "알루미늄 휠은 브론즈 색으로 바뀌어 있죠", "✓ 알루미늄 휠", "알루미늄"),
 ("05", 4, "가죽시트는 검정이고 뒷좌석도 같은 가죽입니다", "✓ 가죽시트", "가죽시트"),
 ("05", 5, "가운데 9인치 세로형 화면으로 내비게이션이랑 공조를 다 만져요", "✓ 내비게이션", "내비게이션"),
 ("06", 3, "트렁크 바닥은 턱 없이 평평해요", None, None),
 ("06", 4, "뒷좌석 무릎 공간은 이 정도고요", None, None),
 ("06", 6, "계기판은 디지털 화면입니다", None, None),
 ("09", 5, "12.3인치 계기판에 12.3인치 내비게이션이 이어져 있죠", None, None),
 ("09", 6, "트렁크는 파워 전동 트렁크예요", None, None),
 ("12", 3, "트렁크는 513리터예요", None, None),
 ("12", 5, "앞좌석 모니터는 9.3인치 세로형이죠", "모니터(앞좌석)", "앞좌석"),
 ("12", 6, "헤드램프는 LED고요", None, None),
 ("12", 7, "가죽시트는 검정색", None, None),
 ("14", 2, "앞좌석 모니터는 15.6인치 배터리는 82.5킬로와트시예요", "82.5kWh", "배터리"),
 ("14", 3, "트렁크는 기본 500리터죠", None, None),
 ("14", 4, "선루프는 뒷좌석 위까지 닿는 파노라마예요", "✓ 선루프(파노라마)", "선루프"),
 ("16", 3, "트렁크는 기본 580리터입니다", None, None),
 ("16", 5, "14.9인치 내비게이션 화면이 12.3인치 계기판과 이어지고요", "✓ 내비게이션", "내비게이션"),
 ("18", 3, "스피커는 렉시콘 14개고요", None, None),
 ("18", 4, "뒷좌석까지 열선시트가 들어가요", None, None),
 ("18", 7, "앞은 12.3인치 화면에 아날로그 시계까지", None, None),
 ("19", 3, "휠은 다크 색 알루미늄 휠이에요", None, None),
 ("19", 5, "실내는 11.4인치 터치 화면 하나로 정리됐죠", None, None),
 ("19", 6, "트렁크는 파워 전동 트렁크고요", None, None),
]
# 1) 문장 경계 = 가장 긴 무음 26곳(-38dB, 0.12초 이상). 받아쓰기가 여러 문장을 한 덩어리로 묶어 낱말 쉼으로는 못 나눔
r = subprocess.run(["ffmpeg", "-i", MP3, "-af", "silencedetect=n=-38dB:d=0.12", "-f", "null", "-"], capture_output=True, text=True).stderr
sil = [(float(e) - float(d), float(e)) for e, d in re.findall(r"silence_end: ([\d.]+) \| silence_duration: ([\d.]+)", r)]
tot = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", MP3], capture_output=True, text=True).stdout)
inner = [x for x in sil if 0.05 < x[0] and x[1] < tot - 0.05]
brk = sorted(sorted(inner, key=lambda x: x[1] - x[0], reverse=True)[:len(NEW) - 1])
# 쉼표 자리 쉼(「15.6인치, 배터리는」 54.30초)이 문장 사이 쉼(「LED고요 / 가죽시트는」 49.62초)보다 길어 바꿔 줌(받아쓰기로 확인)
SWAP = {54.30: 49.62}
for old, new in SWAP.items():
    i = next((j for j, x in enumerate(brk) if abs(x[1] - old) < 0.02), None)
    k = next((x for x in inner if abs(x[1] - new) < 0.02), None)
    if i is not None and k: brk[i] = k
brk = sorted(brk)
edges = [0.0] + [x for b0 in brk for x in b0] + [tot]
segs = [(edges[2 * i] if i == 0 else edges[2 * i] - 0.05, edges[2 * i + 1] + 0.03) for i in range(len(NEW))]
A = json.load(open(WJ))
groups = [[w for w in A if a0 - 0.1 <= (w[1] + w[2]) / 2 < b0] or [["x", a0, b0]] for a0, b0 in segs]
def word_times(g, words):
    """문장 글자 위치를 받아쓰기 낱말 시각에 비례로 대응(띄어쓰기가 달라도 맞춤)"""
    al = [(len(x[0].replace(' ', '')), x[1], x[2]) for x in g]; tot_a = sum(l for l, _, _ in al)
    tot_t = sum(len(w) for w in words); out, acc = [], 0
    for w in words:
        pos = acc / tot_t * tot_a; c = 0
        for l, s0, e0 in al:
            if pos < c + l: out.append(s0 + (e0 - s0) * (pos - c) / max(1, l)); break
            c += l
        else: out.append(al[-1][1])
        acc += len(w)
    return out
for (n, k, text, chip, kw), (a, b) in zip(NEW, segs):
    p = os.path.join(D, f"spec{n}.json"); s = json.load(open(p)); sen = s["sentences"][k]
    words = text.split(); ws = word_times(groups[NEW.index((n, k, text, chip, kw))], words)
    sen.update({"file": os.path.abspath(MP3), "a": round(a, 3), "b": round(b, 3), "text": text, "w": [round(x, 3) for x in ws]})
    if chip:
        edp = 0.4 if s["edit"] == "nl" else 0.05
        st0 = max(sen["at"], 0)  # 렌더러가 문장을 at 에 놓음(앞 문장이 길면 조금 뒤)
        kt = next((ws[i] for i, w in enumerate(words) if kw in w), ws[0])
        t0 = round(st0 + (kt - a) + edp, 2)
        for c in s["chips"]:
            if c["text"] == chip:
                old = c["t0"]; d = c["t1"] - c["t0"]; c["t0"] = t0; c["t1"] = round(t0 + d, 2)
                for x in s["sfx"]:
                    if abs(x["t"] - old) < 0.01: x["t"] = t0
                print(n, k, chip, old, "→", t0)
    json.dump(s, open(p, "w"), ensure_ascii=False, indent=1)
print("segments", [(round(a, 2), round(b, 2)) for a, b in segs])
