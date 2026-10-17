# 해외 자동차뉴스 파이프라인 (수집 → 시트 번역 → 게시판)

2026-10-17 정리. 해외 자동차뉴스 게시판(`?board=foreign-car-news`)에 새 기사가 올라오고, 제목·요약이 한국어로 바뀌는 흐름이다.

## 흐름

1. **수집 (깃허브 액션 `foreign-news-sync.yml`)**
   - 출처 목록: 구글 시트 「레퍼런스ㅣ웹&앱ㅣ자동차/바이크뉴스」(`1hShhSU2q9CWDK3RSugXpJA6UruWGdBOGKn91MpScaTQ`)의 해외 자동차뉴스/웹진 107곳(`data/foreign-news/sources.json`).
   - RSS·사이트맵으로 새 기사와 바뀐 기사를 모아 `public/community/data/foreign-car-news.json`과 `board-foreign-car-news.js`로 저장한다.
   - 예약은 5분마다지만 GitHub가 실제로는 더 드물게 돌린다. 수동 실행은 Actions → Sync overseas automotive news → Run workflow.
   - main에 다른 커밋이 먼저 올라가 있으면 다시 얹어서 최대 5번 올린다(2026-10-17 push 실패 수정).
   - 게시판에는 최근 기사 10개만 올린다(번역된 기사 우선, `FOREIGN_NEWS_BOARD_LIMIT`). 전체 500건 JSON은 시트 번역용으로 유지(2026-10-17).
   - 봇이 올린 커밋은 GitHub Pages 배포를 깨우지 않으므로, 올린 직후 `deploy-pages.yml`을 직접 실행한다(2026-10-17, 이 연결이 없어 번역이 게시판에 안 보였음).
2. **번역 (구글 시트 Apps Script `scripts/foreign-news/apps-script/ForeignNewsTranslate.gs`)**
   - 15분마다 위 JSON을 읽어 같은 시트의 「해외뉴스_번역」 탭에 새 기사는 추가, 기존 기사는 원문만 갱신한다.
   - 한국어 제목·요약이 비어 있으면 구글 번역(LanguageApp)으로 채운다. 요약은 2문장·110자 이내로 자른다.
   - 사람이 고친 한국어 제목·요약은 덮어쓰지 않는다(검수용).
   - 한 번 실행에 새 번역 최대 40건, 존댓말은 기사체(~다)로 바꿈(구글 번역 하루 한도 보호).
3. **게시판 반영 (다음 수집 때)**
   - 수집 스크립트가 「해외뉴스_번역」 탭을 공개 CSV로 읽어 기사ID가 같은 글의 제목·요약을 한국어로 바꾼다.
   - OpenAI 키(`OPENAI_API_KEY`)가 있으면 시트에 없는 글은 AI 번역으로도 채운다(선택).

## 처음 한 번 설정

1. 시트를 열고 「확장 프로그램 → Apps Script」.
2. `ForeignNewsTranslate.gs` 내용을 통째로 붙여넣고 저장.
3. 위쪽 함수 선택에서 `setupTrigger` → ▶ 실행 → 구글 계정 권한 허용.
4. 시트 공유가 「링크가 있는 모든 사용자 · 뷰어」인지 확인.

## 칸 (해외뉴스_번역)

기사ID · 발행일 · 국가 · 출처 · 원문 제목 · 원문 요약 · 한국어 제목 · 한국어 요약 · 번역방식(AI/구글 번역/사람이 고치면 그대로) · 원문 언어 · 원문 URL · 대표이미지 URL · 수집일 · 갱신일
