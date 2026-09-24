import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDownIcon, HeartFilledIcon, HeartIcon, LockClosedIcon, MobileIcon, QuestionMarkCircledIcon } from "@radix-ui/react-icons";
import { BottomSheet, Carousel, MobileScroll, useFlow } from "../../mobile";
import {
  asset,
  classCars,
  detailPhotos,
  detailVehiclePlate,
  extraInfo,
  formatMileage,
  isDesktopPreview,
  isForcedMobileView,
  optionItems,
  priceHistoryRows,
  relatedCars,
  sellerScenario,
  useFavorites,
  vehicleHistoryUrl,
  vehicleInfo,
  type DetailSheet,
} from "../data";

type DetailUi = {
  liked: boolean;
  setLiked: (liked: boolean) => void;
  sheet: DetailSheet;
  setSheet: (sheet: DetailSheet) => void;
  toast: string;
  notify: (message: string) => void;
};

const DetailUiContext = createContext<DetailUi | null>(null);

function useDetailUi() {
  const value = useContext(DetailUiContext);
  if (!value) throw new Error("useDetailUi must be used inside DetailUiProvider");
  return value;
}

function DetailUiProvider({ children }: { children: ReactNode }) {
  const [liked, setLiked] = useState(false);
  const [sheet, setSheet] = useState<DetailSheet>(null);
  const [toast, setToast] = useState("");
  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 1800);
  };

  return <DetailUiContext.Provider value={{ liked, setLiked, sheet, setSheet, toast, notify }}>{children}</DetailUiContext.Provider>;
}

function SectionCard({ title, action, children, className = "" }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`detail-card ${className}`}>
      <div className="detail-section-heading"><h2>{title}</h2>{action}</div>
      {children}
    </section>
  );
}

