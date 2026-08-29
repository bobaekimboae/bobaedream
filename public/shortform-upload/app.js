(() => {
  const STORAGE_KEY = "bobaedream-shortform-uploader-v1";
  const DB_NAME = "bobaedream-shortform-assets";
  const DB_VERSION = 1;
  const IMAGE_QUALITY = 0.92;

  const app = document.getElementById("app");
  const toast = document.getElementById("toast");
  const filePicker = document.getElementById("filePicker");
  const replacePicker = document.getElementById("replacePicker");

  let dbPromise;
  let pendingUpload = null;
  let pendingReplaceId = null;
  let toastTimer = null;
  let objectUrls = [];

  const state = {
    view: "studio",
    inventoryFilter: "all",
    mediaFilter: "all",
    currentId: null,
    listings: [],
    assetEditorId: null,
    camera: {
      open: false,
      mode: "photo",
      slotId: null,
      stream: null,
      error: "",
      recorder: null,
      chunks: [],
      startedAt: 0,
    },
  };

  const vehicleTypes = {
    passenger: {
      label: "승용/SUV",
      description: "일반 딜러 매물 기본형",
      badge: "Select",
    },
    luxury: {
      label: "수입/슈퍼카",
      description: "디테일 컷과 숏폼 강화",
      badge: "Luxury",
    },
    truck: {
      label: "화물/특장",
      description: "적재함과 장비 작동 중심",
      badge: "Work",
    },
    camper: {
      label: "캠핑카/RV",
      description: "생활 공간과 설비 중심",
      badge: "RV",
    },
    motorcycle: {
      label: "바이크",
      description: "좌우 상태와 계기판 중심",
      badge: "Moto",
    },
  };

  const proofSlots = [
    {
      id: "proof_license",
      label: "자동차등록증",
      group: "서류/검증",
      kind: "photo",
      required: true,
      hint: "차대번호와 차량번호가 보이게 촬영",
    },
    {
      id: "proof_registration",
      label: "성능점검기록부",
      group: "서류/검증",
      kind: "photo",
      required: false,
      hint: "주요 고지 항목이 잘 보이게 촬영",
    },
    {
      id: "proof_plate",
      label: "차량 명판",
      group: "서류/검증",
      kind: "photo",
      required: false,
      hint: "도어 안쪽 또는 엔진룸 명판 촬영",
    },
  ];

  const baseVideos = [
    {
      id: "short_free",
      label: "자유 숏폼",
      group: "자유 숏폼",
      kind: "video",
      required: true,
      hint: "틱톡처럼 정해진 섹션 없이 15-60초 자유 촬영",
    },
    {
      id: "video_exterior",
      label: "외관 워크어라운드",
      group: "외관",
      kind: "video",
      required: false,
      hint: "전면에서 시작해 한 바퀴 돌며 도장과 휠 상태 촬영",
    },
    {
      id: "video_interior",
      label: "실내 소개",
      group: "실내",
      kind: "video",
      required: false,
      hint: "운전석, 센터패시아, 2열, 트렁크를 천천히 연결",
    },
    {
      id: "video_engine",
      label: "시동/엔진음",
      group: "엔진/하부",
      kind: "video",
      required: false,
      hint: "시동 직후 계기판과 엔진음을 짧게 확인",
    },
  ];

  const templates = {
    passenger: {
      photos: [
        slot("front_left_45", "좌전 45도", "외관", true, "첫 사진 권장. 헤드램프와 측면 라인이 같이 보이게"),
        slot("front", "정면", "외관", true, "그릴, 보닛, 범퍼 손상 여부 확인"),
        slot("front_right_45", "우전 45도", "외관", true, "반대편 외관 균형 컷"),
        slot("right_side", "우측면", "외관", true, "문짝과 펜더 라인을 수평으로"),
        slot("rear", "후면", "외관", true, "트렁크, 테일램프, 범퍼 확인"),
        slot("left_side", "좌측면", "외관", true, "측면 전체와 휠베이스 확인"),
        slot("dashboard", "계기판", "실내", true, "주행거리와 경고등이 보이게"),
        slot("interior", "실내 전체", "실내", true, "운전석에서 대시보드와 시트 상태 촬영"),
        slot("engine", "엔진룸", "엔진/하부", true, "누유, 배터리, 커버 상태 확인"),
        slot("trunk", "트렁크", "적재/트렁크", true, "적재 공간과 하단 커버 확인"),
        slot("wheel_tire", "휠/타이어", "엔진/하부", false, "타이어 마모와 휠 스크래치 확인"),
        slot("odometer", "주행거리", "실내", false, "계기판 숫자가 또렷하게"),
        slot("key", "스마트키", "서류/검증", false, "키 개수와 버튼 상태"),
        slot("defect", "흠집/하자", "흠집/상태", false, "스크래치, 문콕, 교환 의심 부위"),
      ],
      videos: baseVideos,
    },
    luxury: {
      photos: [
        slot("front_left_45", "좌전 45도", "외관", true, "대표 이미지. 차체 자세와 옵션 라인 강조"),
        slot("front", "정면", "외관", true, "라이트, 그릴, 카본/블랙팩 확인"),
        slot("front_right_45", "우전 45도", "외관", true, "보닛과 휠 조합 확인"),
        slot("side_profile", "측면 실루엣", "외관", true, "차체 비율과 휠 핏먼트 확인"),
        slot("rear_45", "후측 45도", "외관", true, "배기, 리어램프, 스포일러 확인"),
        slot("wheel_brake", "휠/브레이크", "엔진/하부", true, "휠 스크래치와 캘리퍼 상태"),
        slot("cockpit", "운전석 콕핏", "실내", true, "스티어링, 계기판, 센터 디스플레이"),
        slot("seat_trim", "시트/가죽", "실내", true, "가죽 주름, 통풍/열선 버튼 확인"),
        slot("engine", "엔진룸", "엔진/하부", true, "튜닝, 누유, 순정 상태 확인"),
        slot("option_detail", "옵션 디테일", "실내", false, "HUD, B&O/Burmester, 카본 트림 등"),
        slot("defect", "흠집/하자", "흠집/상태", true, "고가 차량은 미세 흠집도 별도 고지"),
      ],
      videos: [
        ...baseVideos,
        {
          id: "video_option",
          label: "옵션 하이라이트",
          group: "실내",
          kind: "video",
          required: false,
          hint: "배기음, 옵션 작동, 시트, 디스플레이를 짧게 연결",
        },
      ],
    },
    truck: {
      photos: [
        slot("front_left_45", "좌전 45도", "외관", true, "캡과 적재함이 같이 보이게"),
        slot("front", "정면", "외관", true, "캡, 범퍼, 라이트 상태"),
        slot("cargo_side", "적재함 측면", "적재/트렁크", true, "적재함 길이와 부식 확인"),
        slot("cargo_rear", "후문/리프트", "적재/트렁크", true, "후문, 리프트, 잠금장치 작동"),
        slot("cabin", "운전석", "실내", true, "시트, 계기판, 조작부"),
        slot("odometer", "주행거리", "실내", true, "상용차는 주행거리 필수 고지"),
        slot("engine", "엔진룸", "엔진/하부", true, "누유와 소모품 상태"),
        slot("chassis", "프레임/하부", "엔진/하부", true, "프레임 부식, 보강, 용접 흔적"),
        slot("tire", "타이어", "엔진/하부", false, "편마모와 재생 타이어 여부"),
        slot("special_device", "특장 장비", "적재/트렁크", false, "냉동기, 리프트, PTO, 크레인 등"),
        slot("defect", "흠집/하자", "흠집/상태", false, "적재함 찌그러짐, 부식, 누수"),
      ],
      videos: [
        baseVideos[0],
        {
          id: "video_cargo",
          label: "적재함/특장 작동",
          group: "적재/트렁크",
          kind: "video",
          required: true,
          hint: "리프트, 냉동기, 탑 개폐, PTO 등 실제 작동 촬영",
        },
        baseVideos[3],
      ],
    },
    camper: {
      photos: [
        slot("front_left_45", "좌전 45도", "외관", true, "차량 전체와 캠핑 구조가 같이 보이게"),
        slot("right_side", "우측면/어닝", "외관", true, "어닝, 도어, 외부 수납함"),
        slot("rear", "후면", "외관", true, "후방 카메라, 사다리, 자전거 거치대"),
        slot("cockpit", "운전석", "실내", true, "기본 차량 상태"),
        slot("living_room", "거실/좌석", "실내", true, "시트 변환과 동선"),
        slot("kitchen", "주방", "실내", true, "싱크, 냉장고, 인덕션, 수납"),
        slot("bed", "침대", "실내", true, "고정/변환 침대 크기"),
        slot("bathroom", "화장실/샤워", "실내", false, "수전, 변기, 환풍 상태"),
        slot("control_panel", "전기/수도 패널", "실내", true, "배터리, 인버터, 청수/오수 표시"),
        slot("storage", "외부 수납", "적재/트렁크", false, "캠핑 장비 적재 공간"),
        slot("defect", "누수/흠집", "흠집/상태", true, "실리콘, 천장, 창문 주변 누수 흔적"),
      ],
      videos: [
        baseVideos[0],
        {
          id: "video_living",
          label: "실내 생활 동선",
          group: "실내",
          kind: "video",
          required: true,
          hint: "주방, 침대, 화장실, 전기 패널을 한 흐름으로 촬영",
        },
        {
          id: "video_utility",
          label: "설비 작동",
          group: "실내",
          kind: "video",
          required: false,
          hint: "냉장고, 인버터, 조명, 어닝, 펌프 작동 확인",
        },
      ],
    },
    motorcycle: {
      photos: [
        slot("front_left_45", "좌전 45도", "외관", true, "차체 전체와 앞 포크 상태"),
        slot("front_right_45", "우전 45도", "외관", true, "카울, 탱크, 프레임 라인"),
        slot("front", "정면", "외관", true, "라이트, 핸들, 미러"),
        slot("rear", "후면", "외관", true, "번호판, 머플러, 리어램프"),
        slot("dashboard", "계기판", "실내", true, "주행거리와 경고등"),
        slot("engine", "엔진/프레임", "엔진/하부", true, "누유, 볼트 풀림, 순정 여부"),
        slot("exhaust", "머플러", "엔진/하부", false, "튜닝 여부와 인증 표시"),
        slot("tire", "타이어/브레이크", "엔진/하부", true, "마모, 디스크, 패드 상태"),
        slot("key_docs", "키/서류", "서류/검증", false, "키 개수, 등록증, 구조변경 서류"),
        slot("defect", "전도/흠집", "흠집/상태", true, "카울 긁힘, 레버, 풋페그 손상"),
      ],
      videos: [
        baseVideos[0],
        {
          id: "video_start_sound",
          label: "시동/배기음",
          group: "엔진/하부",
          kind: "video",
          required: true,
          hint: "냉간 시동, 아이들링, 계기판을 함께 촬영",
        },
      ],
    },
  };

  const inventoryFilters = [
    { id: "all", label: "전체 매물", desc: "등록과 촬영 상태 전체" },
    { id: "ready", label: "검수 가능", desc: "필수 촬영과 인증 자료 완료" },
    { id: "needs", label: "촬영 필요", desc: "누락 슬롯이 남은 매물" },
    { id: "video", label: "영상 있음", desc: "자유 숏폼 또는 워크어라운드 보유" },
    { id: "luxury", label: "프리미엄", desc: "수입차, 슈퍼카, 고가 매물" },
    { id: "commercial", label: "상용/RV", desc: "화물, 특장, 캠핑카" },
  ];

  const mediaFilters = ["all", "외관", "실내", "엔진/하부", "적재/트렁크", "흠집/상태", "서류/검증", "자유 숏폼"];

  function slot(id, label, group, required, hint) {
    return { id, label, group, kind: "photo", required, hint };
  }

  function uid(prefix = "id") {
    if (window.crypto?.randomUUID) return `${prefix}_${window.crypto.randomUUID()}`;
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatBytes(bytes) {
    if (!bytes) return "0 KB";
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  function nowLabel() {
    return new Date().toLocaleString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      state.listings = Array.isArray(saved.listings) ? saved.listings : [];
      state.currentId = saved.currentId || state.listings[0]?.id || null;
      state.view = saved.view || "studio";
      state.inventoryFilter = saved.inventoryFilter || "all";
      state.mediaFilter = saved.mediaFilter || "all";
    } catch {
      state.listings = [];
    }

    if (!state.listings.length) {
      const draft = createListing();
      state.listings.push(draft);
      state.currentId = draft.id;
      saveState();
    }
  }

  function saveState() {
    const payload = {
      listings: state.listings,
      currentId: state.currentId,
      view: state.view,
      inventoryFilter: state.inventoryFilter,
      mediaFilter: state.mediaFilter,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  function createListing(type = "passenger") {
    return {
      id: uid("listing"),
      status: "draft",
      listingType: type,
      title: "현대 그랜저 2.5 캘리그래피",
      make: "현대",
      model: "그랜저",
      trim: "2.5 캘리그래피",
      year: "2024",
      mileage: "12,400",
      price: "4,280",
      city: "서울",
      dealer: "김혜원",
      phone: "010-0000-0000",
      vin: "",
      plate: "",
      proofType: "proof_license",
      description: "무사고, 1인 소유, 실내외 관리 상태 우수. 촬영팀 검수 후 최종 문구 확정.",
      assets: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  function currentListing() {
    let listing = state.listings.find((item) => item.id === state.currentId);
    if (!listing) {
      listing = state.listings[0] || createListing();
      if (!state.listings.length) state.listings.push(listing);
      state.currentId = listing.id;
    }
    listing.assets ||= [];
    return listing;
  }

  function getTemplate(listing = currentListing()) {
    return templates[listing.listingType] || templates.passenger;
  }

  function allSlots(listing = currentListing()) {
    const template = getTemplate(listing);
    return [...template.photos, ...template.videos, ...proofSlots];
  }

  function getSlot(slotId, listing = currentListing()) {
    return allSlots(listing).find((item) => item.id === slotId) || null;
  }

  function requiredPhotoSlots(listing = currentListing()) {
    return getTemplate(listing).photos.filter((item) => item.required);
  }

  function requiredVideoSlots(listing = currentListing()) {
    return getTemplate(listing).videos.filter((item) => item.required);
  }

  function assetsForSlot(listing, slotId) {
    return listing.assets.filter((asset) => asset.slotId === slotId);
  }

  function assetKind(asset) {
    if (asset.kind) return asset.kind;
    return asset.mime?.startsWith("video") ? "video" : "photo";
  }

  function firstMissingPhotoSlot(listing = currentListing()) {
    return requiredPhotoSlots(listing).find((slotItem) => !assetsForSlot(listing, slotItem.id).length)?.id || null;
  }

  function firstVideoSlot(listing = currentListing()) {
    return requiredVideoSlots(listing)[0]?.id || "short_free";
  }

  function completion(listing = currentListing()) {
    const photos = requiredPhotoSlots(listing);
    const videos = requiredVideoSlots(listing);
    const donePhotos = photos.filter((slotItem) => assetsForSlot(listing, slotItem.id).length).length;
    const doneVideos = videos.filter((slotItem) => assetsForSlot(listing, slotItem.id).length).length;
    const proofDone = Boolean(assetsForSlot(listing, listing.proofType || "proof_license").length);
    const fields = [
      { label: "차량명", done: Boolean(listing.title && listing.make && listing.model) },
      { label: "가격/주행거리", done: Boolean(listing.price && listing.mileage) },
      { label: "차량 도시", done: Boolean(listing.city) },
      { label: "VIN 또는 차량번호", done: Boolean(listing.vin || listing.plate) },
      { label: "딜러 연락처", done: Boolean(listing.dealer && listing.phone) },
      {
        label: `필수 사진 ${donePhotos}/${photos.length}`,
        done: donePhotos >= photos.length,
      },
      {
        label: `필수 영상 ${doneVideos}/${videos.length}`,
        done: doneVideos >= videos.length,
      },
      { label: "차량 인증 자료", done: proofDone },
    ];
    const done = fields.filter((item) => item.done).length;
    return {
      percent: Math.round((done / fields.length) * 100),
      tasks: fields,
      complete: done === fields.length,
      donePhotos,
      totalPhotos: photos.length,
      doneVideos,
      totalVideos: videos.length,
    };
  }

  function matchesInventoryFilter(listing, filterId) {
    const c = completion(listing);
    if (filterId === "ready") return c.complete;
    if (filterId === "needs") return !c.complete;
    if (filterId === "video") return listing.assets.some((asset) => assetKind(asset) === "video");
    if (filterId === "luxury") return listing.listingType === "luxury";
    if (filterId === "commercial") return ["truck", "camper"].includes(listing.listingType);
    return true;
  }

  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("assets")) {
          db.createObjectStore("assets", { keyPath: "id" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return dbPromise;
  }

  async function putAssetBlob(id, file) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("assets", "readwrite");
      tx.objectStore("assets").put({
        id,
        blob: file,
        mime: file.type || "application/octet-stream",
        name: file.name || id,
        updatedAt: new Date().toISOString(),
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function getAssetBlob(id) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("assets", "readonly");
      const request = tx.objectStore("assets").get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async function deleteAssetBlob(id) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("assets", "readwrite");
      tx.objectStore("assets").delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  function clearObjectUrls() {
    objectUrls.forEach((url) => URL.revokeObjectURL(url));
    objectUrls = [];
  }

  async function hydratePreviews() {
    clearObjectUrls();
    const nodes = [...document.querySelectorAll("[data-asset-preview]")];
    await Promise.all(
      nodes.map(async (node) => {
        const id = node.dataset.assetPreview;
        const record = await getAssetBlob(id).catch(() => null);
        node.textContent = "";
        if (!record?.blob) {
          node.innerHTML = '<div class="asset-empty">파일을 다시 선택해 주세요</div>';
          return;
        }
        const url = URL.createObjectURL(record.blob);
        objectUrls.push(url);
        if ((record.mime || "").startsWith("video")) {
          const video = document.createElement("video");
          video.src = url;
          video.muted = true;
          video.controls = true;
          video.playsInline = true;
          video.preload = "metadata";
          node.appendChild(video);
        } else {
          const img = document.createElement("img");
          img.alt = "촬영 이미지";
          img.src = url;
          node.appendChild(img);
        }
      }),
    );
  }

  function render() {
    const listing = currentListing();
    if (state.camera.open) {
      app.innerHTML = renderCamera(listing);
      mountCamera();
      return;
    }

    const viewHtml =
      state.view === "inventory"
        ? renderInventory()
        : state.view === "templates"
          ? renderTemplates()
          : state.view === "research"
            ? renderResearch()
            : renderStudio(listing);

    app.innerHTML = `
      ${renderTopbar()}
      <main class="shell">
        ${viewHtml}
      </main>
      ${state.assetEditorId ? renderAssetDrawer(listing) : ""}
    `;
    hydratePreviews();
  }

  function renderTopbar() {
    const nav = [
      ["studio", "촬영/등록"],
      ["inventory", "매물함"],
      ["templates", "템플릿"],
      ["research", "해외사례"],
    ];
    return `
      <header class="topbar">
        <div class="topbar-inner">
          <div class="brand">
            <div class="brand-mark">BO</div>
            <div>
              <p class="brand-title">보배드림 숏폼 촬영 업로더</p>
              <div class="brand-subtitle">촬영팀용 샷리스트, 딜러용 자유 숏폼, 검수용 등록폼</div>
            </div>
          </div>
          <nav class="nav" aria-label="주요 메뉴">
            ${nav
              .map(
                ([id, label]) => `
                <button type="button" class="${state.view === id ? "active" : ""}" data-action="set-view" data-view="${id}">
                  ${label}
                </button>
              `,
              )
              .join("")}
          </nav>
        </div>
      </header>
    `;
  }

  function renderStudio(listing) {
    const c = completion(listing);
    return `
      ${renderFormHeader(listing, c)}
      ${renderMissionBar(listing, c)}
      <div class="workspace">
        <section class="panel">
          ${renderBasics(listing)}
          ${renderMediaSection(listing)}
          ${renderProofSection(listing)}
          ${renderDescriptionSection(listing)}
          <div class="sticky-actions">
            <button type="button" class="draft-save" data-action="save-draft">
              <span aria-hidden="true">▣</span>
              <span>저장</span>
            </button>
            <button type="button" class="publish-button" data-action="publish-listing">게시 검수 요청</button>
          </div>
        </section>
        <aside class="side-panel">
          ${renderStatusCard(listing, c)}
          ${renderMissingSlots(listing)}
          ${renderQuickGuide(listing)}
        </aside>
      </div>
    `;
  }

  function renderFormHeader(listing, c) {
    const typeLabel = vehicleTypes[listing.listingType]?.label || "승용/SUV";
    const summary = [typeLabel, listing.city || "도시 미입력", listing.dealer || "딜러 미입력"].join(" · ");
    return `
      <div class="form-header">
        <div class="form-header-main">
          <button type="button" class="back-button" data-action="set-view" data-view="inventory" aria-label="매물함으로">‹</button>
          <div class="header-title">
            <h1>${escapeHtml(listing.title || "중고차 매물 등록")}</h1>
            <p>${escapeHtml(summary)} · 완성도 ${c.percent}%</p>
          </div>
          <button type="button" class="draft-chip" data-action="set-view" data-view="inventory">
            초안 <b>${state.listings.filter((item) => item.status !== "review").length}</b>
          </button>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width:${c.percent}%"></div></div>
      </div>
    `;
  }

  function renderMissionBar(listing, c) {
    const photoSlotId = firstMissingPhotoSlot(listing);
    const missingVideo = requiredVideoSlots(listing).find((slotItem) => !assetsForSlot(listing, slotItem.id).length);
    const nextPhoto = photoSlotId ? getSlot(photoSlotId, listing) : getSlot("defect", listing);
    const nextVideo = missingVideo || getSlot(firstVideoSlot(listing), listing);
    return `
      <section class="mission-bar" aria-label="촬영 진행 요약">
        <article>
          <span>다음 사진</span>
          <strong>${escapeHtml(nextPhoto?.label || "추가 촬영")}</strong>
          <button type="button" data-action="open-camera" data-mode="photo" data-slot="${nextPhoto?.id || "defect"}">바로 촬영</button>
        </article>
        <article>
          <span>다음 영상</span>
          <strong>${escapeHtml(nextVideo?.label || "자유 숏폼")}</strong>
          <button type="button" data-action="open-camera" data-mode="video" data-slot="${nextVideo?.id || "short_free"}">영상 촬영</button>
        </article>
        <article>
          <span>현재 상태</span>
          <strong>${c.complete ? "검수 요청 가능" : `${c.donePhotos}/${c.totalPhotos} 필수 컷`}</strong>
          <button type="button" data-action="set-view" data-view="inventory">매물함 보기</button>
        </article>
      </section>
    `;
  }

  function renderBasics(listing) {
    return `
      <div class="section">
        <h2 class="section-title">매물 분류 <small>필수</small></h2>
        <p class="section-hint">CARS24처럼 매물을 용도와 신뢰 등급으로 나누고, 선택한 분류에 맞춰 촬영 부위가 바뀝니다.</p>
        <div class="type-grid">
          ${Object.entries(vehicleTypes)
            .map(
              ([id, type]) => `
              <button type="button" class="type-card ${listing.listingType === id ? "active" : ""}" data-action="set-type" data-type="${id}">
                <strong>${type.label}</strong>
                <span>${type.badge} · ${type.description}</span>
              </button>
            `,
            )
            .join("")}
        </div>
      </div>
      <div class="section">
        <h2 class="section-title">기본 정보 <small>필수</small></h2>
        <div class="field-grid">
          ${field("title", "매물 제목", listing.title, "full")}
          ${field("make", "제조사", listing.make)}
          ${field("model", "모델", listing.model)}
          ${field("trim", "등급/트림", listing.trim)}
          ${field("year", "연식", listing.year)}
          ${field("mileage", "주행거리(km)", listing.mileage)}
          ${field("price", "가격(만원)", listing.price)}
          ${field("city", "차량 소재 도시", listing.city)}
          ${field("plate", "차량번호", listing.plate)}
          ${field("vin", "VIN", listing.vin, "full")}
          ${field("dealer", "딜러명", listing.dealer)}
          ${field("phone", "연락처", listing.phone)}
        </div>
      </div>
    `;
  }

  function field(name, label, value, className = "") {
    return `
      <div class="field ${className}">
        <label for="${name}">${label}</label>
        <input id="${name}" type="text" data-field="${name}" value="${escapeHtml(value)}" />
      </div>
    `;
  }

  function renderMediaSection(listing) {
    const c = completion(listing);
    const firstMissing = firstMissingPhotoSlot(listing);
    const filteredAssets =
      state.mediaFilter === "all"
        ? listing.assets
        : listing.assets.filter((asset) => (getSlot(asset.slotId, listing)?.group || "기타") === state.mediaFilter);

    return `
      <div class="section">
        <h2 class="section-title">업로드 사진 및 영상 <small>필수</small></h2>
        <p class="section-hint">첫 사진은 좌전 45도 차량 사진을 권장합니다. 사진은 최대 30장, 영상은 자유 숏폼과 부위별 영상 모두 등록할 수 있습니다.</p>
        <div class="media-actions">
          <button type="button" class="big-action photo-action" data-action="open-camera" data-mode="photo" data-slot="${firstMissing || "front_left_45"}">
            <span aria-hidden="true">▢</span>
            <strong>부위별 사진 촬영</strong>
            <small>${c.donePhotos}/${c.totalPhotos} 필수 컷 완료</small>
          </button>
          <button type="button" class="big-action video-action" data-action="open-camera" data-mode="video" data-slot="${firstVideoSlot(listing)}">
            <span aria-hidden="true">▶</span>
            <strong>숏폼 영상 촬영</strong>
            <small>${c.doneVideos}/${c.totalVideos} 필수 영상 완료</small>
          </button>
        </div>
        <div class="button-row" style="margin-bottom:14px">
          <button type="button" class="secondary-button" data-action="open-picker" data-kind="mixed">앨범에서 사진/영상 선택</button>
          <button type="button" class="secondary-button" data-action="open-picker" data-kind="photo" data-slot="${firstMissing || ""}">사진 파일 추가</button>
          <button type="button" class="secondary-button" data-action="open-picker" data-kind="video" data-slot="${firstVideoSlot(listing)}">영상 파일 추가</button>
        </div>
        ${renderShotWarning(listing)}
        <div class="filter-row" style="margin:14px 0">
          ${mediaFilters
            .map(
              (filter) => `
              <button type="button" class="filter-pill ${state.mediaFilter === filter ? "active" : ""}" data-action="set-media-filter" data-filter="${filter}">
                ${filter === "all" ? "전체" : filter}
              </button>
            `,
            )
            .join("")}
        </div>
        <div class="asset-grid">
          ${filteredAssets.map((asset) => renderAssetCard(asset, listing)).join("")}
          ${renderAddSlot(listing)}
        </div>
      </div>
    `;
  }

  function renderShotWarning(listing) {
    const missing = requiredPhotoSlots(listing)
      .filter((slotItem) => !assetsForSlot(listing, slotItem.id).length)
      .slice(0, 5)
      .map((slotItem) => slotItem.label);
    if (!missing.length) {
      return `
        <div class="shot-warning">
          <strong>촬영 완료</strong>
          <span>필수 사진 각도가 모두 채워졌습니다. 흠집/하자 컷을 추가하면 검수 신뢰도가 더 올라갑니다.</span>
        </div>
      `;
    }
    return `
      <div class="shot-warning">
        <strong>누락 ${missing.length}개</strong>
        <span>먼저 ${missing.join(", ")} 컷을 보완하세요. 시스템은 필수 컷 누락 상태를 매물함에서 바로 표시합니다.</span>
      </div>
    `;
  }

  function renderAssetCard(asset, listing) {
    const slotMeta = getSlot(asset.slotId, listing);
    const kind = assetKind(asset);
    return `
      <figure class="asset-card">
        <div class="asset-preview" data-asset-preview="${asset.id}">
          <div class="asset-empty">불러오는 중</div>
        </div>
        <div class="asset-menu">
          <button type="button" data-action="edit-asset" data-asset="${asset.id}" aria-label="수정">수정</button>
          <button type="button" data-action="delete-asset" data-asset="${asset.id}" aria-label="삭제">삭제</button>
        </div>
        <figcaption>
          <span class="asset-title">${escapeHtml(slotMeta?.label || asset.name || "미분류")}</span>
          <span class="asset-meta">${kind === "video" ? "영상" : "사진"} · ${escapeHtml(slotMeta?.group || "기타")} · ${formatBytes(asset.size)}</span>
        </figcaption>
      </figure>
    `;
  }

  function renderAddSlot(listing) {
    const nextSlot = firstMissingPhotoSlot(listing);
    return `
      <button type="button" class="add-slot" data-action="open-camera" data-mode="photo" data-slot="${nextSlot || "defect"}">
        <span style="font-size:28px">＋</span>
        <span>${nextSlot ? `${getSlot(nextSlot, listing)?.label} 촬영` : "추가 촬영"}</span>
      </button>
    `;
  }

  function renderProofSection(listing) {
    const selected = listing.proofType || "proof_license";
    const proofSlot = getSlot(selected, listing) || proofSlots[0];
    const proofAsset = assetsForSlot(listing, selected)[0];
    return `
      <div class="section">
        <h2 class="section-title">차량 인증 <small>한 가지 필수</small></h2>
        <p class="section-hint">58닷컴 방식처럼 매물 신뢰를 위해 등록증, 성능점검기록부, 차량 명판 중 하나를 먼저 받습니다.</p>
        <div class="radio-row">
          ${proofSlots
            .map(
              (item) => `
              <button type="button" class="radio-pill ${selected === item.id ? "active" : ""}" data-action="set-proof" data-proof="${item.id}">
                ${item.label}
              </button>
            `,
            )
            .join("")}
        </div>
        <div style="margin-top:14px">
          ${
            proofAsset
              ? `<div class="asset-grid">${renderAssetCard(proofAsset, listing)}</div>`
              : `<button type="button" class="big-action document-action" data-action="open-picker" data-kind="photo" data-slot="${proofSlot.id}">
                  <span aria-hidden="true">▢</span>
                  <strong>${proofSlot.label} 사진 등록</strong>
                  <small>${proofSlot.hint}</small>
                </button>`
          }
        </div>
      </div>
    `;
  }

  function renderDescriptionSection(listing) {
    return `
      <div class="section">
        <h2 class="section-title">설명 및 검수 메모</h2>
        <div class="field full">
          <label for="description">딜러 설명</label>
          <textarea id="description" data-field="description">${escapeHtml(listing.description)}</textarea>
        </div>
      </div>
    `;
  }

  function renderStatusCard(listing, c) {
    return `
      <div class="status-card">
        <h2>등록 완성도</h2>
        <div class="status-meter">
          <div class="circle" style="--value:${c.percent}">${c.percent}%</div>
          <div>
            <div class="chip ${c.complete ? "good" : "warn"}">${c.complete ? "검수 가능" : "촬영 보완 필요"}</div>
            <ul class="checklist">
              ${c.tasks
                .map(
                  (task) => `
                  <li class="${task.done ? "done" : ""}">
                    <span class="check-dot">${task.done ? "✓" : "!"}</span>
                    <span>${task.label}</span>
                  </li>
                `,
                )
                .join("")}
            </ul>
          </div>
        </div>
        <div class="button-row" style="margin-top:14px">
          <button type="button" class="secondary-button" data-action="export-json">JSON 내보내기</button>
          <button type="button" class="secondary-button" data-action="new-listing">새 매물</button>
        </div>
      </div>
    `;
  }

  function renderMissingSlots(listing) {
    const template = getTemplate(listing);
    const photoItems = template.photos.map((slotItem) => ({
      ...slotItem,
      done: Boolean(assetsForSlot(listing, slotItem.id).length),
    }));
    const videoItems = template.videos.map((slotItem) => ({
      ...slotItem,
      done: Boolean(assetsForSlot(listing, slotItem.id).length),
    }));
    return `
      <div class="template-card">
        <h3>촬영 부위 템플릿</h3>
        <p class="section-hint" style="margin:0 0 12px">${vehicleTypes[listing.listingType]?.label} 매물 기준입니다.</p>
        <ul class="checklist">
          ${[...photoItems, ...videoItems]
            .map(
              (item) => `
              <li class="${item.done ? "done" : ""}">
                <span class="check-dot">${item.done ? "✓" : item.required ? "!" : "+"}</span>
                <button type="button" class="ghost-button" data-action="open-camera" data-mode="${item.kind === "video" ? "video" : "photo"}" data-slot="${item.id}" style="min-height:auto;padding:0;text-align:left;justify-content:flex-start">
                  ${item.label}
                </button>
              </li>
            `,
            )
            .join("")}
        </ul>
      </div>
    `;
  }

  function renderQuickGuide(listing) {
    return `
      <div class="research-card">
        <h3>촬영 운영 원칙</h3>
        <ul>
          <li>필수 컷은 빠짐없이, 흠집 컷은 숨기지 않고 별도 분류</li>
          <li>자유 숏폼은 딜러 말투를 살리고, 부위별 영상은 검수용으로 분리</li>
          <li>번호판 보호가 필요하면 촬영 전 체크하고 후처리 플래그로 전달</li>
          <li>최종 업로드 전 대표 컷은 좌전 45도 또는 차량 전체가 보이는 컷으로 지정</li>
        </ul>
      </div>
    `;
  }

  function renderInventory() {
    const rows = state.listings.filter((listing) => matchesInventoryFilter(listing, state.inventoryFilter));
    return `
      <section class="panel">
        <div class="section">
          <h2 class="section-title">매물함</h2>
          <p class="section-hint">호주 CARS24처럼 매물을 상태와 분류로 먼저 나눠서 촬영팀, 검수팀, 딜러가 같은 기준으로 봅니다.</p>
          <div class="inventory-grid">
            ${inventoryFilters
              .map(
                (filter) => `
                <button type="button" class="category-card ${state.inventoryFilter === filter.id ? "active" : ""}" data-action="set-inventory-filter" data-filter="${filter.id}">
                  <b>${filter.label}</b>
                  <span>${filter.desc}</span>
                  <span class="chip">${state.listings.filter((listing) => matchesInventoryFilter(listing, filter.id)).length}대</span>
                </button>
              `,
              )
              .join("")}
          </div>
          <div class="button-row" style="margin-top:14px">
            <button type="button" class="primary-button" data-action="new-listing">새 매물 등록</button>
          </div>
        </div>
        <div class="section">
          <div class="listing-list">
            ${
              rows.length
                ? rows.map((listing) => renderListingCard(listing)).join("")
                : `<div class="empty-state">해당 분류에 매물이 없습니다.</div>`
            }
          </div>
        </div>
      </section>
    `;
  }

  function renderListingCard(listing) {
    const c = completion(listing);
    const cover = listing.assets.find((asset) => asset.cover) || listing.assets[0];
    return `
      <article class="listing-card">
        <div class="listing-thumb ${cover ? "" : "asset-empty"}" ${cover ? `data-asset-preview="${cover.id}"` : ""}>${cover ? "" : "대표 컷 없음"}</div>
        <div>
          <h3 class="listing-title">${escapeHtml(listing.title || "제목 없음")}</h3>
          <div class="listing-meta">
            <span>${escapeHtml(vehicleTypes[listing.listingType]?.label || "승용/SUV")}</span>
            <span>${escapeHtml(listing.year)}년</span>
            <span>${escapeHtml(listing.mileage)}km</span>
            <span>${escapeHtml(listing.city || "도시 미입력")}</span>
            <span class="chip ${c.complete ? "good" : "warn"}">${c.complete ? "검수 가능" : `완성도 ${c.percent}%`}</span>
            <span class="chip">${listing.assets.length}/30</span>
          </div>
        </div>
        <div class="button-row">
          <button type="button" class="secondary-button" data-action="select-listing" data-listing="${listing.id}">수정</button>
          <button type="button" class="danger-button" data-action="delete-listing" data-listing="${listing.id}">삭제</button>
        </div>
      </article>
    `;
  }

  function renderTemplates() {
    return `
      <section class="panel">
        <div class="section">
          <h2 class="section-title">영상과 사진 촬영 부위 템플릿</h2>
          <p class="section-hint">매물 분류별로 필수 컷과 보강 컷을 나눴습니다. 보배드림 운영 기준은 이 표를 그대로 앱 촬영 슬롯으로 쓰면 됩니다.</p>
          <div class="template-grid">
            ${Object.entries(vehicleTypes)
              .map(([typeId, type]) => renderTemplateCard(typeId, type))
              .join("")}
          </div>
        </div>
      </section>
    `;
  }

  function renderTemplateCard(typeId, type) {
    const template = templates[typeId];
    const requiredPhotos = template.photos.filter((item) => item.required).map((item) => item.label);
    const requiredVideos = template.videos.filter((item) => item.required).map((item) => item.label);
    return `
      <article class="template-card">
        <h3>${type.label}</h3>
        <span class="chip">${type.badge}</span>
        <ul>
          <li>필수 사진: ${requiredPhotos.join(", ")}</li>
          <li>필수 영상: ${requiredVideos.join(", ")}</li>
          <li>보강 컷: ${template.photos.filter((item) => !item.required).map((item) => item.label).join(", ") || "없음"}</li>
        </ul>
        <button type="button" class="secondary-button" data-action="apply-template" data-type="${typeId}" style="margin-top:12px">이 템플릿으로 등록</button>
      </article>
    `;
  }

  function renderResearch() {
    return `
      <section class="panel">
        <div class="section">
          <h2 class="section-title">해외 촬영 업로드 사례</h2>
          <p class="section-hint">실제 구현에 반영할 기능만 추렸습니다. 자세한 출처 링크는 최종 정리에서 함께 제공합니다.</p>
          <div class="research-grid">
            <article class="research-card">
              <h3>58닷컴형 등록폼</h3>
              <ul>
                <li>완성도 퍼센트와 필수 항목 표시</li>
                <li>사진/영상 최대 30개 슬롯</li>
                <li>각도 누락 안내와 촬영 규칙 보기</li>
                <li>차량 인증 자료를 등록 단계에 포함</li>
              </ul>
            </article>
            <article class="research-card">
              <h3>CARS24형 보기</h3>
              <ul>
                <li>매물 품질 등급과 조건 정보를 먼저 분류</li>
                <li>핵심 사유, 차량 개요, 프리미엄 옵션 분리</li>
                <li>점검 리포트와 상태 고지를 구매 흐름에 배치</li>
              </ul>
            </article>
            <article class="research-card">
              <h3>전문 솔루션 공통점</h3>
              <ul>
                <li>모바일 촬영 가이드와 샷리스트</li>
                <li>DMS 또는 재고 시스템 자동 전송</li>
                <li>360도 워크어라운드와 숏폼 자동 편집</li>
                <li>SNS/웹사이트 동시 배포</li>
              </ul>
            </article>
          </div>
        </div>
      </section>
    `;
  }

  function renderCamera(listing) {
    const template = getTemplate(listing);
    const slots = state.camera.mode === "video" ? template.videos : template.photos;
    const activeSlot = slots.find((item) => item.id === state.camera.slotId) || slots[0];
    state.camera.slotId = activeSlot?.id || state.camera.slotId;
    const activeLabel = activeSlot?.label || "자유 촬영";
    return `
      <div class="camera-overlay">
        <div class="camera-top">
          <button type="button" data-action="close-camera" aria-label="닫기">×</button>
          <h2>${state.camera.mode === "video" ? "차량 영상" : "촬영 사진"}</h2>
          <button type="button" data-action="open-picker" data-kind="${state.camera.mode}" data-slot="${activeSlot?.id || ""}" aria-label="앨범">＋</button>
        </div>
        <div class="camera-stage">
          ${
            state.camera.error
              ? `<div class="camera-unavailable">
                  <div>
                    <h3>카메라를 열 수 없습니다</h3>
                    <p>${escapeHtml(state.camera.error)}</p>
                    <button type="button" class="album-button" data-action="open-picker" data-kind="${state.camera.mode}" data-slot="${activeSlot?.id || ""}">앨범에서 선택</button>
                  </div>
                </div>`
              : `<video id="cameraFeed" class="camera-feed" autoplay muted playsinline></video>
                 <div class="camera-pill">촬영 ${escapeHtml(activeLabel)}</div>
                 <div class="frame-guide"></div>
                 <div class="camera-note">${escapeHtml(activeSlot?.hint || "차량이 프레임 안에 들어오게 촬영하세요")}</div>`
          }
          <div class="slot-strip">
            ${slots
              .map(
                (item) => `
                <button type="button" class="slot-card ${item.id === activeSlot?.id ? "active" : ""}" data-action="set-camera-slot" data-slot="${item.id}">
                  <span class="slot-sample">${item.group}</span>
                  <b>${item.label}</b>
                </button>
              `,
              )
              .join("")}
          </div>
        </div>
        <div class="camera-controls">
          <div class="mode-tabs">
            <button type="button" class="${state.camera.mode === "photo" ? "active" : ""}" data-action="switch-camera-mode" data-mode="photo">사진</button>
            <button type="button" class="${state.camera.mode === "video" ? "active" : ""}" data-action="switch-camera-mode" data-mode="video">영상</button>
          </div>
          <button type="button" class="shutter ${state.camera.mode === "video" ? "record" : ""}" data-action="${state.camera.mode === "video" ? "toggle-recording" : "take-photo"}" aria-label="촬영"></button>
          <div class="right-controls">
            <button type="button" data-action="open-picker" data-kind="${state.camera.mode}" data-slot="${activeSlot?.id || ""}">앨범</button>
            <button type="button" data-action="close-camera">완료</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderAssetDrawer(listing) {
    const asset = listing.assets.find((item) => item.id === state.assetEditorId);
    if (!asset) return "";
    const kind = assetKind(asset);
    const slots = allSlots(listing).filter((slotItem) => (kind === "video" ? slotItem.kind === "video" : slotItem.kind !== "video"));
    return `
      <aside class="asset-drawer" aria-label="촬영 파일 수정">
        <div class="drawer-head">
          <h2>촬영 파일 수정</h2>
          <button type="button" class="icon-button" data-action="close-asset-editor" aria-label="닫기">×</button>
        </div>
        <div class="drawer-body">
          <div class="asset-preview" data-asset-preview="${asset.id}"><div class="asset-empty">불러오는 중</div></div>
          <div class="field">
            <label for="assetSlot">촬영 부위</label>
            <select id="assetSlot" data-asset-field="slotId" data-asset="${asset.id}">
              ${slots
                .map(
                  (slotItem) => `<option value="${slotItem.id}" ${asset.slotId === slotItem.id ? "selected" : ""}>${slotItem.group} · ${slotItem.label}</option>`,
                )
                .join("")}
            </select>
          </div>
          <div class="field">
            <label for="assetNote">검수 메모</label>
            <textarea id="assetNote" data-asset-field="note" data-asset="${asset.id}" placeholder="흠집 위치, 재촬영 사유, 대표컷 여부 등">${escapeHtml(asset.note || "")}</textarea>
          </div>
          <div class="button-row">
            <button type="button" class="secondary-button" data-action="replace-asset" data-asset="${asset.id}">파일 교체</button>
            <button type="button" class="secondary-button" data-action="set-cover" data-asset="${asset.id}">대표 지정</button>
            <button type="button" class="danger-button" data-action="delete-asset" data-asset="${asset.id}">삭제</button>
          </div>
        </div>
      </aside>
    `;
  }

  async function mountCamera() {
    const video = document.getElementById("cameraFeed");
    if (!video || state.camera.error) return;
    try {
      if (!state.camera.stream) {
        state.camera.stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1080 },
            height: { ideal: 1920 },
          },
          audio: state.camera.mode === "video",
        });
      }
      video.srcObject = state.camera.stream;
      await video.play();
    } catch (error) {
      state.camera.error =
        "브라우저 카메라 권한이 없거나 HTTPS/localhost 환경이 아닙니다. 휴대폰에서는 배포 URL 또는 로컬 서버에서 열어 주세요.";
      render();
    }
  }

  function stopCamera() {
    if (state.camera.recorder?.state === "recording") {
      state.camera.recorder.stop();
    }
    state.camera.stream?.getTracks().forEach((track) => track.stop());
    state.camera.stream = null;
    state.camera.recorder = null;
    state.camera.chunks = [];
    state.camera.startedAt = 0;
  }

  async function addFiles(files, options = {}) {
    const listing = currentListing();
    const fileList = [...files].slice(0, Math.max(0, 30 - listing.assets.length));
    if (!fileList.length) {
      showToast("최대 30개까지 등록할 수 있습니다.");
      return;
    }
    for (const file of fileList) {
      const kind = file.type.startsWith("video") ? "video" : "photo";
      let slotId = options.slotId || "";
      if (!slotId) {
        slotId = kind === "video" ? firstVideoSlot(listing) : firstMissingPhotoSlot(listing) || "defect";
      }
      const id = uid("asset");
      await putAssetBlob(id, file);
      const asset = {
        id,
        slotId,
        kind,
        mime: file.type,
        name: file.name,
        size: file.size,
        cover: kind === "photo" && !listing.assets.some((item) => item.cover),
        note: "",
        createdAt: new Date().toISOString(),
      };
      listing.assets.push(asset);
    }
    listing.updatedAt = new Date().toISOString();
    saveState();
    render();
    showToast(`${fileList.length}개 파일을 등록했습니다.`);
  }

  async function takePhoto() {
    const video = document.getElementById("cameraFeed");
    if (!video || !video.videoWidth) {
      showToast("카메라 화면이 준비되지 않았습니다.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", IMAGE_QUALITY));
    const slotMeta = getSlot(state.camera.slotId, currentListing());
    const file = new File([blob], `${slotMeta?.label || "photo"}-${Date.now()}.jpg`, { type: "image/jpeg" });
    await addFiles([file], { slotId: state.camera.slotId });
  }

  function toggleRecording() {
    if (!state.camera.stream) {
      showToast("카메라가 준비되지 않았습니다.");
      return;
    }
    if (state.camera.recorder?.state === "recording") {
      state.camera.recorder.stop();
      return;
    }
    const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : MediaRecorder.isTypeSupported("video/webm")
        ? "video/webm"
        : "";
    state.camera.chunks = [];
    state.camera.recorder = new MediaRecorder(state.camera.stream, mime ? { mimeType: mime } : undefined);
    state.camera.recorder.ondataavailable = (event) => {
      if (event.data?.size) state.camera.chunks.push(event.data);
    };
    state.camera.recorder.onstop = async () => {
      const type = state.camera.recorder.mimeType || "video/webm";
      const blob = new Blob(state.camera.chunks, { type });
      const slotMeta = getSlot(state.camera.slotId, currentListing());
      const file = new File([blob], `${slotMeta?.label || "shortform"}-${Date.now()}.webm`, { type });
      state.camera.chunks = [];
      await addFiles([file], { slotId: state.camera.slotId });
    };
    state.camera.recorder.start();
    state.camera.startedAt = Date.now();
    const shutter = document.querySelector(".shutter");
    shutter?.classList.add("record");
    showToast("녹화를 시작했습니다. 다시 누르면 저장됩니다.");
  }

  async function replaceAsset(file) {
    const listing = currentListing();
    const asset = listing.assets.find((item) => item.id === pendingReplaceId);
    if (!asset || !file) return;
    await putAssetBlob(asset.id, file);
    asset.kind = file.type.startsWith("video") ? "video" : "photo";
    asset.mime = file.type;
    asset.name = file.name;
    asset.size = file.size;
    asset.updatedAt = new Date().toISOString();
    listing.updatedAt = new Date().toISOString();
    saveState();
    pendingReplaceId = null;
    render();
    showToast("파일을 교체했습니다.");
  }

  async function removeAsset(assetId) {
    const listing = currentListing();
    const asset = listing.assets.find((item) => item.id === assetId);
    if (!asset) return;
    const ok = window.confirm(`${getSlot(asset.slotId, listing)?.label || asset.name} 파일을 삭제할까요?`);
    if (!ok) return;
    listing.assets = listing.assets.filter((item) => item.id !== assetId);
    if (asset.cover && listing.assets[0]) listing.assets[0].cover = true;
    if (state.assetEditorId === assetId) state.assetEditorId = null;
    await deleteAssetBlob(assetId).catch(() => {});
    listing.updatedAt = new Date().toISOString();
    saveState();
    render();
    showToast("파일을 삭제했습니다.");
  }

  function updateProgressOnly() {
    const c = completion(currentListing());
    document.querySelector(".header-title p")?.replaceChildren(document.createTextNode(`완성도 ${c.percent}%`));
    const fill = document.querySelector(".progress-fill");
    if (fill) fill.style.width = `${c.percent}%`;
    const circle = document.querySelector(".circle");
    if (circle) {
      circle.style.setProperty("--value", c.percent);
      circle.textContent = `${c.percent}%`;
    }
  }

  function setCameraMode(mode) {
    stopCamera();
    state.camera.mode = mode;
    state.camera.slotId = mode === "video" ? firstVideoSlot(currentListing()) : firstMissingPhotoSlot(currentListing()) || "front_left_45";
    state.camera.error = "";
    render();
  }

  function exportJson() {
    const listing = currentListing();
    const payload = {
      ...listing,
      completion: completion(listing),
      exportedAt: new Date().toISOString(),
      note: "영상/사진 원본 Blob은 브라우저 IndexedDB에 저장됩니다. 이 JSON은 서버 연동용 메타데이터 예시입니다.",
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bobaedream-shortform-${listing.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function handleClick(event) {
    const target = event.target.closest("[data-action]");
    if (!target) return;
    const action = target.dataset.action;
    const listing = currentListing();

    if (action === "set-view") {
      stopCamera();
      state.view = target.dataset.view || "studio";
      state.assetEditorId = null;
      saveState();
      render();
    }

    if (action === "set-type" || action === "apply-template") {
      listing.listingType = target.dataset.type || "passenger";
      listing.updatedAt = new Date().toISOString();
      state.view = "studio";
      saveState();
      render();
    }

    if (action === "set-proof") {
      listing.proofType = target.dataset.proof || "proof_license";
      saveState();
      render();
    }

    if (action === "set-media-filter") {
      state.mediaFilter = target.dataset.filter || "all";
      saveState();
      render();
    }

    if (action === "set-inventory-filter") {
      state.inventoryFilter = target.dataset.filter || "all";
      saveState();
      render();
    }

    if (action === "open-picker") {
      pendingUpload = {
        slotId: target.dataset.slot || "",
        kind: target.dataset.kind || "mixed",
      };
      filePicker.accept =
        pendingUpload.kind === "video"
          ? "video/*"
          : pendingUpload.kind === "photo"
            ? "image/*"
            : "image/*,video/*";
      filePicker.value = "";
      filePicker.click();
    }

    if (action === "open-camera") {
      state.camera.open = true;
      state.camera.mode = target.dataset.mode || "photo";
      state.camera.slotId =
        target.dataset.slot ||
        (state.camera.mode === "video" ? firstVideoSlot(listing) : firstMissingPhotoSlot(listing) || "front_left_45");
      state.camera.error = "";
      state.assetEditorId = null;
      render();
    }

    if (action === "close-camera") {
      stopCamera();
      state.camera.open = false;
      render();
    }

    if (action === "switch-camera-mode") {
      setCameraMode(target.dataset.mode || "photo");
    }

    if (action === "set-camera-slot") {
      state.camera.slotId = target.dataset.slot || state.camera.slotId;
      render();
    }

    if (action === "take-photo") {
      takePhoto();
    }

    if (action === "toggle-recording") {
      if (typeof MediaRecorder === "undefined") {
        showToast("현재 브라우저는 영상 녹화를 지원하지 않습니다. 앨범 업로드를 사용하세요.");
      } else {
        toggleRecording();
      }
    }

    if (action === "edit-asset") {
      state.assetEditorId = target.dataset.asset || null;
      render();
    }

    if (action === "close-asset-editor") {
      state.assetEditorId = null;
      render();
    }

    if (action === "delete-asset") {
      removeAsset(target.dataset.asset);
    }

    if (action === "replace-asset") {
      pendingReplaceId = target.dataset.asset || null;
      replacePicker.value = "";
      replacePicker.click();
    }

    if (action === "set-cover") {
      listing.assets.forEach((asset) => {
        asset.cover = asset.id === target.dataset.asset;
      });
      saveState();
      render();
      showToast("대표 컷으로 지정했습니다.");
    }

    if (action === "new-listing") {
      const newItem = createListing(listing.listingType || "passenger");
      state.listings.unshift(newItem);
      state.currentId = newItem.id;
      state.view = "studio";
      saveState();
      render();
      showToast("새 매물 초안을 만들었습니다.");
    }

    if (action === "select-listing") {
      state.currentId = target.dataset.listing;
      state.view = "studio";
      saveState();
      render();
    }

    if (action === "delete-listing") {
      if (state.listings.length <= 1) {
        showToast("최소 1개 초안은 유지됩니다.");
        return;
      }
      const ok = window.confirm("이 매물 초안을 삭제할까요? 등록한 미디어 메타데이터도 함께 삭제됩니다.");
      if (!ok) return;
      const targetId = target.dataset.listing;
      const removed = state.listings.find((item) => item.id === targetId);
      state.listings = state.listings.filter((item) => item.id !== targetId);
      removed?.assets?.forEach((asset) => deleteAssetBlob(asset.id).catch(() => {}));
      state.currentId = state.listings[0]?.id || null;
      saveState();
      render();
      showToast("매물을 삭제했습니다.");
    }

    if (action === "save-draft") {
      listing.status = "draft";
      listing.updatedAt = new Date().toISOString();
      saveState();
      showToast(`초안을 저장했습니다. ${nowLabel()}`);
    }

    if (action === "publish-listing") {
      const c = completion(listing);
      if (!c.complete) {
        const firstMissing = c.tasks.find((task) => !task.done)?.label || "필수 항목";
        showToast(`${firstMissing} 보완 후 검수 요청할 수 있습니다.`);
        return;
      }
      listing.status = "review";
      listing.updatedAt = new Date().toISOString();
      saveState();
      render();
      showToast("게시 검수 요청 상태로 변경했습니다.");
    }

    if (action === "export-json") {
      exportJson();
    }
  }

  function handleInput(event) {
    const fieldName = event.target.dataset.field;
    if (fieldName) {
      const listing = currentListing();
      listing[fieldName] = event.target.value;
      listing.updatedAt = new Date().toISOString();
      saveState();
      updateProgressOnly();
    }

    const assetField = event.target.dataset.assetField;
    if (assetField) {
      const listing = currentListing();
      const asset = listing.assets.find((item) => item.id === event.target.dataset.asset);
      if (!asset) return;
      asset[assetField] = event.target.value;
      asset.updatedAt = new Date().toISOString();
      saveState();
    }
  }

  function handleChange(event) {
    const fieldName = event.target.dataset.field;
    if (fieldName) {
      const listing = currentListing();
      listing[fieldName] = event.target.value;
      listing.updatedAt = new Date().toISOString();
      saveState();
      render();
    }

    const assetField = event.target.dataset.assetField;
    if (assetField) {
      const listing = currentListing();
      const asset = listing.assets.find((item) => item.id === event.target.dataset.asset);
      if (!asset) return;
      asset[assetField] = event.target.value;
      asset.updatedAt = new Date().toISOString();
      saveState();
      render();
    }
  }

  filePicker.addEventListener("change", () => {
    const options = pendingUpload || {};
    addFiles(filePicker.files, options);
    pendingUpload = null;
  });

  replacePicker.addEventListener("change", () => {
    replaceAsset(replacePicker.files[0]);
  });

  document.addEventListener("click", handleClick);
  document.addEventListener("input", handleInput);
  document.addEventListener("change", handleChange);

  window.addEventListener("beforeunload", () => {
    stopCamera();
    clearObjectUrls();
  });

  loadState();
  render();
})();
