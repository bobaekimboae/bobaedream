"""오토스카우트24 쇼츠 분석기 (제미나이 API, 유료 한도용).

유튜브 쇼츠 주소를 제미나이에 직접 넘겨 컷 · 자막 · 효과음 · 음악 · 그래픽 · 대사 · 구성을
JSON 한 덩어리로 받는다. 결과 모양은 2026-11-08 NL·BE 200편 분석(as24all/*.json)과 같다.

실행(깃허브 액션에서): GEMINI_API_KEY 가 환경 변수로 있어야 한다. 키는 코드·로그에 남기지 않는다.
  python3 scripts/shortform/as24_analyze.py <목록.txt> <출력폴더> [모델] [최대편수]
목록.txt 한 줄 = "국가 유튜브ID" (예: "DE dQw4w9WgXcQ"). 이미 결과 파일이 있으면 건너뛴다.
"""
import json, os, sys, time, urllib.request, urllib.error

LIST, OUT = sys.argv[1], sys.argv[2]
MODEL = sys.argv[3] if len(sys.argv) > 3 and sys.argv[3] else "gemini-3.8-flash"
LIMIT = int(sys.argv[4]) if len(sys.argv) > 4 and sys.argv[4] else 10**9
KEY = os.environ.get("GEMINI_API_KEY", "")
if not KEY:
    sys.exit("GEMINI_API_KEY 가 없습니다 (저장소 Secrets 에 등록 필요)")

PROMPT = """너는 숏폼 영상 편집 분석가다. 이 세로 쇼츠(오토스카우트24 공식 채널)를 처음부터 끝까지 보고 듣고,
아래 JSON 하나만 출력해라. 설명 문장 금지. 시각은 초(소수 1자리). 위치·크기는 화면 대비 %(0~100).
확실하지 않은 항목은 sure=false. 보이지·들리지 않는 것은 지어내지 말고 빈 배열.

{
 "basic": {"duration_sec": 숫자, "aspect": "9:16", "car": "차명", "format": "차 소개|비교|팁|투어|기타",
           "person_on_screen": 참/거짓, "voice": "없음|사람 직접|내레이션|AI 음성", "language": "nl|fr|de|en|기타"},
 "shots": [{"start","end","part": "외관 전면|외관 측면|외관 후면|휠|실내 앞|계기판|센터 화면|옵션 작동|뒷좌석|트렁크|엔진룸|사람|그래픽|기타",
            "camera": "고정|천천히 이동|걸으며 손으로|짐벌|드론|확대|기타", "transition_in": "바로 컷|페이드|밀기|확대 전환|기타", "sure"}],
 "captions": [{"start","end","text": "원문","ko": "한국어 뜻","kind": "말 자막|키워드 스티커|가격|제목|기타",
               "y_pct","x_center_pct","text_height_pct","color": "#RRGGBB","background": "없음|외곽선|상자|칠",
               "bg_color","bg_width_pct","tilt_deg","entrance": "바로|톡 튀어나옴|밀려옴|타자|페이드|기타","highlight_word","sure"}],
 "sfx": [{"t","type": "톡|휙|띵|딸깍|돈 소리|쿵|실제 차 소리(문·엔진·경적)|기타","event": "무엇에 맞춰 났나","level": "작음|보통|큼","sure"}],
 "music": {"genre","bpm_est","mood","ducks_under_voice","changes": [{"t","what"}],"cuts_on_beat": "대부분|일부|아님"},
 "graphics": [{"start","end","what","is_3d","size_w_pct","x_pct","y_pct","entrance","purpose","sure"}],
 "transcript": [{"start","end","text","ko"}],
 "structure": [{"stage": "훅|차 소개|사양|기능|가격|앱 안내|끝 화면","start","end","speed": "빠름|보통|느림","summary"}],
 "rules": ["이 영상에서 보이는 편집 규칙 한 줄씩(한국어)"]
}
효과음은 특히 꼼꼼히: 음악 박자와 구분되는 짧은 소리(톡·휙·띵 등)를 하나도 빠뜨리지 말고, 스티커·자막·컷과 같은 시각이면 그 사건을 event 에 적어라."""


def call(vid):
    body = {
        "contents": [{"parts": [
            {"file_data": {"file_uri": f"https://www.youtube.com/watch?v={vid}"}},
            {"text": PROMPT}]}],
        "generationConfig": {"responseMimeType": "application/json", "temperature": 0.2},
    }
    req = urllib.request.Request(
        f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent",
        data=json.dumps(body).encode(), method="POST",
        headers={"Content-Type": "application/json", "x-goog-api-key": KEY})
    with urllib.request.urlopen(req, timeout=300) as r:
        return json.load(r)


os.makedirs(OUT, exist_ok=True)
jobs = [l.split() for l in open(LIST, encoding="utf-8") if l.strip() and not l.startswith("#")]
done = fail = 0
tokens = 0
for country, vid in jobs:
    if done >= LIMIT:
        break
    path = os.path.join(OUT, f"{country}_{vid}.json")
    if os.path.exists(path):
        continue
    for attempt in range(3):
        try:
            res = call(vid)
            text = res["candidates"][0]["content"]["parts"][0]["text"]
            usage = res.get("usageMetadata", {})
            tokens += usage.get("totalTokenCount", 0)
            json.dump({"country": country, "url": f"https://youtu.be/{vid}", "model": MODEL,
                       "usage": usage, "analysis": json.loads(text)},
                      open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
            done += 1
            print(f"ok {country} {vid} tokens={usage.get('totalTokenCount')}", flush=True)
            break
        except urllib.error.HTTPError as e:
            msg = e.read().decode(errors="replace")[:300]
            print(f"http {e.code} {vid}: {msg}", flush=True)
            if e.code in (429, 500, 503):
                time.sleep(20 * (attempt + 1))
                continue
            fail += 1
            break
        except Exception as e:  # JSON 깨짐 등
            print(f"err {vid}: {e}", flush=True)
            time.sleep(5)
    else:
        fail += 1
print(f"끝: 성공 {done} · 실패 {fail} · 토큰 합계 {tokens}")
