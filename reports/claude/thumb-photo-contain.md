# 실사 사진 썸네일 꽉 채움 해제

① 한 줄 요약: 목록 카드의 실사 사진이 칸을 꽉 채우지 않고, 그림 썸네일과 같은 연회색 바탕 안에 사진 전체가 보이게 바꿨다.

② 브랜치 `claude/thumb-photo-contain` · 커밋·PR·배포 v값은 채팅 보고 참조

③ 한 일
- 실사 사진 썸네일을 `cover`(잘라서 꽉 채움) → `contain`(사진 전체 보이기)로 변경
- 남는 칸은 그림 썸네일과 같은 `#F3F4F6` 연회색으로 채움
- 피드 첫 큰 카드·갤러리 보기는 기존처럼 꽉 채움 유지
- 파일: `src/prototype/listing/bbm-tokens.css`, 규칙 `docs/quick-filter-spec.md`

④ 비교: `thumb-photo-contain/after_sheet.png` (카테고리별 첫 6장, 384px)

⑤ 검증: `npm run verify` 통과(테스트 29+4), 콘솔 오류 0

⑥ 원본과 다르게 남긴 것: 세로 사진(바이크 일부)은 좌우에 회색 띠가 생김 — 사진 전체를 보여 주는 쪽을 우선

⑦ 다음: 사진 자체에 여백이 많은 컷은 원본 크롭이 필요할 수 있음

⑧ 확인 링크: 모바일 `?qf=guazi`, PC `?qf=guazi&pc=1`
