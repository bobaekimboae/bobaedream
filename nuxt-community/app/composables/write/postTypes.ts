// 커뮤니티 글쓰기 「글 종류」(동처띠 발행 화면의 특수 글쓰기를 커뮤니티 편집기 안으로 옮긴 것, 2026-11-05)
// 글 종류는 이 목록 하나로 정한다. 항목을 더하거나 이름 · 칸 · 조건을 바꾸면 치지직형 · 네이버 카페형 두 글쓰기에 함께 반영된다.
// 나중에 운영에서는 같은 모양을 Laravel API(GET /community/post-types)가 돌려주면 이 목록 대신 쓴다.

export type FieldType = 'text' | 'number' | 'select' | 'chips' | 'rating' | 'month'

export interface PostField {
  key: string
  label: string
  type: FieldType
  required?: boolean
  placeholder?: string
  /** 숫자 칸 뒤에 붙는 단위 */
  unit?: string
  /** 숫자 칸 소수 자리(연비 12.5) */
  decimals?: number
  options?: string[]
  /** rating 칸: 항목별 별점(1~5) */
  items?: string[]
  /** 다른 칸 값에 따라 보일 때만(예: 전기차일 때만 전비) */
  showWhen?: { key: string, in: string[] }
}

export interface PostTypeRule {
  /** 본문 글자 수 최소 */
  minBody?: number
  /** 사진 장수 최소 */
  minPhotos?: number
  /** 그 밖의 검사(틀리면 안내 문구, 맞으면 '') */
  check?: (values: Record<string, unknown>) => string
}

export interface PostType {
  id: string
  label: string
  /** 글 종류 고르기 화면의 한 줄 설명 */
  description: string
  /** 본문 안내 문구 */
  placeholder: string
  fields: PostField[]
  rule?: PostTypeRule
}

const num = (value: unknown) => Number(String(value ?? '').replace(/,/g, '')) || 0

