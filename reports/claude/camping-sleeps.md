# 캠핑카 「침대 N」 → 「취침 N인」

① 한 줄 요약: 캠핑카 카드 끝 표기를 침대 수에서 취침 인원(해외 표기 기준)으로 바꿨다.

② 브랜치 `claude/camping-sleeps` · 커밋·PR·배포 v값은 채팅 보고 참조

③ 한 일: 모든 캠핑카 카드 `침대 N` → `취침 N인`(기존 취침 인원 값 그대로). 하비 495UL `18년형 · 견인형 · 취침 4인`.

④ 근거: 영국 Auto Trader `4 berth`, 미국 RV Trader `Sleeps 4`, 독일 `4 Schlafplätze`, 일본 `就寝4名` — 모두 인원 기준

⑤ 검증: `npm run verify` 통과, 오류 0
