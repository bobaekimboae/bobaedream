# 숏폼 편집 기법 사전 v0.1.0

> 이 파일은 `build.py`가 `techniques.json`으로 자동으로 만듭니다. 직접 고치지 마세요. 갱신: 2026-11-22

## 용어

- **edition** — 편집 유형 — 어떤 소재로 어떤 성격의 영상을 만드나(4가지). 유형마다 쓸 수 있는 구성·기법이 정해져 있다.
- **segment** — 편집 구성 — 독립된 한 컷(또는 몇 컷) 단위로 끼워 넣는 덩어리. 예: 차량 기본 정보 카드 컷, 배기음 컷.
- **technique** — 편집 기법 — 화면·소리에 거는 효과 하나. 예: 포인트 칩, 휙 넘김, 부위 당기기, 딩 효과음.
- **feature** — 옵션 표시 — 차량 기능(열선·통풍·마사지·메모리 등)을 말할 때 그 부위에 붙는 이모지·3D 글자 표시.
- **asset** — 자산 — 기법이 쓰는 원본 파일(칠 판 SVG, 3D 이모지, 효과음, 배경음악, 글꼴).

## 상태 표시

- **구현**: 코드가 있고 실제 영상에 쓰임
- **일부**: 비슷한 코드는 있으나 확정 규칙과 다름(바꿔야 함)
- **계획**: 정했지만 아직 코드 없음
- **관찰**: AS24·나세르 영상에서 관찰만 함(아직 우리 코드 없음)
- **금지**: 쓰지 않기로 정함

## 편집 유형

| 코드 | 이름 | 소재 | 소리 | 고정 구성 | 상태 |
|---|---|---|---|---|---|
| `ED-PHOTO` | 사진 매물 숏폼 변환 | 매물 사진 + 매물 원장 | 내레이션 + 배경음악 + 효과음 | 1번째 컷 SG-INTRO-EMBLEM / 2번째 컷 SG-CARD-BASIC(2026-11-22 확정) / 끝 SG-END-DEALER | 구현 |
| `ED-SIMPLE` | 실촬영 · 오토스카우트24 벨기에 심플 | 촬영 영상 + 매물 원장 | 내레이션 + 배경음악 + 효과음 | 끝 SG-END-DEALER | 구현 |
| `ED-3D` | 실촬영 · 나세르 3D 효과 | 촬영 영상 + 매물 원장 | 내레이션 + 효과음 | 1번째 컷 SG-INTRO-IMPACT / 끝 SG-END-DEALER | 계획 |
| `ED-ASMR` | ASMR (내레이션 없음) | 소리를 살려 찍은 촬영 영상 + 매물 원장 | 녹음된 원래 소리만(배경음악·효과음 없음 — 사용자 확인 대기) | 끝 SG-END-DEALER | 계획 |

## 편집 구성 (12개)

