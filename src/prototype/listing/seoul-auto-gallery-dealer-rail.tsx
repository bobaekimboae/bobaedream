import { asset } from "../data";
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
  { name: "강홍구", listingCount: 23, shopNo: "450555", empNo: "1", image: "dealer-01.png" },
  { name: "서용석", listingCount: 23, shopNo: "450441", empNo: "1", image: "dealer-03.png" },
  { name: "주한솔", listingCount: 21, shopNo: "450560", empNo: "1", image: "dealer-05.png" },
  { name: "박진희", listingCount: 5, shopNo: "450563", empNo: "1", image: "dealer-02.png" },
  { name: "방지윤", listingCount: 2, shopNo: "450560", empNo: "4", image: "dealer-04.png" },
] as const;

const dealerPhoto = (dealer: SeoulAutoGalleryDealer) => asset(dealer.profileAsset ?? `dealer-illustrations/seoul-auto-gallery/v02/suit/${dealer.image}`);

export function SeoulAutoGalleryDealerRail({ onOpenDealer }: { onOpenDealer?: (dealer: SeoulAutoGalleryDealer) => void }) {
  return (
    <section className="sag-dealer-rail" aria-labelledby="sag-dealer-rail-title">
      <h2 id="sag-dealer-rail-title">딜러</h2>
      <div className="sag-dealer-track">
        {dealers.map((dealer) => (
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

