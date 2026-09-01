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
  "System Installation": "설치 가이드",
  "Guide to Web Components": "웹 컴포넌트 가이드",
  "Web Component Basics": "웹 컴포넌트 기본",
  "Style Customization": "스타일 커스터마이징",
  "Light DOM Style Considerations": "라이트 DOM 스타일 고려사항",
  "Working with Forms": "폼 작업",
  "Working with LiveView": "LiveView 작업",
  "React Components": "React 컴포넌트",
  "Next.js SSR": "Next.js SSR",
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
  "Option Icons": "옵션 아이콘",
  "Vehicle Icons": "차량 아이콘",
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
  "plop:component": "컴포넌트 자동 생성 슬롯",
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
  "System Installation": "설치 절차와 의존성 버전입니다.",
  "React Components": "React 환경의 렌더링 예시입니다.",
  "Next.js SSR": "SSR 환경의 렌더링 기준입니다.",
  "Design Tokens": "색상, 글꼴, 간격을 코드 값으로 관리합니다.",
  Icons: "아이콘 이름과 크기 규칙입니다.",
  Breadcrumb: "현재 페이지 위치와 상위 이동 경로를 보여주는 탐색 컴포넌트입니다.",
  Filter: "차량 조건을 선택하고 해제하는 필터입니다.",
  Gallery: "차량 사진과 영상을 탐색하는 영역입니다.",
  Save: "매물을 저장하거나 해제하는 버튼입니다.",
  Accessibility: "누구나 탐색하고 문의할 수 있게 하는 기준입니다.",
  "Color Contrast": "텍스트와 배경의 최소 대비 기준입니다.",
};