function InfoGrid({ items }: { items: string[][] }) {
  return <dl className="detail-info-grid">{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}

function VehicleInfoCard() {
  const [expanded, setExpanded] = useState(false);
  const items = expanded ? [...vehicleInfo, ...extraInfo] : vehicleInfo;

  return (
    <SectionCard title="차량 정보" className="vehicle-info-card">
      <dl className="vehicle-info-rows">
        {items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
      </dl>
      <button className="vehicle-info-toggle" type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
        {expanded ? "접기" : "더보기"}
        <img className={expanded ? "is-expanded" : ""} src={asset("detail/vehicle-info-chevron.svg")} alt="" />
      </button>
    </SectionCard>
  );
}

function DetailHero({ onBack }: { onBack: () => void }) {
  const { setSheet, notify } = useDetailUi();
  const [photoIndex, setPhotoIndex] = useState(1);
  const heroRef = useRef<HTMLElement>(null);

  const selectPhoto = (index: number) => {
    const carousel = heroRef.current?.querySelector<HTMLElement>(".detail-media-carousel");
    const firstPhoto = carousel?.querySelector<HTMLElement>(".detail-media-track > img");
    if (!carousel || !firstPhoto) return;
    const photoWidth = firstPhoto.getBoundingClientRect().width || carousel.clientWidth;
    setPhotoIndex(index + 1);
    carousel.scrollTo({ left: photoWidth * index, behavior: "auto" });
  };

  useEffect(() => {
    const carousel = heroRef.current?.querySelector<HTMLElement>(".detail-media-carousel");
    const firstPhoto = carousel?.querySelector<HTMLElement>(".detail-media-track > img");
    if (!carousel || !firstPhoto) return;
    const updatePhotoIndex = () => {
      const photoWidth = firstPhoto.getBoundingClientRect().width || carousel.clientWidth;
      setPhotoIndex(Math.min(detailPhotos.length, Math.max(1, Math.round(carousel.scrollLeft / photoWidth) + 1)));
    };
    carousel.addEventListener("scroll", updatePhotoIndex, { passive: true });
    updatePhotoIndex();
    return () => carousel.removeEventListener("scroll", updatePhotoIndex);
  }, []);

  useEffect(() => {
    const carousel = heroRef.current?.querySelector<HTMLElement>(".detail-thumbnail-carousel");
    const activeThumbnail = carousel?.querySelector<HTMLElement>(`[data-thumbnail-index="${photoIndex - 1}"]`);
    if (!carousel || !activeThumbnail) return;
    const gutter = 12;
    const thumbnailLeft = activeThumbnail.offsetLeft;
    const thumbnailRight = thumbnailLeft + activeThumbnail.offsetWidth;
    const visibleLeft = carousel.scrollLeft + gutter;
    const visibleRight = carousel.scrollLeft + carousel.clientWidth - gutter;
    if (thumbnailLeft < visibleLeft) carousel.scrollTo({ left: Math.max(0, thumbnailLeft - gutter), behavior: "smooth" });
    else if (thumbnailRight > visibleRight) carousel.scrollTo({ left: thumbnailRight - carousel.clientWidth + gutter, behavior: "smooth" });
  }, [photoIndex]);

  return (
    <section ref={heroRef} className="detail-hero" aria-label="차량 사진">
      <div className="detail-hero-main">
        <Carousel ariaLabel="차량 사진" className="detail-media-carousel" contentClassName="detail-media-track">
          {detailPhotos.map((photo, index) => <img key={`${photo}-${index}`} src={photo} alt={`벤틀리 차량 사진 ${index + 1}`} draggable={false} />)}
        </Carousel>
        {photoIndex === 1 ? <span className="detail-video-play" aria-hidden="true"><span /></span> : null}
        <div className="detail-photo-count" aria-live="polite">{photoIndex}/{detailPhotos.length}</div>
        <div className="detail-hero-actions">
          <button type="button" aria-label="목록으로 돌아가기" onClick={onBack}><img src={asset("detail/back.svg")} alt="" /></button>
          <div>
            <button type="button" aria-label="공유하기" onClick={() => notify("공유 링크를 복사했어요")}><img src={asset("detail/share.svg")} alt="" /></button>
            <button type="button" aria-label="더보기" onClick={() => setSheet("more")}><img src={asset("detail/more.svg")} alt="" /></button>
          </div>
        </div>
      </div>
      <div className="detail-thumbnail-region">
        <Carousel ariaLabel="차량 사진 썸네일" className="detail-thumbnail-carousel" contentClassName="detail-thumbnail-track">
          {detailPhotos.map((photo, index) => (
            <button key={`thumbnail-${photo}-${index}`} className={`detail-thumbnail${photoIndex === index + 1 ? " is-selected" : ""}`} type="button" data-thumbnail-index={index} aria-label={`사진 ${index + 1} 보기`} aria-pressed={photoIndex === index + 1} onClick={() => selectPhoto(index)}>
              <img src={photo} alt="" aria-hidden="true" draggable={false} />
              {index === 0 ? <img className="detail-thumbnail-play" src={asset("detail/thumbnail-play.png")} alt="" aria-hidden="true" draggable={false} /> : null}
            </button>
          ))}
        </Carousel>
      </div>
    </section>
  );
}

function VehicleSummary() {
  const { liked, setLiked, setSheet, notify } = useDetailUi();
  const summarySpecs = ["2019", formatMileage("42,920 km"), "가솔린", detailVehiclePlate, "1인소유"];
  return (
    <section className="vehicle-summary">
      <div className="vehicle-title-row"><h1>2019 벤틀리 컨티넨탈 GT 3세대 6.0 퍼스트 에디션</h1><button type="button" aria-label="매물 저장" aria-pressed={liked} onClick={() => setLiked(!liked)}>{liked ? <HeartFilledIcon /> : <HeartIcon />}<span>{liked ? "저장됨" : "저장"}</span></button></div>
      <div className="vehicle-spec-row" aria-label="차량 핵심 정보">
        {summarySpecs.map((spec) => <span key={spec}>{spec}</span>)}
      </div>
      <div className="detail-price-row">
        <strong>1억 4,500만원</strong>
        <button type="button" onClick={() => setSheet("priceHistory")}>가격 변동</button>
      </div>
      <p className="vehicle-finance">할부 예상 월 153만원부터</p>
      <p className="vehicle-phone-note">판매자가 안심번호로 연락을 받아요</p>
      <div className="detail-contact-row" aria-label="판매자 연락">
        <a href="tel:05062469261">안심번호</a>
        <button type="button" onClick={() => notify("카카오 상담을 준비했어요")}>카카오</button>
        <button type="button" onClick={() => setSheet("contact")}>채팅</button>
      </div>
      <div className="vehicle-location-row">
        <p>서울 서초구 양재동</p>
        <span>등록 2개월 전</span>
      </div>
    </section>
  );
}

function PriceHistorySheet({ onClose }: { onClose: () => void }) {
  const [page, setPage] = useState(1);
  const visiblePages = [1, 2, 3, 4, 5, 10];
  const selectPage = (nextPage: number) => setPage(Math.min(10, Math.max(1, nextPage)));

  useEffect(() => {
    const overlay = document.querySelector<HTMLElement>('[data-testid="sheet-overlay"]');
    if (!overlay) return;
    overlay.addEventListener("click", onClose);
    return () => overlay.removeEventListener("click", onClose);
  }, [onClose]);

  return (
    <div className="price-history-sheet">
      <button className="price-history-close" type="button" aria-label="가격 변동 내역 닫기" onClick={onClose}>
        <img src={asset("detail/price-history-close.svg")} alt="" />
      </button>
      <div className="price-history-table" role="table" aria-label="가격 변동 내역">
        <div className="price-history-head" role="row">
          <span role="columnheader">날짜</span><span role="columnheader">변동</span><span role="columnheader">가격</span>
        </div>
        {priceHistoryRows.map((row) => (
          <div className="price-history-row" role="row" key={row.date}>
            <span role="cell">{row.date}</span>
            <strong className={row.direction === "down" ? "is-down" : ""} role="cell">
              {row.direction === "first" ? <span className="price-history-tag-icon"><img src={asset("detail/price-tag.svg")} alt="" /><img src={asset("detail/price-tag-dot.svg")} alt="" /></span> : <img src={asset(`detail/price-${row.direction}.svg`)} alt="" />}
              {row.change}
            </strong>
            <b role="cell">{row.price}</b>
          </div>
        ))}
      </div>
      <p className="price-history-note">가격 변동 내역은 판매자가 제공한 정보를 기준으로 합니다.</p>
      <nav className="price-history-pagination" aria-label="가격 변동 페이지">
        <button type="button" aria-label="이전 페이지" disabled={page === 1} onClick={() => selectPage(page - 1)}><span className="price-history-pagination-arrow is-previous" aria-hidden="true"><img src={asset("detail/pagination-left.svg")} alt="" /></span></button>
        {visiblePages.map((pageNumber, index) => (
          <span key={pageNumber} className="price-history-page-slot">
            {index === visiblePages.length - 1 ? <img className="price-history-ellipsis" src={asset("detail/pagination-ellipsis.svg")} alt="" /> : null}
            <button type="button" aria-label={`${pageNumber} 페이지`} aria-current={page === pageNumber ? "page" : undefined} onClick={() => selectPage(pageNumber)}>{pageNumber}</button>
          </span>
        ))}
        <button type="button" aria-label="다음 페이지" disabled={page === 10} onClick={() => selectPage(page + 1)}><span className="price-history-pagination-arrow is-next" aria-hidden="true"><img src={asset("detail/pagination-right.svg")} alt="" /></span></button>
      </nav>
    </div>
  );
}

function OptionsCard({ desktop = false }: { desktop?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <SectionCard title="차량 옵션" action={<button className="text-action" type="button" onClick={() => setExpanded(!expanded)}>옵션설명</button>}>
      <div className="option-grid">{optionItems.map(({ label, icon }, index) => <div key={label}><img src={desktop ? pcAsset(`9653-img${index + 1}.png`) : asset(`detail/${icon}`)} alt="" draggable={false} /><span>{label}</span></div>)}</div>
      <button className="outline-wide-button" type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>옵션 32개 모두 보기</button>
      <div className="selected-options"><h3>선택 옵션</h3><dl><div><dt>빌트인 캠 패키지 <img src={asset("detail/option-info.svg")} alt="옵션 정보" /></dt><dd>70만원</dd></div><div><dt>헤드업 디스플레이 <img src={asset("detail/option-info.svg")} alt="옵션 정보" /></dt><dd>130만원</dd></div></dl></div>
    </SectionCard>
  );
}

function HistoryCard() {
  const [expanded, setExpanded] = useState(false);
  return (
    <SectionCard title="보험 이력" action={<a className="history-link" href={vehicleHistoryUrl(detailVehiclePlate)}>통합 이력조회</a>}>
      <div className="insurance-summary"><div>내 차 피해<strong>0건</strong></div><div>상대 차 피해<strong>0건</strong></div><div>특수사항<strong>없음</strong></div></div>
      <h3 className="subheading">차량 이력 상세</h3>
      <dl className="detail-rows"><div><dt>특수 용도 이력</dt><dd>없음</dd></div><div><dt>용도 및 차종</dt><dd>자가용 승용</dd></div>{expanded ? <><div><dt>소유자 변경</dt><dd>1회</dd></div><div><dt>번호판 변경</dt><dd>없음</dd></div></> : null}</dl>
      <button className="outline-wide-button" type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? "보험 이력 접기" : "보험 이력 전체 보기"}</button>
      <a className="history-cta" href={vehicleHistoryUrl(detailVehiclePlate)}>차량번호 {detailVehiclePlate} 이력조회</a>
    </SectionCard>
  );
}

function InspectionCard() {
  const [expanded, setExpanded] = useState(false);
  return (
    <SectionCard title="성능 점검" action={<span className="muted-label">제시번호 : 262621002567</span>}>
      <dl className="detail-info-grid compact"><div><dt>사고이력 <QuestionMarkCircledIcon /></dt><dd>없음</dd></div><div><dt>단순수리 <QuestionMarkCircledIcon /></dt><dd>없음</dd></div></dl>
      {expanded ? <p className="inspection-note">성능·상태 점검기록부 기준으로 주요 골격 손상과 침수 이력이 없습니다.</p> : null}
      <button className="outline-wide-button" type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? "성능 점검 접기" : "성능 점검 전체 보기"}</button>
    </SectionCard>
  );
}

