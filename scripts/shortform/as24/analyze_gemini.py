"""오토스카우트24 쇼츠 편집 해부 — Gemini API에 유튜브 주소를 그대로 넣어 장면·자막·효과음·음악·아이콘·대사를 JSON으로 받는다.

GitHub Actions에서 GEMINI_API_KEY 비밀값으로 실행한다. 키는 출력하지 않는다.
표준 라이브러리만 쓴다(설치 없음).
"""
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request

API = "https://generativelanguage.googleapis.com/v1beta"
KEY = os.environ["GEMINI_API_KEY"]
OUT = sys.argv[2] if len(sys.argv) > 2 else "as24-out"
TARGETS = sys.argv[1] if len(sys.argv) > 1 else "scripts/shortform/as24/targets.txt"
FPS = float(os.environ.get("AS24_FPS", "2"))

PROMPT = """너는 숏폼 영상 편집 분석가다. 이 유튜브 쇼츠(오토스카우트24 공식 계정, 중고차 플랫폼)를 처음부터 끝까지 보고 들은 뒤,
우리 회사 숏폼 편집 기준표를 만들기 위해 편집 기법을 시간순으로 정밀 분석해라.

규칙:
- 직접 보고 들은 것만 쓴다. 확실하지 않으면 해당 항목의 "sure"를 false로 둔다. 지어내지 않는다.
- 시각은 초 단위 소수(예: 3.5)로 쓴다.
- 위치·크기는 화면 비율(%)로 쓴다. 가로 0=왼쪽 끝, 세로 0=맨 위.
- 설명 값은 한국어로 쓴다. 화면 글자·대사 원문은 원어 그대로 "text"에, 한국어 번역은 "ko"에 쓴다.

다음 JSON 하나만 출력해라(설명 문장 없이):
{
 "basic": {"duration_sec": 0, "aspect": "9:16", "car": "제조사 모델", "format": "차 소개/퀴즈/가격 공개/비교/정보 등",
           "person_on_screen": true, "voice": "사람 직접/더빙/AI 음성 추정/없음", "language": "nl/fr/en 등"},
 "shots": [{"start": 0, "end": 0, "part": "외관 전면/외관 측면/외관 후면/휠/실내/계기판/화면/시트/트렁크/엔진룸/사람/기타",
            "camera": "고정/밀기/당기기/옆 이동/걸으며 손으로/짐벌/기타", "transition_in": "바로 컷/디졸브/휙 밀기/줌/기타", "sure": true}],
 "captions": [{"start": 0, "end": 0, "text": "", "ko": "", "kind": "말 자막/키워드 스티커/가격/숫자 사양/제목/로고/기타",
               "y_pct": 0, "x_center_pct": 0, "text_height_pct": 0, "color": "", "background": "없음/상자/형광펜 칠/기타",
               "bg_color": "", "bg_width_pct": 0, "tilt_deg": 0, "entrance": "톡 튀어나옴/옆에서 밀려옴/서서히/낱말별로 바뀜/기타",
               "highlight_word": "", "sure": true}],
 "sfx": [{"t": 0, "type": "휙/톡/딸깍/충격음/셔터/돈 소리/엔진음/기타", "event": "그때 화면에서 일어난 일(컷 전환/스티커 등장/가격 공개 등)",
          "level": "작음/보통/큼", "sure": true}],
 "music": {"genre": "", "bpm_est": 0, "mood": "", "ducks_under_voice": true, "changes": [{"t": 0, "what": ""}],
           "cuts_on_beat": "대부분/일부/아님/모름"},
 "graphics": [{"start": 0, "end": 0, "what": "", "is_3d": true, "size_w_pct": 0, "x_pct": 0, "y_pct": 0,
               "entrance": "", "purpose": "", "sure": true}],
 "transcript": [{"start": 0, "end": 0, "text": "", "ko": ""}],
 "structure": [{"stage": "훅/차 소개/사양/기능·옵션/가격/마무리·행동 유도/기타", "start": 0, "end": 0, "speed": "빠름/보통/느림", "summary": ""}],
 "rules": ["이 영상의 편집 공식을 10줄 이내로: 첫 3초, 컷 평균 길이, 자막 규칙, 효과음 넣는 때, 아이콘 쓰는 때, 부위 촬영 순서, 마무리"]
}"""


