import { useMemo, useState, type ReactNode } from "react";
import { ChevronRightIcon } from "@radix-ui/react-icons";
import { asset, deutschAutoworldCars, type Car } from "../data";
import { deutschAutoworldShops, type DeutschAutoworldShop } from "../data/deutsch-autoworld-shops-v01";
import { SagGoogleMap } from "./sag-google-map";
import type { SeoulAutoGalleryDealer } from "./seoul-auto-gallery-dealer-rail";
import "./seoul-auto-gallery-dealer-rail.css";
import "./seoul-auto-gallery-directory.css";
import "./deutsch-autoworld-directory.css";

// 도이치오토월드 단지 · 상사 · 딜러 페이지(2026-10-23 「우리 오토갤러리 처럼 딜러 상사 단지페이지 만들어라」).
// 상사 = dautoworld.com 공개 상사 목록 114곳(대표 · 상사 전화 · 층·호수). 딜러 = 도이치오토월드 매물 4,298대의 실제 상사명 · 딜러명.
// 매물의 상사명은 ① 같은 이름 ② 띄어쓰기 · (주) · 주식회사를 뺀 이름(소속딜러가 많은 상사 우선) ③ 앞부분이 같은 이름 순으로 상사에 붙이고,
// 어느 상사와도 맞지 않는 5곳(에이엠씨인터내셔널 · TS오토 · 캐비어모터스 · 수원중고차 · 부싼카TV)은 대표 · 연락처 없는 상사로 따로 만든다.
// 딜러 개인 휴대폰 번호는 쓰지 않는다(판매자페이지 전화는 안심번호).
export const DEUTSCH_SHOP_PREFIX = "da";
export const DEUTSCH_MAIN_ADDRESS = "경기 수원시 권선구 권선로 308-5";

const norm = (value: string) => value.replace(/\(주\)|\(유\)|주식회사|\s/g, "");
export const displayCompany = (name: string) => name.replace(/\(주\)|\(유\)|주식회사/g, "").replace(/\s+/g, " ").trim();
const dealerOf = (car: Car) => car.realDealer?.dealer.trim() ?? "";

const extraShops: DeutschAutoworldShop[] = [];
const shopCache = new Map<string, DeutschAutoworldShop>();
const byDealers = (a: DeutschAutoworldShop, b: DeutschAutoworldShop) => b.dealerCount - a.dealerCount;
export function deutschShopForCompany(raw: string): DeutschAutoworldShop {
  const company = raw.trim();
  const cached = shopCache.get(company);
  if (cached) return cached;
  const key = norm(company);
  const found = deutschAutoworldShops.find((shop) => shop.company === company)
    ?? [...deutschAutoworldShops.filter((shop) => norm(shop.company) === key)].sort(byDealers)[0]
    ?? [...deutschAutoworldShops.filter((shop) => key.startsWith(norm(shop.company)) || norm(shop.company).startsWith(key))].sort(byDealers)[0];
  const shop = found ?? (() => {
    const made: DeutschAutoworldShop = { shopNo: `${DEUTSCH_SHOP_PREFIX}x${extraShops.length + 1}`, company, owners: [], room: "", phone: "", fax: "", dealerCount: 0, carCount: 0 };
    extraShops.push(made);
    return made;
  })();
  shopCache.set(company, shop);
  return shop;
}

const carsByShop = new Map<string, Car[]>();
for (const car of deutschAutoworldCars) {
  if (!car.realDealer) continue;
  const shop = deutschShopForCompany(car.realDealer.company);
  carsByShop.set(shop.shopNo, [...(carsByShop.get(shop.shopNo) ?? []), car]);
}

export const allDeutschShops: readonly DeutschAutoworldShop[] = [...deutschAutoworldShops, ...extraShops];
export const deutschShopByNo = new Map(allDeutschShops.map((shop) => [shop.shopNo, shop]));
export const isDeutschShop = (shopNo: string) => shopNo.startsWith(DEUTSCH_SHOP_PREFIX);
export const deutschShopCars = (shopNo: string) => carsByShop.get(shopNo) ?? [];

