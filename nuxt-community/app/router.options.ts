import type { RouterConfig } from '@nuxt/schema'

export default <RouterConfig>{
  // GitHub Pages 정적 미리보기에서도 글쓰기·상세 동적 경로를 새로고침할 수 있게 한다.
  // Laravel 운영 배포에서는 NUXT_PUBLIC_COMMUNITY_API_BASE와 서버 rewrite를 연결한 뒤 false로 전환한다.
  hashMode: true,
}