| 코드 | 분류 | 이름 | 영어 이름 | 영상에서 보이는 모습 | ① 사진 | ② 심플 | ③ 3D | ④ ASMR | 상태 | 코드 위치 |
|---|---|---|---|---|---|---|---|---|---|---|
| `SG-INTRO-EMBLEM` | 첫 화면 | 엠블럼 확대 → 제목 | Emblem zoom title | 0~3초, 차 앞 사진이 확대되며 노랑 칩(제조사) + 흰 큰 모델명 + 아래 한 줄(등록·주행) | ○ |  |  |  | 구현 | `scripts/shortform/photo_listing/common.py:base_frame` |
| `SG-INTRO-IMPACT` | 첫 화면 | 첫 컷 임팩트(로고·모델명 현란 등장) | Logo impact intro | 0~2초, 로고가 튀어나오고 모델명이 글자별로 쌓임, 효과음 동반 |  | ○ | ○ | ○ | 계획 | `` |
| `SG-CARD-BASIC` | 카드 정보 | 차량 기본 정보 카드 | Basic info card | 2번째 컷, 뒤 45° 사진 위 카드, 대사는 등록·주행만 ⚠ 지금은 칩 한 줄(주행 N km)로만 나옴 → 카드로 바꿔야 함 | ○ | ○ | ○ | ○ | 일부 | `scripts/shortform/photo_listing/common.py:icon_chip` |
| `SG-CARD-INSPECT` | 카드 정보 | 성능점검 카드 | Inspection card | 독립 컷 카드 | ○ | ○ | ○ | ○ | 계획 | `` |
| `SG-CARD-INSURE` | 카드 정보 | 보험이력 카드 | Insurance history card | 독립 컷 카드 | ○ | ○ | ○ | ○ | 계획 | `` |
| `SG-CARD-SPEC` | 카드 정보 | 제원 카드 | Spec card | 독립 컷 카드 | ○ | ○ | ○ | ○ | 계획 | `` |
| `SG-CATALOG` | 카탈로그 | 카탈로그 컷 | Catalog insert | 실차 사진이 아닌 깨끗한 공식 사진, 위에 작은 「제조사 이미지」 꼬리표 | ○ | ○ | ○ |  | 일부 | `scripts/shortform/photo_listing/common.py:official_layer` |
| `SG-DEALER-TALK` | 딜러 | 딜러 설명 컷 | Dealer talk cut | 사람 얼굴이 나오고 가슴 높이에 이름표 |  | ○ | ○ |  | 계획 | `` |
| `SG-EXHAUST` | 소리 | 배기음 컷 | Exhaust sound cut | 뒤쪽·배기구 장면, 🔊 또는 「V8 배기음」 칩, 음악 꺼짐 |  | ○ | ○ | ○ | 관찰 | `` |
| `SG-ODOMETER` | 신뢰 | 계기판 주행거리 확인 | Odometer proof | 계기판 확대, 주행거리 숫자 뒤 노랑 원형 칠 + 숫자 칩 ⚠ 지금은 코드로 그린 손그림 선 원(mileage_circle) → 노션 원형 칠로 바꿔야 함(2026-11-22 확정) | ○ | ○ |  |  | 일부 | `scripts/shortform/photo_listing/common.py:odometer_layer` |
| `SG-SECTION` | 구성 | 구간 제목 | Section title | 화면 위 작은 글자 띠 | ○ |  |  |  | 구현 | `scripts/shortform/photo_listing/common.py:section_layer` |
| `SG-END-DEALER` | 마무리 | 딜러 엔딩 · 앱 안내 | Dealer end card | 끝 2초, 로고가 작게→크게 | ○ | ○ | ○ | ○ | 구현 | `scripts/shortform/photo_listing/common.py:overlay` |

## 편집 기법 (44개)

