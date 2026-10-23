import { useMemo, useState, type ReactNode } from "react";
import { ChevronRightIcon } from "@radix-ui/react-icons";
import { asset, deutschAutoworldCars, type Car } from "../data";
import { deutschAutoworldShops, type DeutschAutoworldShop } from "../data/deutsch-autoworld-shops-v01";
import { deutschAutoworldStaffRaw } from "../data/deutsch-autoworld-staff-v01";
import { deutschDealerPhotoRows } from "../data/deutsch-autoworld-dealer-photos-v01";
import { SagGoogleMap } from "./sag-google-map";
import type { SeoulAutoGalleryDealer } from "./seoul-auto-gallery-dealer-rail";
import "./seoul-auto-gallery-dealer-rail.css";
import "./seoul-auto-gallery-directory.css";
import "./deutsch-autoworld-directory.css";
import { CompanyFinder, companyIndexOf, DealerIndex, matchCompany, matchDealer, useCompanyFinder } from "./company-finder";

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
// 상사명으로 공개 상사 목록에서 찾기만 한다(없으면 undefined, 새 상사를 만들지 않음).
function findDeutschShop(company: string): DeutschAutoworldShop | undefined {
  const key = norm(company);
  return deutschAutoworldShops.find((shop) => shop.company === company)
    ?? [...deutschAutoworldShops.filter((shop) => norm(shop.company) === key)].sort(byDealers)[0]
    ?? [...deutschAutoworldShops.filter((shop) => key.startsWith(norm(shop.company)) || norm(shop.company).startsWith(key))].sort(byDealers)[0]
    ?? extraShops.find((shop) => norm(shop.company) === key);
}
export function deutschShopForCompany(raw: string): DeutschAutoworldShop {
  const company = raw.trim();
  const cached = shopCache.get(company);
  if (cached) return cached;
  const shop = findDeutschShop(company) ?? (() => {
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

// 상사 로고(2026-10-23 「사진도 업데이트해라」): dautoworld.com 상사 페이지(storeView)에 올라온 상사 대표 이미지 73곳을 240×240 흰 정사각에 맞춘 사본.
// 원본 이미지는 고치지 않았다. 서류 사진(개인 얼굴 포함)이 올라온 케이에스자동차는 뺐다. 딜러 사진은 사이트에 실제 사진이 없어(전부 기본 그림) 넣지 않았다.
const shopLogoIds = new Set(["100003", "100004", "100007", "100008", "100010", "100011", "100014", "100016", "100017", "100018", "100019", "100020", "100021", "100022", "100023", "100024", "100025", "100026", "100027", "100029", "100031", "100032", "100033", "100034", "100035", "100038", "100040", "100041", "100045", "100046", "100047", "100049", "100050", "100053", "100055", "100058", "100059", "100061", "100062", "100063", "100064", "100065", "100067", "100068", "100069", "100070", "100072", "100073", "100075", "100077", "100079", "100082", "100083", "100084", "100087", "100088", "100090", "100093", "100094", "100100", "100101", "100102", "100105", "100112", "100113", "100115", "100121", "100122", "100123", "100125", "100129", "100132", "100139"]);
export const deutschShopLogo = (shopNo: string) => shopLogoIds.has(shopNo.replace(DEUTSCH_SHOP_PREFIX, "")) ? asset(`deutsch-autoworld/shop-logos/${shopNo.replace(DEUTSCH_SHOP_PREFIX, "")}.webp`) : undefined;

// 딜러 실사진(2026-10-23 「실제 사진과 딜러 매핑해라」): dautoworld.com 소속딜러 목록에 딜러가 직접 올린 사진 51장 중 얼굴 사진 33장만
// 240×240 정사각으로 잘라 썼다(원본 비율 · 색 그대로, 자르기만). 명함 · 사원증(전화 · 사원번호 노출) · 풍경 · 캐릭터 사진 18장은 쓰지 않았다.
const dealerPhotoIds: Record<string, string> = { "da100003:박기철": "100003_006", "da100003:조영진": "100003_030", "da100018:이재현": "100018_056", "da100020:장진영": "100020_108", "da100021:박병찬": "100021_006", "da100021:신청남": "100021_022", "da100023:황성원": "100023_020", "da100025:김남훈": "100025_003", "da100050:방효재": "100050_060", "da100055:곽현덕": "100055_003", "da100058:이영완": "100058_012", "da100063:신현우": "100063_010", "da100077:편수용": "100077_067", "da100088:주훈탁": "100088_030", "da100102:함정수": "100102_001", "da100102:조동혁": "100102_004", "da100102:김은혜": "100102_005", "da100102:여운혁": "100102_006", "da100102:김정헌": "100102_007", "da100102:양재동": "100102_016", "da100102:박진완": "100102_017", "da100102:선현우": "100102_018", "da100102:김수범": "100102_019", "da100102:오정윤": "100102_020", "da100102:전은희": "100102_022", "da100102:박성호": "100102_023", "da100102:김재희": "100102_024", "da100102:유연주": "100102_025", "da100102:김세형": "100102_026", "da100102:김지수": "100102_027", "da100102:서청원": "100102_028", "da100102:이부현": "100102_029", "da100102:남지훈": "100102_031" };
// 매물 정보의 딜러 실사진(2026-10-23 「딜러사진 실제 매물정보에서 실사진 매핑시켜라」): 차란차 매물 딜러의 프로필 사진 276장을
// 그 딜러의 상사(위와 같은 상사명 맞춤) + 이름으로 붙인다. 없으면 dautoworld 소속딜러 사진(33장), 그것도 없으면 정장 일러스트.
// 검수(2026-10-23 「딜러 사진봐봐 맞는지」): 이름 · 상사명 앞뒤 빈칸을 지우고, 같은 상사 + 같은 이름에 서로 다른 사진이
// 둘 이상이면(동명이인일 수 있음) 그 딜러에는 사진을 붙이지 않는다. 사진은 그 상사 명단 · 매물에 있는 이름에만 붙는다(아래 allDeutschDealers).
const listingPhotoIds = new Map<string, string>();
const conflictedPhotoKeys = new Set<string>();
for (const [company, name, id] of deutschDealerPhotoRows) {
  const shop = findDeutschShop(company.trim());
  if (!shop) continue;
  const key = `${shop.shopNo}:${name.trim()}`;
  const prev = listingPhotoIds.get(key);
  if (prev && prev !== id) conflictedPhotoKeys.add(key);
  listingPhotoIds.set(key, id);
}
for (const key of conflictedPhotoKeys) listingPhotoIds.delete(key);
const DEUTSCH_DEFAULT_AVATAR = "deutsch-autoworld/dealer-avatar-as24.svg";
// 차란차 사진이 없는 이병훈: 첫차 공개 프로필의 이름·제이원모터스·도이치오토월드가 모두 일치.
// 원본과 확인 내역: public/assets/deutsch-autoworld/dealer-photos-verified/CREDITS.md,
// docs/deutsch-top10-profile-audit.md. 상사+이름으로 한정해 다른 동명이인에게 붙이지 않는다.
const verifiedPortraits: Record<string, string> = {
  "da100079:이병훈": "deutsch-autoworld/dealer-photos-verified/lee-byeonghun.jpg",
};
const staffRole: Record<string, string> = { o: "대표", m: "사무장", d: "소속딜러" };
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
  // 사이트 소속 인원 전수(2026-10-23 「딜러 전수 모두 추가해라」): 위에 없는 사람을 사이트 순서대로 뒤에 붙인다(기존 emp 번호는 그대로).
  const known = new Set([...owners, ...staff].map((dealer) => dealer.name));
  const roster = (deutschAutoworldStaffRaw[shop.shopNo] ?? "").split(",").filter(Boolean).map((item) => item.split(":") as [string, string]);
  const rosterRole = new Map(roster.map(([name, code]) => [name, staffRole[code] ?? "소속딜러"]));
  for (const dealer of staff) { const role = rosterRole.get(dealer.name); if (role && role !== "대표") dealer.role = role; }
  const rest = roster
    .filter(([name]) => !known.has(name))
    .map(([name, code], index): SeoulAutoGalleryDealer => {
      const order = owners.length + staff.length + index;
      return { name, listingCount: 0, shopNo: shop.shopNo, empNo: String(order + 1), image: picture(order), role: staffRole[code] ?? "소속딜러" };
    });
  return [...owners, ...staff, ...rest].map((dealer) => {
    const verified = verifiedPortraits[`${dealer.shopNo}:${dealer.name}`];
    if (verified) return { ...dealer, profileAsset: verified };
    const real = listingPhotoIds.get(`${dealer.shopNo}:${dealer.name}`);
    if (real) return { ...dealer, profileAsset: `deutsch-autoworld/dealer-photos-cha/${real}.webp` };
    const photo = dealerPhotoIds[`${dealer.shopNo}:${dealer.name}`];
    // 실사진이 없거나 맞는 사진을 가릴 수 없는 딜러는 정장 일러스트 대신 오토스카우트24 기본 프로필(사람 아이콘)로 둔다(2026-10-23 「사진 안맞는건 오토스카우트 프로필로해」).
    return { ...dealer, profileAsset: photo ? `deutsch-autoworld/dealer-photos/${photo}.webp` : DEUTSCH_DEFAULT_AVATAR };
  });
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
  const finder = useCompanyFinder();
  const list = companies
    .filter(({ shop }) => (!finder.letter || companyIndexOf(displayCompany(shop.company)) === finder.letter) && matchCompany(finder.query, displayCompany(shop.company), [...shop.owners, shop.room]))
    .sort((a, b) => finder.letter ? displayCompany(a.shop.company).localeCompare(displayCompany(b.shop.company), "ko") : 0);
  return (
    <section className="sag-company-directory" aria-labelledby="daw-company-directory-title">
      <CompanyFinder finder={finder} names={companies.map(({ shop }) => displayCompany(shop.company))} />
      <h2 id="daw-company-directory-title">상사 {list.length}곳</h2>
      {list.length ? (
        <div className="sag-company-list">
          {list.map(({ shop, owner, memberCount, listingCount }) => (
            <button key={shop.shopNo} type="button" className="sag-company-row" onClick={() => openDealer(owner!)} aria-label={`${displayCompany(shop.company)} ${shop.owners.length ? `대표 ${shop.owners.join(", ")} ` : ""}판매자페이지 보기`}>
              <img className={`sag-company-photo${deutschShopLogo(shop.shopNo) ? " is-logo" : ""}`} src={deutschShopLogo(shop.shopNo) ?? deutschDealerPhoto(owner!)} alt="" loading="lazy" />
              <span>
                <strong>{displayCompany(shop.company)}</strong>
                <small>{[shop.room, shop.owners.length ? `대표 ${shop.owners.join(" · ")}` : "", `소속딜러 ${memberCount}명`].filter(Boolean).map((text) => <span key={text}>{text}</span>).reduce<ReactNode[]>((items, node, index) => index ? [...items, " · ", node] : [node], [])}</small>
              </span>
              <b>매물 {listingCount.toLocaleString("ko-KR")}대</b>
              <ChevronRightIcon aria-hidden="true" />
            </button>
          ))}
        </div>
      ) : (
        <div className="sag-dealer-empty">
          <p>찾는 상사가 없어요. 상사명이나 대표 이름을 다시 확인해 주세요.</p>
          <button type="button" onClick={() => { finder.setQuery(""); finder.setLetter(""); }}>검색 초기화</button>
        </div>
      )}
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

const PAGE = 60;

// 딜러 탭은 판매 차량이 많은 딜러부터(같으면 대표 먼저) 보여 준다. 카드의 대수는 딜러 본인 매물이다.
const sortedDealers = [...allDeutschDealers].sort((a, b) => b.listingCount - a.listingCount || (a.role === "대표" ? -1 : 0) - (b.role === "대표" ? -1 : 0));
// 「딜러」 탭: 이름 · 상사 검색 + 소속 상사 알약칩 + 상사명이 붙은 카드 격자(60명씩 더 보기)
export function DeutschAutoworldDealerDirectory() {
  const [query, setQuery] = useState("");
  const [shopNo, setShopNo] = useState("");
  const [letter, setLetter] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const shops = useMemo(() => companies
    .map(({ shop, memberCount }) => ({ shopNo: shop.shopNo, label: displayCompany(shop.company), count: memberCount }))
    .sort((a, b) => b.count - a.count), []);
  const scoped = sortedDealers.filter((dealer) => (!shopNo || dealer.shopNo === shopNo) && matchDealer(query, dealer.name, deutschShopByNo.get(dealer.shopNo)?.company ?? ""));
  const list = letter ? scoped.filter((dealer) => companyIndexOf(dealer.name) === letter).sort((a, b) => a.name.localeCompare(b.name, "ko")) : scoped;
  const reset = (next: () => void) => { next(); setLimit(PAGE); };
  return (
    <section className="sag-dealer-rail is-all" aria-labelledby="daw-dealer-directory-title">
      <label className="sag-dealer-search">
        <img src={asset("bbm/header-search.svg")} alt="" aria-hidden="true" />
        <input type="search" value={query} onChange={(event) => reset(() => setQuery(event.target.value))} placeholder="딜러 이름 · 상사 · 초성으로 검색" aria-label="딜러 검색" />
        {query ? <button type="button" aria-label="검색어 지우기" onClick={() => reset(() => setQuery(""))}>×</button> : null}
      </label>
      <div className="sag-dealer-shops" role="group" aria-label="소속 상사">
        <button type="button" aria-pressed={!shopNo} className={!shopNo ? "is-selected" : ""} onClick={() => reset(() => setShopNo(""))}>전체 {allDeutschDealers.length.toLocaleString("ko-KR")}</button>
        {shops.map((shop) => <button key={shop.shopNo} type="button" aria-pressed={shopNo === shop.shopNo} className={shopNo === shop.shopNo ? "is-selected" : ""} onClick={() => reset(() => setShopNo(shopNo === shop.shopNo ? "" : shop.shopNo))}>{shop.label} {shop.count}</button>)}
      </div>
      <DealerIndex names={scoped.map((dealer) => dealer.name)} letter={letter} onChange={(next) => reset(() => setLetter(next))} />
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
          <button type="button" onClick={() => reset(() => { setQuery(""); setShopNo(""); setLetter(""); })}>검색 초기화</button>
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
