import type { CommunityPopularPeriod, CommunityPost, CommunitySection, CommunitySort, CommunityView } from '../types/community'

export const sections: CommunitySection[] = [
  {
    id: 'general',
    name: '일반',
    boards: [
      { id: 'free', sectionId: 'general', name: '자유게시판', headwords: ['일상', '유머', '질문', '정보'], canWrite: true },
      { id: 'politics', sectionId: 'general', name: '정치게시판', headwords: ['정치', '시사'], canWrite: true },
      { id: 'humor', sectionId: 'general', name: '유머게시판', headwords: ['유머', '영상'], canWrite: true },
    ],
  },
  {
    id: 'cars',
    name: '자동차',
    boards: [
      { id: 'domestic', sectionId: 'cars', name: '국산차게시판', headwords: ['현대', '기아', '제네시스', '르노', 'KGM'], canWrite: true },
      { id: 'imported', sectionId: 'cars', name: '수입차게시판', headwords: ['BMW', '벤츠', '아우디', '포르쉐', '테슬라'], canWrite: true },
      { id: 'ev', sectionId: 'cars', name: '전기차게시판', headwords: ['전기차', '충전', '배터리'], canWrite: true },
      { id: 'maintenance', sectionId: 'cars', name: '정비 · DIY', headwords: ['정비', '부품', 'DIY'], canWrite: true },
    ],
  },
  {
    id: 'vehicles',
    name: '차량',
    boards: [
      { id: 'bike', sectionId: 'vehicles', name: '바이크게시판', headwords: ['바이크', '스쿠터', '투어'], canWrite: true },
      { id: 'truck', sectionId: 'vehicles', name: '트럭 · 특장', headwords: ['트럭', '특장', '운송'], canWrite: true },
      { id: 'heavy', sectionId: 'vehicles', name: '중기게시판', headwords: ['굴착기', '지게차', '건설기계'], canWrite: true },
      { id: 'camping', sectionId: 'vehicles', name: '캠핑카게시판', headwords: ['캠핑카', '카라반'], canWrite: true },
    ],
  },
  {
    id: 'reports',
    name: '제보',
    boards: [
      { id: 'blackbox', sectionId: 'reports', name: '교통사고 · 블랙박스', headwords: ['사고', '블랙박스', '교통법규'], canWrite: true },
      { id: 'news-tip', sectionId: 'reports', name: '사건 · 제보', headwords: ['사건', '제보', '뉴스'], canWrite: true },
    ],
  },
  {
    id: 'defects',
    name: '결함',
    boards: [
      { id: 'defect', sectionId: 'defects', name: '차량 결함 신고', headwords: ['엔진', '변속기', '전장', '안전'], canWrite: true },
      { id: 'recall', sectionId: 'defects', name: '리콜 · 소비자 대응', headwords: ['리콜', '보증', '분쟁'], canWrite: true },
    ],
  },
]

