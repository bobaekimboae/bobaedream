(() => {
  const basePath = location.pathname.startsWith("/bobaedream") ? "/bobaedream" : "";
  const asset = (path) => `${basePath}/assets/${path}`;
  const selectedListingKey = "bobaedream-test-selected-listing";
  const listings = [
    { title: "현대 그랜저 GN7", trim: "캘리그래피 하이브리드 무사고", specs: "2023년식 · 30,000km · 하이브리드 · 312하8451", price: "4,150 만원", lease: "월 68만원부터", place: "서울 강남구 · 오토갤러리", seller: "한강모터스 박성수", stock: "판매중 5대", posted: "12분 전", photos: "18", image: "cars/thumbnail.png" },
    { title: "기아 카니발 4세대", trim: "하이리무진 7인승 리무진시트", specs: "2022년식 · 50,000km · 디젤 · 265루0194", price: "3,980 만원", lease: "월 62만원부터", place: "경기 성남시 · 분당전시장", seller: "와이즈오토 김태윤", stock: "판매중 9대", posted: "28분 전", photos: "22", image: "detail/raw-09.jpeg" },
    { title: "제네시스 G80 RG3", trim: "2.5T AWD 파퓰러패키지", specs: "2021년식 · 40,000km · 가솔린 · 157거6028", price: "4,290 만원", lease: "", place: "서울 서초구", seller: "개인판매자", stock: "판매중 1대", posted: "46분 전", photos: "16", image: "detail/raw-04.png" },
    { title: "현대 아이오닉 5", trim: "롱레인지 프레스티지 AWD", specs: "2022년식 · 30,000km · 전기 · 49버1307", price: "3,190 만원", lease: "월 51만원부터", place: "인천 연수구", seller: "개인판매자", stock: "판매중 1대", posted: "1시간 전", photos: "14", image: "cars/thumbnail.png" },
    { title: "기아 쏘렌토 MQ4", trim: "하이브리드 시그니처 6인승", specs: "2023년식 · 20,000km · 하이브리드 · 201나7735", price: "3,690 만원", lease: "월 57만원부터", place: "부산 해운대구 · 센텀전시장", seller: "동성모터스 박지훈", stock: "판매중 7대", posted: "2시간 전", photos: "19", image: "detail/raw-20.jpeg" },
    { title: "BMW 5시리즈 530i", trim: "M 스포츠 정식출고", specs: "2024년식 · 9,000km · 가솔린 · 329도5521", price: "7,640 만원", lease: "월 116만원부터", place: "서울 성동구 · 성수전시장", seller: "한독모터스 오세훈", stock: "판매중 18대", posted: "9분 전", photos: "27", image: "cars/bmw/5-series.webp", contain: true },
    { title: "벤츠 E클래스 E 300 4MATIC", trim: "AMG Line 제조사보증", specs: "2023년식 · 10,000km · 가솔린 · 118머4207", price: "8,420 만원", lease: "월 128만원부터", place: "서울 강남구 · 한성자동차", seller: "스타모터스 이준호", stock: "판매중 12대", posted: "3분 전", photos: "14", image: "cars/thumbnail.png" },
    { title: "아우디 A6 3.0 TDI 콰트로", trim: "정식수입 무사고 실매물", specs: "2012년식 · 125,109km · 디젤 · 28나7105", price: "600 만원", lease: "", place: "서울 강남구 도곡동 · 오토갤러리", seller: "오토갤러리 김종선", stock: "판매중 5대", posted: "등록 1시간 전", photos: "24", image: "detail/raw-18.jpeg" },
    { title: "포르쉐 718 박스터", trim: "4.0 GTS 스포츠크로노", specs: "2024년식 · 8,000km · 가솔린 · 39라7180", price: "13,900 만원", lease: "월 205만원부터", place: "부산 해운대구", seller: "개인판매자", stock: "판매중 1대", posted: "24분 전", photos: "18", image: "detail/raw-20.jpeg" },
    { title: "랜드로버 레인지로버 스포츠", trim: "P360 HSE 다이내믹", specs: "2020년식 · 60,000km · 가솔린 · 143무9116", price: "6,290 만원", lease: "월 96만원부터", place: "대구 수성구 · 수입차전시장", seller: "라스트라다 최민석", stock: "판매중 21대", posted: "어제", photos: "20", image: "detail/raw-07.jpeg" },
    { title: "렉서스 ES300h", trim: "럭셔리 플러스 1인소유", specs: "2022년식 · 30,000km · 하이브리드 · 177서3001", price: "4,550 만원", lease: "월 71만원부터", place: "경기 고양시", seller: "개인판매자", stock: "판매중 1대", posted: "18분 전", photos: "12", image: "cars/bmw/x1.webp", contain: true },
    { title: "벤틀리 컨티넨탈 GT", trim: "6.0 W12 뮬리너 사양", specs: "2019년식 · 40,000km · 가솔린 · 172무2323", price: "15,700 만원", lease: "월 238만원부터", place: "서울 서초구 · 양재전시장", seller: "라스트라다 최민석", stock: "판매중 21대", posted: "37분 전", photos: "26", image: "detail/raw-05.jpeg" },
    { title: "페라리 296 GTB", trim: "3.0 PHEV 카본패키지", specs: "2024년식 · 1,000km · 가솔린 하이브리드 · 229마2626", price: "33,900 만원", lease: "월 510만원부터", place: "서울 성동구 · 성수전시장", seller: "프라임카 김도윤", stock: "판매중 15대", posted: "약 18시간 전", photos: "21", image: "detail/raw-19.jpeg" },
    { title: "람보르기니 우라칸 EVO", trim: "LP640-4 리프팅시스템", specs: "2020년식 · 10,000km · 가솔린 · 640어2020", price: "24,900 만원", lease: "월 376만원부터", place: "서울 강남구 · 슈퍼카전시장", seller: "더클래스 윤성호", stock: "판매중 6대", posted: "2시간 전", photos: "24", image: "detail/raw-04.png" },
    { title: "롤스로이스 팬텀", trim: "6.7 V12 EWB 투톤", specs: "2013년식 · 50,000km · 가솔린 · 100러6700", price: "27,000 만원", lease: "월 408만원부터", place: "서울 서초구 · 오토갤러리", seller: "더클래스 윤성호", stock: "판매중 6대", posted: "어제", photos: "31", image: "detail/raw-05.jpeg" },
  ];

  function setText(target, value) {
    if (target && target.textContent !== value) target.textContent = value;
  }

  function plainPrice(price) {
    return price.replace(/\s+만원$/, "만원");
  }

  function getSelectedIndex() {
    const stored = Number(window.sessionStorage.getItem(selectedListingKey));
    return Number.isInteger(stored) && listings[stored] ? stored : 7;
  }

  function setSelectedIndex(index) {
    if (listings[index]) window.sessionStorage.setItem(selectedListingKey, String(index));
  }

  function selectedListing() {
    return listings[getSelectedIndex()];
  }

  function specParts(item) {
    return item.specs.split(" · ").slice(0, 4);
  }

  function setDataset(target, key, value) {
    if (target && target.dataset[key] !== value) target.dataset[key] = value;
  }

  function replaceTitle(target, item) {
    if (!target) return;
    if (target.dataset.testListingTitle === `${item.title}|${item.trim}`) return;
    target.textContent = "";
    const name = document.createElement("span");
    name.className = "vehicle-name";
    name.textContent = item.title;
    const headline = document.createElement("span");
    headline.className = "vehicle-headline";
    headline.textContent = item.trim;
    target.append(name, headline);
    target.dataset.testListingTitle = `${item.title}|${item.trim}`;
  }

  function bindCardSelection(card, index) {
    card.dataset.testListingIndex = String(index);
    if (card.dataset.testListingSelectionBound === "true") return;
    const choose = (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest("button, a, input, select, textarea")) return;
      setSelectedIndex(Number(card.dataset.testListingIndex));
    };
    card.addEventListener("pointerdown", choose, { capture: true });
    card.addEventListener("click", choose, { capture: true });
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") setSelectedIndex(Number(card.dataset.testListingIndex));
    }, { capture: true });
    card.dataset.testListingSelectionBound = "true";
  }

  function rewriteInfoGrid(item) {
    const values = new Map([
      ["연식", specParts(item)[0] ?? ""],
      ["주행거리", specParts(item)[1] ?? ""],
      ["연료", specParts(item)[2] ?? ""],
      ["지역", item.place.split(" · ")[0]],
      ["수입구분", item.title.includes("현대") || item.title.includes("기아") || item.title.includes("제네시스") ? "국산" : "정식수입"],
      ["최초등록일", specParts(item)[0]?.replace("년식", "년 01월 01일") ?? ""],
    ]);
    document.querySelectorAll(".detail-info-grid div").forEach((row) => {
      const label = row.querySelector("dt")?.textContent?.trim();
      const value = label ? values.get(label) : "";
      if (value) setText(row.querySelector("dd"), value);
    });
  }

  function rewriteDetail() {
    const summary = document.querySelector(".vehicle-summary");
    if (!summary) return;
    const item = selectedListing();
    const parts = specParts(item);

    replaceTitle(summary.querySelector(".vehicle-title-row h1"), item);
    summary.querySelectorAll(".vehicle-spec-row span").forEach((span, index) => {
      if (index < 4) setDataset(span, "overrideValue", parts[index] ?? "");
    });
    setText(summary.querySelector(".detail-price-row strong"), plainPrice(item.price));
    setDataset(summary.querySelector(".detail-price-row strong"), "overridePrice", plainPrice(item.price));

    const locationRow = summary.querySelector(".vehicle-location-row");
    setDataset(locationRow, "overridePosted", item.posted);
    setDataset(locationRow?.querySelector("p"), "overrideLocation", item.place);
    setDataset(locationRow?.querySelector("span"), "overrideStatus", `${item.stock} · 조회 ${Number(item.photos) * 37}`);

    const photos = Array.from(document.querySelectorAll(".detail-media-track > img"));
    const photoPool = [item.image, ...listings.map((listing) => listing.image)].filter((image, index, array) => image && array.indexOf(image) === index);
    photos.forEach((image, index) => {
      image.src = asset(photoPool[index % photoPool.length]);
      image.alt = `${item.title} ${item.trim} 차량 사진 ${index + 1}`;
      image.classList.toggle("is-catalog", Boolean(item.contain));
    });
    setText(document.querySelector(".detail-photo-count"), `1/${item.photos}`);
    setText(document.querySelector('.detail-media-tabs button[aria-selected="true"] + button, .detail-media-tabs button:last-child'), `사진 ${item.photos}`);

    const seller = document.querySelector(".seller-profile");
    if (seller) {
      const sellerImage = seller.querySelector("img");
      if (sellerImage) {
        sellerImage.src = asset("detail/raw-10.jpeg");
        sellerImage.alt = item.seller;
      }
      setText(seller.querySelector("h2"), item.seller);
      setText(seller.querySelector("p"), `${item.stock} · ${item.place}`);
    }
    rewriteInfoGrid(item);
  }

  function rewriteLocation(row, value) {
    if (!row) return;
    if (row.dataset.testListingPlace === value) return;
    const icon = row.querySelector(".ui-icon")?.cloneNode(true);
    row.textContent = value;
    row.dataset.testListingPlace = value;
    if (icon) row.prepend(icon);
  }

  function rewriteDealer(row, item) {
    if (!row) return;
    const compactName = row.querySelector("p strong");
    const compactStock = row.querySelector("p span");
    const cardName = row.querySelector(".dealer-copy strong");
    const cardStock = row.querySelector(".dealer-copy p");
    setText(compactName, item.seller);
    setText(compactStock, `· ${item.stock}`);
    setText(cardName, item.seller);
    setText(cardStock, item.stock);
  }

  function rewriteCards() {
    const cards = Array.from(document.querySelectorAll(".car-list .car-card"));
    if (!cards.length) return;

    cards.forEach((card, index) => {
      const item = listings[index];
      if (!item) {
        card.hidden = true;
        card.style.display = "none";
        return;
      }

      card.hidden = false;
      card.style.display = "";
      bindCardSelection(card, index);
      const isCardView = card.classList.contains("is-card-view");
      const image = card.querySelector(".car-photo");
      if (image) {
        image.src = asset(item.image);
        image.alt = `${item.title} ${item.trim}`;
        image.classList.toggle("is-catalog", Boolean(item.contain));
      }
      setText(card.querySelector(".card-title-row h2, .car-main h2"), isCardView ? `${item.title} ${item.trim}` : item.title);
      setText(card.querySelector(".car-main > .trim"), item.trim);
      setText(card.querySelector(".specs"), item.specs);
      setText(card.querySelector(".price"), item.price);

      const lease = card.querySelector(".lease");
      if (lease) {
        lease.hidden = !item.lease;
        setText(lease, item.lease);
      }

      const photoMeta = card.querySelectorAll(".card-photo-meta span");
      setText(photoMeta[0], item.posted);
      if (photoMeta[1] && photoMeta[1].dataset.testListingPhotos !== item.photos) {
        const icon = photoMeta[1].querySelector(".ui-icon")?.cloneNode(true);
        photoMeta[1].textContent = item.photos;
        photoMeta[1].dataset.testListingPhotos = item.photos;
        if (icon) photoMeta[1].append(icon);
      }
      rewriteLocation(card.querySelector(".location-line"), item.place);
      rewriteDealer(card.querySelector(".dealer-line"), item);
    });
  }

  const scheduleRewrite = () => window.requestAnimationFrame(() => {
    rewriteCards();
    rewriteDetail();
  });
  const observer = new MutationObserver(scheduleRewrite);
  const start = () => {
    rewriteCards();
    rewriteDetail();
    observer.observe(document.body, { childList: true, subtree: true });
    window.setInterval(() => {
      rewriteCards();
      rewriteDetail();
    }, 1200);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
