"""오토스카우트24 쇼츠 분석기 (제미나이 API, 유료 한도용).

유튜브 쇼츠 주소를 제미나이에 직접 넘겨 컷 · 자막 · 효과음 · 음악 · 그래픽 · 대사 · 구성을
JSON 한 덩어리로 받는다. 결과 모양은 2026-11-08 NL·BE 200편 분석(as24all/*.json)과 같다.

실행(깃허브 액션에서): GEMINI_API_KEY 가 환경 변수로 있어야 한다. 키는 코드·로그에 남기지 않는다.
  python3 scripts/shortform/as24_analyze.py <목록.txt> <출력폴더> [모델] [최대편수]
목록.txt 한 줄 = "국가 유튜브ID" (예: "DE dQw4w9WgXcQ"). 이미 결과 파일이 있으면 건너뛴다.
"""
import json, os, subprocess, sys, time, urllib.request, urllib.error

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

# 목록 파일 이름 앞부분으로 분석 종류를 고른다: reviewer-*.txt · dealer-*.txt · 그 밖 = as24
CHANNEL = {
    "style": "오토스카우트24 공식 채널(자막·칩·효과음 디자인 정밀 분석)",
    "as24": "오토스카우트24 공식 채널",
    "reviewer": "이집트 자동차 리뷰어 나사르 헤시엔(Nasser Hessien) 채널, 주로 아랍어(이집트 방언)",
    "dealer": "한국 서울오토갤러리 중고차 딜러가 자기 매물을 올린 채널, 한국어",
}
EXTRA = {
    "style": """
이번 분석의 핵심은 자막·정보 칩·효과음의 디자인 규칙이다. 아래 키를 같은 JSON 안에 반드시 넣어라. 화면 비율은 세로 1080x1920 기준 퍼센트로 적는다.
 "caption_styles": [{"role": "말 자막|키워드 칩|가격 칩|제목|끝 화면|기타","font": "굵기(보통|굵게|아주 굵게)와 모양(세리프 없음 등)","letter_case": "대문자|문장형|혼합",
     "text_color","outline": "없음|검정 외곽선|그림자","outline_px_at_1080": 숫자,"box": "없음|직사각|붓질 모양|둥근 알약","box_color","box_corner_px_at_1080": 숫자,
     "box_padding_pct": 숫자,"text_height_pct": 숫자,"y_pct": 숫자,"x_center_pct": 숫자,"max_lines": 숫자,"words_per_line": 숫자,
     "highlight": "말하는 낱말 색 바꿈|핵심 낱말 박스|없음","highlight_color","in_anim": "바로|톡 튀어나옴(커졌다 작아짐)|아래서 위로|옆에서 밀려옴|페이드|타자",
     "in_ms": 숫자,"out_anim": "바로|페이드|작아짐","stay_sec": 숫자,"count": 이 영상에서 이 역할이 나온 횟수,"sure": 참/거짓}],
 "chip_rules": {"one_at_a_time": 참/거짓,"chip_vs_speech_same_time": 참/거짓,"chip_when": "말하는 낱말과 동시|조금 먼저|조금 뒤","chip_offset_ms": 숫자},
 "sfx_rules": [{"event": "칩 등장|가격 등장|컷 전환|로고·끝 화면|실제 차 소리|기타","sound": "톡|휙|띵|딸깍|쿵|돈 소리|실제 소리|기타","offset_ms_vs_visual": 숫자,"length_ms": 숫자,"loud_vs_voice": "더 큼|비슷|더 작음","count": 숫자}],
 "end_card": {"start_sec","what": "로고|앱 안내|가격|딜러 연락|기타","bg": "노랑 전체|차 위에 겹침|기타","sec": 숫자},
 "safe_zone_note": "인스타·유튜브 버튼에 가리는지와 아래·오른쪽 여백 관찰"
""",
    "reviewer": """
아래 키도 같은 JSON 안에 반드시 넣어라(기능·옵션을 화면에 어떻게 보여 주는지가 이번 분석의 핵심이다).
 "option_highlights": [{"start","end","feature": "기능·옵션 이름(한국어)","shown_how": "3D 아이콘|2D 아이콘|글자 카드|화살표·원 표시|확대|화면 분할|실제 작동 시연|말로만|기타",
     "icon_desc": "아이콘이 무엇을 그렸나(예: 회전하는 3D 시트 아이콘)","x_pct","y_pct","size_w_pct","follows_object": 참/거짓,
     "entrance","sfx_with": "같이 난 효과음","sure"}],
 "hook": {"first_3s": "처음 3초에 보이고 들리는 것(한국어)","type": "가격|질문|숫자·성능|희귀차|감탄·리액션|행동|경품·이벤트|기타","text": "원문","ko": "한국어 뜻"},
 "narration_points": [{"t","point": "말로 설명한 차량 포인트(한국어 한 줄)","category": "디자인|성능|편의|안전|공간|가격·조건|희소성|상태|기타"}],
 "cta": {"t","text","ko","method": "댓글|구독|링크|전화|매장 방문|없음|기타"},
 "shooting": {"location": "전시장|실외|도로 주행|스튜디오|기타","person_role": "리뷰어|딜러|없음","part_order": ["찍은 부위 순서(한국어)"]},
 "speech_style": {"speed": "빠름|보통|느림","words_per_sec": 숫자,"pause_pattern": "문장 사이 쉼 길이와 쉬는 자리 한 줄","tone": "흥분|차분|유머|진지|친근|기타",
     "pitch_moves": "강조할 때 목소리 높낮이·크기 변화 한 줄","emphasis_how": "숫자·기능을 어떻게 힘줘 말하나 한 줄","speaks_to_camera": 참/거짓,
     "sentence_patterns": ["자주 쓰는 문장 틀을 한국어로(예: 「이 차에서 제일 좋은 건 …예요」)"],"filler_words": ["원문 추임새·말버릇"],
     "opening_line": {"text","ko"},"closing_line": {"text","ko"},"caption_vs_speech": "자막이 말과 똑같음|요약|키워드만|자막 없음"},
 "script_beats": [{"t","beat": "훅|질문 던지기|부위 소개|기능 설명|수치|비교|농담·리액션|가격|정리|행동 유도","line_ko": "그 순간 대사 한국어"}]
transcript 는 SRT 자막으로 그대로 쓸 것이다: 말한 문장을 하나도 빠뜨리지 말고 한 줄 = 한 문장(최대 2초~5초), 시작·끝은 실제 발화에 맞춰 0.1초 정밀하게, text 는 들린 그대로 원문, ko 는 자연스러운 한국어.""",
    "dealer": """
아래 키도 같은 JSON 안에 반드시 넣어라(한국 딜러가 직접 만든 매물 영상의 패턴을 뽑는 것이 핵심이다).
 "option_highlights": [{"start","end","feature": "기능·옵션 이름(한국어)","shown_how": "3D 아이콘|2D 아이콘|글자 카드|화살표·원 표시|확대|화면 분할|실제 작동 시연|말로만|기타",
     "icon_desc","x_pct","y_pct","size_w_pct","follows_object": 참/거짓,"entrance","sfx_with","sure"}],
 "hook": {"first_3s": "처음 3초에 보이고 들리는 것","type": "가격|질문|숫자·성능|희귀차|감탄·리액션|행동|사운드(배기음 등)|기타","text"},
 "narration_points": [{"t","point": "말·자막으로 설명한 차량 포인트 한 줄","category": "디자인|성능|편의|안전|공간|가격·조건|희소성|상태·이력|기타"}],
 "dealer_info": {"shown": 참/거짓,"how": "자막|명함 화면|얼굴 출연|목소리|없음","items": ["상사명|이름|전화|위치|가격 등 보인 항목"],"t"},
 "cta": {"t","text","method": "전화|문자|DM|댓글|매장 방문|없음|기타"},
 "shooting": {"location": "전시장 실내|야외 주차장|도로 주행|스튜디오|기타","person_role": "딜러|없음|기타","part_order": ["찍은 부위 순서"],
              "phone_or_camera": "폰|카메라|모름","stabilized": "짐벌|손|고정|모름"},
 "editor_style": {"made_with_guess": "캡컷 템플릿|직접 편집|모름","consistent_brand": "로고·색·자막 틀이 정해져 있나 한 줄"}""",
}
KIND = os.path.basename(LIST).split("-")[0]
KIND = KIND if KIND in EXTRA else "as24"
PROMPT = PROMPT.replace("(오토스카우트24 공식 채널)", f"({CHANNEL[KIND]})").replace('"language": "nl|fr|de|en|기타"', '"language": "nl|fr|de|en|ar|ko|기타"') + EXTRA.get(KIND, "")


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
SAVE_EVERY = int(os.environ.get("SAVE_EVERY", "10"))  # 10편마다 저장소에 올려 진행 상황을 밖에서 볼 수 있게 한다


