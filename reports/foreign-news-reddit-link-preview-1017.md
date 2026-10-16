# 해외 자동차뉴스 · Reddit식 링크 프리뷰 적용 보고

- 적용일: 2026-10-17
- 대상: `해외 자동차뉴스` 게시판
- 결론: 미국 자동차 매거진을 iframe으로 통째로 삽입하지 않고, Reddit의 외부 링크 포스트처럼 `제목 + 요약 + 대표 이미지 + 출처 URL`을 한 카드로 표시한다.

## 노출 규칙

1. 게시글 제목을 누르면 보배드림 내부 상세로 이동한다.
2. 링크 프리뷰 카드(대표 이미지 포함)를 누르면 자동차 매거진 원문으로 이동한다.
3. 대표 이미지는 RSS/Atom이 제공한 원격 URL을 우선 사용한다. 다운로드하거나 보배드림 서버에 재호스팅하지 않는다.
4. RSS 이미지가 없으면 글자 카드로 남긴다. 브라우저에서 외부 메타 API를 500건 동시 호출하지 않는다.
5. 이미지가 깨지거나 차단되면 이미지 영역만 제거하고 제목·요약·원문 주소는 유지한다.
6. 이미지는 `loading=lazy`, `referrerpolicy=no-referrer`로 불러온다.

## Reddit 방식과 구분

- 외부 자동차 매거진: Reddit식 **링크 포스트 프리뷰**로 표시한다. Reddit iframe/oEmbed 대상이 아니다.
- 실제 Reddit 게시물·댓글 URL: Reddit 공식 Embed 또는 oEmbed를 사용한다.
- Reddit 공식 임베드 요소는 수정·가림·변형하지 않고, Reddit 제휴·보증으로 오인시키지 않는다.

## 공식 근거

- Reddit 외부 링크 포스트: 썸네일을 누르면 외부 원문으로, 제목을 누르면 Reddit 게시물로 이동한다.  
  https://support.reddithelp.com/hc/en-us/articles/37143978167700-Changelog-May-5-2025
- Reddit 게시물·댓글 임베드: 데스크톱 공유 메뉴의 Embed 또는 oEmbed 사용.  
  https://support.reddithelp.com/hc/en-us/articles/360043033532-How-do-I-embed-a-Reddit-post-or-comment-in-an-article-or-other-publication
- Reddit Post 객체는 링크 포스트의 제출 URL, 제목, 프리뷰 썸네일을 별도 필드로 제공한다.  
  https://developers.reddit.com/docs/api/public-api/classes/Post
- Reddit Embed 이용 조건: 원본 요소 변경·가림 금지, 제휴·보증 오인 금지.  
  https://redditinc.com/policies/embeds-terms

## 검증 결과

- 기사: 500건
- 수집 시점 대표 이미지 확보: 427건
- 원문 매체: 33개
- 모바일 390×844 브라우저: 링크 카드 500개, 대표 이미지 필드 427개, 콘솔 오류 0건
- 자동 테스트: `npm run test:foreign-news` 7/7 통과, TypeScript 검사 통과
