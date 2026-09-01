const STORAGE_KEY = "bobaedream-design-system-registry-v1";

const references = [
  {
    name: "Cars.com Fuse",
    focus: "자동차 플랫폼 디자인 시스템 목차와 컴포넌트 구조",
    apply: "공개 사이드바 전체 항목, Icons, Breadcrumb, Filter, Gallery, Save, Range Dual",
    url: "https://fuse.cars.com/",
  },
  {
    name: "Seed Design",
    focus: "한국어 중심 컴포넌트 설명, Anatomy, Properties, Guidelines 구조",
    apply: "영문명+한국어명 병기, 항목별 정의와 사용 기준 설명 방식",
    url: "https://seed-design.io/",
  },
  {
    name: "Google Material 3",
    focus: "토큰, 컴포넌트, 상태, 접근성 기준",
    apply: "필터 칩, 버튼 상태, 컬러 토큰, 모션 토큰",
    url: "https://m3.material.io/",
  },
  {
    name: "Apple HIG",
    focus: "모바일 터치 영역, safe area, 네이티브 앱 패턴",
    apply: "상세 하단 CTA, iOS safe area, 앱 탭 구조",
    url: "https://developer.apple.com/design/human-interface-guidelines/",
  },
  {
    name: "Shopify Polaris",
    focus: "운영형 서비스 컴포넌트와 상태 배지",
    apply: "판매자 관리, 등록 폼, 상태 라벨",
    url: "https://shopify.dev/docs/api/polaris",
  },
  {
    name: "eBay Evo Design System",
    focus: "마켓플레이스 카드, 리스트, 칩, 입력 컴포넌트",
    apply: "매물 카드, 가격 강조, 뱃지, 리스트 밀도",
    url: "https://playbook.ebay.com/design-system/components",
  },
  {
    name: "IBM Carbon",
    focus: "색상, spacing, 토큰, 컴포넌트 문서 구조",
    apply: "측정 속성 사전, spacing scale, 상태별 명세",
    url: "https://carbondesignsystem.com/",
  },
  {
    name: "GOV.UK Design System",
    focus: "접근성, 폼, 오류 메시지, 사용자 과업 중심 패턴",
    apply: "등록 폼 오류, 필수값, 도움말 문구",
    url: "https://design-system.service.gov.uk/",
  },
  {
    name: "Storybook",
    focus: "컴포넌트 실물 뷰어와 상태별 예제",
    apply: "보배드림 DS 스토리, 문서, 접근성 검사",
    url: "https://storybook.js.org/",
  },
  {
    name: "Chromatic",
    focus: "시각 회귀 테스트와 승인 워크플로",
    apply: "PR/배포 전 화면 변경 비교와 리뷰 이력",
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
  Toolbox: "툴박스",
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
  Home: "디자인 시스템 첫 화면으로 목적, 바로가기, 최신 변경 이력을 노출합니다.",
  "Web Installation & Usage": "설치, 프레임워크 적용, 마이그레이션 방법을 확인하는 시작 영역입니다.",
  "Design Tokens": "색상, 폰트, 간격, 크기, 그림자, 모션, 반응형 분기점을 코드 변수로 관리합니다.",
  Icons: "Fuse의 material, custom, cars-duotone, social, oem 구조를 보배드림 아이콘 명칭 체계로 변환합니다.",
  Breadcrumb: "홈에서 현재 매물/카테고리까지의 정보 구조를 보여주는 탐색 컴포넌트입니다.",
  Filter: "상단 필터, 사이드 필터, 모바일 바텀시트 필터의 공통 동작 기준입니다.",
  Gallery: "상세 대표 이미지, 스와이프, 전체보기, 영상 진입을 관리합니다.",
  Save: "찜하기, 저장 매물, 비교 후보 저장의 활성/비활성 상태를 관리합니다.",
  Accessibility: "색상, 키보드, 문서 구조, 대체 텍스트, 모바일 조작성의 접근성 기준입니다.",
  "Color Contrast": "색상 조합별 대비 수치를 기록하고 실패 조합은 사용 금지합니다.",
};

const holdItems = new Set(["Modal", "Price Range", "CCD"]);
const requiredItems = new Set([
  "Home", "Web Installation & Usage", "Installing Fuse", "Guide to Web Components", "Web Component Basics",
  "Style Customization", "Working with Forms", "Fuse Components in React", "AI Agent Skill", "Changelog",
  "Design Tokens", "Color", "Font", "Spacing", "Size", "Elevation", "Motion", "Breakpoints", "Icons",
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
      "Icons",
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
    children: ["Toolbox"],
  },
  customSidebarItem("Bobaedream Admin", "#registry", [
    customSidebarItem("Registry", "#registry"),
    customSidebarItem("Measurement Master", "#workflow"),
    customSidebarItem("Vehicle Listing Patterns", "#components"),
    customSidebarItem("Vehicle Detail Patterns", "#preview"),
    customSidebarItem("Filter Patterns", "#preview"),
    customSidebarItem("AI Measurement Workflow", "#workflow"),
  ]),
]);

