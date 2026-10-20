import { asset } from "../data";
import { seoulAutoGalleryShops } from "../data/seoul-autogallery-shops-v01";
import { seoulAutoGalleryRows } from "../data/seoul-autogallery-v01";
import { seoulAutoGalleryStaffByShop } from "../data/seoul-autogallery-staff-v01";
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
  { name: "김태규", listingCount: 24, shopNo: "450554", empNo: "1", image: "dealer-kim-taegyu.png", profileAsset: "dealer-profile/twoj-motorworks/kim-taegyu.jpg", role: "대표", employeeNo: "26-003-00097" },
  { name: "김민석", listingCount: 0, shopNo: "450554", empNo: "5", image: "dealer-01.png", profileAsset: "dealer-profile/twoj-motorworks/kim-minseok.jpg", role: "인증딜러", employeeNo: "26-003-00108" },
  { name: "박명주", listingCount: 0, shopNo: "450554", empNo: "4", image: "dealer-03.png", profileAsset: "dealer-profile/twoj-motorworks/park-myeongju.jpg", role: "인증딜러", employeeNo: "26-003-00117" },
  { name: "이민규", listingCount: 0, shopNo: "450554", empNo: "3", image: "dealer-05.png", profileAsset: "dealer-profile/twoj-motorworks/lee-mingyu.jpg", role: "인증딜러", employeeNo: "26-003-00107" },
  { name: "강홍구", listingCount: 23, shopNo: "450555", empNo: "1", image: "dealer-01.png", profileAsset: "dealer-profile/seoul-auto-gallery/kang-honggu.jpg", role: "대표" },
  { name: "서용석", listingCount: 23, shopNo: "450441", empNo: "1", image: "dealer-03.png", profileAsset: "dealer-profile/seoul-auto-gallery/seo-yongseok.jpg", role: "대표" },
  { name: "주한솔", listingCount: 21, shopNo: "450560", empNo: "1", image: "dealer-05.png", profileAsset: "dealer-profile/seoul-auto-gallery/ju-hansol.jpg", role: "대표" },
  { name: "박진희", listingCount: 5, shopNo: "450563", empNo: "1", image: "dealer-02.png", profileAsset: "dealer-profile/seoul-auto-gallery/park-jinhui.jpg", role: "대표" },
  { name: "방지윤", listingCount: 2, shopNo: "450560", empNo: "4", image: "dealer-04.png", profileAsset: "dealer-profile/seoul-auto-gallery/bang-jiyun.jpg" },
] as const;

// 서울오토갤러리 회원사 79곳의 소속딜러 전원 판매자페이지(2026-10-21 「딜러 개개인 페이지 모두 만들어」).
// 상사마다 사이트 「소속딜러」 순서대로 만든다. 위 레일 딜러는 같은 상사·이름이면 그대로 쓰고(주소 유지),
// 대표는 대표 순번(emp 1·2), 나머지 딜러는 그 상사에서 비어 있는 다음 번호를 쓴다. 판매차량 수는 사이트 보유차량 대수.
const ownerIllustrations = ["dealer-01.png", "dealer-02.png", "dealer-03.png", "dealer-04.png", "dealer-05.png"] as const;
const sheetStock = (company: string, name: string) => seoulAutoGalleryRows.filter((row) => row.company === company && row.dealer === name).reduce((max, row) => Math.max(max, row.stock), 0);
export const seoulAutoGalleryOwnerDealers: readonly SeoulAutoGalleryDealer[] = seoulAutoGalleryShops.flatMap((shop, shopIndex) => {
  const staff = seoulAutoGalleryStaffByShop[shop.shopNo]?.staff ?? [];
  const railInShop = dealers.filter((item) => item.shopNo === shop.shopNo);
  const used = new Set<string>([...railInShop.map((item) => item.empNo), ...shop.owners.map((_, index) => String(index + 1))]);
  const nextEmp = () => { let n = 1; while (used.has(String(n))) n += 1; used.add(String(n)); return String(n); };
  const taken = new Set<SeoulAutoGalleryDealer>();
  const list: SeoulAutoGalleryDealer[] = [];
  const picture = (index: number) => ownerIllustrations[(shopIndex + index) % ownerIllustrations.length];
  shop.owners.forEach((owner, ownerIndex) => {
    const existing = railInShop.find((item) => item.name === owner && !taken.has(item));
    if (existing) { taken.add(existing); list.push(existing); return; }
    const site = staff.find(([name]) => name === owner);
    list.push({ name: owner, listingCount: site ? site[1] : sheetStock(shop.company, owner), shopNo: shop.shopNo, empNo: String(ownerIndex + 1), image: picture(ownerIndex), role: "대표" });
  });
  const ownerSlots = new Map(shop.owners.map((owner) => [owner, 1]));
  staff.forEach(([name, cars], index) => {
    const left = ownerSlots.get(name) ?? 0;
    if (left > 0) { ownerSlots.set(name, left - 1); return; }
    const existing = railInShop.find((item) => item.name === name && !taken.has(item));
    if (existing) { taken.add(existing); list.push(existing); return; }
    list.push({ name, listingCount: cars, shopNo: shop.shopNo, empNo: nextEmp(), image: picture(index + 1), role: "소속딜러" });
  });
  return list;
});
export const allSeoulAutoGalleryDealers: readonly SeoulAutoGalleryDealer[] = [...dealers, ...seoulAutoGalleryOwnerDealers.filter((owner) => !dealers.includes(owner))];

export const dealerPhoto = (dealer: SeoulAutoGalleryDealer) => asset(dealer.profileAsset ?? `dealer-illustrations/seoul-auto-gallery/v02/suit/${dealer.image}`);

// 레일(목록 위)은 기존 9명, 「딜러」 탭은 79개 상사의 소속딜러 전원을 격자로 보여 준다(2026-10-21 「딜러 개개인 페이지 모두 만들어」).
export function SeoulAutoGalleryDealerRail({ onOpenDealer, all = false }: { onOpenDealer?: (dealer: SeoulAutoGalleryDealer) => void; all?: boolean }) {
  const list = all ? allSeoulAutoGalleryDealers : dealers;
  return (
    <section className={`sag-dealer-rail${all ? " is-all" : ""}`} aria-labelledby="sag-dealer-rail-title">
      <h2 id="sag-dealer-rail-title">{all ? `딜러 ${list.length}명` : "딜러"}</h2>
      <div className="sag-dealer-track">
        {list.map((dealer) => (
          <button
            key={`${dealer.shopNo}-${dealer.empNo}`}
            type="button"
            className="sag-dealer-card"
            aria-label={`${dealer.name} 딜러 매물 ${dealer.listingCount}대 보기`}
            onClick={() => onOpenDealer?.(dealer)}
          >
            <img
              src={dealerPhoto(dealer)}
              alt=""
              aria-hidden="true"
              draggable={false}
            />
            <strong>{dealer.name}</strong>
            <span>{dealer.listingCount}대</span>
          </button>
        ))}
      </div>
    </section>
  );
}