const seedPosts: CommunityPost[] = [
  { id: 'p-free-1', boardId: 'free', headword: '일상', title: '주말 드라이브 코스 어디가 좋을까요?', excerpt: '서울에서 두 시간 안쪽으로 다녀올 만한 코스를 추천해주세요.', author: '바람따라', createdAt: '2026-11-01T04:20:00Z', updatedAt: '2026-11-01T04:35:00Z', thumbnail: 'images/community/board-header-genesis-yeosu.webp', comments: 18, likes: 22, dislikes: 1, views: 735, isPopular: true },
  { id: 'p-free-2', boardId: 'free', headword: '질문', title: '첫 중고차 점검 항목 조언 부탁드립니다', excerpt: '계약 전에 꼭 확인해야 할 항목을 경험자분들께 여쭙습니다.', author: '첫차준비중', createdAt: '2026-11-01T03:10:00Z', updatedAt: '2026-11-01T03:50:00Z', comments: 27, likes: 14, dislikes: 0, views: 612 },
  { id: 'p-free-3', boardId: 'free', headword: '유머', title: '세차하고 나오자마자 비가 옵니다', excerpt: '이번에도 일기예보보다 제 세차 일정이 정확했습니다.', author: '맑은날세차', createdAt: '2026-11-01T01:45:00Z', updatedAt: '2026-11-01T01:45:00Z', thumbnail: 'images/community/board-header-mercedes-glb-family.webp', mediaKind: 'video', comments: 11, likes: 31, dislikes: 0, views: 980 },
  { id: 'p-free-4', boardId: 'free', headword: '정보', title: '장거리 운전 전에 확인한 차량 점검 목록입니다', excerpt: '타이어와 오일류를 중심으로 출발 전 확인한 항목입니다.', author: '안전운전중', createdAt: '2026-11-01T00:50:00Z', updatedAt: '2026-11-01T00:50:00Z', comments: 9, likes: 28, dislikes: 0, views: 844 },
  { id: 'p-free-5', boardId: 'free', headword: '질문', title: '보험 갱신할 때 특약 어떤 걸 넣으셨나요?', excerpt: '주행거리 특약과 안전장치 할인 조건을 비교 중입니다.', author: '보험비교중', createdAt: '2026-10-31T23:35:00Z', updatedAt: '2026-10-31T23:35:00Z', thumbnail: 'images/community/board-header-aston-martin-db12.webp', comments: 24, likes: 17, dislikes: 1, views: 620 },
  { id: 'p-free-6', boardId: 'free', headword: '일상', title: '오늘 출근길 연비가 평소보다 잘 나왔습니다', excerpt: '막히지 않는 시간대에 달리니 차이가 꽤 크네요.', author: '연비기록러', createdAt: '2026-10-31T22:10:00Z', updatedAt: '2026-10-31T22:10:00Z', comments: 7, likes: 13, dislikes: 0, views: 311 },
  { id: 'p1', boardId: 'domestic', headword: '기아', title: '마그마 주조휠 단조휠 차이 꽤 납니다', excerpt: '실사용에서 느낀 승차감과 무게 차이를 정리했습니다.', author: '스탄IGV60Mag', createdAt: '2026-11-01T03:30:00Z', updatedAt: '2026-11-01T03:30:00Z', thumbnail: 'images/community/board-header-genesis-yeosu.webp', comments: 32, likes: 18, dislikes: 1, views: 4661, isPopular: true },
  { id: 'p2', boardId: 'ev', headword: '충전', title: '[질문] 충전 몇 프로 채우세요?', excerpt: '완속 충전 시 80%와 90% 중 어떤 설정을 쓰시나요?', author: '두부lev3', createdAt: '2026-11-01T02:45:00Z', updatedAt: '2026-11-01T03:42:00Z', comments: 12, likes: 5, dislikes: 0, views: 224 },
  { id: 'p3', boardId: 'imported', headword: '벤츠', title: 'GLC EV 실내 공간은 이 정도입니다', excerpt: '2열 무릎 공간과 트렁크 실측 사진을 함께 올립니다.', author: '노이예ix3', createdAt: '2026-10-31T23:30:00Z', updatedAt: '2026-11-01T01:20:00Z', thumbnail: 'images/community/board-header-mercedes-glb-family.webp', comments: 36, likes: 29, dislikes: 2, views: 2939, isPopular: true },
  { id: 'p4', boardId: 'ev', headword: '충전', title: '충전이 다됐다고 함부로 충전기 뽑지 말아주세요', excerpt: '공용 충전기 이용 예절에 대해 서로 의견을 나눠봅시다.', author: '후니이니', createdAt: '2026-10-31T16:20:00Z', updatedAt: '2026-10-31T17:10:00Z', comments: 24, likes: 41, dislikes: 4, views: 1504 },
  { id: 'p5', boardId: 'imported', headword: '아우디', title: '후면 배지의 차이가 궁금해요', excerpt: '같은 연식인데 배지 위치가 다른 이유를 아시는 분 계실까요?', author: '솔루션EV4', createdAt: '2026-10-31T09:10:00Z', updatedAt: '2026-10-31T09:10:00Z', thumbnail: 'images/community/board-header-aston-martin-db12.webp', comments: 5, likes: 3, dislikes: 0, views: 230 },
  { id: 'p6', boardId: 'domestic', headword: '현대', title: '그랜저 IG 겨울철 시동 지연 해결 후기', excerpt: '아침마다 시동이 늦게 걸려서 배터리와 점화 플러그를 차례로 점검했습니다.', author: '아침출근러', createdAt: '2026-11-01T06:10:00Z', updatedAt: '2026-11-01T07:00:00Z', comments: 41, likes: 63, dislikes: 2, views: 5120, isPopular: true },
  { id: 'p7', boardId: 'domestic', headword: '제네시스', title: 'GV80 타이어 교체 주기 어떻게 잡으세요?', excerpt: '4만km 탔는데 앞바퀴 마모가 빠른 편이라 위치 교환을 고민 중입니다.', author: '타이어고민', createdAt: '2026-10-31T12:20:00Z', updatedAt: '2026-10-31T13:00:00Z', comments: 19, likes: 12, dislikes: 0, views: 1830 },
  { id: 'p8', boardId: 'maintenance', headword: '정비', title: '엔진오일 교환 주기 5천 vs 1만km 정리', excerpt: '제조사 권장 주기와 가혹 조건 기준을 차종별로 비교했습니다.', author: '정비하는아빠', createdAt: '2026-10-30T09:00:00Z', updatedAt: '2026-10-30T11:30:00Z', comments: 57, likes: 88, dislikes: 5, views: 9340, isPopular: true },
  { id: 'p9', boardId: 'maintenance', headword: 'DIY', title: '배터리 셀프 교체 도전기 (사진 많음)', excerpt: '단자 분리 순서와 메모리 백업 방법까지 직접 해보고 정리했습니다.', author: '공구덕후', createdAt: '2026-11-01T05:30:00Z', updatedAt: '2026-11-01T05:30:00Z', thumbnail: 'images/community/board-header-genesis-yeosu.webp', comments: 14, likes: 26, dislikes: 0, views: 1270 },
  { id: 'p10', boardId: 'ev', headword: '배터리', title: '아이오닉5 겨울철 주행거리 실측입니다', excerpt: '영하 5도에서 히터를 켜고 출퇴근한 일주일 기록을 공유합니다.', author: '전기로출근', createdAt: '2026-11-01T07:40:00Z', updatedAt: '2026-11-01T08:10:00Z', comments: 33, likes: 47, dislikes: 1, views: 3605, isPopular: true },
  { id: 'p11', boardId: 'imported', headword: 'BMW', title: '5시리즈 G60 하체 소음 원인 찾았습니다', excerpt: '방지턱 넘을 때 나던 소리가 스태빌라이저 링크 문제였네요.', author: '비머오너', createdAt: '2026-10-29T14:00:00Z', updatedAt: '2026-10-29T16:20:00Z', comments: 22, likes: 35, dislikes: 1, views: 4012 },
  { id: 'p12', boardId: 'imported', headword: '테슬라', title: '모델Y 주니퍼 2주 타본 장단점', excerpt: '승차감과 소음은 확실히 좋아졌고 아쉬운 점도 정리했습니다.', author: '주니퍼입문', createdAt: '2026-11-01T08:30:00Z', updatedAt: '2026-11-01T08:30:00Z', thumbnail: 'images/community/board-header-mercedes-glb-family.webp', comments: 28, likes: 39, dislikes: 6, views: 2877 },
  { id: 'p13', boardId: 'blackbox', headword: '블랙박스', title: '고속도로 낙하물 블랙박스 영상입니다', excerpt: '앞차에서 떨어진 판자를 겨우 피했습니다. 다들 차간 거리 꼭 지키세요.', author: '안전거리지킴', createdAt: '2026-11-01T09:00:00Z', updatedAt: '2026-11-01T09:40:00Z', comments: 71, likes: 120, dislikes: 3, views: 15420, isPopular: true },
  { id: 'p14', boardId: 'blackbox', headword: '사고', title: '교차로 비보호 좌회전 사고 과실 비율 질문', excerpt: '신호 없는 교차로에서 직진 차량과 부딪혔습니다. 과실이 어떻게 될까요?', author: '사고처리중', createdAt: '2026-10-31T10:10:00Z', updatedAt: '2026-10-31T12:00:00Z', comments: 46, likes: 18, dislikes: 2, views: 6210 },
  { id: 'p15', boardId: 'defect', headword: '변속기', title: '스포티지 변속 충격 무상수리 받았습니다', excerpt: '2단에서 3단 넘어갈 때 덜컹거림이 있어 서비스센터에 접수한 과정입니다.', author: '스포티지오너', createdAt: '2026-10-30T15:00:00Z', updatedAt: '2026-10-31T09:00:00Z', comments: 38, likes: 52, dislikes: 1, views: 7480 },
  { id: 'p16', boardId: 'bike', headword: '투어', title: '혼다 PCX 첫 장거리 투어 후기', excerpt: '서울에서 강릉까지 국도로 다녀왔습니다. 시트와 연비 위주로 적었어요.', author: '두바퀴여행', createdAt: '2026-10-31T06:00:00Z', updatedAt: '2026-10-31T06:00:00Z', comments: 9, likes: 21, dislikes: 0, views: 940 },
  { id: 'p17', boardId: 'truck', headword: '트럭', title: '포터2 전기 겨울 화물 운송 해보니', excerpt: '적재량이 많을 때 겨울 주행거리가 얼마나 줄어드는지 기록했습니다.', author: '화물기사김씨', createdAt: '2026-10-31T21:00:00Z', updatedAt: '2026-10-31T21:30:00Z', comments: 15, likes: 24, dislikes: 1, views: 1650 },
]

