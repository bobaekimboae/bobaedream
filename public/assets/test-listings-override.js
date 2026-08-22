(() => {
  const basePath = location.pathname.startsWith("/bobaedream") ? "/bobaedream" : "";
  const asset = (path) => `${basePath}/assets/${path}`;
  const listings = [
    { title: "현대 그랜저 GN7", trim: "캘리그래피 하이브리드 무사고", specs: "23년07월 · 3만km · 하이브리드 · 312하8451", price: "4,150 만원", lease: "월 68만원부터", place: "서울 강남구 · 오토갤러리", seller: "한강모터스 박성수", stock: "판매중 5대", posted: "12분 전", photos: "18", image: "detail/raw-10.jpeg" },
    { title: "기아 카니발 4세대", trim: "하이리무진 7인승 리무진시트", specs: "22년11월 · 5만km · 디젤 · 265루0194", price: "3,980 만원", lease: "월 62만원부터", place: "경기 성남시 · 분당전시장", seller: "와이즈오토 김태윤", stock: "판매중 9대", posted: "28분 전", photos: "22", image: "detail/raw-09.jpeg" },
    { title: "제네시스 G80 RG3", trim: "2.5T AWD 파퓰러패키지", specs: "21년05월 · 4만km · 가솔린 · 157거6028", price: "4,290 만원", lease: "", place: "서울 서초구", seller: "개인판매자", stock: "판매중 1대", posted: "46분 전", photos: "16", image: "detail/raw-04.png" },
    { title: "현대 아이오닉 5", trim: "롱레인지 프레스티지 AWD", specs: "22년09월 · 3만km · 전기 · 49버1307", price: "3,190 만원", lease: "월 51만원부터", place: "인천 연수구", seller: "개인판매자", stock: "판매중 1대", posted: "1시간 전", photos: "14", image: "cars/thumbnail.png" },
    { title: "기아 쏘렌토 MQ4", trim: "하이브리드 시그니처 6인승", specs: "23년03월 · 2만km · 하이브리드 · 201나7735", price: "3,690 만원", lease: "월 57만원부터", place: "부산 해운대구 · 센텀전시장", seller: "동성모터스 박지훈", stock: "판매중 7대", posted: "2시간 전", photos: "19", image: "detail/raw-20.jpeg" },
    { title: "BMW 5시리즈 530i", trim: "M 스포츠 정식출고", specs: "24년03월 · 9천km · 가솔린 · 329도5521", price: "7,640 만원", lease: "월 116만원부터", place: "서울 성동구 · 성수전시장", seller: "한독모터스 오세훈", stock: "판매중 18대", posted: "9분 전", photos: "27", image: "cars/bmw/5-series.webp", contain: true },
    { title: "벤츠 E클래스 E 300 4MATIC", trim: "AMG Line 제조사보증", specs: "23년06월 · 1만km · 가솔린 · 118머4207", price: "8,420 만원", lease: "월 128만원부터", place: "서울 강남구 · 한성자동차", seller: "스타모터스 이준호", stock: "판매중 12대", posted: "3분 전", photos: "14", image: "cars/thumbnail.png" },
    { title: "아우디 A6 3.0 TDI 콰트로", trim: "정식수입 무사고 실매물", specs: "12년식 · 12만km · 디젤 · 28나7105", price: "600 만원", lease: "", place: "서울 강남구 도곡동 · 오토갤러리", seller: "오토갤러리 김종선", stock: "판매중 5대", posted: "등록 1시간 전", photos: "24", image: "detail/raw-18.jpeg" },
    { title: "포르쉐 718 박스터", trim: "4.0 GTS 스포츠크로노", specs: "24년03월 · 8천km · 가솔린 · 39라7180", price: "13,900 만원", lease: "월 205만원부터", place: "부산 해운대구", seller: "개인판매자", stock: "판매중 1대", posted: "24분 전", photos: "18", image: "detail/raw-20.jpeg" },
    { title: "랜드로버 레인지로버 스포츠", trim: "P360 HSE 다이내믹", specs: "20년10월 · 6만km · 가솔린 · 143무9116", price: "6,290 만원", lease: "월 96만원부터", place: "대구 수성구 · 수입차전시장", seller: "라스트라다 최민석", stock: "판매중 21대", posted: "어제", photos: "20", image: "detail/raw-07.jpeg" },
    { title: "렉서스 ES300h", trim: "럭셔리 플러스 1인소유", specs: "22년04월 · 3만km · 하이브리드 · 177서3001", price: "4,550 만원", lease: "월 71만원부터", place: "경기 고양시", seller: "개인판매자", stock: "판매중 1대", posted: "18분 전", photos: "12", image: "cars/bmw/x1.webp", contain: true },
    { title: "벤틀리 컨티넨탈 GT", trim: "6.0 W12 뮬리너 사양", specs: "19년11월 · 4만km · 가솔린 · 172무2323", price: "15,700 만원", lease: "월 238만원부터", place: "서울 서초구 · 양재전시장", seller: "라스트라다 최민석", stock: "판매중 21대", posted: "37분 전", photos: "26", image: "detail/raw-05.jpeg" },
    { title: "페라리 296 GTB", trim: "3.0 PHEV 카본패키지", specs: "24년07월 · 1천km · 가솔린 하이브리드 · 229마2626", price: "33,900 만원", lease: "월 510만원부터", place: "서울 성동구 · 성수전시장", seller: "프라임카 김도윤", stock: "판매중 15대", posted: "약 18시간 전", photos: "21", image: "detail/raw-19.jpeg" },
    { title: "람보르기니 우라칸 EVO", trim: "LP640-4 리프팅시스템", specs: "20년08월 · 1만km · 가솔린 · 640어2020", price: "24,900 만원", lease: "월 376만원부터", place: "서울 강남구 · 슈퍼카전시장", seller: "더클래스 윤성호", stock: "판매중 6대", posted: "2시간 전", photos: "24", image: "detail/raw-04.png" },
    { title: "롤스로이스 팬텀", trim: "6.7 V12 EWB 투톤", specs: "13년09월 · 5만km · 가솔린 · 100러6700", price: "27,000 만원", lease: "월 408만원부터", place: "서울 서초구 · 오토갤러리", seller: "더클래스 윤성호", stock: "판매중 6대", posted: "어제", photos: "31", image: "detail/raw-05.jpeg" },
  ];

  function setText(target, value) {
    if (target && target.textContent !== value) target.textContent = value;
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

  const observer = new MutationObserver(() => window.requestAnimationFrame(rewriteCards));
  const start = () => {
    rewriteCards();
    observer.observe(document.body, { childList: true, subtree: true });
    window.setInterval(rewriteCards, 1200);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
