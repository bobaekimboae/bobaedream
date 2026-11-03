import type { AccountGroup } from '~/types/account'

// One ordered definition for desktop and mobile. Icons are unmodified Notion originals.
export const accountGroups: AccountGroup[] = [
  { id: 'utilities', label: '편의 기능', items: [
    { id: 'favorites', label: '관심 매물', icon: 'saved-listings-01', description: '마음에 드는 차량을 모아 비교해 보세요.', action: 'favorites' },
    { id: 'searches', label: '저장한 검색', icon: 'saved-search-filterset-02', description: '저장한 검색 조건을 다시 확인하고 새 매물을 찾아보세요.' },
    { id: 'recent', label: '최근 본 매물', icon: 'recent-viewed-listings-03', description: '살펴본 차량을 다시 찾아보세요.' },
    { id: 'reviews', label: '내가 작성한 후기', icon: 'my-reviews-04', description: '직접 작성한 거래 후기와 평가를 확인하세요.' },
    { id: 'complex-reviews', label: '매매단지 리뷰', icon: 'neighborhood-review-05', description: '매매단지를 방문한 경험과 이용 후기를 확인하세요.' },
  ] },
  { id: 'services', label: '유료 서비스', items: [
    { id: 'points', label: '보배 포인트', icon: 'paid-service-dong-tot-coin-01', description: '포인트 내역과 사용 가능한 서비스를 확인하세요.' },
    { id: 'premium', label: '프리미엄 등록', icon: 'paid-service-pro-plan-02', description: '내 차량을 더 많은 구매자에게 소개하는 등록 서비스입니다.', action: 'register' },
    { id: 'partners', label: '파트너 센터', icon: 'paid-service-partner-channel-03', description: '딜러와 상사를 위한 제휴 서비스를 확인하세요.' },
    { id: 'payments', label: '결제 내역', icon: 'paid-service-payment-history-04', description: '이용한 유료 서비스의 결제 내역을 확인하세요.' },
    { id: 'dealer', label: '내 딜러페이지', icon: 'paid-service-store-pro-05', description: '딜러 소개와 판매 차량을 한곳에서 보여주세요.', action: 'dealer' },
  ] },
  { id: 'benefits', label: '혜택·이벤트', items: [
    { id: 'offers', label: '보배드림 혜택', icon: 'benefit-promotion-chotot-offer-01', description: '진행 중인 이벤트와 서비스 혜택을 확인하세요.' },
    { id: 'coupons', label: '내 쿠폰·혜택', icon: 'benefit-promotion-my-offers-02', description: '내 계정에 제공된 쿠폰과 혜택을 확인하세요.' },
  ] },
  { id: 'other', label: '설정·지원', items: [
    { id: 'settings', label: '계정 설정', icon: 'account-settings-01', description: '회원 정보와 계정 설정을 관리하세요.' },
    { id: 'support', label: '고객센터', icon: 'customer-center-02', description: '보배드림 이용 중 궁금한 점을 문의해 주세요.', action: 'support' },
    { id: 'feedback', label: '의견 보내기', icon: 'feedback-03', description: '서비스 이용 중 불편한 점이나 제안을 남겨 주세요.', action: 'feedback' },
  ] },
]