export function filterAndSortPosts(
  posts: CommunityPost[],
  selectedBoardId: string,
  selectedHeadword: string,
  selectedSort: CommunitySort,
  selectedPopularPeriod: CommunityPopularPeriod = 'all',
  now = Date.now(),
) {
  const periodMilliseconds: Record<CommunityPopularPeriod, number> = {
    hour: 3_600_000,
    day: 86_400_000,
    week: 604_800_000,
    month: 2_592_000_000,
    year: 31_536_000_000,
    all: Number.POSITIVE_INFINITY,
  }
  const source = posts.filter((post) => {
    if (post.boardId !== selectedBoardId || (selectedHeadword && post.headword !== selectedHeadword)) return false
    if (selectedSort !== 'popular') return true
    return now - Date.parse(post.createdAt) <= periodMilliseconds[selectedPopularPeriod]
  })
  return [...source].sort((a, b) => {
    if (selectedSort === 'popular') return (b.likes + b.comments * 2) - (a.likes + a.comments * 2)
    if (selectedSort === 'latest-comment') return Date.parse(b.updatedAt) - Date.parse(a.updatedAt)
    return Date.parse(b.createdAt) - Date.parse(a.createdAt)
  })
}

export function useCommunity() {
  const posts = useState<CommunityPost[]>('community-posts', () => seedPosts)
  const sort = useState<CommunitySort>('community-sort', () => 'latest')
  const popularPeriod = useState<CommunityPopularPeriod>('community-popular-period', () => 'all')
  const view = useState<CommunityView>('community-view-v2', () => 'compact')
  const boardId = useState<string>('community-board', () => 'free')
  const headword = useState<string>('community-headword', () => '')

  const boards = computed(() => sections.flatMap(section => section.boards))
  const activeBoard = computed(() => boards.value.find(board => board.id === boardId.value) || boards.value[0]!)
  const filteredPosts = computed(() => filterAndSortPosts(posts.value, boardId.value, headword.value, sort.value, popularPeriod.value))

  return { sections, boards, posts, sort, popularPeriod, view, boardId, headword, activeBoard, filteredPosts }
}
