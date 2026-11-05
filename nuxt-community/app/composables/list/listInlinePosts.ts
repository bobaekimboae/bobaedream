// naver-cafe-list.html 안의 <script>에 들어 있던 목록형 · 간결형용 예시 글 32개(정적 판과 같은 값).
import type { ListPost } from './listData'

export const defaultTopics = ['전체', '테슬라', 'BMW', '벤츠', '일론', 'TSLA', '스페이스', '전기차', '정비', '튜닝', '중고차', '보험', '블박']

const titles = [
  '[전기차] 제네시스 GV90 네오룬 공개', '[테슬라] 테슬라 니우스', '[테슬라] 모델Y 트렁크 매트 추천 부탁드립니다', '[정비] 모델3 하이랜드 도어라이트 DIY 비용 공유',
  '[튜닝] 프렁크 소프트 클로징 장착 후기입니다', '[뻘글] 하하하 도박 중독보다 위험하네요...', '[블박] 사제 블박으로 문콕을 잡을 수 있나요?', '[시승기] 아이오닉5N 하루 타보고 느낀 점',
  '[중고차] 중고 모델3 롱레인지 6만km 괜찮을까요?', '[보험] 접촉사고 과실 비율 이게 맞나요?', '[전기차] 전비 5.8 나오는데 제 운전 습관 문제일까요', '[정비] 실내 필터 교체 직접 해보신 분 난이도 어떤가요?',
  '[튜닝] 랩핑 색상 샘플 받았는데 무광 관리 어렵나요?', '[테슬라] 오토파일럿 차선 중앙 유지가 흔들립니다', '[전기차] 겨울 대비 배터리 프리컨디셔닝 체감 후기', '[보험] 보험료 갱신했는데 작년보다 18만원 올랐네요',
  '[정비] 타이어 공기압 42psi 유지하시는 분들 계신가요?', '[정비] 하이랜드 실내 잡소리 체크 포인트', '[전기차] 근처 급속 충전소 공유합니다', '[테슬라] 차주 인증사진 올립니다',
  '[튜닝] 무광 그립톡 구매 완료했는데 색상 고민이네요', '[TSLA주식] FSD 일시불 구매했다 vs 안했다 투표', '[사회] 전기차 충전구역 장기 주차 신고 기준', '[경제] 중고 전기차 감가가 어디까지 갈까요',
  '[스포츠] 서킷 주행 입문 타이어 추천 부탁드립니다', '[스페이스X] 스타십 발사 일정 또 밀린 건가요?', '[일론머스크] 로보택시 일정 믿을만한가요', '[블박] 후방카메라 야간 화질 비교',
  '[중고차] 모델Y에서 EV9으로 갈아탈까 고민', '[정비] 브레이크 분진 적은 패드 추천',
]
const users = [
  '전기차궁금', '하이랜드초보', '트렁크테트리스', '송파T불빠따', '디젤끝물', '연비왕김대표', '캠핑짐만렙', '고속도로요정', '중고차보는눈', '보험료실화냐',
  '전비계산러', '필터자가교체', '랩핑샘플러', '차선중앙러', '겨울배터리', '갱신무섭다', '공기압42', '실내잡소리', '급속충전러', '차주인증러',
  '컬러고민러', '주식은장투', '충전매너러', '감가계산기', '서킷초보', '우주덕후', '로보택시궁금', '블박판독러', '갈아탈까', '분진싫어',
]
const cats = [
  '전기차', '테슬라', '테슬라', '정비', '튜닝', '블박', '블박', '전기차', '중고차', '보험', '전기차', '정비', '튜닝', '테슬라', '전기차',
  '보험', '정비', '정비', '전기차', '테슬라', '튜닝', 'TSLA', '전기차', '중고차', '전기차', '스페이스', '일론', '블박', '중고차', '정비',
]
const replies = [13, 9, 22, 7, 1284, 12, 3, 58, 31, 11, 67, 28, 41, 6, 18, 23, 88, 5, 36, 74, 12, 4, 12000, 9, 21, 17, 30, 10, 6, 14]
const views = [1025, 694, 363, 32, 118, 144, 88, 512, 377, 241, 196, 209, 331, 403, 266, 152, 189, 276, 463, 119, 74, 835, 901, 624, 558, 482, 715, 247, 389, 168]
const times = [
  '1분 전', '2분 전', '3분 전', '4분 전', '5분 전', '6분 전', '8분 전', '12분 전', '18분 전', '24분 전', '33분 전', '47분 전', '1시간 전', '1시간 전', '2시간 전',
  '3시간 전', '3시간 전', '4시간 전', '5시간 전', '6시간 전', '7시간 전', '9시간 전', '12시간 전', '1일 전', '1일 전', '1일 전', '1일 전', '2일 전', '2일 전', '2일 전',
]
export const inlineImgIds = [
  'photo-1617788138017-80ad40651399', 'photo-1605810230434-7631ac76ec81', 'photo-1563720223185-11003d516935', 'photo-1542362567-b07e54358753',
  'photo-1603386329225-868f9b1ee6c9', 'photo-1593941707882-a5bba14938c7', 'photo-1609521263047-f8f205293f24', 'photo-1560958089-b8a1929cea89',
  'photo-1536700503339-1e4b06520771', 'photo-1553440569-bcc63803a83d', 'photo-1607860108855-64acf2078ed9', 'photo-1541899481282-d53bffe3c35d',
  'photo-1492144534655-ae79c964c9d7', 'photo-1503376780353-7e6692767b70', 'photo-1583121274602-3e2820c69888',
]
const photos = [38, 0, 2, 6, 8, 0, 15, 4, 1, 3, 0, 2, 11, 0, 5, 0, 3, 2, 6, 9, 0, 4, 2, 7, 0, 6, 3, 2, 5, 0]

