import { useMemo, useState } from "react";
import { matchDealer } from "./company-finder";
import { asset } from "../data";
import { seoulAutoGalleryShops } from "../data/seoul-autogallery-shops-v01";
import { seoulAutoGalleryRows } from "../data/seoul-autogallery-v01";
import { seoulAutoGalleryFormalProfilesByShopAndName } from "../data/seoul-autogallery-profile-assets-v01";
import { seoulAutoGalleryStaffByShop } from "../data/seoul-autogallery-staff-v01";
import { dealerSnsLinks } from "../data/seoul-autogallery-sns-v01";
import "./seoul-auto-gallery-dealer-rail.css";

export type SeoulAutoGalleryDealer = {
  name: string;
  listingCount: number;
  shopNo: string;
  empNo: string;
  image: string;
  profileAsset?: string;
  role?: string;
  employeeNo?: string;
};

export const dealers: readonly SeoulAutoGalleryDealer[] = [
  { name: "김태규", listingCount: 24, shopNo: "450554", empNo: "1", image: "dealer-kim-taegyu.png", profileAsset: "dealer-profile/twoj-motorworks/kim-taegyu-formal.png", role: "대표", employeeNo: "26-003-00097" },
  { name: "김민석", listingCount: 0, shopNo: "450554", empNo: "5", image: "dealer-01.png", profileAsset: "dealer-profile/twoj-motorworks/kim-minseok-formal.png", role: "인증딜러", employeeNo: "26-003-00108" },
  { name: "박명주", listingCount: 0, shopNo: "450554", empNo: "4", image: "dealer-03.png", profileAsset: "dealer-profile/twoj-motorworks/park-myeongju.jpg", role: "인증딜러", employeeNo: "26-003-00117" },
  { name: "이민규", listingCount: 0, shopNo: "450554", empNo: "3", image: "dealer-05.png", profileAsset: "dealer-profile/twoj-motorworks/lee-mingyu-formal.png", role: "인증딜러", employeeNo: "26-003-00107" },
  { name: "강홍구", listingCount: 23, shopNo: "450555", empNo: "1", image: "dealer-01.png", profileAsset: "dealer-profile/seoul-auto-gallery/kang-honggu-formal.png", role: "대표" },
  { name: "서용석", listingCount: 23, shopNo: "450441", empNo: "1", image: "dealer-03.png", profileAsset: "dealer-profile/seoul-auto-gallery/seo-yongseok-formal.png", role: "대표" },
  { name: "주한솔", listingCount: 21, shopNo: "450560", empNo: "1", image: "dealer-05.png", profileAsset: "dealer-profile/seoul-auto-gallery/ju-hansol-formal.png", role: "대표" },
  { name: "박진희", listingCount: 5, shopNo: "450563", empNo: "1", image: "dealer-02.png", profileAsset: "dealer-profile/seoul-auto-gallery/park-jinhui-formal.png", role: "대표" },
  { name: "방지윤", listingCount: 2, shopNo: "450560", empNo: "4", image: "dealer-04.png", profileAsset: "dealer-profile/seoul-auto-gallery/bang-jiyun-formal.png" },
] as const;