function WarrantyCard() {
  return (
    <SectionCard title="제조사 보증">
      <div className="warranty-box"><div><span>일반/차체</span><small>보증 종료</small><i><b style={{ width: "0%" }} /></i></div><div><span>엔진/미션</span><small>2년 10개월 / 99,984km 남음</small><i><b style={{ width: "67%" }} /></i></div></div>
    </SectionCard>
  );
}

function SellerCard() {
  return (
    <section className="detail-card seller-card">
      <div className="seller-profile"><img src={asset("detail/raw-10.jpeg")} alt={sellerScenario.name} /><div><h2>{sellerScenario.name}</h2><p>● {sellerScenario.location}</p></div></div>
      <dl className="detail-rows"><div><dt>종사원번호</dt><dd>{sellerScenario.staffNumber} <u>상사/조합정보</u></dd></div><div><dt>매매유형</dt><dd>매매알선(소속 상사 매물)</dd></div></dl>
    </section>
  );
}

function SaleCard() {
  const { notify } = useDetailUi();
  return (
    <SectionCard title="판매 정보">
      <div className="cost-box"><dl><div><dt>차량가</dt><dd>1억5,980만원</dd></div><div><dt>이전 등록비(예상)</dt><dd>314만원</dd></div><div><dt>매도비</dt><dd>33만원</dd></div></dl><div className="cost-total"><span>예상 총 비용</span><strong>1억 6,328만원</strong></div></div>
      <div className="sale-actions"><button type="button" onClick={() => notify("비용 계산기를 열었어요")}>비용계산기</button><button type="button" onClick={() => notify("동급매물로 이동했어요")}>동급매물</button><button type="button" onClick={() => notify("할부매물을 확인해요")}>할부매물</button></div>
      <button className="report-button" type="button" onClick={() => notify("신고 접수 화면을 준비했어요")}><LockClosedIcon /> 신고하기</button>
    </SectionCard>
  );
}

