// vehicle-review-board.js 의 데이터 · 계산 부분 이식(화면은 components/boards/VehicleReviewBoard.vue)
import { readJson, type Row } from './boardUtil'

export const vrbStorageKey = 'bobae-vehicle-reviews-v1'
export const vrbCommentStorageKey = 'bobae-community-review-comments-v1'
export const vrbStarFilled = '../icons/chotot/chotot-common-review-star-selected.svg'
export const vrbStarEmpty = '../icons/chotot/chotot-common-review-star-button.svg'
export const vrbIcons: Record<string, string> = {
  back: 'assets/reddit-ui/back.svg', share: '../%61ssets/detail/autoscout24-share.svg', chat: 'assets/reactions/comment-outline.svg',
  like: 'assets/reactions/recommend.svg', dislike: 'assets/reactions/dislike.svg', bookmark: '../icons/chotot/chotot-common-bookmark.svg',
  write: 'assets/reddit-ui/write.svg', check: '../%61ssets/register/chotot-v01/check-mark.svg',
}
const modelMeta: Record<string, Row> = {
  'ev-a06': { brand: '현대', model: '아이오닉 6', trim: '2026 롱레인지 2WD', powertrain: 'ev', brandLogo: '../%61ssets/brand/kr/hyundai.png' },
  'phev-xc60': { brand: '볼보', model: 'XC60', trim: '2026 T8 AWD 플러그인 하이브리드', powertrain: 'phev', brandLogo: '../%61ssets/brand/kr/volvo.png' },
  'hybrid-camry': { brand: '토요타', model: '캠리', trim: '2026 2.5 하이브리드', powertrain: 'hybrid', brandLogo: '../%61ssets/brand/kr/toyota.png' },
  'erev-m7': { brand: 'AITO', model: 'M7', trim: '2026 Max AWD 주행거리 연장형', powertrain: 'erev', brandLogo: '' },
  'ice-m3': { brand: 'BMW', model: 'M3', trim: '2025 컴페티션 M xDrive', powertrain: 'ice', brandLogo: '../%61ssets/brand/kr/bmw.png' },
}
const categoryComments: Record<string, string[]> = {
  외관: ['호불호가 커요', '겨우 볼 만해요', '무난한 디자인', '시선 끄는 디자인', '디자인 완성도 최고'],
  실내: ['받아들이기 어려움', '실내 구성이 아쉬움', '소박하고 무난해요', '보기 좋고 편안해요', '설계와 마감 훌륭'],
  공간: ['좁고 답답해요', '공간이 부족해요', '딱 필요한 만큼', '공간이 여유로워요', '아주 넉넉해요'],
  '편의·안전 사양': ['기본 사양 부족', '필수 사양만 있음', '일상에는 충분', '편의 사양 만족', '사양 매우 풍부'],
  '동력·핸들링': ['동력·조향 불편', '힘과 핸들링 아쉬움', '무난한 동력 성능', '쉽고 안정적인 운전', '차와 하나 된 느낌'],
  연비: ['연료비 부담 큼', '연료 소비 많음', '평균적인 연비', '연비가 우수해요', '효율 매우 뛰어남'],
  주행감: ['견디기 어려워요', '주행감이 아쉬워요', '무난한 주행감', '편안하고 안정적', '주행 완성도 최고'],
  '주행거리·전비': ['주행거리 부족', '거리 불안이 있어요', '출퇴근에는 충분', '거리·효율 우수', '장거리도 든든'],
  '주행 보조': ['실용성이 없어요', '가끔만 쓸 만해요', '기본 기능은 무난', '똑똑하고 안정적', '믿고 쓸 수 있어요'],
  인포테인먼트: ['사용성이 나빠요', '다소 불편해요', '기본 사용엔 충분', '기능 풍부하고 편함', '빠르고 스마트함'],
}
export const categoryLabels: Record<string, string> = { exterior: '외관', interior: '실내', space: '공간', features: '편의·안전 사양', driving: '주행감', range: '주행거리·전비', adas: '주행 보조', cockpit: '인포테인먼트', power: '동력·핸들링', fuel: '연비' }
const profileRequired: Record<string, string[]> = {
  ev: ['exterior', 'interior', 'space', 'features', 'driving', 'range'], phev: ['exterior', 'interior', 'space', 'features', 'driving', 'range'],
  erev: ['exterior', 'interior', 'space', 'features', 'driving', 'range'], hybrid: ['exterior', 'interior', 'space', 'features', 'power', 'fuel'],
  ice: ['exterior', 'interior', 'space', 'features', 'power', 'fuel'],
}
export const seededComments = [
  { author: 'M 드라이버', role: 'BMW M3 오너 · 보유 2년', body: '장거리에서도 시트와 조향감이 편한가요? 데일리카로 고민 중입니다.', meta: '10월 16일 · 서울', likes: 11, replies: 4 },
  { author: '주말오너', role: '실소유자 인증', body: '저도 비슷하게 느꼈어요. 컴포트 모드에서는 승차감이 생각보다 무난했습니다.', meta: '10월 16일 · 경기', likes: 3, replies: 2 },
  { author: '모터다이어리', role: '차량 리뷰어', body: '보험료와 소모품 비용도 함께 알려주시면 구매를 고민하는 분들께 도움이 될 것 같아요.', meta: '10월 15일 · 부산', likes: 2, replies: 1 },
  { author: '로드테스터', role: '실소유자 인증', body: '고속 주행 안정감과 브레이크 답력은 같은 급에서 가장 만족스러웠습니다.', meta: '10월 14일 · 대구', likes: 1, replies: 0 },
]