| 코드 | 분류 | 이름 | 영어 이름 | 영상에서 보이는 모습 | ① 사진 | ② 심플 | ③ 3D | ④ ASMR | 상태 | 코드 위치 |
|---|---|---|---|---|---|---|---|---|---|---|
| `CAP-KARAOKE` | 자막 | 말 자막(낱말 따라 색 바뀜) | Word-by-word caption | 화면 아래쪽 흰 글자 + 검정 테두리, 한 낱말씩 노랑 | ○ | ○ | ○ |  | 구현 | `scripts/shortform/sag_reel_v1.py:phrase_img_be3` |
| `CAP-HOOK-TITLE` | 자막 | 첫 화면 제목 | Hook title | 첫 3초 가운데 위 | ○ | ○ | ○ | ○ | 구현 | `scripts/shortform/photo_listing/common.py:base_frame` |
| `CAP-ASMR-WORD` | 자막 | ASMR 낱말 칩 | ASMR word chip | 소리 장면마다 칩 하나 |  |  |  | ○ | 계획 | `` |
| `CHIP-POINT` | 칩 | 포인트 칩 | Point chip | 화면 위쪽 고정 자리 노랑 칠 판, 기울기 없음 ⚠ 규칙 파일은 아직 붓 테이프 + 5.7° 기울기 → 기울기 없는 칠 판으로 바꿔야 함(2026-11-22 확정) | ○ | ○ | ○ |  | 일부 | `scripts/shortform/photo_listing/common.py:be_chip` |
| `CHIP-NUMBER` | 칩 | 큰 숫자 칩 | Big number chip | 화면 28% 높이 큰 숫자 칩 | ○ | ○ | ○ |  | 구현 | `scripts/shortform/photo_listing/common.py:is_num_chip` |
| `CHIP-ICON3D` | 칩 | 칩 옆 3D 아이콘 | Chip 3D icon | 칩 오른쪽 입체 아이콘 | ○ | ○ | ○ |  | 구현 | `scripts/shortform/photo_listing/common.py:icon_chip` |
| `CHIP-DEALER` | 칩 | 딜러 칩 · 하단 띠 | Dealer chip / footer | 왼쪽 위 흰 알약 로고 또는 아래 띠 | ○ | ○ | ○ | ○ | 구현 | `scripts/shortform/photo_listing/common.py:footer_layer` |
| `CHIP-TAG` | 칩 | 부위 꼬리표 | Part tag | 부위 옆 작은 칩 | ○ | ○ |  |  | 구현 | `scripts/shortform/photo_listing/common.py:tag_layer` |
| `CHIP-PRICEDROP` | 칩 | 가격 인하 칩 | Price drop chip | 가격 칩 두 줄, 위 줄 X | ○ | ○ | ○ | ○ | 관찰 | `` |
| `LIST-CHECK` | 목록 | 옵션 체크 목록 | Checklist stack | 칩 아래 ✓ 줄이 하나씩 늘어남 ⚠ 실촬영(T02)만 구현, 사진판은 아직 | ○ | ○ | ○ |  | 일부 | `scripts/shortform/video_listing/feature_edit_planner.py` |
| `MARK-POINTER` | 기호 | 손가락·화살표 포인터 | Pointer | 부위로 날아와 톡 누르는 손가락 | ○ | ○ | ○ |  | 구현 | `scripts/shortform/photo_listing/common.py:pointer_layer` |
| `MARK-DIM-LINE` | 기호 | 치수선 | Dimension line | 차 옆 <---> 화살표 + 숫자 | ○ | ○ |  |  | 구현 | `scripts/shortform/photo_listing/common.py:dim_layer` |
| `MARK-RED-X` | 기호 | 빨강 X 부정 | Red X | 빨강 X |  |  |  |  | 관찰 | `` |
| `MARK-SPARKLE` | 기호 | 반짝이 | Sparkle | 반짝이 ⚠ be_locked_rules user_locked: 반짝임 금지 |  |  |  |  | 금지 | `` |
| `MARK-LOOSE-EMOJI` | 기호 | 따로 뜨는 이모지 스티커 | Loose emoji sticker | 화면 빈 곳 이모지 ⚠ 2026-11-19 사용자: 칩 옆 3D 아이콘은 좋지만 따로 뜨는 스티커는 안 됨 |  |  |  |  | 금지 | `` |
| `FX-TEXT3D` | 3D | 3D 글자 | 3D text | 부위 위 두꺼운 입체 글자 | ○ | ○ | ○ |  | 구현 | `scripts/shortform/photo_listing/common.py:text3d` |
| `FX-NUMBER3D` | 3D | 숫자 화면 표기 | On-screen number | 칩 아래 가운데 3D 숫자 | ○ | ○ | ○ |  | 구현 | `scripts/shortform/photo_listing/auto_visuals.py:_numbers_on_screen` |
| `FX-CALLOUT-3D` | 3D | 부위 3D 말풍선 | 3D callout | 부위에서 선이 나와 말풍선 |  |  | ○ |  | 계획 | `scripts/shortform/egypt_3d_callout_sample.py:draw_callout` |
| `MOVE-KENBURNS` | 움직임 | 켄번스 | Ken Burns | 정지 사진이 천천히 다가오거나 옆으로 흐름 | ○ |  |  |  | 구현 | `scripts/shortform/photo_listing/common.py:frame_of` |
| `MOVE-PARTZOOM` | 움직임 | 부위 당기기 | Part push-in | 계기판·화면·시트로 화면이 다가감 | ○ |  |  |  | 구현 | `scripts/shortform/photo_listing/part_zoom.py:build` |
| `MOVE-FIT-BLURFILL` | 움직임 | 차 전체 맞춤 + 흐린 채움 | Fit with blurred fill | 가운데 선명한 가로 사진, 위아래 흐림 | ○ |  |  |  | 구현 | `scripts/shortform/photo_listing/common.py:fit_frame` |
| `MOVE-PUNCH` | 움직임 | 펀치 확대 | Punch zoom | 화면이 툭 커짐 | ○ |  |  |  | 구현 | `scripts/shortform/photo_listing/common.py:punch` |
| `MOVE-JUMPCUT` | 움직임 | 점프컷 | Jump cut | 같은 장면이 단계별로 커짐 |  | ○ | ○ |  | 구현 | `scripts/shortform/video_listing/feature_edit_planner.py` |
| `MOVE-COUNTUP` | 움직임 | 숫자 카운트업 | Count up | 숫자가 빠르게 증가 ⚠ 실촬영만 | ○ | ○ | ○ |  | 일부 | `scripts/shortform/video_listing/feature_edit_planner.py` |
| `MOVE-SHAKE` | 움직임 | 마력 흔들림 | Power shake | 화면 떨림 |  | ○ | ○ |  | 구현 | `scripts/shortform/video_listing/feature_edit_planner.py` |
| `MOVE-TRACK` | 움직임 | 부위 따라가기 | Motion tracking | 칩이 부위와 함께 움직임 |  | ○ | ○ |  | 일부 | `scripts/shortform/video_listing/g350_track.py` |
| `TR-WHIP` | 컷 넘김 | 휙 넘김(좌·우) | Whip pan | 옆으로 번지며 넘어감 | ○ |  |  |  | 구현 | `scripts/shortform/photo_listing/common.py:_base_frame` |
| `TR-PUSH-UP` | 컷 넘김 | 위로 밀기 | Push up | 아래에서 다음 장면이 올라옴 | ○ |  |  |  | 구현 | `scripts/shortform/photo_listing/common.py:_base_frame` |
| `TR-ZOOM` | 컷 넘김 | 확대 넘김 | Zoom transition | 빨려 들어가며 넘어감 | ○ |  |  |  | 구현 | `scripts/shortform/photo_listing/common.py:_base_frame` |
| `TR-FLASH` | 컷 넘김 | 흰 섬광 | Flash | 하얗게 번쩍 | ○ |  |  |  | 구현 | `scripts/shortform/photo_listing/common.py:_base_frame` |
| `TR-BLUR` | 컷 넘김 | 흐림 교차 | Blur dissolve | 흐려지며 바뀜 | ○ |  |  |  | 구현 | `scripts/shortform/photo_listing/common.py:_base_frame` |
| `TR-FADE` | 컷 넘김 | 페이드(페이드판) | Cross fade | 부드럽게 겹치며 바뀜 | ○ |  |  |  | 구현 | `scripts/shortform/photo_listing/common.py:_base_frame` |
| `TR-CUT` | 컷 넘김 | 바로 자르기 | Hard cut | 즉시 바뀜 |  | ○ |  | ○ | 구현 | `scripts/shortform/video_listing/g350_v8_render.py` |
| `TR-SPLIT2` | 컷 넘김 | 위아래 2분할 | Split screen | 가운데 흰 선으로 위아래 두 장면 |  | ○ | ○ |  | 구현 | `scripts/shortform/video_listing/feature_edit_planner.py` |
| `INS-MAGNIFIER` | 화면 삽입 | 돋보기 원 | Magnifier | 동그란 확대 창 | ○ | ○ | ○ |  | 일부 | `scripts/shortform/video_listing/feature_edit_planner.py` |
| `INS-SPOTLIGHT` | 화면 삽입 | 스포트라이트 | Spotlight | 주변이 어두워지고 라이트만 밝음 |  | ○ | ○ |  | 구현 | `scripts/shortform/video_listing/feature_edit_planner.py` |
| `SFX-DING` | 효과음 | 딩 | Ding | (소리) 맑은 딩 ⚠ 2026-11-22 확정: 효과음 모두 냄(실촬영 1번 제한 폐지) → 규칙 파일 바꿔야 함 | ○ | ○ | ○ |  | 구현 | `scripts/shortform/photo_listing/common.py:_sfx_plan` |
| `SFX-WHOOSH` | 효과음 | 휙 | Whoosh | (소리) 바람 소리 | ○ | ○ | ○ |  | 구현 | `scripts/shortform/photo_listing/common.py:_sfx_plan` |
| `SFX-POP` | 효과음 | 팝 | Pop | (소리) 톡 | ○ | ○ | ○ |  | 구현 | `scripts/shortform/photo_listing/common.py:_sfx_plan` |
| `SFX-CLICK` | 효과음 | 클릭 | Click | (소리) 딸깍 | ○ | ○ | ○ |  | 구현 | `scripts/shortform/photo_listing/common.py:_sfx_plan` |
| `SFX-CONTEXT` | 효과음 | 문맥 효과음 | Context SFX | (소리) 말 울음 등 | ○ | ○ | ○ |  | 일부 | `scripts/shortform/video_listing/feature_edit_planner.py` |
| `BGM-SHOWROOM` | 음악·음성 | 배경음악 + 말할 때 줄이기 | BGM with ducking | (소리) 잔잔한 음악 | ○ | ○ | ○ |  | 구현 | `scripts/shortform/photo_listing/common.py:mix_audio` |
| `VO-TTS` | 음악·음성 | AI 내레이션 | TTS voice | (소리) 내레이션 ⚠ 같은 결과가 필요하면 녹음 파일을 매물 폴더에 보관 | ○ | ○ | ○ |  | 구현 | `scripts/shortform/photo_listing/tr.py` |
| `AUD-LOUDNORM` | 음악·음성 | 음량 맞춤 | Loudness | (측정값) | ○ | ○ | ○ | ○ | 구현 | `scripts/shortform/photo_listing/common.py:mix_audio` |

