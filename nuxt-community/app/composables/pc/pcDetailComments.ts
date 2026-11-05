// PC 게시글 상세 — 정적 bobaedream-pc-board-detail.html 의 기본 댓글 10개(글자 그대로) (2026-11-04)
export type PcComment = {
  id: string
  author: string
  level: string
  avatar?: string
  badge?: string
  text: string
  time: string
  /** null 이면 숫자 칸 없음(정적 판 .num 이 없는 상태) */
  buff: number | null
  nerf: number | null
  long?: boolean
  replies: string[]
  composer: boolean
  replyDraft: string
  menu: boolean
}

/** localStorage 에 저장되는 댓글(정적 판 addComment 의 comment 객체) */
export type SavedComment = { author: string; level?: string; text: string; time?: string; buff?: number; nerf?: number }

const u = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=70&q=70`

const BASE: Array<Omit<PcComment, 'id' | 'replies' | 'composer' | 'replyDraft' | 'menu'>> = [
  { author: '디젤은이제안녕', level: 'LV 12', text: '시내 14면 차 크기 생각하면 꽤 잘 나오는 편이네요. 가솔린이랑 유지비 차이 확실히 날 듯합니다.', time: '15분 전', buff: 8, nerf: null },
  { author: '카니발대기중', level: 'LV 6', text: '브레이크 감각은 저도 처음에 적응 좀 걸렸습니다. 회생제동 느낌이 섞여서 그런지 초반에 살짝 이질감 있어요.', time: '12분 전', buff: 4, nerf: null },
  { author: '전기맛입문', level: 'LV 19', avatar: u('photo-1500648767791-00dcc994a43e'), text: '저는 EV9 보다가 예산 때문에 쏘렌토 하브로 왔는데, 충전 스트레스 없는 게 생각보다 큽니다.', time: '9분 전', buff: 6, nerf: 1 },
  { author: '정비소옆집', level: 'LV 31', badge: '작성자', text: '가격은 진짜 옵션표 열면 마음이 흔들립니다. 그래도 패밀리카 기준이면 안전 옵션은 빼기가 어렵더라고요.', time: '8분 전', buff: 3, nerf: null },
  { author: '쏘렌토계약자', level: 'LV 4', text: '출고 대기 얼마나 걸리셨나요? 저는 5개월째 연락 기다리는 중입니다.', time: '6분 전', buff: 2, nerf: null },
  { author: '장거리운행러', level: 'LV 27', long: true, avatar: u('photo-1519085360753-af0119f7cbe7'), text: '고속 안정감은 타이어 영향도 꽤 있습니다. 순정 타이어로도 조용하긴 한데, 공기압 조금 높게 잡으면 뒷좌석에서 통통 튀는 느낌이 생기더라고요.\n\n저는 2열에 부모님 태우는 날이 많아서 공기압 표준보다 살짝 낮춰 타고 있습니다. 연비는 조금 손해 봐도 승차감이 훨씬 낫습니다.\n\n글쓴 분 말처럼 패밀리카로는 충분히 좋은데, 가격표 보고 계약하면 처음 예상보다 확 올라갑니다.', time: '4분 전', buff: 12, nerf: 1 },
  { author: '블박찾는중', level: 'LV 8', text: '트렁크 단차 얘기 공감합니다. 캠핑 짐 넣을 때 은근 신경 쓰입니다.', time: '2분 전', buff: 1, nerf: null },
  { author: '패밀리카고민', level: 'LV 5', text: '저도 아이 둘이라 2열 승차감이 제일 궁금했는데 도움 됐습니다.', time: '1분 전', buff: null, nerf: null },
  { author: '보험료비교중', level: 'LV 15', text: '보험료는 생각보다 차이 안 나더군요. 옵션 가격이 더 크게 체감됩니다.', time: '방금 전', buff: 1, nerf: null },
  { author: '출고인증기다림', level: 'LV 3', text: '실내 사진 있는 버전도 나중에 보고 싶네요. 색상 선택 중입니다.', time: '방금 전', buff: null, nerf: null },
]

let seq = 0
export function makeComment(c: Omit<PcComment, 'id' | 'replies' | 'composer' | 'replyDraft' | 'menu'>): PcComment {
  seq += 1
  return { ...c, id: 'c' + seq, replies: [], composer: false, replyDraft: '', menu: false }
}

export function baseComments(): PcComment[] {
  return BASE.map(makeComment)
}

/** 정적 판 commentHtml(): 저장된 댓글은 숫자가 0이면 칸을 만들지 않는다. */
export function fromSaved(c: SavedComment): PcComment {
  return makeComment({ author: c.author, level: c.level || 'LV 2', text: c.text, time: c.time || '방금 전', buff: c.buff ? c.buff : null, nerf: c.nerf ? c.nerf : null })
}