function DescriptionCard({ desktop = false }: { desktop?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <SectionCard title={desktop ? "차량 설명" : "상세 설명"}>
      <div className={`description-copy${expanded ? " is-expanded" : ""}`}>
        <p>2022년 5월식 벤틀리 컨티넨탈 GT 4.0 모델을 판매합니다.<br />벤틀리가 V8엔진으로 구동되는 3세대 컨티넨탈 GT를 선보였다. 쿠페와 컨버터블 형태로 출시될 이 모델은 올해 말부터 미국에서 판매될 예정이며, 이어 2020년 상반기에는 유럽 및 다른 국가에서도 판매될 예정이다.</p>
        <p>파워트레인은 기존의 6.0리터 W12엔진 대신 4.0리터 V8 가솔린 트윈터보 엔진이 장착됐다. 최대출력 550마력, 최고토크 78.5kg·m의 파워를 발휘합니다.</p>
      </div>
      <div className="contact-chip">연락처: 050-6246-9261 <a href="tel:05062469261">연락하기</a></div>
      <button className="more-copy-button" type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? "접기" : "더보기"} <ChevronDownIcon /></button>
    </SectionCard>
  );
}

type RailCar = { image: string; title: string; price: string; place: string; posted: string; meta?: string };

function CarRail({ title, cars: railCars }: { title: string; cars: RailCar[] }) {
  const { notify } = useDetailUi();
  return (
    <section className="related-section"><h2>{title}</h2><Carousel ariaLabel={title} className="related-carousel" contentClassName="related-track">
      {railCars.map((car) => <button key={`${title}-${car.title}`} className="related-card" type="button" onClick={() => notify(`${car.title} 매물을 열었어요`)}><div className="related-photo"><img src={asset(`detail/${car.image}`)} alt={car.title} draggable={false} /><span>{car.posted}</span><b>10 ▣</b></div><div><h3>{car.title}</h3>{car.meta ? <p>{formatMileage(car.meta)}</p> : null}<strong>{car.price}</strong><small>● {car.place}</small></div></button>)}
    </Carousel></section>
  );
}

