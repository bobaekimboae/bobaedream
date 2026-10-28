// 리액트 deutsch-autoworld-directory.tsx 안의 export 안 된 계산(그대로 옮김). 원본을 고치면 여기도 같이 고친다.
import type { Car } from "@proto/data";
import { allDeutschDealers, allDeutschShops, deutschShopCars, type DeutschSection } from "@proto/listing/deutsch-autoworld-directory";
import type { SeoulAutoGalleryDealer } from "@proto/listing/seoul-auto-gallery-dealer-rail";

export const dealerOf = (car: Car) => car.realDealer?.dealer.trim() ?? "";
const dealerHref = (dealer: SeoulAutoGalleryDealer) => `${window.location.pathname}?qf=guazi&profile=dealer&shop=${dealer.shopNo}&emp=${dealer.empNo}`;
export const openDealer = (dealer: SeoulAutoGalleryDealer) => window.location.assign(dealerHref(dealer));

export const dawTabItems: Array<{ value: DeutschSection; label: string }> = [
  { value: "vehicles", label: "판매 차량" },
  { value: "companies", label: "상사" },
  { value: "dealers", label: "딜러" },
  { value: "about", label: "소개" },
];

export const dawCompanies = allDeutschShops
  .map((shop, index) => {
    const members = allDeutschDealers.filter((dealer) => dealer.shopNo === shop.shopNo);
    const owner = members[0];
    return { shop, index, owner, memberCount: members.length, listingCount: deutschShopCars(shop.shopNo).length };
  })
  .filter((item) => item.owner)
  .sort((a, b) => b.listingCount - a.listingCount || b.shop.dealerCount - a.shop.dealerCount || a.index - b.index);

export const DAW_PAGE = 60;
export const sortedDealers = [...allDeutschDealers].sort((a, b) => b.listingCount - a.listingCount || (a.role === "대표" ? -1 : 0) - (b.role === "대표" ? -1 : 0));
export const railDealers = [...allDeutschDealers].filter((dealer) => dealer.role !== "대표").sort((a, b) => b.listingCount - a.listingCount).slice(0, 10);
