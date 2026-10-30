export type FeatureId = 'headlamp' | 'adas' | 'camera' | 'seat' | 'roof' | 'trunk'

export interface VehicleFeature {
  id: FeatureId
  label: string
  shortLabel: string
  description: string
  narration: string
  evidence: string
  shot: string
  duration: number
  anchor: { x: number; y: number }
}

export const vehicleFeatures: VehicleFeature[] = [
  {
    id: 'headlamp', label: '어댑티브 LED 헤드램프', shortLabel: 'LED 헤드램프',
    description: '차량 진행 방향과 주변 상황에 맞춰 조사 범위를 조절하는 기능입니다.',
    narration: '어댑티브 엘이디 헤드램프가 야간 시야 확보를 돕습니다.',
    evidence: '매물 옵션 코드: LIGHT-ADAPT-01', shot: '전면 45도 · 램프 점등', duration: 4.2,
    anchor: { x: 64, y: 48 }
  },
  {
    id: 'adas', label: '주행 보조 시스템', shortLabel: 'ADAS',
    description: '전방 차량과 차선을 감지해 운전자의 주행을 보조합니다.',
    narration: '전방 감지 기반의 주행 보조 시스템이 적용돼 있습니다.',
    evidence: '매물 옵션 코드: DRIVE-ADAS-02', shot: '전면 중앙 · 엠블럼 하단', duration: 4.6,
    anchor: { x: 51, y: 58 }
  },
  {
    id: 'camera', label: '서라운드 뷰 모니터', shortLabel: '360° 카메라',
    description: '차량 주변을 여러 방향에서 확인해 좁은 공간의 주차를 보조합니다.',
    narration: '서라운드 뷰 모니터로 차량 주변을 한눈에 확인할 수 있습니다.',
    evidence: '매물 옵션 코드: PARK-SVM-01', shot: '사이드미러 · 전후면 카메라', duration: 4.3,
    anchor: { x: 30, y: 44 }
  },
  {
    id: 'seat', label: '앞좌석 통풍 시트', shortLabel: '통풍 시트',
    description: '시트 내부 공기 순환으로 쾌적한 착좌 환경을 지원합니다.',
    narration: '앞좌석 통풍 기능으로 여름철에도 쾌적하게 주행할 수 있습니다.',
    evidence: '매물 옵션 코드: SEAT-VENT-F', shot: '운전석 시트 · 버튼 클로즈업', duration: 4.1,
    anchor: { x: 47, y: 52 }
  },
  {
    id: 'roof', label: '파노라마 글라스 루프', shortLabel: '파노라마 루프',
    description: '넓은 글라스 면적으로 실내 개방감을 높여주는 옵션입니다.',
    narration: '파노라마 글라스 루프가 실내에 시원한 개방감을 더합니다.',
    evidence: '매물 옵션 코드: ROOF-PANO-01', shot: '루프 상단 · 실내에서 개방', duration: 4.0,
    anchor: { x: 49, y: 28 }
  },
  {
    id: 'trunk', label: '스마트 파워 테일게이트', shortLabel: '파워 트렁크',
    description: '버튼 조작으로 트렁크를 편리하게 열고 닫을 수 있습니다.',
    narration: '스마트 파워 테일게이트로 적재가 한층 편리합니다.',
    evidence: '매물 옵션 코드: TAIL-AUTO-01', shot: '후면 정면 · 개폐 전 과정', duration: 4.5,
    anchor: { x: 74, y: 50 }
  }
]