// 서울오토갤러리 회원사 79곳의 소속딜러 전원 판매자페이지(2026-10-21 「딜러 개개인 페이지 모두 만들어」).
// 상사마다 사이트 「소속딜러」 순서대로 만든다. 위 레일 딜러는 같은 상사·이름이면 그대로 쓰고(주소 유지),
// 대표는 대표 순번(emp 1·2), 나머지 딜러는 그 상사에서 비어 있는 다음 번호를 쓴다. 판매차량 수는 사이트 보유차량 대수.
// 차란차 매물 딜러 프로필에서 얼굴만 잘라 붙인 실사진(2026-10-23 「차란차 프로필 백엔드에서 추출해 사진 매핑」). 상사 번호 + 이름이 같을 때만 쓴다.
const seoulChaRealPhotos: Record<string, string> = { "450087:노대규": "seoul-autogallery/dealer-photos-cha/8b7ce883.webp", "450087:김동우": "seoul-autogallery/dealer-photos-cha/c8a13c76.webp" };
const ownerIllustrations = ["dealer-01.png", "dealer-02.png", "dealer-03.png", "dealer-04.png", "dealer-05.png"] as const;
const sheetStock = (company: string, name: string) => seoulAutoGalleryRows.filter((row) => row.company === company && row.dealer === name).reduce((max, row) => Math.max(max, row.stock), 0);
export const seoulAutoGalleryOwnerDealers: readonly SeoulAutoGalleryDealer[] = seoulAutoGalleryShops.flatMap((shop, shopIndex) => {
  const staff = seoulAutoGalleryStaffByShop[shop.shopNo]?.staff ?? [];
  const railInShop = dealers.filter((item) => item.shopNo === shop.shopNo);
  const used = new Set<string>([...railInShop.map((item) => item.empNo), ...shop.owners.map((_, index) => String(index + 1))]);
  const nextEmp = () => { let n = 1; while (used.has(String(n))) n += 1; used.add(String(n)); return String(n); };
  const profileCursor = new Map<string, number>();
  const nextProfileAsset = (name: string) => {
    const key = `${shop.shopNo}:${name}`;
    const index = profileCursor.get(key) ?? 0;
    profileCursor.set(key, index + 1);
    const assets = seoulAutoGalleryFormalProfilesByShopAndName[key];
    return assets?.[index] ?? assets?.[0] ?? seoulChaRealPhotos[key];
  };
  const taken = new Set<SeoulAutoGalleryDealer>();
  const list: SeoulAutoGalleryDealer[] = [];
  const picture = (index: number) => ownerIllustrations[(shopIndex + index) % ownerIllustrations.length];
  shop.owners.forEach((owner, ownerIndex) => {
    const existing = railInShop.find((item) => item.name === owner && !taken.has(item));
    const profileAsset = nextProfileAsset(owner);
    if (existing) { taken.add(existing); list.push(existing); return; }
    const site = staff.find(([name]) => name === owner);
    list.push({ name: owner, listingCount: site ? site[1] : sheetStock(shop.company, owner), shopNo: shop.shopNo, empNo: String(ownerIndex + 1), image: picture(ownerIndex), profileAsset, role: "대표" });
  });
  const ownerSlots = new Map(shop.owners.map((owner) => [owner, 1]));
  staff.forEach(([name, cars], index) => {
    const left = ownerSlots.get(name) ?? 0;
    if (left > 0) { ownerSlots.set(name, left - 1); return; }
    const existing = railInShop.find((item) => item.name === name && !taken.has(item));
    const profileAsset = nextProfileAsset(name);
    if (existing) { taken.add(existing); list.push(existing); return; }
    list.push({ name, listingCount: cars, shopNo: shop.shopNo, empNo: nextEmp(), image: picture(index + 1), profileAsset, role: "소속딜러" });
  });
  return list;
});
export const allSeoulAutoGalleryDealers: readonly SeoulAutoGalleryDealer[] = [...dealers, ...seoulAutoGalleryOwnerDealers.filter((owner) => !dealers.includes(owner))];

export const dealerPhoto = (dealer: SeoulAutoGalleryDealer) => asset(dealer.profileAsset ?? `dealer-illustrations/seoul-auto-gallery/v02/suit/${dealer.image}`);

const shopLabel = (company: string) => company.replace(/\(주\)|\(유\)|주식회사/g, "").replace(/\s+/g, " ").trim();
const companyOf = (dealer: SeoulAutoGalleryDealer) => shopLabel(seoulAutoGalleryShops.find((shop) => shop.shopNo === dealer.shopNo)?.company ?? "");

// 인스타그램 · 유튜브가 있는 딜러(본인 또는 상사 공식 계정) 표시(2026-10-21 「우리 딜러 페이지에 링크 걸어줘」)
const iconBase = typeof document === "undefined" ? import.meta.env.BASE_URL : new URL(".", document.location.href).pathname;
const snsOf = (dealer: SeoulAutoGalleryDealer) => dealerSnsLinks(dealer.shopNo, dealer.name);

function DealerCard({ dealer, onOpenDealer, showCompany }: { dealer: SeoulAutoGalleryDealer; onOpenDealer?: (dealer: SeoulAutoGalleryDealer) => void; showCompany?: boolean }) {
  const company = showCompany ? companyOf(dealer) : "";
  const sns = snsOf(dealer);
  return (
    <button
      type="button"
      className="sag-dealer-card"
      aria-label={`${dealer.name} 딜러${company ? ` · ${company}` : ""}${sns ? ` · ${[sns.links.instagram ? "인스타그램" : "", sns.links.youtube ? "유튜브" : ""].filter(Boolean).join("·")} 있음` : ""} 매물 ${dealer.listingCount}대 보기`}
      onClick={() => onOpenDealer?.(dealer)}
    >
      <span className="sag-dealer-photo">
        <img src={dealerPhoto(dealer)} alt="" aria-hidden="true" draggable={false} />
        {sns ? <span className="sag-dealer-sns" aria-hidden="true">{sns.links.instagram ? <img src={`${iconBase}icons/dealer-profile/instagram.svg`} alt="" /> : null}{sns.links.youtube ? <img src={`${iconBase}icons/dealer-profile/youtube.svg`} alt="" /> : null}</span> : null}
      </span>
      <strong>{dealer.name}</strong>
      {company ? <em>{company}</em> : null}
      <span>{dealer.listingCount}대</span>
    </button>
  );
}

