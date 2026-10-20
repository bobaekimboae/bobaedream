import { asset } from "../data";
import { seoulAutoGalleryShops } from "../data/seoul-autogallery-shops-v01";
import { seoulAutoGalleryRows } from "../data/seoul-autogallery-v01";
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

// 서울오토갤러리 회원사 79곳의 대표 판매자페이지(2026-10-21). 위 레일 딜러(김태규 · 강홍구 · 서용석 · 주한솔 · 박진희)는
// 같은 상사·대표면 그대로 쓰고, 나머지 대표는 상사 번호(shop) + 대표 순번(emp 1·2)으로 만든다. 레일에는 넣지 않는다.
const ownerIllustrations = ["dealer-01.png", "dealer-02.png", "dealer-03.png", "dealer-04.png", "dealer-05.png"] as const;
export const seoulAutoGalleryOwnerDealers: readonly SeoulAutoGalleryDealer[] = seoulAutoGalleryShops.flatMap((shop, shopIndex) => shop.owners.map((owner, ownerIndex) => {
  const existing = dealers.find((item) => item.shopNo === shop.shopNo && item.name === owner);
  if (existing) return existing;
  const listingCount = seoulAutoGalleryRows.filter((row) => row.company === shop.company && row.dealer === owner).reduce((max, row) => Math.max(max, row.stock), 0);
  return { name: owner, listingCount, shopNo: shop.shopNo, empNo: String(ownerIndex + 1), image: ownerIllustrations[(shopIndex + ownerIndex) % ownerIllustrations.length], role: "대표" };
}));
export const allSeoulAutoGalleryDealers: readonly SeoulAutoGalleryDealer[] = [...dealers, ...seoulAutoGalleryOwnerDealers.filter((owner) => !dealers.includes(owner))];

export const dealerPhoto = (dealer: SeoulAutoGalleryDealer) => asset(dealer.profileAsset ?? `dealer-illustrations/seoul-auto-gallery/v02/suit/${dealer.image}`);

// 레일(목록 위)은 기존 9명, 「딜러」 탭은 상사 대표 88명을 포함한 전체를 격자로 보여 준다(2026-10-21 「전체상사 대표들 페이지 모두」).
export function SeoulAutoGalleryDealerRail({ onOpenDealer, all = false }: { onOpenDealer?: (dealer: SeoulAutoGalleryDealer) => void; all?: boolean }) {
  const list = all ? allSeoulAutoGalleryDealers : dealers;
  return (
    <section className={`sag-dealer-rail${all ? " is-all" : ""}`} aria-labelledby="sag-dealer-rail-title">
      <h2 id="sag-dealer-rail-title">{all ? `딜러 · 상사 대표 ${list.length}명` : "딜러"}</h2>
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

