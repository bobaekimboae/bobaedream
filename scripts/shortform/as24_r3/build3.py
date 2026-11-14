"""3회차 사양서: 2회차 사양서(대사·컷·타이밍)를 그대로 두고, 원본 16편 픽셀 실측에 맞춰 칩 모양·자리·크기와 자막만 바꾼다."""
import json, re, sys
R2 = "/tmp/claude-0/-home-claude/9795e62c-2b83-5ed5-9b9a-75716025bfc2/scratchpad/sk1113/r2/"
def is_num(t): return bool(re.search(r"\d", t))
def is_price(t): return "만 원" in t or "만원" in t
for n in ["01", "05", "06", "16", "14", "03", "09", "12", "18", "19"]:
    sp = json.load(open(R2 + f"spec{n}.json"))
    be = sp["edit"] == "be"
    out = []
    for i, c in enumerate(sp["chips"]):
        c = dict(c); t = c["text"]
        title = i == 0; end = t == "보배드림"
        if not be:
            if title or end: c.update(style="outline", size=104, cy=440)                       # 차명: 위 23%, 글자 높이 약 4%
            elif is_num(t) and not t.startswith("✓"): c.update(style="outline", size=(86 if is_price(t) else 90), cy=545, hide_cap=True)  # 숫자·가격: 위 26%, 말 자막 숨김
            elif t.startswith("✓"): c.update(style="check", size=60, cy=1080)                  # 옵션: 55%, 글자 높이 약 2.6%
            else: c.update(style="outline", size=60, cy=1080)
        else:
            if title: c.update(style="title_tape", size=80, cy=330)                            # 첫 낱말만 붓띠 + 흰 큰 글자, 위 17%
            elif end: c.update(style="tape", size=96, cy=384)
            elif is_num(t): c.update(style="outline", size=74 if is_price(t) else 72, cy=1305, hide_cap=True)  # 사양 숫자·가격: 68%, 바탕 없음
            else: c.update(style="tape", size=56, cy=1380, hide_cap=True)                      # 옵션·기능 붓띠: 72%
        c.pop("big", None) if not (title or end) else None
        out.append(c)
    sp["chips"] = out
    if not be:
        sp["cap_outline"] = True; sp["cap_size"] = 54; sp["cap_cy"] = 1190
        # 효과음: 첫 화면 효과음을 차명 칩이 처음 보이는 순간에 맞춤(±0.1초)
        if sp.get("sfx"): sp["sfx"][0]["t"] = out[0]["t0"]
    else:
        sp["cap_size"] = 60; sp["cap_cy"] = 1229; sp["chip_yellow"] = [247, 236, 56]
    json.dump(sp, open(f"spec{n}.json", "w"), ensure_ascii=False, indent=1)
    print(n, sp["edit"], [(c["text"], c["style"], c["cy"]) for c in out])