export function profileAverage(ratings: Row, powertrain: string) {
  const source = ratings || {}
  const ids = profileRequired[powertrain] || Object.keys(source)
  const values = ids.map(id => Number(source[id] != null ? source[id] : source[categoryLabels[id]!])).filter(v => isFinite(v) && v > 0)
  return values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0
}
function parseRatings(value: unknown) {
  const result: Record<string, number> = {}
  String(value || '').split('|').forEach((item) => { const parts = item.trim().match(/^(.*?)\s+([0-5](?:\.\d)?)$/); if (parts) result[parts[1]!] = Number(parts[2]) })
  return result
}
export function ratingMap(post: Row): Row {
  if (Array.isArray(post.ratings)) return parseRatings(post.ratings.join('|'))
  if (post.ratings && typeof post.ratings === 'object') return post.ratings
  return parseRatings(post.ratings)
}
function localRows(): Row[] {
  try {
    return (readJson<Row[]>(vrbStorageKey, []) || []).map((review) => {
      const meta = modelMeta[review.modelId] || modelMeta['ev-a06']!
      return {
        reviewId: review.id, modelId: review.modelId, brand: meta.brand, model: meta.model, trim: meta.trim, powertrain: meta.powertrain,
        rating: profileAverage(review.ratings, meta.powertrain), ratings: review.ratings || {}, owner: !!review.owner,
        ownershipLabel: review.ownershipLabel || (review.owner ? '실소유자' : '시승 리뷰'), location: review.location || '지역 미입력',
        title: review.title || meta.model + ' 사용자 리뷰', summary: review.body || '', body: [review.body || ''], user: review.author || '보배드림 회원',
        author: review.author || '보배드림 회원', publishedAt: review.createdAt || '', time: '방금 전', likes: Number(review.likes || 0),
        reply: Number(review.comments || 0), comments: Number(review.comments || 0), brandLogo: meta.brandLogo, thumb: review.imageData || '',
        thumbnail: review.imageData || '', purchaseDate: review.purchaseDate, price: review.price, ownerMetric: review.ownerMetric, local: true,
      }
    })
  } catch { return [] }
}
export function categoryComment(label: string, score: number) {
  const rows = categoryComments[label] || [status(score), status(score), status(score), status(score), status(score)]
  const bucket = score <= 1 ? 0 : score <= 2 ? 1 : score <= 3 ? 2 : score <= 4 ? 3 : 4
  return rows[bucket]!
}
export function status(score: number) { return score >= 4.5 ? '매우 만족' : score >= 4 ? '만족' : score >= 3 ? '보통' : '아쉬움' }
export function avatarOf(post: Row) {
  const meta = modelMeta[post.modelId] || {}
  return { src: post.brandLogo || meta.brandLogo || '../%61ssets/brand/kr/hyundai.png', alt: (post.brand || meta.brand || '자동차') + ' 브랜드 로고' }
}
export function modelYear(post: Row) { const m = String(post.trim || '').match(/(?:^|\s)(20\d{2})(?:\s|$)/); return m ? m[1] + '년식' : '' }
export function imagesOf(post: Row): string[] {
  let images: string[] = Array.isArray(post.images) ? post.images : String(post.images || '').split('|')
  if (!images.filter(Boolean).length) images = [post.thumbnail || post.thumb]
  return images.filter(Boolean).slice(0, 3)
}

