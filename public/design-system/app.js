const STORAGE_KEY = "bobaedream-design-system-registry-v1";
const SIDEBAR_COLLAPSE_KEY = "bobaedream-design-system-sidebar-collapsed";
const SCHEMA_VERSION = "1.0";
const PROJECT_ID = "bobaedream-design-system";
const DEFAULT_STATUS = "검토필요";
const DEFAULT_TYPE = "토큰";
const DEFAULT_PLATFORM = "공통";
const STANDARD_NAME_PATTERN = /^[A-Za-z0-9._:-]+$/;
const VALIDATION_FIELDS = ["itemType", "itemName", "itemStandard", "itemStatus", "itemPlatform", "itemProps"];

const references = [
  {
    name: "Cars.com Design System",
    focus: "전체 목차와 공개 토큰 구조",
    apply: "보배드림형 샘플 템플릿과 개발 참고 항목",
    url: "https://fuse.cars.com/",
  },
  {
    name: "자동차 UI 레퍼런스",
    focus: "자동차 UI 목차",
    apply: "문서 구조와 컴포넌트 분류",
    url: "https://www.autotrader.com/",
  },
  {
    name: "Seed Design",
    focus: "간결한 한국어 설명",
    apply: "한 문장 정의와 표 문구",
    url: "https://seed-design.io/",
  },
  {
    name: "Bootstrap",
    focus: "대표 UI 키트의 문서 구조",
    apply: "설치, 커스터마이즈, 레이아웃, 폼, 컴포넌트, 헬퍼, 유틸리티 축 검토",
    url: "https://getbootstrap.com/docs/5.3/getting-started/introduction/",
  },
  {
    name: "Google Material 3",
    focus: "토큰과 상태",
    apply: "칩, 버튼, 컬러 기준",
    url: "https://m3.material.io/",
  },
  {
    name: "Apple HIG",
    focus: "모바일 조작성",
    apply: "하단 CTA와 safe area",
    url: "https://developer.apple.com/design/human-interface-guidelines/",
  },
  {
    name: "Shopify Polaris",
    focus: "운영 UI",
    apply: "폼, 배지, 상태 라벨",
    url: "https://shopify.dev/docs/api/polaris",
  },
  {
    name: "eBay Evo Design System",
    focus: "마켓플레이스 UI",
    apply: "카드, 칩, 리스트 밀도",
    url: "https://playbook.ebay.com/design-system/components",
  },
  {
    name: "IBM Carbon",
    focus: "토큰 구조",
    apply: "간격, 색상, 상태값",
    url: "https://carbondesignsystem.com/",
  },
  {
    name: "GOV.UK Design System",
    focus: "접근성과 폼",
    apply: "오류, 필수값, 도움말",
    url: "https://design-system.service.gov.uk/",
  },
  {
    name: "Storybook",
    focus: "컴포넌트 예제",
    apply: "상태별 미리보기",
    url: "https://storybook.js.org/",
  },
  {
    name: "Chromatic",
    focus: "시각 회귀",
    apply: "화면 변경 비교",
    url: "https://www.chromatic.com/",
  },
];

const koreanNames = {
  Home: "홈",
  "Web Installation & Usage": "웹 설치 및 사용",
  "Installing Fuse": "설치 가이드",
  "Guide to Web Components": "웹 컴포넌트 가이드",
  "Web Component Basics": "웹 컴포넌트 기본",
  "Style Customization": "스타일 커스터마이징",
  "Light DOM Style Considerations": "라이트 DOM 스타일 고려사항",
  "Working with Forms": "폼 작업",
  "Working with LiveView": "LiveView 작업",
  "Fuse Components in React": "React 컴포넌트",
  "Fuse in Next.js (SSR)": "Next.js SSR",
  "AI Agent Skill": "AI 에이전트 스킬",
  Changelog: "변경 이력",
  "Migrating From Spark": "Spark에서 이전",
  "Design Tokens": "디자인 토큰",
  Typography: "타이포그래피",
  Forms: "폼",
  "Dimensions/Layout": "치수/레이아웃",
  Lists: "리스트",
  Buttons: "버튼",
  "Style Guide": "스타일 가이드",
  Installation: "설치",
  Schema: "스키마",
  Color: "색상",
  Font: "폰트",
  Spacing: "간격",
  Size: "크기",
  Elevation: "그림자/고도",
  Motion: "모션",
  Breakpoints: "반응형 분기점",
  Icons: "아이콘",
  "UI Icons": "UI 아이콘",
  "Frequent Icons": "자주쓰는 아이콘",
  "Option Icons": "옵션 아이콘",
  "Vehicle Info Icons": "차량 관련 아이콘",
  "Brand Icons": "브랜드 아이콘",
  "Community Icons": "커뮤니티 아이콘",
  Imagery: "이미지",
  Layout: "레이아웃",
  "Typography & Headings": "타이포그래피와 제목",
  "Usability Standards": "사용성 기준",
  "Visual Language": "비주얼 언어",
  Components: "컴포넌트",
  Accordion: "아코디언",
  Badge: "배지",
  Breadcrumb: "브레드크럼",
  Button: "버튼",
  Callout: "콜아웃",
  Card: "카드",
  "Card Carousel": "카드 캐러셀",
  Checkbox: "체크박스",
  "Checkbox Lite": "체크박스 라이트",
  Disclaimer: "고지문",
  "Feedback Thumbs": "피드백 엄지",
  Fieldset: "필드셋",
  Figure: "피겨",
  Filter: "필터",
  "Form Module": "폼 모듈",
  Gallery: "갤러리",
  "Gallery Grid": "갤러리 그리드",
  "Gallery Thumbnails": "갤러리 썸네일",
  Headshot: "헤드샷",
  Input: "입력 필드",
  "Input Lite": "입력 필드 라이트",
  Link: "링크",
  "Link Pack": "링크 묶음",
  List: "목록",
  Menu: "메뉴",
  "Menu Item": "메뉴 항목",
  Modal: "모달",
  Notification: "알림",
  "Page Section": "페이지 섹션",
  Pagination: "페이지네이션",
  "Paging Button": "페이지 버튼",
  Picker: "피커",
  "Picker Option": "피커 옵션",
  Popover: "팝오버",
  "Price Range": "가격 범위",
  "Progress Bar": "진행 바",
  Radio: "라디오",
  "Radio Lite": "라디오 라이트",
  Range: "범위",
  "Range Dual": "이중 범위",
  Rating: "평점",
  "Rating Input": "평점 입력",
  Reveal: "펼쳐보기",
  Save: "저장/찜",
  Select: "셀렉트",
  "Select Lite": "셀렉트 라이트",
  Separator: "구분선",
  Spinner: "스피너",
  Stack: "스택",
  SVG: "SVG 아이콘",
  Switch: "스위치",
  Tabs: "탭",
  Tab: "탭 항목",
  "Tab Panel": "탭 패널",
  Textarea: "텍스트영역",
  "Textarea Lite": "텍스트영역 라이트",
  Tooltip: "툴팁",
  Principles: "원칙",
  "Design Principles": "디자인 원칙",
  "Motion Principles": "모션 원칙",
  "Content Strategy": "콘텐츠 전략",
  "Content Strategy Principles": "콘텐츠 전략 원칙",
  "Voice and Tone": "보이스와 톤",
  "Grammar and Mechanics": "문법과 표기",
  Vocabulary: "용어집",
  Accessibility: "접근성",
  "Accessibility Principles": "접근성 원칙",
  "Accessibility Checklist": "접근성 체크리스트",
  "Global Code": "전역 코드",
  "Default Language": "기본 언어",
  "Semantic HTML": "시맨틱 HTML",
  "Unique Page Title Element": "고유 페이지 제목",
  "Keyboard Navigation": "키보드 탐색",
  "Focus State": "포커스 상태",
  "Keyboard Interaction": "키보드 상호작용",
  "Logical Tab Order": "논리적 탭 순서",
  "Minimum Contrast Ratio": "최소 명도 대비",
  "Text Contrast": "텍스트 대비",
  "Multi Device Responsive Design": "다중 기기 반응형",
  "Text Resizing": "텍스트 확대",
  "Touch Targets": "터치 타깃",
  "Moving, Flashing, or Blinking Content": "움직임/깜빡임 콘텐츠",
  "Content Flash": "콘텐츠 깜빡임",
  "Stop Motion": "모션 정지",
  Headings: "제목 구조",
  "Clear Headings": "명확한 제목",
  "Sequential Headings": "순차 제목",
  "Forms, Labels, and Errors": "폼 라벨 오류",
  "Form Errors": "폼 오류",
  "Form Labels": "폼 라벨",
  "Forms Keyboard Accessible": "폼 키보드 접근성",
  "Written Material (Copy)": "문구",
  "Clear Content": "명확한 콘텐츠",
  "Meaningful Link Text": "의미 있는 링크 텍스트",
  "Image Text Alternatives": "이미지 대체 텍스트",
  "Image Alt Text": "이미지 Alt 텍스트",
  "Color Contrast": "색상 대비",
  Resources: "자료",
  References: "참고 문서",
  "Coverage Matrix": "커버리지 매트릭스",
  Storybook: "스토리북",
  "QA Checklist": "QA 체크리스트",
  Toolbox: "툴박스",
  "Cars.com Cross-check": "Cars.com IA 대조",
  "Component IA": "컴포넌트 문서 구조",
  "Naming Gaps": "명칭 차이",
  "Migration Order": "이식 순서",
  Foundations: "파운데이션",
  "Design Token": "디자인 토큰",
  Iconography: "아이콘그래피",
  Gradient: "그라디언트",
  Radius: "모서리",
  State: "상태",
  Feedback: "피드백",
  "Inclusive Design": "포용적 디자인",
  "International Design": "국제화 디자인",
  "Mobile/App Components": "모바일/앱 컴포넌트",
  "Action Button": "액션 버튼",
  "Alert Dialog": "알림 다이얼로그",
  "Attachment Input": "첨부 입력",
  "Bottom Navigation": "하단 내비게이션",
  "Bottom Sheet": "하단 시트",
  "Content Placeholder": "콘텐츠 플레이스홀더",
  "Contextual Floating Button": "컨텍스트 플로팅 버튼",
  "Date Picker": "날짜 선택",
  Divider: "구분선",
  Field: "필드",
  "Floating Action Button": "플로팅 액션 버튼",
  Footer: "푸터",
  "Help Bubble": "도움말 버블",
  "Identity Placeholder": "식별 플레이스홀더",
  "Image Frame": "이미지 프레임",
  "Input Button": "입력 버튼",
  "Manner Temp & Manner Temp Badge": "매너 온도/배지",
  "Menu Sheet": "메뉴 시트",
  "Notification Badge": "알림 배지",
  "Page Banner": "페이지 배너",
  "Progress Circle": "진행 원",
  "Quantity Picker": "수량 선택",
  "Reaction Button": "반응 버튼",
  "Result Section": "결과 섹션",
  "Scroll Fog": "스크롤 포그",
  "Segmented Control": "세그먼트 컨트롤",
  "Select Box": "셀렉트 박스",
  "Side Navigation": "사이드 내비게이션",
  "Side Panel": "사이드 패널",
  Skeleton: "스켈레톤",
  Slider: "슬라이더",
  "Table Pagination": "테이블 페이지네이션",
  "Tag Group": "태그 그룹",
  "Text Input & Textarea": "텍스트 입력/텍스트영역",
  "Time Picker": "시간 선택",
  "Top Navigation": "상단 내비게이션",
  "Wheel Picker": "휠 피커",
  "Bootstrap Cross-check": "Bootstrap 크로스체크",
  "Getting Started": "시작하기",
  Customize: "커스터마이즈",
  Sass: "Sass",
  Options: "옵션",
  "Color modes": "컬러 모드",
  "CSS variables": "CSS 변수",
  Optimize: "최적화",
  Content: "콘텐츠",
  Reboot: "리부트",
  Tables: "테이블",
  Figures: "피겨",
  Helpers: "헬퍼",
  Utilities: "유틸리티",
  "Text truncation": "텍스트 말줄임",
  "Visually hidden": "시각적 숨김",
  "Bobaedream Admin": "보배드림 관리",
  Registry: "컴포넌트 등록/수정",
  "Measurement Master": "측정 마스터",
  "Vehicle Listing Patterns": "매물 리스트 패턴",
  "Vehicle Detail Patterns": "매물 상세 패턴",
  "Filter Patterns": "필터 패턴",
  "AI Measurement Workflow": "AI 측정 워크플로우",
  "Design System": "디자인 시스템",
  Overview: "개요",
  Status: "상태",
  Tokens: "토큰",
  Patterns: "패턴",
  Processes: "프로세스",
  "Change log": "변경 로그",
  Theming: "테마",
  Dimension: "치수",
  Shadow: "그림자",
  Shape: "형태",
  Opacity: "투명도",
  Illustration: "일러스트레이션",
  "Action bar": "액션 바",
  "Alert notice": "알림 노티스",
  "Inline notice": "인라인 노티스",
  "Page notice": "페이지 노티스",
  "Section notice": "섹션 노티스",
  Avatar: "아바타",
  Banner: "배너",
  "CTA button": "CTA 버튼",
  "Icon button": "아이콘 버튼",
  "Link button": "링크 버튼",
  Calendar: "캘린더",
  Carousel: "캐러셀",
  CCD: "CCD",
  Chip: "칩",
  "Filter chip": "필터 칩",
  "Input chip": "입력 칩",
  "Data visualization": "데이터 시각화",
  Graphs: "그래프",
  Metrics: "지표",
  Dialog: "다이얼로그",
  Alert: "경고",
  Confirmation: "확인",
  Standard: "표준",
  Divider: "디바이더",
  "Education notice": "교육 노티스",
  "EEK rating and range": "EEK 등급 및 범위",
  Expansion: "확장",
  Combobox: "콤보박스",
  "Date field": "날짜 필드",
  Dropdown: "드롭다운",
  "Numeric stepper": "숫자 스테퍼",
  Password: "비밀번호",
  "Phone number": "전화번호",
  "Radio button": "라디오 버튼",
  "Select list": "셀렉트 목록",
  "Text area": "텍스트 영역",
  "Text field": "텍스트 필드",
  "Item tile": "아이템 타일",
  "List row": "리스트 행",
  Loading: "로딩",
  "Expressive loader": "표현형 로더",
  "Skeleton loader": "스켈레톤 로더",
  "Media container": "미디어 컨테이너",
  Navigation: "내비게이션",
  "Top navigation bar": "상단 내비게이션 바",
  Panel: "패널",
  "Progress stepper": "진행 스테퍼",
  "Search field": "검색 필드",
  "Section header": "섹션 헤더",
  "Segmented button": "세그먼트 버튼",
  Sheet: "시트",
  "Context sheet": "컨텍스트 시트",
  "Focus sheet": "포커스 시트",
  Signal: "시그널",
  Snackbar: "스낵바",
  "State layer": "상태 레이어",
  Table: "테이블",
  Tip: "팁",
  Tourtip: "투어팁",
  "Toggle button group": "토글 버튼 그룹",
  "Video player": "비디오 플레이어",
  "Bulk editing": "일괄 편집",
  "Creating forms": "폼 작성",
  "Empty states": "빈 상태",
  Filtering: "필터링",
  "Requesting user feedback": "사용자 피드백 요청",
  "Uploading files": "파일 업로드",
  "Using links": "링크 사용",
  "Text link": "텍스트 링크",
  "Legal link": "법적 링크",
};

const catalogNotes = {
  Home: "첫 화면과 주요 바로가기를 보여줍니다.",
  "Web Installation & Usage": "설치와 개발 적용 방법입니다.",
  "Installing Fuse": "설치 절차와 의존성 버전입니다.",
  "Guide to Web Components": "컴포넌트 사용 기본 규칙입니다.",
  "Web Component Basics": "커스텀 엘리먼트 구조를 이해하고 React/Blade에서 동일하게 사용할 최소 규칙입니다.",
  "Style Customization": "브랜드 컬러, spacing, radius, typography를 토큰으로 바꾸는 허용 범위입니다.",
  "Light DOM Style Considerations": "slot, light DOM, 외부 CSS 영향도를 점검해 예기치 않은 스타일 누수를 막는 기준입니다.",
  "Working with Forms": "입력, 오류, 검증, disabled, required 상태를 폼 컴포넌트와 연결하는 규칙입니다.",
  "Working with LiveView": "서버 렌더링/부분 갱신 화면에서 컴포넌트 상태가 깨지지 않도록 확인하는 기준입니다.",
  "Fuse Components in React": "React/Vite/Storybook 렌더링 예시입니다.",
  "Fuse in Next.js (SSR)": "SSR 환경의 렌더링 기준입니다.",
  "AI Agent Skill": "Codex가 토큰, 컴포넌트, 아이콘 명칭을 읽고 수정할 수 있게 하는 작업 지시서 영역입니다.",
  Changelog: "디자인 토큰과 컴포넌트 변경 이력을 날짜, 작성자, 영향 범위 기준으로 남깁니다.",
  "Migrating From Spark": "기존 Spark 계열 규칙을 신규 보배드림 DS 규칙으로 전환하는 대응표입니다.",
  Typography: "제목, 본문, 가격, 메타, 라벨 텍스트 크기와 줄높이의 기준입니다.",
  "Dimensions/Layout": "컨테이너, 그리드, 카드, 리스트, 상세 화면의 크기와 배치 전환 기준입니다.",
  Lists: "매물 리스트, 링크 목록, 옵션 목록처럼 반복 정보의 행 간격과 구분선을 정의합니다.",
  Buttons: "CTA, 보조 버튼, 아이콘 버튼, 링크 버튼의 높이, radius, 상태값을 정의합니다.",
  "Style Guide": "토큰과 시각 기준을 관리합니다.",
  "Design Tokens": "색상, 글꼴, 간격을 코드 값으로 관리합니다.",
  Installation: "토큰 패키지 설치, import 경로, CSS variables 연결 방식을 기록합니다.",
  Schema: "토큰의 이름, 타입, 값, 설명, 플랫폼 매핑 컬럼 구조를 정의합니다.",
  Color: "브랜드, 본문, 보조 텍스트, 경고, 성공, 구분선 색상을 WCAG 대비와 함께 관리합니다.",
  Font: "폰트 패밀리, 굵기, 숫자 정렬, fallback을 정의합니다.",
  Spacing: "섹션, 카드, 썸네일, 칩, 아이콘과 텍스트 사이의 기본 간격 단위를 정의합니다.",
  Size: "버튼 높이, 아이콘 크기, 터치 타깃, 썸네일 비율 같은 크기 토큰입니다.",
  Elevation: "카드 hover, 드롭다운, 모달, 모바일 하단 고정바의 shadow 레벨입니다.",
  Motion: "hover, active, sheet open, save feedback 등 전환 시간과 easing 기준입니다.",
  Breakpoints: "MO 360/390, tablet 768, PC 1280/1440, wide 1920 기준 반응형 분기점입니다.",
  Icons: "아이콘 이름과 크기 규칙입니다.",
  Forms: "매물 등록/수정, 검색 필터, 문의 폼의 라벨, 도움말, 오류 상태 기준입니다.",
  Imagery: "차량 사진 비율, object-fit, 썸네일 crop, 갤러리, 대체 텍스트 기준입니다.",
  Layout: "PC/MO 컨테이너, 사이드바, sticky filter, 상세 CTA 배치 기준입니다.",
  "Typography & Headings": "H1-H6, 섹션 제목, 가격, 차량명, 메타 텍스트 위계를 정의합니다.",
  "Usability Standards": "찾기 쉬움, 읽기 쉬움, 조작 실수 방지, 모바일 터치성을 점검합니다.",
  "Visual Language": "보배드림의 정보 밀도, 강조 색상, 자동차 거래 신뢰감 표현 기준입니다.",
  Components: "실제 화면에서 조립되는 UI 단위를 Storybook 스토리와 코드 API로 관리합니다.",
  Accordion: "상세 옵션, FAQ, 보험/성능 정보처럼 접고 펼치는 콘텐츠에 사용합니다.",
  Badge: "무사고, 진단, 급매, 인증, 가격인하 같은 상태를 짧게 표시합니다.",
  Breadcrumb: "홈에서 현재 매물/카테고리까지의 정보 구조를 보여주는 탐색 컴포넌트입니다.",
  Button: "주요 CTA, 보조 CTA, outline, ghost, disabled 상태를 관리합니다.",
  Callout: "중요 정보, 팁, 주의 사항을 화면 안에서 강조해 전달합니다.",
  "Card Carousel": "추천 매물, 최근 본 매물, 비슷한 차량을 가로 스크롤로 노출합니다.",
  Checkbox: "복수 옵션 선택, 약관 동의, 비교 선택에 사용하는 표준 체크박스입니다.",
  "Checkbox Lite": "밀도 높은 필터 목록에서 간결하게 쓰는 경량 체크박스입니다.",
  Disclaimer: "가격, 보증, 성능점검, 제휴 광고의 법적/운영 고지를 표시합니다.",
  "Feedback Thumbs": "콘텐츠 도움 여부, 상담 품질, 검색 결과 피드백을 빠르게 수집합니다.",
  Fieldset: "제조사, 모델, 가격대, 연식처럼 관련 입력 묶음에 제목과 구조를 제공합니다.",
  Figure: "차량 이미지와 캡션, 출처, 주석을 함께 묶는 미디어 컴포넌트입니다.",
  Filter: "상단 필터, 사이드 필터, 모바일 바텀시트 필터의 공통 동작 기준입니다.",
  "Form Module": "매물 등록/수정 폼의 섹션 단위 묶음과 검증 흐름을 관리합니다.",
  Gallery: "상세 대표 이미지, 스와이프, 전체보기, 영상 진입을 관리합니다.",
  "Gallery Grid": "차량 사진을 여러 장 한 화면에서 비교할 때 쓰는 그리드입니다.",
  "Gallery Thumbnails": "대표 이미지 하단/측면 썸네일 목록과 선택 상태를 정의합니다.",
  Headshot: "딜러, 판매자, 상담원 프로필 사진 표시 기준입니다.",
  Input: "검색어, 가격, 주행거리, 연락처 같은 텍스트 입력의 표준 컴포넌트입니다.",
  "Input Lite": "필터나 테이블 안에서 쓰는 낮은 높이의 경량 입력입니다.",
  Link: "일반 링크, 딜러 페이지 이동, 외부 링크의 색상과 hover 상태를 관리합니다.",
  "Link Pack": "관련 링크 묶음, 푸터 링크, 상세 보조 링크 그룹에 사용합니다.",
  List: "검색 결과, 옵션 정보, 사양 목록 등 반복 행의 간격과 구분선을 정의합니다.",
  Menu: "계정 메뉴, 정렬 메뉴, 더보기 메뉴의 컨테이너입니다.",
  "Menu Item": "메뉴 내부 개별 액션의 높이, 아이콘, disabled 상태를 정의합니다.",
  Modal: "원문에서 취소선 처리된 항목입니다. 신규 구현은 Sheet/Dialog 기준으로 대체 검토합니다.",
  Notification: "저장 완료, 문의 완료, 오류, 가격 변동 알림을 표시합니다.",
  "Page Section": "목록/상세 화면의 큰 섹션 제목, 간격, 배경을 맞추는 레이아웃 단위입니다.",
  Pagination: "검색 결과 페이지 이동, SEO 페이지, 딜러 매물 목록에 사용합니다.",
  "Paging Button": "캐러셀, 갤러리, 페이지 이동에서 이전/다음 조작을 제공합니다.",
  Picker: "차종, 제조사, 지역처럼 한 항목을 고르는 선택 UI입니다.",
  "Picker Option": "Picker 내부 선택 항목의 label, meta, selected 상태입니다.",
  Popover: "정렬, 도움말, 간단 필터처럼 작은 오버레이 콘텐츠를 표시합니다.",
  "Price Range": "원문에서 취소선 처리된 항목입니다. 보배드림은 Range Dual로 우선 통합합니다.",
  "Progress Bar": "사진 업로드, 등록 진행, 비동기 로딩 진행률을 표시합니다.",
  Radio: "단일 선택 옵션을 폼 안에서 명확하게 보여주는 표준 라디오입니다.",
  "Radio Lite": "필터 바텀시트나 고밀도 리스트에서 쓰는 경량 라디오입니다.",
  Range: "가격, 연식, 주행거리 등 단일 범위 입력에 사용합니다.",
  "Range Dual": "가격 최소/최대, 연식 시작/끝처럼 양방향 범위를 조절합니다.",
  Rating: "딜러 평가, 차량 상태, 리뷰 점수를 읽기 전용으로 보여줍니다.",
  "Rating Input": "사용자가 별점/평점을 입력하는 상태와 키보드 조작 기준입니다.",
  Reveal: "접힌 정보 더보기, 옵션 전체보기, 고지문 펼치기에 사용합니다.",
  Save: "찜하기, 저장 매물, 비교 후보 저장의 활성/비활성 상태를 관리합니다.",
  Select: "정렬, 지역, 옵션 선택용 기본 셀렉트입니다.",
  "Select Lite": "테이블/필터 안에서 쓰는 낮은 밀도의 셀렉트입니다.",
  Separator: "매물 카드, 사양 행, 섹션 사이의 시각적 구분선입니다.",
  Spinner: "데이터 로딩 중임을 알리는 최소 피드백 컴포넌트입니다.",
  Stack: "컴포넌트 내부 세로/가로 간격을 일관되게 쌓는 레이아웃 유틸리티입니다.",
  SVG: "아이콘 렌더링, 크기, 색상, 접근성 라벨의 공통 래퍼입니다.",
  Switch: "알림 수신, 판매 옵션 공개 여부처럼 즉시 켜고 끄는 설정에 사용합니다.",
  Tabs: "상세 정보, 성능점검, 보험이력, 리뷰처럼 동등한 콘텐츠 그룹을 전환합니다.",
  Tab: "탭 목록 안의 개별 선택 항목입니다.",
  "Tab Panel": "선택된 탭이 보여주는 콘텐츠 영역과 aria 연결 기준입니다.",
  Textarea: "문의 내용, 설명, 신고 사유처럼 긴 텍스트 입력에 사용합니다.",
  "Textarea Lite": "간단 메모나 고밀도 폼의 경량 긴 텍스트 입력입니다.",
  Tooltip: "아이콘 버튼, 약어, 가격 계산 기준에 짧은 도움말을 제공합니다.",
  Principles: "보배드림 디자인 의사결정의 상위 원칙과 모션 원칙을 모읍니다.",
  "Design Principles": "신뢰, 빠른 비교, 명확한 거래 행동을 우선하는 설계 원칙입니다.",
  "Motion Principles": "과장되지 않은 피드백, 위치 변화, sheet 전환, 저장 애니메이션 원칙입니다.",
  "Content Strategy": "버튼명, 필터명, 고지문, 오류문구의 말투와 작성 기준을 관리합니다.",
  "Content Strategy Principles": "콘텐츠가 짧고 명확하며 거래 리스크를 줄이는 방향으로 쓰이게 합니다.",
  "Voice and Tone": "보배드림의 신뢰감 있는 말투, 안내/경고/성공 상태의 톤을 정의합니다.",
  "Grammar and Mechanics": "띄어쓰기, 숫자/단위 표기, 가격 표기, 문장 부호 규칙입니다.",
  Vocabulary: "제조사, 모델, 트림, 사고, 진단, 금융 등 서비스 용어 사전입니다.",
  Accessibility: "누구나 탐색하고 문의할 수 있게 하는 기준입니다.",
  "Accessibility Principles": "장애 여부와 입력 장치와 관계없이 매물 탐색과 문의가 가능해야 한다는 원칙입니다.",
  "Accessibility Checklist": "개발/QA가 화면마다 체크하는 접근성 항목 목록입니다.",
  "Global Code": "전체 HTML 구조, landmarks, aria 사용의 기본 품질 기준입니다.",
  "Default Language": "문서 기본 언어를 ko로 선언해 스크린리더 발음을 안정화합니다.",
  "Semantic HTML": "버튼은 button, 링크는 a, 목록은 list로 구현하는 기본 원칙입니다.",
  "Unique Page Title Element": "각 페이지가 고유한 title을 가져 현재 위치를 이해할 수 있게 합니다.",
  "Keyboard Navigation": "마우스 없이 주요 탐색, 필터, 저장, 문의 조작이 가능해야 합니다.",
  "Focus State": "포커스 위치가 모든 배경에서 충분히 보이도록 스타일을 정의합니다.",
  "Keyboard Interaction": "컴포넌트별 Enter, Space, Escape, Arrow 키 동작을 명시합니다.",
  "Logical Tab Order": "화면 시각 순서와 키보드 이동 순서가 자연스럽게 일치해야 합니다.",
  "Minimum Contrast Ratio": "텍스트와 UI 컴포넌트의 최소 대비 기준을 검수합니다.",
  "Text Contrast": "가격, 메타, disabled, 오류 문구의 대비를 별도로 확인합니다.",
  "Multi Device Responsive Design": "PC, 태블릿, 모바일에서 내용이 겹치거나 잘리지 않는지 확인합니다.",
  "Text Resizing": "사용자가 글자를 키워도 CTA, 필터, 카드가 깨지지 않도록 합니다.",
  "Touch Targets": "모바일 터치 영역은 최소 44px 수준으로 유지합니다.",
  "Moving, Flashing, or Blinking Content": "움직이거나 깜빡이는 콘텐츠가 사용자를 방해하지 않도록 제한합니다.",
  "Content Flash": "광과민 위험이 있는 빠른 깜빡임을 금지합니다.",
  "Stop Motion": "자동 재생, carousel, 영상에는 정지/제어 방법을 제공합니다.",
  Headings: "페이지 제목과 섹션 제목의 문서 구조를 관리합니다.",
  "Clear Headings": "제목만 보고도 섹션 목적과 현재 맥락을 이해할 수 있게 합니다.",
  "Sequential Headings": "h1부터 순차적으로 heading level을 사용합니다.",
  "Forms, Labels, and Errors": "폼 라벨, 도움말, 오류 연결을 스크린리더 기준으로 점검합니다.",
  "Form Errors": "오류 위치, 원인, 해결 방법이 입력 항목과 연결되어야 합니다.",
  "Form Labels": "모든 입력에는 보이는 라벨 또는 접근 가능한 이름이 있어야 합니다.",
  "Forms Keyboard Accessible": "폼 입력, 선택, 제출이 키보드만으로 가능해야 합니다.",
  "Written Material (Copy)": "문구가 짧고 명확하며 전문 용어는 필요한 곳에만 사용되는지 점검합니다.",
  "Clear Content": "사용자가 거래 판단에 필요한 정보를 빠르게 이해할 수 있게 씁니다.",
  "Meaningful Link Text": "링크 텍스트만으로 이동 목적을 알 수 있어야 합니다.",
  "Image Text Alternatives": "이미지 의미를 전달하는 대체 텍스트 정책을 관리합니다.",
  "Image Alt Text": "차량 사진, 아이콘, 배지 이미지의 alt 규칙을 정의합니다.",
  "Color Contrast": "색상 조합별 대비 수치를 기록하고 실패 조합은 사용 금지합니다.",
  Resources: "디자인/개발/QA가 함께 참고하는 외부 도구와 운영 자료를 모읍니다.",
  Toolbox: "측정 도구, 접근성 도구, Storybook/Chromatic 운영 링크를 등록합니다.",
};

const holdItems = new Set([]);
const requiredItems = new Set([
  "Home", "Web Installation & Usage", "Installing Fuse", "Guide to Web Components", "Web Component Basics",
  "Style Customization", "Working with Forms", "Fuse Components in React", "AI Agent Skill", "Changelog",
  "Design Tokens", "Color", "Font", "Spacing", "Size", "Elevation", "Motion", "Breakpoints", "Icons",
  "UI Icons", "Frequent Icons", "Option Icons", "Vehicle Info Icons", "Brand Icons", "Community Icons",
  "Forms", "Imagery", "Layout", "Typography & Headings", "Usability Standards", "Visual Language",
  "Accordion", "Badge", "Breadcrumb", "Button", "Card", "Card Carousel", "Checkbox", "Fieldset",
  "Filter", "Form Module", "Gallery", "Gallery Grid", "Gallery Thumbnails", "Input", "Link", "List",
  "Menu", "Notification", "Pagination", "Picker", "Popover", "Progress Bar", "Radio", "Range",
  "Range Dual", "Rating", "Save", "Select", "Separator", "SVG", "Switch", "Tabs", "Textarea", "Tooltip",
  "Accessibility Principles", "Accessibility Checklist", "Global Code", "Default Language", "Semantic HTML",
  "Unique Page Title Element", "Keyboard Navigation", "Focus State", "Keyboard Interaction", "Logical Tab Order",
  "Minimum Contrast Ratio", "Text Contrast", "Multi Device Responsive Design", "Text Resizing", "Touch Targets",
  "Moving, Flashing, or Blinking Content", "Content Flash", "Stop Motion", "Headings", "Clear Headings",
  "Sequential Headings", "Forms, Labels, and Errors", "Form Errors", "Form Labels", "Forms Keyboard Accessible",
  "Written Material (Copy)", "Clear Content", "Meaningful Link Text", "Image Text Alternatives", "Image Alt Text",
  "Color Contrast", "Action bar", "Alert notice", "Buttons", "CTA button", "Icon button", "Carousel",
  "Chip", "Filter chip", "Input chip", "Dialog", "Divider", "Search field", "Sheet", "Snackbar",
  "State layer", "Video player", "Creating forms", "Empty states", "Filtering", "Uploading files", "Legal link",
  "Cars.com Cross-check", "Component IA", "Naming Gaps", "Migration Order",
]);