// 「딜러」 탭(2026-10-21 「딜러에 검색바랑 소속 상사 알약칩에 상사도 표기」): 이름·상사 검색 + 소속 상사 알약칩 + 카드에 상사명.
function SeoulAutoGalleryDealerDirectory({ onOpenDealer }: { onOpenDealer?: (dealer: SeoulAutoGalleryDealer) => void }) {
  const [query, setQuery] = useState("");
  const [shopNo, setShopNo] = useState("");
  const shops = useMemo(() => seoulAutoGalleryShops
    .map((shop, index) => ({ shopNo: shop.shopNo, label: shopLabel(shop.company), count: allSeoulAutoGalleryDealers.filter((dealer) => dealer.shopNo === shop.shopNo).length, index }))
    .filter((shop) => shop.count > 0)
    .sort((a, b) => b.count - a.count || a.index - b.index), []);
  const snsCount = allSeoulAutoGalleryDealers.filter((dealer) => snsOf(dealer)).length;
  const list = allSeoulAutoGalleryDealers.filter((dealer) => (!shopNo || (shopNo === "sns" ? Boolean(snsOf(dealer)) : dealer.shopNo === shopNo)) && matchDealer(query, dealer.name, companyOf(dealer)));
  return (
    <section className="sag-dealer-rail is-all" aria-labelledby="sag-dealer-rail-title">
      <label className="sag-dealer-search">
        <img src={asset("bbm/header-search.svg")} alt="" aria-hidden="true" />
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="딜러 이름 · 상사 · 초성으로 검색" aria-label="딜러 검색" />
        {query ? <button type="button" aria-label="검색어 지우기" onClick={() => setQuery("")}>×</button> : null}
      </label>
      <div className="sag-dealer-shops" role="group" aria-label="소속 상사">
        <button type="button" aria-pressed={!shopNo} className={!shopNo ? "is-selected" : ""} onClick={() => setShopNo("")}>전체 {allSeoulAutoGalleryDealers.length}</button>
        <button type="button" aria-pressed={shopNo === "sns"} className={`is-sns${shopNo === "sns" ? " is-selected" : ""}`} onClick={() => setShopNo(shopNo === "sns" ? "" : "sns")}><img src={`${iconBase}icons/dealer-profile/instagram.svg`} alt="" aria-hidden="true" />인스타 · 유튜브 {snsCount}</button>
        {shops.map((shop) => <button key={shop.shopNo} type="button" aria-pressed={shopNo === shop.shopNo} className={shopNo === shop.shopNo ? "is-selected" : ""} onClick={() => setShopNo(shopNo === shop.shopNo ? "" : shop.shopNo)}>{shop.label} {shop.count}</button>)}
      </div>
      <h2 id="sag-dealer-rail-title">딜러 {list.length}명</h2>
      {list.length ? (
        <div className="sag-dealer-track">
          {list.map((dealer) => <DealerCard key={`${dealer.shopNo}-${dealer.empNo}`} dealer={dealer} onOpenDealer={onOpenDealer} showCompany />)}
        </div>
      ) : (
        <div className="sag-dealer-empty">
          <p>찾는 딜러가 없어요. 이름이나 상사명을 다시 확인해 주세요.</p>
          <button type="button" onClick={() => { setQuery(""); setShopNo(""); }}>검색 초기화</button>
        </div>
      )}
    </section>
  );
}

// 레일(목록 위)은 기존 9명, 「딜러」 탭은 79개 상사의 소속딜러 전원을 검색·상사 알약칩과 함께 격자로 보여 준다.
export function SeoulAutoGalleryDealerRail({ onOpenDealer, all = false }: { onOpenDealer?: (dealer: SeoulAutoGalleryDealer) => void; all?: boolean }) {
  if (all) return <SeoulAutoGalleryDealerDirectory onOpenDealer={onOpenDealer} />;
  return (
    <section className="sag-dealer-rail" aria-labelledby="sag-dealer-rail-title">
      <h2 id="sag-dealer-rail-title">딜러</h2>
      <div className="sag-dealer-track">
        {dealers.map((dealer) => <DealerCard key={`${dealer.shopNo}-${dealer.empNo}`} dealer={dealer} onOpenDealer={onOpenDealer} />)}
      </div>
    </section>
  );
}