const pcAsset = (name: string) => asset(`pc-detail/${name}`);

function DesktopGallery({ onBack }: { onBack: () => void }) {
  const { setSheet, notify } = useDetailUi();
  const [selected, setSelected] = useState(0);
  const thumbs = useRef<HTMLDivElement>(null);
  const photos = Array.from({ length: 24 }, (_, i) => pcAsset(`9573-imgImage${i % 8 || ""}.png`));
  const choose = (index: number) => setSelected((index + photos.length) % photos.length);
  useEffect(() => {
    const rail = thumbs.current?.querySelector<HTMLElement>(".pc-thumbnails");
    const thumb = rail?.querySelector<HTMLElement>(`[data-photo="${selected}"]`);
    if (rail && thumb) rail.scrollTo({ left: Math.max(0, thumb.offsetLeft - rail.clientWidth / 2 + 48), behavior: "smooth" });
  }, [selected]);
  const share = async () => {
    try { await navigator.clipboard.writeText(window.location.href); notify("공유 링크를 복사했어요"); }
    catch { notify("주소창의 링크를 복사해 공유해 주세요."); }
  };
  return <section className="pc-gallery" aria-label="차량 사진">
    <div className="pc-hero" onKeyDown={(event) => { if (event.key === "ArrowRight") choose(selected + 1); if (event.key === "ArrowLeft") choose(selected - 1); }} tabIndex={0}>
      <img className="pc-hero-photo" src={selected === 0 ? pcAsset("9550-imgFrame1000006297.png") : photos[selected]} alt={`벤틀리 차량 사진 ${selected + 1}`} draggable={false} />
      <div className="pc-hero-tools"><button aria-label="목록으로 돌아가기" onClick={onBack}><img src={asset("detail/back.svg")} alt="" /></button><div><button aria-label="공유하기" onClick={share}><img src={pcAsset("9550-imgSvgexport211.svg")} alt="" /></button><button aria-label="더보기" onClick={() => setSheet("more")}><img src={pcAsset("9550-imgSvgexport241.svg")} alt="" /></button></div></div>
      {selected === 0 && <span className="pc-play" aria-hidden="true"><img src={pcAsset("9550-imgMaskGroup.svg")} alt="" /><img src={pcAsset("9550-imgFill7.svg")} alt="" /></span>}
      <button className="pc-photo-prev" aria-label="이전 사진" onClick={() => choose(selected - 1)}><img src={pcAsset("9573-imgFrame1000006284.svg")} alt="" /></button>
      <button className="pc-photo-next" aria-label="다음 사진" onClick={() => choose(selected + 1)}><img src={pcAsset("9573-imgFrame1000006284.svg")} alt="" /></button>
      <span className="pc-photo-counter" aria-live="polite">{selected + 1}/24</span>
    </div>
    <div className="pc-thumbnail-region" ref={thumbs}>
      <Carousel ariaLabel="차량 사진 썸네일" className="pc-thumbnails" contentClassName="pc-thumbnail-track">
        {photos.map((src, i) => <button key={i} data-photo={i} aria-label={`사진 ${i + 1} 보기`} aria-pressed={i === selected} onClick={() => choose(i)}><img src={src} alt="" draggable={false} />{i === 0 && <span className="pc-thumb-play" aria-hidden="true"><img src={pcAsset("9550-imgMaskGroup.svg")} alt="" /><img src={pcAsset("9550-imgFill7.svg")} alt="" /></span>}</button>)}
      </Carousel>
      <button className="pc-rail-next" aria-label="다음 썸네일" onClick={() => choose(selected + 1)}><img src={pcAsset("9573-imgFrame1000006284.svg")} alt="" /></button>
    </div>
  </section>;
}

