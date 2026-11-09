"""as24_edit_planner 점검. 실행: python3 scripts/shortform/test_as24_edit_planner.py"""
import pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import as24_edit_planner as P

W = [[0.0, 0.4, "이"], [0.4, 0.9, "차는"], [1.0, 1.6, "2,890만원"], [2.0, 2.5, "주행"], [2.5, 3.2, "4.3만km"],
     [4.0, 4.6, "통풍시트"], [4.7, 5.3, "열선핸들"], [6.0, 6.6, "파노라마"], [6.6, 7.2, "선루프"], [8.5, 9.0, "HUD"]]
SH = [{"t0": 0, "t1": 3.5, "part": "exterior_3_4"}, {"t0": 3.5, "t1": 7.5, "part": "seats"}, {"t0": 7.5, "t1": 10.5, "part": "interior_dash"}]
F = [{"say": "2,890만원", "topic": "price"}, {"say": "4.3만km", "topic": "mileage"}, {"say": "통풍시트", "topic": "option"},
     {"say": "열선핸들", "topic": "option"}, {"say": "파노라마 선루프", "topic": "option"}, {"say": "HUD", "topic": "option"}]


def ov(r, kind=None):
    return [o for o in r["overlays"] if kind is None or o["kind"] == kind]


def run():
    spec = {"words": W, "shots": SH, "facts": F}
    for style in sorted(P.RULES["styles"]):
        r = P.plan(spec, style)
        ts = [x["t"] for x in r["sfx"]]
        assert all(b - a >= 0.6 - 1e-9 for a, b in zip(ts, ts[1:])), (style, "효과음 간격")
        assert len({x["type"] for x in r["sfx"]}) <= 1, (style, "한 영상 한 종류")
        for o in ov(r):
            if o["kind"] == "number":
                assert o["band"] == "top", (style, "큰 숫자는 위 띠")
            assert o["t1"] > o["t0"], (style, "길이 0")
        el = ov(r, "end_logo")
        if el:
            assert all(o["t1"] <= el[0]["t0"] + 1e-9 for o in ov(r) if o["kind"] != "end_logo"), (style, "끝 로고와 겹침")
    # 독일형: 칩·효과음 없음
    r = P.plan(spec, "de"); assert not ov(r) and not r["sfx"]
    # 딜러가 말하는 형식: 효과음 없음, 칩 2개까지
    r = P.plan(spec, "bobae_talk"); assert not r["sfx"] and len(ov(r, "label")) <= 2
    # 음악을 깔면 효과음을 줄인다
    r0 = P.plan(spec, "bobae"); r = P.plan(spec, "bobae", music=True); assert 1 <= len(r["sfx"]) <= min(3, len(r0["sfx"]))
    # 끝 로고에는 효과음을 넣지 않는다(실측 NL 2/30, BE 1/21)
    el = [o for o in r0["overlays"] if o["kind"] == "end_logo"][0]
    assert all(abs(x["t"] - el["t0"]) > 0.05 for x in r0["sfx"])
    # 말하지 않은 정보는 띄우지 않는다
    r = P.plan({"words": W, "shots": SH, "facts": [{"say": "선루프없음", "topic": "option"}]}); assert not ov(r, "label")
    # 같은 정보는 한 번만
    r = P.plan({"words": W + [[9.2, 9.6, "2,890만원"]], "shots": SH, "facts": [F[0], F[0]]})
    assert sum("2,890만원" in " ".join(o.get("text") or []) for o in ov(r)) == 1
    # 장면 목록이 비면 오류
    try:
        P.plan({"words": W, "shots": [], "facts": F}); raise AssertionError("빈 장면 허용")
    except ValueError:
        pass
    # 짧게 이어 말한 숫자는 쌓는다
    w3 = [[0, 0.5, "2020"], [0.6, 1, "5만km"], [1.1, 1.6, "300마력"]]
    r = P.plan({"words": w3, "shots": [{"t0": 0, "t1": 5, "part": "exterior_front"}],
                "facts": [{"say": "2020", "topic": "year"}, {"say": "5만km", "topic": "mileage"}, {"say": "300마력", "topic": "power"}]})
    assert sum(len(o["text"]) for o in ov(r, "number")) == 3
    print("OK", len(P.RULES["styles"]), "styles")


if __name__ == "__main__":
    run()
