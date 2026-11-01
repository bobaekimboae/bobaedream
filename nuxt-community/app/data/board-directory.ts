// 커뮤니티 게시판 분류(2026-11-01 사용자 지시 트리). 「차량」 묶음은 「교통/운송」으로 이름을 바꿨다.
// hidden = 기본 미노출(분류 화면에서 「숨긴 게시판 보기」를 켜야 보임).
// boardId = 지금 목록 화면(useCommunity)에 있는 게시판과 연결되는 경우만 적는다.

export type DirectoryGroupId = 'fixed' | 'general' | 'sports' | 'cars' | 'transport' | 'reports' | 'defects'

export interface DirectoryBoard {
  id: string
  name: string
  hidden?: boolean
  boardId?: string
}

export interface DirectoryGroup {
  id: DirectoryGroupId
  name: string
  icon: string
  boards: DirectoryBoard[]
}

export const boardDirectory: DirectoryGroup[] = [
  {
    id: 'fixed', name: '고정', icon: 'fixed',
    boards: [
      { id: 'home', name: '홈' },
      { id: 'all', name: '전체' },
      { id: 'best', name: '베스트글' },
    ],
  },
  {
    id: 'general', name: '일반', icon: 'general',
    boards: [
      { id: 'free', name: '자유게시판', boardId: 'free' },
      { id: 'politics', name: '정치/시사게시판', boardId: 'politics' },
      { id: 'adult', name: '성인게시판', hidden: true },
      { id: 'bobae-story', name: '보배드림 이야기' },
      { id: 'suggestion', name: '제안/건의' },
      { id: 'event', name: '이벤트' },
      { id: 'issue', name: '신유머/감동/이슈' },
      { id: 'humor', name: '유머게시판', boardId: 'humor' },
      { id: 'free-media', name: '자유사진/동영상', hidden: true },
      { id: 'nsfw', name: '후방주의방', hidden: true },
      { id: 'racing-model', name: '레이싱모델', hidden: true },
      { id: 'military', name: '군사/무기', hidden: true },
      { id: 'air-sea-rail', name: '항공/해운/철도' },
    ],
  },
  {
    id: 'sports', name: '스포츠', icon: 'sports',
    boards: [
      { id: 'kbo', name: '국내야구' },
      { id: 'mlb', name: '해외야구' },
      { id: 'k-football', name: '국내축구' },
      { id: 'world-football', name: '해외축구' },
    ],
  },
  {
    id: 'cars', name: '자동차', icon: 'cars',
    boards: [
      { id: 'car-news', name: '자동차뉴스' },
      { id: 'world-car-news', name: '해외 자동차뉴스' },
      { id: 'brand-info', name: '브랜드 자동차 정보' },
      { id: 'car-review', name: '차량리뷰' },
      { id: 'owner-review', name: '투후 오너 리뷰' },
      { id: 'fuel', name: '연비·전비' },
      { id: 'test-drive', name: '시승기/배틀/목격담' },
      { id: 'celeb-car', name: '유명인의 차' },
      { id: 'domestic', name: '국산차게시판', boardId: 'domestic' },
      { id: 'imported', name: '수입차게시판', boardId: 'imported' },
      { id: 'tesla', name: '테슬라' },
      { id: 'bmw', name: 'BMW' },
      { id: 'benz', name: '벤츠' },
      { id: 'my-car', name: '내차사진' },
      { id: 'car-media', name: '자동차사진/동영상' },
      { id: 'install', name: '장착시공사진', hidden: true },
      { id: 'old-car', name: '올드카/추억거리' },
    ],
  },
  {
    id: 'transport', name: '교통/운송', icon: 'transport',
    boards: [
      { id: 'truck-bus-heavy', name: '트럭/버스/중기', boardId: 'truck' },
      { id: 'bike-bicycle', name: '오토바이/자전거', boardId: 'bike' },
    ],
  },
  {
    id: 'reports', name: '제보', icon: 'reports',
    boards: [
      { id: 'accident', name: '교통사고/블박', boardId: 'blackbox' },
      { id: 'spotted', name: '직찍/특종발견', boardId: 'news-tip' },
    ],
  },
  {
    id: 'defects', name: '결함', icon: 'defects',
    boards: [
      { id: 'defect', name: '차량 결함·불만', boardId: 'defect' },
      { id: 'chezhiwang', name: '처즈왕 결함·불만' },
    ],
  },
]

export function visibleBoards(group: DirectoryGroup, showHidden: boolean): DirectoryBoard[] {
  return group.boards.filter(board => showHidden || !board.hidden)
}

export function hiddenCount(groups: DirectoryGroup[] = boardDirectory): number {
  return groups.reduce((sum, group) => sum + group.boards.filter(board => board.hidden).length, 0)
}

export function searchBoards(keyword: string, showHidden: boolean, groups: DirectoryGroup[] = boardDirectory) {
  const q = keyword.replace(/\s+/g, '').toLowerCase()
  if (!q) return []
  return groups.flatMap(group => visibleBoards(group, showHidden)
    .filter(board => board.name.replace(/\s+/g, '').toLowerCase().includes(q))
    .map(board => ({ group, board })))
}