## 옵션 표시 (19개)

| 코드 | 분류 | 이름 | 영어 이름 | 영상에서 보이는 모습 | ① 사진 | ② 심플 | ③ 3D | ④ ASMR | 상태 | 코드 위치 |
|---|---|---|---|---|---|---|---|---|---|---|
| `FM-SCREEN` | 옵션 표시 | 화면 | screen | 👆 + 3D 글자 {size}" | ○ | ○ | ○ |  | 구현 | `scripts/shortform/photo_listing/auto_visuals.py:build` |
| `FM-WHEEL` | 옵션 표시 | 휠 | wheel | 3D 글자 {inch}" | ○ | ○ | ○ |  | 구현 | `scripts/shortform/photo_listing/auto_visuals.py:build` |
| `FM-SEAT-HEAT` | 옵션 표시 | 열선 | seat_heat | 🔥 + 「열선」 | ○ | ○ | ○ |  | 구현 | `scripts/shortform/photo_listing/auto_visuals.py:build` |
| `FM-SEAT-VENT` | 옵션 표시 | 통풍 | seat_vent | ❄️ + 「통풍」 | ○ | ○ | ○ |  | 구현 | `scripts/shortform/photo_listing/auto_visuals.py:build` |
| `FM-SEAT-MASSAGE` | 옵션 표시 | 마사지 | seat_massage | 💆 + 「마사지」 | ○ | ○ | ○ |  | 구현 | `scripts/shortform/photo_listing/auto_visuals.py:build` |
| `FM-SEAT-MEMORY` | 옵션 표시 | 메모리 시트 | seat_memory | 💾 + 「메모리」 | ○ | ○ | ○ |  | 구현 | `scripts/shortform/photo_listing/auto_visuals.py:build` |
| `FM-SEAT-MATERIAL` | 옵션 표시 | 시트 재질 | seat_material | 3D 글자 {material} | ○ | ○ | ○ |  | 구현 | `scripts/shortform/photo_listing/auto_visuals.py:build` |
| `FM-CAMERA` | 옵션 표시 | 카메라 | camera | 📷 + 「{camera}」 | ○ | ○ | ○ |  | 구현 | `scripts/shortform/photo_listing/auto_visuals.py:build` |
| `FM-CLIMATE` | 옵션 표시 | 공조 | climate | 🌬️ + 「{zones}존」 | ○ | ○ | ○ |  | 구현 | `scripts/shortform/photo_listing/auto_visuals.py:build` |
| `FM-TRUNK` | 옵션 표시 | 트렁크 | trunk | 3D 글자 {liters} L | ○ | ○ | ○ |  | 구현 | `scripts/shortform/photo_listing/auto_visuals.py:build` |
| `FM-LIGHT` | 옵션 표시 | 라이트 | light | 3D 글자 {light_type} | ○ | ○ | ○ |  | 구현 | `scripts/shortform/photo_listing/auto_visuals.py:build` |
| `FM-WIRELESS-CHARGE` | 옵션 표시 | 무선충전 | wireless_charge | ⚡ + 「무선충전」 | ○ | ○ | ○ |  | 구현 | `scripts/shortform/photo_listing/auto_visuals.py:build` |
| `FM-SPEAKER` | 옵션 표시 | 스피커 | speaker | 3D 글자 {brand} | ○ | ○ | ○ |  | 구현 | `scripts/shortform/photo_listing/auto_visuals.py:build` |
| `FM-ENGINE` | 옵션 표시 | 엔진·마력 | engine | 3D 글자 {hp} 마력 | ○ | ○ | ○ |  | 구현 | `scripts/shortform/photo_listing/auto_visuals.py:build` |
| `FM-SUNROOF` | 옵션 표시 | 선루프 | sunroof | 3D 글자 파노라마 | ○ | ○ | ○ |  | 구현 | `scripts/shortform/photo_listing/auto_visuals.py:build` |
| `FM-AMBIENT` | 옵션 표시 | 앰비언트 | ambient | 3D 글자 {colors}색 | ○ | ○ | ○ |  | 구현 | `scripts/shortform/photo_listing/auto_visuals.py:build` |
| `FM-HUD` | 옵션 표시 | HUD | hud | 3D 글자 HUD | ○ | ○ | ○ |  | 구현 | `scripts/shortform/photo_listing/auto_visuals.py:build` |
| `FM-SEAT-BUNDLE` | 옵션 표시 | 시트 묶음(재질 + 열선·통풍·마사지·메모리) | fm-seat-bundle | 시트 등받이 위에 🔥❄️💆💾 한 줄 + 재질 3D 글자 | ○ | ○ | ○ |  | 구현 | `scripts/shortform/photo_listing/auto_visuals.py:_seat_bundle` |
| `FM-CLIMATE-BUNDLE` | 옵션 표시 | 공조 묶음 | fm-climate-bundle | 공조 화면 위 🌬️ + N존 | ○ | ○ | ○ |  | 구현 | `scripts/shortform/photo_listing/auto_visuals.py:_climate_bundle` |

