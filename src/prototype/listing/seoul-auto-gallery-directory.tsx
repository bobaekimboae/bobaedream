import { ChevronRightIcon } from "@radix-ui/react-icons";
import { seoulAutoGalleryRows } from "../data/seoul-autogallery-v01";
import { seoulAutoGalleryShops } from "../data/seoul-autogallery-shops-v01";
import { allSeoulAutoGalleryDealers, dealerPhoto } from "./seoul-auto-gallery-dealer-rail";
import "./seoul-auto-gallery-directory.css";

export type SeoulAutoGallerySection = "vehicles" | "companies" | "dealers" | "about";

const tabItems: Array<{ value: SeoulAutoGallerySection; label: string }> = [
  { value: "vehicles", label: "판매 차량" },
  { value: "companies", label: "상사" },
  { value: "dealers", label: "딜러" },
  { value: "about", label: "소개" },
];

// 화면 표기는 법인 표기(주식회사·(주))를 뺀다(2026-10-13 규칙). 원본 값은 그대로 둔다.
// 호수는 건물(은관·금관)까지 쓴다. 금관 상사는 원본이 「금관 N층」이라 그대로 둔다.
const roomLabel = (room: string) => (room.startsWith("금관") || room.startsWith("은관") ? room : `은관 ${room}`);
const displayCompany = (name: string) => name.replace(/\(주\)|주식회사/g, "").trim();

// 상사 탭 = 서울오토갤러리 공개 회원사 79곳 전체(2026-10-21). 매물 수는 우리 매물 시트의 같은 상사 행 기준이다.
const companies = (() => {
  const stock = new Map<string, Map<string, number>>();
  for (const row of seoulAutoGalleryRows) {
    const dealers = stock.get(row.company) ?? new Map<string, number>();
    dealers.set(row.dealer, Math.max(dealers.get(row.dealer) ?? 0, row.stock));
    stock.set(row.company, dealers);
  }
  return seoulAutoGalleryShops
    .map((shop) => ({
      ...shop,
      listingCount: [...(stock.get(shop.company)?.values() ?? [])].reduce((sum, count) => sum + count, 0),
    }))
    .map((shop) => {
      const members = allSeoulAutoGalleryDealers.filter((dealer) => dealer.shopNo === shop.shopNo);
      const owner = members.find((dealer) => dealer.name === shop.owners[0]) ?? members[0];
      return { ...shop, memberCount: members.length, photo: owner ? dealerPhoto(owner) : "" };
    })
    .sort((a, b) => b.listingCount - a.listingCount || a.room.localeCompare(b.room, "ko", { numeric: true }));
})();

export function SeoulAutoGalleryTabs({ value, onChange }: { value: SeoulAutoGallerySection; onChange: (value: SeoulAutoGallerySection) => void }) {
  return (
    <nav className="sag-directory-tabs" role="tablist" aria-label="서울오토갤러리 탐색">
      {tabItems.map((item) => (
        <button
          key={item.value}
          type="button"
          role="tab"
          aria-selected={value === item.value}
          className={value === item.value ? "is-selected" : undefined}
          onClick={() => onChange(item.value)}
        >
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

export function SeoulAutoGalleryCompanyDirectory() {
  const open = (shopNo: string, emp = "1") => {
    window.location.assign(`${window.location.pathname}?profile=dealer&shop=${shopNo}&emp=${emp}`);
  };
  return (
    <section className="sag-company-directory" aria-labelledby="sag-company-directory-title">
      <h2 id="sag-company-directory-title">상사 {companies.length}곳</h2>
      <div className="sag-company-list">
        {companies.map((company) => (
          <button key={company.shopNo} type="button" className="sag-company-row" onClick={() => open(company.shopNo)} aria-label={`${displayCompany(company.company)} 대표 ${company.owners.join(", ")} 판매자페이지 보기`}>
            {company.photo ? <img className="sag-company-photo" src={company.photo} alt="" loading="lazy" /> : <i className="sag-company-photo" aria-hidden="true" />}
            <span>
              <strong>{displayCompany(company.company)}</strong>
              <small><span>{roomLabel(company.room)}</span> · <span>대표 {company.owners.join(" · ")}</span> · <span>소속딜러 {company.memberCount}명</span></small>
            </span>
            <b>매물 {company.listingCount}대</b>
            <ChevronRightIcon aria-hidden="true" />
          </button>
        ))}
      </div>
    </section>
  );
}

export function SeoulAutoGalleryAbout({ onBrowse }: { onBrowse: () => void }) {
  return (
    <section className="sag-about" aria-labelledby="sag-about-title">
      <div className="sag-about__lead">
        <p>SEOUL AUTO GALLERY</p>
        <h2 id="sag-about-title">서울오토갤러리</h2>
        <strong>대한민국 수입차의 메카,<br />매일이 모터쇼인 전문 매매단지</strong>
      </div>
      <dl className="sag-about__facts">
        <div><dt>판매 차량</dt><dd>검증된 수입차 매물</dd></div>
        <div><dt>상사</dt><dd>단지 내 상사별 매물</dd></div>
        <div><dt>딜러</dt><dd>딜러별 보유 매물</dd></div>
      </dl>
      <button type="button" className="sag-about__browse" onClick={onBrowse}>판매 차량 보기</button>
    </section>
  );
}
