# 편집 스킬 라이브러리 (edit_skills)

AutoScout24 네덜란드 200·벨기에 197, 쇼츠 397개를 전수조사해 찾은 편집 기법을 「편집 스킬 N」으로 정리하고,
자동 편집기가 장면에 맞는 스킬을 골라 실제 화면에 그리도록 만든 프로그램입니다.
설명 문서(사람용)는 노션 「AS24 숏폼 편집 스킬 매뉴얼 v2」, 스킬 카드는 노션 DB 「영상 편집 스킬 라이브러리」에 있습니다.

## 파일

| 파일 | 하는 일 |
|---|---|
| `library_v2.json` | 스킬 53개 설명·통계, 패턴 18종(+미분류 P00) 프로필, 패턴 흐름, 장면 레시피, 규칙(겹침·안전 영역·한국어 길이·효과음·박자). `skill_survey/build_skills2.py`가 만든다 |
| `draw.py` | 스킬 그리기 함수(이름표·띠 칩·큰 숫자·카드·폰 화면·손가락·로고…). 글꼴 Pretendard, 이모지 Noto, 칠은 노션 원본 칠(`brushfill.py`) |
| `registry.py` | 스킬 번호 → 그리기 함수·기본 자리·움직임·효과음·필요한 값 |
| `motion.py` | 나타나고 사라지는 움직임(원본 실측: 칩은 2프레임 안에 다 커짐) |
| `planner.py` | 대본(장면 목록) + 쓰는 방식(1·2·3) + 패턴 → 스킬 타임라인 |
| `check.py` | 타임라인 자동 점검(겹침, 1초에 새 요소 하나, 안전 영역, 글자 길이, 효과음 비율, 끝 로고, 방식 규칙) |
| `render.py` | 타임라인을 영상으로(사진 슬라이드 또는 영상 위에 프레임마다 그림 + 자체 효과음) |
| `demo.py` | 레인지로버 매물 사진으로 샘플 만들기 |

## 쓰는 법

```bash
cd scripts/shortform
python3 -m edit_skills.demo OUT --mode 3 --pattern P02     # 샘플(차 앞 소개, 손가락 아이콘형)
python3 -m edit_skills.planner script.json plan.json        # 대본 → 계획
python3 -m edit_skills.check plan.json                      # 계획 점검
```

대본(script.json) 한 장면:
```json
{"start": 9.9, "dur": 3.6, "scene": "point", "facts": {"text": "5.0 V8 슈퍼차저"}, "anchor": [0.42, 0.52]}
```
- `scene` 은 `library_v2.json` 의 `recipes` 이름(intro·spec·option·price·quiz_hook·reveal·comment·ending …).
- 패턴(P01~P18)을 고르면 `pattern_flows` 가 장면 순서를 알려 준다.
- `facts` 에 없는 값은 그리지 않는다(지어내지 않음). 옵션 이름은 매물 옵션 표에 있는 것만 넣는다.
- `anchor` = 부위 위치(화면 비율). ③ 손가락 아이콘형은 여기를 가리킨다.

## 세 가지 쓰는 방식

1. **① 내레이션형** — 사람 없이 사진·영상 + 목소리. 사람 연출 스킬(S027·S033·S034·S035·S037·S051)은 쓰지 않는다.
2. **② 사람 등장형** — 딜러·진행자가 나온다. 모든 스킬 사용.
3. **③ 손가락 아이콘형** — 사람이 손으로 가리키는 대신 손가락 아이콘(S035)과 노랑 원(S020)이 부위를 짚는다.

## 규칙(원본 실측)

- 같은 자리에 요소 하나, 새 요소는 1초에 하나까지, 말 자막 둘레 70px 비움.
- 효과음은 요소 4개 중 1개꼴(원본 23~29%). 첫 요소·가격·끝 로고에는 붙인다.
- 남의 로고·그래픽·캐릭터는 쓰지 않는다. 끝 로고는 보배드림 로고.
- 번호판은 가리지 않는다. 숫자·옵션은 매물 정보와 같아야 한다.

## 다시 만들기

```bash
# 조사 폴더(SKILLDIR)에 detect·classify 결과가 있을 때
python3 skill_survey/patterns.py SKILLDIR       # 영상 패턴 분류
python3 skill_survey/build_skills2.py SKILLDIR  # library_v2.json
```