def call(method, path, body=None, timeout=600):
    url = f"{API}/{path}{'&' if '?' in path else '?'}key={KEY}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        msg = e.read().decode(errors="replace")[:600]
        raise RuntimeError(f"HTTP {e.code}: {msg}") from None


def pick_model():
    if os.environ.get("GEMINI_MODEL"):
        return os.environ["GEMINI_MODEL"]
    names = []
    tok = ""
    while True:
        res = call("GET", f"models?pageSize=200{'&pageToken=' + tok if tok else ''}")
        for m in res.get("models", []):
            if "generateContent" in m.get("supportedGenerationMethods", []):
                names.append(m["name"].split("/", 1)[1])
        tok = res.get("nextPageToken")
        if not tok:
            break
    print("사용 가능한 모델:", ", ".join(sorted(names)))

    def score(n):
        v = re.search(r"gemini-(\d+(?:\.\d+)?)", n)
        ver = float(v.group(1)) if v else 0
        bad = any(k in n for k in ("tts", "image", "embedding", "live", "audio", "lite", "robotics", "computer"))
        return (not bad, "pro" in n, "preview" not in n and "exp" not in n, ver)

    cands = [n for n in names if n.startswith("gemini-")]
    best = max(cands, key=score)
    print("고른 모델:", best)
    return best


def yt_watch(url):
    m = re.search(r"(?:shorts/|v=|youtu\.be/)([\w-]{11})", url)
    return m.group(1), f"https://www.youtube.com/watch?v={m.group(1)}"


def parse_json(txt):
    txt = txt.strip()
    txt = re.sub(r"^```(?:json)?\s*|\s*```$", "", txt)
    return json.loads(txt)


def analyze(model, url):
    vid, watch = yt_watch(url)
    part = {"file_data": {"file_uri": watch}}
    body = {
        "contents": [{"parts": [dict(part, video_metadata={"fps": FPS}), {"text": PROMPT}]}],
        "generationConfig": {"responseMimeType": "application/json", "temperature": 0.2},
    }
    for attempt in range(4):
        try:
            res = call("POST", f"models/{model}:generateContent", body)
            break
        except RuntimeError as e:
            print(f"  {vid} 시도 {attempt + 1} 실패: {e}")
            if "video_metadata" in str(e) or "videoMetadata" in str(e) or "fps" in str(e):
                body["contents"][0]["parts"][0] = part  # fps 지정이 안 되면 기본(1초 1장)으로
            time.sleep(20 * (attempt + 1))
    else:
        return vid, {"error": "4번 모두 실패"}, None
    txt = "".join(p.get("text", "") for p in res["candidates"][0]["content"]["parts"])
    try:
        data = parse_json(txt)
    except Exception as e:  # JSON이 깨지면 원문을 남긴다
        data = {"parse_error": str(e), "raw": txt}
    return vid, data, res.get("usageMetadata")


def main():
    os.makedirs(OUT, exist_ok=True)
    model = pick_model()
    rows = [l.rstrip("\n").split("\t") for l in open(TARGETS, encoding="utf-8") if l.strip() and not l.startswith("#")]
    summary = []
    for country, title, url in rows:
        print(f"분석: {country} {title} {url}")
        vid, data, usage = analyze(model, url)
        doc = {"country": country, "title": title, "url": url, "model": model, "fps": FPS, "usage": usage, "analysis": data}
        with open(os.path.join(OUT, f"{country}_{vid}.json"), "w", encoding="utf-8") as f:
            json.dump(doc, f, ensure_ascii=False, indent=1)
        ok = isinstance(data, dict) and "basic" in data
        summary.append({"country": country, "title": title, "id": vid, "ok": ok, "usage": usage})
        print("  완료" if ok else "  실패/형식 오류")
        time.sleep(5)
    with open(os.path.join(OUT, "_summary.json"), "w", encoding="utf-8") as f:
        json.dump({"model": model, "fps": FPS, "items": summary}, f, ensure_ascii=False, indent=1)
    if not any(s["ok"] for s in summary):
        sys.exit(1)


if __name__ == "__main__":
    main()
