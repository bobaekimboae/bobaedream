import { ChevronRightIcon } from "@radix-ui/react-icons";
import { seoulAutoGalleryRows } from "../data/seoul-autogallery-v01";
import "./seoul-auto-gallery-directory.css";

export type SeoulAutoGallerySection = "vehicles" | "companies" | "dealers" | "about";

const directoryStats = {
  vehicles: seoulAutoGalleryRows.length,
  companies: new Set(seoulAutoGalleryRows.map((row) => row.company)).size,
  dealers: new Set(seoulAutoGalleryRows.map((row) => `${row.company}|${row.dealer}`)).size,
};

const tabItems: Array<{ value: SeoulAutoGallerySection; label: string; count?: number }> = [
  { value: "vehicles", label: "판매 차량", count: directoryStats.vehicles },
  { value: "companies", label: "입점 상사", count: directoryStats.companies },
  { value: "dealers", label: "소속 딜러", count: directoryStats.dealers },
  { value: "about", label: "소개" },
];

const companies = (() => {
  const directory = new Map<string, Map<string, number>>();
  for (const row of seoulAutoGalleryRows) {
    const dealers = directory.get(row.company) ?? new Map<string, number>();
    dealers.set(row.dealer, Math.max(dealers.get(row.dealer) ?? 0, row.stock));
    directory.set(row.company, dealers);
  }
  return [...directory.entries()]
    .map(([name, dealers]) => ({
      name,
      dealerCount: dealers.size,
      listingCount: [...dealers.values()].reduce((sum, count) => sum + count, 0),
    }))
    .sort((a, b) => b.listingCount - a.listingCount || a.name.localeCompare(b.name, "ko"));
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
          {item.count === undefined ? null : <b>{item.count.toLocaleString("ko-KR")}</b>}
        </button>
      ))}
    </nav>
  );
}

export function SeoulAutoGalleryCompanyDirectory() {
  return (
    <section className="sag-company-directory" aria-labelledby="sag-company-directory-title">
      <h2 id="sag-company-directory-title">입점 상사</h2>
      <div className="sag-company-list">
        {companies.map((company) => (
          <button key={company.name} type="button" className="sag-company-row">
            <span>
              <strong>{company.name}</strong>
              <small>소속 딜러 {company.dealerCount}명</small>
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
        <div><dt>입점 상사</dt><dd>단지 내 상사별 매물</dd></div>
        <div><dt>소속 딜러</dt><dd>딜러별 보유 매물</dd></div>
      </dl>
      <button type="button" className="sag-about__browse" onClick={onBrowse}>판매 차량 보기</button>
    </section>
  );
}
