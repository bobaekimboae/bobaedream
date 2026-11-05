// 보배드림 리뉴얼 백엔드 중계(서버 배포용: NITRO_PRESET=node-server). 정적 배포(GitHub Pages)에서는 쓰이지 않는다.
// 보배드림 서버 CORS 가 dev.bbmuseum.co.kr 만 허용하므로, 다른 주소에서 글쓰기를 붙일 때 이 길로 보낸다.
export default defineEventHandler((event) => {
  const upstream = (process.env.BBM_UPSTREAM || 'https://staging.bbmuseum.co.kr').replace(/\/$/, '')
  const path = getRouterParam(event, 'path') || ''
  const search = getRequestURL(event).search
  return proxyRequest(event, `${upstream}/${path}${search}`, {
    headers: { host: new URL(upstream).host },
  })
})
