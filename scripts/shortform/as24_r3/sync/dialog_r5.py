"""5회차 2단계: 옵션 문장을 옵션표 명칭으로 고친 대사(같은 목소리로 한 번 생성)로 바꾼다.
fix.mp3를 받아쓰기 쉼으로 26조각으로 나눠 해당 문장의 file/a/b/text/w를 교체하고, 칩 시각을 새 문장의 키워드 시각에 다시 맞춘다.
사용: python dialog_r5.py <r5 폴더> <fix.mp3> <fixasr.json(faster-whisper 낱말 [[낱말,시작,끝]...])>"""
import json, sys, os, subprocess, re
D, MP3, WJ = sys.argv[1:4]
NEW = [  # (매물, 문장 번호, 새 문장, 칩 글자, 키워드)
 ("01", 5, "뒷좌석 위로는 선루프가 파노라마라서 실내가 환해요", "✓ 선루프(파노라마)", "선루프"),
 ("01", 6, "가죽시트에 색은 검정이고요", "✓ 가죽시트", "가죽시트"),
 ("01", 7, "주차할 땐 어라운드뷰 화면이 바로 뜹니다", "✓ 어라운드뷰(AVM)", "어라운드뷰"),
 ("03", 4, "가죽시트는 퀼팅 무늬예요", "가죽시트", "가죽시트"),
 ("03", 5, "위로는 선루프가 파노라마죠", None, None),
 ("03", 7, "스마트폰 무선충전은 두 자리고요", None, None),
 ("05", 1, "알루미늄 휠은 브론즈 색이라 눈에 확 띄죠", "✓ 알루미늄 휠", "알루미늄"),
 ("05", 4, "가죽시트는 검정이고 뒷좌석도 넉넉합니다", "✓ 가죽시트", "가죽시트"),
 ("05", 5, "가운데 화면으로 내비게이션이랑 공조를 다 만져요", "✓ 내비게이션", "내비게이션"),
 ("05", 6, "후진하면 후방 카메라 화면이 바로 나오고요", "✓ 후방 카메라", "후방"),
 ("06", 5, "앞좌석 모니터가 위아래로 두 개 있어요", "✓ 모니터(앞좌석)", "앞좌석"),
 ("09", 4, "가죽시트는 밝은 아이보리", "가죽시트", "가죽시트"),
 ("09", 7, "주차할 땐 어라운드뷰가 주변을 보여 주고요", None, None),
 ("12", 5, "앞좌석 모니터가 세로형이죠", "모니터(앞좌석)", "앞좌석"),
 ("12", 6, "헤드램프는 LED라서 눈매가 날카로워요", None, None),
 ("12", 7, "가죽시트는 검정이고요", None, None),
 ("14", 2, "앞좌석 모니터가 크고 배터리는 82.5킬로와트시예요", "82.5kWh", "배터리"),
 ("14", 4, "선루프는 파노라마라 뒷좌석까지 시원해요", "✓ 선루프(파노라마)", "선루프"),
 ("14", 5, "스마트폰 무선충전이 두 자리 나란히 있고요", "✓ 스마트폰 무선충전", "스마트폰"),
 ("14", 6, "주차할 땐 어라운드뷰로 주변을 보여 줍니다", "✓ 어라운드뷰(AVM)", "어라운드뷰"),
 ("16", 4, "가죽시트는 브라운 색으로 꾸며졌어요", "✓ 가죽시트", "가죽시트"),
 ("16", 5, "내비게이션 화면이 운전석까지 길게 이어지고요", "✓ 내비게이션", "내비게이션"),
 ("16", 6, "주차할 땐 어라운드뷰가 주변을 위에서 보여 줘요", "✓ 어라운드뷰(AVM)", "어라운드뷰"),
 ("18", 5, "주차할 땐 어라운드뷰가 주변을 보여 주죠", "어라운드뷰(AVM)", "어라운드뷰"),
 ("19", 4, "선루프는 파노라마", "선루프(파노라마)", "선루프"),
 ("19", 8, "주차할 땐 어라운드뷰가 주변을 보여 줘요", None, None),
]
# 1) 받아쓰기 낱말 사이 가장 긴 쉼 25곳이 문장 경계(무음 검출은 짧은 쉼을 놓침)
A = json.load(open(WJ))  # [[낱말, 시작, 끝], ...]
cut = sorted(i for _, i in sorted([(A[i + 1][1] - A[i][2], i) for i in range(len(A) - 1)], reverse=True)[:len(NEW) - 1])
groups, st = [], 0
for c in cut + [len(A) - 1]: groups.append(A[st:c + 1]); st = c + 1
segs = [(max(0.0, g[0][1] - 0.08), g[-1][2] + 0.1) for g in groups]
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