function DesktopVehicleInfo() {
  const [expanded, setExpanded] = useState(false);
  const rows = [
    ["주행거리", formatMileage("42,000km"), "imgPropertyStatus1"], ["연료", "가솔린", "imgImage213"],
    ["변속기", "자동 8단", "imgImage214"], ["배기량", "2,497 cc", "imgImage215"],
    ["색상", "검정색 (외장) · 흰색 (시트)", "imgImage216"], ["지역", "서울 서초구", "imgImage217"],
    ["사고이력", "없음", "imgImage218"],
  ];
  return <SectionCard title="차량 정보" className="pc-info">
    <dl>{rows.map(([label, value, icon]) => <div key={label}><dt><img src={pcAsset(`9626-${icon}.png`)} alt="" />{label}</dt><dd>{value}</dd></div>)}{expanded && extraInfo.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    <button className="vehicle-info-toggle" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? "접기" : "더보기"}<img className={expanded ? "is-expanded" : ""} src={pcAsset("9626-imgFrame1000006238.svg")} alt="" /></button>
  </SectionCard>;
}

function DesktopSummary({ jump }: { jump: (id: string) => void }) {
  const { liked, setLiked, setSheet, notify } = useDetailUi();
  const [costOpen, setCostOpen] = useState(false);
  return <aside className="pc-sidebar">
    <section className="detail-card pc-summary">
      <div className="pc-title-row"><h1>벤틀리 컨티넨탈 GT 3세대 6.0 퍼스트 에디션</h1><button aria-label="매물 저장" aria-pressed={liked} onClick={() => setLiked(!liked)}>{liked ? <HeartFilledIcon /> : <img src={pcAsset("9877-imgIcon.svg")} alt="" />}<span>{liked ? 1 : 0}</span></button></div>
      <p className="pc-specs">172무2323 · 19년 02월 · {formatMileage("17,000 km")} · 가솔린</p>
      <div className="pc-badges"><span>인증중고차</span><span>1년 보증</span></div>
      <div className="pc-price-row"><strong>1억 4,500만원</strong><button onClick={() => setSheet("priceHistory")}>가격 변동</button><button className="pc-insurance" onClick={() => notify("보험료는 보험사 상담을 통해 확인해 주세요.")}>보험료 계산</button></div>
      <p className="pc-summary-note">6인승 독립시트로 뒷좌석의 편안함을 최우선으로 느껴보세요.</p>
      <div className="pc-summary-links"><button onClick={() => jump("pc-history")}><b>보험이력</b><span>0건 <img src={pcAsset("9877-imgIcon1.svg")} alt="" /></span></button><button onClick={() => jump("pc-inspection")}><b>성능점검</b><span>보기 <img src={pcAsset("9877-imgIcon1.svg")} alt="" /></span></button></div>
      <div className="pc-calculators"><button onClick={() => setCostOpen(!costOpen)} aria-expanded={costOpen}>비용계산기</button><button onClick={() => jump("pc-related")}>동급매물</button><button onClick={() => notify("판매 완료된 매물 정보가 없습니다.")}>팔린매물</button></div>
      {costOpen && <div className="pc-cost"><strong>차량 구매 비용</strong><p>차량가 1억 4,500만원</p><p>이전 등록비와 보험료는 별도입니다.</p></div>}
    </section>
    <section className="detail-card pc-seller">
      <div className="seller-profile"><img src={pcAsset("9877-imgFrame1000006239.png")} alt="한강모터스 박성수" /><div><h2>한강모터스 박성수 <span>딜러</span></h2><p><b>5대</b> 판매중 · <b>10대</b> 판매완료</p><p>● 서울 서초구 오토갤러리</p></div></div>
      <dl><div><dt>종사원번호</dt><dd>SE25-00585 <button onClick={() => notify("한강모터스 · 서울 서초구 오토갤러리 · SE25-00585")}>상사/조합정보</button></dd></div><div><dt>매매유형</dt><dd>매매알선(소속 상사 매물)</dd></div></dl>
      <div className="pc-seller-contact"><button onClick={() => setSheet("contact")}>채팅</button><a href="tel:05062469261"><img src={pcAsset("9877-imgSvgexport251.svg")} alt="" />050-6246-9261</a></div>
      <button className="pc-report" onClick={() => setSheet("more")}>신고하기</button>
    </section>
  </aside>;
}

