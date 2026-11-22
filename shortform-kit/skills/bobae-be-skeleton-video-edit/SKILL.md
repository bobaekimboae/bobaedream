---
name: "bobae-be-skeleton-video-edit"
description: "보배드림 실촬영 매물 영상(ED-SIMPLE)을 벨기에 오토스카우트 편집 뼈대대로 만들 때 — 기준 영상 G350 v13과 같은 장면 고르기·붓칠 칩·옵션 편집·자막·효과음, v13 비교 통과 전 전달 금지."
---

# 벨기에 오토스카우트 편집 뼈대 — 실촬영 매물 영상

저장소: bobaekimboae/bobaedream (브랜치 shortform/title-tilt). 새로 만들기 전에 아래 「기준」과 「규칙 위치」를 먼저 열어 본다. 기억으로 만들지 않는다.

## 기준(이것과 같아야 한다)
- **기준 영상 G350 v13**: `public/shortform-samples/g350-v13/g350-v13.mp4`(70초, 커밋 771f02708)
- 렌더 코드: `scripts/shortform/video_listing/g350_v8_render.py` + `g350_v5_lib.py`
- 입력: `scripts/shortform/video_listing/samples/g350_input.json` · `samples/g350_edit.json`(뜻 단위 자막 덩어리 · 컷별 부위 구역)
- 새 차를 만들 때도 이 코드·입력 형식을 그대로 쓴다. 편집 방식을 새로 짜지 않는다.

## 규칙 위치(모두 읽고 시작)
| 무엇 | 위치 |
|---|---|
| 숫자 값 단일 기준(색·칩·자막·효과음·음량) | `scripts/shortform/be_locked_rules.json` |
| 스카우트 붓칠 원본(노션 원본 SVG 13개, 수정 금지) | `public/assets/shortform/brush-fill/as24-theme/` |
| 붓칠 칩 그리는 코드 | `scripts/shortform/video_listing/g350_v5_lib.py` `brush_box()` · `chip()` |
| 옵션 표시(시트 묶음·휠 인치·화면 숫자·내레이션) | `scripts/shortform/photo_listing/option_visual_rules.json` · `docs/shortform/option-visual-rules-v1.md` |
| 실촬영 옵션 편집 기법 T01~T08 | `scripts/shortform/video_listing/feature_edit_rules.json` |
| 기법·구성 이름 사전 | `shortform-kit/catalog/techniques.json` |
| 판 잠금 | `scripts/shortform/edition_lock.json` |
| 뼈대 문서 | `docs/shortform/as24-nl-be-edit-manual-v4.md`(최신) → `as24-edit-skeleton-v3.md` → `as24-caption-rules-v2.md` → `as24-sfx-rules-v1.md` |
| 노션 | 「영상 매물 기능 편집 자동화 매뉴얼 v1」 41fee9c4b6068135b799e9bc70f787c6 · 「칩 칠 분석」 41dee9c4b6068039b155c169dfb323f6 · 「칩·강조 칠 규칙」 41dee9c4b60681aba101e816c1788a3a · 「AS24 NL/BE 200편 분석」 412ee9c4b60681ab86aef38a708d2244 |

