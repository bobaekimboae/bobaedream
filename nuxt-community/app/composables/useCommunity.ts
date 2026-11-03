import type { CommunityPopularPeriod, CommunityPost, CommunitySection, CommunitySort, CommunityView } from '../types/community'

const legacySections: CommunitySection[] = [
  {
    id: 'general',
    name: '일반',
    boards: [
      { id: 'home', sectionId: 'general', name: '커뮤니티 홈', shortName: '홈', tagline: '보배드림 커뮤니티의 모든 이야기', headwords: ['인기', '신규'], canWrite: false },
      { id: 'all', sectionId: 'general', name: '전체 게시글', shortName: '전체', tagline: '모든 게시판의 최신 이야기', headwords: ['자동차', '일상', '제보'], canWrite: true },
      { id: 'best', sectionId: 'general', name: '베스트글', shortName: '베스트', tagline: '지금 가장 주목받는 이야기', headwords: ['오늘', '주간', '월간'], canWrite: false },
      {
        id: 'free',
        sectionId: 'general',
        name: '자유게시판',
        shortName: '자유',
        description: '자동차와 일상을 편하게 나누는 보배드림 대표 커뮤니티입니다.',
        tagline: '자동차와 일상을 편하게 나누세요',
        kicker: 'LIFE',
        followerLabel: '팔로워 38.4만명',
        postCountLabel: '게시물 1,000개',
        banner: 'community/media/board-banners/free.webp',
        headwords: ['테슬라', 'BMW', '벤츠', '일론', 'TSLA', '스페이스', '전기차', '정비', '튜닝', '중고차', '보험', '블박'],
        canWrite: true,
      },
      { id: 'politics', sectionId: 'general', name: '정치게시판', headwords: ['정치', '시사'], canWrite: true },
      { id: 'humor', sectionId: 'general', name: '유머게시판', headwords: ['유머', '영상'], canWrite: true },
      { id: 'car-news', sectionId: 'general', name: '자동차뉴스', shortName: '자동차뉴스', tagline: '국내 자동차 업계의 최신 뉴스', headwords: ['신차', '산업', '정책'], canWrite: false },
      { id: 'foreign-news', sectionId: 'general', name: '해외 자동차뉴스', shortName: '해외뉴스', tagline: '세계 자동차 시장의 최신 뉴스', headwords: ['글로벌', '모터쇼', '전동화'], canWrite: false },
      { id: 'brand-info', sectionId: 'general', name: '브랜드 자동차 정보', shortName: '브랜드정보', tagline: '브랜드별 신차와 기술 정보', headwords: ['국산', '수입', '전기차'], canWrite: false },
      { id: 'vehicle-review', sectionId: 'general', name: '차량리뷰', shortName: '차량리뷰', tagline: '실제 오너와 전문가의 차량 리뷰', headwords: ['시승기', '오너리뷰', '비교'], canWrite: true },
    ],
  },
  {
    id: 'cars',
    name: '자동차',
    boards: [
      { id: 'domestic', sectionId: 'cars', name: '국산차게시판', shortName: '국산차', tagline: '대한민국 자동차의 모든 이야기', headwords: ['현대', '기아', '제네시스', '르노', 'KGM'], canWrite: true },
      { id: 'imported', sectionId: 'cars', name: '수입차게시판', shortName: '수입차', tagline: '수입차 오너의 경험과 정보', headwords: ['BMW', '벤츠', '아우디', '포르쉐', '테슬라'], canWrite: true },
      { id: 'ev', sectionId: 'cars', name: '전기차게시판', shortName: '전기차', tagline: '충전부터 배터리까지 전기차 정보', headwords: ['전기차', '충전', '배터리'], canWrite: true },
      { id: 'maintenance', sectionId: 'cars', name: '정비 · DIY', headwords: ['정비', '부품', 'DIY'], canWrite: true },
    ],
  },
  {
    id: 'vehicles',
    name: '차량',
    boards: [
      { id: 'bike', sectionId: 'vehicles', name: '바이크게시판', shortName: '바이크', tagline: '두 바퀴로 달리는 사람들의 이야기', headwords: ['바이크', '스쿠터', '투어'], canWrite: true },
      { id: 'truck', sectionId: 'vehicles', name: '트럭 · 특장', headwords: ['트럭', '특장', '운송'], canWrite: true },
      { id: 'heavy', sectionId: 'vehicles', name: '중기게시판', headwords: ['굴착기', '지게차', '건설기계'], canWrite: true },
      { id: 'camping', sectionId: 'vehicles', name: '캠핑카게시판', headwords: ['캠핑카', '카라반'], canWrite: true },
    ],
  },
  {
    id: 'sports',
    name: '스포츠',
    boards: [
      { id: 'f1', sectionId: 'sports', name: 'F1', shortName: 'F1', tagline: '가장 빠른 모터스포츠 이야기', banner: 'community/media/board-banners/f1.webp', headwords: ['경기', '다시보기', '규정', '기술', '직관'], canWrite: true },
    ],
  },
  {
    id: 'reports',
    name: '제보',
    boards: [
      { id: 'blackbox', sectionId: 'reports', name: '교통사고 · 블랙박스', shortName: '블랙박스', tagline: '교통사고와 블랙박스 제보', headwords: ['사고', '블랙박스', '교통법규'], canWrite: true },
      { id: 'news-tip', sectionId: 'reports', name: '사건 · 제보', headwords: ['사건', '제보', '뉴스'], canWrite: true },
    ],
  },
  {
    id: 'defects',
    name: '결함',
    boards: [
      { id: 'defect', sectionId: 'defects', name: '차량 결함 신고', shortName: '결함/불만', tagline: '차량 결함과 소비자 경험 공유', headwords: ['엔진', '변속기', '전장', '안전'], canWrite: true },
      { id: 'recall', sectionId: 'defects', name: '리콜 · 소비자 대응', headwords: ['리콜', '보증', '분쟁'], canWrite: true },
    ],
  },
]

