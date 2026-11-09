"""AS24(네덜란드·벨기에) 편집 뼈대 → 보배드림 숏폼 편집 계획 만들기.

입력: 낱말 시각(받아쓰기), 장면 목록(시작·끝·보이는 부위), 칩으로 띄울 낱말 목록(매물 정보에서 뽑은 사실만).
출력: 칩·큰 숫자·목록·효과음·말 자막 숨김 구간이 들어간 타임라인(JSON).

규칙 근거: docs/shortform/as24-edit-skeleton-v3.md · as24-sfx-rules-v1.md · as24-4country-compare-v1.md, 수치는 as24_edit_rules.json.
형식: nl · be · de · lm(원본 재현), bobae(NL형) · bobae_talk(딜러가 말하는 DE형) · bobae_quiz(LM형).
렌더러(sag_reel_v1.py 등)는 이 계획을 읽어 그리기만 한다.

사용 예:
  python3 scripts/shortform/as24_edit_planner.py plan.json --style bobae > timeline.json
  plan.json = {"words": [[0.0,0.4,"이"],...], "shots": [{"t0":0,"t1":3.2,"part":"exterior_3_4"},...],
               "facts": [{"say":"2,890만원","topic":"price"},{"say":"통풍시트","topic":"option","part":"seats"}]}
"""
import json, re, sys, argparse, pathlib

RULES = json.loads((pathlib.Path(__file__).with_name("as24_edit_rules.json")).read_text(encoding="utf-8"))


def norm(s):
    return re.sub(r"[^0-9a-z가-힣]", "", s.lower())


def find_say(words, say, after=0.0):
    """사실 문구가 말해진 첫 시각(첫 낱말 시작). 여러 낱말이면 이어진 낱말을 붙여 찾는다."""
    target = norm(say)
    if not target:
        return None
    for i, (a, b, w) in enumerate(words):
        if a < after:
            continue
        acc = ""
        for j in range(i, min(i + 6, len(words))):
            acc += norm(words[j][2])
            if acc.startswith(target):
                return a, words[j][1]
            if not target.startswith(acc):
                break
    return None


def shot_at(shots, t):
    for s in shots:
        if s["t0"] <= t < s["t1"]:
            return s
    return shots[-1] if shots else {"t0": 0, "t1": 1e9, "part": "unknown"}


def band_for(part, topic, kind):
    if kind == "number":
        return "top"
    side = RULES["part_side"].get(part or "unknown", "mid")
    return side


SFX_PRIORITY = {"price": 0, "mileage": 1, "year": 2, "power": 3}


def sfx_type(v):
    """규칙 값(ding / pop / ding_or_none / ding_or_pop_rare / none) → 실제로 넣을 종류. 한 영상 한 종류."""
    if not v or v == "none":
        return None
    return "pop" if v.startswith("pop") else "ding"