function slugifySidebarSegment(value) {
  return value
    .replace(/~~/g, "")
    .replace(/&/g, " and ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sidebarNode(entry, trail = [], depth = 0) {
  const config = typeof entry === "string" ? { title: entry } : entry;
  const path = [...trail, config.title];
  const id = path.map(slugifySidebarSegment).filter(Boolean).join("-");
  const status = config.status || (holdItems.has(config.title) ? "deprecated" : "stable");
  return {
    id,
    title: config.title,
    koTitle: koreanNames[config.title] || config.title,
    href: config.href || `#${id}`,
    depth,
    status,
    children: config.children?.map((child) => sidebarNode(child, path, depth + 1)) || [],
  };
}

const sidebarTree = (entries) => entries.map((entry) => sidebarNode(entry));
const customSidebarItem = (title, href, children) => ({ title, href, status: "custom", children });

const fuseSidebarTree = sidebarTree([
  "Home",
  {
    title: "Web Installation & Usage",
    children: [
      "Installing Fuse",
      {
        title: "Guide to Web Components",
        children: [
          "Web Component Basics",
          "Style Customization",
          "Light DOM Style Considerations",
          "Working with Forms",
          "Working with LiveView",
        ],
      },
      "Fuse Components in React",
      "Fuse in Next.js (SSR)",
      "AI Agent Skill",
      "Changelog",
      {
        title: "Migrating From Spark",
        children: ["Design Tokens", "Typography", "Forms", "Dimensions/Layout", "Lists", "Buttons"],
      },
    ],
  },
  {
    title: "Style Guide",
    children: [
      {
        title: "Design Tokens",
        children: ["Installation", "Schema", "Color", "Font", "Spacing", "Size", "Elevation", "Motion", "Breakpoints"],
      },
      {
        title: "Foundations",
        children: [
          "Design Token",
          "Color",
          "Typography",
          "Iconography",
          "Elevation",
          "Gradient",
          "Inclusive Design",
          "International Design",
          "Layout",
          "Motion",
          "Radius",
          "Spacing",
          "State",
          "Voice and Tone",
          "Writing",
          "Feedback",
        ],
      },
      "Forms",
      "Imagery",
      "Layout",
      "Spacing",
      "Typography & Headings",
      "Usability Standards",
      "Visual Language",
    ],
  },
  {
    title: "Icons",
    href: "#style-guide-icons",
    children: [
      { title: "UI Icons", href: "#style-guide-icons-ui-icons" },
      { title: "Frequent Icons", href: "#style-guide-icons-frequent-icons" },
      { title: "Option Icons", href: "#style-guide-icons-option-icons" },
      { title: "Vehicle Info Icons", href: "#style-guide-icons-vehicle-info-icons" },
      { title: "Brand Icons", href: "#style-guide-icons-brand-icons" },
      { title: "Community Icons", href: "#style-guide-icons-community-icons" },
    ],
  },
  {
    title: "Components",
    children: [
      "Accordion",
      "Badge",
      "Breadcrumb",
      "Button",
      "Callout",
      "Card",
      "Card Carousel",
      "Checkbox",
      "Checkbox Lite",
      "Disclaimer",
      "Feedback Thumbs",
      "Fieldset",
      "Figure",
      "Filter",
      "Form Module",
      "Gallery",
      "Gallery Grid",
      "Gallery Thumbnails",
      "Headshot",
      "Input",
      "Input Lite",
      "Link",
      "Link Pack",
      "List",
      "Menu",
      "Menu Item",
      { title: "Modal", status: "deprecated" },
      "Notification",
      "Page Section",
      "Pagination",
      "Paging Button",
      "Picker",
      "Picker Option",
      "Popover",
      { title: "Price Range", status: "deprecated" },
      "Progress Bar",
      "Radio",
      "Radio Lite",
      "Range",
      "Range Dual",
      "Rating",
      "Rating Input",
      "Reveal",
      "Save",
      "Select",
      "Select Lite",
      "Separator",
      "Spinner",
      "Stack",
      "SVG",
      "Switch",
      "Tabs",
      "Tab",
      "Tab Panel",
      "Textarea",
      "Textarea Lite",
      "Tooltip",
      {
        title: "Mobile/App Components",
        children: [
          "Action Button",
          "Alert Dialog",
          "Attachment Input",
          "Avatar",
          "Bottom Navigation",
          "Bottom Sheet",
          "Chip",
          "Content Placeholder",
          "Contextual Floating Button",
          "Date Picker",
          "Dialog",
          "Divider",
          "Field",
          "Floating Action Button",
          "Footer",
          "Help Bubble",
          "Identity Placeholder",
          "Image Frame",
          "Input Button",
          "Manner Temp & Manner Temp Badge",
          "Menu Sheet",
          "Notification Badge",
          "Page Banner",
          "Progress Circle",
          "Quantity Picker",
          "Reaction Button",
          "Result Section",
          "Scroll Fog",
          "Segmented Control",
          "Select Box",
          "Side Navigation",
          "Side Panel",
          "Skeleton",
          "Slider",
          "Table Pagination",
          "Tag Group",
          "Text Input & Textarea",
          "Time Picker",
          "Top Navigation",
          "Wheel Picker",
        ],
      },
    ],
  },
  {
    title: "Patterns",
    children: [
      "Bulk editing",
      "Creating forms",
      "Empty states",
      "Filtering",
      "Loading",
      "Requesting user feedback",
      "Uploading files",
      "Using links",
      "Text link",
      "Legal link",
    ],
  },
  {
    title: "Principles",
    children: ["Design Principles", "Motion Principles"],
  },
  {
    title: "Content Strategy",
    children: ["Content Strategy Principles", "Voice and Tone", "Grammar and Mechanics", "Vocabulary"],
  },
  {
    title: "Accessibility",
    children: [
      "Accessibility Principles",
      {
        title: "Accessibility Checklist",
        children: [
          "Global Code",
          "Default Language",
          "Semantic HTML",
          "Unique Page Title Element",
          "Keyboard Navigation",
          "Focus State",
          "Keyboard Interaction",
          "Logical Tab Order",
          "Minimum Contrast Ratio",
          "Text Contrast",
          "Multi Device Responsive Design",
          "Text Resizing",
          "Touch Targets",
          "Moving, Flashing, or Blinking Content",
          "Content Flash",
          "Stop Motion",
          "Headings",
          "Clear Headings",
          "Sequential Headings",
          "Forms, Labels, and Errors",
          "Form Errors",
          "Form Labels",
          "Forms Keyboard Accessible",
          "Written Material (Copy)",
          "Clear Content",
          "Meaningful Link Text",
          "Image Text Alternatives",
          "Image Alt Text",
        ],
      },
      "Color Contrast",
    ],
  },
  {
    title: "Resources",
    children: [
      "Toolbox",
      "References",
      "Coverage Matrix",
      {
        title: "Cars.com Cross-check",
        children: ["Component IA", "Naming Gaps", "Migration Order"],
      },
      "Storybook",
      "QA Checklist",
      {
        title: "Bootstrap Cross-check",
        children: ["Getting Started", "Customize", "Layout", "Content", "Forms", "Components", "Helpers", "Utilities"],
      },
      customSidebarItem("보배드림 운영", "#registry", [
        customSidebarItem("컴포넌트 등록/수정", "#registry"),
        customSidebarItem("측정 마스터", "#workflow"),
        customSidebarItem("매물 목록 패턴", "#component-showcase"),
        customSidebarItem("매물 상세 패턴", "#preview"),
        customSidebarItem("필터 패턴", "#preview"),
        customSidebarItem("AI 측정 흐름", "#workflow"),
      ]),
    ],
  },
]);

const bobaedreamUseCases = {
  Filter: ["조건 선택", "선택 칩", "결과 수 반영"],
  Card: ["매물 요약", "썸네일", "가격과 판매자 정보"],
  Gallery: ["차량 사진", "썸네일", "전체보기"],
  Badge: ["무사고", "진단", "판매 상태"],
  Save: ["찜하기", "저장 해제", "완료 알림"],
  Pagination: ["페이지 이동", "이전/다음", "더보기 전환"],
  "Bottom Sheet": ["차량 검색", "필터 조건", "가격 범위"],
  "Range Dual": ["최소값", "최대값", "범위 입력"],
  Tabs: ["상세정보", "성능점검", "보험이력"],
  Notification: ["성공", "오류", "가격 변동"],
  "보배드림 운영": ["등록", "수정", "검토"],
  Icons: ["UI 아이콘", "자주쓰는 아이콘", "옵션 아이콘", "차량 관련 아이콘", "브랜드 아이콘", "커뮤니티 아이콘"],
  "UI Icons": ["검색", "닫기", "필터"],
  "Frequent Icons": ["찜", "전화", "사진", "조회수"],
  "Option Icons": ["편의 옵션", "안전 옵션", "상태 표시"],
  "Vehicle Info Icons": ["연식", "주행거리", "연료", "가격", "차종"],
  "Brand Icons": ["제조사 로고", "브랜드 필터", "상세 브랜드 표시"],
  "Community Icons": ["댓글", "추천", "공유", "조회"],
};

const fuseGroups = [
  ["Home", "첫 화면", ["Home"]],
  ["Web Installation & Usage", "설치와 개발 적용", [
    "Web Installation & Usage", ["Installing Fuse", "Web Installation & Usage"], ["Guide to Web Components", "Web Installation & Usage"],
    ["Web Component Basics", "Guide to Web Components"], ["Style Customization", "Guide to Web Components"],
    ["Light DOM Style Considerations", "Guide to Web Components"], ["Working with Forms", "Guide to Web Components"],
    ["Working with LiveView", "Guide to Web Components"], ["Fuse Components in React", "Web Installation & Usage"],
    ["Fuse in Next.js (SSR)", "Web Installation & Usage"], ["AI Agent Skill", "Web Installation & Usage"],
    ["Changelog", "Web Installation & Usage"], ["Migrating From Spark", "Web Installation & Usage"],
    ["Design Tokens", "Migrating From Spark"], ["Typography", "Migrating From Spark"], ["Forms", "Migrating From Spark"],
    ["Dimensions/Layout", "Migrating From Spark"], ["Lists", "Migrating From Spark"], ["Buttons", "Migrating From Spark"],
  ]],
  ["Style Guide", "토큰과 시각 기준", [
    "Style Guide", ["Design Tokens", "Style Guide"], ["Installation", "Design Tokens"], ["Schema", "Design Tokens"],
    ["Color", "Design Tokens"], ["Font", "Design Tokens"], ["Spacing", "Design Tokens"], ["Size", "Design Tokens"],
    ["Elevation", "Design Tokens"], ["Motion", "Design Tokens"], ["Breakpoints", "Design Tokens"], ["Icons", "Style Guide"],
    ["UI Icons", "Icons"], ["Frequent Icons", "Icons"], ["Option Icons", "Icons"], ["Vehicle Info Icons", "Icons"], ["Brand Icons", "Icons"], ["Community Icons", "Icons"],
    ["Forms", "Style Guide"], ["Imagery", "Style Guide"], ["Layout", "Style Guide"], ["Spacing", "Style Guide"],
    ["Typography & Headings", "Style Guide"], ["Usability Standards", "Style Guide"], ["Visual Language", "Style Guide"],
  ]],
  ["Components", "컴포넌트 목록", [
    "Components", ["Accordion", "Components"], ["Badge", "Components"], ["Breadcrumb", "Components"], ["Button", "Components"],
    ["Callout", "Components"], ["Card", "Components"], ["Card Carousel", "Components"], ["Checkbox", "Components"],
    ["Checkbox Lite", "Components"], ["Disclaimer", "Components"], ["Feedback Thumbs", "Components"], ["Fieldset", "Components"],
    ["Figure", "Components"], ["Filter", "Components"], ["Form Module", "Components"], ["Gallery", "Components"],
    ["Gallery Grid", "Components"], ["Gallery Thumbnails", "Components"], ["Headshot", "Components"], ["Input", "Components"],
    ["Input Lite", "Components"], ["Link", "Components"], ["Link Pack", "Components"], ["List", "Components"],
    ["Menu", "Components"], ["Menu Item", "Components"], ["Modal", "Components"], ["Notification", "Components"],
    ["Page Section", "Components"], ["Pagination", "Components"], ["Paging Button", "Components"], ["Picker", "Components"],
    ["Picker Option", "Components"], ["Popover", "Components"], ["Price Range", "Components"], ["Progress Bar", "Components"],
    ["Radio", "Components"], ["Radio Lite", "Components"], ["Range", "Components"], ["Range Dual", "Components"],
    ["Rating", "Components"], ["Rating Input", "Components"], ["Reveal", "Components"], ["Save", "Components"],
    ["Select", "Components"], ["Select Lite", "Components"], ["Separator", "Components"], ["Spinner", "Components"],
    ["Stack", "Components"], ["SVG", "Components"], ["Switch", "Components"], ["Tabs", "Components"], ["Tab", "Components"],
    ["Tab Panel", "Components"], ["Textarea", "Components"], ["Textarea Lite", "Components"], ["Tooltip", "Components"],
  ]],
  ["Principles", "원칙", ["Principles", ["Design Principles", "Principles"], ["Motion Principles", "Principles"]]],
  ["Content Strategy", "문구와 용어", [
    "Content Strategy", ["Content Strategy Principles", "Content Strategy"], ["Voice and Tone", "Content Strategy"],
    ["Grammar and Mechanics", "Content Strategy"], ["Vocabulary", "Content Strategy"],
  ]],
  ["Accessibility", "접근성 기준", [
    "Accessibility", ["Accessibility Principles", "Accessibility"], ["Accessibility Checklist", "Accessibility"],
    ["Global Code", "Accessibility Checklist"], ["Default Language", "Accessibility Checklist"], ["Semantic HTML", "Accessibility Checklist"],
    ["Unique Page Title Element", "Accessibility Checklist"], ["Keyboard Navigation", "Accessibility Checklist"],
    ["Focus State", "Accessibility Checklist"], ["Keyboard Interaction", "Accessibility Checklist"], ["Logical Tab Order", "Accessibility Checklist"],
    ["Minimum Contrast Ratio", "Accessibility Checklist"], ["Text Contrast", "Accessibility Checklist"],
    ["Multi Device Responsive Design", "Accessibility Checklist"], ["Text Resizing", "Accessibility Checklist"],
    ["Touch Targets", "Accessibility Checklist"], ["Moving, Flashing, or Blinking Content", "Accessibility Checklist"],
    ["Content Flash", "Accessibility Checklist"], ["Stop Motion", "Accessibility Checklist"], ["Headings", "Accessibility Checklist"],
    ["Clear Headings", "Accessibility Checklist"], ["Sequential Headings", "Accessibility Checklist"],
    ["Forms, Labels, and Errors", "Accessibility Checklist"], ["Form Errors", "Accessibility Checklist"],
    ["Form Labels", "Accessibility Checklist"], ["Forms Keyboard Accessible", "Accessibility Checklist"],
    ["Written Material (Copy)", "Accessibility Checklist"], ["Clear Content", "Accessibility Checklist"],
    ["Meaningful Link Text", "Accessibility Checklist"], ["Image Text Alternatives", "Accessibility Checklist"],
    ["Image Alt Text", "Accessibility Checklist"], ["Color Contrast", "Accessibility"],
  ]],
  ["Resources", "도구", ["Resources", ["Toolbox", "Resources"]]],
];

const ebayGroups = [
  ["Design System", "상위 구조", ["Overview", "Principles", "Tokens", "Components", "Patterns", "Processes", "Change log"]],
  ["Tokens", "토큰 분류", ["Overview", "Change log", "Theming", "Color", "Dimension", "Spacing", "Typography", "Breakpoints", "Shadow", "Shape", "Opacity", "Motion", "Illustration"]],
  ["Components", "컴포넌트 분류", [
    "Overview", "Status", "Accordion", "Action bar", "Alert notice", ["Inline notice", "Alert notice"], ["Page notice", "Alert notice"],
    ["Section notice", "Alert notice"], "Avatar", "Badge", "Banner", "Breadcrumb", "Buttons", ["CTA button", "Buttons"],
    ["Icon button", "Buttons"], ["Link button", "Buttons"], "Calendar", "Card", "Carousel", "CCD", "Chip", ["Filter chip", "Chip"],
    ["Input chip", "Chip"], "Data visualization", ["Graphs", "Data visualization"], ["Metrics", "Data visualization"], "Dialog",
    ["Alert", "Dialog"], ["Confirmation", "Dialog"], ["Standard", "Dialog"], "Divider", "Education notice", "EEK rating and range",
    "Expansion", "Input", ["Checkbox", "Input"], ["Combobox", "Input"], ["Date field", "Input"], ["Dropdown", "Input"],
    ["Numeric stepper", "Input"], ["Password", "Input"], ["Phone number", "Input"], ["Radio button", "Input"], ["Select list", "Input"],
    ["Switch", "Input"], ["Text area", "Input"], ["Text field", "Input"], "Item tile", "List row", "Loading",
    ["Expressive loader", "Loading"], ["Skeleton loader", "Loading"], "Media container", "Navigation", ["Top navigation bar", "Navigation"],
    "Pagination", "Panel", "Popover", "Progress stepper", "Search field", "Section header", "Segmented button", "Sheet",
    ["Bottom Sheet", "Sheet"], ["Context sheet", "Sheet"], ["Focus sheet", "Sheet"], "Signal", "Snackbar", "State layer", "Tab", "Table", "Tip",
    ["Tooltip", "Tip"], ["Tourtip", "Tip"], "Toggle button group", "Video player",
  ]],
  ["Patterns", "패턴 분류", ["Overview", "Bulk editing", "Creating forms", "Empty states", "Filtering", "Requesting user feedback", "Uploading files", "Using links", ["Text link", "Using links"], ["Legal link", "Using links"]]],
];

const spacingTokenScale = [
  { id: "4", step: "0.5", token: "--bd-space-4", value: "4px", label: "간격 4", usage: "아이콘과 텍스트 사이, 가격과 단위 사이" },
  { id: "8", step: "1", token: "--bd-space-8", value: "8px", label: "간격 8", usage: "칩 사이, 작은 버튼 내부, 썸네일 안쪽 여백" },
  { id: "10", step: "1.25", token: "--bd-space-10", value: "10px", label: "간격 10", usage: "컴팩트 카드 행, 작은 입력 보조 영역" },
  { id: "12", step: "1.5", token: "--bd-space-12", value: "12px", label: "간격 12", usage: "매물 카드 내부, 필터 레일, 입력 묶음" },
  { id: "14", step: "1.75", token: "--bd-space-14", value: "14px", label: "간격 14", usage: "모바일 리스트 보조 간격, 좁은 카드 padding" },
  { id: "16", step: "2", token: "--bd-space-16", value: "16px", label: "간격 16", usage: "기본 스택 간격, 폼 필드 사이, 카드 묶음" },
  { id: "18", step: "2.25", token: "--bd-space-18", value: "18px", label: "간격 18", usage: "PC 카드 내부 여백, 섹션 안쪽 보조 간격" },
  { id: "20", step: "2.5", token: "--bd-space-20", value: "20px", label: "간격 20", usage: "모바일 화면 좌우 여백, 리스트 블록 간격" },
  { id: "24", step: "3", token: "--bd-space-24", value: "24px", label: "간격 24", usage: "섹션 내부 그룹, 상세 정보 블록 상하 간격" },
  { id: "32", step: "4", token: "--bd-space-32", value: "32px", label: "간격 32", usage: "문서 섹션, PC 콘텐츠 그룹 사이" },
  { id: "40", step: "5", token: "--bd-space-40", value: "40px", label: "간격 40", usage: "큰 화면 섹션 상하 여백, 주요 카드 그룹" },
  { id: "48", step: "6", token: "--bd-space-48", value: "48px", label: "간격 48", usage: "페이지 블록 분리, 문서 상단 여백" },
  { id: "56", step: "7", token: "--bd-space-56", value: "56px", label: "간격 56", usage: "넓은 화면 주요 섹션 간격" },
  { id: "64", step: "8", token: "--bd-space-64", value: "64px", label: "간격 64", usage: "PC 최상위 페이지 섹션 분리" },
  { id: "gap", step: "stack", token: "--bd-space-gap", value: "16px", label: "기본 스택 간격", usage: "카드 목록, 폼 행, 반복 요소의 기본 gap" },
];

const spacingRegistryItems = spacingTokenScale.map((token) => ({
  id: `token-space-${token.id}`,
  type: "토큰",
  name: token.label,
  standard: token.token,
  status: "등록완료",
  platform: "공통",
  sheet: "06_디자인토큰마스터",
  pcValue: token.value,
  moValue: token.value,
  props: "margin, padding, gap",
  note: token.usage,
}));

const iconLibraryGroups = [
  {
    id: "ui",
    title: "UI 아이콘",
    description: "검색, 닫기, 필터, 화살표처럼 화면 조작에 직접 쓰는 기본 UI 아이콘입니다.",
    folder: "ui",
    files: [
      "back.svg",
      "category-chevron-down.svg",
      "category-chevron-right.svg",
      "category-sheet-close.svg",
      "chevron-down.svg",
      "close.svg",
      "filter.svg",
      "list.svg",
      "notion-chevron-right.svg",
      "notion-close.svg",
      "notion-filter.svg",
      "notion-list.svg",
      "notion-search.svg",
      "region-chevron.svg",
      "search.svg",
      "sheet-chevron.svg",
      "sheet-close.svg",
      "sort-arrow.svg",
    ],
  },
  {
    id: "frequent",
    title: "자주쓰는 아이콘",
    description: "중고차 매물 리스트와 상세 페이지에서 반복 노출되는 핵심 액션 아이콘입니다.",
    folder: "ui",
    files: [
      "card-call.svg",
      "card-heart.svg",
      "card-message.svg",
      "card-more.svg",
      "card-view.svg",
      "bookmark.svg",
      "heart-outline.svg",
      "heart.svg",
      "location-blue.svg",
      "location-gray.svg",
      "photo-count.svg",
      "views.svg",
      "../detail/call.svg",
      "../detail/share.svg",
      "../detail/more.svg",
      "../detail/back.svg",
    ],
  },
  {
    id: "option",
    title: "옵션 아이콘",
    description: "스마트키, 안전/편의 사양, 상세 옵션 목록에 쓰는 아이콘입니다.",
    folder: "detail",
    files: [
      "option-01.png",
      "option-02.png",
      "option-03.png",
      "option-04.png",
      "option-05.png",
      "option-06.png",
      "option-07.png",
      "option-08.png",
      "option-09.png",
      "option-10.png",
      "option-11.png",
      "option-12.png",
      "option-13.png",
      "option-info.svg",
      "option-smart-key.png",
    ],
  },
  {
    id: "vehicle",
    title: "차량 관련 아이콘",
    description: "연식, 주행거리, 가격, 차종처럼 매물 정보와 차량 분류에 쓰는 아이콘입니다.",
    folder: "categories",
    files: [
      "used-car.svg",
      "truck.svg",
      "bike.svg",
      "camping.svg",
      "construction.svg",
      "old-car.svg",
      "parts.svg",
      "../detail/vehicle-info-chevron.svg",
      "../detail/price-tag.svg",
      "../detail/price-tag-dot.svg",
      "../detail/price-up.svg",
      "../detail/price-down.svg",
      "../detail/price-history-close.svg",
    ],
  },
  {
    id: "brand",
    title: "브랜드 아이콘",
    description: "제조사 로고, 브랜드 필터, 차량 상세의 브랜드 표시에 쓰는 아이콘입니다.",
    folder: "brand",
    files: [
      "audi.svg",
      "benz.png",
      "bmw.svg",
      "jaguar.png",
      "land-rover.svg",
      "lexus.svg",
      "lincoln.png",
      "mini.svg",
      "porsche-symbol.png",
      "porsche.png",
    ],
  },
  {
    id: "community",
    title: "커뮤니티 아이콘",
    description: "게시글, 댓글, 추천, 공유, 조회처럼 커뮤니티 화면에서 쓰는 아이콘입니다.",
    folder: "ui",
    files: [
      "message.svg",
      "card-message.svg",
      "heart.svg",
      "heart-outline.svg",
      "bookmark.svg",
      "views.svg",
      "card-view.svg",
      "../detail/share.svg",
      "../detail/more.svg",
    ],
  },
];

const optionIconCategories = [
  {
    id: "safety",
    title: "안전",
    description: "에어백, 경고 알림, 충돌 예방처럼 안전 옵션에 쓰는 아이콘입니다.",
  },
  {
    id: "convenience",
    title: "편의",
    description: "스마트키, 무선충전, 전동 트렁크처럼 사용 편의 옵션에 쓰는 아이콘입니다.",
  },
  {
    id: "parking",
    title: "주차/카메라",
    description: "후방카메라, 360도 보기, 주차 보조처럼 주차 확인에 쓰는 아이콘입니다.",
  },
  {
    id: "seat",
    title: "시트/공조",
    description: "열선, 통풍처럼 좌석과 공조 옵션에 쓰는 아이콘입니다.",
  },
  {
    id: "driving",
    title: "주행/표시",
    description: "HUD, 조명, 주행 보조처럼 운전 중 확인하는 옵션에 쓰는 아이콘입니다.",
  },
  {
    id: "etc",
    title: "기타",
    description: "분류가 확정되지 않았거나 안내성으로 쓰는 옵션 아이콘입니다.",
  },
];

const optionIconMetadata = {
  "option-01": { name: "무선충전 옵션 아이콘", category: "convenience" },
  "option-02": { name: "LED 헤드램프 옵션 아이콘", category: "driving" },
  "option-03": { name: "주차 보조 옵션 아이콘", category: "parking" },
  "option-04": { name: "후방카메라 옵션 아이콘", category: "parking" },
  "option-05": { name: "360도 어라운드뷰 옵션 아이콘", category: "parking" },
  "option-06": { name: "에어백 옵션 아이콘", category: "safety" },
  "option-07": { name: "주차 센서 옵션 아이콘", category: "parking" },
  "option-08": { name: "열선시트 옵션 아이콘", category: "seat" },
  "option-09": { name: "통풍시트 옵션 아이콘", category: "seat" },
  "option-10": { name: "HUD 옵션 아이콘", category: "driving" },
  "option-11": { name: "전동 트렁크 옵션 아이콘", category: "convenience" },
  "option-12": { name: "안전 경고 옵션 아이콘", category: "safety" },
  "option-13": { name: "차선/충돌 경고 옵션 아이콘", category: "safety" },
  "option-info": { name: "옵션 정보 아이콘", category: "etc" },
  "option-smart-key": { name: "스마트키 옵션 아이콘", category: "convenience" },
};

const assetIconRegistryItems = iconLibraryGroups.flatMap((group) =>
  group.files.map((file) => {
    const extension = iconFileExtension(file);
    const iconName = iconDisplayName(group.id, file);
    const optionMeta = group.id === "option" ? optionIconMetadata[iconBaseName(file)] : null;
    const standardBase = `${group.id}_${iconBaseName(file)}`.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "").toLowerCase();
    return {
      id: `icon-${standardBase}`,
      type: "아이콘",
      name: iconName,
      standard: `ic_${standardBase}.${extension}`,
      status: "등록완료",
      platform: "공통",
      sheet: "07_아이콘명칭규칙",
      pcValue: extension === "svg" ? "24px" : "원본 비율",
      moValue: extension === "svg" ? "24px" : "원본 비율",
      props: `group:${group.id}${optionMeta ? `, optionCategory:${optionMeta.category}` : ""}, ${extension}, download, white background, alt text`,
      note: `${group.title} 그룹에서 다운로드해 재사용합니다.`,
      iconPath: iconAssetPath(`${group.folder}/${file}`),
      iconFileName: `ic_${standardBase}.${extension}`,
      createdAt: "2026-09-02T00:00:00.000Z",
      updatedAt: "2026-09-02T00:00:00.000Z",
      archived: false,
    };
  }),
);

const seedItems = [
  {
    id: "ref-ebay",
    type: "해외 레퍼런스",
    name: "eBay Evo Design System",
    standard: "ref_ebay_evo",
    status: "등록완료",
    platform: "공통",
    sheet: "99_코드값",
    pcValue: "",
    moValue: "",
    props: "card, list row, chip, input, sheet, pagination",
    note: "마켓플레이스 컴포넌트 구조 참고",
  },
  {
    id: "token-color",
    type: "토큰",
    name: "Color Token",
    standard: "--bd-color-primary",
    status: "검토필요",
    platform: "공통",
    sheet: "06_디자인토큰마스터",
    pcValue: "#1247A0",
    moValue: "#1247A0",
    props: "text, background, border, semantic color",
    note: "HEX와 rgba를 분리 등록",
  },
  ...spacingRegistryItems,
  {
    id: "token-breakpoint",
    type: "토큰",
    name: "Breakpoint Token",
    standard: "--bd-bp-mobile",
    status: "검토필요",
    platform: "공통",
    sheet: "06_디자인토큰마스터",
    pcValue: "1440px",
    moValue: "390px",
    props: "mobile, tablet, pc, wide",
    note: "390, 768, 1280, 1440, 1920 기준",
  },
  {
    id: "component-listing-card",
    type: "컴포넌트",
    name: "매물 카드",
    standard: "ListingCard",
    status: "검토필요",
    platform: "PC웹",
    sheet: "04_컴포넌트마스터",
    pcValue: "thumb 230px",
    moValue: "thumb 100%",
    props: "width, padding, gap, border, hover, visited",
    note: "리스트형, 갤러리형, 큰사진형 variant",
  },
  {
    id: "component-filter-chip",
    type: "컴포넌트",
    name: "필터 칩",
    standard: "FilterChip",
    status: "검토필요",
    platform: "모바일웹",
    sheet: "04_컴포넌트마스터",
    pcValue: "36px",
    moValue: "34px",
    props: "height, padding, gap, radius, selected, disabled",
    note: "결과 0건 disabled 상태 포함",
  },
  {
    id: "component-filter-panel",
    type: "컴포넌트",
    name: "차량 필터 패널",
    standard: "BobaFilterPanel",
    status: "검토필요",
    platform: "공통",
    sheet: "04_컴포넌트마스터",
    pcValue: "304px side rail",
    moValue: "bottom sheet",
    props: "year, mileage, price, region, maker, selected chips",
    note: "보배드림 연식/주행거리/가격/지역/제조사 필터 기준",
  },
  {
    id: "component-bottom-sheet",
    type: "컴포넌트",
    name: "검색/필터 바텀시트",
    standard: "BobaBottomSheet",
    status: "검토필요",
    platform: "모바일웹",
    sheet: "04_컴포넌트마스터",
    pcValue: "modal 또는 side panel 전환",
    moValue: "390×652px, top 12px, radius 32px",
    props: "open, title, ariaLabel, snapPoints, defaultSnapPoint, sections, footerAction, rangeControls",
    note: "Airbnb 체험 검색/필터 바텀시트 실측값을 기준으로 보배드림 차량 검색과 필터 수정 흐름에 적용",
  },
  {
    id: "template-airbnb-experiences-bottom-sheet",
    type: "템플릿",
    name: "Airbnb형 체험 검색 바텀시트",
    standard: "template_airbnb_experiences_bottom_sheet",
    status: "등록완료",
    platform: "모바일웹",
    sheet: "09_템플릿",
    pcValue: "dialog fallback",
    moValue: "search 390×664px / filter 390×652px",
    props: "search sheet, filter sheet, chip group, range slider assets, fixed footer CTA",
    note: "Airbnb 체험 검색 URL을 모바일 렌더링으로 측정하고 보배드림 필터 바텀시트 샘플 템플릿으로 정리",
  },
  {
    id: "component-badge",
    type: "컴포넌트",
    name: "신뢰 배지",
    standard: "BobaBadge",
    status: "검토필요",
    platform: "공통",
    sheet: "04_컴포넌트마스터",
    pcValue: "20px min-height",
    moValue: "20px min-height",
    props: "accident-free, inspected, urgent, real-listing, price-drop",
    note: "무사고, 진단, 급매, 실매물, 가격인하 상태를 Badge로 통합",
  },
  {
    id: "component-bottom-cta",
    type: "컴포넌트",
    name: "상세 하단 문의 바",
    standard: "DetailBottomCTA",
    status: "검토필요",
    platform: "앱",
    sheet: "04_컴포넌트마스터",
    pcValue: "해당없음",
    moValue: "height 72px",
    props: "position, bottom, safe-area, shadow, z-index",
    note: "iOS safe area와 sticky bottom 우선",
  },
  {
    id: "component-pagination",
    type: "컴포넌트",
    name: "매물 페이지네이션",
    standard: "BobaPagination",
    status: "검토필요",
    platform: "PC웹",
    sheet: "04_컴포넌트마스터",
    pcValue: "40px button",
    moValue: "더보기 전환 검토",
    props: "page, previous, next, ellipsis, selected",
    note: "매물 리스트 페이지 이동과 SEO 페이지 탐색에 사용",
  },
  {
    id: "component-tabs",
    type: "컴포넌트",
    name: "상세 탭",
    standard: "BobaTabs",
    status: "검토필요",
    platform: "공통",
    sheet: "04_컴포넌트마스터",
    pcValue: "sticky top",
    moValue: "horizontal scroll",
    props: "detail, inspection, insurance, dealer, reviews",
    note: "상세정보, 성능점검, 보험이력 전환 기준",
  },
  {
    id: "component-notification",
    type: "컴포넌트",
    name: "문의/오류 알림",
    standard: "BobaNotification",
    status: "검토필요",
    platform: "공통",
    sheet: "04_컴포넌트마스터",
    pcValue: "page notice/toast",
    moValue: "snackbar/inline",
    props: "quote, inquiry, error, success, dismiss",
    note: "견적, 문의, 오류, 찜 저장 완료 피드백",
  },
  {
    id: "icon-filter",
    type: "아이콘",
    name: "필터 아이콘",
    standard: "ic_interface_filter_24.svg",
    status: "등록완료",
    platform: "공통",
    sheet: "07_아이콘명칭규칙",
    pcValue: "24px",
    moValue: "24px",
    props: "group:ui, UI 아이콘, width, height, stroke, active color, hit area, download, white background, alt text",
    note: "필터 버튼과 칩에 사용",
    iconPath: iconAssetPath("ui/filter.svg"),
    iconFileName: "ic_interface_filter_24.svg",
  },
  {
    id: "icon-favorite",
    type: "아이콘",
    name: "찜 아이콘",
    standard: "ic_interface_favorite_24.svg",
    status: "등록완료",
    platform: "공통",
    sheet: "07_아이콘명칭규칙",
    pcValue: "24px",
    moValue: "24px",
    props: "group:frequent, 자주쓰는 아이콘, outline, active fill, scale animation, download, white background, alt text",
    note: "매물 카드와 상세 상단 공통",
    iconPath: iconAssetPath("ui/heart.svg"),
    iconFileName: "ic_interface_favorite_24.svg",
  },
  {
    id: "icon-filter-chip-close",
    type: "아이콘",
    name: "필터 칩 닫기 아이콘",
    standard: "ic_interface_chip_close_24.svg",
    status: "등록완료",
    platform: "공통",
    sheet: "07_아이콘명칭규칙",
    pcValue: "24px",
    moValue: "24px",
    props: "group:ui, UI 아이콘, width, height, fill, color, hit area, aria-label, download, white background, alt text",
    note: "선택된 필터 칩을 해제할 때 사용",
    iconPath: "./icons/ic_filter_chip_close_24.svg",
    iconFileName: "ic_interface_chip_close_24.svg",
  },
  ...assetIconRegistryItems,
  {
    id: "button-primary",
    type: "버튼",
    name: "Primary Button",
    standard: "ButtonPrimary",
    status: "검토필요",
    platform: "공통",
    sheet: "08_버튼스타일마스터",
    pcValue: "40px",
    moValue: "44px",
    props: "height, padding, radius, background, color, loading",
    note: "매물 등록, 문의, 확인",
  },
  {
    id: "button-chip",
    type: "버튼",
    name: "Chip Button",
    standard: "ButtonChip",
    status: "검토필요",
    platform: "모바일웹",
    sheet: "08_버튼스타일마스터",
    pcValue: "36px",
    moValue: "34px",
    props: "height, padding-inline, radius-pill, selected",
    note: "모바일 필터 조건",
  },
  {
    id: "state-hover",
    type: "상태",
    name: "Hover State",
    standard: "state_hover",
    status: "등록완료",
    platform: "PC웹",
    sheet: "09_상태인터랙션",
    pcValue: "translateY(-2px)",
    moValue: "해당없음",
    props: "shadow, transform, color change",
    note: "PC 매물 카드 hover 필수",
  },
  {
    id: "state-disabled",
    type: "상태",
    name: "Disabled State",
    standard: "state_disabled",
    status: "등록완료",
    platform: "공통",
    sheet: "09_상태인터랙션",
    pcValue: "opacity .45",
    moValue: "opacity .45",
    props: "opacity, cursor, contrast, click blocking",
    note: "결과 0건 필터 포함",
  },
];