const bobaedreamUseCases = {
  Filter: ["연식, 주행거리, 가격, 지역, 제조사 필터", "PC 사이드 필터와 모바일 바텀시트 필터", "선택 조건 칩과 결과 수 동기화"],
  Card: ["매물 카드", "리스트형/갤러리형/추천 매물 카드", "썸네일, 가격, 신뢰 배지, 판매자 메타 조합"],
  Gallery: ["차량 사진 영역", "상세 대표 이미지와 썸네일 rail", "동영상 진입, 전체보기, 사진 개수 표시"],
  Badge: ["무사고, 진단, 급매, 실매물", "가격인하, 브랜드인증, 판매완료 상태", "카드와 상세 상단의 신뢰 신호"],
  Save: ["찜 버튼", "매물 카드/상세 상단/하단 CTA 저장 상태", "저장 완료 알림과 active 피드백"],
  Pagination: ["매물 리스트 페이지 이동", "SEO 페이지네이션과 이전/다음 버튼", "모바일 더보기 전환 기준"],
  "Range Dual": ["가격/주행거리 범위 선택", "연식 시작/끝 선택", "바텀시트 내 최소/최대 입력 동기화"],
  Tabs: ["상세정보, 성능점검, 보험이력", "딜러 정보와 리뷰 전환", "sticky anchor tab과 aria 연결"],
  Notification: ["견적/문의/오류 알림", "찜 저장 완료와 가격 변동 안내", "등록 폼 검증 결과 피드백"],
  "Bobaedream Admin": ["컴포넌트 등록/수정", "측정 마스터 관리", "AI 측정 워크플로우 운영"],
};