const illustrations = ["dealer-01.png", "dealer-02.png", "dealer-03.png", "dealer-04.png", "dealer-05.png"] as const;

// 상사마다 대표(대표 순번 1·2) → 매물이 많은 딜러 순으로 emp 번호를 매긴다. 대표 페이지는 그 상사 매물 전체를 보여 준다.
export const allDeutschDealers: readonly SeoulAutoGalleryDealer[] = allDeutschShops.flatMap((shop, shopIndex) => {
  const cars = deutschShopCars(shop.shopNo);
  const counts = new Map<string, number>();
  for (const car of cars) { const name = dealerOf(car); if (name) counts.set(name, (counts.get(name) ?? 0) + 1); }
  const picture = (index: number) => illustrations[(shopIndex + index) % illustrations.length];
  const owners: SeoulAutoGalleryDealer[] = shop.owners.map((name, index) => ({ name, listingCount: counts.get(name) ?? 0, shopNo: shop.shopNo, empNo: String(index + 1), image: picture(index), role: "대표" }));
  const staff = [...counts.entries()]
    .filter(([name]) => !shop.owners.includes(name))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko"))
    .map(([name, count], index): SeoulAutoGalleryDealer => ({ name, listingCount: count, shopNo: shop.shopNo, empNo: String(owners.length + index + 1), image: picture(owners.length + index), role: "소속딜러" }));
  return [...owners, ...staff];
});

export function deutschDealerCars(dealer: SeoulAutoGalleryDealer): Car[] {
  const cars = deutschShopCars(dealer.shopNo);
  return dealer.role === "대표" && dealer.empNo === "1" ? cars : cars.filter((car) => dealerOf(car) === dealer.name);
}

export function deutschDealerForCar(car: Car): SeoulAutoGalleryDealer | undefined {
  if (!car.realDealer || !car.place.includes("도이치오토월드")) return undefined;
  const shop = deutschShopForCompany(car.realDealer.company);
  const name = dealerOf(car);
  return allDeutschDealers.find((dealer) => dealer.shopNo === shop.shopNo && dealer.name === name)
    ?? allDeutschDealers.find((dealer) => dealer.shopNo === shop.shopNo);
}

export const deutschDealerPhoto = (dealer: SeoulAutoGalleryDealer) => asset(dealer.profileAsset ?? `dealer-illustrations/seoul-auto-gallery/v02/suit/${dealer.image}`);
const dealerHref = (dealer: SeoulAutoGalleryDealer) => `${window.location.pathname}?qf=guazi&profile=dealer&shop=${dealer.shopNo}&emp=${dealer.empNo}`;
const openDealer = (dealer: SeoulAutoGalleryDealer) => window.location.assign(dealerHref(dealer));

export type DeutschSection = "vehicles" | "companies" | "dealers" | "about";
const tabItems: Array<{ value: DeutschSection; label: string }> = [
  { value: "vehicles", label: "판매 차량" },
  { value: "companies", label: "상사" },
  { value: "dealers", label: "딜러" },
  { value: "about", label: "소개" },
];

