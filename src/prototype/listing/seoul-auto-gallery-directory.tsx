import { ChevronRightIcon } from "@radix-ui/react-icons";
import { seoulAutoGalleryRows } from "../data/seoul-autogallery-v01";
import "./seoul-auto-gallery-directory.css";

export type SeoulAutoGallerySection = "vehicles" | "companies" | "dealers";

const tabItems: Array<{ value: SeoulAutoGallerySection; label: string }> = [
  { value: "vehicles", label: "판매 차량" },
  { value: "companies", label: "입점 상사" },
  { value: "dealers", label: "전문 딜러" },
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
          {item.label}
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
