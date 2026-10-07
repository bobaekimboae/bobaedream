# 실사 사진 썸네일 원복

① 한 줄 요약: 실사 사진 썸네일을 contain·안쪽 여백 이전(칸 꽉 채움)으로 되돌렸다.

② 브랜치 `claude/thumb-photo-revert` · 커밋·PR·배포 v값은 채팅 보고 참조

③ 한 일: `bbm-tokens.css`에서 PR 240·241의 실사 사진 규칙 삭제 → d252119 때와 같은 파일. 그림 썸네일(연회색 바탕) 규칙은 유지.

⑤ 검증: `npm run verify` 통과