export function createInlinePosts(): ListPost[] {
  const posts: ListPost[] = titles.map((t, i) => {
    const has = [false, false, true, true, false, true, true, false, false, false][i % 10]
    return {
      id: i + 1, title: t, user: users[i]!, category: cats[i], time: times[i], view: views[i], reply: replies[i], fresh: i < 8,
      thumb: has ? 'https://images.unsplash.com/' + inlineImgIds[i % inlineImgIds.length] + '?auto=format&fit=crop&w=220&q=75' : '',
      photos: has ? photos[i] : 0, video: i % 7 === 2, mediaLink: has && i % 3 === 0, rank: i % 7,
    }
  })
  posts.push(
    { id: 31, title: '[BMW] G30 520d 중고 입문 전에 확인할 정비 항목', user: '비엠입문자', category: 'BMW', time: '3분 전', view: 732, reply: 18, fresh: true, thumb: 'https://images.unsplash.com/photo-1556189250-72ba954cfc2b?auto=format&fit=crop&w=220&q=75', photos: 6, video: false, mediaLink: false, rank: 3 },
    { id: 32, title: '[벤츠] E클래스 인증중고와 일반 매물 차이가 큰가요?', user: '삼각별입문', category: '벤츠', time: '7분 전', view: 641, reply: 14, fresh: true, thumb: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=220&q=75', photos: 4, video: false, mediaLink: false, rank: 4 },
  )
  return posts
}

export const writePostKey = 'bbm.community.latestPost.v2'
function categoryForBoard(board: string) {
  return ({ 자유게시판: '자유', '국산차 오너톡': '국산차', '수입차 라운지': '수입차', 전기차: '전기차', '정비 · DIY': '정비', 튜닝: '튜닝', 중고차: '중고차', '보험 · 사고': '보험', '블랙박스 제보': '블박', 바이크: '바이크', '자동차뉴스/토론': '자동차뉴스', 자동차뉴스: '자동차뉴스' } as Record<string, string>)[board] || '자유'
}
function pollFromHtml(html: unknown) {
  try {
    const el = new DOMParser().parseFromString('<div>' + String(html || '') + '</div>', 'text/html').querySelector('.editor-poll')
    if (!el) return null
    const raw = el.getAttribute('data-poll')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && parsed.title && Array.isArray(parsed.options) && parsed.options.length >= 2) return parsed
    }
    const title = (el.querySelector('.bbmPollTitle') || el.querySelector('strong'))?.textContent || ''
    const opts = Array.from(el.querySelectorAll('.bbmPollLabel,.poll-option-preview')).map(s => (s.textContent || '').replace(/^○\s*/, '').trim()).filter(Boolean)
    const note = el.querySelector('small')?.textContent || ''
    return opts.length ? { title: title.replace(/^📊\s*/, '').trim(), options: opts, note } : null
  } catch { return null }
}
function esc(v: unknown) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
}
/** 글쓰기 화면이 저장한 방금 쓴 글(정적 판과 같은 키) */
export function loadLocalPost(): ListPost | null {
  try {
    const saved = JSON.parse(localStorage.getItem(writePostKey) || 'null')
    if (!saved || saved.status !== 'LOCAL_PREVIEW' || !saved.title) return null
    const submitted = Date.parse(saved.submittedAt || saved.savedAt || '') || Date.now()
    return {
      id: submitted, title: '[' + esc(saved.head || categoryForBoard(saved.board)) + '] ' + saved.title, user: '보배드림 회원',
      category: saved.head || categoryForBoard(saved.board), time: '방금 전', view: 0, reply: 0, fresh: true, thumb: '',
      photos: (saved.photos || []).length, video: (saved.videos || []).length > 0, rank: 0, local: true, board: saved.board || '',
      body: Array.isArray(saved.body) ? saved.body : [], media: Array.isArray(saved.media) ? saved.media : [], embeds: Array.isArray(saved.embeds) ? saved.embeds : [],
      hideBody: Boolean(saved.hideBody), poll: pollFromHtml(saved.html),
    }
  } catch {
    try { localStorage.removeItem(writePostKey) } catch { /* 무시 */ }
    return null
  }
}
