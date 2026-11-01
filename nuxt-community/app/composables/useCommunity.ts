import type { CommunityPost, CommunitySection, CommunitySort, CommunityView } from '../types/community'

const sections: CommunitySection[] = [
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
  { id: 'p-free-1', boardId: 'free', headword: '일상', title: '주말 드라이브 코스 어디가 좋을까요?', excerpt: '서울에서 두 시간 안쪽으로 다녀올 만한 코스를 추천해주세요.', author: '바람따라', createdAt: '2026-11-01T04:20:00Z', updatedAt: '2026-11-01T04:35:00Z', comments: 18, likes: 22, dislikes: 1, views: 735, isPopular: true },
  { id: 'p-free-2', boardId: 'free', headword: '질문', title: '첫 중고차 점검 항목 조언 부탁드립니다', excerpt: '계약 전에 꼭 확인해야 할 항목을 경험자분들께 여쭙습니다.', author: '첫차준비중', createdAt: '2026-11-01T03:10:00Z', updatedAt: '2026-11-01T03:50:00Z', comments: 27, likes: 14, dislikes: 0, views: 612 },
  { id: 'p-free-3', boardId: 'free', headword: '유머', title: '세차하고 나오자마자 비가 옵니다', excerpt: '이번에도 일기예보보다 제 세차 일정이 정확했습니다.', author: '맑은날세차', createdAt: '2026-11-01T01:45:00Z', updatedAt: '2026-11-01T01:45:00Z', comments: 11, likes: 31, dislikes: 0, views: 980 },
  { id: 'p1', boardId: 'domestic', headword: '기아', title: '마그마 주조휠 단조휠 차이 꽤 납니다', excerpt: '실사용에서 느낀 승차감과 무게 차이를 정리했습니다.', author: '스탄IGV60Mag', createdAt: '2026-11-01T03:30:00Z', updatedAt: '2026-11-01T03:30:00Z', thumbnail: '../community/assets/board-header-genesis-yeosu.webp', comments: 32, likes: 18, dislikes: 1, views: 4661, isPopular: true },
  { id: 'p2', boardId: 'ev', headword: '충전', title: '[질문] 충전 몇 프로 채우세요?', excerpt: '완속 충전 시 80%와 90% 중 어떤 설정을 쓰시나요?', author: '두부lev3', createdAt: '2026-11-01T02:45:00Z', updatedAt: '2026-11-01T03:42:00Z', comments: 12, likes: 5, dislikes: 0, views: 224 },
  { id: 'p3', boardId: 'imported', headword: '벤츠', title: 'GLC EV 실내 공간은 이 정도입니다', excerpt: '2열 무릎 공간과 트렁크 실측 사진을 함께 올립니다.', author: '노이예ix3', createdAt: '2026-10-31T23:30:00Z', updatedAt: '2026-11-01T01:20:00Z', thumbnail: '../community/assets/board-header-mercedes-glb-family.webp', comments: 36, likes: 29, dislikes: 2, views: 2939, isPopular: true },
  { id: 'p4', boardId: 'ev', headword: '충전', title: '충전이 다됐다고 함부로 충전기 뽑지 말아주세요', excerpt: '공용 충전기 이용 예절에 대해 서로 의견을 나눠봅시다.', author: '후니이니', createdAt: '2026-10-31T16:20:00Z', updatedAt: '2026-10-31T17:10:00Z', comments: 24, likes: 41, dislikes: 4, views: 1504 },
  { id: 'p5', boardId: 'imported', headword: '아우디', title: '후면 배지의 차이가 궁금해요', excerpt: '같은 연식인데 배지 위치가 다른 이유를 아시는 분 계실까요?', author: '솔루션EV4', createdAt: '2026-10-31T09:10:00Z', updatedAt: '2026-10-31T09:10:00Z', thumbnail: '../community/assets/board-header-aston-martin-db12.webp', comments: 5, likes: 3, dislikes: 0, views: 230 },
]

export function filterAndSortPosts(
  posts: CommunityPost[],
  selectedBoardId: string,
  selectedHeadword: string,
  selectedSort: CommunitySort,
) {
  const source = posts.filter(post => post.boardId === selectedBoardId && (!selectedHeadword || post.headword === selectedHeadword))
  return [...source].sort((a, b) => {
    if (selectedSort === 'popular') return (b.likes + b.comments * 2) - (a.likes + a.comments * 2)
    if (selectedSort === 'latest-comment') return Date.parse(b.updatedAt) - Date.parse(a.updatedAt)
    return Date.parse(b.createdAt) - Date.parse(a.createdAt)
  })
}

export function useCommunity() {
  const posts = useState<CommunityPost[]>('community-posts', () => seedPosts)
  const sort = useState<CommunitySort>('community-sort', () => 'latest')
  const view = useState<CommunityView>('community-view', () => 'feed')
  const boardId = useState<string>('community-board', () => 'free')
  const headword = useState<string>('community-headword', () => '')

  const boards = computed(() => sections.flatMap(section => section.boards))
  const activeBoard = computed(() => boards.value.find(board => board.id === boardId.value) || boards.value[0]!)
  const filteredPosts = computed(() => filterAndSortPosts(posts.value, boardId.value, headword.value, sort.value))

  return { sections, boards, posts, sort, view, boardId, headword, activeBoard, filteredPosts }
}
