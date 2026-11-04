# 커뮤니티 게시글 상세 넉스트 이식 (community-nuxt-detail)

① 한 줄 요약: 정적 `public/community/chzzk-detail.html`(모바일 게시글 상세)을 `nuxt-community/app/pages/posts/[id].vue`로 옮겼고, 17개 상태 화면 모두 정적 판과 픽셀 차이 0.05% 이하다.

② 과제 ID 없음 · 브랜치 `community-nuxt-detail`(기준 `community-nuxt-1`) · PR·병합·배포 없음

③ 한 일
- 글 찾기·화면 모드(기본 예시 글, 긴 공지 8303245, 문의 글 8325190, 공지 `?type=notice`, 두깝이 글, 시나리오 글, 토론 피드에서 연 글 `?from=discussion&photo=`, 전용 테이블 게시판 글, 글쓰기 저장본 `?local=1`)를 TS 로 옮겼다(`composables/detail/detailData.ts`, `localBody.ts`).
- 본문(사진·영상·임베드·투표·요약·출처), 태그, 추천/비추천, 재게시, 공유, 북마크, 최신글, 댓글(추천·비추천·답글·수정·삭제·공유), 댓글 메뉴 시트, 토스트, 맨 위로를 Vue 로 다시 만들었다. DOM 구조·클래스는 정적 판과 같다.
- 투표 카드(`DetailPoll.vue`)와 임베드·링크 카드(`DetailEmbed.vue`, `DetailNewsCard.vue`)는 정적 `community-poll.js`·`community-embed.js` 의 그리기를 옮겼다. `community-embed.js` 자체는 board-tables.js 가 데이터를 만들 때 필요하고 iframe 높이 신호를 처리하므로 그대로 불러온다.
- 정적 판 CSS(chzzk-detail.css · community-poll.css · news-card.css · Pretendard)는 복사하지 않고 화면이 떠 있는 동안만 `<link>`로 붙인다. 전역 main.css 가 새어 드는 것(.brand · a · input · :root 바탕)은 `assets/css/legacy/detail-neutralize.css`에서 `:where()`로 되돌린다.
- 저장 키는 정적 판과 같다: `bbm.community.comments.<id>`, `bbm-community-poll-v1`, `bbm.community.latestPost.v2`, IndexedDB `bbm-notion-write-media`, sessionStorage `bbm-embed-meta:<url>`(embed 라이브러리).

④ 원본과 비교(384×800, 채널 차 16 초과 비율, 처음 → 마지막)

| 화면 | 화면 크기 | 전체 페이지 |
|---|---|---|
| 기본 예시 글 | 0.00% → 0.00% | 0.04% → 0.03% (움직이는 GIF 댓글 프사) |
| 긴 공지 · 문의 글 · 공지 | 0.00% | 0.00% |
| 두깝이 글 8325181 | 0.00% | 0.04% → 0.05% (GIF 프사) |
| 시나리오 1 · 2 · 5 | 0.00% | 0.00% |
| 토론 피드 영상 글 8 | 0.01% → 0.00% | 0.00% |
| 투표 글 · 투표 후 | 0.00% | 0.00% |
| 임베드 글 9100011 | 0.00% | 0.00% |
| 글쓰기 저장본 | 0.00% | 0.00% |
| 댓글 메뉴 열림 · 답글 작성 중 · 첫 댓글 등록 · 댓글 앵커 | 0.00% | — |
| PC 1280×800 · 1440×900 (10개 · 5개 화면) | 0.00% | 0.03% 이하 |

뺀 것: 외부 사진·임베드(unsplash · 유튜브 · 인스타 · microlink)는 두 판 모두 막고 쟀다.

⑤ 검증: `pnpm typecheck` 통과, `pnpm test` 30개 통과(상세 데이터 시험 6개 추가), `pnpm generate` 통과. 콘솔 오류는 두 판 공통인 시나리오 1 사진(`/assets/maker-model/…` 404)과 막은 외부 주소뿐. 동작 점검 70단계 중 66단계 같음.

⑥ 원본과 다르게 남긴 것
- 댓글 공유 주소: `#앵커` 대신 `?comment=앵커`(해시 라우팅 충돌). 열면 그 댓글로 스크롤한다.
- 댓글 추천을 누른 뒤 포커스가 버튼에 남는다(정적 판은 목록을 통째로 다시 그려 포커스가 사라짐). 화면은 같다.
- 투표 카드에 `data-poll-id`/`data-poll-json` 속성을 두지 않았다(다른 화면이 community-poll.js 를 불러 두었을 때 문서 전체 클릭 처리가 Vue 화면을 덮어쓰지 않게).
- 예시 답글의 `href="#"` 링크는 해시 라우팅에서 목록으로 가 버리므로 기본 동작을 막고 맨 위로만 올린다.
- 새로고침하면 읽던 위치를 sessionStorage 로 되돌린다(정적 판은 브라우저가 해 줌).

⑦ 못 한 것·다음에 할 것: 공용 main.css 의 전역 규칙을 목록 전용으로 좁히면 neutralize 파일을 지울 수 있다. 실제 외부 사진이 열리는 환경에서 한 번 더 대조.

⑧ 확인 링크(로컬): `/bobaedream/nuxt-community/#/posts/1`, `#/posts/8303245`, `#/posts/9100031`, `#/posts/8?from=discussion&photo=1`, `#/posts/8326278?type=notice`