## 자산 (9개)

| 코드 | 분류 | 이름 | 영어 이름 | 영상에서 보이는 모습 | ① 사진 | ② 심플 | ③ 3D | ④ ASMR | 상태 | 코드 위치 |
|---|---|---|---|---|---|---|---|---|---|---|
| `AS-PLATE-CHIL-103x33` | 칠 판 | 칠 판 103×33(기울기 없음) | Background shape 103x33 | 노랑 칠 판 ⚠ 노션에만 있음 → public/assets/shortform/ 로 받아 와야 함 | ○ | ○ | ○ |  | 계획 | `` |
| `AS-PLATE-CHIL-38x43` | 칠 판 | 원형 칠 38×43 | Round background shape | 노랑 원형 칠 | ○ | ○ |  |  | 계획 | `` |
| `AS-BRUSH-TAPE` | 칠 판 | 붓 테이프(기울어진 띠) | Brush tape | 기울어진 노랑 붓띠 ⚠ 2026-11-22 칠 판 103×33으로 대체 |  |  |  |  | 금지 | `scripts/shortform/brushfill.py:brush_mask` |
| `AS-FLUENT3D` | 아이콘 | Fluent 3D 이모지 | Microsoft Fluent 3D emoji | 입체 이모지 | ○ | ○ | ○ |  | 구현 | `scripts/shortform/photo_listing/common.py:fluent_emoji` |
| `AS-SFX-DING` | 효과음 | ding.wav | ding |  |  |  |  |  | 구현 | `public/assets/shortform/sfx/ding.wav` |
| `AS-SFX-WHOOSH` | 효과음 | whoosh.wav | whoosh |  |  |  |  |  | 구현 | `public/assets/shortform/sfx/whoosh.wav` |
| `AS-SFX-POP` | 효과음 | pop.wav | pop |  |  |  |  |  | 구현 | `public/assets/shortform/sfx/pop.wav` |
| `AS-SFX-CLICK` | 효과음 | click.wav | click |  |  |  |  |  | 구현 | `public/assets/shortform/sfx/click.wav` |
| `AS-BGM-SHOWROOM` | 음악 | bobae_showroom_v1.mp3 | showroom bgm |  |  |  |  |  | 구현 | `public/assets/shortform/bgm/bobae_showroom_v1.mp3` |