def plan(spec, style="bobae", music=False):
    st = RULES["styles"][style]
    R = RULES["rules"]
    SX = RULES.get("sfx", {})
    words, shots = spec["words"], sorted(spec["shots"], key=lambda x: x["t0"])
    if not shots:
        raise ValueError("장면 목록(shots)이 비어 있다")
    out, sfx_c, hides = [], [], []
    said_after = {}
    last_list = None
    used = {"label": 0, "number": 0}
    for f in spec["facts"]:
        key = norm(f["say"])
        if key in said_after and not f.get("repeat"):
            continue  # 같은 정보는 한 번만 띄운다(다시 띄우려면 repeat: true)
        hit = find_say(words, f["say"], said_after.get(key, 0.0))
        if not hit:
            continue  # 말하지 않은 정보는 칩으로 띄우지 않는다
        w0, w1 = hit
        said_after[key] = w1
        shot = shot_at(shots, w0)
        part = f.get("part") or shot.get("part", "unknown")
        is_num = f.get("topic") in R["number_topics"] and shot.get("part") in R["wide_parts_for_numbers"]
        kind = "number" if is_num else "label"
        spec_k = st.get(kind) or st["label"]
        if spec_k.get("topics_only") and f.get("topic") not in spec_k["topics_only"]:
            continue
        if spec_k.get("ad_type_only") and not spec.get("ad"):
            continue  # 리싱마크트형: 스펙 칩은 광고형 영상에만
        if used[kind] >= spec_k.get("max_per_video", 99):
            continue  # 독일형처럼 칩을 거의 안 쓰는 형식
        if spec_k.get("inline_in_caption"):
            continue  # 숫자는 말 자막 안에 그대로(독일형)
        t0 = max(shot["t0"], w0 - spec_k.get("lead_s", 0.0))
        if shot["t1"] - t0 < R["min_shot_s"]:
            nxt = [s for s in shots if s["t0"] >= shot["t1"] and s["t1"] - s["t0"] >= R["min_shot_s"] and s["t0"] - w1 <= R.get("max_delay_s", 1.0)]
            if not nxt:
                continue  # 말과 1초 넘게 벌어지면 띄우지 않는다
            shot = nxt[0]; t0 = shot["t0"]
        t1 = min(t0 + spec_k.get("hold_s", 1.3), shot["t1"])
        band = band_for(part, f.get("topic"), kind)
        text = f["say"]
        if f.get("topic") == "option":
            text = st.get("check_list", {}).get("prefix", "") + text
        lines = [text] if len(text) <= R["max_chars_one_line"] else wrap2(text)
        item = {"kind": kind, "text": lines, "t0": round(t0, 2), "t1": round(t1, 2), "band": band,
                "cy_pct": RULES["bands"][band]["cy_pct"], "part": part, "style": spec_k, "entry": spec_k.get("entry", ["full"])[0],
                "line_t0": [round(t0, 2)] * len(lines)}
        # 같은 장면 안 옵션 연속 → ✓ 목록으로 쌓기
        if f.get("topic") == "option" and last_list and last_list["shot"] is shot and len(last_list["item"]["text"]) < st.get("check_list", {}).get("max_lines", 3):
            last_list["item"]["text"] += lines
            last_list["item"]["line_t0"] += [round(max(shot["t0"], w0 - spec_k.get("lead_s", 0.0)), 2)] * len(lines)
            last_list["item"]["t1"] = round(shot["t1"], 2)
            item = None
        elif f.get("topic") == "option":
            last_list = {"shot": shot, "item": item}
        if item:
            out.append(item); used[kind] += 1
            ty = sfx_type(spec_k.get("sfx"))
            if ty:
                sfx_c.append({"t": item["t0"], "type": ty, "prio": SFX_PRIORITY.get(f.get("topic"), 9 if kind == "label" else 5)})
    # 같은 띠에서 겹치면: 앞 칩이 0.6초 이상 보였으면 그 자리에서 글자만 바꾼다(앞 칩을 끝냄).
    # 아직 짧으면 뒤 칩을 다른 띠로 옮긴다. 큰 숫자는 늘 위 띠, 한 번에 하나만.
    out.sort(key=lambda o: o["t0"])
    for i, b in enumerate(out):
        for a in out[:i]:
            if b.get("drop"):
                break
            if a.get("drop"):
                continue
            if a["band"] == b["band"] and b["t0"] < a["t1"]:
                if b["kind"] == "number" and a["kind"] == "number" and b["t0"] - a["t0"] < R.get("swap_min_shown_s", 0.6) and len(a["text"]) < 3:
                    a["text"] += b["text"]; a["line_t0"] += b["line_t0"]; a["t1"] = max(a["t1"], b["t1"])
                    b["drop"] = True  # 짧게 이어 말한 숫자는 3줄까지 쌓는다(BMW Z4 / 2021 / €39.950)
                elif b["kind"] == "number" or b["t0"] - a["t0"] >= R.get("swap_min_shown_s", 0.6):
                    a["t1"] = b["t0"]
                    a["line_t0"] = [x for x in a["line_t0"] if x < a["t1"]] or a["line_t0"][:1]
                    a["text"] = a["text"][:len(a["line_t0"])]
                else:
                    b["band"] = "top" if a["band"] != "top" else "low"
                    b["cy_pct"] = RULES["bands"][b["band"]]["cy_pct"]
    out = [o for o in out if not o.get("drop")]
    end_t = shots[-1]["t1"]
    el0 = st["end_logo"]
    if el0.get("hold_s", 0) > 0:
        for o in out:  # 끝 로고가 뜨면 다른 칩은 내린다
            o["t1"] = round(min(o["t1"], end_t - el0["hold_s"]), 2)
        out = [o for o in out if o["t1"] - o["t0"] >= 0.3]
    hides = [[o["t0"], o["t1"]] for o in out if o["style"].get("hide_speech")]
    end = shots[-1]["t1"] if shots else 0
    el = st["end_logo"]
    if el.get("hold_s", 0) > 0:
        out.append({"kind": "end_logo", "t0": round(end - el["hold_s"], 2), "t1": end, "entry": el["entry"]})
    sfx = pick_sfx(sfx_c, SX, R, music)
    ety = sfx_type(el.get("sfx"))
    if ety and el.get("hold_s", 0) > 0:
        te = round(end - el["hold_s"], 2)
        gap = SX.get("min_gap_s", R["sfx_min_gap_s"])
        sfx = [x for x in sfx if abs(x["t"] - te) >= gap]
        sfx.append({"t": te, "type": ety})
    # 한 영상 한 종류: 가장 많이 쓰인 종류로 통일
    if sfx:
        main = max({x["type"] for x in sfx}, key=lambda k: sum(x["type"] == k for x in sfx))
        lead = SX.get("lead_s", 0.0)
        sfx = [{"t": round(max(0.0, x["t"] - lead), 2), "type": main, "gain_db": SX.get("gain_db_vs_speech", -6)} for x in sorted(sfx, key=lambda x: x["t"])]
    return {"style": style, "music": music, "overlays": out, "sfx": sfx, "hide_speech": hides}