def save(msg):
    """깃허브 액션에서만: 지금까지 결과를 커밋·푸시(실패해도 분석은 계속)"""
    if not os.environ.get("GITHUB_ACTIONS"):
        return
    br = os.environ.get("GITHUB_REF_NAME", "")
    sh = lambda *a: subprocess.run(list(a), capture_output=True, text=True)
    sh("git", "config", "user.name", "as24-analyze")
    sh("git", "config", "user.email", "actions@users.noreply.github.com")
    sh("git", "add", OUT)
    if sh("git", "diff", "--cached", "--quiet").returncode == 0:
        return
    sh("git", "commit", "-qm", msg)
    for _ in range(3):
        sh("git", "pull", "--rebase", "-q", "origin", br)
        if sh("git", "push", "-q", "origin", f"HEAD:{br}").returncode == 0:
            print(f"saved: {msg}", flush=True)
            return
        time.sleep(5)
def _ts(x):
    x = max(0.0, float(x or 0)); h, r = divmod(int(round(x * 1000)), 3600000); m, r = divmod(r, 60000); sec, ms = divmod(r, 1000)
    return f"{h:02}:{m:02}:{sec:02},{ms:03}"


def write_srt(path, a):
    """대사(transcript)를 원문·한국어 SRT 두 벌로 저장한다(음성 학습·자막 정렬용)"""
    rows = [r for r in (a.get("transcript") or []) if isinstance(r, dict)]
    for key, ext in (("text", "orig"), ("ko", "ko")):
        lines = [f"{i}\n{_ts(r.get('start'))} --> {_ts(r.get('end'))}\n{(r.get(key) or '').strip()}\n"
                 for i, r in enumerate(rows, 1) if (r.get(key) or "").strip()]
        if lines:
            open(path[:-5] + f".{ext}.srt", "w", encoding="utf-8").write("\n".join(lines))


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
            json.dump({"country": country, "kind": KIND, "url": f"https://youtu.be/{vid}", "model": MODEL,
                       "usage": usage, "analysis": json.loads(text)},
                      open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
            write_srt(path, json.load(open(path, encoding="utf-8"))["analysis"])
            done += 1
            print(f"ok {country} {vid} tokens={usage.get('totalTokenCount')}", flush=True)
            if done % SAVE_EVERY == 0:
                save(f"as24 분석 중간 저장 {os.path.basename(OUT)} {done}편 (토큰 {tokens})")
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
save(f"as24 분석 끝 {os.path.basename(OUT)} 성공 {done} 실패 {fail} (토큰 {tokens})")
