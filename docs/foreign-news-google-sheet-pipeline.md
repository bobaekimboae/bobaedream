# 해외 자동차뉴스 → Google Sheets → 보배드림 뉴스 자동 파이프라인

## 흐름

GitHub Actions가 5분마다 다음 작업을 순서대로 실행한다.

1. 허용된 RSS·Atom·사이트맵에서 최근 해외 자동차 기사를 수집한다.
2. URL과 유사 제목을 기준으로 중복 기사를 제거한다.
3. `NEWS_TRANSLATE_ENDPOINT`가 있으면 한국어 제목과 3줄 요약을 생성한다.
4. Iframely Data API를 `mode=discover&use=reference`로 호출해 게시자가 제공한 대표 이미지와 매체 로고를 받는다.
5. Iframely의 원문 제목·설명은 노출하지 않고, 썸네일·로고만 한국어 카드에 결합한다.
6. 번역 서비스가 일시적으로 없으면 원문 제목을 노출하지 않고 한국어 메타 대체 문구를 사용한다.
7. 같은 결과를 `해외자동차뉴스_자동수집` 시트와 보배드림 해외 자동차뉴스 게시판 데이터에 반영한다.
8. 변경된 게시판 스냅샷을 `main`에 커밋해 GitHub Pages 배포 대상으로 보낸다.

## Google Sheet 열

사람이 보는 핵심 열은 앞쪽 8개다.

`기사 유형 / 제조사 / 모델 / 인물 / 국가 / 출처 / 제목 / 기사 요약(3줄)`

요약은 한 셀 안에서 다음 규칙에 따라 줄바꿈한다.

1. 핵심 사건 또는 발표
2. 모델·기술·수치 등 구체 정보
3. 출시 일정·시장 영향 또는 다음 단계

운영 열은 그 뒤에 둔다.

`등록상태 / 기사ID / 발행일 / 수집일 / 대표이미지 URL / 원문 URL / 원문언어 / 번역상태 / 관련기사수`

원문 제목과 원문 요약은 시트와 게시판 노출 데이터에 넣지 않는다. 원문 URL은 사실 확인과 출처 이동을 위해 보존한다.

## 한 번만 설정할 GitHub Actions secrets

- `FOREIGN_NEWS_SHEET_ID`: 대상 Google Spreadsheet ID
- `GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON`: Google Cloud 서비스 계정 JSON 전체
- `NEWS_TRANSLATE_ENDPOINT`: 한국어 제목·3줄 요약 API 주소
- `NEWS_TRANSLATE_TOKEN`: 번역 API 인증 토큰
- `IFRAMELY_API_KEY`: 자동 URL 처리가 허용된 Iframely Data API 키

대상 Google Spreadsheet를 서비스 계정의 `client_email`에 편집자로 공유해야 한다. 시트 ID나 서비스 계정 비밀키가 없으면 시트 동기화 단계만 안전하게 건너뛰며, 뉴스 게시판 수집·배포는 계속된다.

## 운영 원칙

- 자동화가 관리하는 탭은 `해외자동차뉴스_자동수집` 하나뿐이다.
- 매 실행마다 이 탭을 최신 500건으로 교체한다. 다른 탭은 읽거나 수정하지 않는다.
- 기사 ID와 원문 URL로 추적할 수 있고, 원문 제목은 사용자 화면과 시트에 노출하지 않는다.
- 번역 결과가 없는 행은 `한국어 메타 대체`로 표시해 실제 번역과 구분한다.
- 대표 이미지는 피드가 직접 제공한 URL만 사용하며 파일을 복제하거나 재호스팅하지 않는다.
- Iframely 키가 있으면 Iframely가 반환한 썸네일 URL을 그대로 우선 사용한다. 이미지는 내려받거나 변형하지 않는다.
- Iframely의 `access.decision.links.allowed=false`이면 해당 썸네일·로고를 사용하지 않는다.