function canonicalBoard(
  id: string,
  sectionId: CommunitySection['id'],
  name: string,
  shortName: string,
  headwords: string[] = ['전체'],
  extras: Partial<CommunitySection['boards'][number]> = {},
): CommunitySection['boards'][number] {
  return { id, sectionId, name, shortName, headwords, canWrite: true, ...extras }
}

// Canonical board catalogue from public/community/hupu-board-navigation.js @ 9758e991.
const sections: CommunitySection[] = [
  {
    id: 'general',
    name: '일반',
    boards: [
      canonicalBoard('home', 'general', '커뮤니티 홈', '홈', ['인기', '신규'], { tagline: '보배드림 커뮤니티의 모든 이야기', canWrite: false }),
      canonicalBoard('all', 'general', '전체 게시글', '전체', ['자동차', '일상', '제보']),
      canonicalBoard('best', 'general', '베스트글', '베스트', ['오늘', '주간', '월간'], { canWrite: false }),
      canonicalBoard('free', 'general', '자유게시판', '자유', ['테슬라', 'BMW', '벤츠', '일론', 'TSLA', '스페이스', '전기차', '정비', '튜닝', '중고차', '보험', '블박'], {
        description: '자동차와 일상을 편하게 나누는 보배드림 대표 커뮤니티입니다.',
        tagline: '자동차와 일상을 편하게 나누세요',
        kicker: 'LIFE',
        followerLabel: '팔로워 38.4만명',
        postCountLabel: '게시물 1,000개',
        banner: 'community/media/board-banners/free.webp',
      }),
      canonicalBoard('politics', 'general', '정치/시사게시판', '정치시사', ['정치', '시사']),
      canonicalBoard('adult', 'general', '성인게시판', '성인'),
      canonicalBoard('boba-story', 'general', '보배드림 이야기', '보배이야기'),
      canonicalBoard('suggestion', 'general', '제안/건의', '제안건의'),
      canonicalBoard('kbo', 'general', '국내야구', '국내야구'),
      canonicalBoard('mlb', 'general', '해외야구', '해외야구'),
      canonicalBoard('overseas-football', 'general', '해외축구', '해외축구'),
      canonicalBoard('domestic-football', 'general', '국내축구', '국내축구'),
      canonicalBoard('f1', 'general', 'F1', 'F1', ['경기', '다시보기', '규정', '기술', '직관'], {
        tagline: '가장 빠른 모터스포츠 이야기',
        banner: 'community/media/board-banners/f1.webp',
      }),
      canonicalBoard('event', 'general', '이벤트', '이벤트'),
      canonicalBoard('new-humor', 'general', '신유머/감동/이슈', '유머이슈'),
      canonicalBoard('humor', 'general', '유머게시판', '유머', ['유머', '영상']),
      canonicalBoard('free-media', 'general', '자유사진/동영상', '자유영상'),
      canonicalBoard('caution', 'general', '후방주의방', '후방주의'),
      canonicalBoard('racing-model', 'general', '레이싱모델', '레이싱'),
      canonicalBoard('military', 'general', '군사/무기', '군사무기'),
    ],
  },
  {
    id: 'cars',
    name: '자동차',
    boards: [
      canonicalBoard('car-news', 'cars', '자동차뉴스', '자동차뉴스', ['신차', '산업', '정책'], { tagline: '국내 자동차 업계의 최신 뉴스', canWrite: false }),
      canonicalBoard('foreign-car-news', 'cars', '해외 자동차뉴스', '해외뉴스', ['글로벌', '모터쇼', '전동화'], { tagline: '세계 자동차 시장의 최신 뉴스', canWrite: false }),
      canonicalBoard('brand-car-info', 'cars', '브랜드 자동차 정보', '브랜드정보', ['국산', '수입', '전기차'], { tagline: '브랜드별 신차와 기술 정보', canWrite: false }),
      canonicalBoard('vehicle-review', 'cars', '차량리뷰', '차량리뷰', ['시승기', '오너리뷰', '비교'], { tagline: '실제 오너와 전문가의 차량 리뷰' }),
      canonicalBoard('tuhu-review', 'cars', '투후 오너 리뷰', '투후리뷰'),
      canonicalBoard('fuel-economy', 'cars', '연비·전비', '연비전비'),
      canonicalBoard('test-drive', 'cars', '리뷰시승', '리뷰시승'),
      canonicalBoard('celebrity-car', 'cars', '유명인의 차', '유명인차'),
      canonicalBoard('domestic-car', 'cars', '국산차게시판', '국산차', ['현대', '기아', '제네시스', '르노', 'KGM']),
      canonicalBoard('import-car', 'cars', '수입차게시판', '수입차', ['BMW', '벤츠', '아우디', '포르쉐', '테슬라']),
      canonicalBoard('tesla', 'cars', '테슬라', '테슬라', ['테슬라', '충전', '배터리']),
      canonicalBoard('bmw', 'cars', 'BMW', 'BMW'),
      canonicalBoard('mercedes-benz', 'cars', '벤츠', '벤츠'),
      canonicalBoard('my-car-photo', 'cars', '내차사진', '내차사진'),
      canonicalBoard('car-media', 'cars', '자동차사진/동영상', '자동차영상'),
      canonicalBoard('installation', 'cars', '장착시공사진', '장착시공'),
      canonicalBoard('oldcar-memory', 'cars', '올드카/추억거리', '올드카'),
    ],
  },
  {
    id: 'vehicles',
    name: '차량/운송',
    boards: [
      canonicalBoard('truck-bus-heavy', 'vehicles', '트럭/버스/중기', '트럭중기'),
      canonicalBoard('aviation-rail', 'vehicles', '항공/해운/철도', '항공철도'),
      canonicalBoard('bike-cycle', 'vehicles', '오토바이/자전거', '바이크'),
    ],
  },
  { id: 'sports', name: '스포츠', boards: [] },
  {
    id: 'reports',
    name: '사건제보',
    boards: [
      canonicalBoard('accident-blackbox', 'reports', '교통사고/블박', '교통블박', ['사고', '블랙박스', '교통법규']),
      canonicalBoard('scoop', 'reports', '직찍/특종발견', '직찍특종'),
    ],
  },
  {
    id: 'defects',
    name: '결함/불만',
    boards: [
      canonicalBoard('autohome-complaint', 'defects', '차량 결함·불만', '결함불만', ['엔진', '변속기', '전장', '안전']),
      canonicalBoard('chezhiwang-complaint', 'defects', '처즈왕 결함·불만', '처즈왕불만'),
    ],
  },
]