export const POST_TYPES: PostType[] = [
  {
    id: 'normal',
    label: '일반',
    description: '사진 · 영상 · 링크 · 투표를 자유롭게 넣는 글',
    placeholder: '함께 나누고 싶은 얘기를 남겨주세요.',
    fields: [],
  },
  {
    id: 'review',
    label: '차량 리뷰',
    description: '내 차를 항목별 별점과 총평으로 남겨요',
    placeholder: '타 보니 어땠는지 30자 이상 남겨 주세요.',
    fields: [
      { key: 'car', label: '차종', type: 'text', required: true, placeholder: '예: 현대 그랜저 GN7' },
      { key: 'owner', label: '오너 여부', type: 'chips', options: ['오너예요', '시승했어요'], required: true },
      { key: 'score', label: '항목별 별점', type: 'rating', items: ['디자인', '주행', '편의', '연비', '가성비'], required: true },
    ],
    rule: { minBody: 30 },
  },
  {
    id: 'fuel',
    label: '연비 · 전비',
    description: '실제로 탄 연비 · 전비를 기록해요',
    placeholder: '주행 조건(시내 · 고속 · 계절)을 함께 적어 주면 더 도움이 돼요.',
    fields: [
      { key: 'car', label: '차종', type: 'text', required: true, placeholder: '예: 기아 EV6 롱레인지' },
      { key: 'power', label: '동력', type: 'chips', options: ['가솔린', '디젤', 'LPG', '하이브리드', '전기'], required: true },
      { key: 'efficiency', label: '연비', type: 'number', unit: 'km/L', decimals: 1, required: true, showWhen: { key: 'power', in: ['가솔린', '디젤', 'LPG', '하이브리드'] } },
      { key: 'electric', label: '전비', type: 'number', unit: 'km/kWh', decimals: 1, required: true, showWhen: { key: 'power', in: ['전기'] } },
      { key: 'distance', label: '주행거리', type: 'number', unit: 'km' },
      { key: 'region', label: '지역', type: 'select', options: ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'] },
    ],
  },
  {
    id: 'ask',
    label: '질문',
    description: '정비 · 구매 · 보험 궁금증을 물어봐요',
    placeholder: '궁금한 점을 5자 이상 적어 주세요.',
    fields: [
      { key: 'topic', label: '분류', type: 'chips', options: ['정비', '구매', '보험 · 사고', '튜닝', '기타'], required: true },
      { key: 'car', label: '차종', type: 'text', placeholder: '관련 차종(선택)' },
    ],
    rule: { minBody: 5 },
  },
  {
    id: 'sell',
    label: '내 차 팔기',
    description: '차량 사진과 희망가로 판매글을 올려요',
    placeholder: '사고 · 정비 이력, 옵션, 차량 상태를 적어 주세요.',
    fields: [
      { key: 'car', label: '차종', type: 'text', required: true, placeholder: '예: BMW 520i M 스포츠' },
      { key: 'registered', label: '최초 등록', type: 'month', required: true },
      { key: 'mileage', label: '주행거리', type: 'number', unit: 'km', required: true },
      { key: 'price', label: '희망 판매가', type: 'number', unit: '만원', required: true },
      { key: 'region', label: '지역', type: 'select', options: ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'], required: true },
    ],
    rule: { minPhotos: 1 },
  },
  {
    id: 'price',
    label: '구매가',
    description: '실제로 산 가격과 조건을 공유해요',
    placeholder: '받은 혜택, 대리점, 할부 조건을 적어 주세요.',
    fields: [
      { key: 'car', label: '차종', type: 'text', required: true, placeholder: '예: 제네시스 GV80 2.5T' },
      { key: 'listPrice', label: '차량가', type: 'number', unit: '만원', required: true },
      { key: 'paidPrice', label: '실구매가', type: 'number', unit: '만원', required: true },
      { key: 'bought', label: '구매 시기', type: 'month', required: true },
      { key: 'payment', label: '결제', type: 'chips', options: ['일시불', '할부', '리스 · 렌트'] },
    ],
    rule: {
      check: (values) => {
        const list = num(values.listPrice)
        const paid = num(values.paidPrice)
        if (list && paid && paid < list * 0.5) return '실구매가가 차량가의 절반보다 적어요. 금액을 다시 확인해 주세요.'
        return ''
      },
    },
  },
]

export function postTypeById(id: string): PostType {
  return POST_TYPES.find(type => type.id === id) || POST_TYPES[0]!
}

export function fieldVisible(field: PostField, values: Record<string, unknown>): boolean {
  if (!field.showWhen) return true
  return field.showWhen.in.includes(String(values[field.showWhen.key] || ''))
}

function filled(field: PostField, value: unknown): boolean {
  if (field.type === 'rating') {
    const scores = (value || {}) as Record<string, number>
    return (field.items || []).every(item => Number(scores[item]) > 0)
  }
  return String(value ?? '').trim() !== ''
}

/** 글 종류 조건 검사. 맞으면 '' , 틀리면 등록을 막는 안내 문구 */
export function postTypeProblem(type: PostType, values: Record<string, unknown>, ctx: { bodyLength: number, photos: number }): string {
  for (const field of type.fields) {
    if (!field.required || !fieldVisible(field, values)) continue
    if (!filled(field, values[field.key])) return `${field.label}을(를) 입력해 주세요.`
  }
  if (type.rule?.minBody && ctx.bodyLength < type.rule.minBody) return `본문을 ${type.rule.minBody}자 이상 적어 주세요. (지금 ${ctx.bodyLength}자)`
  if (type.rule?.minPhotos && ctx.photos < type.rule.minPhotos) return `사진을 ${type.rule.minPhotos}장 이상 넣어 주세요.`
  return type.rule?.check?.(values) || ''
}

/** 상세 · 목록에 보여 줄 한 줄 요약(예: 「연비 · 전비 · 기아 EV6 · 전비 5.8km/kWh」) */
export function postTypeSummary(type: PostType, values: Record<string, unknown>): string[] {
  const out: string[] = []
  for (const field of type.fields) {
    if (!fieldVisible(field, values)) continue
    const value = values[field.key]
    if (field.type === 'rating') {
      const scores = Object.values((value || {}) as Record<string, number>).filter(Boolean)
      if (scores.length) out.push(`${field.label} 평균 ${(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)}`)
      continue
    }
    if (String(value ?? '').trim() === '') continue
    out.push(field.type === 'number' ? `${field.label} ${Number(value).toLocaleString('ko-KR')}${field.unit || ''}` : `${field.label} ${String(value)}`)
  }
  return out
}