export function DeutschAutoworldTabs({ value, onChange }: { value: DeutschSection; onChange: (value: DeutschSection) => void }) {
  return (
    <nav className="sag-directory-tabs" role="tablist" aria-label="도이치오토월드 탐색">
      {tabItems.map((item) => (
        <button key={item.value} type="button" role="tab" aria-selected={value === item.value} className={value === item.value ? "is-selected" : undefined} onClick={() => onChange(item.value)}>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

const companies = allDeutschShops
  .map((shop, index) => {
    const members = allDeutschDealers.filter((dealer) => dealer.shopNo === shop.shopNo);
    const owner = members[0];
    return { shop, index, owner, memberCount: members.length, listingCount: deutschShopCars(shop.shopNo).length };
  })
  .filter((item) => item.owner)
  .sort((a, b) => b.listingCount - a.listingCount || b.shop.dealerCount - a.shop.dealerCount || a.index - b.index);

export function DeutschAutoworldCompanyDirectory() {
  return (
    <section className="sag-company-directory" aria-labelledby="daw-company-directory-title">
      <h2 id="daw-company-directory-title">상사 {companies.length}곳</h2>
      <div className="sag-company-list">
        {companies.map(({ shop, owner, memberCount, listingCount }) => (
          <button key={shop.shopNo} type="button" className="sag-company-row" onClick={() => openDealer(owner!)} aria-label={`${displayCompany(shop.company)} ${shop.owners.length ? `대표 ${shop.owners.join(", ")} ` : ""}판매자페이지 보기`}>
            <img className="sag-company-photo" src={deutschDealerPhoto(owner!)} alt="" loading="lazy" />
            <span>
              <strong>{displayCompany(shop.company)}</strong>
              <small>{[shop.room, shop.owners.length ? `대표 ${shop.owners.join(" · ")}` : "", `소속딜러 ${memberCount}명`].filter(Boolean).map((text) => <span key={text}>{text}</span>).reduce<ReactNode[]>((list, node, index) => index ? [...list, " · ", node] : [node], [])}</small>
            </span>
            <b>매물 {listingCount.toLocaleString("ko-KR")}대</b>
            <ChevronRightIcon aria-hidden="true" />
          </button>
        ))}
      </div>
    </section>
  );
}

function DealerCard({ dealer, showCompany }: { dealer: SeoulAutoGalleryDealer; showCompany?: boolean }) {
  const company = showCompany ? displayCompany(deutschShopByNo.get(dealer.shopNo)?.company ?? "") : "";
  return (
    <button type="button" className="sag-dealer-card" aria-label={`${dealer.name} 딜러${company ? ` · ${company}` : ""} 매물 ${dealer.listingCount}대 보기`} onClick={() => openDealer(dealer)}>
      <span className="sag-dealer-photo"><img src={deutschDealerPhoto(dealer)} alt="" aria-hidden="true" draggable={false} loading="lazy" /></span>
      <strong>{dealer.name}</strong>
      {company ? <em>{company}</em> : null}
      <span>{dealer.listingCount}대</span>
    </button>
  );
}

const normalizeQuery = (value: string) => value.toLowerCase().replace(/\s+/g, "");
const PAGE = 60;

// 딜러 탭은 판매 차량이 많은 딜러부터(같으면 대표 먼저) 보여 준다. 카드의 대수는 딜러 본인 매물이다.
const sortedDealers = [...allDeutschDealers].sort((a, b) => b.listingCount - a.listingCount || (a.role === "대표" ? -1 : 0) - (b.role === "대표" ? -1 : 0));
// 「딜러」 탭: 이름 · 상사 검색 + 소속 상사 알약칩 + 상사명이 붙은 카드 격자(60명씩 더 보기)
export function DeutschAutoworldDealerDirectory() {
  const [query, setQuery] = useState("");
  const [shopNo, setShopNo] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const shops = useMemo(() => companies
    .map(({ shop, memberCount }) => ({ shopNo: shop.shopNo, label: displayCompany(shop.company), count: memberCount }))
    .sort((a, b) => b.count - a.count), []);
  const q = normalizeQuery(query);
  const list = sortedDealers.filter((dealer) => (!shopNo || dealer.shopNo === shopNo) && (!q || normalizeQuery(dealer.name).includes(q) || normalizeQuery(deutschShopByNo.get(dealer.shopNo)?.company ?? "").includes(q)));
  const reset = (next: () => void) => { next(); setLimit(PAGE); };
  return (
    <section className="sag-dealer-rail is-all" aria-labelledby="daw-dealer-directory-title">
      <label className="sag-dealer-search">
        <img src={asset("bbm/header-search.svg")} alt="" aria-hidden="true" />
        <input type="search" value={query} onChange={(event) => reset(() => setQuery(event.target.value))} placeholder="딜러 이름이나 상사로 검색" aria-label="딜러 검색" />
        {query ? <button type="button" aria-label="검색어 지우기" onClick={() => reset(() => setQuery(""))}>×</button> : null}
      </label>
      <div className="sag-dealer-shops" role="group" aria-label="소속 상사">
        <button type="button" aria-pressed={!shopNo} className={!shopNo ? "is-selected" : ""} onClick={() => reset(() => setShopNo(""))}>전체 {allDeutschDealers.length.toLocaleString("ko-KR")}</button>
        {shops.map((shop) => <button key={shop.shopNo} type="button" aria-pressed={shopNo === shop.shopNo} className={shopNo === shop.shopNo ? "is-selected" : ""} onClick={() => reset(() => setShopNo(shopNo === shop.shopNo ? "" : shop.shopNo))}>{shop.label} {shop.count}</button>)}
      </div>
      <h2 id="daw-dealer-directory-title">딜러 {list.length.toLocaleString("ko-KR")}명</h2>
      {list.length ? (
        <>
          <div className="sag-dealer-track">
            {list.slice(0, limit).map((dealer) => <DealerCard key={`${dealer.shopNo}-${dealer.empNo}`} dealer={dealer} showCompany />)}
          </div>
          {list.length > limit ? <button type="button" className="daw-more" onClick={() => setLimit((value) => value + PAGE)}>딜러 더 보기 ({limit.toLocaleString("ko-KR")} / {list.length.toLocaleString("ko-KR")})</button> : null}
        </>
      ) : (
        <div className="sag-dealer-empty">
          <p>찾는 딜러가 없어요. 이름이나 상사명을 다시 확인해 주세요.</p>
          <button type="button" onClick={() => reset(() => { setQuery(""); setShopNo(""); })}>검색 초기화</button>
        </div>
      )}
    </section>
  );
}

// 판매 차량 탭 위 딜러 레일: 매물이 많은 소속딜러 10명
const railDealers = [...allDeutschDealers].filter((dealer) => dealer.role !== "대표").sort((a, b) => b.listingCount - a.listingCount).slice(0, 10);
export function DeutschAutoworldDealerRail() {
  return (
    <section className="sag-dealer-rail" aria-labelledby="daw-dealer-rail-title">
      <h2 id="daw-dealer-rail-title">딜러</h2>
      <div className="sag-dealer-track">
        {railDealers.map((dealer) => <DealerCard key={`${dealer.shopNo}-${dealer.empNo}`} dealer={dealer} />)}
      </div>
    </section>
  );
}

export function DeutschAutoworldAbout({ onBrowse }: { onBrowse: () => void }) {
  return (
    <section className="sag-about" aria-labelledby="daw-about-title">
      <div className="sag-about__lead">
        <p>DEUTSCH AUTOWORLD</p>
        <h2 id="daw-about-title">도이치오토월드</h2>
        <strong>수원 권선구 고색동,<br />수입차 · 국산차 중고차 매매단지</strong>
      </div>
      <dl className="sag-about__facts">
        <div><dt>판매 차량</dt><dd>{deutschAutoworldCars.length.toLocaleString("ko-KR")}대</dd></div>
        <div><dt>상사</dt><dd>{companies.length}곳</dd></div>
        <div><dt>딜러</dt><dd>{allDeutschDealers.length.toLocaleString("ko-KR")}명</dd></div>
      </dl>
      <button type="button" className="sag-about__browse" onClick={onBrowse}>판매 차량 보기</button>
      <SagGoogleMap title="오시는 길" address={DEUTSCH_MAIN_ADDRESS} query={`도이치오토월드 ${DEUTSCH_MAIN_ADDRESS}`} place="도이치오토월드 · 고색동" />
    </section>
  );
}