def pick_sfx(cands, SX, R, music=False):
    """칩의 약 40%만(음악을 깔면 20%·최대 3번), 중요한 정보(가격·주행거리·연식·마력) 먼저, 0.6초 간격, 영상당 최대 6번."""
    if not cands:
        return []
    ratio = SX.get("music_label_ratio", 0.2) if music else SX.get("label_ratio", 1.0)
    cap = SX.get("music_max_per_video", 3) if music else SX.get("max_per_video", 6)
    n = min(cap, max(1, round(len(cands) * ratio)))
    gap = SX.get("min_gap_s", R["sfx_min_gap_s"])
    keep = []
    for c in sorted(cands, key=lambda c: (c["prio"], c["t"])):
        if len(keep) >= n:
            break
        if all(abs(c["t"] - k["t"]) >= gap for k in keep):
            keep.append(c)
    return [{"t": k["t"], "type": k["type"]} for k in keep]


def wrap2(t):
    sp = [m.start() for m in re.finditer(" ", t)]
    if not sp:
        return [t[: len(t) // 2], t[len(t) // 2:]]
    mid = min(sp, key=lambda i: abs(i - len(t) / 2))
    return [t[:mid], t[mid + 1:]]


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("spec")
    ap.add_argument("--style", default="bobae", choices=sorted(RULES["styles"]))
    ap.add_argument("--music", action="store_true", help="배경 음악을 깔면 효과음을 줄인다(칩의 20%, 최대 3번)")
    a = ap.parse_args()
    print(json.dumps(plan(json.loads(pathlib.Path(a.spec).read_text(encoding="utf-8")), a.style, a.music), ensure_ascii=False, indent=1))