void legacySections

const seedPosts: CommunityPost[] = [
  { id: 'p-free-1', boardId: 'free', headword: '전기차', title: '제네시스 GV80 장거리 시승 후기', excerpt: '제네시스 GV80으로 서울에서 강릉까지 왕복한 느낌을 정리해 봤습니다.', author: '전기차궁금', authorAvatar: 'community/media/profile-avatars/avatar-43.svg', timeLabel: '1분 전', createdAt: '2026-11-03T07:59:00+09:00', updatedAt: '2026-11-03T07:59:00+09:00', thumbnail: 'community/media/feed/post-01.webp', photoCount: 1, comments: 5, likes: 50, dislikes: 1, views: 1025, isPopular: true },
  { id: 'p-free-2', boardId: 'free', headword: '테슬라', title: '이번 업데이트 이후 달라진 점 정리', excerpt: '어젯밤 업데이트 후 출근길에 확인한 변화만 적어봅니다.', author: '하이랜드초보', authorAvatar: 'community/media/profile-avatars/avatar-22.svg', timeLabel: '2분 전', createdAt: '2026-11-03T07:58:00+09:00', updatedAt: '2026-11-03T07:58:00+09:00', comments: 6, likes: 36, dislikes: 1, views: 694 },
  { id: 'p-free-3', boardId: 'free', headword: '테슬라', title: '모델Y 트렁크 매트 추천 부탁드립니다', excerpt: '모델Y 5인승 트렁크 매트를 고르는 중인데 실제 사용 후기가 궁금합니다.', author: '트렁크테트리스', authorAvatar: 'community/media/profile-avatars/avatar-07.svg', timeLabel: '3분 전', createdAt: '2026-11-03T07:57:00+09:00', updatedAt: '2026-11-03T07:57:00+09:00', thumbnail: 'community/media/feed/post-03.webp', photoCount: 2, comments: 5, likes: 21, dislikes: 1, views: 363 },
  { id: 'p-free-4', boardId: 'free', headword: '정비', title: '모델3 하이랜드 도어라이트 DIY 비용 공유', excerpt: '모델3 하이랜드 도어라이트를 직접 교체했습니다.', author: '송파T불빠따', authorAvatar: 'community/media/profile-avatars/avatar-45.svg', timeLabel: '4분 전', createdAt: '2026-11-03T07:56:00+09:00', updatedAt: '2026-11-03T07:56:00+09:00', thumbnail: 'community/media/feed/post-04.webp', photoCount: 5, comments: 4, likes: 5, dislikes: 1, views: 32 },
  { id: 'p-free-5', boardId: 'free', headword: '튜닝', title: '프렁크 소프트 클로징 장착 후기입니다', excerpt: '프렁크를 세게 닫아야 하는 게 불편해서 소프트 클로징 모듈을 장착했습니다.', author: '디젤끝물', authorAvatar: 'community/media/profile-avatars/avatar-29.svg', timeLabel: '5분 전', createdAt: '2026-11-03T07:55:00+09:00', updatedAt: '2026-11-03T07:55:00+09:00', thumbnail: 'community/media/feed/post-05.webp', photoCount: 5, comments: 5, likes: 10, dislikes: 1, views: 118 },
  { id: 'p-free-6', boardId: 'free', headword: '뻘글', title: '하하하 도박 중독보다 위험하네요...', excerpt: '요즘 자동차보다 유지비가 더 무서운 취미가 생겼습니다.', author: '연비왕김대표', authorAvatar: 'community/media/profile-avatars/avatar-04.svg', timeLabel: '6분 전', createdAt: '2026-11-03T07:54:00+09:00', updatedAt: '2026-11-03T07:54:00+09:00', comments: 1284, likes: 1200, dislikes: 183, views: 144 },
  { id: 'p1', boardId: 'domestic-car', headword: '기아', title: '마그마 주조휠 단조휠 차이 꽤 납니다', excerpt: '실사용에서 느낀 승차감과 무게 차이를 정리했습니다.', author: '스탄IGV60Mag', createdAt: '2026-11-01T03:30:00Z', updatedAt: '2026-11-01T03:30:00Z', thumbnail: 'images/community/board-header-genesis-yeosu.webp', comments: 32, likes: 18, dislikes: 1, views: 4661, isPopular: true },
  { id: 'p2', boardId: 'tesla', headword: '충전', title: '[질문] 충전 몇 프로 채우세요?', excerpt: '완속 충전 시 80%와 90% 중 어떤 설정을 쓰시나요?', author: '두부lev3', createdAt: '2026-11-01T02:45:00Z', updatedAt: '2026-11-01T03:42:00Z', comments: 12, likes: 5, dislikes: 0, views: 224 },
  { id: 'p3', boardId: 'import-car', headword: '벤츠', title: 'GLC EV 실내 공간은 이 정도입니다', excerpt: '2열 무릎 공간과 트렁크 실측 사진을 함께 올립니다.', author: '노이예ix3', createdAt: '2026-10-31T23:30:00Z', updatedAt: '2026-11-01T01:20:00Z', thumbnail: 'images/community/board-header-mercedes-glb-family.webp', comments: 36, likes: 29, dislikes: 2, views: 2939, isPopular: true },
  { id: 'p4', boardId: 'tesla', headword: '충전', title: '충전이 다됐다고 함부로 충전기 뽑지 말아주세요', excerpt: '공용 충전기 이용 예절에 대해 서로 의견을 나눠봅시다.', author: '후니이니', createdAt: '2026-10-31T16:20:00Z', updatedAt: '2026-10-31T17:10:00Z', comments: 24, likes: 41, dislikes: 4, views: 1504 },
  { id: 'p5', boardId: 'import-car', headword: '아우디', title: '후면 배지의 차이가 궁금해요', excerpt: '같은 연식인데 배지 위치가 다른 이유를 아시는 분 계실까요?', author: '솔루션EV4', createdAt: '2026-10-31T09:10:00Z', updatedAt: '2026-10-31T09:10:00Z', thumbnail: 'images/community/board-header-aston-martin-db12.webp', comments: 5, likes: 3, dislikes: 0, views: 230 },
  { id: 'f1-1', boardId: 'f1', headword: '경기', title: '상파울루 그랑프리 연습 주행 같이 보실 분', excerpt: '이번 주말은 상파울루 그랑프리입니다. 연습 주행 1이 한국 시간 11월 7일 00시 30분에 시작합니다.', author: '피트월', createdAt: '2026-11-03T04:20:00Z', updatedAt: '2026-11-03T05:08:00Z', thumbnail: 'https://media.formula1.com/image/upload/c_lfill,w_1200/q_auto/v1740000001/trackside-images/2026/F1_Grand_Prix_of_Mexico/2303025381.webp', mediaKind: 'video', comments: 31, likes: 45, dislikes: 0, views: 2480, isPopular: true },
  { id: 'f1-2', boardId: 'f1', headword: '다시보기', title: '멕시코시티 GP 마지막 재시작 장면', excerpt: '베르스타펜과 해밀턴의 마지막 여덟 랩을 다시 보면서 추월 가능 지점을 정리했습니다.', author: '턴원브레이킹', createdAt: '2026-11-03T03:05:00Z', updatedAt: '2026-11-03T03:35:00Z', thumbnail: 'https://media.formula1.com/image/upload/t_16by9Centre/c_lfill,w_1200/q_auto/v1740000001/fom-website/2026/Mexico/GettyImages-2303040776.webp', comments: 42, likes: 96, dislikes: 2, views: 5210 },
  { id: 'f1-3', boardId: 'f1', headword: '기술', title: '2026 머신 에너지 회수 구간 비교', excerpt: '멕시코 섹터 2에서 팀별 배터리 전개와 회수 타이밍을 온보드로 비교했습니다.', author: '에어로맵', createdAt: '2026-11-02T23:20:00Z', updatedAt: '2026-11-03T01:04:00Z', comments: 27, likes: 72, dislikes: 1, views: 4196 },
  { id: 'f1-4', boardId: 'f1', headword: '규정', title: '세이프티카 재시작 규정 정리', excerpt: '최근 경기에서 자주 언급된 재시작 절차와 추월 허용 시점을 정리했습니다.', author: '레이스컨트롤', createdAt: '2026-11-02T21:10:00Z', updatedAt: '2026-11-02T22:30:00Z', comments: 55, likes: 83, dislikes: 4, views: 5704 },
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
    const matchesBoard = selectedBoardId === 'home' || selectedBoardId === 'all'
      ? true
      : selectedBoardId === 'best'
        ? Boolean(post.isPopular)
        : post.boardId === selectedBoardId
    if (!matchesBoard || (selectedHeadword && post.headword !== selectedHeadword)) return false
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
  const view = useState<CommunityView>('community-view-v9758', () => 'feed')
  const boardId = useState<string>('community-board', () => 'free')
  const headword = useState<string>('community-headword', () => '')

  const boards = computed(() => sections.flatMap(section => section.boards))
  const activeBoard = computed(() => boards.value.find(board => board.id === boardId.value) || boards.value[0]!)
  const filteredPosts = computed(() => filterAndSortPosts(posts.value, boardId.value, headword.value, sort.value, popularPeriod.value))

  return { sections, boards, posts, sort, popularPeriod, view, boardId, headword, activeBoard, filteredPosts }
}
