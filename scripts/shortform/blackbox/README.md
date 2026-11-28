# 보배드림 블랙박스 제보 릴스 자동 편집 키트 (B안, 2026-11-28)

인스타 담당자가 **원장(JSON) 하나**를 채우면 1080×1920 릴스와 표지가 나온다.

## 지키는 것
- 블랙박스 영상은 원본 그대로: 블러·자르기·컷·소리 분리 없음. 원본 소리는 0.40으로 깐다.
- 화면 값은 `blackbox_layout.json` 한 곳에서만 읽는다(영상 656~1264 가운데, 제목 240~656, 자막 1343, 브랜드 1480/1499, 크레딧 1556).
- 제목 칩은 노션 원본 붓칠 430_239를 같은 배율로만 쓴다(`lockup.py`). 칩 낱말은 3~4글자.
- 목소리: 일레븐랩스 Taek(eleven_v3), 한 번만 생성. 첫 문장은 「~니다」로 끝낸다. 자막 글자는 대본 글자.
- 번호판·개인 연락처·제보자 이름은 원장·자막에 쓰지 않는다. 제보 영상과 렌더 결과는 저장소에 올리지 않는다.

## 순서
1. 제보 영상·대본 준비 → 음성 1회 생성
2. `python3 transcribe.py voice.mp3 words.json` (faster-whisper large-v3-turbo, 시각만 사용)
3. 원장 작성(`samples/s1.json` 참고): `title(chip·rest·line2 · style: onechip|allchip · shape: 원본 이름|auto)`, `source`, `voice`, `words`, `voice_delay_s`, `duration_s`, `chunks`(뜻 단위 1~3어절), `cover_t`, `bgm`, `sfx`
4. `python3 render_blackbox.py 원장.json [--bgm none|파일] [--sfx on|off]`
5. 결과 `out_<id>/bobae_blackbox_<id>.mp4` · `_cover.jpg` · `.plan.json` 확인(소리 −14 LUFS ±1, TP ≤ −1.5 자동 검사)

## 배경음 · 효과음 (오픈소스)
- 기본은 **배경음 없음**(원본 현장음 우선). 넣을 때는 볼륨 0.10, 목소리가 나오면 자동으로 줄어든다(사이드체인).
- 후보 받기: `python3 fetch_bgm.py --out work/bgm --mood tension|calm|alert` → Openverse **CC0·CC BY만**. CC BY 곡은 `bgm_candidates.json`의 `credit` 문구를 게시글에 꼭 넣는다. 받은 곡은 귀로 듣고(가사·목소리 없음) 고른다.
- 저장소에 있는 쓸 수 있는 곡: `public/assets/shortform/bgm/`(자체 제작·Orshot 무료·Kevin MacLeod CC BY — 표기는 그 폴더 README).
- 효과음: `public/assets/shortform/sfx/opensource/`(CC0, 출처 `manifest.json`). 원장 `sfx: [{"t":0.25,"kind":"whoosh"}]` — 종류 whoosh·impact·ding·riser·swipe, 목소리보다 −6dB, 최대 3번, 0.6초 간격. 기본은 제목이 뜰 때 휙 1번.
- 쓰지 않는 것: BY-NC·BY-SA·ND 곡, 다른 앱(캡컷 등) 소리, 상업 이용 조건이 매출 기준으로 걸린 모델(Stable Audio Open)로 만든 소리.
- 직접 만들 경우 후보: ACE-Step 1.5(MIT, GPU 필요) — 시험 전.

## 제목 칩 고르기
- 칩은 모두 **노션 원본 붓칠**(`public/assets/shortform/brush-fill/as24-theme/`) 파일 그대로, 같은 배율만. 직접 그린 상자는 쓰지 않는다. 글꼴은 Pretendard.
- `style`: `onechip`(기본, 첫 낱말만 칩 · 원본 430_239) / `allchip`(모든 줄 칩 · 기본 = 보배드림 기본칩 126_40).
- `shape`: 원본 이름(430_239 · 126_40 · 103_33 · 168_76 · 201_43 · 325_76 · 265_42 · 446_76 · 321_28 · 760_62) 또는 `auto`(줄 비율에 맞는 원본 자동 선택).
- 고르기 시트: `python3 chip_options.py "교차로 신호위반"` → 원본 10개로 그린 한 장(자동 선택 표시). 렌더 때 `--title-style allchip --chip-shape 126_40` 로도 바꿀 수 있다.

## 자막 색·역동 규칙 v1 (2026-11-28, `blackbox_layout.json` → `caption_rules`)
- 기본 흰색 `#FFFFFF`, 지금 말하는 어절 하나만 노랑 `#F5F200`(OpusClip·imgix 카라오케식). 어절 시작에 바로 바뀌고 다음 어절까지 유지, 마지막 어절은 덩어리 끝까지.
- 강조는 한 번에 하나, 덩어리를 넘지 않음. 0.12초 미만 어절은 앞 어절 강조에 합침.
- 역동: 말하는 어절은 1.12배, 바뀌는 순간 0.07초 1.24배로 튀었다 제자리(0.15초 미만 어절은 생략).
- 둘째 화자·원본 영상 대사: 하늘색 `#00FFFF`(BBC 화자 색 순서 흰→노랑→하늘). 작업 파일 `speaker2_words`에 어절 번호.
- 대비: 자막 띠 뒤 배경 평균색 대비 4.5:1 이상(WCAG 1.4.3), 어두운 그림자 유지(G18). 렌더 때 `caption_check.json`에 기록.
- 자막에만 적용. 제목 칩·브랜드·영상제보 줄은 대상 아님.

## 영상제보 줄 (news 틀)
- 「영상제보」(노랑 Bold 26) 아래 한 줄: 인스타 아이콘 + `인스타 DM @bobaedream` · 메일 아이콘 + `bobaedream@bobaedream.co.kr` (Medium 28, 가운데). 아이콘은 저장소 원본 SVG를 120px로 그린 것(`public/assets/shortform/icons/`).
