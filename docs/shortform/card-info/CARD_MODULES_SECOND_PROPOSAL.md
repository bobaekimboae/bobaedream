# 2차 제안 반영 — 선택형 카드 컷

2026-11-26 · Codex. 원문: https://app.notion.com/p/424ee9c4b606809c9f29da537eba5c20

## 최신 결정

카드는 차량 편집에 끼우는 **선택형 독립 컷**이다. 고정 7장짜리 카드 영상 전체를 모든 매물에 요구하지 않는다. 선택하지 않으면 0장, 선택하면 해당 매물의 확인된 정보로 1장부터 여러 장까지 만든다. 선택된 카드 중 값이 없는 것은 사유를 남기고 생략하며 다른 카드로 바꾸지 않는다.

기본 상대 순서는 **차량 기본정보 → 성능점검 → 보험이력 → 차량이력 타임라인**이다. 네 장 모두 필수라는 뜻이 아니다. 예를 들어 성능점검과 보험만 선택하면 그 두 유형만 그 순서로 출력한다. 보험만 선택하면 앞에 차량·가격 카드를 붙이지 않는다. 보증·가격·요약 카드도 강제로 추가하지 않는다.

사용자 지정 8종의 표준 목록: vehicle / inspection / insurance / history_timeline / options / added_options / features / seller. 뒤의 옵션·추가옵션·특징·판매자 설명은 이 순서로 붙이는 기본 정책을 기록했으며, 앞의 네 유형에 대한 사용자 지정 순서를 바꾸지 않는다. 1차의 18종 확장 아이디어는 별도 후보이며 필수 목록이 아니다.

보험 이력은 피해·소유와 특수 사고를 한 페이지에 몰아넣지 않아 선택 유형 1개에서 물리 카드 2장이 나올 수 있다. 타임라인도 사건 3개마다 다음 장으로 이어져 사건을 잘라 버리지 않는다. 따라서 유형 수와 실제 카드 장수는 별도 필드다.

## 이번 산출물

| 결과 | 선택 | 실제 카드 | 길이 |
|---|---|---|---|
| single_option_card.mp4 | 옵션 정보만 | 1장 | 약 4.77초 |
| insurance_only.mp4 | 보험 이력만 | 2장 | 약 10.53초 |
| core_cards.mp4 | 차량·성능·보험·타임라인 요청 | 4장 | 22.4초 |
| timeline_layout_preview_silent.mp4 | 실제 매물과 분리한 틀 | 1장 | 4초·무음 |
| no_cards_plan.json | 선택 없음 | 0장 | 카드 영상 생성 안 함 |

타임라인 요청이 있었지만 이 샘플 차량의 국토부 사건별 조회 응답을 확보하지 않아 core_cards에서는 제외했다. 미리보기에는 날짜·차량번호·차명·가짜 사건 값을 넣지 않고 ‘실제 이력 아님’을 표시했다. 타임라인 입력/검증/정렬/여러 장 렌더 코드는 구현했지만 실차 국토부 연동을 완료했다고 보고하지 않는다.

원본 매물 영상 본체는 이번 회차에 수정하지 않았다. 독립 컷과 카드 묶음, 삽입 계획(insertion_manifest.json)을 제공한다. 기존 차량 편집기에 넣는 위치는 기존 편집 타임라인에서 결정하며 원본 영상·SNS 게시를 자동으로 바꾸지 않는다.

## 국토부 타임라인의 데이터 범위

공식 안내를 확인했다.

- 자동차365 이용안내: https://www.car365.go.kr/ccpt/schdcar/unityhstry/utztnGuidanceView.do?_menuId=M630202000&moblYn=Y
- 디지털서비스개방 안내: https://openservice.go.kr/vehHistInq

조회 범위에 따라 검사·정비·성능점검·체납·압류·저당 등의 제공 내용이 다르다. 특히 미동의 조회의 일부 항목은 상세 사건 대신 횟수만 제공된다. **횟수만으로 사건 날짜를 만들지 않는다.** 실제 수신된 응답에 날짜가 있는 항목만 시간순 카드로 변환한다.

보험사고 처리 횟수·금액을 국토부 데이터로 표시하지 않는다. 의무보험 ‘가입정보’와 보험사고 ‘보상 이력’은 다른 데이터다. 소유 변경 1회라는 횟수만으로 최초등록→소유변경→현재의 날짜 점을 만들지 않는다. 매물의 ‘연식 2021년 05월’을 최초등록 사건으로 바꾸지도 않는다.

정규화 입력은 내부 계약이며 공식 API 원문 스키마를 사칭하지 않는다. 아래 필드를 원본 응답에서 옮긴다.

```json
{
  "event_id": "내부 사건 ID",
  "event_type": "inspection",
  "occurred_on": "원문 날짜(YYYY-MM-DD 또는 YYYY-MM)",
  "title": "원문 기반 사건 요약",
  "source": {
    "system": "molit_integrated_history",
    "response_ref": "원본 응답·문서 참조",
    "retrieved_at": "실제 조회일",
    "lookup_scope": "실제 제공받은 조회 범위"
  }
}
```

