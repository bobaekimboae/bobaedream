"""5회차: 옵션 칩 글자를 차란차 공개 옵션표의 정확한 명칭으로 바꾼다(2026-11-14).
옵션표에 없는 것(렉시콘 사운드, 디지털 계기판)은 칩을 빼거나, 그 매물에 실제 있는 옵션 중
같은 시간대 화면에 보이는 것으로 옮긴다. 사용: python optnames_r5.py <r5 폴더>"""
import json, sys, os
D = sys.argv[1]
REN = {  # 매물 번호: {예전 칩 글자: 옵션표 명칭}
 "01": {"✓ 파노라마 선루프": "✓ 선루프(파노라마)", "✓ 가죽 시트": "✓ 가죽시트", "✓ 주차 카메라": "✓ 어라운드뷰(AVM)"},
 "03": {"퀼팅 가죽 시트": "가죽시트"},
 "05": {"✓ 브론즈 휠": "✓ 알루미늄 휠", "✓ 가죽 시트": "✓ 가죽시트", "✓ 세로형 터치 화면": "✓ 내비게이션"},
 "06": {"✓ 듀얼 터치 화면": "✓ 모니터(앞좌석)"},
 "09": {"아이보리 가죽": "가죽시트"},
 "12": {"세로형 터치 화면": "모니터(앞좌석)"},
 "14": {"✓ 글라스 루프": "✓ 선루프(파노라마)", "✓ 무선 충전 2개": "✓ 스마트폰 무선충전", "✓ 어라운드 뷰": "✓ 어라운드뷰(AVM)"},
 "16": {"✓ 브라운 가죽 시트": "✓ 가죽시트", "✓ 커브드 디스플레이": "✓ 내비게이션", "✓ 어라운드 뷰": "✓ 어라운드뷰(AVM)"},
 "19": {"파노라마 선루프": "선루프(파노라마)"},
}
DROP = {"06": "✓ 디지털 계기판"}  # 옵션표에 없음, 같은 컷에 옵션이 보이지 않음
MOVE = {"18": ("렉시콘 사운드", "어라운드뷰(AVM)", 17.13)}  # 「주변」 말하는 순간 17.08 + 0.05
log = []
for n in sorted(set(REN) | set(DROP) | set(MOVE)):
    p = os.path.join(D, f"spec{n}.json"); s = json.load(open(p))
    out = []
    for c in s["chips"]:
        t = c["text"]
        if n in DROP and t == DROP[n]:
            s["sfx"] = [x for x in s["sfx"] if abs(x["t"] - c["t0"]) > 0.01]
            log.append((n, t, "(뺌)")); continue
        if n in MOVE and t == MOVE[n][0]:
            dur = c["t1"] - c["t0"]; c["text"] = MOVE[n][1]; c["t0"] = MOVE[n][2]; c["t1"] = round(MOVE[n][2] + dur, 2)
            log.append((n, t, c["text"] + f" @{c['t0']}"))
        elif t in REN.get(n, {}):
            c["text"] = REN[n][t]; log.append((n, t, c["text"]))
        out.append(c)
    s["chips"] = out
    json.dump(s, open(p, "w"), ensure_ascii=False, indent=1)
for r in log: print(*r, sep=" | ")
