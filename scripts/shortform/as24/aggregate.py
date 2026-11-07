"""오토스카우트24 쇼츠 Gemini 분석 결과(JSON 묶음)를 나라별로 모아 편집 매뉴얼용 통계를 만든다.

사용: python aggregate.py <분석 JSON 폴더> <출력 폴더>
출력: stats.json (기계용), stats.md (사람용 표)
숫자는 Gemini가 영상을 보고 적은 값의 집계다. "sure": false 항목은 위치·크기 통계에서 뺀다.
"""
import collections
import json
import os
import statistics as st
import sys


def med(xs):
    xs = [x for x in xs if isinstance(x, (int, float))]
    return round(st.median(xs), 2) if xs else None


def pct(xs, q):
    xs = sorted(x for x in xs if isinstance(x, (int, float)))
    if not xs:
        return None
    k = (len(xs) - 1) * q
    lo, hi = int(k), min(int(k) + 1, len(xs) - 1)
    return round(xs[lo] + (xs[hi] - xs[lo]) * (k - lo), 2)


def top(counter, n=8):
    tot = sum(counter.values()) or 1
    return [(k, v, round(100 * v / tot)) for k, v in counter.most_common(n)]


def num(x):
    try:
        return float(x)
    except Exception:
        return None


def load(d):
    out = []
    for f in sorted(os.listdir(d)):
        if not f.endswith(".json") or f.startswith("_"):
            continue
        doc = json.load(open(os.path.join(d, f), encoding="utf-8"))
        a = doc.get("analysis")
        if isinstance(a, dict) and "basic" in a:
            out.append(doc)
    return out


