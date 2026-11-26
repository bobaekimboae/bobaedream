# 숏폼 「카드 정보」 독립 컷 매뉴얼 v1 (2026-11-26)

매물 정보를 카드 한 장씩 보여 주며 자막으로 요약하는 독립 컷이다. 엔카처럼 상세 화면을 내려 읽게 하지 않고, 숏폼 한 편에서 끝낸다.

## 파일
- 규칙(화면·시간·소리 값): `scripts/shortform/card_info/card_info_rules.json`
- 렌더 코드: `scripts/shortform/card_info/card_info_render.py`
- 입력 예: `scripts/shortform/card_info/samples/g400d_cards.json`
- 샘플 영상: `public/shortform-samples/card-info-v1/bobae_card_info_g400d_v1.mp4` (31.3초, 음성 없음, 내부 확인용)

## 만드는 법
`python3 scripts/shortform/card_info/card_info_render.py 입력.json 출력.mp4`
입력에 「무사고」 같은 판정 낱말, 차량번호·전화번호 모양 글자가 있으면 렌더를 멈춘다.

## 입력 형식
카드마다 `type`(꼬리표) · `title` · `layout`(rows 줄 목록 / big 큰 숫자 + 줄 / chips 알약 묶음) · `source`(출처 한 줄) · `items[{label,value,tone,caption}]`.
`tone`: ok(초록, 「없음」) · warn(주황, 횟수·교환 표기) · muted(회색, 만료·확인 필요). 만들지 않은 카드는 `skipped`에 이유를 적는다.

## 화면 규칙
- 1080×1920, 어두운 바탕 위 흰 카드(반경 36, x 60, y 410, 폭 960). 카드 아래 끝은 1170을 넘기지 않는다.
- 꼬리표는 평면 노랑 `#FAEB00` + 검정 글자 하나만. 카드 컷에는 붓칠 노랑을 쓰지 않는다.
- 줄은 0.9초에 하나씩 뜨고(뜨는 데 0.22초), 뜰 때마다 자막이 그 줄을 한 문장으로 말한다. 자막 높이 1283, 60px 흰 글자 + 그림자.
- 카드가 뜰 때 휙, 줄이 뜰 때 팝. 배경음은 쇼룸. −14 LUFS.
- 끝 2초는 보배드림 로고가 커진다(효과음 없음).

## 사실 규칙
1. 값은 매물 원장 글자 그대로. 원장에 없는 판정(무사고·A등급)은 쓰지 않는다.
2. 값이 없는 유형은 카드를 만들지 않는다.
3. 차량번호·전화번호·딜러 개인 이름은 쓰지 않는다.
4. 카드마다 출처 한 줄을 적는다.
5. 판매자 설명이 상투문이면 카드를 생략한다.

## 카드 유형(v1)
차량 정보 · 가격 · 성능 점검 · 보험 이력 · 옵션 정보 · 보증 · 판매자. (추가 옵션 · 차량 특징 · 판매자 설명은 자료가 있을 때만)

## 아직 안 한 것
음성(내레이션) 연동, 실촬영 컷 사이에 끼우기, check_be.py 검사 연결, 카드 뒤 흐린 차 사진 바탕.

## v1.1 추가 (2026-11-26) — 음성 · 오토스카우트 아이콘
- 음성: 입력의 `voice.file`(음성 파일)과 `voice.words`(낱말 시각, faster-whisper)를 주면 줄이 그 문장을 말하기 시작할 때 뜬다. 음성 문장 수와 카드 줄 수가 다르면 렌더를 멈춘다. 원본 음성 파일은 고치지 않고 섞을 때만 1.15배속(`card_info_rules.json` `voice.tempo`).
- 줄마다 `say`(읽을 문장, 숫자를 한글로)와 `caption`(화면 자막)을 따로 둔다.
- 샘플 음성: ElevenLabs Taehyung · eleven_v3 · 1회 생성(재생성 금지). `samples/g400d_voice.mp3`.
- 아이콘: 줄 앞 40px, 노션 오토스카우트24 원본 SVG만(`public/assets/bbm/detail-icons/`의 AS24 원본, `public/icons/dealer-profile/*-as24.svg`). 파일은 고치지 않고 그릴 때 회색 `#6B7280`만 입힌다. 맞는 원본이 없으면 아이콘 없이 쓴다.
- 샘플 v2: `public/shortform-samples/card-info-v1/bobae_card_info_g400d_v2.mp4` (59.2초).

## v2 (2026-11-26) — 사용자 2차 제안 반영
1. **카드는 필수가 아니다.** 매물에 자료가 있는 유형만 1개부터 여러 개까지 만들고, 차량 편집 컷 사이에 넣는다. 만드는 조건은 `card_info_rules.json`의 `catalog.make_if`.
2. **순서**: 엔카 매물정보에 있는 유형은 엔카 순서 `차량 기본정보 → 성능 점검 → 보험 이력 → 차량 이력`. 그 뒤 우리 유형 `옵션 정보 → 추가 옵션 → 차량 특징 → 판매자 설명`.
3. **새 유형 「차량 이력」**(layout `timeline`): 날짜 · 사건 · 보조 값(주행거리 · 횟수)을 세로 줄에 차례로 찍는다. 날짜가 있는 사건이 2개 이상일 때만 만든다. 국토부 통합이력 원문을 못 받았으면 출처에 그렇게 적는다.
4. **카드별 영상**: `--each 폴더`를 주면 카드마다 따로 한 편씩(끝 로고 없이) 만든다. `--cards 유형1,유형2`로 고를 수도 있다.
   - 전체: `python3 scripts/shortform/card_info/card_info_render.py 입력.json 출력.mp4`
   - 카드별: `python3 scripts/shortform/card_info/card_info_render.py 입력.json x --each 출력폴더`
5. **음성 조각**: 줄마다 `v: [파일, 문장 번호]`. 카드를 빼거나 순서를 바꿔도 음성이 따라온다. 문장 사이 0.18초, 카드 사이 0.35초.
6. 성능 점검 카드는 좋은 판정만 남기지 않는다(단순 수리 · 도장 수리 · 리콜 표기 포함, 기록 날짜를 출처에).
7. 옵션은 장착으로 표시된 것만(이 샘플은 통풍시트가 비활성이라 뺌).
- 입력 v2: `scripts/shortform/card_info/samples/g400d_cards_v2.json`
- 샘플: `public/shortform-samples/card-info-v2/bobae_card_info_g400d_v3_all.mp4`(64초) · `each/card_01~05_*.mp4`(10~17초)