const holdItems = new Set([]);
const requiredItems = new Set([
  "Home", "Web Installation & Usage", "System Installation", "Guide to Web Components", "Web Component Basics",
  "Style Customization", "Working with Forms", "React Components", "AI Agent Skill", "Changelog",
  "Design Tokens", "Color", "Font", "Spacing", "Size", "Elevation", "Motion", "Breakpoints", "Icons",
  "UI Icons", "Option Icons", "Vehicle Icons",
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
      "System Installation",
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
      "React Components",
      "Next.js SSR",
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
      { title: "Option Icons", href: "#style-guide-icons-option-icons" },
      { title: "Vehicle Icons", href: "#style-guide-icons-vehicle-icons" },
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
  "Range Dual": ["최소값", "최대값", "범위 입력"],
  Tabs: ["상세정보", "성능점검", "보험이력"],
  Notification: ["성공", "오류", "가격 변동"],
  "보배드림 운영": ["등록", "수정", "검토"],
  Icons: ["UI 아이콘", "옵션 아이콘", "차량 아이콘"],
  "UI Icons": ["검색", "닫기", "필터"],
  "Option Icons": ["편의 옵션", "안전 옵션", "상태 표시"],
  "Vehicle Icons": ["차종", "브랜드", "카테고리"],
};

const fuseGroups = [
  ["Home", "첫 화면", ["Home"]],
  ["Web Installation & Usage", "설치와 개발 적용", [
    "Web Installation & Usage", ["System Installation", "Web Installation & Usage"], ["Guide to Web Components", "Web Installation & Usage"],
    ["Web Component Basics", "Guide to Web Components"], ["Style Customization", "Guide to Web Components"],
    ["Light DOM Style Considerations", "Guide to Web Components"], ["Working with Forms", "Guide to Web Components"],
    ["Working with LiveView", "Guide to Web Components"], ["React Components", "Web Installation & Usage"],
    ["Next.js SSR", "Web Installation & Usage"], ["AI Agent Skill", "Web Installation & Usage"],
    ["Changelog", "Web Installation & Usage"], ["Migrating From Spark", "Web Installation & Usage"],
    ["Design Tokens", "Migrating From Spark"], ["Typography", "Migrating From Spark"], ["Forms", "Migrating From Spark"],
    ["Dimensions/Layout", "Migrating From Spark"], ["Lists", "Migrating From Spark"], ["Buttons", "Migrating From Spark"],
  ]],
  ["Style Guide", "토큰과 시각 기준", [
    "Style Guide", ["Design Tokens", "Style Guide"], ["Installation", "Design Tokens"], ["Schema", "Design Tokens"],
    ["Color", "Design Tokens"], ["Font", "Design Tokens"], ["Spacing", "Design Tokens"], ["Size", "Design Tokens"],
    ["Elevation", "Design Tokens"], ["Motion", "Design Tokens"], ["Breakpoints", "Design Tokens"], ["Icons", "Style Guide"],
    ["UI Icons", "Icons"], ["Option Icons", "Icons"], ["Vehicle Icons", "Icons"],
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
    ["plop:component", "Components"],
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
    ["Context sheet", "Sheet"], ["Focus sheet", "Sheet"], "Signal", "Snackbar", "State layer", "Tab", "Table", "Tip",
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
    description: "검색, 닫기, 필터, 목록, 찜처럼 화면 조작에 직접 쓰는 아이콘입니다.",
    folder: "ui",
    files: [
      "back.svg",
      "bookmark.svg",
      "card-call.svg",
      "card-heart.svg",
      "card-message.svg",
      "card-more.svg",
      "card-view.svg",
      "category-chevron-down.svg",
      "category-chevron-right.svg",
      "category-sheet-close.svg",
      "chevron-down.svg",
      "chotot-heart.svg",
      "close.svg",
      "filter.svg",
      "heart-outline.svg",
      "heart.svg",
      "list.svg",
      "location-blue.svg",
      "location-gray.svg",
      "message.svg",
      "notion-chevron-right.svg",
      "notion-close.svg",
      "notion-filter.svg",
      "notion-list.svg",
      "notion-search.svg",
      "photo-count.svg",
      "region-chevron.svg",
      "search.svg",
      "sheet-chevron.svg",
      "sheet-close.svg",
      "sort-arrow.svg",
      "views.svg",
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
    title: "차량 아이콘",
    description: "차종, 카테고리, 제조사 로고처럼 차량 분류에 쓰는 아이콘입니다.",
    folder: "categories",
    files: [
      "used-car.svg",
      "truck.svg",
      "bike.svg",
      "camping.svg",
      "construction.svg",
      "old-car.svg",
      "parts.svg",
      "../brand/audi.svg",
      "../brand/benz.png",
      "../brand/bmw.svg",
      "../brand/jaguar.png",
      "../brand/land-rover.svg",
      "../brand/lexus.svg",
      "../brand/lincoln.png",
      "../brand/mini.svg",
      "../brand/porsche-symbol.png",
      "../brand/porsche.png",
    ],
  },
];

const assetIconRegistryItems = iconLibraryGroups.flatMap((group) =>
  group.files.map((file) => {
    const extension = iconFileExtension(file);
    const iconName = iconDisplayName(group.id, file);
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
      props: `group:${group.id}, ${extension}, download, white background, alt text`,
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
    standard: "--color-primary",
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
    standard: "--bp-mobile",
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
    standard: "ic_action_filter_24.svg",
    status: "등록완료",
    platform: "공통",
    sheet: "07_아이콘명칭규칙",
    pcValue: "24px",
    moValue: "24px",
    props: "width, height, stroke, active color, hit area",
    note: "필터 버튼과 칩에 사용",
    iconPath: iconAssetPath("ui/filter.svg"),
    iconFileName: "filter.svg",
  },
  {
    id: "icon-favorite",
    type: "아이콘",
    name: "찜 아이콘",
    standard: "ic_action_favorite_24.svg",
    status: "등록완료",
    platform: "공통",
    sheet: "07_아이콘명칭규칙",
    pcValue: "24px",
    moValue: "24px",
    props: "outline, active fill, scale animation",
    note: "매물 카드와 상세 상단 공통",
    iconPath: iconAssetPath("ui/heart.svg"),
    iconFileName: "heart.svg",
  },
  {
    id: "icon-filter-chip-close",
    type: "아이콘",
    name: "필터 칩 닫기 아이콘",
    standard: "ic_filter_chip_close_24.svg",
    status: "등록완료",
    platform: "공통",
    sheet: "07_아이콘명칭규칙",
    pcValue: "24px",
    moValue: "24px",
    props: "width, height, fill, color, hit area, aria-label",
    note: "선택된 필터 칩을 해제할 때 사용",
    iconPath: "./icons/ic_filter_chip_close_24.svg",
    iconFileName: "ic_filter_chip_close_24.svg",
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

const STATIC_ROUTE_SECTIONS = new Map([
  ["#home", ["overview", "catalog"]],
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
  docPage: document.querySelector("#docPage"),
  pageSections: [...document.querySelectorAll("main.page > .section")],
  metricGrid: document.querySelector("#metricGrid"),
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
};

let formBaseline = "";
let pendingConfirm = null;
let previousFocus = null;

document.addEventListener("DOMContentLoaded", async () => {
  bindEvents();
  restoreSidebarState();
  await hydrateItemsFromRepoData();
  renderAll();
  captureFormBaseline();
});

function bindEvents() {
  window.addEventListener("hashchange", renderSidebar);
  window.addEventListener("resize", handleSidebarViewportChange);
  document.addEventListener("click", handleTableAction);
  document.addEventListener("click", handleSectionScrollClick);
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
  syncIconUploadVisibility();
  syncActiveNav();
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
    items = mergeSeedItems([...items, ...repoItems]);
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
  const seenStandards = new Set();

  return sourceItems
    .map((item) => normalizeRegistryItem(item))
    .filter((item) => {
      const standardKey = item.standard.toLowerCase();
      if (seenIds.has(item.id) || seenStandards.has(standardKey)) return false;
      seenIds.add(item.id);
      seenStandards.add(standardKey);
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

  return {
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
    createdAt: item.createdAt || item.updatedAt || now,
    updatedAt: item.updatedAt || now,
    archived: Boolean(item.archived),
  };
}

function mergeSeedItems(sourceItems = []) {
  const normalized = normalizeRegistryItems(sourceItems);
  const seenIds = new Set(normalized.map((item) => item.id));
  const seenStandards = new Set(normalized.map((item) => item.standard.toLowerCase()));
  const missingSeeds = cloneSeedItems().filter((item) => {
    const standardKey = item.standard.toLowerCase();
    return !seenIds.has(item.id) && !seenStandards.has(standardKey);
  });
  return [...normalized, ...missingSeeds];
}

function activeItems() {
  return items.filter((item) => !item.archived);
}

function renderAll() {
  renderSidebar();
  renderMetrics();
  renderReferences();
  renderCatalogs();
  renderCards();
  renderRegistry();
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

function renderSidebarList(nodes, query = "", activeHash = currentRouteHash()) {
  return `
    <ul class="fuse-nav-list">
      ${nodes.map((node) => renderSidebarItem(node, query, activeHash)).join("")}
    </ul>
  `;
}

function renderSidebarItem(node, query = "", activeHash = currentRouteHash()) {
  const hasChildren = node.children.length > 0;
  const nodeLabel = displayNodeName(node);
  const isActive = node.href === activeHash;
  const isExpanded = Boolean(query) || node.depth === 0 || nodeContainsHash(node, activeHash);
  const sectionLinks = !query && isActive ? renderSidebarPageSections(node) : "";
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
    <li class="fuse-nav-item">
      <a
        class="${classNames}"
        href="${escapeHtml(node.href)}"
        data-sidebar-id="${escapeHtml(node.id)}"
        data-doc-title="${escapeHtml(node.title)}"
        data-doc-route="${isDocumentRoute(node) ? "true" : "false"}"
        title="${escapeAttribute(nodeLabel)}"
        aria-label="${escapeAttribute(nodeLabel)}"
        style="padding-left:${10 + node.depth * 14}px"
      >
        <span class="nav-content">
          ${hasChildren ? '<span class="nav-caret" aria-hidden="true">›</span>' : ""}
          <span class="nav-name">${highlightText(nodeLabel, query)}</span>
        </span>
        ${node.status === "deprecated" ? '<em class="nav-status">deprecated</em>' : ""}
      </a>
      ${hasChildren && isExpanded ? renderSidebarList(node.children, query, activeHash) : ""}
      ${sectionLinks}
    </li>
  `;
}

function nodeContainsHash(node, hash) {
  return node.href === hash || node.children.some((child) => nodeContainsHash(child, hash));
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

function isDocumentRoute(node) {
  return node.status !== "custom" || !["#registry", "#workflow", "#component-showcase", "#preview"].includes(node.href);
}

function handleSidebarClick(event) {
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
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  if (button.closest(".sidebar")) closeSidebar();
}

function openSidebar() {
  document.body.classList.add("sidebar-open");
  if (window.innerWidth > 760) setSidebarCollapsed(false);
  elements.menuToggle.setAttribute("aria-expanded", "true");
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
  elements.menuToggle.textContent = collapsed ? "메뉴 열기" : "메뉴";
  elements.menuToggle.setAttribute("aria-label", collapsed ? "좌측 메뉴 열기" : "좌측 메뉴");
  elements.collapseSidebar.setAttribute("aria-expanded", String(!collapsed));
  elements.collapseSidebar.setAttribute("aria-label", collapsed ? "좌측 메뉴 열기" : "좌측 메뉴 접기");
  elements.collapseSidebar.textContent = collapsed ? "열기" : "접기";
  if (shouldPersist) localStorage.setItem(SIDEBAR_COLLAPSE_KEY, collapsed ? "true" : "false");
}

function restoreSidebarState() {
  if (window.innerWidth <= 760) {
    document.body.classList.remove("sidebar-collapsed");
    elements.menuToggle.textContent = "메뉴 열기";
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
  if (node.title === "Breadcrumb") {
    renderBreadcrumbDocumentPage(node);
    return;
  }

  const statusLabel = node.status === "deprecated" ? "deprecated" : node.status === "custom" ? "보배드림 운영" : "stable";
  const path = node.path?.join(" / ") || displayNodeName(node);
  const profile = documentProfileForNode(node);

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
        <p class="doc-lede">${escapeHtml(profile.lede)}</p>
        <p class="doc-sublede">${escapeHtml(profile.sublede)}</p>

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

        <section class="component-doc-section" id="doc-examples">
          <h3>Examples</h3>
          ${renderDocExamples(profile.examples)}
          ${renderSpecializedDoc(node)}
        </section>

        <section class="component-doc-section" id="doc-api">
          <h3>API</h3>
          ${renderDocPropsTable(profile.props)}
        </section>

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

        <section class="component-doc-section" id="doc-accessibility">
          <h3>Accessibility</h3>
          <ul class="doc-checklist">
            ${profile.accessibility.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
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
  const label = displayName(node.title);
  const parent = node.path?.at(-2) || "";
  const top = node.path?.[0] || node.title;
  const useCases = bobaedreamUseCases[node.title] || [`${label} 기본`, `${label} 상태`, `${label} 반응형`];
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
  const label = displayName(node.title);
  if (category === "component") return `${label}은 보배드림 화면에서 반복되는 사용자 행동을 일관된 UI로 제공하는 항목입니다.`;
  if (category === "style") return `${label}은 보배드림 화면의 시각 기준을 토큰과 사용 규칙으로 정리한 항목입니다.`;
  if (category === "accessibility") return `${label}은 모든 사용자가 중고차 정보를 탐색하고 문의할 수 있도록 보장하는 기준입니다.`;
  if (category === "resource") return `${label}은 디자인 시스템을 운영하고 수정할 때 참고하는 내부 자료입니다.`;
  return catalogNote(node.title, node.path?.at(-2) || "");
}

function subledeForDocument(node, category) {
  if (category === "component") return "예시, 상태, 속성, 접근성 기준을 먼저 확인하고 화면에 적용합니다.";
  if (category === "style") return "값 자체보다 언제 어떤 화면에 쓰는지 먼저 판단할 수 있게 정리합니다.";
  if (category === "accessibility") return "키보드, 스크린리더, 터치 조작, 명도 대비를 함께 확인합니다.";
  if (category === "resource") return "레퍼런스와 운영 도구는 이 영역에 모아 본문 문서가 산만해지지 않게 관리합니다.";
  return "필요한 정보만 짧게 확인하고 바로 구현할 수 있게 구성합니다.";
}

function overviewForDocument(node, category) {
  const label = displayName(node.title);
  if (category === "style") {
    return [
      ["정의", `${label} 기준은 색, 글꼴, 간격, 상태처럼 반복되는 시각 결정을 통일합니다.`],
      ["목적", "디자인과 코드가 같은 이름을 사용해 화면 편차를 줄입니다."],
      ["사용 위치", "매물 목록, 상세, 등록, 검색 필터, 마이페이지 화면 전반에 적용합니다."],
    ];
  }
  if (category === "accessibility") {
    return [
      ["정의", `${label}은 사용자가 정보를 놓치지 않고 조작할 수 있게 하는 품질 기준입니다.`],
      ["목적", "탐색, 문의, 등록 과정에서 키보드와 보조기술 사용성을 보장합니다."],
      ["사용 위치", "링크, 폼, 필터, 차량 이미지, CTA가 있는 모든 화면에 적용합니다."],
    ];
  }
  if (category === "resource") {
    return [
      ["정의", `${label}은 디자인 시스템 관리자가 항목을 수정하고 검수할 때 쓰는 자료입니다.`],
      ["목적", "외부 참고, QA, Storybook, 등록 데이터를 문서 본문과 분리해 관리합니다."],
      ["사용 위치", "운영 회의, 컴포넌트 등록, 배포 전 검수, 문서 업데이트에 사용합니다."],
    ];
  }
  return [
    ["정의", `${label}은 보배드림 중고차 서비스에서 반복되는 UI 단위입니다.`],
    ["목적", "사용자가 차량 정보를 빠르게 이해하고 다음 행동으로 이동하게 돕습니다."],
    ["사용 위치", "매물 목록, 차량 상세, 검색 결과, 매물 등록 흐름에서 사용합니다."],
  ];
}

function examplesForDocument(node, useCases, category) {
  const label = displayName(node.title);
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
  if (category === "style") {
    return useCases.map((item) => [`${item}`, `${label} 값을 보배드림 화면 토큰으로 적용합니다.`]);
  }
  return useCases.map((item) => [`${item}`, `${label} 문서의 실제 화면 예시입니다.`]);
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
  const label = displayName(node.title);
  if (category === "style") {
    return [
      ["사용", `${label} 값은 토큰명으로 적용하고 화면별 임의 값을 줄입니다.`],
      ["변경", "값을 바꿀 때는 영향 화면과 Storybook 예시를 함께 확인합니다."],
      ["금지", "동일 역할의 값을 새 이름으로 중복 생성하지 않습니다."],
    ];
  }
  if (category === "resource") {
    return [
      ["사용", "운영 자료는 Resources에 모아 문서 본문과 분리합니다."],
      ["수정", "항목 변경은 등록/수정 폼에서 표준명, 상태, 메모를 함께 남깁니다."],
      ["금지", "개별 컴포넌트 본문에 외부 참고 문구를 길게 노출하지 않습니다."],
    ];
  }
  return [
    ["사용", `${label}은 사용자가 다음 행동을 예측할 수 있는 위치에 배치합니다.`],
    ["상태", "기본, 선택, 비활성, 오류, 포커스 상태를 구분합니다."],
    ["금지", "진행률, 도움말, 광고 문구처럼 역할이 다른 정보를 섞지 않습니다."],
  ];
}

function accessibilityForDocument(node, category) {
  if (category === "style") {
    return [
      "색상은 텍스트 대비 기준을 먼저 확인합니다.",
      "모션과 상태 변화는 정보 전달 목적이 있을 때만 사용합니다.",
      "반응형에서 글자와 컨트롤이 겹치지 않는지 확인합니다.",
    ];
  }
  if (category === "resource") {
    return [
      "운영 화면의 버튼과 링크는 키보드로 접근 가능해야 합니다.",
      "등록/수정 폼은 오류 메시지를 필드와 연결합니다.",
      "QA 문서는 모바일 390px과 데스크톱 1440px을 함께 확인합니다.",
    ];
  }
  return [
    "키보드 Tab 순서가 화면 순서와 일치해야 합니다.",
    "아이콘만 있는 컨트롤은 접근성 이름을 제공합니다.",
    "모바일 터치 영역은 44px 이상을 권장합니다.",
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
  if (node.title === "Icons" || node.title === "UI Icons" || node.title === "Option Icons" || node.title === "Vehicle Icons") {
    return renderIconsDoc(node);
  }
  if (node.title === "Spacing") return renderSpacingDoc(node);
  if (node.title === "References") return renderReferencesDoc();
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
      <p>아이콘은 UI, 옵션, 차량 3개 그룹으로 관리합니다. 각 아이콘은 흰 배경에서 확인하고 바로 다운로드합니다.</p>
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
      <div class="doc-icon-groups">
        ${groups.map((group) => renderIconGroup(group)).join("")}
      </div>
    </div>
  `;
}

function renderIconGroup(group) {
  return `
    <section class="doc-icon-group">
      <div class="doc-icon-group-header">
        <div>
          <h4>${escapeHtml(group.title)}</h4>
          <p>${escapeHtml(group.description)}</p>
        </div>
        <span>${group.items.length}개</span>
      </div>
      <div class="doc-icon-grid">
        ${group.items
          .map(
            (item) => `
              <article>
                ${renderIconVisual(item, "doc-icon-preview")}
                <strong>${escapeHtml(item.name)}</strong>
                <code>${escapeHtml(item.standard)}</code>
                ${renderIconDownloadLink(item)}
              </article>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function iconGroupIdForNode(node) {
  if (node.title === "Icons") return "all";
  if (node.title === "UI Icons") return "ui";
  if (node.title === "Option Icons") return "option";
  if (node.title === "Vehicle Icons") return "vehicle";
  return "";
}

function renderMetrics() {
  const groups = ["토큰", "템플릿", "컴포넌트", "아이콘", "버튼"];
  const visibleItems = activeItems();
  elements.metricGrid.innerHTML = groups
    .map((group) => {
      const count = visibleItems.filter((item) => item.type === group).length;
      return `<article class="metric-card"><strong>${count}</strong><span>${escapeHtml(group)} 등록 항목</span></article>`;
    })
    .join("");
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
      ([title, description, entries]) => `
        <article class="catalog-group">
          <h4>${escapeHtml(displayName(title))}</h4>
          <p>${escapeHtml(description)}</p>
          <div class="catalog-items">
            ${entries.map((entry) => renderCatalogItem(entry)).join("")}
          </div>
        </article>
      `,
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
        <strong>${escapeHtml(displayName(label))}</strong>
        <em>${status.label}</em>
      </div>
      ${parent ? `<small>${escapeHtml(parent)} 하위 항목</small>` : ""}
      <p>${escapeHtml(catalogNote(label, parent))}</p>
    </article>
  `;
}

function displayName(label) {
  const koreanName = koreanNames[label];
  return koreanName && koreanName !== label ? `${label} (${koreanName})` : label;
}

function catalogNote(label, parent) {
  if (holdItems.has(label)) {
    return `${displayName(label)}은 보류 항목입니다. 대체 컴포넌트를 검토합니다.`;
  }
  if (catalogNotes[label]) return catalogNotes[label];
  return `${displayName(label)}은 ${parent ? `${parent}에서 쓰는 ` : ""}보배드림 UI 항목입니다.`;
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
  return `
    <tr>
      <td><span class="registry-tag">${escapeHtml(item.type)}</span></td>
      <td>${renderIconVisual(item)}</td>
      <td>
        <strong>${highlightText(item.name, query)}</strong>
        <br>
        <small>${highlightText(item.props || "", query)}</small>
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
          <dd><strong>${highlightText(item.name, query)}</strong></dd>
        </div>
        <div>
          <dt>표준명</dt>
          <dd><code>${highlightText(item.standard, query)}</code></dd>
        </div>
        <div>
          <dt>주요 속성</dt>
          <dd>${highlightText(item.props || "-", query)}</dd>
        </div>
      </dl>
      ${renderRegistryActions(item.id)}
    </article>
  `;
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
    .replace(/\.svg$/i, "")
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
  const header = ["구분", "항목명", "표준명", "상태", "플랫폼", "Sheet탭", "PC값", "MO값", "주요속성", "비고"];
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

  if (route.type === "document") {
    renderDocumentPage(route.node);
    setVisibleSections(["docPage"]);
  } else {
    elements.docPage.innerHTML = "";
    setVisibleSections(route.sectionIds);
  }

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === hash);
  });

  const activeLink = document.querySelector(".fuse-nav-link.active");
  const scroller = elements.sidebar?.querySelector(".sidebar-scroll");
  if (activeLink && scroller && !elements.sidebarSearch.value.trim() && window.innerWidth > 760) {
    scroller.scrollTop = Math.max(0, activeLink.offsetTop - 170);
  }
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
  const label = item.name || item.standard || "아이콘";
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
  if (item.iconData?.startsWith("data:image/svg+xml")) return item.iconData;
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
      aria-label="${escapeAttribute(`${item.name || item.standard} ${downloadLabel}`)}"
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
  };
  const uiNames = {
    back: "뒤로가기",
    bookmark: "북마크",
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
    views: "조회수",
  };

  if (groupId === "option") {
    const optionMatch = baseName.match(/^option-(\d+)$/);
    if (optionMatch) return `옵션 ${optionMatch[1]} 아이콘`;
    if (baseName === "option-smart-key") return "스마트키 옵션 아이콘";
    if (baseName === "option-info") return "옵션 정보 아이콘";
    return `${baseName.replace(/-/g, " ")} 옵션 아이콘`;
  }
  if (groupId === "vehicle") return `${vehicleBrandNames[baseName] || vehicleCategoryNames[baseName] || baseName.replace(/-/g, " ")} 아이콘`;
  return `${uiNames[baseName] || baseName.replace(/-/g, " ")} 아이콘`;
}

function resolveIconGroup(item) {
  const haystack = [item.props, item.iconPath, item.standard, item.name].join(" ").toLowerCase();
  if (haystack.includes("group:option") || /option-|option_|option\b|옵션/.test(haystack)) return "option";
  if (haystack.includes("group:vehicle") || /categories|brand|vehicle|car|truck|bike|camping|차량|브랜드/.test(haystack)) return "vehicle";
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