const fuseGroups = [
  ["Home", "Cars.com Fuse 공개 사이드바의 첫 진입점", ["Home"]],
  ["Web Installation & Usage", "설치, Web Components, React/SSR, AI Agent Skill, 마이그레이션 전체", [
    "Web Installation & Usage", ["Installing Fuse", "Web Installation & Usage"], ["Guide to Web Components", "Web Installation & Usage"],
    ["Web Component Basics", "Guide to Web Components"], ["Style Customization", "Guide to Web Components"],
    ["Light DOM Style Considerations", "Guide to Web Components"], ["Working with Forms", "Guide to Web Components"],
    ["Working with LiveView", "Guide to Web Components"], ["Fuse Components in React", "Web Installation & Usage"],
    ["Fuse in Next.js (SSR)", "Web Installation & Usage"], ["AI Agent Skill", "Web Installation & Usage"],
    ["Changelog", "Web Installation & Usage"], ["Migrating From Spark", "Web Installation & Usage"],
    ["Design Tokens", "Migrating From Spark"], ["Typography", "Migrating From Spark"], ["Forms", "Migrating From Spark"],
    ["Dimensions/Layout", "Migrating From Spark"], ["Lists", "Migrating From Spark"], ["Buttons", "Migrating From Spark"],
  ]],
  ["Style Guide", "토큰, 아이콘, 폼, 이미지, 레이아웃, 타이포그래피, 사용성, 시각 언어", [
    "Style Guide", ["Design Tokens", "Style Guide"], ["Installation", "Design Tokens"], ["Schema", "Design Tokens"],
    ["Color", "Design Tokens"], ["Font", "Design Tokens"], ["Spacing", "Design Tokens"], ["Size", "Design Tokens"],
    ["Elevation", "Design Tokens"], ["Motion", "Design Tokens"], ["Breakpoints", "Design Tokens"], ["Icons", "Style Guide"],
    ["Forms", "Style Guide"], ["Imagery", "Style Guide"], ["Layout", "Style Guide"], ["Spacing", "Style Guide"],
    ["Typography & Headings", "Style Guide"], ["Usability Standards", "Style Guide"], ["Visual Language", "Style Guide"],
  ]],
  ["Components", "Cars.com Fuse 공개 컴포넌트 목록 전체. 취소선 항목도 보류 상태로 보존", [
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
  ["Principles", "디자인 원칙과 모션 원칙", ["Principles", ["Design Principles", "Principles"], ["Motion Principles", "Principles"]]],
  ["Content Strategy", "콘텐츠 전략, 보이스톤, 문법, 용어", [
    "Content Strategy", ["Content Strategy Principles", "Content Strategy"], ["Voice and Tone", "Content Strategy"],
    ["Grammar and Mechanics", "Content Strategy"], ["Vocabulary", "Content Strategy"],
  ]],
  ["Accessibility", "접근성 원칙, 체크리스트 세부 항목, 색상 대비", [
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
  ["Resources", "운영 도구와 참고 자료", ["Resources", ["Toolbox", "Resources"]]],
];

const ebayGroups = [
  ["Design System", "eBay Playbook 디자인 시스템 상위 정보 구조", ["Overview", "Principles", "Tokens", "Components", "Patterns", "Processes", "Change log"]],
  ["Tokens", "eBay Playbook 공개 토큰 카테고리", ["Overview", "Change log", "Theming", "Color", "Dimension", "Spacing", "Typography", "Breakpoints", "Shadow", "Shape", "Opacity", "Motion", "Illustration"]],
  ["Components", "eBay Playbook 공개 컴포넌트 카테고리와 하위 분류", [
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
  ["Patterns", "eBay Playbook 공개 패턴 분류", ["Overview", "Bulk editing", "Creating forms", "Empty states", "Filtering", "Requesting user feedback", "Uploading files", "Using links", ["Text link", "Using links"], ["Legal link", "Using links"]]],
];

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
  {
    id: "token-spacing",
    type: "토큰",
    name: "Spacing Token",
    standard: "--space-12",
    status: "검토필요",
    platform: "공통",
    sheet: "06_디자인토큰마스터",
    pcValue: "12px",
    moValue: "12px",
    props: "margin, padding, gap",
    note: "필터 칩과 썸네일 간격 우선 측정",
  },
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
    note: "Fuse Filter를 보배드림 연식/주행거리/가격/지역/제조사 필터로 연결",
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
  },
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

const elements = {
  sidebar: document.querySelector("#designSidebar"),
  sidebarNav: document.querySelector("#sidebarNav"),
  sidebarSearch: document.querySelector("#sidebarSearch"),
  sidebarEmpty: document.querySelector("#sidebarEmpty"),
  menuToggle: document.querySelector("#menuToggle"),
  closeSidebar: document.querySelector("#closeSidebar"),
  sidebarOverlay: document.querySelector("#sidebarOverlay"),
  docPage: document.querySelector("#docPage"),
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
  form: document.querySelector("#registryForm"),
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
  saveButton: document.querySelector("#saveButton"),
  clearButton: document.querySelector("#clearButton"),
  newItemButton: document.querySelector("#newItemButton"),
  exportJsonButton: document.querySelector("#exportJsonButton"),
  exportCsvButton: document.querySelector("#exportCsvButton"),
  importJsonInput: document.querySelector("#importJsonInput"),
  searchInput: document.querySelector("#searchInput"),
  typeFilter: document.querySelector("#typeFilter"),
  resetDataButton: document.querySelector("#resetDataButton"),
  toast: document.querySelector("#toast"),
};

document.addEventListener("DOMContentLoaded", () => {
  renderAll();
  bindEvents();
});

function bindEvents() {
  window.addEventListener("hashchange", syncActiveNav);
  document.addEventListener("click", handleTableAction);
  elements.sidebarNav.addEventListener("click", handleSidebarClick);
  elements.sidebarSearch.addEventListener("input", renderSidebar);
  elements.menuToggle.addEventListener("click", openSidebar);
  elements.closeSidebar.addEventListener("click", closeSidebar);
  elements.sidebarOverlay.addEventListener("click", closeSidebar);
  elements.form.addEventListener("submit", saveItem);
  elements.clearButton.addEventListener("click", clearForm);
  elements.newItemButton.addEventListener("click", () => {
    clearForm();
    document.querySelector("#registry").scrollIntoView({ behavior: "smooth" });
    elements.itemName.focus();
  });
  elements.exportJsonButton.addEventListener("click", exportJson);
  elements.exportCsvButton.addEventListener("click", exportCsv);
  elements.importJsonInput.addEventListener("change", importJson);
  elements.searchInput.addEventListener("input", renderRegistry);
  elements.typeFilter.addEventListener("change", renderRegistry);
  elements.resetDataButton.addEventListener("click", resetData);
  syncActiveNav();
}

function loadItems() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return seedItems;
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return seedItems;
    const storedIds = new Set(parsed.map((item) => item.id));
    return [...parsed, ...seedItems.filter((item) => !storedIds.has(item.id))];
  } catch {
    return seedItems;
  }
}

function persistItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
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
  const visibleTree = filterSidebarTree(fuseSidebarTree, query);
  elements.sidebarEmpty.hidden = visibleTree.length > 0;
  elements.sidebarNav.innerHTML = visibleTree.length ? renderSidebarList(visibleTree) : "";
  syncActiveNav();
}

function renderSidebarList(nodes) {
  return `
    <ul class="fuse-nav-list">
      ${nodes.map((node) => renderSidebarItem(node)).join("")}
    </ul>
  `;
}

function renderSidebarItem(node) {
  const hasChildren = node.children.length > 0;
  const classNames = [
    "nav-link",
    "fuse-nav-link",
    `depth-${node.depth}`,
    hasChildren ? "has-children" : "",
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
        style="padding-left:${10 + node.depth * 14}px"
      >
        <span class="nav-content">
          ${hasChildren ? '<span class="nav-caret" aria-hidden="true">›</span>' : ""}
          <span class="nav-name">${escapeHtml(displayNodeName(node))}</span>
        </span>
        ${node.status === "deprecated" ? '<em class="nav-status">deprecated</em>' : ""}
      </a>
      ${hasChildren ? renderSidebarList(node.children) : ""}
    </li>
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

function sidebarNodeMatches(node, query) {
  return [node.title, node.koTitle, node.href].join(" ").toLowerCase().includes(query);
}

function displayNodeName(node) {
  return `${node.title} (${node.koTitle})`;
}

function isDocumentRoute(node) {
  return node.status !== "custom" || !["#registry", "#workflow", "#components", "#preview"].includes(node.href);
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

function openSidebar() {
  document.body.classList.add("sidebar-open");
  elements.menuToggle.setAttribute("aria-expanded", "true");
}

function closeSidebar() {
  document.body.classList.remove("sidebar-open");
  elements.menuToggle.setAttribute("aria-expanded", "false");
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

  const statusLabel = node.status === "deprecated" ? "deprecated" : node.status === "custom" ? "보배드림 운영" : "stable";
  const useCases = bobaedreamUseCases[node.title] || [
    `${displayNodeName(node)} 문서는 보배드림 화면의 구성요소, 속성, 상태, 사용 기준을 정리합니다.`,
    "디자이너와 개발자가 같은 명칭으로 검색하고 Storybook 예시와 연결합니다.",
    "AI가 측정한 값은 Measurement Master에 저장한 뒤 확정 기준만 문서에 반영합니다.",
  ];
  const path = node.path?.join(" / ") || displayNodeName(node);

  elements.docPage.innerHTML = `
    <div class="doc-page-layout">
      <article class="doc-main">
        <nav class="doc-breadcrumb" aria-label="문서 경로">${escapeHtml(path)}</nav>
        <div class="doc-title-row">
          <div>
            <p class="eyebrow">${node.status === "custom" ? "Bobaedream Admin" : "Fuse Navigation"}</p>
            <h2>${escapeHtml(displayNodeName(node))}</h2>
          </div>
          <span class="doc-status ${escapeHtml(node.status)}">${escapeHtml(statusLabel)}</span>
        </div>
        <p class="doc-lede">${escapeHtml(catalogNote(node.title, node.path?.at(-2) || ""))}</p>
        <div class="doc-rule-grid">
          ${useCases
            .map(
              (item) => `
                <section>
                  <strong>${escapeHtml(item)}</strong>
                  <span>PC 웹, 모바일 웹, 앱 화면에서 같은 토큰과 컴포넌트 명칭으로 관리합니다.</span>
                </section>
              `,
            )
            .join("")}
        </div>
        ${renderIconsDoc(node)}
      </article>
      <aside class="doc-aside">
        <strong>문서 운영 기준</strong>
        <ul>
          <li>영문명과 한국어명을 함께 표기합니다.</li>
          <li>Seed Design처럼 목적, 사용 시점, 상태를 문장으로 남깁니다.</li>
          <li>Cars.com Fuse, eBay Playbook, Seed Design 출처를 함께 기록합니다.</li>
        </ul>
      </aside>
    </div>
  `;
}

function renderIconsDoc(node) {
  if (node.title !== "Icons") return "";

  return `
    <div class="doc-icon-library">
      <h3>아이콘 라이브러리 명칭</h3>
      <p>Fuse의 material, custom, cars-duotone, social, oem 구조를 보배드림 interface, vehicle, commerce, media로 재구성합니다.</p>
      <div class="doc-icon-grid">
        ${items
          .filter((item) => item.type === "아이콘")
          .map(
            (item) => `
              <article>
                <span class="icon-glyph">${getIconGlyph(item.name)}</span>
                <strong>${escapeHtml(item.name)}</strong>
                <code>${escapeHtml(item.standard)}</code>
              </article>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderMetrics() {
  const groups = ["토큰", "컴포넌트", "아이콘", "버튼"];
  elements.metricGrid.innerHTML = groups
    .map((group) => {
      const count = items.filter((item) => item.type === group).length;
      return `<article class="metric-card"><strong>${count}</strong><span>${escapeHtml(group)} 등록 항목</span></article>`;
    })
    .join("");
}

function renderReferences() {
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
  renderCatalog(elements.fuseCatalog, fuseGroups);
  renderCatalog(elements.ebayCatalog, ebayGroups);
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
  return `${label} (${koreanNames[label] || label})`;
}

function catalogNote(label, parent) {
  if (holdItems.has(label)) {
    return `${displayName(label)} 항목은 원문에서 보류/취소선 기준으로 남기고, 보배드림에서는 대체 컴포넌트를 우선 검토합니다.`;
  }
  if (catalogNotes[label]) return catalogNotes[label];
  return `${displayName(label)} 항목은 ${parent ? `${parent} 기준 안에서 ` : ""}보배드림 UI에 맞는 구성요소, 속성, 상태, 사용 규칙을 문서화합니다.`;
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
  elements.tokenCards.innerHTML = items
    .filter((item) => item.type === "토큰")
    .map(
      (item) => `
        <article class="system-card">
          <div class="token-swatch"></div>
          <span class="tag">${escapeHtml(item.status)}</span>
          <h3>${escapeHtml(item.name)}</h3>
          <p><code>${escapeHtml(item.standard)}</code></p>
          <p>PC ${escapeHtml(item.pcValue || "-")} · MO ${escapeHtml(item.moValue || "-")}</p>
        </article>
      `,
    )
    .join("");
}

function renderComponentCards() {
  elements.componentCards.innerHTML = items
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
  elements.iconGrid.innerHTML = items
    .filter((item) => item.type === "아이콘")
    .map(
      (item) => `
        <article class="icon-card">
          <span class="icon-glyph">${getIconGlyph(item.name)}</span>
          <strong>${escapeHtml(item.name)}</strong>
          <small>${escapeHtml(item.standard)}</small>
        </article>
      `,
    )
    .join("");
}

function renderButtonCards() {
  elements.buttonCards.innerHTML = items
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
  elements.stateRow.innerHTML = items
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
  const query = elements.searchInput.value.trim().toLowerCase();
  const type = elements.typeFilter.value;
  const filtered = items.filter((item) => {
    const matchesType = type === "전체" || item.type === type;
    const haystack = [item.type, item.name, item.standard, item.status, item.platform, item.props, item.note]
      .join(" ")
      .toLowerCase();
    return matchesType && (!query || haystack.includes(query));
  });

  elements.registryRows.innerHTML =
    filtered
      .map(
        (item) => `
          <tr>
            <td><span class="registry-tag">${escapeHtml(item.type)}</span></td>
            <td><strong>${escapeHtml(item.name)}</strong><br><small>${escapeHtml(item.props || "")}</small></td>
            <td><code>${escapeHtml(item.standard)}</code></td>
            <td><span class="status" data-status="${escapeHtml(item.status)}">${escapeHtml(item.status)}</span></td>
            <td>${escapeHtml(item.platform)}</td>
            <td>${escapeHtml(item.pcValue || "-")}</td>
            <td>${escapeHtml(item.moValue || "-")}</td>
            <td>
              <div class="row-actions">
                <button type="button" data-action="edit" data-id="${escapeHtml(item.id)}">수정</button>
                <button type="button" data-action="duplicate" data-id="${escapeHtml(item.id)}">복제</button>
                <button class="delete" type="button" data-action="delete" data-id="${escapeHtml(item.id)}">삭제</button>
              </div>
            </td>
          </tr>
        `,
      )
      .join("") || `<tr><td colspan="8">검색 결과가 없습니다.</td></tr>`;
}

function saveItem(event) {
  event.preventDefault();

  const currentId = elements.itemId.value;
  const item = {
    id: currentId || createId(),
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
    updatedAt: new Date().toISOString(),
  };

  if (!item.name || !item.standard) {
    showToast("항목명과 표준명을 입력해야 합니다.");
    return;
  }

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

  const id = button.dataset.id;
  const action = button.dataset.action;
  const item = items.find((entry) => entry.id === id);
  if (!item) return;

  if (action === "edit") {
    fillForm(item);
    document.querySelector("#registry").scrollIntoView({ behavior: "smooth" });
    showToast("수정할 항목을 불러왔습니다.");
  }

  if (action === "duplicate") {
    const copy = {
      ...item,
      id: createId(),
      name: `${item.name} 복제`,
      status: "검토필요",
      updatedAt: new Date().toISOString(),
    };
    items = [copy, ...items];
    persistItems();
    renderAll();
    showToast("항목을 복제했습니다.");
  }

  if (action === "delete") {
    const confirmed = window.confirm(`${item.name} 항목을 삭제할까요?`);
    if (!confirmed) return;
    items = items.filter((entry) => entry.id !== id);
    persistItems();
    renderAll();
    showToast("항목을 삭제했습니다.");
  }
}

function fillForm(item) {
  elements.itemId.value = item.id;
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
  elements.saveButton.textContent = "수정 저장";
}

function clearForm() {
  elements.form.reset();
  elements.itemId.value = "";
  elements.itemType.value = "토큰";
  elements.itemStatus.value = "검토필요";
  elements.itemPlatform.value = "공통";
  elements.saveButton.textContent = "등록";
}

function exportJson() {
  downloadFile(
    "bobaedream-design-system-registry.json",
    JSON.stringify(items, null, 2),
    "application/json",
  );
  showToast("JSON 파일을 내보냈습니다.");
}

function exportCsv() {
  const header = ["구분", "항목명", "표준명", "상태", "플랫폼", "Sheet탭", "PC값", "MO값", "주요속성", "비고"];
  const rows = items.map((item) => [
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
      if (!Array.isArray(parsed)) throw new Error("Invalid JSON");
      items = parsed.map((entry) => ({ ...entry, id: entry.id || createId() }));
      persistItems();
      renderAll();
      showToast("JSON 데이터를 가져왔습니다.");
    } catch {
      showToast("JSON 파일 형식이 올바르지 않습니다.");
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}

function resetData() {
  const confirmed = window.confirm("현재 저장된 데이터를 지우고 샘플 데이터로 복원할까요?");
  if (!confirmed) return;
  items = seedItems.map((item) => ({ ...item }));
  persistItems();
  clearForm();
  renderAll();
  showToast("샘플 데이터를 복원했습니다.");
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

function syncActiveNav() {
  const hash = window.location.hash || "#style-guide-icons";
  const selectedNode = findSidebarNodeByHash(hash) || findSidebarNodeByHash("#style-guide-icons");
  if (selectedNode) renderDocumentPage(selectedNode);

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === hash);
  });

  const activeLink = document.querySelector(".fuse-nav-link.active");
  const scroller = elements.sidebar?.querySelector(".sidebar-scroll");
  if (activeLink && scroller && !elements.sidebarSearch.value.trim() && window.innerWidth > 760) {
    scroller.scrollTop = Math.max(0, activeLink.offsetTop - 170);
  }
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    elements.toast.classList.remove("show");
  }, 2400);
}

function createId() {
  return `ds-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function csvCell(value = "") {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getIconGlyph(name) {
  if (name.includes("필터")) return "F";
  if (name.includes("찜")) return "H";
  if (name.includes("전화")) return "T";
  if (name.includes("채팅")) return "C";
  if (name.includes("위치")) return "L";
  if (name.includes("등록")) return "D";
  return "I";
}
