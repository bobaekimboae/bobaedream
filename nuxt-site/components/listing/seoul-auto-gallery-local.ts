// 리액트 seoul-auto-gallery-directory.tsx · seoul-auto-gallery-dealer-rail.tsx 안의 export 안 된 계산(그대로 옮김).
// 원본을 고치면 여기도 같이 고친다.
import { seoulAutoGalleryRows } from "@proto/data/seoul-autogallery-v01";
import { seoulAutoGalleryShops } from "@proto/data/seoul-autogallery-shops-v01";
import { dealerSnsLinks } from "@proto/data/seoul-autogallery-sns-v01";
import { allSeoulAutoGalleryDealers, dealerPhoto, type SeoulAutoGalleryDealer } from "@proto/listing/seoul-auto-gallery-dealer-rail";

import type { SeoulAutoGallerySection } from "@proto/listing/seoul-auto-gallery-directory";
export type { SeoulAutoGallerySection };

// --- seoul-auto-gallery-directory.tsx
export const sagTabItems: Array<{ value: SeoulAutoGallerySection; label: string }> = [
  { value: "vehicles", label: "판매 차량" },
  { value: "companies", label: "상사" },
  { value: "dealers", label: "딜러" },
  { value: "about", label: "소개" },
];
export const roomLabel = (room: string) => (room.startsWith("금관") || room.startsWith("은관") ? room : `은관 ${room}`);
export const sagDisplayCompany = (name: string) => name.replace(/\(주\)|주식회사/g, "").trim();
export const sagCompanies = (() => {
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

// --- seoul-auto-gallery-dealer-rail.tsx
export const shopLabel = (company: string) => company.replace(/\(주\)|\(유\)|주식회사/g, "").replace(/\s+/g, " ").trim();
export const companyOf = (dealer: SeoulAutoGalleryDealer) => shopLabel(seoulAutoGalleryShops.find((shop) => shop.shopNo === dealer.shopNo)?.company ?? "");
export const iconBase = typeof document === "undefined" ? import.meta.env.BASE_URL : new URL(".", document.location.href).pathname;
export const snsOf = (dealer: SeoulAutoGalleryDealer) => dealerSnsLinks(dealer.shopNo, dealer.name);