/* MODEL_CIRCLE_TESLA_Y: model-specific community statistics and feed */
export const teslaModelYStats = {
  slug: 'tesla-model-y', brand: '테슬라', model: 'Model Y', modelKo: '모델 Y', powertrain: 'ev',
  brandLogo: '../%61ssets/brand/kr/tesla.png', score: 4.04, reviewCount: 2619, subscribers: '4.8만',
  segment: '3천만~5천만원 전기 SUV', rank: 45, segmentAverage: 3.94,
  scores: [
    { label: '외관', score: 4.30, average: 4.18, comment: '간결하고 미래적인 디자인' },
    { label: '실내', score: 3.46, average: 3.97, comment: '미니멀하지만 호불호가 있어요' },
    { label: '편의·안전 사양', score: 3.70, average: 3.96, comment: '앱과 OTA는 편리해요' },
    { label: '공간', score: 4.40, average: 4.01, comment: '가족용으로 넉넉해요' },
    { label: '주행감', score: 4.09, average: 3.99, comment: '반응이 빠르고 안정적' },
    { label: '동력·핸들링', score: 4.17, average: 3.97, comment: '즉각적인 가속 응답' },
    { label: '주행거리·전비', score: 4.19, average: 4.02, comment: '일상 주행 효율이 좋아요' },
  ],
  positives: [['공간이 넉넉해요', 526], ['핸들링이 좋아요', 341], ['동력이 충분해요', 286], ['운전이 편해요', 223], ['주행거리가 만족스러워요', 115]] as Array<[string, number]>,
  negatives: [['승차감이 아쉬워요', 114], ['편의 사양이 평범해요', 77], ['겨울 주행거리가 아쉬워요', 67], ['잡소리가 있어요', 65]] as Array<[string, number]>,
}
function teslaModelYRows(): Row[] {
  const photo = 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=960&q=75'
  const base: Row = { modelId: 'tesla-model-y', brand: '테슬라', model: 'Model Y', powertrain: 'ev', brandLogo: teslaModelYStats.brandLogo, owner: true, ownershipLabel: '실소유자 리뷰', location: '서울', trim: '2025 Model Y Long Range AWD', purchaseDate: '2025-08', price: '5299', ownerMetric: '438km', benchmark: '동급 전기 SUV 평균 3.94', thumb: photo, thumbnail: photo, images: [photo] }
  return [
    { reviewId: 'model-y-01', author: '서울 Y 오너', rating: 4.43, title: '가족용 전기차로 선택한 모델 Y, 공간이 가장 만족스럽습니다', summary: '2열과 트렁크 공간이 넉넉하고 앱으로 공조를 미리 켤 수 있어 일상에서 편합니다.', body: ['2열과 트렁크 공간이 넉넉하고 앱으로 공조를 미리 켤 수 있어 일상에서 편합니다. 장거리에서도 충전 경로 안내가 자연스러워 첫 전기차로 적응하기 쉬웠습니다.', '노면이 거친 길에서는 승차감이 단단하게 느껴지지만, 넓은 공간과 전비가 단점을 충분히 상쇄합니다.'], ratings: { exterior: 4.5, interior: 3.8, features: 4.2, space: 4.8, driving: 4.4, range: 4.9 }, time: '2시간 전', likes: 84, reply: 16 },
    { reviewId: 'model-y-02', author: '주말 드라이버', rating: 4.05, title: 'OTA와 충전 경험은 편리하고 승차감은 취향을 탑니다', summary: '업데이트로 차가 계속 달라지는 경험은 좋지만 도심 요철에서는 하체가 다소 단단합니다.', body: ['업데이트로 차가 계속 달라지는 경험은 좋지만 도심 요철에서는 하체가 다소 단단합니다. 슈퍼차저 동선과 내비게이션 연동은 다른 전기차보다 이해하기 쉬웠습니다.'], ratings: { exterior: 4.2, interior: 3.5, features: 4.1, space: 4.4, driving: 3.8, range: 4.3 }, time: '어제', likes: 52, reply: 9 },
    { reviewId: 'model-y-03', author: '아이둘 아빠', rating: 4.32, title: '유모차와 캠핑 짐을 함께 싣는 넉넉한 적재공간', summary: '프렁크와 바닥 수납까지 활용하면 가족 여행 짐을 여유 있게 실을 수 있습니다.', body: ['프렁크와 바닥 수납까지 활용하면 가족 여행 짐을 여유 있게 실을 수 있습니다. 2열 바닥이 평평해 아이들이 타고 내리기도 편합니다.'], ratings: { exterior: 4.3, interior: 3.7, features: 3.9, space: 5, driving: 4.4, range: 4.6 }, time: '2일 전', likes: 117, reply: 21 },
    { reviewId: 'model-y-04', author: '전기차 출퇴근러', rating: 3.82, title: '출퇴근 전비는 만족, 겨울 장거리 주행은 계획이 필요합니다', summary: '도심 주행 효율은 좋고 원페달 적응도 빠르지만 추운 날에는 주행가능거리가 눈에 띄게 줄었습니다.', body: ['도심 주행 효율은 좋고 원페달 적응도 빠르지만 추운 날에는 주행가능거리가 눈에 띄게 줄었습니다. 충전소와 휴게 동선을 미리 확인하면 불편은 크지 않습니다.'], ratings: { exterior: 4.1, interior: 3.3, features: 3.6, space: 4.3, driving: 4.0, range: 3.6 }, time: '3일 전', likes: 39, reply: 12 },
    { reviewId: 'model-y-05', author: '모델 Y 시승자', rating: 4.08, title: '빠른 가속과 낮은 무게중심이 주는 안정감', summary: '가속 반응과 코너링은 기대 이상이었고 시야도 편했습니다. 물리 버튼이 적은 부분은 적응이 필요합니다.', body: ['가속 반응과 코너링은 기대 이상이었고 시야도 편했습니다. 물리 버튼이 적은 부분은 적응이 필요합니다.'], owner: false, ownershipLabel: '시승 리뷰', ratings: { exterior: 4.4, interior: 3.2, features: 3.7, space: 4.5, driving: 4.6, range: 4.1 }, time: '5일 전', likes: 31, reply: 6 },
    { reviewId: 'model-y-06', author: '롱레인지 오너', rating: 3.96, title: '심플한 실내와 넓은 공간, 마감은 확인이 필요해요', summary: '화면 중심 조작은 익숙해지면 빠르지만 인도 직후 단차와 작은 잡소리는 점검했습니다.', body: ['화면 중심 조작은 익숙해지면 빠르지만 인도 직후 단차와 작은 잡소리는 점검했습니다. 서비스 예약은 앱으로 간단했고 조치 이후에는 만족하며 타고 있습니다.'], ratings: { exterior: 4.0, interior: 3.1, features: 3.5, space: 4.7, driving: 4.2, range: 4.3 }, time: '1주 전', likes: 63, reply: 18 },
  ].map(row => ({ ...base, ...row }))
}
export function vrbAllRows(posts: Row[], modelCircle: boolean): Row[] {
  if (modelCircle) {
    const originals = localRows().concat(posts || []).filter(p => String(p.modelId || '') === 'tesla-model-y' || /model\s*y/i.test(String(p.model || '')))
    return teslaModelYRows().concat(originals)
  }
  return localRows().concat(posts || [])
}
export function bodyText(post: Row) { return (Array.isArray(post.body) ? post.body.join('\n\n') : post.body) || post.summary || '' }
export function commentRows(reviewId: string): string[] { return readJson<string[]>(vrbCommentStorageKey + '.' + reviewId, []) || [] }