## 해야 할 일 — 상태가 일부·계획인 항목 (18개)

- `SG-INTRO-IMPACT` 첫 컷 임팩트(로고·모델명 현란 등장) — 계획
- `SG-CARD-BASIC` 차량 기본 정보 카드 — 일부: 지금은 칩 한 줄(주행 N km)로만 나옴 → 카드로 바꿔야 함
- `SG-CARD-INSPECT` 성능점검 카드 — 계획
- `SG-CARD-INSURE` 보험이력 카드 — 계획
- `SG-CARD-SPEC` 제원 카드 — 계획
- `SG-CATALOG` 카탈로그 컷 — 일부
- `SG-DEALER-TALK` 딜러 설명 컷 — 계획
- `SG-ODOMETER` 계기판 주행거리 확인 — 일부: 지금은 코드로 그린 손그림 선 원(mileage_circle) → 노션 원형 칠로 바꿔야 함(2026-11-22 확정)
- `CAP-ASMR-WORD` ASMR 낱말 칩 — 계획
- `CHIP-POINT` 포인트 칩 — 일부: 규칙 파일은 아직 붓 테이프 + 5.7° 기울기 → 기울기 없는 칠 판으로 바꿔야 함(2026-11-22 확정)
- `LIST-CHECK` 옵션 체크 목록 — 일부: 실촬영(T02)만 구현, 사진판은 아직
- `FX-CALLOUT-3D` 부위 3D 말풍선 — 계획
- `MOVE-COUNTUP` 숫자 카운트업 — 일부: 실촬영만
- `MOVE-TRACK` 부위 따라가기 — 일부
- `INS-MAGNIFIER` 돋보기 원 — 일부
- `SFX-CONTEXT` 문맥 효과음 — 일부
- `AS-PLATE-CHIL-103x33` 칠 판 103×33(기울기 없음) — 계획: 노션에만 있음 → public/assets/shortform/ 로 받아 와야 함
- `AS-PLATE-CHIL-38x43` 원형 칠 38×43 — 계획

