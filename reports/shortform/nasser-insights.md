# shortform/nasser-insights

① 나세르 쇼츠 181편 분석(대사 SRT 포함)으로 영상 제작 구조 인사이트 v1 정리. 300편 재분석은 제미나이 크레딧 소진으로 대기.
② 브랜치 shortform/nasser-insights · 분석 브랜치 analysis/refs · 상태: 푸시(병합·배포 없음)
③ 한 일: 분석기에 말투·대사 비트·SRT 저장 추가, 채널 쇼츠 340편 목록 확보, 결제 오류 시 바로 멈춤, 기존 181편 SRT 362개 생성, 집계 스크립트 nasser_insights.py, 인사이트 문서 docs/shortform/nasser-structure-insights-v1.md, 노션 「영상 분석 스킬 조합」 기록
⑦ 다음: 제미나이 선불 크레딧 충전 → as24 분석 액션 재실행(reviewer-nasser300) → 300편으로 문서 v2, 규칙 값 반영

## v2 (2026-11-11)
- 시트 「나사르헤시엔_유튜브」 한국어 SRT 링크(챗GPT 라이브러리 파일) 345개를 크롬에서 모두 받아 analysis/refs `reports/shortform/nasser-srt345/`에 저장, `scripts/shortform/nasser_srt_insights.py`로 집계 → 인사이트 문서 v2
- 핵심: 조회수 상위 25%는 손님 대사로 시작하는 상황극 훅이 12%(하위 2%), 「~원하신다면」 조건 질문 훅은 하위 쪽(14% vs 2%)
- 남은 것: 화면 구성 300편(제미나이 크레딧 충전 대기), 대본 규칙 값 반영은 지시 대기, HeyGen 더빙 음성은 아직 안 받음