function DesktopHeader({ onBack }: { onBack: () => void }) {
  const { notify } = useDetailUi();
  return <header className="pc-header">
    <div className="pc-header-inner"><div className="pc-account">{["로그인", "회원가입", "고객센터"].map(label => <button key={label} onClick={() => notify(`${label}는 정식 서비스에서 이용해 주세요.`)}>{label}</button>)}</div>
      <button className="pc-logo" aria-label="보배드림 목록" onClick={onBack}><span><img src={pcAsset("9546-imgGroup.svg")} alt="" /></span><img src={pcAsset("9546-imgLogo.svg")} alt="보배드림" /></button>
      <div className="pc-navigation"><nav aria-label="주 메뉴">{["내차사기", "내차팔기", "딜러", "부품·용품", "커뮤니티", "컨텐츠", "더보기"].map(label => <button className={label === "커뮤니티" ? "active" : ""} key={label} onClick={() => label === "내차사기" ? onBack() : notify(`${label}는 정식 서비스에서 이용해 주세요.`)}>{label}{label === "더보기" && <img src={pcAsset("9546-imgIcon.svg")} alt="" />}</button>)}</nav><div className="pc-nav-icons">{[["검색", "img1IconSearchSize24"], ["마이페이지", "img1IconUserSmileSize24"], ["저장한 매물", "img1IconHeartSize24"], ["알림", "img1IconNoticeSize24"], ["전체 메뉴", "imgGroup1000005392"]].map(([label, icon]) => <button key={label} aria-label={label} onClick={() => label === "검색" ? onBack() : notify(`${label}를 확인하려면 목록으로 돌아가 주세요.`)}><img src={pcAsset(`9546-${icon}.svg`)} alt="" /></button>)}</div></div>
    </div>
  </header>;
}

function DesktopVehicleDetail({ onBack }: { onBack: () => void }) {
  const content = useRef<HTMLDivElement>(null);
  const jump = (id: string) => {
    const target = content.current?.querySelector<HTMLElement>(`#${id}`);
    const scroll = content.current?.closest(".detail-screen");
    if (target && scroll) scroll.scrollTo({ top: target.getBoundingClientRect().top - scroll.getBoundingClientRect().top + scroll.scrollTop - 16, behavior: "smooth" });
  };
  return <div className="pc-detail" ref={content}>
    <DesktopHeader onBack={onBack} />
    <main className="pc-detail-container" aria-label="중고차 PC 상세">
      <div className="pc-detail-columns"><div className="pc-detail-left"><DesktopGallery onBack={onBack} /><DescriptionCard desktop /><DesktopVehicleInfo /><OptionsCard desktop /><div id="pc-history"><HistoryCard /></div><div id="pc-inspection"><InspectionCard /></div><WarrantyCard /></div><DesktopSummary jump={jump} /></div>
      <CarRail title="한강모터스 박성수의 다른 매물" cars={relatedCars} />
      <div id="pc-related"><CarRail title="동급매물" cars={classCars} /></div>
      <p className="safety-copy">안전한 거래와 허위매물 근절을 위해 안심번호(050) 이용 시 통화 내용이 보배드림에 안전하게 보관됩니다.<br />보배드림은 등록 시스템만 제공하며, 판매자가 직접 등록한 차량에 대한 모든 책임은 판매자에게 있습니다.</p>
      <button className="pc-return" onClick={onBack}>목록으로 돌아가기</button>
    </main>
    <footer className="pc-footer"><div><section><h3>(주) 보배네트워크 사업자 정보</h3><p>대표이사: 김보배　|　사업자등록번호: 117-81-64543</p><p>주소: (07995) 서울 양천구 목동동로 233-1 드림타워 11, 12층</p><p>통신판매업신고번호: 제2013-서울양천-0465호　|　개인정보관리책임자: 이은호</p><p>팩스: 02-6499-2329　|　메일: bobaedream@bobaedream.co.kr</p><p>Copyright ⓒ (주)보배네트워크</p></section><section><h3>고객센터</h3><strong>02-784-2329</strong><p>평일　09:00 ~ 18:00</p><p>점심시간　11:30 ~ 12:30</p></section></div><p>회사소개　　제휴/광고문의　　이용약관　　제휴/신고센터　　고객센터　　청소년보호정책　　개인정보취급방침　　원격지원</p><div className="pc-footer-social">{["imgGroup", "imgPrimeFacebook", "imgMdiYoutube", "imgFrame1000005307"].map(icon => <img key={icon} src={pcAsset(`10204-${icon}.svg`)} alt="" />)}</div></footer>
  </div>;
}