## AS24 관찰 스킬 53개 → 우리 코드 대응표

`edit_skills/library_v2.json`(AS24 네덜란드·벨기에 397편 조사)의 스킬 번호가 우리 표준 이름 어디에 해당하는지. 빈칸은 아직 표준 이름 없음.

| 번호 | 종류 | 관찰 내용 | 우리 코드 |
|---|---|---|---|
| S001 | 칠 | 검정 상자 노랑 이름표 | `CHIP-POINT` |
| S002 | 자막 | 옵션 체크 이름표 | `LIST-CHECK` |
| S003 | 움직임 | 이름표 줄 쌓기 | `LIST-CHECK` |
| S004 | 자막 | 바탕 없는 큰 노랑 숫자 | `CHIP-NUMBER` |
| S005 | 움직임 | 숫자 세기 | `MOVE-COUNTUP` |
| S006 | 칠 | 가운데 큰 숫자 상자 | `CHIP-NUMBER` |
| S007 | 칠 | 수치 칩 | `CHIP-TAG` |
| S008 | 칠 | 노랑 띠 칩 | `CHIP-POINT` |
| S009 | 자막 | 감탄 큰 낱말 |  |
| S010 | 아이콘·기호 | 빨강 X 부정 | `MARK-RED-X` |
| S011 | 아이콘·기호 | 가격 정정 | `CHIP-PRICEDROP` |
| S012 | 효과음 | 소리 스피커 | `SG-EXHAUST` |
| S013 | 아이콘·기호 | 이모지 붙임 | `MARK-LOOSE-EMOJI` |
| S014 | 칠 | 통계 화살표 칩 |  |
| S015 | 아이콘·기호 | 치수 화살표 | `MARK-DIM-LINE` |
| S016 | 움직임 | 호 글자 | `SG-INTRO-IMPACT` |
| S017 | 움직임 | 타자 효과 | `SG-INTRO-IMPACT` |
| S018 | 화면 삽입 | 비교 차 카드 |  |
| S019 | 화면 삽입 | 폰 앱 화면 |  |
| S020 | 아이콘·기호 | 동그라미 강조 | `MARK-POINTER` |
| S021 | 화면 삽입 | 매물 카드 |  |
| S022 | 화면 삽입 | 웹 창 |  |
| S023 | 화면 전환 | 세로 3분할 |  |
| S024 | 움직임 | 칩 교체 |  |
| S025 | 첫 화면 | 퀴즈 첫 화면 |  |
| S026 | 첫 화면 | 판매 중 정보 목록 | `SG-CARD-BASIC` |
| S027 | 첫 화면 | 둘 중 하나 |  |
| S028 | 마무리 | 댓글 유도 |  |
| S029 | 마무리 | 팔로우 유도 |  |
| S030 | 마무리 | 끝 로고 | `SG-END-DEALER` |
| S031 | 아이콘·기호 | 반짝이 | `MARK-SPARKLE` |
| S032 | 첫 화면 | ASMR 표기 | `CAP-ASMR-WORD` |
| S033 | 자막 | 사람 이름표 | `SG-DEALER-TALK` |
| S034 | 아이콘·기호 | 놀람 선 |  |
| S035 | 사람 연출 | 가리키기 | `SG-DEALER-TALK`, `MARK-POINTER` |
| S036 | 사람 연출 | 버튼 누름 클로즈업 |  |
| S037 | 사람 연출 | 덮개 공개 |  |
| S038 | 자막 | 말 자막 대문자형 | `CAP-KARAOKE` |
| S039 | 자막 | 말 자막 문장형 | `CAP-KARAOKE` |
| S040 | 아이콘·기호 | 국기 |  |
| S041 | 첫 화면 | 첫 화면 차명 묶음(공식 차명 타이틀) | `SG-INTRO-EMBLEM`, `CAP-HOOK-TITLE` |
| S042 | 자막 | 가격 예고 |  |
| S043 | 자막 | 순번 숫자 |  |
| S044 | 화면 전환 | 붓 원 와이프 |  |
| S045 | 아이콘·기호 | 초록 체크 칩 | `LIST-CHECK` |
| S046 | 칠 | 판매점 표시 | `CHIP-DEALER` |
| S047 | 화면 전환 | 화면 2분할 | `TR-SPLIT2` |
| S048 | 화면 삽입 | 설명용 그림 컷 |  |
| S049 | 아이콘·기호 | 차 브랜드 로고 배지 | `SG-INTRO-IMPACT` |
| S050 | 마무리 | 캠페인 끝 문구 카드 | `SG-END-DEALER` |
| S051 | 사람 연출 | 단색 배경 진행자 |  |
| S052 | 첫 화면 | 시리즈 타이틀 카드 |  |
| S053 | 자막 | 인용 문장 카드 |  |

## 실촬영 기법 T01~ → 우리 코드

| 번호 | 이름 | 우리 코드 |
|---|---|---|
| T01 | 위아래 2분할 (split_screen) | `TR-SPLIT2` |
| T02 | ✓ 목록 쌓기 (checklist) | `LIST-CHECK` |
| T03 | 점프컷 (jump_cut) | `MOVE-JUMPCUT` |
| T04 | 숫자 카운트업 (count_up) | `MOVE-COUNTUP` |
| T05 | 스포트라이트 (spotlight) | `INS-SPOTLIGHT` |
| T06 | 돋보기 원 (magnifier) | `INS-MAGNIFIER` |
| T07 | 마력 흔들림 + 말 울음 (power_shake) | `MOVE-SHAKE`, `SFX-CONTEXT` |