def group_stats(docs):
    S = {"n": len(docs)}
    dur, nshots, shotlen, first3_shots = [], [], [], []
    part_first, part_all, cam, trans = collections.Counter(), collections.Counter(), collections.Counter(), collections.Counter()
    fmt, voice, person, lang = collections.Counter(), collections.Counter(), collections.Counter(), collections.Counter()
    cap_kind, cap_bg, cap_ent, cap_color, bg_color = (collections.Counter() for _ in range(5))
    cap_y = collections.defaultdict(list)
    cap_h = collections.defaultdict(list)
    cap_bgw = collections.defaultdict(list)
    cap_tilt = collections.defaultdict(list)
    cap_dur = collections.defaultdict(list)
    caps_per_min = []
    first_cap_t = []
    sfx_per_min, sfx_type, sfx_event, sfx_level = [], collections.Counter(), collections.Counter(), collections.Counter()
    mus_genre, mus_mood, mus_beat, mus_duck = (collections.Counter() for _ in range(4))
    bpm = []
    g_3d, g_n, g_what, g_purpose, g_size = 0, 0, collections.Counter(), collections.Counter(), []
    stage_start = collections.defaultdict(list)
    stage_share = collections.defaultdict(list)
    stage_order = collections.Counter()
    words_per_sec = []
    price_t = []
    rules = []
    for doc in docs:
        a = doc["analysis"]
        b = a.get("basic", {})
        D = num(b.get("duration_sec"))
        if D:
            dur.append(D)
        fmt[str(b.get("format", "?"))] += 1
        voice[str(b.get("voice", "?"))] += 1
        person[str(b.get("person_on_screen"))] += 1
        lang[str(b.get("language", "?"))] += 1
        shots = [s for s in a.get("shots", []) if isinstance(s, dict)]
        nshots.append(len(shots))
        for i, s in enumerate(shots):
            st0, en = num(s.get("start")), num(s.get("end"))
            if st0 is not None and en is not None and en > st0:
                shotlen.append(en - st0)
            part_all[str(s.get("part", "?"))] += 1
            cam[str(s.get("camera", "?"))] += 1
            if i:
                trans[str(s.get("transition_in", "?"))] += 1
        if shots:
            part_first[str(shots[0].get("part", "?"))] += 1
            first3_shots.append(sum(1 for s in shots if (num(s.get("start")) or 0) < 3))
        caps = [c for c in a.get("captions", []) if isinstance(c, dict)]
        if D:
            caps_per_min.append(len(caps) / D * 60)
        if caps:
            first_cap_t.append(min(num(c.get("start")) or 0 for c in caps))
        for c in caps:
            k = str(c.get("kind", "?"))
            cap_kind[k] += 1
            cap_bg[str(c.get("background", "?"))] += 1
            cap_ent[str(c.get("entrance", "?"))] += 1
            if c.get("color"):
                cap_color[str(c["color"]).lower()] += 1
            if c.get("bg_color"):
                bg_color[str(c["bg_color"]).lower()] += 1
            st0, en = num(c.get("start")), num(c.get("end"))
            if st0 is not None and en is not None and en > st0:
                cap_dur[k].append(en - st0)
            if "가격" in k and st0 is not None and D:
                price_t.append(st0 / D)
            if c.get("sure") is False:
                continue
            for key, dst in (("y_pct", cap_y), ("text_height_pct", cap_h), ("bg_width_pct", cap_bgw), ("tilt_deg", cap_tilt)):
                v = num(c.get(key))
                if v is not None and (key == "tilt_deg" or v > 0):
                    dst[k].append(v)
        sfx = [x for x in a.get("sfx", []) if isinstance(x, dict)]
        if D:
            sfx_per_min.append(len(sfx) / D * 60)
        for x in sfx:
            sfx_type[str(x.get("type", "?"))] += 1
            sfx_event[str(x.get("event", "?"))[:40]] += 1
            sfx_level[str(x.get("level", "?"))] += 1
        m = a.get("music") or {}
        if isinstance(m, dict):
            mus_genre[str(m.get("genre", "?"))] += 1
            mus_mood[str(m.get("mood", "?"))] += 1
            mus_beat[str(m.get("cuts_on_beat", "?"))] += 1
            mus_duck[str(m.get("ducks_under_voice"))] += 1
            v = num(m.get("bpm_est"))
            if v and 40 < v < 220:
                bpm.append(v)
        for g in a.get("graphics", []) or []:
            if not isinstance(g, dict):
                continue
            g_n += 1
            g_3d += bool(g.get("is_3d"))
            g_what[str(g.get("what", "?"))[:30]] += 1
            g_purpose[str(g.get("purpose", "?"))[:30]] += 1
            v = num(g.get("size_w_pct"))
            if v:
                g_size.append(v)
        stg = [s for s in a.get("structure", []) or [] if isinstance(s, dict)]
        stage_order[" → ".join(str(s.get("stage", "?")) for s in stg)[:120]] += 1
        for s in stg:
            k = str(s.get("stage", "?"))
            st0, en = num(s.get("start")), num(s.get("end"))
            if st0 is not None:
                stage_start[k].append(st0)
            if st0 is not None and en is not None and D:
                stage_share[k].append((en - st0) / D)
        tr = [t for t in a.get("transcript", []) or [] if isinstance(t, dict)]
        spoken = sum(len(str(t.get("text", "")).split()) for t in tr)
        talk = sum(max(0, (num(t.get("end")) or 0) - (num(t.get("start")) or 0)) for t in tr)
        if talk > 3:
            words_per_sec.append(spoken / talk)
        rules.extend(str(r) for r in a.get("rules", []) or [])

    S["duration_sec"] = {"median": med(dur), "p25": pct(dur, .25), "p75": pct(dur, .75)}
    S["shots_per_video"] = {"median": med(nshots), "p25": pct(nshots, .25), "p75": pct(nshots, .75)}
    S["shot_len_sec"] = {"median": med(shotlen), "p25": pct(shotlen, .25), "p75": pct(shotlen, .75)}
    S["shots_in_first_3s"] = med(first3_shots)
    S["first_shot_part"] = top(part_first)
    S["parts"] = top(part_all, 12)
    S["camera"] = top(cam)
    S["transition"] = top(trans)
    S["format"] = top(fmt)
    S["voice"] = top(voice)
    S["person_on_screen"] = top(person)
    S["language"] = top(lang)
    S["captions_per_min"] = med(caps_per_min)
    S["first_caption_t"] = med(first_cap_t)
    S["caption_kind"] = top(cap_kind, 10)
    S["caption_background"] = top(cap_bg)
    S["caption_entrance"] = top(cap_ent)
    S["caption_color"] = top(cap_color, 6)
    S["caption_bg_color"] = top(bg_color, 6)
    S["caption_by_kind"] = {
        k: {"n": cap_kind[k], "y_pct": med(cap_y[k]), "text_h_pct": med(cap_h[k]), "bg_w_pct": med(cap_bgw[k]),
            "tilt_deg": med(cap_tilt[k]), "dur_sec": med(cap_dur[k])}
        for k, _ in cap_kind.most_common(8)}
    S["price_position_of_duration"] = {"median": med(price_t), "n": len(price_t)}
    S["sfx_per_min"] = {"median": med(sfx_per_min), "p75": pct(sfx_per_min, .75)}
    S["sfx_type"] = top(sfx_type)
    S["sfx_event"] = top(sfx_event, 10)
    S["sfx_level"] = top(sfx_level)
    S["music_genre"] = top(mus_genre, 6)
    S["music_mood"] = top(mus_mood, 6)
    S["music_bpm"] = {"median": med(bpm), "p25": pct(bpm, .25), "p75": pct(bpm, .75)}
    S["music_cuts_on_beat"] = top(mus_beat)
    S["music_ducks_under_voice"] = top(mus_duck)
    S["graphics_per_video"] = round(g_n / max(1, len(docs)), 2)
    S["graphics_3d_share"] = round(g_3d / g_n, 2) if g_n else None
    S["graphics_what"] = top(g_what, 10)
    S["graphics_purpose"] = top(g_purpose, 8)
    S["graphics_width_pct"] = med(g_size)
    S["stage_start_sec"] = {k: med(v) for k, v in stage_start.items() if len(v) >= 3}
    S["stage_share"] = {k: med(v) for k, v in stage_share.items() if len(v) >= 3}
    S["stage_order_top"] = top(stage_order, 6)
    S["words_per_sec"] = med(words_per_sec)
    S["rules_sample"] = rules[:400]
    return S


def md(stats):
    L = []
    for g, S in stats.items():
        L.append(f"## {g} (분석 성공 {S['n']}편)\n")
        for key, val in S.items():
            if key in ("n", "rules_sample"):
                continue
            if isinstance(val, list):
                val = ", ".join(f"{k} {c}({p}%)" for k, c, p in val)
            elif isinstance(val, dict):
                val = json.dumps(val, ensure_ascii=False)
            L.append(f"- **{key}**: {val}")
        L.append("")
    return "\n".join(L)


def main():
    src, out = sys.argv[1], sys.argv[2]
    os.makedirs(out, exist_ok=True)
    docs = load(src)
    by = collections.defaultdict(list)
    for d in docs:
        by[d["country"]].append(d)
    stats = {"ALL": group_stats(docs)}
    for c in sorted(by):
        stats[c] = group_stats(by[c])
    json.dump(stats, open(os.path.join(out, "stats.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    open(os.path.join(out, "stats.md"), "w", encoding="utf-8").write(md(stats))
    print({k: v["n"] for k, v in stats.items()})


if __name__ == "__main__":
    main()
