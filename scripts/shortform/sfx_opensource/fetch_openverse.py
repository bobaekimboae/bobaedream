#!/usr/bin/env python3
"""Openverse에서 CC0 효과음 후보를 받는다 (보배드림 숏폼용).

- 라이선스는 CC0만 받는다(표기 의무 없음, 상업 이용 가능). BY·NC는 받지 않는다.
- 길이 0.15~4초 소리만, 종류(kind)마다 후보 N개.
- 결과: <out>/candidates/<kind>/<id>.mp3 + <out>/candidates.json (출처·작성자·라이선스).

사용: python3 fetch_openverse.py --out work/sfx_os [--per 8]
"""
import argparse, json, os, sys, time, urllib.parse, urllib.request

API = "https://api.openverse.org/v1/audio/"

# 종류 → (검색어 목록, CLAP 채점용 설명). 종류 이름은 be_locked_rules.json sfx.kinds·metaphor와 맞춘다.
KINDS = {
    "whoosh":        (["whoosh", "swoosh transition"], "a short fast air whoosh transition sound"),
    "ding":          (["ding notification", "bell ding"], "a short bright bell ding notification"),
    "pop":           (["pop ui", "bubble pop"], "a short soft pop click sound"),
    "impact":        (["cinematic impact hit", "boom hit"], "a deep cinematic impact hit"),
    "riser":         (["riser", "swell rise"], "a rising swell riser before a reveal"),
    "click":         (["ui click", "button click"], "a crisp interface button click"),
    "camera_shutter":(["camera shutter"], "a camera shutter click"),
    "car_door":      (["car door close"], "a car door closing thud"),
    "engine_start":  (["car engine start"], "a car engine starting and revving"),
    "turn_signal":   (["turn signal indicator", "car indicator tick"], "a car turn signal ticking"),
    "key_fob":       (["car lock beep", "car alarm chirp"], "a car remote lock chirp beep"),
    "cash":          (["cash register", "coins"], "a cash register cha-ching with coins"),
    "seatbelt":      (["seatbelt click", "seat belt"], "a seatbelt buckle click"),
    "swipe":         (["swipe", "paper swipe"], "a quick swipe slide sound"),
}


def get(url, tries=3):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "bobaedream-shortform/1.0"})
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read()
        except Exception as e:  # 네트워크 일시 오류만 다시 시도
            if i == tries - 1:
                raise
            time.sleep(2 + i * 2)


def search(q, page_size=20):
    qs = urllib.parse.urlencode({"q": q, "license": "cc0", "page_size": page_size})
    return json.loads(get(f"{API}?{qs}"))["results"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--per", type=int, default=8)
    ap.add_argument("--kinds", default="", help="쉼표로 일부 종류만")
    a = ap.parse_args()
    kinds = [k for k in KINDS if not a.kinds or k in a.kinds.split(",")]
    out = os.path.abspath(a.out)
    meta = []
    for kind in kinds:
        queries, desc = KINDS[kind]
        seen, picked = set(), []
        for q in queries:
            for r in search(q):
                dur = (r.get("duration") or 0) / 1000
                if r.get("license") != "cc0" or not (0.15 <= dur <= 4.0) or r["id"] in seen:
                    continue
                seen.add(r["id"])
                picked.append(r)
                if len(picked) >= a.per:
                    break
            if len(picked) >= a.per:
                break
        d = os.path.join(out, "candidates", kind)
        os.makedirs(d, exist_ok=True)
        for r in picked:
            ext = (r.get("filetype") or "mp3").lower()
            path = os.path.join(d, f"{r['id']}.{ext}")
            if not os.path.exists(path):
                try:
                    with open(path, "wb") as f:
                        f.write(get(r["url"]))
                except Exception as e:
                    print(f"  받기 실패 {kind} {r['id']}: {e}", file=sys.stderr)
                    continue
            meta.append({
                "kind": kind, "desc": desc, "id": r["id"], "file": os.path.relpath(path, out),
                "title": r.get("title"), "creator": r.get("creator"), "creator_url": r.get("creator_url"),
                "source": r.get("source"), "foreign_landing_url": r.get("foreign_landing_url"),
                "license": r.get("license"), "license_url": r.get("license_url"),
                "duration_s": round((r.get("duration") or 0) / 1000, 3),
            })
        print(f"{kind}: 후보 {len(picked)}개")
    with open(os.path.join(out, "candidates.json"), "w") as f:
        json.dump(meta, f, ensure_ascii=False, indent=1)
    print(f"합계 {len(meta)}개 → {out}/candidates.json")


if __name__ == "__main__":
    main()
