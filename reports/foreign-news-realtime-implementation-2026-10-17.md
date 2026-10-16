# 해외 자동차뉴스 자동 수집 게시판 구현 보고

## 결과

- 원본 구글시트의 `자동차뉴스/웹진` 중 한국 7곳을 제외하고 URL 중복을 제거해 해외 매체 107곳을 등록했다.
- robots.txt, CAPTCHA, 401/403/429를 우회하지 않는 탐색기를 만들었다.
- 2026-10-17 전수 점검: active 67, blocked 23, error 11, review 6.
- RSS/Atom에서 최신 기사 500건을 수집해 `해외 자동차뉴스` 게시판에 연결했다.
- 정규 URL 중복 제거 후, 48시간 안의 제목 유사도 0.72 이상 기사는 대표 기사 하나로 묶는다.
- 기사 원문 전체와 이미지는 복제하지 않는다. 피드 제목, 짧은 요약, 매체, 발행시각, 원문 링크만 저장한다.

## 운영 명령

```bash
npm run news:sources   # 구글시트에서 107개 소스 레지스트리 재생성
npm run news:discover  # RSS/Atom/사이트맵 및 차단 상태 재점검
npm run news:collect   # 허용된 피드의 최신 스냅샷 생성
npm run test:foreign-news
```

GitHub Actions의 `Sync overseas automotive news`가 5분마다 수집을 시도한다. GitHub 스케줄은 지연될 수 있으므로 엄밀한 실시간 SLA가 아니라 5분 주기의 near-real-time이다. 기사 변화가 없으면 커밋하지 않는다.

## 번역과 이미지

- 번역 엔드포인트가 없을 때는 원문 제목과 요약을 그대로 노출한다.
- `NEWS_TRANSLATE_ENDPOINT`, `NEWS_TRANSLATE_TOKEN` 저장소 시크릿을 연결하면 한국어 제목과 요약을 저장한다.
- 저작권 검수 전에는 피드 이미지를 노출하지 않는다. 승인 뒤 `FOREIGN_NEWS_ALLOW_FEED_IMAGES=true`로만 켤 수 있다.

## 검증

- 단위/통합 테스트 6건 통과.
- TypeScript `--noEmit` 통과, `git diff --check` 통과.
- Playwright 390×844: 게시판 선택, 500개 카드, 12개 동적 말머리, 상세 이동, 원문 링크, 콘솔 오류 0 확인.
- 전체 Vite 빌드는 코드 오류 전 단계까지 통과했으나 로컬 C: 여유 공간 0GB로 출력 파일 쓰기에서 중단되었다. 생성된 `dist/`만 정리했다.