let items = loadItems();
let repoMetricCounts = new Map();

const STATIC_ROUTE_SECTIONS = new Map([
  ["#home", ["overview"]],
  ["#catalog", ["catalog"]],
  ["#workflow", ["workflow"]],
  ["#tokens", ["tokens"]],
  ["#component-showcase", ["component-showcase"]],
  ["#icons", ["icons"]],
  ["#buttons", ["buttons"]],
  ["#states", ["states"]],
  ["#preview", ["preview"]],
  ["#registry", ["registry"]],
]);

const elements = {
  sidebar: document.querySelector("#designSidebar"),
  sidebarNav: document.querySelector("#sidebarNav"),
  sidebarSearch: document.querySelector("#sidebarSearch"),
  clearSidebarSearch: document.querySelector("#clearSidebarSearch"),
  sidebarSearchCount: document.querySelector("#sidebarSearchCount"),
  sidebarEmpty: document.querySelector("#sidebarEmpty"),
  menuToggle: document.querySelector("#menuToggle"),
  collapseSidebar: document.querySelector("#collapseSidebar"),
  closeSidebar: document.querySelector("#closeSidebar"),
  sidebarOverlay: document.querySelector("#sidebarOverlay"),
  globalStorybookLink: document.querySelector('.topbar-actions a[href="../storybook/index.html"]'),
  docPage: document.querySelector("#docPage"),
  pageSections: [...document.querySelectorAll("main.page > .section")],
  metricGrid: document.querySelector("#metricGrid"),
  homeEntryGrid: document.querySelector("#homeEntryGrid"),
  referenceRows: document.querySelector("#referenceRows"),
  fuseCatalog: document.querySelector("#fuseCatalog"),
  ebayCatalog: document.querySelector("#ebayCatalog"),
  tokenCards: document.querySelector("#tokenCards"),
  componentCards: document.querySelector("#componentCards"),
  iconGrid: document.querySelector("#iconGrid"),
  buttonCards: document.querySelector("#buttonCards"),
  stateRow: document.querySelector("#stateRow"),
  registryRows: document.querySelector("#registryRows"),
  registryCards: document.querySelector("#registryCards"),
  registrySummary: document.querySelector("#registrySummary"),
  form: document.querySelector("#registryForm"),
  editBanner: document.querySelector("#editBanner"),
  editBannerText: document.querySelector("#editBannerText"),
  itemId: document.querySelector("#itemId"),
  itemType: document.querySelector("#itemType"),
  itemName: document.querySelector("#itemName"),
  itemStandard: document.querySelector("#itemStandard"),
  itemStatus: document.querySelector("#itemStatus"),
  itemPlatform: document.querySelector("#itemPlatform"),
  itemSheet: document.querySelector("#itemSheet"),
  itemPcValue: document.querySelector("#itemPcValue"),
  itemMoValue: document.querySelector("#itemMoValue"),
  itemProps: document.querySelector("#itemProps"),
  itemNote: document.querySelector("#itemNote"),
  iconUploadPanel: document.querySelector("#iconUploadPanel"),
  iconPreview: document.querySelector("#iconPreview"),
  itemIconInput: document.querySelector("#itemIconInput"),
  clearIconButton: document.querySelector("#clearIconButton"),
  iconFileName: document.querySelector("#iconFileName"),
  itemIconData: document.querySelector("#itemIconData"),
  itemIconFileName: document.querySelector("#itemIconFileName"),
  itemIconPath: document.querySelector("#itemIconPath"),
  itemAppliedPage: document.querySelector("#itemAppliedPage"),
  itemAppliedUrl: document.querySelector("#itemAppliedUrl"),
  itemTypeError: document.querySelector("#itemTypeError"),
  itemNameError: document.querySelector("#itemNameError"),
  itemStandardError: document.querySelector("#itemStandardError"),
  itemStatusError: document.querySelector("#itemStatusError"),
  itemPlatformError: document.querySelector("#itemPlatformError"),
  itemPropsError: document.querySelector("#itemPropsError"),
  saveButton: document.querySelector("#saveButton"),
  clearButton: document.querySelector("#clearButton"),
  cancelEditButton: document.querySelector("#cancelEditButton"),
  newItemButton: document.querySelector("#newItemButton"),
  exportJsonButton: document.querySelector("#exportJsonButton"),
  exportCsvButton: document.querySelector("#exportCsvButton"),
  importJsonInput: document.querySelector("#importJsonInput"),
  searchInput: document.querySelector("#searchInput"),
  clearSearchButton: document.querySelector("#clearSearchButton"),
  typeFilter: document.querySelector("#typeFilter"),
  resetDataButton: document.querySelector("#resetDataButton"),
  toast: document.querySelector("#toast"),
  toastMessage: document.querySelector("#toastMessage"),
  toastAction: document.querySelector("#toastAction"),
  confirmDialog: document.querySelector("#confirmDialog"),
  confirmTitle: document.querySelector("#confirmTitle"),
  confirmMessage: document.querySelector("#confirmMessage"),
  cancelConfirmButton: document.querySelector("#cancelConfirmButton"),
  confirmDeleteButton: document.querySelector("#confirmDeleteButton"),
  iconEditDialog: document.querySelector("#iconEditDialog"),
  iconEditForm: document.querySelector("#iconEditForm"),
  iconEditId: document.querySelector("#iconEditId"),
  iconEditPreview: document.querySelector("#iconEditPreview"),
  iconEditName: document.querySelector("#iconEditName"),
  iconEditCategory: document.querySelector("#iconEditCategory"),
  iconEditStandard: document.querySelector("#iconEditStandard"),
  iconEditAppliedPage: document.querySelector("#iconEditAppliedPage"),
  iconEditAppliedUrl: document.querySelector("#iconEditAppliedUrl"),
  iconEditNote: document.querySelector("#iconEditNote"),
  closeIconEditButton: document.querySelector("#closeIconEditButton"),
  cancelIconEditButton: document.querySelector("#cancelIconEditButton"),
};

let formBaseline = "";
let pendingConfirm = null;
let previousFocus = null;
let selectedIconIds = new Set();
let previousIconEditFocus = null;
let sectionNavFrame = 0;
let expandedSidebarIds = new Set();

document.addEventListener("DOMContentLoaded", async () => {
  bindEvents();
  restoreSidebarState();
  removeGlobalStorybookLink();
  await hydrateItemsFromRepoData();
  renderAll();
  captureFormBaseline();
});

function bindEvents() {
  window.addEventListener("hashchange", renderSidebar);
  window.addEventListener("resize", handleSidebarViewportChange);
  window.addEventListener("scroll", handlePageScroll, { passive: true });
  document.addEventListener("click", handleTableAction);
  document.addEventListener("click", handleSectionScrollClick);
  document.addEventListener("click", handleIconDocumentClick);
  document.addEventListener("click", handlePaginationTemplateClick);
  document.addEventListener("click", handleBottomSheetDemoClick);
  document.addEventListener("change", handleIconDocumentChange);
  document.addEventListener("keydown", handleGlobalKeydown);
  elements.sidebarNav.addEventListener("click", handleSidebarClick);
  elements.sidebarSearch.addEventListener("input", renderSidebar);
  elements.clearSidebarSearch.addEventListener("click", () => {
    elements.sidebarSearch.value = "";
    renderSidebar();
    elements.sidebarSearch.focus();
  });
  elements.menuToggle.addEventListener("click", handleSidebarOpenButton);
  elements.collapseSidebar.addEventListener("click", () => setSidebarCollapsed(true));
  elements.closeSidebar.addEventListener("click", closeSidebar);
  elements.sidebarOverlay.addEventListener("click", closeSidebar);
  elements.form.addEventListener("submit", saveItem);
  elements.form.addEventListener("input", clearLiveValidation);
  elements.form.addEventListener("change", clearLiveValidation);
  elements.itemType.addEventListener("change", syncIconUploadVisibility);
  elements.itemIconInput.addEventListener("change", handleIconFileChange);
  elements.clearIconButton.addEventListener("click", clearIconPreview);
  elements.clearButton.addEventListener("click", () => clearForm());
  elements.cancelEditButton.addEventListener("click", () => {
    clearForm();
    showToast("수정을 취소했습니다.");
  });
  elements.newItemButton.addEventListener("click", () => {
    confirmBeforeLosingFormChanges(() => {
      clearForm();
      navigateToStaticRoute("#registry", () => elements.itemName.focus());
    });
  });
  elements.exportJsonButton.addEventListener("click", exportJson);
  elements.exportCsvButton.addEventListener("click", exportCsv);
  elements.importJsonInput.addEventListener("change", importJson);
  elements.searchInput.addEventListener("input", renderRegistry);
  elements.clearSearchButton.addEventListener("click", () => {
    elements.searchInput.value = "";
    renderRegistry();
    elements.searchInput.focus();
  });
  elements.typeFilter.addEventListener("change", renderRegistry);
  elements.resetDataButton.addEventListener("click", resetData);
  elements.cancelConfirmButton.addEventListener("click", closeConfirm);
  elements.confirmDeleteButton.addEventListener("click", runPendingConfirm);
  elements.confirmDialog.addEventListener("click", (event) => {
    if (event.target === elements.confirmDialog) closeConfirm();
  });
  elements.iconEditForm.addEventListener("submit", saveIconEdit);
  elements.closeIconEditButton.addEventListener("click", closeIconEditDialog);
  elements.cancelIconEditButton.addEventListener("click", closeIconEditDialog);
  elements.iconEditDialog.addEventListener("click", (event) => {
    if (event.target === elements.iconEditDialog) closeIconEditDialog();
  });
  syncIconUploadVisibility();
  syncActiveNav();
}

function removeGlobalStorybookLink() {
  elements.globalStorybookLink?.remove();
  elements.globalStorybookLink = null;
}

function loadItems() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return cloneSeedItems();
    const parsed = JSON.parse(stored);
    const storedItems = normalizeRegistryItems(readRegistryPayload(parsed));
    return mergeSeedItems(storedItems);
  } catch {
    return cloneSeedItems();
  }
}

function persistItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(buildRegistryPayload(items)));
}

async function hydrateItemsFromRepoData() {
  try {
    const response = await fetch("./data/registry.json", { cache: "no-cache" });
    if (!response.ok) return;
    const payload = await response.json();
    const repoItems = normalizeRegistryItems(readRegistryPayload(payload));
    if (!repoItems.length) return;
    repoMetricCounts = metricCountsForItems(repoItems);
    const customItems = items.filter((item) => !isSeedRegistryItem(item) && !isLegacyGeneratedIconItem(item));
    items = mergeSeedItems([...repoItems, ...customItems], { includeIconSeeds: false });
    persistItems();
  } catch {
    items = mergeSeedItems(items);
  }
}

function cloneSeedItems() {
  return seedItems.map((item) => normalizeRegistryItem(item));
}

function readRegistryPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") {
    throw new Error("Registry JSON object expected.");
  }
  if (payload.schema_version !== SCHEMA_VERSION) {
    throw new Error(`지원하지 않는 schema_version: ${payload.schema_version || "없음"}`);
  }
  if (!Array.isArray(payload.items)) {
    throw new Error("items 배열이 필요합니다.");
  }
  return payload.items;
}

function buildRegistryPayload(sourceItems = items) {
  return {
    schema_version: SCHEMA_VERSION,
    project: PROJECT_ID,
    updated_at: new Date().toISOString(),
    items: sourceItems.map((item) => normalizeRegistryItem(item)),
  };
}

function normalizeRegistryItems(sourceItems = []) {
  const seenIds = new Set();

  return sourceItems
    .map((item) => normalizeRegistryItem(item))
    .filter((item) => {
      if (seenIds.has(item.id)) return false;
      seenIds.add(item.id);
      return true;
    });
}

function normalizeRegistryItem(item = {}) {
  const now = new Date().toISOString();
  if (String(item.id || "") === "token-spacing" && String(item.standard || "").trim() === "--space-12") {
    const spacingToken = spacingTokenScale.find((token) => token.id === "12");
    item = {
      ...item,
      id: `token-space-${spacingToken.id}`,
      name: spacingToken.label,
      standard: spacingToken.token,
      status: "등록완료",
      pcValue: spacingToken.value,
      moValue: spacingToken.value,
      props: "margin, padding, gap",
      note: spacingToken.usage,
    };
  }

  const normalized = {
    id: String(item.id || createId()),
    type: String(item.type || DEFAULT_TYPE),
    name: String(item.name || "").trim(),
    standard: String(item.standard || "").trim(),
    status: String(item.status || DEFAULT_STATUS),
    platform: String(item.platform || DEFAULT_PLATFORM),
    sheet: String(item.sheet || "").trim(),
    pcValue: String(item.pcValue || "").trim(),
    moValue: String(item.moValue || "").trim(),
    props: String(item.props || "").trim(),
    note: String(item.note || "").trim(),
    iconPath: String(item.iconPath || "").trim(),
    iconData: String(item.iconData || "").trim(),
    iconFileName: String(item.iconFileName || "").trim(),
    appliedPage: String(item.appliedPage || "").trim(),
    appliedUrl: String(item.appliedUrl || "").trim(),
    createdAt: item.createdAt || item.updatedAt || now,
    updatedAt: item.updatedAt || now,
    archived: Boolean(item.archived),
  };

  return normalized;
}

function mergeSeedItems(sourceItems = [], options = {}) {
  const { includeIconSeeds = true } = options;
  const normalized = normalizeRegistryItems(sourceItems);
  const seenIds = new Set(normalized.map((item) => item.id));
  const seedSource = includeIconSeeds
    ? cloneSeedItems()
    : cloneSeedItems().filter((item) => item.type !== "아이콘");
  const missingSeeds = seedSource.filter((item) => !seenIds.has(item.id));
  return [...normalized, ...missingSeeds];
}

function isSeedRegistryItem(item) {
  const id = String(item.id || "");
  return seedItems.some((seedItem) => String(seedItem.id || "") === id);
}

function isLegacyGeneratedIconItem(item) {
  if (String(item.type || "") !== "아이콘") return false;

  const id = String(item.id || "").toLowerCase();
  if (!/^icon_brand_[a-z0-9_]+$/.test(id)) return false;

  const source = [item.iconPath, item.iconFileName, item.standard].join(" ").toLowerCase();
  return /(^|[\\/])assets[\\/](brand)[\\/]/.test(source) || source.includes("/brand/");
}

function activeItems() {
  return items.filter((item) => !item.archived);
}

function renderAll() {
  renderSidebar();
}

const DYNAMIC_SECTION_ELEMENTS = {
  overview: ["metricGrid", "homeEntryGrid"],
  catalog: ["fuseCatalog", "ebayCatalog"],
  tokens: ["tokenCards"],
  "component-showcase": ["componentCards"],
  icons: ["iconGrid"],
  buttons: ["buttonCards"],
  states: ["stateRow"],
  registry: ["registryRows", "registryCards", "registrySummary"],
};

function renderStaticRouteContent(sectionIds = []) {
  const activeSectionIds = new Set(sectionIds);
  if (activeSectionIds.has("overview")) renderHome();
  if (activeSectionIds.has("catalog")) renderCatalogs();
  if (activeSectionIds.has("tokens")) renderTokenCards();
  if (activeSectionIds.has("component-showcase")) renderComponentCards();
  if (activeSectionIds.has("icons")) renderIconCards();
  if (activeSectionIds.has("buttons")) renderButtonCards();
  if (activeSectionIds.has("states")) renderStateCards();
  if (activeSectionIds.has("registry")) renderRegistry();
}

function clearInactiveDynamicSections(sectionIds = []) {
  const activeSectionIds = new Set(sectionIds);
  Object.entries(DYNAMIC_SECTION_ELEMENTS).forEach(([sectionId, elementKeys]) => {
    if (activeSectionIds.has(sectionId)) return;
    elementKeys.forEach((key) => {
      const element = elements[key];
      if (element) element.innerHTML = "";
    });
  });
}

function renderSidebar() {
  const query = elements.sidebarSearch.value.trim().toLowerCase();
  const activeHash = currentRouteHash();
  const visibleTree = filterSidebarTree(fuseSidebarTree, query);
  const count = countSidebarItems(visibleTree);
  elements.sidebarEmpty.hidden = visibleTree.length > 0;
  elements.sidebarSearchCount.textContent = query ? `${count}개 결과` : "";
  elements.sidebarNav.innerHTML = visibleTree.length ? renderSidebarList(visibleTree, query, activeHash) : "";
  syncActiveNav();
}

function renderSidebarList(nodes, query = "", activeHash = currentRouteHash(), listId = "") {
  const idAttribute = listId ? ` id="${escapeAttribute(listId)}"` : "";
  return `
    <ul class="fuse-nav-list"${idAttribute}>
      ${nodes.map((node) => renderSidebarItem(node, query, activeHash)).join("")}
    </ul>
  `;
}

