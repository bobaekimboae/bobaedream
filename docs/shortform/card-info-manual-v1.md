# 숏폼 카드 정보 기법 매뉴얼 v1 (card-info-v1)

작성: 클로드 시안 마스터 (Claude Opus 5.5) · 2026-11-26
노션 지시: 「숏폼 카드정보 샘플 제작 및 숏폼 콘텐츠 아이디어 내기」 (424ee9c4b606809c9f29da537eba5c20)

## 1. 무엇인가

매물 영상 중간에 **독립 카드 컷**을 끼워, 엔카에서 웹·앱으로 하나씩 눌러 봐야 하는 정보(성능점검·보험이력·옵션 등)를 숏폼 한 번 시청으로 요약한다. 카드는 오토스카우트24 상세 페이지 문법(흰 카드 · 아이콘 타일 · 작은 회색 라벨 + 굵은 값)을 쓰고, 색·자막·칩·효과음은 벨기에판 잠금 규칙(`scripts/shortform/be_locked_rules.json`)을 그대로 따른다.

**원칙: 같은 데이터 → 같은 영상.** 사람이 손으로 꾸미지 않는다. 카드 데이터(JSON)만 채우면 어떤 에이전트도 명령 한 줄로 같은 결과를 낸다.

## 2. 파일

| 파일 | 역할 |
|---|---|
| `scripts/shortform/card_info/card_spec.json` | 카드 규격 단일 기준(배치 px · 시간 · 효과음 · 음량 · 데이터 규칙). 값은 여기만 고친다 |
| `scripts/shortform/card_info/card_template.html` | 카드 그리는 템플릿(유형별 조립 · `seek(t)`로 프레임 상태) |
| `scripts/shortform/card_info/card_render.py` | 렌더러(프레임 캡처 → FFmpeg · 효과음/배경음 믹스 · 2단계 음량 맞춤 · 검사 보고서) |
| `scripts/shortform/card_info/samples/g400d/cards.json` | 샘플 데이터(벤츠 G400d, 차란차) + 사진 19장 |
| `scripts/shortform/card_info/samples/g80/cards.json` | 「추가 옵션」 샘플(제네시스 G80 RG3, 선택옵션 6개) |
| `scripts/shortform/card_info/icons/` | Tabler 선 아이콘(MIT, `LICENSE-tabler.txt`) |
| 칩 | `video_listing/g350_v5_lib.chip()` 그대로 — G350 v13과 같은 노션 원본 붓칠 판 |
| 카드 효과음 | `photo_listing/option_visual_rules.json → layout.card_sfx`(card-sfx-rules-v1) 그대로 |

## 3. 만드는 법 (명령 3개)

```bash
# 카드 유형별 샘플 영상(카드마다 mp4 하나)
python3 scripts/shortform/card_info/card_render.py samples/g400d/cards.json --out out/g400d
# 일부만
python3 scripts/shortform/card_info/card_render.py samples/g400d/cards.json --only inspection,insurance
# 첫 화면 + 카드 묶음 + 끝 로고 한 편(montage.mp4)
python3 scripts/shortform/card_info/card_render.py samples/g400d/cards.json --montage
```

필요: Playwright(chromium) · ffmpeg · `rsvg-convert`(librsvg2-bin, 칩 렌더). 결과 폴더에 `report.json`(길이 · 효과음 시각 · LUFS · 진짜 피크 · 카드 아래끝 px · 통과 여부)이 함께 나온다.

## 4. 카드 유형 (v1 = 12종)

| 유형 key | 렌더 형식 | 데이터 원천(차란차 기준) | 비면 |
|---|---|---|---|
| 차량 정보 `car_info` | `kv_grid` 2열 6칸 + 차명·가격 | carBasicInfo · jato-specs(변속 단수) | 줄 생략 |
| 앞·옆·뒤 `photo_scroll` | `photo_strip` 사진 5장 가로 스크롤 | buy-cars/{id}/images (차대번호 라벨 사진 제외) | 4장 미만이면 생략 |
| 성능점검 `inspection` | `check_list` | 성능·상태점검기록부(외부 링크 · 체크 판독) | 기록부 없으면 생략 |
| 보험이력 `insurance` | `big_stats` 2개 + 칩 | summary-info.insurance | 생략 |
| 옵션 정보 `options` | `icon_grid` 4×3 + 장착 개수 | main-options · group-options | 생략 |
| 추가 옵션 `extra_options` | `price_list` + 합계 | choice-options | **0건이면 생략**(G400d는 0건 → G80으로 샘플) |
| 차량 특징 `features` | `big_stats` 4개 + 칩 | jato-specs(마력·토크·0→100·최고속·타이어) | 생략 |
| 연비 `fuel` | `bars` 도심·복합·고속 | jato-specs(complexGasMileage 등) | 생략 · 전기차는 전비 |
| 보증·리콜 `warranty` | `check_list` | 보증정보 + 기록부(보증유형·리콜·검사기간) | 생략 |
| 시세 위치 `price` | `range_bar` + 신차 대비 | market-prices · jato price | 생략 |
| 판매자 설명 `seller` | `quote` 3줄 | description(사실만 요약) | 원문이 기본정보 반복이면 확인된 사실만 |
| 한눈에 요약 `summary` | `check_list` 5줄 | 위 카드 값 재사용 | — |

