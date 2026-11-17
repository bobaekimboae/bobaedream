import type { ChannelState, PhotoCheck, ScreenId, Vehicle } from '~/types/shortform'

export const MOCK_ONLY_NOTICE = '검수용 MOCK · 실제 SNS에 게시하지 않음'

export const NAV_ITEMS: Array<{ id: ScreenId; label: string; short: string; icon: string }> = [
  { id: 'dashboard', label: '대시보드', short: '홈', icon: 'grid' },
  { id: 'vehicles', label: '차량·매물 선택', short: '차량', icon: 'car' },
  { id: 'photos', label: '사진 품질 점검', short: '사진', icon: 'image' },
  { id: 'template', label: '템플릿·형식', short: '형식', icon: 'layout' },
  { id: 'render', label: '생성 진행', short: '생성', icon: 'spark' },
  { id: 'review', label: '미리보기·승인', short: '검수', icon: 'check' },
  { id: 'schedule', label: '채널·예약', short: '예약', icon: 'calendar' },
  { id: 'publish', label: '게시 상태·캘린더', short: '게시', icon: 'send' },
  { id: 'brand', label: '브랜드 키트', short: '브랜드', icon: 'palette' },
  { id: 'connections', label: 'SNS 연결·권한', short: '연결', icon: 'link' }
]

export const MOCK_VEHICLES: Vehicle[] = [
  { id: 'v-001', listingId: 'BD-261031-101', name: '제네시스 G80', trim: '2.5T AWD', year: 2024, mileageKm: 18420, priceWon: 59800000, color: '비크 블랙', fuel: '가솔린', status: 'for_sale', videoStatus: 'review', photoCount: 12, sourceVersion: 17, art: 'sedan' },
  { id: 'v-002', listingId: 'BD-261031-102', name: '현대 그랜저', trim: '1.6 하이브리드 캘리그래피', year: 2023, mileageKm: 26410, priceWon: 42700000, color: '어비스 블랙', fuel: '하이브리드', status: 'price_changed', videoStatus: 'ready', photoCount: 18, sourceVersion: 9, art: 'sedan' },
  { id: 'v-003', listingId: 'BD-261031-103', name: '기아 카니발', trim: '9인승 시그니처', year: 2024, mileageKm: 9350, priceWon: 46500000, color: '스노우 화이트 펄', fuel: '디젤', status: 'for_sale', videoStatus: 'generating', photoCount: 15, sourceVersion: 5, art: 'van' },
  { id: 'v-004', listingId: 'BD-261031-104', name: 'BMW 520i', trim: 'M Sport', year: 2024, mileageKm: 11700, priceWon: 63800000, color: '미네랄 화이트', fuel: '가솔린', status: 'for_sale', videoStatus: 'none', photoCount: 9, sourceVersion: 3, art: 'sedan' },
  { id: 'v-005', listingId: 'BD-261031-105', name: '벤츠 GLE 450', trim: '4MATIC', year: 2022, mileageKm: 38600, priceWon: 87500000, color: '옵시디안 블랙', fuel: '가솔린', status: 'for_sale', videoStatus: 'failed', photoCount: 7, sourceVersion: 21, art: 'suv' },
  { id: 'v-006', listingId: 'BD-261031-106', name: '포르쉐 911', trim: 'Carrera 4 GTS', year: 2023, mileageKm: 6800, priceWon: 218000000, color: '가드 레드', fuel: '가솔린', status: 'sold', videoStatus: 'ready', photoCount: 21, sourceVersion: 8, art: 'coupe' }
]

export const MOCK_PHOTOS: PhotoCheck[] = [
  { id: 'p1', label: '정면 45°', angle: '필수 외관', score: 96, status: 'good', art: 'sedan' },
  { id: 'p2', label: '후면 45°', angle: '필수 외관', score: 94, status: 'good', art: 'sedan' },
  { id: 'p3', label: '운전석 실내', angle: '필수 실내', score: 92, status: 'good', art: 'sedan' },
  { id: 'p4', label: '계기판', angle: '주행거리 검증', score: 89, status: 'good', art: 'sedan' },
  { id: 'p5', label: '2열 좌석', angle: '실내', score: 72, status: 'warning', issue: '조도가 낮습니다', art: 'sedan' },
  { id: 'p6', label: '휠·타이어', angle: '상태 확인', score: 91, status: 'good', art: 'sedan' },
  { id: 'p7', label: '번호판 노출', angle: '개인정보', score: 38, status: 'blocked', issue: '마스킹이 필요합니다', art: 'sedan' },
  { id: 'p8', label: '트렁크', angle: '적재 공간', score: 84, status: 'good', art: 'sedan' }
]

export const MOCK_CHANNELS: ChannelState[] = [
  { id: 'youtube', label: 'YouTube Shorts', connected: false, status: 'blocked', detail: 'OAuth 미연결 · 게시하지 않음' },
  { id: 'instagram', label: 'Instagram Reels', connected: false, status: 'blocked', detail: 'OAuth 미연결 · 게시하지 않음' },
  { id: 'tiktok', label: 'TikTok', connected: false, status: 'blocked', detail: '승인형 초안 · 게시하지 않음' }
]

export const MOCK_METRICS = [
  { label: '전체 재고', value: '128', delta: '+6', tone: 'neutral' },
  { label: '영상 보유율', value: '68%', delta: '+4.2%', tone: 'good' },
  { label: '생성 중', value: '7', delta: '3분 내', tone: 'info' },
  { label: '승인 대기', value: '12', delta: '검수 필요', tone: 'warning' },
  { label: '게시 실패', value: '3', delta: '채널별 재시도', tone: 'danger' }
] as const