function renderSidebarItem(node, query = "", activeHash = currentRouteHash()) {
  const hasChildren = node.children.length > 0;
  const nodeLabel = displaySidebarName(node);
  const nodeTitle = displayNodeName(node);
  const isActive = node.href === activeHash;
  const isExpanded = isSidebarNodeExpanded(node, query, activeHash);
  const visibleChildren = sidebarChildrenForRender(node, query, activeHash, isExpanded);
  const childListId = sidebarChildListId(node);
  const classNames = [
    "nav-link",
    "fuse-nav-link",
    `depth-${node.depth}`,
    hasChildren ? "has-children" : "",
    hasChildren && isExpanded ? "expanded" : "",
    node.status === "deprecated" ? "deprecated" : "",
    node.status === "custom" ? "custom" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return `
    <li class="fuse-nav-item depth-${node.depth}">
      <div class="nav-row depth-${node.depth}">
        ${
          hasChildren
            ? `<button
                class="nav-disclosure"
                type="button"
                data-sidebar-toggle="${escapeAttribute(node.id)}"
                aria-expanded="${isExpanded ? "true" : "false"}"
                aria-controls="${escapeAttribute(childListId)}"
                aria-label="${escapeAttribute(`${nodeLabel} ${isExpanded ? "접기" : "열기"}`)}"
              >
                <span class="nav-caret" aria-hidden="true">›</span>
              </button>`
            : '<span class="nav-disclosure-placeholder" aria-hidden="true"></span>'
        }
        <a
          class="${classNames}"
          href="${escapeAttribute(node.href)}"
          data-sidebar-id="${escapeAttribute(node.id)}"
          data-doc-title="${escapeAttribute(node.title)}"
          data-doc-route="${isDocumentRoute(node) ? "true" : "false"}"
          title="${escapeAttribute(nodeTitle)}"
          aria-label="${escapeAttribute(nodeTitle)}"
        >
          <span class="nav-content">
            <span class="nav-name">${highlightText(nodeLabel, query)}</span>
          </span>
          ${node.status === "deprecated" ? '<em class="nav-status">deprecated</em>' : ""}
        </a>
      </div>
      ${hasChildren && isExpanded ? renderSidebarList(visibleChildren, query, activeHash, childListId) : ""}
    </li>
  `;
}

function sidebarChildListId(node) {
  return `nav-children-${node.id}`;
}

function isSidebarNodeExpanded(node, query, activeHash) {
  if (!node.children.length) return false;
  return Boolean(query) || expandedSidebarIds.has(node.id) || nodeHasActiveDescendant(node, activeHash);
}

function sidebarChildrenForRender(node, query, activeHash, isExpanded) {
  if (!isExpanded) return [];
  if (query || expandedSidebarIds.has(node.id)) return node.children;
  return node.children.filter((child) => nodeContainsHash(child, activeHash));
}

function nodeContainsHash(node, hash) {
  return node.href === hash || node.children.some((child) => nodeContainsHash(child, hash));
}

function nodeHasActiveDescendant(node, hash) {
  return node.children.some((child) => nodeContainsHash(child, hash));
}

function findSidebarNodeById(id, nodes = fuseSidebarTree) {
  for (const node of nodes) {
    if (node.id === id) return node;
    const child = findSidebarNodeById(id, node.children);
    if (child) return child;
  }
  return null;
}

function toggleSidebarNode(id) {
  const node = findSidebarNodeById(id);
  if (!node || !node.children.length) return;

  if (expandedSidebarIds.has(id)) {
    expandedSidebarIds.delete(id);
  } else {
    if (node.depth === 0) {
      expandedSidebarIds = new Set(
        [...expandedSidebarIds].filter((expandedId) => findSidebarNodeById(expandedId)?.depth !== 0),
      );
    }
    expandedSidebarIds.add(id);
  }

  renderSidebar();
}

function renderSidebarPageSections(node) {
  if (!isDocumentRoute(node)) return "";
  const sections = documentSectionsForNode(node);
  if (!sections.length) return "";
  return `
    <ul class="fuse-nav-list nav-page-sections" aria-label="${escapeAttribute(displayNodeName(node))} 페이지 목차">
      ${sections
        .map(
          ([label, target]) => `
            <li class="fuse-nav-item">
              <button class="nav-link nav-section-link depth-${node.depth + 1}" type="button" data-scroll-target="${escapeAttribute(target)}">
                <span class="nav-content">
                  <span class="nav-name">${escapeHtml(label)}</span>
                </span>
              </button>
            </li>
          `,
        )
        .join("")}
    </ul>
  `;
}

function filterSidebarTree(nodes, query) {
  if (!query) return nodes;
  return nodes
    .map((node) => {
      const children = filterSidebarTree(node.children, query);
      if (sidebarNodeMatches(node, query) || children.length) {
        return { ...node, children };
      }
      return null;
    })
    .filter(Boolean);
}

function countSidebarItems(nodes) {
  return nodes.reduce((count, node) => count + 1 + countSidebarItems(node.children), 0);
}

function sidebarNodeMatches(node, query) {
  return [node.title, node.koTitle, node.href].join(" ").toLowerCase().includes(query);
}

function displayNodeName(node) {
  return node.koTitle && node.koTitle !== node.title ? `${node.title} (${node.koTitle})` : node.title;
}

function displaySidebarName(node) {
  return node.koTitle || node.title;
}

function isDocumentRoute(node) {
  return node.status !== "custom" || !["#registry", "#workflow", "#component-showcase", "#preview"].includes(node.href);
}

function handleSidebarClick(event) {
  const disclosure = event.target.closest("[data-sidebar-toggle]");
  if (disclosure) {
    event.preventDefault();
    event.stopPropagation();
    toggleSidebarNode(disclosure.dataset.sidebarToggle);
    return;
  }

  const link = event.target.closest(".fuse-nav-link");
  if (!link) return;

  if (link.dataset.docRoute === "true") {
    event.preventDefault();
    const href = link.getAttribute("href");
    if (window.location.hash === href) {
      syncActiveNav();
    } else {
      window.location.hash = href;
    }
    elements.docPage.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  closeSidebar();
}

function handleSectionScrollClick(event) {
  const button = event.target.closest("[data-scroll-target]");
  if (!button) return;

  const target = document.querySelector(button.dataset.scrollTarget || "");
  if (!target) return;

  event.preventDefault();
  setActivePageSectionTarget(button.dataset.scrollTarget);
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  if (button.closest(".sidebar")) closeSidebar();
}

function handlePageScroll() {
  if (sectionNavFrame) return;
  sectionNavFrame = window.requestAnimationFrame(() => {
    sectionNavFrame = 0;
    syncActivePageSectionNav();
  });
}

function openSidebar() {
  document.body.classList.add("sidebar-open");
  if (window.innerWidth > 760) setSidebarCollapsed(false);
  elements.menuToggle.setAttribute("aria-expanded", "true");
  elements.closeSidebar.focus({ preventScroll: true });
}

function closeSidebar() {
  document.body.classList.remove("sidebar-open");
  elements.menuToggle.setAttribute("aria-expanded", "false");
}

function handleSidebarOpenButton() {
  if (window.innerWidth > 760) {
    setSidebarCollapsed(false);
    return;
  }

  openSidebar();
}

function setSidebarCollapsed(collapsed, options = {}) {
  const shouldPersist = options.persist !== false && window.innerWidth > 760;
  document.body.classList.toggle("sidebar-collapsed", collapsed);
  elements.menuToggle.setAttribute("aria-expanded", String(!collapsed));
  elements.menuToggle.setAttribute("aria-label", collapsed ? "좌측 메뉴 열기" : "좌측 메뉴");
  elements.collapseSidebar.setAttribute("aria-expanded", String(!collapsed));
  elements.collapseSidebar.setAttribute("aria-label", collapsed ? "좌측 메뉴 열기" : "좌측 메뉴 접기");
  if (shouldPersist) localStorage.setItem(SIDEBAR_COLLAPSE_KEY, collapsed ? "true" : "false");
}

function restoreSidebarState() {
  if (window.innerWidth <= 760) {
    document.body.classList.remove("sidebar-collapsed");
    elements.menuToggle.setAttribute("aria-expanded", "false");
    elements.menuToggle.setAttribute("aria-label", "좌측 메뉴 열기");
    elements.collapseSidebar.setAttribute("aria-expanded", "true");
    return;
  }

  const collapsed = localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === "true" && window.innerWidth > 760;
  setSidebarCollapsed(collapsed, { persist: false });
}

function handleSidebarViewportChange() {
  closeSidebar();
  restoreSidebarState();
}

function flattenSidebar(nodes, trail = []) {
  return nodes.flatMap((node) => {
    const path = [...trail, displayNodeName(node)];
    return [{ ...node, path }, ...flattenSidebar(node.children, path)];
  });
}

function findSidebarNodeByHash(hash) {
  return flattenSidebar(fuseSidebarTree).find((node) => node.href === hash);
}

function renderDocumentPage(node) {
  if (!node || !elements.docPage) return;
  if (node.title === "Callout") {
    renderCalloutDocumentPage(node);
    return;
  }
  if (node.title === "Breadcrumb") {
    renderBreadcrumbDocumentPage(node);
    return;
  }
  if (node.title === "Pagination") {
    renderPaginationDocumentPage(node);
    return;
  }
  if (node.title === "Bottom Sheet") {
    renderBottomSheetDocumentPage(node);
    return;
  }

  const statusLabel = node.status === "deprecated" ? "deprecated" : node.status === "custom" ? "보배드림 운영" : "stable";
  const path = node.path?.join(" / ") || displayNodeName(node);
  const profile = documentProfileForNode(node);
  const specializedDoc = renderSpecializedDoc(node);
  const tocSections = documentSectionsForProfile(profile, specializedDoc);
  const docSections = [
    profile.overview.length
      ? `
        <section class="component-doc-section" id="doc-overview">
          <h3>Overview</h3>
          <div class="doc-summary-grid">
            ${profile.overview
              .map(
                ([title, description]) => `
                  <article>
                    <strong>${escapeHtml(title)}</strong>
                    <p>${escapeHtml(description)}</p>
                  </article>
                `,
              )
              .join("")}
          </div>
        </section>
      `
      : "",
    profile.examples.length || specializedDoc
      ? `
        <section class="component-doc-section" id="doc-examples">
          <h3>Examples</h3>
          ${profile.examples.length ? renderDocExamples(profile.examples) : ""}
          ${specializedDoc}
        </section>
      `
      : "",
    profile.props.length
      ? `
        <section class="component-doc-section" id="doc-api">
          <h3>API</h3>
          ${renderDocPropsTable(profile.props)}
        </section>
      `
      : "",
    profile.usage.length
      ? `
        <section class="component-doc-section" id="doc-usage">
          <h3>Usage</h3>
          <div class="doc-guideline-grid">
            ${profile.usage
              .map(
                ([title, description]) => `
                  <article>
                    <strong>${escapeHtml(title)}</strong>
                    <p>${escapeHtml(description)}</p>
                  </article>
                `,
              )
              .join("")}
          </div>
        </section>
      `
      : "",
    profile.accessibility.length
      ? `
        <section class="component-doc-section" id="doc-accessibility">
          <h3>Accessibility</h3>
          <ul class="doc-checklist">
            ${profile.accessibility.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </section>
      `
      : "",
  ]
    .filter(Boolean)
    .join("");

  elements.docPage.innerHTML = `
    <div class="doc-page-layout component-doc">
      <article class="doc-main">
        <nav class="doc-breadcrumb" aria-label="문서 경로">${escapeHtml(path)}</nav>
        <div class="doc-title-row">
          <div>
            <p class="eyebrow">${node.status === "custom" ? "보배드림 운영" : "보배드림 문서"}</p>
            <h2>${escapeHtml(displayNodeName(node))}</h2>
          </div>
          <div class="doc-title-actions">
            <span class="doc-status ${escapeHtml(node.status)}">${escapeHtml(statusLabel)}</span>
            ${renderDocHeaderActions(node)}
          </div>
        </div>
        ${profile.lede ? `<p class="doc-lede">${escapeHtml(profile.lede)}</p>` : ""}
        ${profile.sublede ? `<p class="doc-sublede">${escapeHtml(profile.sublede)}</p>` : ""}
        ${docSections}
      </article>
      <aside class="doc-aside">
        <strong>목차</strong>
        ${renderDocToc(tocSections)}
      </aside>
    </div>
  `;
}

function documentSectionsForProfile(profile, specializedDoc = "") {
  const sections = [];
  if (profile.overview.length) sections.push(["Overview", "#doc-overview"]);
  if (profile.examples.length || specializedDoc) sections.push(["Examples", "#doc-examples"]);
  if (profile.props.length) sections.push(["API", "#doc-api"]);
  if (profile.usage.length) sections.push(["Usage", "#doc-usage"]);
  if (profile.accessibility.length) sections.push(["Accessibility", "#doc-accessibility"]);
  return sections;
}

function renderDocHeaderActions(node) {
  const storybookHref = storybookHrefForNode(node);
  return `
    <label class="doc-theme-control">
      <span>테마</span>
      <select aria-label="테마 선택">
        <option>Light</option>
        <option>Contrast</option>
      </select>
    </label>
    <a class="doc-storybook-link" href="${escapeAttribute(storybookHref)}">Storybook</a>
  `;
}

function storybookHrefForNode(node) {
  const component = slugifySidebarSegment(node.title || "");
  return `../storybook/index.html${component ? `?path=/docs/${component}` : ""}`;
}

function documentProfileForNode(node) {
  const parent = node.path?.at(-2) || "";
  const top = node.path?.[0] || node.title;
  const useCases = bobaedreamUseCases[node.title] || [];
  const isComponent = isInSourceSection(node, "Components") || top === "Icons";
  const isStyle = isInSourceSection(node, "Style Guide") || node.title === "Icons";
  const isA11y = isInSourceSection(node, "Accessibility");
  const isResource = isInSourceSection(node, "Resources") || node.status === "custom";
  const category = isComponent ? "component" : isStyle ? "style" : isA11y ? "accessibility" : isResource ? "resource" : "guide";

  return {
    lede: ledeForDocument(node, category),
    sublede: subledeForDocument(node, category),
    overview: overviewForDocument(node, category),
    examples: examplesForDocument(node, useCases, category),
    props: propsForDocument(node, category),
    usage: usageForDocument(node, category),
    accessibility: accessibilityForDocument(node, category),
    parent,
  };
}

function ledeForDocument(node, category) {
  return "";
}

function subledeForDocument(node, category) {
  return "";
}

function overviewForDocument(node, category) {
  const note = catalogNote(node.title, node.path?.at(-2) || "");
  return note ? [["정의", note]] : [];
}

function examplesForDocument(node, useCases, category) {
  if (node.title === "References") {
    return references.slice(0, 4).map((reference) => [reference.name, reference.apply]);
  }
  if (node.title === "Coverage Matrix" || node.title === "Bootstrap Cross-check") {
    return [
      ["목차 뼈대", "설치, 스타일, 컴포넌트, 접근성, 리소스 구조를 모두 포함합니다."],
      ["누적 항목", "자동차 서비스에 필요한 카드, 필터, 갤러리, 저장, 문의 흐름을 우선합니다."],
      ["보강 항목", "모바일 앱 컴포넌트, 파운데이션, 유틸리티성 기준은 별도 그룹으로 관리합니다."],
    ];
  }
  return useCases.map((item) => [item, "보배드림 실제 화면 기준으로 확인합니다."]);
}

function propsForDocument(node, category) {
  if (node.title === "References") {
    return [
      ["name", "string", "참고 문서 이름입니다."],
      ["focus", "string", "구조적으로 참고한 부분입니다."],
      ["apply", "string", "보배드림에 적용한 방식입니다."],
      ["url", "string", "원문 확인 링크입니다."],
    ];
  }
  if (category === "style") {
    return [
      ["token", "string", "디자인과 코드에서 공유하는 이름입니다."],
      ["value", "string", "CSS 변수, px, color, duration 등 실제 값입니다."],
      ["alias", "string", "의미 기반 이름으로 연결하는 별칭입니다."],
      ["platform", "pc | mobile | app | common", "적용 플랫폼 범위입니다."],
    ];
  }
  if (category === "accessibility") {
    return [
      ["role", "string", "필요한 ARIA role 또는 HTML 의미 요소입니다."],
      ["label", "string", "스크린리더가 읽는 이름입니다."],
      ["focusable", "boolean", "키보드 포커스 대상 여부입니다."],
      ["contrast", "AA | AAA", "텍스트와 배경의 명도 대비 기준입니다."],
    ];
  }
  return [
    ["variant", "string", "화면 맥락에 맞는 형태입니다."],
    ["size", "sm | md | lg", "컴포넌트 크기입니다."],
    ["disabled", "boolean", "사용 불가 상태입니다."],
    ["ariaLabel", "string", "아이콘 버튼이나 축약 UI의 접근성 이름입니다."],
  ];
}

function usageForDocument(node, category) {
  if (category === "resource") {
    return [
      ["사용", "운영 자료는 Resources에 모아 문서 본문과 분리합니다."],
      ["수정", "항목 변경은 등록/수정 폼에서 표준명, 상태, 메모를 함께 남깁니다."],
      ["금지", "개별 컴포넌트 본문에 외부 참고 문구를 길게 노출하지 않습니다."],
    ];
  }
  return [];
}

function accessibilityForDocument(node, category) {
  if (!isInSourceSection(node, "Accessibility")) return [];
  return [
    "키보드만으로 탐색과 주요 조작이 가능해야 합니다.",
    "스크린리더가 페이지 구조와 현재 위치를 이해할 수 있어야 합니다.",
    "텍스트, 아이콘, 상태 색상의 대비와 대체 정보를 함께 확인합니다.",
  ];
}

function renderDocExamples(examples = []) {
  return `
    <div class="doc-example-grid">
      ${examples
        .map(
          ([title, description]) => `
            <article>
              <strong>${escapeHtml(title)}</strong>
              <p>${escapeHtml(description)}</p>
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderDocPropsTable(props = []) {
  return `
    <div class="doc-table-wrap">
      <table class="doc-props-table">
        <thead>
          <tr>
            <th>속성</th>
            <th>타입</th>
            <th>설명</th>
          </tr>
        </thead>
        <tbody>
          ${props
            .map(
              ([name, type, description]) => `
                <tr>
                  <td><code>${escapeHtml(name)}</code></td>
                  <td><code>${escapeHtml(type)}</code></td>
                  <td>${escapeHtml(description)}</td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderSpecializedDoc(node) {
  if (["Icons", "UI Icons", "Frequent Icons", "Option Icons", "Vehicle Info Icons", "Brand Icons", "Community Icons"].includes(node.title)) {
    return renderIconsDoc(node);
  }
  if (node.title === "Spacing") return renderSpacingDoc(node);
  if (node.title === "References") return renderReferencesDoc();
  if (["Cars.com Cross-check", "Component IA", "Naming Gaps", "Migration Order"].includes(node.title)) return renderCarsCrossCheckDoc();
  if (node.title === "Coverage Matrix" || node.title === "Bootstrap Cross-check") return renderCoverageMatrixDoc();
  return "";
}

function renderReferencesDoc() {
  return `
    <div class="doc-table-wrap">
      <table class="doc-props-table">
        <thead>
          <tr>
            <th>문서</th>
            <th>확인한 구조</th>
            <th>보배드림 적용</th>
          </tr>
        </thead>
        <tbody>
          ${references
            .map(
              (reference) => `
                <tr>
                  <td><a href="${escapeAttribute(reference.url)}" target="_blank" rel="noopener">${escapeHtml(reference.name)}</a></td>
                  <td>${escapeHtml(reference.focus)}</td>
                  <td>${escapeHtml(reference.apply)}</td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderCarsCrossCheckDoc() {
  const summaryRows = [
    ["확인 범위", "Cars.com Fuse 좌측 목차 130개 링크 중 주요 문서 116페이지를 확인했습니다.", "보배드림 목차 233개 항목과 대조했습니다."],
    ["문서 골격", "컴포넌트 문서는 Overview, Examples, Importing, API Documentation, Usage가 반복됩니다.", "보배드림 컴포넌트 문서의 기본 순서로 사용합니다."],
    ["보강 기준", "페이지 성격에 따라 Behavior, Appearance, Accessibility를 추가합니다.", "자동차 거래 화면에서 필요한 상태와 모바일 기준만 보강합니다."],
  ];
  const structureRows = [
    ["Overview", "컴포넌트 정의와 사용 목적", "한 문단으로 짧게 씁니다."],
    ["Examples", "대표 예시와 변형", "보배드림 매물 리스트, 상세, 등록 흐름 예시를 씁니다."],
    ["Importing", "프론트엔드 적용 위치", "Nuxt/Vue 또는 공용 컴포넌트 import 예시를 둡니다."],
    ["API Documentation", "props, 상태, 이벤트", "필수 속성과 기본값을 표로 정리합니다."],
    ["Usage", "사용/비사용 기준", "실무 판단 규칙만 남깁니다."],
    ["Accessibility", "키보드, aria, 터치 영역", "필요한 컴포넌트에만 독립 섹션으로 둡니다."],
  ];
  const namingRows = [
    ["Installing Fuse", "설치 가이드", "영문 키는 원문과 맞추고 화면에는 보배드림 한국어명을 노출"],
    ["Fuse Components in React", "React 컴포넌트", "영문 키는 원문과 맞추고 화면에는 보배드림 한국어명을 노출"],
    ["Fuse in Next.js (SSR)", "Next.js SSR", "보배드림 SSR 적용 기준으로 치환"],
    ["Usage", "각 문서 하위 Usage", "전역 메뉴로 중복 노출하지 않고 문서 내부 섹션으로 유지"],
  ];

  return `
    <div class="doc-summary-grid">
      <article>
        <strong>130개</strong>
        <p>Cars.com Fuse 좌측 목차 링크 기준입니다.</p>
      </article>
      <article>
        <strong>116페이지</strong>
        <p>주요 문서 페이지의 섹션 구조를 확인했습니다.</p>
      </article>
      <article>
        <strong>233개</strong>
        <p>현재 보배드림 디자인 시스템 누적 목차입니다.</p>
      </article>
    </div>
    ${renderSimpleRowsTable("Cars.com IA 대조 요약", ["항목", "확인 내용", "보배드림 적용"], summaryRows)}
    ${renderSimpleRowsTable("컴포넌트 문서 기본 구조", ["섹션", "역할", "작성 기준"], structureRows)}
    ${renderSimpleRowsTable("명칭 차이 처리", ["Cars.com 명칭", "보배드림 명칭", "처리 기준"], namingRows)}
  `;
}

function renderSimpleRowsTable(caption, headers, rows) {
  return `
    <div class="doc-table-wrap">
      <table class="doc-props-table">
        <caption>${escapeHtml(caption)}</caption>
        <thead>
          <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) => `
                <tr>${row.map((cell, index) => `<td>${index === 0 ? `<strong>${escapeHtml(cell)}</strong>` : escapeHtml(cell)}</td>`).join("")}</tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderCoverageMatrixDoc() {
  const topLevelCounts = flattenSidebar(fuseSidebarTree)
    .filter((entry) => entry.status !== "custom")
    .reduce((summary, entry) => {
      const top = entry.path?.[0] || entry.title;
      summary.set(top, (summary.get(top) || 0) + 1);
      return summary;
    }, new Map());
  const total = [...topLevelCounts.values()].reduce((sum, count) => sum + count, 0);
  const sourceRows = [
    ["Cars.com 뼈대", "설치, 스타일 가이드, 컴포넌트, 원칙, 콘텐츠, 접근성, 리소스", "좌측 목차의 기본 구조로 사용"],
    ["Cars.com 목차별 크로스체크", "130개 목차 링크 중 주요 문서 116페이지 확인", "Overview, Examples, Importing, API Documentation, Usage 순서를 기본 구조로 사용"],
    ["Seed 보강", "파운데이션, 모바일 앱 컴포넌트, 패턴, 짧은 한국어 문서 구조", "보배드림에 필요한 누락 항목 추가"],
    ["Bootstrap 크로스체크", "Getting Started, Customize, Layout, Content, Forms, Components, Helpers, Utilities", "프론트엔드 구현자가 찾는 축을 Resources에서 검토"],
  ];
  const bootstrapRows = [
    ["Getting Started", "Web Installation & Usage", "설치, 웹 컴포넌트 기본, React, Next.js SSR, 변경 이력"],
    ["Customize", "Style Guide / Design Tokens", "색상, 글꼴, 간격, 크기, 모션, 브레이크포인트, CSS 변수 기준"],
    ["Layout", "Style Guide", "레이아웃, 간격, 반응형 분기점, 콘텐츠 폭 기준"],
    ["Content", "Style Guide / Content Strategy", "타이포그래피, 이미지, 문구, 용어, 표기 기준"],
    ["Forms", "Components / Patterns", "Input, Checkbox, Radio, Select, Textarea, Form Module, Creating forms"],
    ["Components", "Components", "Cars.com 뼈대의 컴포넌트 목록과 보배드림 차량 거래 컴포넌트"],
    ["Helpers", "Accessibility / Resources", "말줄임, 시각적 숨김, 포커스, 링크 텍스트, 터치 타깃"],
    ["Utilities", "Style Guide / Resources", "spacing, color, display, overflow, position처럼 구현 보조 기준"],
  ];
  return `
    <div class="doc-summary-grid">
      <article>
        <strong>${total}개</strong>
        <p>좌측 목차에 등록된 전체 보배드림 문서 항목입니다.</p>
      </article>
      <article>
        <strong>Cars.com</strong>
        <p>전체 IA의 뼈대와 컴포넌트 분류 기준입니다.</p>
      </article>
      <article>
        <strong>Seed + Bootstrap</strong>
        <p>한국어 문서 방식과 대표 UI 키트 구조를 보강 기준으로 봅니다.</p>
      </article>
    </div>
    <div class="doc-table-wrap">
      <table class="doc-props-table">
        <caption>참고 기준 반영 방식</caption>
        <thead>
          <tr>
            <th>기준</th>
            <th>확인 항목</th>
            <th>반영 방식</th>
          </tr>
        </thead>
        <tbody>
          ${sourceRows
            .map(
              ([source, checked, applied]) => `
                <tr>
                  <td><strong>${escapeHtml(source)}</strong></td>
                  <td>${escapeHtml(checked)}</td>
                  <td>${escapeHtml(applied)}</td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
    <div class="doc-table-wrap">
      <table class="doc-props-table">
        <caption>Bootstrap 화면 구조 크로스체크</caption>
        <thead>
          <tr>
            <th>Bootstrap 축</th>
            <th>보배드림 위치</th>
            <th>현재 누적 항목</th>
          </tr>
        </thead>
        <tbody>
          ${bootstrapRows
            .map(
              ([source, location, accumulated]) => `
                <tr>
                  <td><strong>${escapeHtml(source)}</strong></td>
                  <td>${escapeHtml(location)}</td>
                  <td>${escapeHtml(accumulated)}</td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
    <div class="doc-table-wrap">
      <table class="doc-props-table">
        <caption>현재 좌측 목차 누적 수</caption>
        <thead>
          <tr>
            <th>메뉴</th>
            <th>등록 항목 수</th>
          </tr>
        </thead>
        <tbody>
          ${[...topLevelCounts.entries()]
            .map(
              ([title, count]) => `
                <tr>
                  <td><strong>${escapeHtml(displayName(title))}</strong></td>
                  <td>${count}개</td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function documentSectionsForNode(node) {
  if (node.title === "Callout") {
    return [
      ["Preview", "#callout-preview"],
      ["Anatomy", "#callout-anatomy"],
      ["Properties", "#callout-properties"],
      ["Guidelines", "#callout-guidelines"],
      ["Specification", "#callout-specification"],
      ["Importing", "#callout-importing"],
      ["Usage", "#callout-usage"],
      ["API Documentation", "#callout-api"],
      ["Accessibility", "#callout-accessibility"],
    ];
  }
  if (node.title === "Breadcrumb") {
    return [
      ["Overview", "#breadcrumb-overview"],
      ["Examples", "#breadcrumb-examples"],
      ["Importing", "#breadcrumb-importing"],
      ["API Examples", "#breadcrumb-api-examples"],
      ["Usage", "#breadcrumb-usage"],
      ["Accessibility", "#breadcrumb-accessibility"],
    ];
  }
  if (node.title === "Pagination") {
    return [
      ["Overview", "#pagination-overview"],
      ["Chợ Tốt형", "#pagination-chotot-template"],
      ["Airbnb형", "#pagination-airbnb-template"],
      ["Reddit형", "#pagination-reddit-template"],
      ["Specification", "#pagination-specification"],
      ["API", "#pagination-api"],
      ["Usage", "#pagination-usage"],
      ["Accessibility", "#pagination-accessibility"],
    ];
  }
  if (node.title === "Bottom Sheet") {
    return [
      ["Overview", "#bottom-sheet-overview"],
      ["Airbnb Search", "#bottom-sheet-airbnb-search"],
      ["Airbnb Filter", "#bottom-sheet-airbnb-filter"],
      ["Specification", "#bottom-sheet-specification"],
      ["Assets", "#bottom-sheet-assets"],
      ["API", "#bottom-sheet-api"],
      ["Usage", "#bottom-sheet-usage"],
      ["Accessibility", "#bottom-sheet-accessibility"],
    ];
  }
  return [
    ["Overview", "#doc-overview"],
    ["Examples", "#doc-examples"],
    ["API", "#doc-api"],
    ["Usage", "#doc-usage"],
    ["Accessibility", "#doc-accessibility"],
  ];
}

function renderDocToc(sections = []) {
  return `
    <ul class="doc-toc-list">
      ${sections
        .map(
          ([label, target]) => `
            <li>
              <button class="doc-toc-link" type="button" data-scroll-target="${escapeAttribute(target)}">
                ${escapeHtml(label)}
              </button>
            </li>
          `,
        )
        .join("")}
    </ul>
  `;
}

function renderCalloutDocumentPage(node) {
  const path = node.path?.join(" / ") || displayNodeName(node);
  const statusLabel = node.status === "deprecated" ? "deprecated" : "stable";
  const examples = calloutExampleItems();
  const support = ["Figma", "React", "Next.js", "Laravel Blade", "Storybook"];
  const anatomy = [
    ["Container", "메시지 전체를 감싸는 박스입니다. tone에 맞는 배경, 테두리, 안쪽 여백을 가집니다."],
    ["Prefix Icon", "정보 성격을 빠르게 인지하게 하는 아이콘입니다. tone과 같은 의미를 가져야 합니다."],
    ["Title", "안내 성격을 한눈에 보여주는 짧은 제목입니다."],
    ["Description", "사용자가 알아야 할 핵심 정보입니다. 1-2문장 안에서 끝냅니다."],
    ["Link Text", "보조 설명이나 관련 화면으로 이동할 때만 둡니다."],
    ["Close Button", "한 번만 보여도 되는 안내에 한해 제공합니다."],
  ];
  const properties = [
    ["tone", "neutral | informative | positive | warning | critical", "메시지 목적과 위험도에 맞춰 선택합니다."],
    ["title", "string", "짧은 제목입니다. 예: 보험이력 안내"],
    ["description", "string", "핵심 설명입니다. 1-2문장을 권장합니다."],
    ["icon", "IconName", "tone에 맞는 Prefix Icon 이름입니다."],
    ["linkText", "string", "선택 링크 텍스트입니다. 예: 자세히 보기, 서류 확인"],
    ["href", "string", "링크 이동 경로입니다."],
    ["dismissible", "boolean", "사용자가 닫을 수 있는 안내인지 결정합니다."],
    ["density", "comfortable | compact", "PC와 모바일의 밀도 차이를 조절합니다."],
  ];
  const guidelines = [
    ["작성법", "제목은 성격을 짧게 쓰고, 본문은 사용자가 지금 확인해야 할 내용만 남깁니다."],
    ["사용 위치", "매물 상세, 보험이력, 성능점검, 사진 등록, 검색 결과 안내처럼 페이지 안에 머물러야 하는 정보에 사용합니다."],
    ["사용 금지", "약관 전문, 법적 책임 고지, 즉시 사라지는 저장 피드백, 사용자의 결정을 막는 확인 창에는 사용하지 않습니다."],
    ["역할 구분", "Disclaimer, Notification, Modal과 목적이 겹치지 않게 문구와 동작을 분리합니다."],
  ];
  const specs = [
    ["Container", "padding", "PC 16px 18px / MO 14px 16px"],
    ["Container", "radius", "8px"],
    ["Container", "gap", "12px"],
    ["Container", "min-height", "56px"],
    ["Prefix Icon", "size", "20px"],
    ["Title", "font", "14px / 700 / line-height 20px"],
    ["Description", "font", "14px / 400 / line-height 20px"],
    ["Link Text", "font", "14px / 700 / underline on hover"],
    ["Close Button", "target", "40px x 40px, icon 16px"],
    ["Responsive", "width", "부모 폭 100%, 긴 문장은 줄바꿈"],
  ];
  const toneSpecs = [
    ["neutral", "bg.neutral.weak", "fg.neutral", "일반 안내"],
    ["informative", "bg.informative.weak", "fg.informative", "도움말, 보험이력, 조회 안내"],
    ["positive", "bg.positive.weak", "fg.positive", "저장 완료, 등록 완료"],
    ["warning", "bg.warning.weak", "fg.warning", "구매 전 확인 필요"],
    ["critical", "bg.critical.weak", "fg.critical", "허위매물, 오류, 즉시 조치"],
  ];
  const roleRows = [
    ["Callout", "페이지 안에서 중요한 정보, 팁, 주의를 강조", "법적 고지 전체, 즉시 사라지는 피드백"],
    ["Disclaimer", "약관, 책임 고지, 법적 안내", "일반 팁이나 짧은 안내"],
    ["Notification / Toast", "저장 완료, 삭제 완료 같은 일시 피드백", "페이지에 계속 남아야 하는 안내"],
    ["Modal / Alert Dialog", "사용자 결정을 막고 확인이 필요한 상황", "단순 정보 안내"],
  ];
  const accessibility = [
    "정적인 안내는 제목과 본문을 가진 의미 있는 영역으로 제공하고, 동적으로 삽입되는 안내는 목적에 맞는 role을 사용합니다.",
    "저장 완료처럼 비차단 피드백은 `role=\"status\"`와 `aria-live=\"polite\"`를 사용합니다.",
    "즉시 인지가 필요한 critical 메시지는 `role=\"alert\"` 또는 `aria-live=\"assertive\"`를 검토합니다.",
    "닫기 버튼에는 `aria-label=\"안내 닫기\"`처럼 대상이 분명한 이름을 제공합니다.",
    "색상만으로 tone을 구분하지 않고 제목, 아이콘, 본문을 함께 제공합니다.",
    "텍스트와 배경 대비는 WCAG AA 이상을 기준으로 확인합니다.",
  ];

  elements.docPage.innerHTML = `
    <div class="doc-page-layout callout-doc">
      <article class="doc-main">
        <nav class="doc-breadcrumb" aria-label="문서 경로">${escapeHtml(path)}</nav>
        <div class="doc-title-row">
          <div>
            <p class="eyebrow">보배드림 컴포넌트</p>
            <h2>${escapeHtml(displayNodeName(node))}</h2>
          </div>
          <div class="doc-title-actions">
            <span class="doc-status ${escapeHtml(node.status)}">${escapeHtml(statusLabel)}</span>
            ${renderDocHeaderActions(node)}
          </div>
        </div>
        <p class="doc-lede">콜아웃은 사용자에게 중요한 정보, 팁, 주의 사항을 화면 안에서 시각적으로 강조해 전달하는 메시지 컴포넌트입니다.</p>
        <p class="doc-sublede">매물 상세의 보험이력 안내, 성능점검 주의, 신고 안내, 필터 결과 안내처럼 페이지 안에 머물러야 하는 정보를 전달합니다.</p>
        <div class="callout-support-row" aria-label="지원 플랫폼">
          ${support.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
        </div>

        <section class="callout-section callout-preview-section" id="callout-preview">
          <div class="callout-section-heading">
            <h3>Preview</h3>
            <p>보배드림 실제 화면에서 쓰는 콜아웃 예시입니다.</p>
          </div>
          ${renderCalloutPreviewGrid(examples)}
        </section>

        <section class="callout-section" id="callout-anatomy">
          <div class="callout-section-heading">
            <h3>Anatomy</h3>
            <p>콜아웃은 컨테이너, 아이콘, 제목, 본문, 링크, 닫기 버튼으로 구성합니다.</p>
          </div>
          <div class="callout-anatomy-grid">
            <div>
              ${renderCalloutPreviewItem({
                tone: "informative",
                icon: "i",
                title: "보험이력 안내",
                description: "보험이력 조회 결과는 등록 시점 기준으로 표시됩니다. 최신 정보는 구매 전 다시 확인하세요.",
                linkText: "보험이력 보기",
                href: "/cars/insurance",
                dismissible: true,
              })}
              <dl class="callout-name-list">
                <div><dt>국문 기능명</dt><dd>콜아웃 / 강조 안내 박스</dd></div>
                <div><dt>영어 발음</dt><dd>Callout [콜-아웃]</dd></div>
                <div><dt>어원</dt><dd>영어 call out에서 온 말로, 사용자의 주의를 특정 정보로 끌어내는 의미입니다.</dd></div>
              </dl>
            </div>
            <dl class="callout-anatomy-list">
              ${anatomy.map(([term, description]) => `<div><dt>${escapeHtml(term)}</dt><dd>${escapeHtml(description)}</dd></div>`).join("")}
            </dl>
          </div>
        </section>

        <section class="callout-section" id="callout-properties">
          <div class="callout-section-heading">
            <h3>Properties</h3>
            <p>디자인과 코드가 같은 속성명을 사용합니다.</p>
          </div>
          ${renderSimpleRowsTable("Callout properties", ["속성", "값", "설명"], properties)}
        </section>

        <section class="callout-section" id="callout-guidelines">
          <div class="callout-section-heading">
            <h3>Guidelines</h3>
            <p>필요한 안내만 짧게 남기고, 다른 피드백 컴포넌트와 역할을 섞지 않습니다.</p>
          </div>
          <div class="callout-guideline-grid">
            ${guidelines
              .map(
                ([title, description]) => `
                  <article>
                    <strong>${escapeHtml(title)}</strong>
                    <p>${escapeHtml(description)}</p>
                  </article>
                `,
              )
              .join("")}
          </div>
          ${renderSimpleRowsTable("역할 구분", ["컴포넌트", "쓰는 상황", "쓰지 말아야 할 상황"], roleRows)}
        </section>

        <section class="callout-section" id="callout-specification">
          <div class="callout-section-heading">
            <h3>Specification</h3>
            <p>PC와 모바일에서 같은 구조를 유지하고, 밀도만 조절합니다.</p>
          </div>
          ${renderSimpleRowsTable("레이아웃 기준", ["슬롯", "속성", "값"], specs)}
          ${renderSimpleRowsTable("Tone token", ["tone", "background", "foreground", "사용 상황"], toneSpecs)}
        </section>

        <section class="callout-section" id="callout-importing">
          <div class="callout-section-heading">
            <h3>Importing</h3>
            <p>프론트엔드에서 바로 찾을 수 있게 프레임워크별 import 기준을 둡니다.</p>
          </div>
          <pre class="template-code"><code>${escapeHtml(calloutImportCodeExample())}</code></pre>
        </section>

        <section class="callout-section" id="callout-usage">
          <div class="callout-section-heading">
            <h3>Usage</h3>
            <p>보배드림 화면 맥락에 맞는 tone과 동작을 선택합니다.</p>
          </div>
          <div class="callout-code-grid">
            <article>
              <strong>Next / React</strong>
              <pre class="template-code"><code>${escapeHtml(calloutReactCodeExample())}</code></pre>
            </article>
            <article>
              <strong>Laravel Blade</strong>
              <pre class="template-code"><code>${escapeHtml(calloutBladeCodeExample())}</code></pre>
            </article>
          </div>
        </section>

        <section class="callout-section" id="callout-api">
          <div class="callout-section-heading">
            <h3>API Documentation</h3>
            <p>Storybook args와 실제 컴포넌트 props를 같은 이름으로 맞춥니다.</p>
          </div>
          <pre class="template-code"><code>${escapeHtml(calloutStorybookCodeExample())}</code></pre>
        </section>

        <section class="callout-section" id="callout-accessibility">
          <div class="callout-section-heading">
            <h3>Accessibility</h3>
            <p>읽기 순서, 실시간 안내, 닫기 조작, 색상 대비를 함께 확인합니다.</p>
          </div>
          <ul class="callout-checklist">
            ${accessibility.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </section>
      </article>
      <aside class="doc-aside">
        <strong>목차</strong>
        ${renderDocToc(documentSectionsForNode(node))}
      </aside>
    </div>
  `;
}

function calloutExampleItems() {
  return [
    {
      tone: "informative",
      icon: "i",
      title: "보험이력 안내",
      description: "보험이력 조회 결과는 등록 시점 기준으로 표시됩니다. 최신 정보는 구매 전 다시 확인하세요.",
      linkText: "보험이력 보기",
      href: "/cars/insurance",
      role: "note",
      ariaLive: "off",
    },
    {
      tone: "warning",
      icon: "!",
      title: "확인 필요",
      description: "보험이력 조회 결과가 없는 차량은 판매자에게 별도 서류 확인을 요청하세요.",
      linkText: "서류 확인 기준",
      href: "/guide/documents",
      role: "note",
      ariaLive: "off",
    },
    {
      tone: "critical",
      icon: "!",
      title: "허위매물 신고",
      description: "허위매물 신고가 접수된 차량은 관리자 검수 후 노출이 제한될 수 있습니다.",
      linkText: "신고 기준 보기",
      href: "/report/fake-listing",
      role: "alert",
      ariaLive: "assertive",
    },
    {
      tone: "positive",
      icon: "✓",
      title: "저장 완료",
      description: "매물 정보가 저장되었습니다. 등록 검수 후 검색 결과에 반영됩니다.",
      role: "status",
      ariaLive: "polite",
    },
    {
      tone: "neutral",
      icon: "i",
      title: "사진 등록 안내",
      description: "사진은 최대 20장까지 등록할 수 있으며 첫 번째 사진이 대표 이미지로 사용됩니다.",
      role: "note",
      ariaLive: "off",
    },
    {
      tone: "neutral",
      icon: "i",
      title: "필터 결과 없음",
      description: "선택한 조건에 맞는 차량이 없습니다. 조건을 줄이거나 필터를 초기화해 다시 확인하세요.",
      linkText: "필터 초기화",
      href: "/cars/search",
      dismissible: true,
      role: "note",
      ariaLive: "polite",
    },
  ];
}

function renderCalloutPreviewGrid(items = []) {
  return `
    <div class="callout-preview-grid">
      ${items.map((item) => renderCalloutPreviewItem(item)).join("")}
    </div>
  `;
}

function renderCalloutPreviewItem(item = {}) {
  const tone = item.tone || "neutral";
  const role = item.role || "note";
  const ariaLive = item.ariaLive || "off";
  return `
    <article class="bd-callout bd-callout-${escapeAttribute(tone)}" role="${escapeAttribute(role)}" aria-live="${escapeAttribute(ariaLive)}">
      <span class="bd-callout-icon" aria-hidden="true">${escapeHtml(item.icon || "i")}</span>
      <div class="bd-callout-body">
        <strong>${escapeHtml(item.title || "")}</strong>
        <p>${escapeHtml(item.description || "")}</p>
        ${
          item.linkText
            ? `<a class="bd-callout-link" href="${escapeAttribute(item.href || "#")}">${escapeHtml(item.linkText)}</a>`
            : ""
        }
      </div>
      ${
        item.dismissible
          ? `<button class="bd-callout-close" type="button" aria-label="${escapeAttribute(`${item.title || "안내"} 닫기`)}">×</button>`
          : ""
      }
    </article>
  `;
}

function calloutImportCodeExample() {
  return `import { BobaCallout } from '@/components/feedback/BobaCallout';
import BobaCallout from '@/components/feedback/BobaCallout.vue';

@include('components.feedback.callout')`;
}

function calloutReactCodeExample() {
  return `<BobaCallout
  tone="informative"
  title="보험이력 안내"
  description="보험이력 조회 결과는 등록 시점 기준으로 표시됩니다. 최신 정보는 구매 전 다시 확인하세요."
  linkText="보험이력 보기"
  href="/cars/123/insurance"
/>`;
}

function calloutBladeCodeExample() {
  return `<x-boba-callout
  tone="warning"
  title="확인 필요"
  link-text="서류 확인 기준"
  href="/guide/documents"
>
  보험이력 조회 결과가 없는 차량은 판매자에게 별도 서류 확인을 요청하세요.
</x-boba-callout>`;
}

function calloutStorybookCodeExample() {
  return `export const InsuranceHistory = {
  args: {
    tone: 'informative',
    title: '보험이력 안내',
    description: '보험이력 조회 결과는 등록 시점 기준으로 표시됩니다. 최신 정보는 구매 전 다시 확인하세요.',
    linkText: '보험이력 보기',
    href: '/cars/123/insurance',
    dismissible: false,
    density: 'comfortable',
  },
};`;
}

function renderPaginationDocumentPage(node) {
  const path = node.path?.join(" / ") || displayNodeName(node);
  const statusLabel = node.status === "deprecated" ? "deprecated" : "stable";
  const overview = [
    ["정의", "Pagination은 여러 페이지로 나뉜 매물 목록에서 사용자가 원하는 페이지로 이동하게 하는 탐색 컴포넌트입니다."],
    ["목적", "목록 끝에서 현재 위치를 확인하고 이전, 다음, 특정 페이지로 이동할 수 있게 합니다."],
    ["사용 위치", "중고차 검색 결과, 딜러 보유 매물, 커뮤니티 목록처럼 결과 수가 많은 화면 하단에 배치합니다."],
  ];
  const anatomy = [
    ["이전 버튼", "첫 페이지에서는 disabled 상태로 보여줍니다."],
    ["페이지 번호", "현재 페이지 주변 번호를 원형 버튼으로 노출합니다."],
    ["현재 페이지", "`aria-current=\"page\"`를 적용하고 참고 템플릿의 현재 페이지 색상으로 강조합니다."],
    ["다음 버튼", "마지막 페이지가 아니면 다음 페이지 링크 또는 이벤트를 제공합니다."],
    ["하단 맥락", "매물 리스트 뒤, 검색 설명과 추천 키워드 영역보다 위에 배치합니다."],
  ];
  const chototSpecs = [
    ["번호 버튼", "40px × 40px", "원형, `border-radius: 100%`"],
    ["버튼 간격", "8px", "각 버튼 x 좌표가 48px 간격으로 반복"],
    ["현재 페이지", "background/border #ffd400", "텍스트 #222222, 16px, weight 400"],
    ["일반 페이지", "background #ffffff, border #e8e8e8 2px", "텍스트 #222222, 16px, weight 400"],
    ["이전/다음", "40px 터치 영역, 아이콘 36px", "첫 페이지 이전은 #dddddd disabled"],
    ["최대 페이지", "4", "샘플은 1에서 4까지 이동 후 다음 버튼 disabled"],
  ];
  const airbnbSpecs = [
    ["번호 버튼", "32px × 32px", "원형, `border-radius: 50%`"],
    ["버튼 간격", "16px", "각 번호 x 좌표가 48px 간격으로 반복"],
    ["현재 페이지", "background #222222", "텍스트 #ffffff, 14px, weight 500"],
    ["일반 페이지", "background transparent, border none", "텍스트 #222222, 14px, weight 500"],
    ["이전/다음", "32px 높이", "첫 페이지 이전은 #dddddd disabled"],
    ["최대 페이지", "15", "1, 2, 3, 4, …, 15 구조로 끝 페이지를 노출"],
  ];
  const redditSpecs = [
    ["커스텀 요소", "`devvit-pagination-bar`", "`currentpage=\"5\"`, `totalpages=\"65\"`"],
    ["노출 구조", "‹ 1 … 5 6 7 … 65 ›", "현재 페이지, 다음 2개, 처음/마지막 페이지를 노출"],
    ["버튼 높이", "32px", "이전/다음 버튼 32px × 32px"],
    ["현재 페이지", "background #d93900", "텍스트 #ffffff, 12px, weight 600"],
    ["일반 페이지", "background #e5ebee", "텍스트 #000000, 12px, weight 600"],
    ["모서리", "border-radius 9999px", "pill 형태, border transparent 1px"],
    ["최대 페이지", "65", "마지막 페이지에서 다음 버튼 disabled"],
  ];
  const props = [
    ["currentPage", "number", "현재 페이지 번호입니다."],
    ["totalPages", "number", "전체 페이지 수입니다."],
    ["pageSize", "number", "한 페이지에 표시할 매물 수입니다."],
    ["totalItems", "number", "전체 검색 결과 수입니다."],
    ["siblingCount", "number", "현재 페이지 양옆에 노출할 번호 개수입니다. 기본값은 1입니다."],
    ["baseUrl", "string", "SEO 링크가 필요한 목록의 기본 URL입니다."],
    ["onPageChange", "(page: number) => void", "클라이언트 라우팅 또는 데이터 재조회 이벤트입니다."],
    ["ariaLabel", "string", "페이지네이션 nav의 접근성 이름입니다."],
    ["variant", "list | compact | seo", "목록 하단, 모바일 간소형, SEO 링크형 표시를 선택합니다."],
  ];
  const usage = [
    ["매물 리스트", "리스트의 마지막 카드 아래 중앙에 배치하고, 광고나 추천 섹션보다 먼저 노출합니다."],
    ["번호 노출", "전체 페이지가 적으면 모든 번호를 보여주고, 많으면 현재 페이지 주변과 처음/끝만 남깁니다."],
    ["모바일", "공간이 좁으면 `이전 1 / 4 다음` 형태의 compact 표시를 우선합니다."],
    ["SEO", "검색 결과 페이지는 실제 href를 제공해 새로고침과 검색엔진 접근을 보장합니다."],
    ["로딩", "페이지 이동 중에는 클릭을 잠시 막고 현재 페이지 표시를 유지합니다."],
  ];
  const accessibility = [
    '`nav aria-label="검색 결과 페이지"` 구조를 사용합니다.',
    '현재 페이지 번호에는 `aria-current="page"`를 적용합니다.',
    "첫 페이지의 이전 버튼과 마지막 페이지의 다음 버튼은 disabled 상태를 명확히 제공합니다.",
    "이전/다음 아이콘 버튼에는 `aria-label`을 제공합니다.",
    "모바일 터치 영역은 44px 이상을 권장합니다.",
    "페이지 이동 후 목록 제목 또는 결과 영역으로 포커스 이동을 검토합니다.",
  ];

  elements.docPage.innerHTML = `
    <div class="doc-page-layout pagination-doc">
      <article class="doc-main">
        <nav class="doc-breadcrumb" aria-label="문서 경로">${escapeHtml(path)}</nav>
        <div class="doc-title-row">
          <div>
            <p class="eyebrow">보배드림 컴포넌트</p>
            <h2>${escapeHtml(displayNodeName(node))}</h2>
          </div>
          <div class="doc-title-actions">
            <span class="doc-status ${escapeHtml(node.status)}">${escapeHtml(statusLabel)}</span>
            ${renderDocHeaderActions(node)}
          </div>
        </div>
        <p class="doc-lede">Pagination은 검색 결과와 목록 화면에서 현재 페이지 위치를 보여주고 다음 결과로 이동하게 하는 컴포넌트입니다.</p>
        <p class="doc-sublede">중고차 매물 리스트, 딜러 매물 목록, 커뮤니티 게시판처럼 결과가 여러 페이지로 나뉘는 화면에 사용합니다.</p>
        ${renderPaginationJumpLinks()}
        <div class="pagination-top-preview" aria-label="페이지네이션 미리보기">
          <div>
            <span>Chợ Tốt형 · 40px · #ffd400 · 최댓값 4</span>
            ${renderBobaPaginationTemplate({ variant: "chotot", totalPages: 4 })}
          </div>
          <div>
            <span>Airbnb형 · 32px · #222222</span>
            ${renderAirbnbPaginationTemplate({ totalPages: 15 })}
          </div>
          <div>
            <span>Reddit형 · 32px · #d93900 · 최댓값 65</span>
            ${renderRedditPaginationTemplate({ currentPage: 5, totalPages: 65 })}
          </div>
        </div>

        <section class="pagination-section" id="pagination-overview">
          <h3>Overview</h3>
          <div class="pagination-info-grid">
            ${overview
              .map(
                ([title, description]) => `
                  <article>
                    <strong>${escapeHtml(title)}</strong>
                    <p>${escapeHtml(description)}</p>
                  </article>
                `,
              )
              .join("")}
          </div>
        </section>

        <section class="pagination-section" id="pagination-template">
          <div class="pagination-section-heading">
            <h3>Template</h3>
            <p>매물 리스트와 검색 결과 하단에서 바로 쓰는 동작형 페이지네이션 템플릿입니다.</p>
          </div>
          <div class="pagination-template-block" id="pagination-chotot-template">
            <div class="pagination-template-header">
              <div>
                <strong>Chợ Tốt형 목록 페이지네이션</strong>
                <p>차량 목록 하단에서 4페이지까지 번호를 그대로 노출하는 구조입니다.</p>
              </div>
              <span>40px · #ffd400 · 최댓값 4</span>
            </div>
            ${renderPaginationListTemplate()}
          </div>
          <div class="pagination-template-block" id="pagination-airbnb-template">
            <div class="pagination-template-header">
              <div>
                <strong>Airbnb형 검색 결과 페이지네이션</strong>
                <p>카드형 검색 결과에서 현재 페이지 주변 번호와 마지막 페이지를 함께 보여주는 구조입니다.</p>
              </div>
              <span>32px · #222222 · max 15</span>
            </div>
            ${renderAirbnbSearchTemplate()}
          </div>
          <div class="pagination-template-block" id="pagination-reddit-template">
            <div class="pagination-template-header">
              <div>
                <strong>Reddit 개발자 앱 페이지네이션</strong>
                <p>개발자 앱 목록처럼 현재 페이지, 다음 번호, 처음/마지막 페이지를 함께 보여주는 구조입니다.</p>
              </div>
              <span>32px · #d93900 · 최댓값 65</span>
            </div>
            ${renderRedditDeveloperTemplate()}
          </div>
          <div class="pagination-template-block" id="pagination-specification">
            <div class="pagination-template-header">
              <div>
                <strong>Specification</strong>
                <p>원본 기준을 비교해 재사용할 수 있도록 수치와 색상 값을 분리해 기록합니다.</p>
              </div>
            </div>
            ${renderSimpleRowsTable("Chợ Tốt 페이지네이션 실측값", ["항목", "값", "적용 기준"], chototSpecs)}
            ${renderSimpleRowsTable("Airbnb 페이지네이션 실측값", ["항목", "값", "적용 기준"], airbnbSpecs)}
            ${renderSimpleRowsTable("Reddit 페이지네이션 실측값", ["항목", "값", "적용 기준"], redditSpecs)}
          </div>
          <div class="pagination-anatomy-grid">
            ${anatomy
              .map(
                ([title, description]) => `
                  <article>
                    <strong>${escapeHtml(title)}</strong>
                    <p>${escapeHtml(description)}</p>
                  </article>
                `,
              )
              .join("")}
          </div>
          <div class="pagination-mobile-template">
            <strong>Mobile compact</strong>
            ${renderCompactPaginationTemplate()}
          </div>
        </section>

        <section class="pagination-section" id="pagination-api">
          <h3>API</h3>
          ${renderDocPropsTable(props)}
          <div class="pagination-code-grid">
            <article>
              <strong>Chợ Tốt형</strong>
              <pre class="template-code"><code>${escapeHtml(paginationVueCodeExample())}</code></pre>
            </article>
            <article>
              <strong>Airbnb형</strong>
              <pre class="template-code"><code>${escapeHtml(paginationAirbnbVueCodeExample())}</code></pre>
            </article>
            <article>
              <strong>Reddit형</strong>
              <pre class="template-code"><code>${escapeHtml(paginationRedditVueCodeExample())}</code></pre>
            </article>
          </div>
        </section>

        <section class="pagination-section" id="pagination-usage">
          <h3>Usage</h3>
          <div class="pagination-guideline-grid">
            ${usage
              .map(
                ([title, description]) => `
                  <article>
                    <strong>${escapeHtml(title)}</strong>
                    <p>${escapeHtml(description)}</p>
                  </article>
                `,
              )
              .join("")}
          </div>
        </section>

        <section class="pagination-section" id="pagination-accessibility">
          <h3>Accessibility</h3>
          <ul class="pagination-checklist">
            ${accessibility.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </section>

        <section class="pagination-section pagination-reference-note">
          <h3>Reference</h3>
          <p>Chợ Tốt 차량 목록, Airbnb 숙소 검색 결과, Reddit 개발자 앱 목록의 페이지 이동 구조를 확인하고 재사용 템플릿으로 정리했습니다.</p>
          <a href="https://xe.chotot.com/mua-ban-oto-quan-ba-dinh-ha-noi" target="_blank" rel="noopener">참고 페이지 확인</a>
          <a href="https://www.airbnb.co.kr/s/%EB%A1%9C%EC%8A%A4%EC%95%A4%EC%A0%A4%EB%A0%88%EC%8A%A4/homes" target="_blank" rel="noopener">Airbnb 검색 결과 확인</a>
          <a href="https://developers.reddit.com/apps?page=5" target="_blank" rel="noopener">Reddit 개발자 앱 확인</a>
        </section>
      </article>
      <aside class="doc-aside">
        <strong>목차</strong>
        ${renderDocToc(documentSectionsForNode(node))}
      </aside>
    </div>
  `;
}

function renderPaginationJumpLinks() {
  const links = [
    ["Chợ Tốt형", "#pagination-chotot-template", "40px · 최댓값 4"],
    ["Airbnb형", "#pagination-airbnb-template", "32px · 최댓값 15"],
    ["Reddit형", "#pagination-reddit-template", "32px · 최댓값 65"],
    ["실측값", "#pagination-specification", "수치 · 컬러"],
    ["API", "#pagination-api", "재사용 코드"],
  ];

  return `
    <nav class="pagination-jump-links" aria-label="페이지네이션 템플릿 바로가기">
      ${links
        .map(
          ([label, target, meta]) => `
            <a href="${escapeAttribute(target)}" data-scroll-target="${escapeAttribute(target)}">
              <strong>${escapeHtml(label)}</strong>
              <span>${escapeHtml(meta)}</span>
            </a>
          `,
        )
        .join("")}
    </nav>
  `;
}

function renderPaginationListTemplate() {
  const listings = [
    ["제네시스 GV80 3.5 터보 AWD", "2024 · 18,200km · 가솔린 · 자동", "7,280만원"],
    ["현대 그랜저 하이브리드 캘리그래피", "2023 · 24,600km · 하이브리드 · 자동", "4,120만원"],
    ["기아 쏘렌토 MQ4 디젤 2.2", "2022 · 51,300km · 디젤 · 자동", "3,380만원"],
  ];

  return `
    <div class="pagination-list-template">
      <div class="pagination-list-stack" aria-label="매물 리스트 예시">
        ${listings
          .map(
            ([title, meta, price]) => `
              <article>
                <span aria-hidden="true"></span>
                <div>
                  <strong>${escapeHtml(title)}</strong>
                  <p>${escapeHtml(meta)}</p>
                </div>
                <em>${escapeHtml(price)}</em>
              </article>
            `,
          )
          .join("")}
      </div>
      ${renderBobaPaginationTemplate({ variant: "chotot", totalPages: 4 })}
      <div class="pagination-seo-block">
        <strong>검색 결과 안내</strong>
        <p>검색 조건에 맞는 중고차 매물을 최신순으로 보여주고, 다음 페이지에서 더 많은 매물을 확인합니다.</p>
      </div>
    </div>
  `;
}

function renderAirbnbSearchTemplate() {
  const listings = [
    ["로스앤젤레스의 집", "월 단위 숙박 · 게스트 선호", "₩2,646,426"],
    ["샌타모니카의 아파트", "바다 근처 · 주방 · 와이파이", "₩3,734,481"],
    ["웨스트할리우드의 방", "후기 4.9 · 장기 숙박 가능", "₩2,358,573"],
  ];

  return `
    <div class="pagination-airbnb-template">
      <div class="pagination-airbnb-list" aria-label="Airbnb 숙소 검색 결과 예시">
        ${listings
          .map(
            ([title, meta, price]) => `
              <article>
                <span aria-hidden="true"></span>
                <div>
                  <strong>${escapeHtml(title)}</strong>
                  <p>${escapeHtml(meta)}</p>
                  <em>${escapeHtml(price)}</em>
                </div>
              </article>
            `,
          )
          .join("")}
      </div>
      ${renderAirbnbPaginationTemplate({ totalPages: 15 })}
    </div>
  `;
}

function renderRedditDeveloperTemplate() {
  const listings = [
    ["BS", "Basketball Scoreboard App", "예측, 실시간 업데이트, 알림을 제공하는 스포츠 앱", "154 communities"],
    ["MA", "Mod App: Day-Of-Week Rules for Post Flairs.", "요일 조건에 따라 포스트 플레어와 고정 댓글을 관리", "153 communities"],
    ["CL", "Community Links", "FAQ, 위키, 규칙, 메가스레드 링크를 모아 노출", "151 communities"],
  ];

  return `
    <div class="pagination-reddit-template">
      <div class="pagination-reddit-list" aria-label="Reddit 개발자 앱 목록 예시">
        ${listings
          .map(
            ([initial, title, description, meta]) => `
              <article>
                <span aria-hidden="true">${escapeHtml(initial)}</span>
                <div>
                  <strong>${escapeHtml(title)}</strong>
                  <p>${escapeHtml(description)}</p>
                  <em>In ${escapeHtml(meta)}</em>
                </div>
              </article>
            `,
          )
          .join("")}
      </div>
      ${renderRedditPaginationTemplate({ currentPage: 5, totalPages: 65 })}
    </div>
  `;
}

function renderBobaPaginationTemplate(options = {}) {
  const currentPage = clampPage(options.currentPage || 1, options.totalPages || 4);
  const totalPages = Math.max(1, Number(options.totalPages || 4));
  const variant = options.variant || "chotot";
  return `
    <nav class="bd-pagination-template is-${escapeAttribute(variant)}" aria-label="검색 결과 페이지" data-pagination-template data-pagination-variant="${escapeAttribute(variant)}" data-total-pages="${totalPages}" data-current-page="${currentPage}">
      ${renderPaginationControls({ currentPage, totalPages, variant, baseUrl: "/cars/search" })}
    </nav>
    ${renderPaginationMaxSummary({ currentPage, totalPages, variant })}
  `;
}

function renderAirbnbPaginationTemplate(options = {}) {
  const currentPage = clampPage(options.currentPage || 1, options.totalPages || 15);
  const totalPages = Math.max(1, Number(options.totalPages || 15));
  return `
    <nav class="bd-pagination-template is-airbnb" aria-label="숙소 검색 결과 페이지" data-pagination-template data-pagination-variant="airbnb" data-total-pages="${totalPages}" data-current-page="${currentPage}">
      ${renderPaginationControls({ currentPage, totalPages, variant: "airbnb", baseUrl: "/s/los-angeles/homes" })}
    </nav>
    ${renderPaginationMaxSummary({ currentPage, totalPages, variant: "airbnb" })}
  `;
}

function renderRedditPaginationTemplate(options = {}) {
  const currentPage = clampPage(options.currentPage || 5, options.totalPages || 65);
  const totalPages = Math.max(1, Number(options.totalPages || 65));
  return `
    <nav class="bd-pagination-template is-reddit" aria-label="Reddit 앱 목록 페이지" data-pagination-template data-pagination-variant="reddit" data-total-pages="${totalPages}" data-current-page="${currentPage}">
      ${renderPaginationControls({ currentPage, totalPages, variant: "reddit", baseUrl: "https://developers.reddit.com/apps" })}
    </nav>
    ${renderPaginationMaxSummary({ currentPage, totalPages, variant: "reddit" })}
  `;
}

function renderPaginationControls({ currentPage, totalPages, variant, baseUrl }) {
  const pages = paginationPageModel(currentPage, totalPages, variant);
  const previousDisabled = currentPage <= 1;
  const nextDisabled = currentPage >= totalPages;

  return `
    <button class="bd-pagination-nav" type="button" aria-label="이전 페이지" data-pagination-action="previous" ${previousDisabled ? "disabled" : ""}>
      <span aria-hidden="true">&lsaquo;</span>
    </button>
    ${pages
      .map((page) => {
        if (page === "ellipsis") return `<span class="bd-pagination-ellipsis" aria-hidden="true">…</span>`;
        const isCurrent = page === currentPage;
        const serviceHref = `${baseUrl}?page=${page}`;
        return `
          <a class="bd-pagination-page" href="#components-pagination" data-demo-href="${escapeAttribute(serviceHref)}" data-pagination-page="${page}" aria-label="${page} 페이지로 이동" ${isCurrent ? 'aria-current="page"' : ""}>
            ${page}
          </a>
        `;
      })
      .join("")}
    <button class="bd-pagination-nav" type="button" aria-label="다음 페이지" data-pagination-action="next" ${nextDisabled ? "disabled" : ""}>
      <span aria-hidden="true">&rsaquo;</span>
    </button>
  `;
}

function paginationPageModel(currentPage, totalPages, variant) {
  if (variant === "reddit" && totalPages > 5) {
    if (currentPage <= 3) return [1, 2, 3, "ellipsis", totalPages];
    if (currentPage >= totalPages - 2) return [1, "ellipsis", totalPages - 2, totalPages - 1, totalPages];
    return [1, "ellipsis", currentPage, currentPage + 1, currentPage + 2, "ellipsis", totalPages];
  }
  if (variant === "airbnb" && totalPages > 5) {
    if (currentPage <= 3) return [1, 2, 3, 4, "ellipsis", totalPages];
    if (currentPage >= totalPages - 2) return [1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages];
  }
  return Array.from({ length: totalPages }, (_, index) => index + 1);
}

function clampPage(page, totalPages) {
  const pageNumber = Number(page) || 1;
  const maxPage = Math.max(1, Number(totalPages) || 1);
  return Math.min(Math.max(1, pageNumber), maxPage);
}

function renderCompactPaginationTemplate(options = {}) {
  const currentPage = clampPage(options.currentPage || 1, options.totalPages || 4);
  const totalPages = Math.max(1, Number(options.totalPages || 4));
  return `
    <nav class="bd-pagination-compact" aria-label="검색 결과 페이지" data-pagination-compact data-pagination-variant="chotot" data-total-pages="${totalPages}" data-current-page="${currentPage}">
      ${renderCompactPaginationControls(currentPage, totalPages)}
    </nav>
  `;
}

function renderCompactPaginationControls(currentPage, totalPages) {
  return `
    <button type="button" aria-label="이전 페이지" data-pagination-action="previous" ${currentPage <= 1 ? "disabled" : ""}>&lsaquo;</button>
    <span><strong>${currentPage}</strong> / ${totalPages}</span>
    <button type="button" aria-label="다음 페이지" data-pagination-action="next" ${currentPage >= totalPages ? "disabled" : ""}>&rsaquo;</button>
  `;
}

function renderPaginationMaxSummary({ currentPage, totalPages, variant }) {
  return `
    <div class="bd-pagination-max-summary" data-pagination-max-summary data-pagination-variant="${escapeAttribute(variant)}" data-total-pages="${totalPages}">
      <span>현재 <strong data-pagination-current-label>${currentPage}</strong></span>
      <span>최댓값 <strong data-pagination-total-label>${totalPages}</strong></span>
      <span>마지막 페이지에서 다음 버튼 disabled</span>
    </div>
  `;
}

function paginationVueCodeExample() {
  return `<BobaPagination
  :current-page="1"
  :total-pages="4"
  :page-size="20"
  :total-items="63"
  base-url="/cars/search"
  aria-label="검색 결과 페이지"
  variant="list"
  @page-change="fetchListings"
/>`;
}

function paginationAirbnbVueCodeExample() {
  return `<BobaPagination
  :current-page="1"
  :total-pages="15"
  :page-size="20"
  :total-items="300"
  :sibling-count="1"
  base-url="/cars/search"
  aria-label="검색 결과 페이지"
  variant="airbnb"
  @page-change="fetchListings"
/>`;
}

function paginationRedditVueCodeExample() {
  return `<BobaPagination
  :current-page="5"
  :total-pages="65"
  :page-size="20"
  :total-items="1300"
  base-url="/community/apps"
  aria-label="앱 목록 페이지"
  variant="reddit"
  @page-change="fetchApps"
/>`;
}

function handlePaginationTemplateClick(event) {
  const control = event.target.closest("[data-pagination-action], [data-pagination-page]");
  if (!control) return;

  const root = control.closest("[data-pagination-template], [data-pagination-compact]");
  if (!root) return;

  event.preventDefault();

  const variant = root.dataset.paginationVariant || "chotot";
  const totalPages = Math.max(1, Number(root.dataset.totalPages || 1));
  const currentPage = clampPage(root.dataset.currentPage || 1, totalPages);
  const action = control.dataset.paginationAction;
  const requestedPage = control.dataset.paginationPage;
  const nextPage = action === "previous"
    ? currentPage - 1
    : action === "next"
      ? currentPage + 1
      : Number(requestedPage || currentPage);
  updatePaginationTemplates(variant, clampPage(nextPage, totalPages));
}

function updatePaginationTemplates(variant, currentPage) {
  document.querySelectorAll("[data-pagination-template]").forEach((root) => {
    if (root.dataset.paginationVariant !== variant) return;
    const totalPages = Math.max(1, Number(root.dataset.totalPages || 1));
    const page = clampPage(currentPage, totalPages);
    const templateVariant = root.dataset.paginationVariant || variant;
    const baseUrl = templateVariant === "airbnb"
      ? "/s/los-angeles/homes"
      : templateVariant === "reddit"
        ? "https://developers.reddit.com/apps"
        : "/cars/search";
    root.dataset.currentPage = String(page);
    root.innerHTML = renderPaginationControls({ currentPage: page, totalPages, variant: templateVariant, baseUrl });
  });

  document.querySelectorAll("[data-pagination-compact]").forEach((root) => {
    if (root.dataset.paginationVariant !== variant) return;
    const totalPages = Math.max(1, Number(root.dataset.totalPages || 1));
    const page = clampPage(currentPage, totalPages);
    root.dataset.currentPage = String(page);
    root.innerHTML = renderCompactPaginationControls(page, totalPages);
  });

  document.querySelectorAll("[data-pagination-max-summary]").forEach((summary) => {
    if (summary.dataset.paginationVariant !== variant) return;
    const totalPages = Math.max(1, Number(summary.dataset.totalPages || 1));
    const page = clampPage(currentPage, totalPages);
    const currentLabel = summary.querySelector("[data-pagination-current-label]");
    const totalLabel = summary.querySelector("[data-pagination-total-label]");
    if (currentLabel) currentLabel.textContent = String(page);
    if (totalLabel) totalLabel.textContent = String(totalPages);
  });
}

function renderBottomSheetDocumentPage(node) {
  const path = node.path?.join(" / ") || displayNodeName(node);
  const statusLabel = node.status === "deprecated" ? "deprecated" : "stable";
  const overview = [
    ["정의", "Bottom Sheet는 모바일 화면 하단에서 올라와 검색, 필터, 선택 작업을 한 흐름 안에서 처리하는 오버레이 컴포넌트입니다."],
    ["목적", "현재 목록을 떠나지 않고 조건을 조정한 뒤 결과로 즉시 돌아가게 합니다."],
    ["사용 위치", "차량 검색 필터, 매물 등록 옵션 선택, 가격/연식/주행거리 범위 선택, 정렬 조건 변경에 사용합니다."],
  ];
  const airbnbSearchSpecs = [
    ["측정 화면", "iPhone 13 · CSS viewport 390×664", "Airbnb 체험 검색 상단 pill 클릭"],
    ["검색 dialog", "390×664px", "전체 화면 fixed dialog, background #ffffff"],
    ["상단 검색 pill", "238×58px", "border #dddddd 1px, radius 40px, shadow 0 6px 20px rgba(0,0,0,.10)"],
    ["메인 카드", "366×248px", "x 12px, y 92px, radius 24px, padding 24px"],
    ["검색 입력", "318×54px", "radius 8px, padding 0 20px, outline shadow #8c8c8c 1px"],
    ["접힌 카드", "366×56px", "radius 16px, padding 19px 24px, shadow 0 1px 2px rgba(0,0,0,.05)"],
    ["하단 액션", "48px height", "검색 CTA radius 12px, padding 14px 24px"],
  ];
  const airbnbFilterSpecs = [
    ["측정 화면", "iPhone 13 · CSS viewport 390×664", "Airbnb 체험 검색 필터 버튼 클릭"],
    ["overlay", "390×664px", "position fixed, z-index 2000, background #222222"],
    ["dialog", "390×652px", "x 0, y 12px, radius 32px 32px 0 0, shadow 0 8px 28px rgba(0,0,0,.28)"],
    ["header", "64px 기준", "title 16px/600/20px, close icon 16×16px"],
    ["filter chip", "42px height", "border #dddddd 1px, radius 28px, padding 11px 16px, text #222222"],
    ["footer", "390×65px", "padding 12px 24px, shadow 0 -2px 16px rgba(0,0,0,.16)"],
    ["result CTA", "186×40px", "background #222222, text #ffffff, radius 12px, padding 11px 20px"],
    ["reset action", "83×40px", "disabled text #c1c1c1, padding 11px 12px"],
  ];
  const bobaSpecs = [
    ["container", "max-width 390px, height 652px", "모바일웹은 viewport 하단 고정, 앱은 safe area 포함"],
    ["snap point", "peek 220px / half 420px / full 652px", "피크, 반확장, 전체 확장 상태를 지원"],
    ["top radius", "32px 32px 0 0", "Airbnb 필터 dialog 기준"],
    ["content padding", "24px", "섹션 내부 기본 여백"],
    ["chip", "42px, radius 28px", "제조사, 연식, 지역, 옵션 조건 선택"],
    ["slider", "track 280×4px, thumb 28×28px", "가격, 연식, 주행거리 범위 입력"],
    ["footer", "65px min-height", "초기화와 결과 보기 CTA를 고정"],
    ["primary CTA", "#d71920", "보배드림 브랜드 액션 컬러로 치환"],
  ];
  const props = [
    ["open", "boolean", "시트 표시 여부입니다."],
    ["title", "string", "상단 제목입니다. 예: 필터, 검색 조건"],
    ["ariaLabel", "string", "dialog 접근성 이름입니다."],
    ["snapPoints", "Array<'peek' | 'half' | 'full'>", "지원할 높이 상태입니다."],
    ["defaultSnapPoint", "'peek' | 'half' | 'full'", "열릴 때 기본 높이입니다."],
    ["sections", "BottomSheetSection[]", "검색, 날짜, 가격, 옵션 같은 본문 섹션입니다."],
    ["footerAction", "{ label: string; disabled?: boolean }", "결과 보기 또는 적용 버튼입니다."],
    ["dismissible", "boolean", "닫기 버튼과 overlay 닫기를 허용할지 결정합니다."],
  ];
  const usage = [
    ["검색 유지", "목록 화면 위에서 조건을 바꾸고 결과로 돌아오게 합니다."],
    ["많은 선택지", "옵션, 차종, 지역처럼 항목이 많으면 chip grid와 검색 입력을 함께 둡니다."],
    ["범위 입력", "가격, 연식, 주행거리는 slider와 직접 입력을 같이 제공합니다."],
    ["결과 수 피드백", "CTA에는 현재 조건 기준 결과 수를 보여줍니다."],
    ["PC 전환", "PC에서는 같은 내용을 side panel 또는 modal로 전환합니다."],
  ];
  const accessibility = [
    '`role="dialog"`와 `aria-modal="true"`를 적용합니다.',
    "제목은 `aria-labelledby`로 연결하고, 닫기 버튼에는 명확한 `aria-label`을 둡니다.",
    "시트가 열리면 포커스를 첫 조작 가능한 요소로 이동하고 닫힐 때 호출 버튼으로 돌려보냅니다.",
    "터치 타깃은 44px 이상을 권장합니다. 원본 close 아이콘은 16px지만 보배드림은 40px 버튼 안에 둡니다.",
    "ESC, overlay, 닫기 버튼의 동작을 동일하게 처리합니다.",
    "가격 slider는 `aria-valuemin`, `aria-valuemax`, `aria-valuenow`를 제공합니다.",
  ];

  elements.docPage.innerHTML = `
    <div class="doc-page-layout bottom-sheet-doc">
      <article class="doc-main">
        <nav class="doc-breadcrumb" aria-label="문서 경로">${escapeHtml(path)}</nav>
        <div class="doc-title-row">
          <div>
            <p class="eyebrow">보배드림 모바일 컴포넌트</p>
            <h2>${escapeHtml(displayNodeName(node))}</h2>
          </div>
          <div class="doc-title-actions">
            <span class="doc-status ${escapeHtml(node.status)}">${escapeHtml(statusLabel)}</span>
            ${renderDocHeaderActions(node)}
          </div>
        </div>
        <p class="doc-lede">Bottom Sheet는 모바일에서 검색 조건, 필터, 범위 입력을 화면 하단 오버레이로 처리하는 컴포넌트입니다.</p>
        <p class="doc-sublede">Airbnb 체험 검색의 검색 시트와 필터 시트를 실측해 보배드림 차량 검색·매물 등록 흐름에 맞게 재사용 템플릿으로 정리했습니다.</p>

        <section class="bottom-sheet-section" id="bottom-sheet-overview">
          <h3>Overview</h3>
          <div class="bottom-sheet-info-grid">
            ${overview
              .map(
                ([title, description]) => `
                  <article>
                    <strong>${escapeHtml(title)}</strong>
                    <p>${escapeHtml(description)}</p>
                  </article>
                `,
              )
              .join("")}
          </div>
        </section>

        <section class="bottom-sheet-section bottom-sheet-preview-section" id="bottom-sheet-airbnb-search">
          <div class="bottom-sheet-section-heading">
            <h3>Airbnb Search Sheet</h3>
            <p>상단 검색 pill을 누르면 위치, 날짜, 여행자 조건을 카드형 시트에서 단계적으로 수정합니다.</p>
          </div>
          ${renderAirbnbSearchSheetTemplate()}
        </section>

        <section class="bottom-sheet-section bottom-sheet-preview-section" id="bottom-sheet-airbnb-filter">
          <div class="bottom-sheet-section-heading">
            <h3>Airbnb Filter Sheet</h3>
            <p>필터 버튼을 누르면 chip 선택과 하단 결과 보기 CTA가 있는 둥근 바텀시트가 열립니다.</p>
          </div>
          ${renderAirbnbFilterSheetTemplate()}
          ${renderBobaBottomSheetDemo()}
        </section>

        <section class="bottom-sheet-section" id="bottom-sheet-specification">
          <div class="bottom-sheet-section-heading">
            <h3>Specification</h3>
            <p>원본 관찰값과 보배드림 적용값을 분리해 기록합니다.</p>
          </div>
          ${renderSimpleRowsTable("Airbnb 검색 시트 실측값", ["항목", "값", "적용 기준"], airbnbSearchSpecs)}
          ${renderSimpleRowsTable("Airbnb 필터 시트 실측값", ["항목", "값", "적용 기준"], airbnbFilterSpecs)}
          ${renderSimpleRowsTable("보배드림 Bottom Sheet 적용값", ["항목", "값", "적용 기준"], bobaSpecs)}
        </section>

        <section class="bottom-sheet-section" id="bottom-sheet-assets">
          <div class="bottom-sheet-section-heading">
            <h3>Assets</h3>
            <p>시트에 사용한 SVG 자산입니다. 드래그 핸들, 닫기 아이콘, 슬라이더 막대와 원을 바로 내려받아 재사용합니다.</p>
          </div>
          ${renderBottomSheetAssetDownloads()}
        </section>

        <section class="bottom-sheet-section" id="bottom-sheet-api">
          <h3>API</h3>
          ${renderDocPropsTable(props)}
          <pre class="template-code"><code>${escapeHtml(bottomSheetVueCodeExample())}</code></pre>
        </section>

        <section class="bottom-sheet-section" id="bottom-sheet-usage">
          <h3>Usage</h3>
          <div class="bottom-sheet-guideline-grid">
            ${usage
              .map(
                ([title, description]) => `
                  <article>
                    <strong>${escapeHtml(title)}</strong>
                    <p>${escapeHtml(description)}</p>
                  </article>
                `,
              )
              .join("")}
          </div>
        </section>

        <section class="bottom-sheet-section" id="bottom-sheet-accessibility">
          <h3>Accessibility</h3>
          <ul class="bottom-sheet-checklist">
            ${accessibility.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </section>

        <section class="bottom-sheet-section bottom-sheet-reference-note">
          <h3>Reference</h3>
          <p>Airbnb 체험 검색 페이지를 2026-09-03에 Playwright 모바일 렌더링으로 확인했습니다.</p>
          <a href="https://www.airbnb.co.kr/s/experiences?location_search=NEARBY&search_type=unknown&refinement_paths%5B%5D=%2Fexperiences&source=structured_search_input_header&flexible_trip_lengths%5B%5D=one_week&center_lat=37.57&center_lng=127&monthly_start_date=2026-10-01&monthly_length=3&monthly_end_date=2027-01-01&price_filter_input_type=2&price_filter_num_nights=5&channel=EXPLORE" target="_blank" rel="noopener">Airbnb 체험 검색 확인</a>
        </section>
      </article>
      <aside class="doc-aside">
        <strong>목차</strong>
        ${renderDocToc(documentSectionsForNode(node))}
      </aside>
    </div>
  `;
}

function renderAirbnbSearchSheetTemplate() {
  return `
    <div class="bottom-sheet-airbnb-search" aria-label="Airbnb 검색 바텀시트 템플릿">
      <div class="airbnb-sheet-mobile-shell is-search-sheet">
        <div class="airbnb-sheet-search-top">
          <button type="button" aria-label="뒤로">‹</button>
          <div>
            <strong>근처의 체험</strong>
            <span>언제든지 · 게스트 추가</span>
          </div>
          <button type="button" aria-label="필터 보기">⌘</button>
        </div>
        <section class="airbnb-search-dialog" role="dialog" aria-modal="true" aria-labelledby="airbnb-search-title">
          <button class="airbnb-floating-close" type="button" aria-label="닫기">×</button>
          <div class="airbnb-service-tabs" role="tablist" aria-label="서비스 유형">
            <button type="button" role="tab">숙소</button>
            <button type="button" role="tab" aria-selected="true">체험</button>
            <button type="button" role="tab">서비스</button>
          </div>
          <article class="airbnb-search-card">
            <h4 id="airbnb-search-title">위치</h4>
            <button class="airbnb-search-input" type="button">도시나 명소로 검색</button>
            <button class="airbnb-nearby-row" type="button">
              <span aria-hidden="true">⌖</span>
              <strong>근처 체험 찾기</strong>
              <em>가까운 곳에서 즐길 수 있는 체험을 찾아보세요.</em>
            </button>
          </article>
          <button class="airbnb-collapsed-field" type="button"><span>날짜</span><strong>날짜 추가</strong></button>
          <button class="airbnb-collapsed-field" type="button"><span>여행자</span><strong>게스트 추가</strong></button>
          <footer class="airbnb-search-footer">
            <button type="button">전체 삭제</button>
            <button type="button"><span aria-hidden="true">⌕</span>검색</button>
          </footer>
        </section>
      </div>
    </div>
  `;
}

function renderAirbnbFilterSheetTemplate() {
  const chips = [
    "미식 문화",
    "당일 여행",
    "갤러리",
    "건축",
    "공연",
    "다이닝",
    "랜드마크",
    "문화 체험",
    "박물관",
    "뷰티",
    "수상스포츠",
    "식도락 탐방",
  ];

  return `
    <div class="bottom-sheet-airbnb-filter" aria-label="Airbnb 필터 바텀시트 템플릿">
      <div class="airbnb-filter-overlay">
        <section class="airbnb-filter-dialog" role="dialog" aria-modal="true" aria-labelledby="airbnb-filter-title">
          <header>
            <h4 id="airbnb-filter-title">필터</h4>
            <button type="button" aria-label="닫기">×</button>
          </header>
          <div class="airbnb-filter-body">
            <h5>추천</h5>
            <div class="airbnb-filter-chip-row">
              ${chips.slice(0, 2).map((chip) => `<button type="button">${escapeHtml(chip)}</button>`).join("")}
            </div>
            <hr />
            <h5>체험 유형</h5>
            <div class="airbnb-filter-chip-row">
              ${chips.slice(2).map((chip) => `<button type="button">${escapeHtml(chip)}</button>`).join("")}
            </div>
          </div>
          <footer>
            <button type="button" disabled>전체 해제</button>
            <a href="#components-mobile-app-components-bottom-sheet">300개 이상의 결과 보기</a>
          </footer>
        </section>
      </div>
    </div>
  `;
}

function renderBobaBottomSheetDemo() {
  const chips = ["국산차", "수입차", "SUV", "세단", "무사고", "1인신조", "보험이력 있음", "실매물"];
  return `
    <div class="boba-bottom-sheet-demo-wrap">
      <div class="bottom-sheet-section-heading">
        <h3>보배드림 적용 템플릿</h3>
        <p>상태 버튼으로 peek, half, full 높이를 전환해 실제 동작 흐름을 확인합니다.</p>
      </div>
      <div class="bottom-sheet-state-controls" aria-label="바텀시트 상태">
        <button type="button" data-bottom-sheet-state="peek" aria-pressed="false">Peek</button>
        <button type="button" data-bottom-sheet-state="half" aria-pressed="false">Half</button>
        <button type="button" data-bottom-sheet-state="full" aria-pressed="true">Full</button>
        <button type="button" data-bottom-sheet-open>열기</button>
      </div>
      <div class="bd-bottom-sheet-demo" data-bottom-sheet-demo data-sheet-state="full">
        <div class="bd-bottom-sheet-phone">
          <div class="bd-sheet-page" aria-hidden="true">
            <div class="bd-sheet-search-pill">중고차 · 제네시스 GV80 · 전국</div>
            <div class="bd-sheet-card-list">
              <span></span><span></span><span></span>
            </div>
          </div>
          <div class="bd-bottom-sheet-overlay"></div>
          <section class="bd-bottom-sheet-panel" role="dialog" aria-modal="true" aria-labelledby="boba-bottom-sheet-title">
            <img class="bd-sheet-handle" src="/assets/bottom-sheet/sheet-handle.svg" alt="" aria-hidden="true" />
            <header class="bd-sheet-header">
              <h4 id="boba-bottom-sheet-title">차량 검색 필터</h4>
              <button type="button" data-bottom-sheet-close aria-label="바텀시트 닫기">
                <img src="/assets/bottom-sheet/sheet-close.svg" alt="" aria-hidden="true" />
              </button>
            </header>
            <div class="bd-sheet-body">
              <section>
                <h5>차량 조건</h5>
                <div class="bd-sheet-chip-grid">
                  ${chips.map((chip, index) => `<button class="bd-sheet-chip${index < 2 ? " is-selected" : ""}" type="button">${escapeHtml(chip)}</button>`).join("")}
                </div>
              </section>
              <section class="bd-sheet-range">
                <div>
                  <h5>가격</h5>
                  <strong>2,000만원 - 6,000만원</strong>
                </div>
                <div class="bd-sheet-slider" aria-label="가격 범위">
                  <img class="bd-sheet-slider-track" src="/assets/bottom-sheet/sheet-slider-track.svg" alt="" aria-hidden="true" />
                  <img class="bd-sheet-slider-thumb is-min" src="/assets/bottom-sheet/sheet-slider-thumb.svg" alt="" aria-hidden="true" />
                  <img class="bd-sheet-slider-thumb is-max" src="/assets/bottom-sheet/sheet-slider-thumb.svg" alt="" aria-hidden="true" />
                </div>
              </section>
            </div>
            <footer class="bd-sheet-footer">
              <button type="button">초기화</button>
              <button type="button">검색 결과 300대 보기</button>
            </footer>
          </section>
        </div>
      </div>
    </div>
  `;
}

function bottomSheetAssetItems() {
  return [
    ["드래그 핸들", "sheet-handle.svg", "/assets/bottom-sheet/sheet-handle.svg", "40×4px", "#b0b0b0"],
    ["닫기 아이콘", "sheet-close.svg", "/assets/bottom-sheet/sheet-close.svg", "16×16px", "#222222"],
    ["슬라이더 막대", "sheet-slider-track.svg", "/assets/bottom-sheet/sheet-slider-track.svg", "280×4px", "#dddddd / #222222"],
    ["슬라이더 원", "sheet-slider-thumb.svg", "/assets/bottom-sheet/sheet-slider-thumb.svg", "28×28px", "#ffffff / #222222"],
  ];
}

function renderBottomSheetAssetDownloads() {
  return `
    <div class="bottom-sheet-asset-grid">
      ${bottomSheetAssetItems()
        .map(
          ([name, fileName, source, size, color]) => `
            <article>
              <div class="bottom-sheet-asset-preview">
                <img src="${escapeAttribute(source)}" alt="" aria-hidden="true" />
              </div>
              <strong>${escapeHtml(name)}</strong>
              <code>${escapeHtml(fileName)}</code>
              <dl>
                <div><dt>size</dt><dd>${escapeHtml(size)}</dd></div>
                <div><dt>color</dt><dd>${escapeHtml(color)}</dd></div>
              </dl>
              <a href="${escapeAttribute(source)}" download>SVG 다운로드</a>
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

function bottomSheetVueCodeExample() {
  return `<BobaBottomSheet
  v-model:open="filterOpen"
  title="차량 검색 필터"
  aria-label="차량 검색 필터"
  :snap-points="['peek', 'half', 'full']"
  default-snap-point="full"
  :sections="vehicleFilterSections"
  :footer-action="{ label: '검색 결과 300대 보기' }"
  :range-controls="[
    { id: 'price', label: '가격', min: 0, max: 10000, step: 100 },
    { id: 'mileage', label: '주행거리', min: 0, max: 300000, step: 1000 }
  ]"
/>`;
}

function handleBottomSheetDemoClick(event) {
  const stateButton = event.target.closest("[data-bottom-sheet-state]");
  if (stateButton) {
    const demo = stateButton.closest(".boba-bottom-sheet-demo-wrap")?.querySelector("[data-bottom-sheet-demo]");
    if (!demo) return;
    const state = stateButton.dataset.bottomSheetState || "full";
    demo.dataset.sheetState = state;
    demo.classList.remove("is-closed");
    syncBottomSheetDemoControls(demo, state);
    return;
  }

  const openButton = event.target.closest("[data-bottom-sheet-open]");
  if (openButton) {
    const demo = openButton.closest(".boba-bottom-sheet-demo-wrap")?.querySelector("[data-bottom-sheet-demo]");
    if (!demo) return;
    demo.dataset.sheetState = "full";
    demo.classList.remove("is-closed");
    syncBottomSheetDemoControls(demo, "full");
    return;
  }

  const closeButton = event.target.closest("[data-bottom-sheet-close]");
  if (closeButton) {
    const demo = closeButton.closest("[data-bottom-sheet-demo]");
    if (!demo) return;
    demo.classList.add("is-closed");
    syncBottomSheetDemoControls(demo, "");
  }
}

function syncBottomSheetDemoControls(demo, activeState) {
  const wrap = demo.closest(".boba-bottom-sheet-demo-wrap");
  wrap?.querySelectorAll("[data-bottom-sheet-state]").forEach((button) => {
    button.setAttribute("aria-pressed", button.dataset.bottomSheetState === activeState ? "true" : "false");
  });
}

function renderBreadcrumbDocumentPage(node) {
  const path = node.path?.join(" / ") || displayNodeName(node);
  const statusLabel = node.status === "deprecated" ? "deprecated" : "stable";
  const examples = [
    [
      { label: "홈", href: "/" },
      { label: "중고차", href: "/cars" },
      { label: "국산차", href: "/cars/domestic" },
      { label: "현대", href: "/cars/domestic/hyundai" },
      { label: "그랜저" },
    ],
    [
      { label: "홈", href: "/" },
      { label: "중고차", href: "/cars" },
      { label: "검색결과", href: "/cars/search" },
      { label: "제네시스 GV80" },
    ],
    [
      { label: "홈", href: "/" },
      { label: "내차팔기", href: "/sell" },
      { label: "사진등록", href: "/sell/photos" },
      { label: "옵션선택" },
    ],
  ];
  const anatomy = [
    ["홈 링크", "서비스 최상위로 돌아가는 첫 링크입니다."],
    ["상위 경로 링크", "현재 페이지보다 위에 있는 카테고리나 단계입니다."],
    ["구분자", "경로 사이를 나누는 시각 요소입니다."],
    ["현재 페이지", "마지막 항목이며 링크로 처리하지 않습니다."],
    ["모바일 축약 영역", "긴 경로를 부모 맥락과 현재 페이지 중심으로 줄입니다."],
  ];
  const states = [
    ["current", "현재 페이지 항목입니다. `aria-current=\"page\"`를 적용합니다."],
    ["overflow", "4단계 이상 경로에서 중간 항목을 줄여 보여줍니다."],
    ["compact", "모바일에서 이전 단계와 현재 페이지만 남기는 표시입니다."],
    ["disabled-link", "상위 경로는 보이지만 이동할 수 없는 항목입니다."],
  ];
  const props = [
    ["items", "Array<{ label: string; href?: string }>", "표시할 경로 목록입니다. 마지막 항목은 현재 페이지입니다."],
    ["separator", "string | Component", "`>` 또는 아이콘 구분자를 지정합니다."],
    ["maxItems", "number", "노출할 최대 항목 수입니다. 초과 시 overflow 규칙을 적용합니다."],
    ["currentLabel", "string", "현재 페이지 라벨을 별도로 덮어쓸 때 사용합니다."],
    ["compact", "boolean", "모바일 축약 표시를 강제로 켜거나 끕니다."],
    ["ariaLabel", "string", "탐색 영역의 접근성 라벨입니다. 기본값은 `breadcrumb`입니다."],
  ];
  const accessibility = [
    '`nav aria-label="breadcrumb"` 구조를 사용합니다.',
    '마지막 항목에는 `aria-current="page"`를 적용합니다.',
    "현재 페이지는 링크로 처리하지 않습니다.",
    "키보드 Tab 이동 순서가 화면 순서와 일치하는지 확인합니다.",
    "모바일 터치 영역은 44px 이상을 권장합니다.",
  ];

  elements.docPage.innerHTML = `
    <div class="doc-page-layout breadcrumb-doc">
      <article class="doc-main">
        <nav class="doc-breadcrumb" aria-label="문서 경로">${escapeHtml(path)}</nav>
        <div class="doc-title-row">
          <div>
            <p class="eyebrow">보배드림 컴포넌트</p>
            <h2>${escapeHtml(displayNodeName(node))}</h2>
          </div>
          <div class="doc-title-actions">
            <span class="doc-status ${escapeHtml(node.status)}">${escapeHtml(statusLabel)}</span>
            ${renderDocHeaderActions(node)}
          </div>
        </div>
        <p class="doc-lede">Breadcrumb은 사용자가 현재 페이지의 위치를 이해하고 상위 단계로 이동할 수 있게 하는 탐색 컴포넌트입니다.</p>
        <p class="doc-sublede">차량 상세, 검색 결과, 매물 등록처럼 2단계 이상 깊이가 있는 화면에서 사용합니다.</p>

        <section class="breadcrumb-section" id="breadcrumb-overview">
          <h3>Overview</h3>
          <div class="breadcrumb-info-grid">
            <article>
              <strong>정의</strong>
              <p>현재 페이지가 서비스 구조 안에서 어디에 있는지 보여주는 보조 탐색입니다.</p>
            </article>
            <article>
              <strong>목적</strong>
              <p>사용자가 상위 목록, 카테고리, 이전 맥락으로 빠르게 이동하게 돕습니다.</p>
            </article>
            <article>
              <strong>사용 위치</strong>
              <p>차량 상세 상단, 검색 결과 상세 진입, 내차팔기 등록 단계 화면에 둡니다.</p>
            </article>
          </div>
        </section>

        <section class="breadcrumb-section" id="breadcrumb-anatomy">
          <h3>Anatomy</h3>
          <div class="breadcrumb-anatomy">
            ${renderBreadcrumbTrail([
              { label: "홈", href: "/" },
              { label: "중고차", href: "/cars" },
              { label: "국산차", href: "/cars/domestic" },
              { label: "제네시스 GV80" },
            ])}
            <dl>
              ${anatomy.map(([term, description]) => `<div><dt>${escapeHtml(term)}</dt><dd>${escapeHtml(description)}</dd></div>`).join("")}
            </dl>
          </div>
        </section>

        <section class="breadcrumb-section" id="breadcrumb-examples">
          <h3>Examples</h3>
          <div class="breadcrumb-example-grid">
            ${examples
              .map(
                (labels, index) => `
                  <article>
                    <strong>예시 ${index + 1}</strong>
                    ${renderBreadcrumbTrail(labels)}
                  </article>
                `,
              )
              .join("")}
          </div>
        </section>

        <section class="breadcrumb-section" id="breadcrumb-states">
          <h3>States</h3>
          <div class="breadcrumb-state-grid">
            ${states
              .map(
                ([state, description]) => `
                  <article>
                    <code>${escapeHtml(state)}</code>
                    <p>${escapeHtml(description)}</p>
                  </article>
                `,
              )
              .join("")}
          </div>
        </section>

        <section class="breadcrumb-section" id="breadcrumb-mobile">
          <h3>Mobile</h3>
          <p>모바일에서는 4단계 이상일 때 전체 경로를 모두 노출하지 않습니다.</p>
          <div class="breadcrumb-mobile-examples">
            <span>‹ 검색결과 / 제네시스 GV80 3.5 터보 AWD 7인승 아주 긴 매물명</span>
            <span>홈 &gt; ... &gt; 제네시스 GV80</span>
          </div>
        </section>

        <section class="breadcrumb-section" id="breadcrumb-importing">
          <h3>Importing</h3>
          <pre class="template-code"><code>${escapeHtml(`import BobaBreadcrumb from '@/components/navigation/BobaBreadcrumb.vue';`)}</code></pre>
        </section>

        <section class="breadcrumb-section" id="breadcrumb-api-examples">
          <h3>API Examples</h3>
          <div class="breadcrumb-table-wrap">
            <table class="breadcrumb-props-table">
              <thead>
                <tr>
                  <th>속성</th>
                  <th>타입</th>
                  <th>설명</th>
                </tr>
              </thead>
              <tbody>
                ${props
                  .map(
                    ([name, type, description]) => `
                      <tr>
                        <td><code>${escapeHtml(name)}</code></td>
                        <td><code>${escapeHtml(type)}</code></td>
                        <td>${escapeHtml(description)}</td>
                      </tr>
                    `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </section>

        <section class="breadcrumb-section" id="breadcrumb-usage">
          <h3>Usage</h3>
          <div class="breadcrumb-guideline-grid">
            <article>
              <strong>Do</strong>
              <p>사용자의 방문 기록이 아니라 서비스 계층 구조를 보여줍니다.</p>
            </article>
            <article>
              <strong>Do</strong>
              <p>짧고 알아보기 쉬운 명칭을 씁니다. 차량명은 핵심 모델명 위주로 줄입니다.</p>
            </article>
            <article>
              <strong>Don’t</strong>
              <p>매물 등록 진행률을 Breadcrumb으로 표시하지 않습니다. 진행 단계는 Stepper를 사용합니다.</p>
            </article>
          </div>
        </section>

        <section class="breadcrumb-section" id="breadcrumb-accessibility">
          <h3>Accessibility</h3>
          <ul class="breadcrumb-checklist">
            ${accessibility.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </section>

        <section class="breadcrumb-section" id="breadcrumb-specification">
          <h3>Specification</h3>
          <div class="breadcrumb-info-grid">
            <article>
              <strong>Desktop</strong>
              <p>전역 내비게이션 아래 좌측에 배치하고, 3단계 이하는 전체 경로를 노출합니다.</p>
            </article>
            <article>
              <strong>Mobile</strong>
              <p>4단계 이상은 compact 또는 overflow 형태로 줄이고 터치 영역은 44px 이상으로 잡습니다.</p>
            </article>
            <article>
              <strong>운영 기준</strong>
              <p>채널이 달라도 items 데이터와 현재 페이지 표시는 동일하게 유지합니다.</p>
            </article>
          </div>
        </section>

        <section class="breadcrumb-section" id="breadcrumb-code">
          <h3>Code Example</h3>
          <pre class="template-code"><code>${escapeHtml(breadcrumbVueCodeExample())}</code></pre>
        </section>
      </article>
      <aside class="doc-aside">
        <strong>목차</strong>
        ${renderDocToc(documentSectionsForNode(node))}
      </aside>
    </div>
  `;
}

function renderBreadcrumbTrail(items = []) {
  return `
    <nav class="bd-breadcrumb-preview" aria-label="breadcrumb">
      <ol>
        ${items
          .map((item, index) => {
            const crumb = typeof item === "string" ? { label: item, href: breadcrumbHrefForLabel(item) } : item;
            const isCurrent = index === items.length - 1;
            return `
              <li ${isCurrent ? 'aria-current="page"' : ""}>
                ${
                  isCurrent
                    ? `<span>${escapeHtml(crumb.label)}</span>`
                    : `<a href="${escapeAttribute(crumb.href || breadcrumbHrefForLabel(crumb.label))}">${escapeHtml(crumb.label)}</a><span class="bd-breadcrumb-separator" aria-hidden="true">&gt;</span>`
                }
              </li>
            `;
          })
          .join("")}
      </ol>
    </nav>
  `;
}

function breadcrumbHrefForLabel(label = "") {
  const map = {
    홈: "/",
    중고차: "/cars",
    국산차: "/cars/domestic",
    현대: "/cars/domestic/hyundai",
    검색결과: "/cars/search",
    내차팔기: "/sell",
    사진등록: "/sell/photos",
  };
  return map[label] || "/";
}

function breadcrumbVueCodeExample() {
  return `<BobaBreadcrumb
  :items="[
    { label: '홈', href: '/' },
    { label: '중고차', href: '/cars' },
    { label: '국산차', href: '/cars/domestic' },
    { label: '제네시스 GV80' }
  ]"
/>`;
}

function renderTemplateDoc(node) {
  if (!node || node.status === "custom") return "";

  const profile = templateProfileForNode(node);
  const componentName = componentNameForNode(node);
  const relatedTokens = tokenTemplateItemsForNode(node);

  return `
    <div class="doc-template-section">
      <section class="template-panel template-panel-hero">
        <div>
            <p class="eyebrow">보배드림 디자인 시스템</p>
          <h3>${escapeHtml(profile.title)}</h3>
          <p>${escapeHtml(profile.description)}</p>
        </div>
        <div class="template-kpi">
          <strong>${escapeHtml(profile.kind)}</strong>
          <span>${escapeHtml(profile.owner)}</span>
        </div>
      </section>

      ${renderTemplateCoverage(node)}

      <div class="template-meta-grid">
        <section class="template-panel">
          <h4>프론트엔드 템플릿</h4>
          <dl class="template-definition">
            <div><dt>컴포넌트/문서명</dt><dd><code>${escapeHtml(componentName)}</code></dd></div>
            <div><dt>CSS 블록</dt><dd><code>${escapeHtml(`bd-${slugifySidebarSegment(displayNodeName(node))}`)}</code></dd></div>
            <div><dt>상태</dt><dd>${escapeHtml(node.status === "deprecated" ? "보배드림 대체 검토" : "샘플 등록완료")}</dd></div>
          </dl>
        </section>
        <section class="template-panel">
          <h4>한국형 적용 기준</h4>
          <ul class="template-checklist">
            ${profile.rules.map((rule) => `<li>${escapeHtml(rule)}</li>`).join("")}
          </ul>
        </section>
      </div>

      <section class="template-panel">
        <h4>개발 체크리스트</h4>
        <div class="template-check-grid">
          ${profile.checklist.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
        </div>
      </section>

      <section class="template-panel">
        <h4>샘플 마크업</h4>
        <pre class="template-code"><code>${escapeHtml(sampleMarkupForNode(node, componentName))}</code></pre>
      </section>

      ${relatedTokens.length ? renderTokenTemplateTable(node, relatedTokens) : ""}
    </div>
  `;
}

function renderTemplateCoverage(node) {
  if (node.title !== "Home") return "";

  const groups = flattenSidebar(fuseSidebarTree)
    .filter((entry) => entry.status !== "custom")
    .reduce((summary, entry) => {
      const top = entry.path?.[0] || entry.title;
      summary.set(top, (summary.get(top) || 0) + 1);
      return summary;
    }, new Map());
  const total = [...groups.values()].reduce((sum, count) => sum + count, 0);

  return `
    <section class="template-panel">
      <h4>전체 목차 커버리지</h4>
      <p class="template-copy">보배드림 디자인 시스템에 ${total}개 문서 항목을 샘플 템플릿으로 등록했습니다.</p>
      <div class="template-coverage-grid">
        ${[...groups.entries()]
          .map(
            ([title, count]) => `
              <span>
                <strong>${escapeHtml(displayName(title))}</strong>
                <em>${count}개</em>
              </span>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function templateProfileForNode(node) {
  const path = node.path || [node.title];
  const parent = path.at(-2) || "";
  const label = displayName(node.title);

  if (isInSourceSection(node, "Components")) {
    return {
      kind: "컴포넌트",
      owner: "FE · Design",
      title: `${label} 컴포넌트 템플릿`,
      description: "매물 탐색, 상세, 등록 화면에서 같은 구조로 재사용할 수 있게 목적, 구조, 상태, 접근성 기준을 한 화면에 정리합니다.",
      rules: [
        "터치 영역은 모바일 44px 이상을 우선합니다.",
        "컴포넌트별 상태는 실제 사용자 행동과 화면 맥락에 맞게 정의합니다.",
        "같은 기능은 플랫폼이 달라도 동일한 이름과 상태명으로 관리합니다.",
      ],
      checklist: ["props 정의", "variant 표", "상태 정의", "keyboard", "responsive", "Storybook"],
    };
  }

  if (isInSourceSection(node, "Style Guide")) {
    return {
      kind: isInSourceSection(node, "Design Tokens") ? "토큰" : "스타일",
      owner: "Design System",
      title: `${label} 스타일 템플릿`,
      description: "공개 디자인 시스템의 분류 방식을 참고하되, 보배드림의 한국어 문구, 국내 차량 거래 흐름, 모바일 밀도에 맞춰 다시 쓴 기준입니다.",
      rules: [
        "토큰은 의미 기반 이름을 먼저 쓰고, 원시 값은 문서 표에서만 노출합니다.",
        "보배드림 파란색, 가격 강조, 신뢰 상태는 별도 semantic token으로 분리합니다.",
        "문구는 짧은 한국어 한 문장으로 시작하고 예시는 실제 중고차 화면으로 씁니다.",
      ],
      checklist: ["CSS 변수", "Figma 변수", "반응형 값", "라이트/다크", "사용 예시", "금지 예시"],
    };
  }

  if (isInSourceSection(node, "Web Installation & Usage")) {
    return {
      kind: "개발 가이드",
      owner: "Frontend",
      title: `${label} 개발 적용 템플릿`,
      description: "디자인 시스템을 실제 보배드림 프론트엔드 코드에 붙일 때 필요한 설치, import, SSR, 마이그레이션 기준입니다.",
      rules: [
        "토큰과 컴포넌트 import 경로는 한 곳에서 관리합니다.",
        "기존 PC/모바일 분기 코드는 새 토큰으로 바꾸되 화면 단위로 검수합니다.",
        "문서 예시는 복사 가능한 최소 코드와 실제 화면 이름을 함께 제공합니다.",
      ],
      checklist: ["install", "import", "SSR", "theme", "migration", "QA"],
    };
  }

  if (isInSourceSection(node, "Accessibility")) {
    return {
      kind: "접근성",
      owner: "Design · FE · QA",
      title: `${label} 접근성 템플릿`,
      description: "한국어 화면, 모바일 조작, 차량 이미지 탐색을 기준으로 접근성 점검 항목을 정리합니다.",
      rules: [
        "차량명, 가격, 주요 상태는 스크린리더에서 끊기지 않게 읽힙니다.",
        "필터, 찜, 문의 버튼은 키보드와 터치에서 같은 결과를 냅니다.",
        "이미지 대체 텍스트는 차량 정보 확인에 필요한 사실만 적습니다.",
      ],
      checklist: ["role", "label", "focus", "contrast", "touch", "reduced motion"],
    };
  }

  if (isInSourceSection(node, "Content Strategy")) {
    return {
      kind: "콘텐츠",
      owner: "UX Writing",
      title: `${label} 콘텐츠 템플릿`,
      description: "중고차 거래자가 빠르게 이해할 수 있도록 한국어 표현, 오류 문구, 법적 고지, 버튼 라벨을 짧게 정리합니다.",
      rules: [
        "문장은 짧게 쓰고 한 문장에 한 행동만 담습니다.",
        "책임 소재가 필요한 안내는 모호한 표현을 피합니다.",
        "딜러와 개인 판매자 모두에게 자연스러운 높임말을 씁니다.",
      ],
      checklist: ["버튼 라벨", "오류 문구", "도움말", "법적 고지", "빈 상태", "용어 통일"],
    };
  }

  if (isInSourceSection(node, "Principles")) {
    return {
      kind: "원칙",
      owner: "Product",
      title: `${label} 원칙 템플릿`,
      description: "제품 판단이 흔들릴 때 우선순위를 정하기 위한 보배드림형 디자인 원칙입니다.",
      rules: [
        "거래 신뢰를 장식보다 먼저 보여줍니다.",
        "모바일 탐색에서는 필터 복귀와 선택 해제가 쉬워야 합니다.",
        "움직임은 의미 있는 상태 변화에만 씁니다.",
      ],
      checklist: ["판단 기준", "예외 기준", "화면 예시", "측정 지표", "담당자", "변경 이력"],
    };
  }

  return {
    kind: "문서",
    owner: "Design System",
    title: `${label} 문서 템플릿`,
    description: "보배드림 디자인 시스템에서 반복해서 재사용할 수 있게 목적, 기준, 개발 참고값을 정리한 문서입니다.",
    rules: [
      "한 항목은 한 화면에서 바로 판단할 수 있게 짧게 씁니다.",
      "영문명과 한국어명을 함께 두어 디자인과 개발의 명칭을 맞춥니다.",
      "확정 전 항목은 샘플로 표시하고 운영 배포 전 검수합니다.",
    ],
    checklist: ["정의", "사용 위치", "상태", "토큰", "컴포넌트", "검수"],
  };
}

function isInSourceSection(node, sectionName) {
  return (node.path || []).some((part) => part === sectionName || part.startsWith(`${sectionName} (`));
}

function componentNameForNode(node) {
  const name = displayNodeName(node).replace(/\([^)]*\)/g, "");
  const parts = slugifySidebarSegment(name)
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1));
  return `Boba${parts.join("") || "Template"}`;
}

function sampleMarkupForNode(node, componentName) {
  const blockName = `bd-${slugifySidebarSegment(displayNodeName(node)) || "template"}`;
  const title = displayNodeName(node);

  if (isInSourceSection(node, "Components")) {
    return `<${componentName}
  className="${blockName}"
  variant="default"
  size="md"
  data-screen="listing"
>
  ${title} 샘플
</${componentName}>`;
  }

  if (isInSourceSection(node, "Design Tokens")) {
    return `:root {
  --${blockName}-value: var(--bd-template-token);
}`;
  }

  return `<section class="${blockName}" data-template="bobaedream">
  <h2>${title}</h2>
  <p>보배드림 화면 기준으로 작성한 한국어 샘플 템플릿입니다.</p>
</section>`;
}

function tokenTemplateItemsForNode(node) {
  const category = tokenTemplateCategoryForNode(node);
  if (!category) return [];

  return activeItems().filter((item) => {
    if (item.type !== "토큰" || !item.standard.startsWith("--bd-template-")) return false;
    if (category === "all") return true;
    return item.props.split(",").map((part) => part.trim()).includes(category);
  });
}

function tokenTemplateCategoryForNode(node) {
  const path = node.path || [];
  const isStyleGuideTokenIndex =
    node.title === "Design Tokens" &&
    path.some((part) => part.includes("Style Guide")) &&
    path.at(-1)?.includes("Design Tokens");
  const hasDesignTokenParent = path.slice(0, -1).some((part) => part.includes("Design Tokens"));

  if (!isStyleGuideTokenIndex && !hasDesignTokenParent) return "";

  const map = {
    Color: "color",
    Font: "font",
    Spacing: "spacing",
    Size: "size",
    Elevation: "elevation",
    Motion: "motion",
    Breakpoints: "breakpoint",
    "Design Tokens": "all",
  };

  return map[node.title] || "";
}

function renderTokenTemplateTable(node, relatedTokens) {
  return `
    <section class="template-panel">
      <h4>${escapeHtml(displayNodeName(node))} 샘플 토큰</h4>
      <p class="template-copy">보배드림 변수명으로 정리한 개발 참고용 토큰 템플릿입니다.</p>
      <div class="template-token-table-wrap">
        <table class="template-token-table">
          <thead>
            <tr>
              <th>토큰</th>
              <th>값</th>
              <th>분류</th>
              <th>보배드림 적용</th>
            </tr>
          </thead>
          <tbody>
            ${relatedTokens
              .map(
                (item) => `
                  <tr>
                    <td><code>${escapeHtml(item.standard)}</code></td>
                    <td>${renderTokenValuePreview(item)}</td>
                    <td>${escapeHtml(item.props)}</td>
                    <td>${escapeHtml(item.note)}</td>
                  </tr>
                `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderTokenValuePreview(item) {
  const value = item.pcValue || item.moValue || "-";
  const colorStyle = tokenColorStyle(value);
  const spacingStyle = tokenSpacingStyle(value);
  const shadowStyle = item.standard.includes("elevation") ? tokenShadowStyle(value) : "";

  return `
    <span class="template-token-value">
      ${
        colorStyle || spacingStyle || shadowStyle
          ? `<span class="template-token-preview" style="${colorStyle || spacingStyle || shadowStyle}"></span>`
          : ""
      }
      <code>${escapeHtml(value)}</code>
    </span>
  `;
}

function tokenColorStyle(value) {
  const candidate = String(value || "").trim();
  const isColor =
    /^#[0-9a-f]{3,8}$/i.test(candidate) ||
    /^rgba?\([^)]{1,80}\)$/i.test(candidate) ||
    /^color-mix\([^)]{1,160}\)$/i.test(candidate);
  return isColor ? `--preview-color: ${escapeAttribute(candidate)}; background: var(--preview-color);` : "";
}

function tokenSpacingStyle(value) {
  const candidate = String(value || "").trim();
  if (!/^\d+(\.\d+)?px$/.test(candidate)) return "";
  return `--preview-width: ${escapeAttribute(candidate)}; width: min(var(--preview-width), 72px); background: var(--color-primary);`;
}

function tokenShadowStyle(value) {
  const candidate = String(value || "").trim();
  if (!candidate || candidate.length > 180 || /[<>{}]/.test(candidate)) return "";
  return `box-shadow: ${escapeAttribute(candidate)}; background: #fff;`;
}

function renderSpacingDoc(node) {
  if (node.title !== "Spacing") return "";

  const spacingItems = spacingTokenItemsForDocs();
  return `
    <div class="doc-spacing-section">
      <section class="doc-spacing-intro">
        <h3>간격 토큰</h3>
        <p>간격은 8px 기준으로 관리합니다. 중간값은 모바일 밀도와 카드 내부 정렬이 필요할 때만 씁니다.</p>
        <div class="spacing-principles">
          <span>margin</span>
          <span>padding</span>
          <span>gap</span>
          <span>stack 16px</span>
        </div>
      </section>

      <div class="spacing-token-table-wrap">
        <table class="spacing-token-table">
          <thead>
            <tr>
              <th>토큰</th>
              <th>값</th>
              <th>기준</th>
              <th>사용 위치</th>
            </tr>
          </thead>
          <tbody>
            ${spacingItems
              .map(
                ({ token, item }) => `
                  <tr>
                    <td><code>${escapeHtml(token.token)}</code></td>
                    <td>
                      <div class="spacing-ruler" aria-label="${escapeAttribute(token.value)} 간격">
                        <span class="spacing-ruler-bar" style="--spacing-width: ${escapeAttribute(token.value)}"></span>
                        <strong>${escapeHtml(token.value)}</strong>
                      </div>
                    </td>
                    <td>${escapeHtml(token.step)}</td>
                    <td>${escapeHtml(item.note || token.usage)}</td>
                  </tr>
                `,
              )
              .join("")}
          </tbody>
        </table>
      </div>

      <div class="spacing-example-grid">
        <article>
          <strong>컴팩트</strong>
          <p>4-8px는 아이콘과 텍스트처럼 붙어 읽히는 요소에 씁니다.</p>
          <div class="spacing-chip-row compact">
            <span>필터</span><span>연식</span><span>가격</span>
          </div>
        </article>
        <article>
          <strong>기본</strong>
          <p>12-20px는 카드, 폼, 리스트 행의 기본 여백으로 씁니다.</p>
          <div class="spacing-card-demo">
            <span></span>
            <div><b>현대 팰리세이드</b><small>2023년식 · 5만km</small></div>
          </div>
        </article>
        <article>
          <strong>섹션</strong>
          <p>24-64px는 화면 블록과 문서 섹션을 분리할 때 씁니다.</p>
          <div class="spacing-section-demo">
            <span></span><span></span><span></span>
          </div>
        </article>
      </div>
    </div>
  `;
}

function spacingTokenItemsForDocs() {
  const registryTokens = new Map(
    activeItems()
      .filter((item) => item.type === "토큰")
      .map((item) => [item.standard, item]),
  );

  return spacingTokenScale.map((token) => ({
    token,
    item:
      registryTokens.get(token.token) || {
        note: token.usage,
        pcValue: token.value,
        moValue: token.value,
      },
  }));
}

function renderIconsDoc(node) {
  const selectedGroupId = iconGroupIdForNode(node);
  if (!selectedGroupId) return "";

  const iconItems = activeItems().filter((item) => item.type === "아이콘");
  const groups = iconLibraryGroups
    .map((group) => ({
      ...group,
      items: iconItems.filter((item) => resolveIconGroup(item) === group.id),
    }))
    .filter((group) => selectedGroupId === "all" || group.id === selectedGroupId);

  return `
    <div class="doc-icon-library">
      <h3>아이콘 라이브러리</h3>
      <p>아이콘은 UI, 자주쓰는, 옵션, 차량 관련, 브랜드, 커뮤니티 6개 그룹으로 관리합니다. 필요한 아이콘을 선택해 개별 또는 일괄 다운로드합니다.</p>
      <div class="doc-icon-tabs" aria-label="아이콘 그룹">
        ${iconLibraryGroups
          .map(
            (group) => `
              <a class="${selectedGroupId === group.id ? "active" : ""}" href="#style-guide-icons-${group.id}-icons">
                ${escapeHtml(group.title)}
              </a>
            `,
          )
          .join("")}
      </div>
      ${renderIconBulkToolbar(groups)}
      ${groups.some((group) => group.id === "option") ? renderOptionBulkUploadPanel() : ""}
      <div class="doc-icon-groups">
        ${groups.map((group) => renderIconGroup(group)).join("")}
      </div>
    </div>
  `;
}

function renderIconGroup(group) {
  if (group.id === "option") return renderOptionIconGroup(group);

  return `
    <section class="doc-icon-group">
      <div class="doc-icon-group-header">
        <div>
          <h4>${escapeHtml(group.title)}</h4>
          <p>${escapeHtml(group.description)}</p>
        </div>
        <span>${group.items.length}개</span>
      </div>
      ${renderIconGrid(group.items)}
    </section>
  `;
}

function renderIconBulkToolbar(groups) {
  const visibleCount = groups.reduce((count, group) => count + group.items.length, 0);
  const selectedCount = selectedDownloadableIconItems().length;

  return `
    <div class="doc-icon-toolbar" aria-label="아이콘 선택 도구">
      <label class="doc-icon-select-all">
        <input type="checkbox" data-icon-select-all />
        <span>현재 화면 전체 선택</span>
      </label>
      <button class="icon-bulk-button" type="button" data-icon-bulk-download ${selectedCount ? "" : "disabled"}>
        선택 아이콘 일괄 다운로드
      </button>
      <button class="icon-bulk-secondary" type="button" data-icon-clear-selection ${selectedCount ? "" : "disabled"}>
        선택 해제
      </button>
      <span class="doc-icon-selection-status" data-icon-selection-count>${selectedCount}개 선택 / ${visibleCount}개 표시</span>
    </div>
  `;
}

function renderOptionBulkUploadPanel() {
  return `
    <section class="doc-option-upload" aria-label="옵션 아이콘 일괄 업로드">
      <div>
        <h4>옵션 아이콘 일괄 업로드</h4>
        <p>SVG, PNG 파일을 여러 개 선택하면 선택한 옵션 카테고리로 한 번에 등록합니다.</p>
      </div>
      <div class="doc-option-upload-controls">
        <label>
          카테고리
          <select data-option-bulk-category>
            ${optionIconCategories
              .map((category) => `<option value="${escapeAttribute(category.id)}">${escapeHtml(category.title)}</option>`)
              .join("")}
          </select>
        </label>
        <label class="doc-option-file-button">
          파일 선택
          <input type="file" data-option-bulk-upload accept=".svg,.png,image/svg+xml,image/png" multiple />
        </label>
      </div>
    </section>
  `;
}

function renderOptionIconGroup(group) {
  const categoryGroups = optionIconCategories
    .map((category) => ({
      ...category,
      items: group.items.filter((item) => optionIconMetaForItem(item).category === category.id),
    }))
    .filter((category) => category.items.length);

  return `
    <section class="doc-icon-group doc-option-icon-group">
      <div class="doc-icon-group-header">
        <div>
          <h4>${escapeHtml(group.title)}</h4>
          <p>${escapeHtml(group.description)}</p>
        </div>
        <span>${group.items.length}개</span>
      </div>
      <div class="doc-option-category-list">
        ${categoryGroups
          .map(
            (category) => `
              <section class="doc-option-category" data-option-category="${escapeAttribute(category.id)}">
                <div class="doc-option-category-header">
                  <div>
                    <h5>${escapeHtml(category.title)}</h5>
                    <p>${escapeHtml(category.description)}</p>
                  </div>
                  <span>${category.items.length}개</span>
                </div>
                ${renderIconGrid(category.items, { editable: true })}
              </section>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderIconGrid(iconItems, options = {}) {
  return `
    <div class="doc-icon-grid">
      ${iconItems.map((item) => renderIconCard(item, options)).join("")}
    </div>
  `;
}

function renderIconCard(item, options = {}) {
  const isSelected = selectedIconIds.has(item.id);
  const editable = options.editable && resolveIconGroup(item) === "option";
  return `
    <article class="doc-icon-card${isSelected ? " is-selected" : ""}" data-icon-card="${escapeAttribute(item.id)}">
      <label class="doc-icon-select-control">
        <input type="checkbox" value="${escapeAttribute(item.id)}" data-icon-select ${isSelected ? "checked" : ""} />
        <span>선택</span>
      </label>
      ${renderIconVisual(item, "doc-icon-preview")}
      <strong>${escapeHtml(displayIconName(item))}</strong>
      <code>${escapeHtml(item.standard)}</code>
      <div class="doc-icon-card-actions">
        ${renderIconDownloadLink(item)}
        ${editable ? `<button class="icon-edit-button" type="button" data-icon-edit="${escapeAttribute(item.id)}">수정</button>` : ""}
      </div>
    </article>
  `;
}

function handleIconDocumentClick(event) {
  const bulkDownloadButton = event.target.closest("[data-icon-bulk-download]");
  if (bulkDownloadButton) {
    downloadSelectedIcons();
    return;
  }

  const clearSelectionButton = event.target.closest("[data-icon-clear-selection]");
  if (clearSelectionButton) {
    selectedIconIds.clear();
    syncIconSelectionUi();
    showToast("아이콘 선택을 해제했습니다.");
    return;
  }

  const editButton = event.target.closest("[data-icon-edit]");
  if (editButton) {
    openIconEditDialog(editButton.dataset.iconEdit);
  }
}

function handleIconDocumentChange(event) {
  const selectAll = event.target.closest("[data-icon-select-all]");
  if (selectAll) {
    setVisibleIconSelection(selectAll.checked);
    return;
  }

  const checkbox = event.target.closest("[data-icon-select]");
  if (checkbox) {
    if (checkbox.checked) {
      selectedIconIds.add(checkbox.value);
    } else {
      selectedIconIds.delete(checkbox.value);
    }
    syncIconSelectionUi();
    return;
  }

  const bulkUploadInput = event.target.closest("[data-option-bulk-upload]");
  if (bulkUploadInput) {
    handleOptionBulkUpload(bulkUploadInput);
  }
}

function setVisibleIconSelection(checked) {
  visibleIconInputs().forEach((input) => {
    input.checked = checked;
    if (checked) {
      selectedIconIds.add(input.value);
    } else {
      selectedIconIds.delete(input.value);
    }
  });
  syncIconSelectionUi();
}

function visibleIconInputs() {
  return [...document.querySelectorAll("[data-icon-select]")];
}

function selectedDownloadableIconItems() {
  const selectedItems = activeItems().filter((item) => selectedIconIds.has(item.id) && item.type === "아이콘");
  return selectedItems.filter((item) => Boolean(getIconSource(item)));
}

function syncIconSelectionUi() {
  const visibleInputs = visibleIconInputs();
  const selectedVisibleCount = visibleInputs.filter((input) => selectedIconIds.has(input.value)).length;
  const selectedCount = selectedDownloadableIconItems().length;

  visibleInputs.forEach((input) => {
    input.checked = selectedIconIds.has(input.value);
    input.closest("[data-icon-card]")?.classList.toggle("is-selected", input.checked);
  });

  document.querySelectorAll("[data-icon-select-all]").forEach((input) => {
    input.checked = Boolean(visibleInputs.length && selectedVisibleCount === visibleInputs.length);
    input.indeterminate = selectedVisibleCount > 0 && selectedVisibleCount < visibleInputs.length;
  });

  document.querySelectorAll("[data-icon-selection-count]").forEach((node) => {
    node.textContent = `${selectedCount}개 선택 / ${visibleInputs.length}개 표시`;
  });

  document.querySelectorAll("[data-icon-bulk-download], [data-icon-clear-selection]").forEach((button) => {
    button.disabled = selectedCount === 0;
  });
}

function downloadSelectedIcons() {
  const selectedItems = selectedDownloadableIconItems();
  if (!selectedItems.length) {
    showToast("다운로드할 아이콘을 선택하세요.");
    return;
  }

  selectedItems.forEach((item, index) => {
    window.setTimeout(() => downloadIconItem(item), index * 120);
  });
  showToast(`${selectedItems.length}개 아이콘 다운로드를 시작했습니다.`);
}

function downloadIconItem(item) {
  const source = getIconSource(item);
  if (!source) return;

  const anchor = document.createElement("a");
  anchor.href = source;
  anchor.download = iconDownloadName(item);
  anchor.rel = "noopener";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}

async function handleOptionBulkUpload(input) {
  const files = [...(input.files || [])];
  if (!files.length) return;

  const uploadPanel = input.closest(".doc-option-upload");
  const categoryId = uploadPanel?.querySelector("[data-option-bulk-category]")?.value || "etc";
  const validFiles = files.filter(isSupportedOptionIconFile);
  if (!validFiles.length) {
    input.value = "";
    showToast("SVG 또는 PNG 아이콘 파일을 선택하세요.");
    return;
  }

  try {
    const uploadedItems = [];
    for (const file of validFiles) {
      uploadedItems.push(await createOptionIconItemFromFile(file, categoryId));
    }
    items = [...items, ...uploadedItems];
    persistItems();
    input.value = "";
    renderAll();
    showToast(`${uploadedItems.length}개 옵션 아이콘을 등록했습니다.`);
  } catch {
    input.value = "";
    showToast("옵션 아이콘 파일을 읽지 못했습니다.");
  }
}

function isSupportedOptionIconFile(file) {
  const name = file.name.toLowerCase();
  const isSupportedType = file.type === "image/svg+xml" || file.type === "image/png" || /\.(svg|png)$/i.test(name);
  return isSupportedType && file.size <= 500 * 1024;
}

async function createOptionIconItemFromFile(file, categoryId) {
  const dataUrl = await readFileAsDataUrl(file);
  const now = new Date().toISOString();
  const category = optionCategoryById(categoryId);
  const extension = iconFileExtension(file.name);
  const standard = uniqueOptionIconStandardName(standardFromUploadedOptionIcon(file.name, categoryId, extension));
  return {
    id: createId(),
    type: "아이콘",
    name: labelFromIconFileName(file.name) || `${category.title} 옵션 아이콘`,
    standard,
    status: "검토필요",
    platform: "공통",
    sheet: "07_아이콘명칭규칙",
    pcValue: extension === "svg" ? "24px" : "원본 비율",
    moValue: extension === "svg" ? "24px" : "원본 비율",
    props: `group:option, optionCategory:${category.id}, ${extension}, bulk upload, download`,
    note: `${category.title} 카테고리로 일괄 업로드했습니다.`,
    iconPath: "",
    iconData: dataUrl,
    iconFileName: standard,
    createdAt: now,
    updatedAt: now,
    archived: false,
  };
}

function standardFromUploadedOptionIcon(filename, categoryId, extension) {
  const base = iconBaseName(filename)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return `ic_option_${categoryId}_${base || "uploaded"}_24.${extension}`;
}

function uniqueOptionIconStandardName(standard) {
  const seen = new Set(items.map((item) => item.standard.toLowerCase()));
  if (!seen.has(standard.toLowerCase())) return standard;

  const extension = iconFileExtension(standard);
  const base = standard.replace(new RegExp(`\\.${extension}$`, "i"), "");
  let index = 2;
  let next = `${base}_${index}.${extension}`;
  while (seen.has(next.toLowerCase())) {
    index += 1;
    next = `${base}_${index}.${extension}`;
  }
  return next;
}

function openIconEditDialog(iconId) {
  const item = items.find((candidate) => candidate.id === iconId && candidate.type === "아이콘");
  if (!item) return;

  previousIconEditFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const meta = optionIconMetaForItem(item);
  elements.iconEditId.value = item.id;
  elements.iconEditName.value = displayIconName(item);
  elements.iconEditCategory.value = meta.category;
  elements.iconEditStandard.value = item.standard;
  elements.iconEditAppliedPage.value = item.appliedPage || "";
  elements.iconEditAppliedUrl.value = item.appliedUrl || "";
  elements.iconEditNote.value = item.note || "";
  elements.iconEditPreview.innerHTML = renderIconVisual(item, "form-icon-preview");
  elements.iconEditDialog.hidden = false;
  document.body.classList.add("modal-open");
  elements.iconEditName.focus();
}

function closeIconEditDialog() {
  elements.iconEditDialog.hidden = true;
  document.body.classList.remove("modal-open");
  previousIconEditFocus?.focus({ preventScroll: true });
  previousIconEditFocus = null;
}

function saveIconEdit(event) {
  event.preventDefault();
  const iconId = elements.iconEditId.value;
  const item = items.find((candidate) => candidate.id === iconId && candidate.type === "아이콘");
  if (!item) return;

  const category = optionCategoryById(elements.iconEditCategory.value);
  const previousStandard = item.standard;
  item.name = elements.iconEditName.value.trim() || item.name;
  item.standard = elements.iconEditStandard.value.trim() || item.standard;
  if (!item.iconFileName || item.iconFileName === previousStandard) {
    item.iconFileName = item.standard;
  }
  item.appliedPage = elements.iconEditAppliedPage.value.trim();
  item.appliedUrl = elements.iconEditAppliedUrl.value.trim();
  item.note = elements.iconEditNote.value.trim();
  item.props = setOptionCategoryInProps(item.props, category.id);
  item.updatedAt = new Date().toISOString();
  persistItems();
  closeIconEditDialog();
  renderAll();
  showToast(`${category.title} 카테고리로 수정했습니다.`);
}

function setOptionCategoryInProps(props = "", categoryId) {
  const parts = String(props || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => !/^optionCategory:/i.test(part));
  if (!parts.some((part) => part === "group:option")) parts.unshift("group:option");
  parts.splice(1, 0, `optionCategory:${categoryId}`);
  return parts.join(", ");
}

function iconGroupIdForNode(node) {
  if (node.title === "Icons") return "all";
  if (node.title === "UI Icons") return "ui";
  if (node.title === "Frequent Icons") return "frequent";
  if (node.title === "Option Icons") return "option";
  if (node.title === "Vehicle Info Icons") return "vehicle";
  if (node.title === "Brand Icons") return "brand";
  if (node.title === "Community Icons") return "community";
  return "";
}

const homeEntryLinks = [
  {
    href: "#web-installation-and-usage",
    title: "웹 설치 및 사용",
    description: "설치, 웹 컴포넌트, React, Next.js 적용 기준",
  },
  {
    href: "#style-guide",
    title: "스타일 가이드",
    description: "토큰, 색상, 글꼴, 간격, 반응형 기준",
  },
  {
    href: "#components",
    title: "컴포넌트",
    description: "중고차 탐색과 등록 화면의 UI 단위",
  },
  {
    href: "#style-guide-icons",
    title: "아이콘",
    description: "UI, 자주쓰는, 옵션, 차량, 커뮤니티, 브랜드 아이콘",
  },
  {
    href: "#accessibility",
    title: "접근성",
    description: "키보드, 포커스, 대비, 터치 타깃 체크 기준",
  },
  {
    href: "#resources",
    title: "리소스",
    description: "참고 출처와 크로스체크 결과를 분리 보관",
  },
  {
    href: "#catalog",
    title: "전체 목차",
    description: "Cars.com과 Seed 기준으로 정리한 보배드림 문서 구조",
  },
  {
    href: "#registry",
    title: "항목 등록/수정",
    description: "토큰, 컴포넌트, 아이콘 자산을 등록하고 관리",
  },
];

function renderHome() {
  renderMetrics();
  renderHomeEntryLinks();
}

function renderHomeEntryLinks() {
  if (!elements.homeEntryGrid) return;
  elements.homeEntryGrid.innerHTML = homeEntryLinks
    .map(
      (entry) => `
        <a class="home-entry-card" href="${escapeAttribute(entry.href)}">
          <strong>${escapeHtml(entry.title)}</strong>
          <span>${escapeHtml(entry.description)}</span>
        </a>
      `,
    )
    .join("");
}

function renderMetrics() {
  const groups = ["토큰", "템플릿", "컴포넌트", "아이콘", "버튼"];
  const counts = repoMetricCounts.size ? repoMetricCounts : metricCountsForItems(activeItems());
  elements.metricGrid.innerHTML = groups
    .map((group) => {
      const count = counts.get(group) || 0;
      return `<article class="metric-card"><strong>${count}</strong><span>${escapeHtml(group)} 등록 항목</span></article>`;
    })
    .join("");
}

function metricCountsForItems(sourceItems) {
  return sourceItems
    .filter((item) => !item.archived)
    .reduce((counts, item) => counts.set(item.type, (counts.get(item.type) || 0) + 1), new Map());
}

function renderReferences() {
  if (!elements.referenceRows) return;
  elements.referenceRows.innerHTML = references
    .map(
      (reference) => `
        <tr>
          <td><strong>${escapeHtml(reference.name)}</strong></td>
          <td>${escapeHtml(reference.focus)}</td>
          <td>${escapeHtml(reference.apply)}</td>
          <td><a href="${reference.url}" target="_blank" rel="noopener">공식 문서</a></td>
        </tr>
      `,
    )
    .join("");
}

function renderCatalogs() {
  renderCatalog(elements.fuseCatalog, catalogGroupsFromSidebarTree(fuseSidebarTree));
  renderCatalog(elements.ebayCatalog, ebayGroups);
}

function catalogGroupsFromSidebarTree(tree) {
  return tree.map((node) => [
    node.title,
    catalogNote(node.title, ""),
    node.children.length ? flattenCatalogEntries(node.children, node.title) : [node.title],
  ]);
}

function flattenCatalogEntries(nodes, parent) {
  return nodes.flatMap((node) => [[node.title, parent], ...flattenCatalogEntries(node.children, node.title)]);
}

function renderCatalog(target, groups) {
  if (!target) return;
  target.innerHTML = groups
    .map(
      ([title, description, entries]) => {
        const note = description || "";
        return `
        <article class="catalog-group">
          <h4 title="${escapeAttribute(displayName(title))}">${escapeHtml(displayKoreanName(title))}</h4>
          ${note ? `<p>${escapeHtml(note)}</p>` : ""}
          <div class="catalog-items">
            ${entries.map((entry) => renderCatalogItem(entry)).join("")}
          </div>
        </article>
      `;
      },
    )
    .join("");
}

function renderCatalogItem(entry) {
  const label = Array.isArray(entry) ? entry[0] : entry;
  const parent = Array.isArray(entry) ? entry[1] : "";
  const status = catalogStatus(label);
  return `
    <article class="catalog-item ${status.className}">
      <div class="catalog-item-title">
        <strong title="${escapeAttribute(displayName(label))}">${escapeHtml(displayKoreanName(label))}</strong>
        <em>${status.label}</em>
      </div>
      ${catalogNote(label, parent) ? `<p>${escapeHtml(catalogNote(label, parent))}</p>` : ""}
    </article>
  `;
}

function displayName(label) {
  const koreanName = koreanNames[label];
  return koreanName && koreanName !== label ? `${label} (${koreanName})` : label;
}

function displayKoreanName(label) {
  return koreanNames[label] || label;
}

function josa(word, withJong, withoutJong) {
  const ch = String(word).replace(/[)\]\s]+$/, "").slice(-1);
  const code = ch.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) {
    return (code - 0xac00) % 28 ? withJong : withoutJong;
  }
  return withJong;
}

function catalogNote(label, parent) {
  const name = displayKoreanName(label);
  if (holdItems.has(label)) {
    return `${name}${josa(name, "은", "는")} 보류 항목입니다. 대체 컴포넌트를 검토합니다.`;
  }
  return catalogNotes[label] || "";
}

function catalogStatus(label) {
  if (holdItems.has(label)) return { label: "보류", className: "hold" };
  if (requiredItems.has(label)) return { label: "필수", className: "required" };
  return { label: "권장", className: "recommended" };
}

function renderCards() {
  renderTokenCards();
  renderComponentCards();
  renderIconCards();
  renderButtonCards();
  renderStateCards();
}

function renderTokenCards() {
  elements.tokenCards.innerHTML = activeItems()
    .filter((item) => item.type === "토큰")
    .map(
      (item) => {
        const isSpacing = item.standard.startsWith("--bd-space");
        const isTemplateSpacing = item.standard.startsWith("--bd-template-spacing");
        const colorStyle = tokenColorStyle(item.pcValue || item.moValue);
        const spacingStyle =
          isSpacing || isTemplateSpacing ? tokenSpacingStyle(item.pcValue || item.moValue).replace("--preview-width", "--spacing-width") : "";
        const swatchClass = [
          "token-swatch",
          isSpacing || isTemplateSpacing ? "spacing-token-swatch" : "",
          colorStyle ? "color-token-swatch" : "",
        ]
          .filter(Boolean)
          .join(" ");
        const swatchStyle = colorStyle || spacingStyle ? ` style="${colorStyle || spacingStyle}"` : "";
        return `
        <article class="system-card">
          <div class="${swatchClass}"${swatchStyle}></div>
          <span class="tag">${escapeHtml(item.status)}</span>
          <h3>${escapeHtml(item.name)}</h3>
          <p><code>${escapeHtml(item.standard)}</code></p>
          <p>PC ${escapeHtml(item.pcValue || "-")} · MO ${escapeHtml(item.moValue || "-")}</p>
        </article>
      `;
      },
    )
    .join("");
}

function renderComponentCards() {
  elements.componentCards.innerHTML = activeItems()
    .filter((item) => item.type === "컴포넌트")
    .map(
      (item) => `
        <article class="component-card">
          <span class="tag">${escapeHtml(item.platform)}</span>
          <h3>${escapeHtml(item.name)}</h3>
          <p><code>${escapeHtml(item.standard)}</code></p>
          <p>${escapeHtml(item.props || "측정 속성 미입력")}</p>
        </article>
      `,
    )
    .join("");
}

function renderIconCards() {
  elements.iconGrid.innerHTML = activeItems()
    .filter((item) => item.type === "아이콘")
    .map(
      (item) => `
        <article class="icon-card">
          ${renderIconVisual(item, "icon-card-preview")}
          <strong>${escapeHtml(item.name)}</strong>
          <small>${escapeHtml(item.standard)}</small>
          ${renderIconDownloadLink(item, "icon-download-link compact")}
        </article>
      `,
    )
    .join("");
}

function renderButtonCards() {
  elements.buttonCards.innerHTML = activeItems()
    .filter((item) => item.type === "버튼")
    .map(
      (item) => `
        <article class="system-card">
          <span class="tag">${escapeHtml(item.status)}</span>
          <h3>${escapeHtml(item.name)}</h3>
          <p><code>${escapeHtml(item.standard)}</code></p>
          <p>${escapeHtml(item.props || "상태값 미입력")}</p>
        </article>
      `,
    )
    .join("");
}

function renderStateCards() {
  elements.stateRow.innerHTML = activeItems()
    .filter((item) => item.type === "상태")
    .map(
      (item) => `
        <article class="state-pill">
          <strong>${escapeHtml(item.name)}</strong>
          <small>${escapeHtml(item.standard)}</small>
        </article>
      `,
    )
    .join("");
}

function renderRegistry() {
  const query = elements.searchInput.value.trim();
  const queryKey = query.toLowerCase();
  const type = elements.typeFilter.value;
  const visibleItems = activeItems();
  const filtered = visibleItems.filter((item) => {
    const matchesType = type === "전체" || item.type === type;
    const haystack = [
      item.type,
      item.name,
      item.standard,
      item.status,
      item.platform,
      item.props,
      item.note,
      item.iconFileName,
      item.appliedPage,
      item.appliedUrl,
    ]
      .join(" ")
      .toLowerCase();
    return matchesType && (!queryKey || haystack.includes(queryKey));
  });

  elements.registrySummary.textContent =
    type === "전체" && !query
      ? `전체 ${visibleItems.length}개 항목`
      : `전체 ${visibleItems.length}개 중 ${filtered.length}개 표시`;

  elements.registryRows.innerHTML =
    filtered.map((item) => renderRegistryRow(item, query)).join("") ||
    `<tr class="empty-row"><td colspan="9">검색 결과가 없습니다.</td></tr>`;

  elements.registryCards.innerHTML =
    filtered.map((item) => renderRegistryCard(item, query)).join("") ||
    `<article class="registry-empty-card">검색 결과가 없습니다.</article>`;
}

function renderRegistryRow(item, query) {
  const itemName = item.type === "아이콘" ? displayIconName(item) : item.name;
  return `
    <tr>
      <td><span class="registry-tag">${escapeHtml(item.type)}</span></td>
      <td>${renderIconVisual(item)}</td>
      <td>
        <strong>${highlightText(itemName, query)}</strong>
        <br>
        <small>${highlightText(item.props || "", query)}</small>
        ${renderIconTracking(item, query)}
      </td>
      <td><code>${highlightText(item.standard, query)}</code></td>
      <td><span class="status" data-status="${escapeHtml(item.status)}">${escapeHtml(item.status)}</span></td>
      <td><span class="platform-badge">${escapeHtml(item.platform)}</span></td>
      <td>${escapeHtml(item.pcValue || "-")}</td>
      <td>${escapeHtml(item.moValue || "-")}</td>
      <td>${renderRegistryActions(item.id)}</td>
    </tr>
  `;
}

function renderRegistryCard(item, query) {
  const itemName = item.type === "아이콘" ? displayIconName(item) : item.name;
  return `
    <article class="registry-card">
      <div class="registry-card-head">
        ${renderIconVisual(item, "registry-card-icon")}
        <div class="registry-card-badges">
          <span class="registry-tag">${escapeHtml(item.type)}</span>
          <span class="status" data-status="${escapeHtml(item.status)}">${escapeHtml(item.status)}</span>
          <span class="platform-badge">${escapeHtml(item.platform)}</span>
        </div>
      </div>
      <dl>
        <div>
          <dt>항목명</dt>
          <dd><strong>${highlightText(itemName, query)}</strong></dd>
        </div>
        <div>
          <dt>표준명</dt>
          <dd><code>${highlightText(item.standard, query)}</code></dd>
        </div>
        <div>
          <dt>주요 속성</dt>
          <dd>${highlightText(item.props || "-", query)}</dd>
        </div>
        ${
          iconTrackingText(item)
            ? `<div>
                <dt>적용</dt>
                <dd>${highlightText(iconTrackingText(item), query)}</dd>
              </div>`
            : ""
        }
      </dl>
      ${renderRegistryActions(item.id)}
    </article>
  `;
}

function iconTrackingText(item) {
  if (item.type !== "아이콘") return "";
  return [item.appliedPage, item.appliedUrl].filter(Boolean).join(" · ");
}

function renderIconTracking(item, query = "") {
  const tracking = iconTrackingText(item);
  if (!tracking) return "";
  return `<small class="registry-tracking">적용: ${highlightText(tracking, query)}</small>`;
}

function renderRegistryActions(id) {
  const safeId = escapeHtml(id);
  return `
    <div class="row-actions registry-actions">
      <button type="button" data-action="edit" data-id="${safeId}">수정</button>
      <button type="button" data-action="duplicate" data-id="${safeId}">복제</button>
      <button class="delete" type="button" data-action="delete" data-id="${safeId}">삭제</button>
    </div>
  `;
}

function saveItem(event) {
  event.preventDefault();

  const validation = validateForm();
  if (!validation.valid) {
    validation.firstInvalid?.focus();
    showToast("필수 항목을 확인하세요.");
    return;
  }

  const currentId = elements.itemId.value;
  if (isDuplicateStandard(validation.item.standard, currentId)) {
    setFieldError("itemStandard", "이미 등록된 표준명입니다.");
    elements.itemStandard.focus();
    showToast("표준명을 확인하세요.");
    return;
  }

  const existing = currentId ? items.find((entry) => entry.id === currentId) : null;
  const now = new Date().toISOString();
  const item = {
    id: currentId || createId(),
    ...validation.item,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    archived: false,
  };

  if (currentId) {
    items = items.map((entry) => (entry.id === currentId ? item : entry));
    showToast("디자인 시스템 항목을 수정했습니다.");
  } else {
    items = [item, ...items];
    showToast("새 디자인 시스템 항목을 등록했습니다.");
  }

  persistItems();
  clearForm();
  renderAll();
}

function handleTableAction(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  event.preventDefault();
  event.stopPropagation();

  const id = button.dataset.id;
  const action = button.dataset.action;
  const item = items.find((entry) => entry.id === id);
  if (!item) return;

  if (action === "edit") {
    confirmBeforeLosingFormChanges(() => {
      fillForm(item);
      navigateToStaticRoute("#registry");
      showToast("수정할 항목을 불러왔습니다.");
    });
  }

  if (action === "duplicate") {
    confirmBeforeLosingFormChanges(() => duplicateItem(item));
  }

  if (action === "delete") {
    openDeleteConfirm(item);
  }
}

function duplicateItem(item) {
  const now = new Date().toISOString();
  const copy = {
    ...item,
    id: createId(),
    name: `${item.name} 복제`,
    standard: uniqueStandardName(`${item.standard}_copy`),
    status: DEFAULT_STATUS,
    createdAt: now,
    updatedAt: now,
    archived: false,
  };
  items = [copy, ...items];
  persistItems();
  renderAll();
  fillForm(copy);
  navigateToStaticRoute("#registry");
  showToast("항목을 복제했습니다. 내용을 확인하세요.");
}

function fillForm(item) {
  clearFieldErrors();
  elements.itemId.value = item.id;
  ensureSelectOption(elements.itemType, item.type);
  ensureSelectOption(elements.itemStatus, item.status);
  ensureSelectOption(elements.itemPlatform, item.platform);
  elements.itemType.value = item.type;
  elements.itemName.value = item.name;
  elements.itemStandard.value = item.standard;
  elements.itemStatus.value = item.status;
  elements.itemPlatform.value = item.platform;
  elements.itemSheet.value = item.sheet || "";
  elements.itemPcValue.value = item.pcValue || "";
  elements.itemMoValue.value = item.moValue || "";
  elements.itemProps.value = item.props || "";
  elements.itemNote.value = item.note || "";
  elements.itemIconData.value = item.iconData || "";
  elements.itemIconFileName.value = item.iconFileName || "";
  elements.itemIconPath.value = item.iconPath || "";
  elements.itemAppliedPage.value = item.appliedPage || "";
  elements.itemAppliedUrl.value = item.appliedUrl || "";
  elements.itemIconInput.value = "";
  elements.editBanner.hidden = false;
  elements.editBannerText.textContent = `현재 수정 중: ${item.standard} / ${item.name}`;
  elements.saveButton.textContent = "수정 저장";
  syncIconUploadVisibility();
  updateIconPreview(item);
  captureFormBaseline();
}

function ensureSelectOption(select, value) {
  if (!select || !value) return;
  const hasOption = [...select.options].some((option) => option.value === value);
  if (hasOption) return;
  select.add(new Option(value, value));
}

function clearForm() {
  elements.form.reset();
  elements.itemId.value = "";
  elements.itemType.value = DEFAULT_TYPE;
  elements.itemStatus.value = DEFAULT_STATUS;
  elements.itemPlatform.value = DEFAULT_PLATFORM;
  elements.itemIconData.value = "";
  elements.itemIconFileName.value = "";
  elements.itemIconPath.value = "";
  elements.itemAppliedPage.value = "";
  elements.itemAppliedUrl.value = "";
  elements.itemIconInput.value = "";
  elements.editBanner.hidden = true;
  elements.editBannerText.textContent = "현재 수정 중";
  elements.saveButton.textContent = "등록";
  clearFieldErrors();
  syncIconUploadVisibility();
  captureFormBaseline();
}

function syncIconUploadVisibility() {
  const isIcon = elements.itemType.value === "아이콘";
  elements.iconUploadPanel.hidden = !isIcon;
  if (!isIcon) return;
  updateIconPreview();
}

function updateIconPreview(item = readFormItem()) {
  if (item.type !== "아이콘") {
    elements.iconPreview.innerHTML = "<span>아이콘</span>";
    elements.iconFileName.textContent = "선택된 파일 없음";
    return;
  }

  elements.iconPreview.innerHTML = renderIconVisual(item, "form-icon-preview");
  elements.iconFileName.textContent = item.iconFileName || item.standard || "선택된 파일 없음";
}

function clearIconPreview() {
  elements.itemIconData.value = "";
  elements.itemIconFileName.value = "";
  elements.itemIconPath.value = "";
  elements.itemIconInput.value = "";
  updateIconPreview();
  showToast("아이콘 미리보기를 지웠습니다.");
}

async function handleIconFileChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const isSvg = file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");
  if (!isSvg) {
    event.target.value = "";
    showToast("SVG 파일만 등록할 수 있습니다.");
    return;
  }

  if (file.size > 150 * 1024) {
    event.target.value = "";
    showToast("SVG 파일은 150KB 이하로 등록하세요.");
    return;
  }

  try {
    const dataUrl = await readFileAsDataUrl(file);
    elements.itemType.value = "아이콘";
    elements.itemIconData.value = dataUrl;
    elements.itemIconFileName.value = file.name;
    elements.itemIconPath.value = "";

    if (!elements.itemName.value.trim()) {
      elements.itemName.value = labelFromIconFileName(file.name);
    }
    if (!elements.itemStandard.value.trim()) {
      elements.itemStandard.value = standardFromIconFileName(file.name);
    }
    if (!elements.itemSheet.value.trim()) {
      elements.itemSheet.value = "07_아이콘명칭규칙";
    }
    if (!elements.itemPcValue.value.trim()) {
      elements.itemPcValue.value = "24px";
    }
    if (!elements.itemMoValue.value.trim()) {
      elements.itemMoValue.value = "24px";
    }
    if (!elements.itemProps.value.trim()) {
      elements.itemProps.value = "width, height, fill, color, hit area, aria-label";
    }

    clearFieldErrors();
    syncIconUploadVisibility();
    showToast("SVG 아이콘을 불러왔습니다.");
  } catch {
    event.target.value = "";
    showToast("SVG 파일을 읽지 못했습니다.");
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function labelFromIconFileName(filename = "") {
  return filename
    .replace(/\.(svg|png)$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function standardFromIconFileName(filename = "") {
  const source = filename.toLowerCase();
  const tokens = [];

  if (/filter|필터/.test(source)) tokens.push("filter");
  if (/chip|칩/.test(source)) tokens.push("chip");
  if (/close|x|엑스|닫|삭제/.test(source)) tokens.push("close");
  if (/search|검색/.test(source)) tokens.push("search");
  if (/heart|favorite|찜|하트/.test(source)) tokens.push("favorite");
  if (/call|phone|전화/.test(source)) tokens.push("call");

  if (!tokens.length) tokens.push("custom", "icon");
  if (tokens.length === 1 && !tokens.includes("icon")) tokens.push("icon");
  return `ic_${tokens.join("_")}_24.svg`;
}

function exportJson() {
  downloadFile(
    "bobaedream-design-system-registry.json",
    JSON.stringify(buildRegistryPayload(items), null, 2),
    "application/json",
  );
  showToast("JSON 파일을 내보냈습니다.");
}

function exportCsv() {
  const header = ["구분", "항목명", "표준명", "상태", "플랫폼", "Sheet탭", "PC값", "MO값", "주요속성", "적용중인 페이지", "적용중인 URL", "비고"];
  const rows = activeItems().map((item) => [
    item.type,
    item.name,
    item.standard,
    item.status,
    item.platform,
    item.sheet,
    item.pcValue,
    item.moValue,
    item.props,
    item.appliedPage,
    item.appliedUrl,
    item.note,
  ]);
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  downloadFile("bobaedream-design-system-registry.csv", `\ufeff${csv}`, "text/csv;charset=utf-8");
  showToast("CSV 파일을 내보냈습니다.");
}

function importJson(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const importedItems = normalizeRegistryItems(readImportPayload(parsed));
      if (!importedItems.length) throw new Error("items 배열이 비어 있습니다.");
      assertRegistryImportItems(importedItems);
      items = mergeImportedItems(importedItems);
      persistItems();
      clearForm();
      renderAll();
      showToast("JSON 데이터를 가져왔습니다.");
    } catch (error) {
      showToast(error.message || "JSON 파일 형식이 올바르지 않습니다.");
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}

function resetData() {
  openConfirm({
    title: "샘플 데이터로 복원할까요?",
    message: "이 브라우저에 저장된 Registry 변경 내용이 샘플 기준으로 바뀝니다.",
    confirmLabel: "복원",
    onConfirm: () => {
      items = cloneSeedItems();
      persistItems();
      clearForm();
      renderAll();
      showToast("샘플 데이터를 복원했습니다.");
    },
  });
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function resolveRoute(hash = window.location.hash || "#home") {
  if (STATIC_ROUTE_SECTIONS.has(hash)) {
    return {
      type: "static",
      hash,
      sectionIds: STATIC_ROUTE_SECTIONS.get(hash),
    };
  }

  const selectedNode = findSidebarNodeByHash(hash);
  if (selectedNode && isDocumentRoute(selectedNode)) {
    return {
      type: "document",
      hash: selectedNode.href,
      node: selectedNode,
    };
  }

  return {
    type: "static",
    hash: "#home",
    sectionIds: STATIC_ROUTE_SECTIONS.get("#home"),
  };
}

function setVisibleSections(sectionIds = []) {
  const visibleIds = new Set(sectionIds);
  elements.pageSections.forEach((section) => {
    section.hidden = !visibleIds.has(section.id);
  });
}

function navigateToStaticRoute(hash, onReady) {
  if (window.location.hash !== hash) {
    window.location.hash = hash;
  }
  syncActiveNav();
  window.requestAnimationFrame(() => {
    const firstSectionId = STATIC_ROUTE_SECTIONS.get(hash)?.[0];
    document.getElementById(firstSectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    onReady?.();
  });
}

function syncActiveNav() {
  const route = resolveRoute();
  const hash = route.hash;
  const sectionIds = route.type === "document" ? ["docPage"] : route.sectionIds;

  clearInactiveDynamicSections(sectionIds);

  if (route.type === "document") {
    renderDocumentPage(route.node);
  } else {
    elements.docPage.innerHTML = "";
    renderStaticRouteContent(route.sectionIds);
  }

  setVisibleSections(sectionIds);

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === hash);
  });
  syncActivePageSectionNav();

  const activeLink = document.querySelector(".fuse-nav-link.active");
  const scroller = elements.sidebar?.querySelector(".sidebar-scroll");
  if (activeLink && scroller && !elements.sidebarSearch.value.trim() && window.innerWidth > 760) {
    scroller.scrollTop = Math.max(0, activeLink.offsetTop - 170);
  }

  syncIconSelectionUi();
}

function syncActivePageSectionNav() {
  const route = resolveRoute();
  const links = document.querySelectorAll(".nav-section-link[data-scroll-target], .doc-toc-link[data-scroll-target]");

  if (route.type !== "document" || !links.length) {
    setActivePageSectionTarget("");
    return;
  }

  const targets = documentSectionsForNode(route.node)
    .map(([, target]) => target)
    .filter((target) => document.querySelector(target));

  if (!targets.length) {
    setActivePageSectionTarget("");
    return;
  }

  const activationTop = Math.min(180, Math.max(112, window.innerHeight * 0.22));
  let activeTarget = targets[0];

  for (const target of targets) {
    const section = document.querySelector(target);
    if (section && section.getBoundingClientRect().top <= activationTop) {
      activeTarget = target;
    }
  }

  setActivePageSectionTarget(activeTarget);
}

function setActivePageSectionTarget(activeTarget) {
  document.querySelectorAll(".nav-section-link[data-scroll-target], .doc-toc-link[data-scroll-target]").forEach((link) => {
    const isActive = Boolean(activeTarget) && link.dataset.scrollTarget === activeTarget;
    link.classList.toggle("active", isActive);

    if (link.classList.contains("nav-section-link")) {
      if (isActive) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    }
  });
}

function currentRouteHash() {
  return resolveRoute().hash;
}

function validateForm() {
  clearFieldErrors();
  const item = readFormItem();
  const errors = {};

  if (!item.type) errors.itemType = "구분을 선택하세요.";
  if (item.name.length < 2) errors.itemName = "항목명은 2자 이상 입력하세요.";
  if (!item.standard) {
    errors.itemStandard = "표준명을 입력하세요.";
  } else if (!STANDARD_NAME_PATTERN.test(item.standard)) {
    errors.itemStandard = "영문, 숫자, 마침표, 콜론, 밑줄, 하이픈만 사용하세요.";
  }
  if (!item.status) errors.itemStatus = "상태를 선택하세요.";
  if (!item.platform) errors.itemPlatform = "플랫폼을 선택하세요.";
  if (!item.props) errors.itemProps = "주요 속성을 1개 이상 입력하세요.";

  Object.entries(errors).forEach(([fieldId, message]) => setFieldError(fieldId, message));
  const firstInvalid = VALIDATION_FIELDS.map((fieldId) => elements[fieldId]).find((field) =>
    field?.getAttribute("aria-invalid") === "true",
  );

  return { valid: Object.keys(errors).length === 0, item, firstInvalid };
}

function readFormItem() {
  const isIcon = elements.itemType.value === "아이콘";
  return {
    type: elements.itemType.value,
    name: elements.itemName.value.trim(),
    standard: elements.itemStandard.value.trim(),
    status: elements.itemStatus.value,
    platform: elements.itemPlatform.value,
    sheet: elements.itemSheet.value.trim(),
    pcValue: elements.itemPcValue.value.trim(),
    moValue: elements.itemMoValue.value.trim(),
    props: elements.itemProps.value.trim(),
    note: elements.itemNote.value.trim(),
    iconData: isIcon ? elements.itemIconData.value.trim() : "",
    iconFileName: isIcon ? elements.itemIconFileName.value.trim() : "",
    iconPath: isIcon ? elements.itemIconPath.value.trim() : "",
    appliedPage: isIcon ? elements.itemAppliedPage.value.trim() : "",
    appliedUrl: isIcon ? elements.itemAppliedUrl.value.trim() : "",
  };
}

function setFieldError(fieldId, message) {
  const field = elements[fieldId];
  const error = elements[`${fieldId}Error`];
  if (!field || !error) return;
  field.setAttribute("aria-invalid", "true");
  error.textContent = message;
  field.closest("label")?.classList.add("has-error");
}

function clearFieldErrors() {
  VALIDATION_FIELDS.forEach((fieldId) => {
    const field = elements[fieldId];
    const error = elements[`${fieldId}Error`];
    if (!field || !error) return;
    field.removeAttribute("aria-invalid");
    error.textContent = "";
    field.closest("label")?.classList.remove("has-error");
  });
}

function clearLiveValidation(event) {
  const fieldId = event.target?.id;
  if (!VALIDATION_FIELDS.includes(fieldId)) return;
  const field = elements[fieldId];
  const error = elements[`${fieldId}Error`];
  field?.removeAttribute("aria-invalid");
  if (error) error.textContent = "";
  field?.closest("label")?.classList.remove("has-error");
}

function formSnapshot() {
  return JSON.stringify({
    id: elements.itemId.value,
    ...readFormItem(),
  });
}

function captureFormBaseline() {
  formBaseline = formSnapshot();
}

function isFormDirty() {
  return formSnapshot() !== formBaseline;
}

function confirmBeforeLosingFormChanges(next) {
  if (!isFormDirty()) {
    next();
    return;
  }

  openConfirm({
    title: "수정 중인 항목을 바꿀까요?",
    message: "저장하지 않은 변경 내용은 사라집니다.",
    confirmLabel: "전환",
    onConfirm: next,
    danger: false,
  });
}

function isDuplicateStandard(standard, currentId = "") {
  const key = standard.toLowerCase();
  return activeItems().some((item) => item.id !== currentId && item.standard.toLowerCase() === key);
}

function uniqueStandardName(baseStandard) {
  const sanitized = sanitizeStandardName(baseStandard) || "item_copy";
  let candidate = sanitized;
  let index = 2;
  const used = new Set(activeItems().map((item) => item.standard.toLowerCase()));

  while (used.has(candidate.toLowerCase())) {
    candidate = `${sanitized}_${index}`;
    index += 1;
  }

  return candidate;
}

function sanitizeStandardName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^A-Za-z0-9._:-]/g, "");
}

function openDeleteConfirm(item) {
  openConfirm({
    title: "항목을 삭제할까요?",
    message: `삭제 대상: ${item.standard} / ${item.name}\n삭제한 항목은 목록에서 숨김 처리됩니다.`,
    confirmLabel: "삭제",
    onConfirm: () => archiveItem(item.id),
    danger: true,
  });
}

function archiveItem(id) {
  items = items.map((entry) =>
    entry.id === id ? { ...entry, archived: true, updatedAt: new Date().toISOString() } : entry,
  );
  persistItems();
  if (elements.itemId.value === id) clearForm();
  renderAll();
  showToast("항목을 삭제했습니다.", {
    actionLabel: "되돌리기",
    onAction: () => restoreItem(id),
  });
}

function restoreItem(id) {
  items = items.map((entry) =>
    entry.id === id ? { ...entry, archived: false, updatedAt: new Date().toISOString() } : entry,
  );
  persistItems();
  renderAll();
  showToast("삭제를 되돌렸습니다.");
}

function readImportPayload(payload) {
  if (Array.isArray(payload)) {
    throw new Error("schema_version이 있는 Registry JSON을 가져오세요.");
  }
  return readRegistryPayload(payload);
}

function mergeImportedItems(importedItems) {
  const importedIds = new Set(importedItems.map((item) => item.id));
  const importedStandards = new Set(importedItems.map((item) => item.standard.toLowerCase()));
  const remainingItems = items.filter(
    (item) => !importedIds.has(item.id) && !importedStandards.has(item.standard.toLowerCase()),
  );
  return normalizeRegistryItems([...importedItems, ...remainingItems]);
}

function assertRegistryImportItems(importedItems) {
  const invalidItem = importedItems.find(
    (item) =>
      !item.type ||
      item.name.length < 2 ||
      !item.standard ||
      !STANDARD_NAME_PATTERN.test(item.standard) ||
      !item.status ||
      !item.platform ||
      !item.props,
  );

  if (invalidItem) {
    throw new Error(`${invalidItem.standard || invalidItem.name || "알 수 없는 항목"}의 필수 값을 확인하세요.`);
  }
}

function openConfirm({ title, message, confirmLabel, onConfirm, danger = true }) {
  pendingConfirm = onConfirm;
  previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  elements.confirmTitle.textContent = title;
  elements.confirmMessage.textContent = message;
  elements.confirmDeleteButton.textContent = confirmLabel;
  elements.confirmDeleteButton.className = danger ? "danger-button" : "primary-button";
  elements.confirmDialog.hidden = false;
  document.body.classList.add("modal-open");
  elements.cancelConfirmButton.focus();
}

function closeConfirm() {
  elements.confirmDialog.hidden = true;
  document.body.classList.remove("modal-open");
  pendingConfirm = null;
  previousFocus?.focus?.();
  previousFocus = null;
}

function runPendingConfirm() {
  const confirmAction = pendingConfirm;
  closeConfirm();
  confirmAction?.();
}

function handleGlobalKeydown(event) {
  if (event.key === "Escape" && document.body.classList.contains("sidebar-open")) {
    event.preventDefault();
    closeSidebar();
    elements.menuToggle.focus({ preventScroll: true });
    return;
  }

  if (event.key === "Escape" && !elements.iconEditDialog.hidden) {
    event.preventDefault();
    closeIconEditDialog();
    return;
  }

  if (elements.confirmDialog.hidden) return;

  if (event.key === "Escape") {
    event.preventDefault();
    closeConfirm();
  }

  if (event.key !== "Tab") return;
  const focusable = [elements.cancelConfirmButton, elements.confirmDeleteButton].filter(Boolean);
  const first = focusable[0];
  const last = focusable.at(-1);
  if (!first || !last) return;

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function showToast(message, action = null) {
  elements.toastMessage.textContent = message;
  elements.toastAction.hidden = true;
  elements.toastAction.onclick = null;

  if (action?.actionLabel && typeof action.onAction === "function") {
    elements.toastAction.textContent = action.actionLabel;
    elements.toastAction.hidden = false;
    elements.toastAction.onclick = () => {
      window.clearTimeout(showToast.timer);
      hideToast();
      action.onAction();
    };
  }

  elements.toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    hideToast();
  }, action ? 5200 : 2600);
}

function hideToast() {
  elements.toast.classList.remove("show");
}

function createId() {
  return `ds-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function csvCell(value = "") {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function highlightText(value = "", query = "") {
  const text = String(value ?? "");
  const needle = String(query ?? "").trim();
  if (!needle) return escapeHtml(text);

  const lowerText = text.toLowerCase();
  const lowerNeedle = needle.toLowerCase();
  let cursor = 0;
  let html = "";
  let matchIndex = lowerText.indexOf(lowerNeedle, cursor);

  while (matchIndex >= 0) {
    html += escapeHtml(text.slice(cursor, matchIndex));
    html += `<mark class="search-highlight">${escapeHtml(text.slice(matchIndex, matchIndex + needle.length))}</mark>`;
    cursor = matchIndex + needle.length;
    matchIndex = lowerText.indexOf(lowerNeedle, cursor);
  }

  return html + escapeHtml(text.slice(cursor));
}

function renderIconVisual(item, className = "registry-icon-thumb") {
  if (item.type !== "아이콘") return '<span class="registry-icon-empty">-</span>';

  const source = getIconSource(item);
  const label = displayIconName(item);
  if (source) {
    return `
      <span class="${escapeAttribute(className)}" title="${escapeAttribute(label)}">
        <img src="${escapeAttribute(source)}" alt="${escapeAttribute(label)}" loading="lazy" />
      </span>
    `;
  }

  return `
    <span class="${escapeAttribute(className)}" title="${escapeAttribute(label)}">
      <span class="icon-fallback">${escapeHtml(getIconGlyph(label))}</span>
    </span>
  `;
}

function getIconSource(item) {
  if (item.iconData?.startsWith("data:image/")) return item.iconData;
  if (item.iconPath) return resolveIconPath(item.iconPath);
  return getMappedIconPath(item);
}

function renderIconDownloadLink(item, className = "icon-download-link") {
  const source = getIconSource(item);
  if (!source) return "";
  const downloadLabel = `${iconFileExtension(iconDownloadName(item)).toUpperCase()} 다운로드`;

  return `
    <a
      class="${escapeAttribute(className)}"
      href="${escapeAttribute(source)}"
      download="${escapeAttribute(iconDownloadName(item))}"
      aria-label="${escapeAttribute(`${displayIconName(item)} ${downloadLabel}`)}"
    >
      ${escapeHtml(downloadLabel)}
    </a>
  `;
}

function iconDownloadName(item) {
  const fromFile = item.iconFileName || item.standard || item.name || "bobaedream-icon.svg";
  const fileName = String(fromFile)
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-");
  if (/\.[a-z0-9]+$/i.test(fileName)) return fileName;
  return `${fileName}.${iconFileExtension(item.iconPath || item.iconData || fileName)}`;
}

function iconFileExtension(fileName = "") {
  const source = String(fileName || "").toLowerCase();
  if (source.startsWith("data:image/svg+xml")) return "svg";
  const match = source.match(/\.([a-z0-9]+)(?:[?#].*)?$/);
  return match ? match[1] : "svg";
}

function iconBaseName(fileName = "") {
  const normalized = String(fileName || "").replace(/\\/g, "/");
  const name = normalized.split("/").pop() || normalized;
  return name.replace(/\.[a-z0-9]+$/i, "");
}

function iconDisplayName(groupId, fileName = "") {
  const baseName = iconBaseName(fileName);
  const vehicleBrandNames = {
    audi: "아우디 브랜드",
    benz: "벤츠 브랜드",
    bmw: "BMW 브랜드",
    jaguar: "재규어 브랜드",
    "land-rover": "랜드로버 브랜드",
    lexus: "렉서스 브랜드",
    lincoln: "링컨 브랜드",
    mini: "MINI 브랜드",
    "porsche-symbol": "포르쉐 심볼",
    porsche: "포르쉐 브랜드",
  };
  const vehicleCategoryNames = {
    "used-car": "중고차",
    truck: "트럭",
    bike: "바이크",
    camping: "캠핑카",
    construction: "건설기계",
    "old-car": "올드카",
    parts: "부품",
    "vehicle-info-chevron": "차량 정보 펼침",
    "price-tag": "가격 태그",
    "price-tag-dot": "가격 태그 표시점",
    "price-up": "가격 상승",
    "price-down": "가격 하락",
    "price-history-close": "가격 이력 닫기",
  };
  const uiNames = {
    back: "뒤로가기",
    bookmark: "북마크",
    call: "전화",
    "card-call": "매물 카드 전화",
    "card-heart": "매물 카드 찜",
    "card-message": "매물 카드 메시지",
    "card-more": "매물 카드 더보기",
    "card-view": "매물 카드 조회",
    "category-chevron-down": "카테고리 아래 화살표",
    "category-chevron-right": "카테고리 오른쪽 화살표",
    "category-sheet-close": "카테고리 시트 닫기",
    "chevron-down": "아래 화살표",
    "chotot-heart": "초톳 하트",
    close: "닫기",
    filter: "필터",
    "heart-outline": "찜 외곽선",
    heart: "찜",
    list: "목록",
    "location-blue": "위치 파랑",
    "location-gray": "위치 회색",
    message: "메시지",
    more: "더보기",
    "notion-chevron-right": "노션형 오른쪽 화살표",
    "notion-close": "노션형 닫기",
    "notion-filter": "노션형 필터",
    "notion-list": "노션형 목록",
    "notion-search": "노션형 검색",
    "photo-count": "사진 개수",
    "region-chevron": "지역 화살표",
    search: "검색",
    "sheet-chevron": "시트 화살표",
    "sheet-close": "시트 닫기",
    "sort-arrow": "정렬 화살표",
    share: "공유",
    views: "조회수",
  };

  if (groupId === "option") {
    if (optionIconMetadata[baseName]) return optionIconMetadata[baseName].name;
    return `${baseName.replace(/-/g, " ")} 옵션 아이콘`;
  }
  if (groupId === "brand") return `${vehicleBrandNames[baseName] || baseName.replace(/-/g, " ")} 아이콘`;
  if (groupId === "vehicle") return `${vehicleBrandNames[baseName] || vehicleCategoryNames[baseName] || baseName.replace(/-/g, " ")} 아이콘`;
  return `${uiNames[baseName] || baseName.replace(/-/g, " ")} 아이콘`;
}

function displayIconName(item) {
  if (resolveIconGroup(item) !== "option") return item.name || item.standard || "아이콘";
  return item.name || optionIconMetaForItem(item).name || item.standard || "옵션 아이콘";
}

function optionIconMetaForItem(item) {
  const categoryFromProps = String(item.props || "").match(/optionCategory:([a-z-]+)/i)?.[1];
  const baseName = optionIconBaseName(item);
  const meta = optionIconMetadata[baseName] || {};
  return {
    name: meta.name || "",
    category: categoryFromProps || meta.category || "etc",
  };
}

function optionIconBaseName(item) {
  const haystack = [item.iconPath, item.iconFileName, item.standard, item.name].join(" ").toLowerCase();
  const smartKeyMatch = haystack.match(/option[-_]smart[-_]key/);
  if (smartKeyMatch) return "option-smart-key";
  const infoMatch = haystack.match(/option[-_]info/);
  if (infoMatch) return "option-info";
  const optionMatch = haystack.match(/option[-_](\d+)/);
  if (optionMatch) return `option-${optionMatch[1].padStart(2, "0")}`;
  return "";
}

function optionCategoryById(categoryId) {
  return optionIconCategories.find((category) => category.id === categoryId) || optionIconCategories.at(-1);
}

function resolveIconGroup(item) {
  const haystack = [item.props, item.iconPath, item.standard, item.name].join(" ").toLowerCase();
  if (haystack.includes("group:ui")) return "ui";
  if (haystack.includes("group:frequent")) return "frequent";
  if (haystack.includes("group:option") || /option-|option_|option\b|옵션/.test(haystack)) return "option";
  if (haystack.includes("group:brand") || /\/brand\/|brand|audi|benz|bmw|jaguar|land-rover|lexus|lincoln|mini|porsche|브랜드|제조사/.test(haystack)) return "brand";
  if (haystack.includes("group:vehicle") || /categories|vehicle|truck|bike|camping|used-car|차량|차종/.test(haystack)) return "vehicle";
  if (haystack.includes("group:community") || /community|comment|reply|post|board|댓글|게시글|커뮤니티/.test(haystack)) return "community";
  return "ui";
}

function getMappedIconPath(item) {
  const key = `${item.standard || ""} ${item.name || ""}`.toLowerCase();
  if (/filter.*chip.*close|chip.*close|닫|엑스/.test(key)) return "./icons/ic_filter_chip_close_24.svg";
  if (/filter|필터/.test(key)) return iconAssetPath("ui/filter.svg");
  if (/favorite|heart|save|찜|하트/.test(key)) return iconAssetPath("ui/heart.svg");
  if (/search|검색/.test(key)) return iconAssetPath("ui/search.svg");
  if (/call|phone|전화/.test(key)) return iconAssetPath("ui/card-call.svg");
  return "";
}

function resolveIconPath(path) {
  const rawPath = String(path || "").trim();
  if (!rawPath) return "";
  if (/^(data:|https?:|blob:)/i.test(rawPath)) return rawPath;

  const slash = "/";
  const assetSegment = "assets";
  const assetMarker = `${slash}${assetSegment}${slash}`;
  const assetIndex = rawPath.indexOf(assetMarker);
  if (assetIndex >= 0) {
    return iconAssetPath(rawPath.slice(assetIndex + assetMarker.length));
  }

  return rawPath;
}

function iconAssetPath(path) {
  const cleanPath = String(path || "").replace(/^\/+/, "");
  return `${getSiteRootPath()}assets/${cleanPath}`;
}

function getSiteRootPath() {
  const pathname = window.location?.pathname || "/";
  const designSystemIndex = pathname.indexOf("/design-system");
  if (designSystemIndex <= 0) return "/";
  return `${pathname.slice(0, designSystemIndex)}/`;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value = "") {
  return escapeHtml(value);
}

function getIconGlyph(name) {
  if (name.includes("닫") || name.includes("엑스") || name.includes("close")) return "X";
  if (name.includes("필터")) return "F";
  if (name.includes("찜")) return "H";
  if (name.includes("전화")) return "T";
  if (name.includes("채팅")) return "C";
  if (name.includes("위치")) return "L";
  if (name.includes("등록")) return "D";
  return "I";
}
