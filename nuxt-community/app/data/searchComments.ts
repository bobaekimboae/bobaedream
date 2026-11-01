// 검색 시안용 예시 댓글. 서버를 붙이면 Meilisearch comments 색인 결과로 바뀐다.
import type { SearchComment } from '../utils/communitySearch'

export const searchCommentSeed: SearchComment[] = [
  { id: 'c1', postId: 'p6', author: '정비하는아빠', text: '겨울에 시동이 늦으면 배터리 전압부터 재 보세요. 12.4V 아래면 교체 시기입니다.', createdAt: '2026-11-01T06:40:00Z', likes: 34 },
  { id: 'c2', postId: 'p6', author: '그랜저타는형', text: '저도 IG인데 점화 플러그 바꾸고 바로 좋아졌어요.', createdAt: '2026-11-01T07:05:00Z', likes: 12 },
  { id: 'c3', postId: 'p8', author: '첫차준비중', text: '가혹 조건이 생각보다 넓네요. 출퇴근 짧게만 타면 5천km가 맞는 것 같습니다.', createdAt: '2026-10-30T10:20:00Z', likes: 21 },
  { id: 'c4', postId: 'p8', author: '공구덕후', text: '엔진오일은 주행거리보다 기간도 같이 봐야 합니다. 1년은 넘기지 마세요.', createdAt: '2026-10-30T12:00:00Z', likes: 18 },
  { id: 'c5', postId: 'p10', author: '두부lev3', text: '히터 대신 열선 시트만 쓰면 주행거리 차이가 확 줄어요.', createdAt: '2026-11-01T08:00:00Z', likes: 27 },
  { id: 'c6', postId: 'p10', author: '전기차궁금', text: '배터리 예열 기능 켜고 급속 충전하면 충전 속도도 훨씬 낫습니다.', createdAt: '2026-11-01T08:30:00Z', likes: 9 },
  { id: 'c7', postId: 'p13', author: '안전운전중', text: '차간 거리 정말 중요하네요. 블랙박스 영상 덕분에 보험 처리도 쉬우셨겠어요.', createdAt: '2026-11-01T09:20:00Z', likes: 44 },
  { id: 'c8', postId: 'p14', author: '사고처리중', text: '보험사 답변은 비보호 좌회전 쪽 과실 70%라고 하네요.', createdAt: '2026-10-31T13:00:00Z', likes: 6 },
  { id: 'c9', postId: 'p15', author: '비머오너', text: '변속 충격은 TCU 업데이트로 해결되는 경우가 많습니다.', createdAt: '2026-10-31T08:40:00Z', likes: 15 },
  { id: 'c10', postId: 'p2', author: '전기로출근', text: '평소엔 80%, 장거리 가기 전날만 100%로 채웁니다.', createdAt: '2026-11-01T03:20:00Z', likes: 11 },
  { id: 'c11', postId: 'p9', author: '아침출근러', text: '메모리 백업 안 하고 배터리 갈았다가 라디오 설정 다 날아갔어요 ㅎㅎ', createdAt: '2026-11-01T06:00:00Z', likes: 8 },
  { id: 'c12', postId: 'p12', author: '테슬라궁금', text: '주니퍼 승차감 좋아졌다는 말이 많네요. 타이어는 그대로인가요?', createdAt: '2026-11-01T09:00:00Z', likes: 4 },
]