function VehicleDetail() {
  const flow = useFlow();
  const [desktop, setDesktop] = useState(() => isDesktopPreview() && window.matchMedia("(min-width: 820px)").matches);
  useEffect(() => {
    if (isForcedMobileView()) {
      setDesktop(false);
      return;
    }
    const query = window.matchMedia("(min-width: 820px)");
    const update = () => setDesktop(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const { sheet, setSheet, toast, notify } = useDetailUi();
  return (
    <div className="detail-scene">
      <MobileScroll className="detail-screen">
        {desktop ? <DesktopVehicleDetail onBack={flow.pop} /> : <>
        <main className="vehicle-detail" aria-label="중고차 상세">
          <DetailHero onBack={flow.pop} />
          <VehicleSummary />
          <div className="detail-gray-stack">
            <SellerCard />
            <VehicleInfoCard />
            <OptionsCard />
            <HistoryCard />
            <InspectionCard />
            <WarrantyCard />
            <SaleCard />
            <DescriptionCard />
          </div>
          <CarRail title={`${sellerScenario.name}의 다른 매물`} cars={relatedCars} />
          <CarRail title="동급매물" cars={classCars} />
          <p className="safety-copy">안전한 거래와 허위매물 근절을 위해 안심번호(050) 이용 시 통화 내용이 보배드림에 안전하게 보관됩니다.<br />보배드림은 등록 시스템만 제공하며, 판매자가 직접 등록한 차량에 대한 모든 책임은 판매자에게 있습니다. <button type="button" onClick={() => notify("신고하기를 선택했어요")}>신고하기</button></p>
        </main>
        </>}
      </MobileScroll>
      {toast ? <div className="detail-toast" role="status">{toast}</div> : null}
      <BottomSheet open={sheet !== null} onOpenChange={(open) => !open && setSheet(null)} title={sheet === "priceHistory" ? "가격 변동 내역" : sheet === "more" ? "매물 더보기" : "판매자 상담"} description={sheet === "priceHistory" ? undefined : sheet === "more" ? "원하는 작업을 선택하세요." : `${sellerScenario.name}에게 문의할 수 있어요.`} snap={sheet === "priceHistory" ? 0.75 : 0.42}>
        {sheet === "priceHistory" ? <PriceHistorySheet onClose={() => setSheet(null)} /> : <div className="detail-sheet-actions">
          {sheet === "more" ? <><button type="button" onClick={() => { notify("매물 신고를 선택했어요"); setSheet(null); }}>허위매물 신고</button><button type="button" onClick={() => { notify("판매자를 차단했어요"); setSheet(null); }}>판매자 차단</button><button type="button" onClick={() => setSheet(null)}>취소</button></> : <><a href={sellerScenario.phoneHref}><MobileIcon /> {sellerScenario.phoneLabel} 전화하기</a><button type="button" onClick={() => { notify("상담 요청을 보냈어요"); setSheet(null); }}>문자로 상담 요청</button><button type="button" onClick={() => setSheet(null)}>닫기</button></>}
        </div>}
      </BottomSheet>
    </div>
  );
}

function DetailFooter() {
  const { setSheet, notify } = useDetailUi();
  return (
    <div className="detail-bottom-bar">
      <a className="detail-history" href={vehicleHistoryUrl(detailVehiclePlate)}>이력조회</a>
      <a className="detail-call" href="tel:05062469261"><img src={asset("detail/call.svg")} alt="" /> 전화</a>
      <button className="detail-zalo" type="button" onClick={() => notify("카카오 상담을 준비했어요")}>카카오</button>
      <button className="detail-consult" type="button" onClick={() => setSheet("contact")}>채팅</button>
    </div>
  );
}


export { DetailUiProvider, useDetailUi, VehicleDetail, DetailFooter };