## 순서
1. **사실**: 매물 정보에서 확인된 것만(제조사·모델·**연식**·연료·코드네임·주행·가격·옵션). 코드네임은 BMW·벤츠·포르쉐만. 「무사고」·지어낸 수치·차량번호·개인 전화번호 금지.
2. **대본**: 합니다체. 한 문장 = 한 부위 = 그 부위 장면 = 칩 1개. 꾸밈말 금지.
3. **음성**: ElevenLabs Taehyung eleven_v3, 한 번만 생성. 받아쓰기(faster-whisper)는 시각만, 글자는 대본 글자.
4. **자막 덩어리**: 뜻 단위(기계적 어절 수 분할 금지), 1~3낱말, `g350_edit.json`의 chunks 형식.
5. **장면 고르기(핵심)**: 문장마다 그 부위가 보이는 원본 구간을 골라 잘라 붙인다. 순서 재배치 허용, 말 없는 구간은 버린다. **원본 순서·원본 길이 그대로 두기 금지.** 목표 길이 60~75초.
6. **첫 화면**: 차 전체 정면·3/4 장면. 브랜드 = 노랑 430_239 판(판 자체 기울기, 글자 수평) · 같은 줄 흰 큰 모델명 · 아래 한 줄 `연식 · 연료 · 코드네임`(예 `2013년식 · 디젤 · W463`).
7. **붓칠 칩**: 노랑 #F5F200 노션 원본 칠(fill_fit, 같은 배율만, 칠 높이 = 글자 × 2.0), 검정 글자, 기울기 0, 위쪽 300px 같은 자리, 그 부위 설명 컷 끝까지. 칩 글자 = 말한 낱말. 부위를 가리지 않고 아래 20%는 비운다.
8. **숫자**: 부위·차 전체 장면의 숫자는 3D 큰 숫자(T04 카운트업) — 휠 `18인치 / 265/60 R18`, 트렁크 `기본 480L / 뒷좌석 접으면 2,250L`. 숫자가 떠 있는 동안 말 자막 숨김.
9. **옵션 편집**: 부위 화살표 칩, T01 위아래 2분할 · T02 ✓ 목록 · T03 점프컷 · T05 스포트라이트 · T06 돋보기 · T07 마력 흔들림 · T08 부위 당기기를 `feature_edit_rules.json` 조건대로. 시트·휠·숫자는 `option_visual_rules.json`.
10. **말 자막**: 흰 글자 + 그림자 60px, 높이 1283px 고정, 말하는 낱말만 노랑 #F5F200, 바로 바뀜, 컷 뒤 0.3초 비움, 자막에 칠 없음.
11. **소리**: 보배드림 쇼룸 배경음 + 자체 효과음(딩·쿵·휙·팝, 비유음), 구역이 바뀌는 컷에 휙. −14 LUFS ±1, TP −1.5.
12. **끝**: 보배드림 로고가 영상 위에서 커짐, 효과음 없음.

## 금지
따로 뜨는 이모지 스티커 · 노랑 외 강조색 · 칩 기울이기(제목 판 제외) · 자막 칠 · 원본 보정·배경 바꾸기(자르기·이동·확대·흐린 채움만) · 번호판 가리기·칩으로 덮기 · 규칙 값을 사용자 말 없이 바꾸기.

## 검사 — 셋 다 통과해야 전달
1. `python3 scripts/shortform/check_be.py 영상.mp4`
2. `python3 scripts/shortform/edit_gate.py post --plates …`
3. **v13 비교**: 같은 시각 화면을 v13과 나란히 뽑아 눈으로 본다. 하나라도 있으면 실패 — 길이 v13 ±10% 밖 · 첫 화면이 차 전체가 아님 · 말하는 부위 ≠ 화면 부위 · v13에 있던 붓칠 제목·3D 숫자·화살표 칩·옵션 기법 빠짐 · 제목 아래 사실 빠짐 · 칩이 말 끝난 뒤 오래 남음.

1·2만 통과하면 「규칙 통과」다. 3까지 통과해야 「품질 통과」라고 보고한다. 비교 이미지를 같이 전달한다.

## 기록
회차마다 커밋·바꾼 것·단계별 시간·사람 개입·검사 결과를 노션 기준 문서 420ee9c4b6068158b9a5f0d09fb4a7b9에 적고, 영상은 구글 드라이브 `bobae_g350_rounds`에 `bobae_g350_rNN.mp4`로 올려 에이전트 3차 의견 페이지 420ee9c4b60680f4b468e267d9b9fdfa에 링크한다. 원드라이브는 쓰지 않는다. 커밋은 해도 되고, 병합·배포는 사용자가 말할 때만.