조회일은 사건 발생일이 아니다. 월만 있으면 월 정밀도를 보존하고 임의의 일자를 보여 주지 않는다. 날짜 오류·조회일 이후 사건·출처 누락·타 출처 보험사고 사건은 거부 사유를 남긴다. 같은 월 안에서 일자가 없는 사건들의 정확한 선후관계는 확정하지 않는다. 소유자명·차량번호·VIN·연락처 같은 원문 필드는 정규화 출력에 복제하지 않는다.

이 샘플에 대한 본인확인·동의 조회·운영 API 호출을 수행하지 않았다. 현 저장소 public/vehicle-history/index.html의 통합 타임라인은 등록·보험을 함께 보여 주는 기존 화면이므로, 그 전체 배열을 ‘국토부 전용’ 타임라인에 그대로 넣지 않는다. 출처 구분을 유지하는 별도 어댑터가 필요하다.

## 자동화 파일

- module_rules.json: 8종·기본 순서·필수 없음·타임라인 입력 계약·화면 규격.
- card_modules.py: 선택 → 데이터 있는 유형만 정렬 → 카드 장수·생략·거부 사유 → 계획 JSON.
- render_modules.py: 계획을 독립 카드 컷으로 렌더. 음성이 없으면 --silent로 확인.
- narration_binding.json: 이전 KKC HQ 단일 음성과 차량 데이터 해시를 연결. 다른 차량 입력이면 기존 음성을 붙이는 작업을 차단.
- examples/timeline_contract_template.json: 실제 값이 비어 있는 입력 틀.
- check_modules.py: 선택 조합·출처·날짜·0/미확인·음성 입력 일치 검사.

```bash
# 카드 없음 — 삽입하지 않음
python scripts/shortform/card_info/card_modules.py --preset no_cards --out output/round2/no_cards_plan.json
# 보험만 선택: 차량·가격 카드는 추가하지 않음
python scripts/shortform/card_info/card_modules.py --cards insurance --out output/round2/insurance_only_plan.json
# 선택 입력 순서와 관계없이 지정한 상대 순서 적용
python scripts/shortform/card_info/card_modules.py --cards insurance,history_timeline,inspection,vehicle --out output/round2/basic_review_plan.json
# 한 장/한 유형/여러 유형 음성 샘플
python scripts/shortform/card_info/render_modules.py --cards options --name single_option_card
python scripts/shortform/card_info/render_modules.py --cards insurance --name insurance_only
python scripts/shortform/card_info/render_modules.py --cards vehicle,inspection,insurance,history_timeline --name core_cards
# 실제 이력으로 오인하지 않는 레이아웃 확인
python scripts/shortform/card_info/render_modules.py --layout-preview --name timeline_layout_preview
python scripts/shortform/card_info/check_modules.py
node scripts/check-shortform-audio.mjs --manifest media-contracts/card-modules-round2-audio.json --report output/round2/audio_checks.json
```

새 국토부 응답은 history_timeline.events에 넣고 --input으로 넘긴다. 날짜·출처가 유효하면 사건 3개씩 렌더할 수 있다. 현재 음성 조각은 이 G400d 스냅샷에만 연결되므로 새 입력에는 --silent를 사용하거나 새로 승인한 음성·시각을 연결해야 한다. 자동 로그인/조회/TTS 결제 기능은 추가하지 않았다.

## 검증

모든 핵심 4종 입력 순서 24개와 8종의 선택 부분집합 256개를 검사한다. 카드를 선택하지 않았는데 붙는 일, 비어 있는 타임라인을 보험 소유 횟수로 대신 채우는 일, 누락된 날짜를 만드는 일, 다른 차량에 기존 음성을 붙이는 일을 차단한다. 합성 사건은 검사 코드 안의 테스트 자료일 뿐 실제 차량 영상에 쓰지 않는다.

음성은 새로 생성하지 않고 기존 단일 take의 측정된 발화 구간을 재배치했다. 추출 단계의 길이는 지연·후행 여유까지 포함하며 마지막 단어를 자르지 않는다. 원본 조립 음성과 음량 전처리한 단일 채널 참조를 모두 보존한 뒤 shortform-audio.mjs로 동일 신호를 좌우에 배치한다. 채널 검사와 원본 음색/발음에 대한 청취 평가는 다른 검수다. 최종 기술 검사 결과와 독립 청취 여부는 노션 회차 평가서에 별도로 기록한다.

## 1차 제안과의 관계

CARD_SPEC.md의 고정 7장 샘플·49.9초 상세본·21초 비교본은 1차 훈련 이력이다. **새 제작의 선택·순서 정책은 이 문서와 module_rules.json을 따른다.** 모든 매물에 특정 카드 수·전체 길이·가격/보증 카드를 강제하는 규칙은 적용하지 않는다.