몽타주 순서(기본): `hook → car_info → photo_scroll → inspection → insurance → options → features → fuel → warranty → price → seller → summary → end` (G400d 47.3초).

## 5. 화면 규격 (card_spec.json 요약)

- 캔버스 1080×1920 · 30fps
- 배경: 그 카드와 관련된 매물 사진을 흐리게 키운 채움(블러 30 · 밝기 0.5 · 느린 확대 1.12→1.18). 원본 보정·배경 바꾸기 금지
- 카드 제목: 노랑 붓칠 칩(70px, 기울기 0) 왼쪽 40 · 중심 y300, 팝 0.22초
- 카드: 흰색 · 모서리 44 · 왼쪽 60 · 폭 960 · 위 390 · **아래끝 ≤ 1180**(자막 자리 침범 금지, 보고서 `panel_ok`) · 안쪽 46
- 줄: 0.5초부터 차례로(유형별 간격 0.07~1.25초) 0.28초 동안 28px 위로 떠오름 · 숫자는 0.7초 카운트업 · 마지막 줄 뒤 1.4초 머묾
- 줄이 6개 이상인 체크 목록은 보조 설명을 주의 줄에만(카드 높이 제한)
- 말 자막: 흰 글자+그림자 60px · 가운데 y1283 · 핵심 낱말만 노랑 · 줄이 켜질 때 뜻 단위 한 문장(최대 2줄)으로 바로 바뀜 · 컷 끝 0.3초 비움
- 노랑은 한 종류(#F5F200)만: 칩 · 주의 줄 표시 · 강조 막대 · 자막 핵심어. 빨강·초록 등 다른 강조색 없음
- 첫 화면(hook): 차 전체 3/4 실사 + 벨기에 원본 판 브랜드 칩 + 흰 모델명 + 「연식 · 연료 · 코드네임」(2.4초)
- 끝: 보배드림 로고가 커지며 2초, 효과음 없음

## 6. 효과음 · 음량

- 차량 정보 카드: 머리 `card_engine_start`, 줄마다 card-sfx 규칙 소리(달력·주행·주유·기어·엔진·스프레이)
- 그 밖: 제목 `ding` · 양호 `check`(최대 2) · 주의 `impact` · 큰 숫자 첫 칸 `ding` · 아이콘 격자 `pop` · 합계 `coin` · 사진 넘김 `whoosh` · 막대 `pop/click`
- 간격: 최소 0.3초 · 같은 소리 0.6초 · 카드당 최대 5개(차량 정보 카드만 7) · 몽타주에서 카드가 바뀌는 컷은 `whoosh`
- 배경음 `bobae_showroom_v1.mp3`(0.16) → 2단계 loudnorm −14 LUFS · 리미터 → 진짜 피크 −1.5 dBTP 목표. 짧은 컷에서 선형 맞춤이 실패하면 동적 모드로 다시

## 7. 데이터 규칙 (지키지 않으면 출고 금지)

1. 카드 값은 매물 원천에서 읽은 값만. 비면 그 줄·그 카드를 뺀다(지어내기 금지).
2. 「무사고」 금지. 성능점검은 기록부 표기 그대로(「사고이력 『없음』 표기」) — 출처 줄을 카드 아래에.
3. 차량번호·차대번호·전화번호·딜러 개인 연락처는 카드·자막에 쓰지 않는다. 사진 속 번호판은 가리지 않는다. 차대번호가 찍힌 사진(라벨)은 쓰지 않는다.
4. 리콜 미이행·단순수리처럼 불리한 사실도 그대로(노랑 = 주의해서 볼 곳).
5. 시세·신차가처럼 추정 값은 카드 안에 출처를 작게 적는다.
6. 시트색처럼 원천에 없는 값을 사진으로 확인했으면 「사진 기준」이라고 적는다.

## 8. 검사 (보고서 report.json)

- 길이 · LUFS(−14±1) · 진짜 피크(≤ −1.5) · 카드 아래끝(≤1180) · 효과음 목록
- 사람 눈 검사: 카드별 마지막 프레임 접촉 시트로 글자 잘림·겹침·사실 오류 확인

## 9. 다음 판(v2) 후보

- 내레이션(일레븐랩스 1회 생성)과 자막 낱말 강조 맞춤 — 지금은 자막만
- 카탈로그 옵션 신차가 확대 컷(제원 DB의 등급 가격표가 있어야 함)
- 전기차 전비·충전 카드, 충전 효과음(card-sfx 규칙의 빈칸)
- 데이터 입력: 구글 시트 → cards.json 변환 스크립트

---

## 10. 2차(card-info-v2, 2026-11-26) — 순서 고정 · 차량 이력 타임라인 · 차량 편집에 끼우기

노션 2차 제안: 「엔카 매물정보 있는 카드정보들은 항목 기본 순서로 잡자 … 신규추가는 국토부의 차량이력 타임라인 … 이 카드는 필수가 아닌 매물에 따라 한개부터 여러개까지 차량 편집에 포함된다」

### 10-1. 카드 순서(고정, `card_spec.card_order`)

| 순서 | 카드 | key | 구분 |
|---|---|---|---|
| 1 | 차량 정보(차량 기본정보) | `car_info` | 엔카 기본 순서 |
| 2 | 성능 점검 | `inspection` | 엔카 기본 순서 |
| 3 | 보험 이력 | `insurance` | 엔카 기본 순서 |
| 4 | 차량 이력 타임라인 **(신규)** | `timeline` | 엔카 기본 순서 |
| 5 | 옵션 정보 | `options` | 우리 카드 |
| 6 | 추가 옵션 | `extra_options` | 우리 카드 |
| 7 | 차량 특징 | `features` | 우리 카드 |
| 8 | 판매자 설명 | `seller` | 우리 카드 |

v1 보조 카드(앞·옆·뒤 · 연비 · 보증·리콜 · 시세 · 한눈에 요약)는 2차 기본 목록에서 뺐다. 시세 카드는 시세 위젯 반복값 문제로 출처 확인 전까지 보류.

### 10-2. 고르기 규칙(`card_spec.selection`)

- 카드는 필수가 아니다. 데이터가 있는 카드만 후보(빈 카드·정형 문구 카드 금지).
- 후보가 한도보다 많으면 `priority`(성능 점검 → 보험 이력 → 타임라인 → 차량 정보 → 옵션 → 추가 옵션 → 특징 → 판매자) 순서로 고르고, **화면에는 항상 10-1 순서**로 보여 준다.
- 한도: 30초 편집 2개 · 45초 4개 · 60초 6개(`max_cards_by_length`), 또는 `--max N`, 또는 `--cards a,b`로 직접.
- G400d 결과: 추가 옵션(선택옵션 0건)·판매자 설명(정형 문구뿐) 자동 제외 → 최대 6장.

### 10-3. 차량 편집에 끼우기(`card_edit.py`)

순서: 첫 화면 → 바깥 사진(옆·뒤·휠) → **[카드 묶음]** → 실내 사진(대시보드·시트) → 끝 로고. 컷이 바뀔 때 휙.

```bash
python3 scripts/shortform/card_info/card_edit.py samples/g400d/cards.json --max 1 --name edit_1card      # 카드 1장
python3 scripts/shortform/card_info/card_edit.py samples/g400d/cards.json --length 45s --name edit_4cards # 4장
python3 scripts/shortform/card_info/card_edit.py samples/g400d/cards.json --plan                         # 고르기만
```

사진 컷(`type: photo`): 사진 전체(자르지 않음)를 가로 꽉 차게, 세로 중심 y860(아래끝이 자막 칸 위) · 흐린 채움 · 2.2초 · 1.00→1.05 확대 · 칩 = 부위 이름. 데이터는 `edit_photos`(부위 → 사진)·`edit_photo_cards`(칩·자막).

### 10-4. 차량 이력 타임라인(`type: timeline`)

- 세로 선 + 날짜 점 + 「날짜 / 사건 / 보조」. 주의 사건(보험처리 등)만 노랑 점·노랑 표시.
- **날짜가 확인된 사건만**, 3개 이상일 때만 만든다. 날짜 모르는 사건(소유자 변경 날짜 등)은 넣지 않고 보험 카드 칩에 횟수만.
- 국토부 자동차365 이력은 소유자 본인 조회가 필요해 지금은 연동하지 않았다. 그래서 카드 제목은 「차량 이력」, 출처 줄에 「성능점검기록부 · 보험이력 요약 기준 (국토부 자동차365 연동 전)」을 적는다. 연동되면 `national_registry: true`로 바꾸고 제목·출처를 바꾼다.
- G400d: 2021.05.04 최초 등록 · 2022.02.09 내 차 보험처리 1회(수리(견적)비 839,280원) · 2025.05.04 검사 유효기간 시작(~2027.05.03) · 2026.10.30 성능·상태점검(33,288km).

### 10-5. 다른 에이전트 의견 반영

- 보험: 「보험금」이 아니라 「수리(견적)비 839,280원」, 자료 제공일 2026.11.12 / 확인일 2026.11.26 분리(코덱스).
- 성능 점검: 점검자 의견 「운전석 앞문·쿼터 도장수리」 추가, 리콜은 「기록부(10.30) 기준」으로 시점 표시, 출처 줄에 점검일·점검 주행(33,288km).
- 시세 카드 보류, 판매자 설명은 정형 문구라 생략(빈 카드 금지).
- 남은 차이: 차란차 `firstRegisteredAt` 2021-05-01 ↔ 기록부 최초등록일 2021-05-04 — 카드는 기록부 값을 쓴다.
