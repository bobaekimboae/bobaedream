import { asset } from "../data";
import "./seoul-auto-gallery-dealer-rail.css";

export const dealers = [
  { name: "김태규", listingCount: 24, shopNo: "450554", empNo: "1", image: "dealer-kim-taegyu.png" },
  { name: "강홍구", listingCount: 23, shopNo: "450555", empNo: "1", image: "dealer-01.png" },
  { name: "서용석", listingCount: 23, shopNo: "450441", empNo: "1", image: "dealer-03.png" },
  { name: "주한솔", listingCount: 21, shopNo: "450560", empNo: "1", image: "dealer-05.png" },
  { name: "박진희", listingCount: 5, shopNo: "450563", empNo: "1", image: "dealer-02.png" },
  { name: "방지윤", listingCount: 2, shopNo: "450560", empNo: "4", image: "dealer-04.png" },
] as const;

export type SeoulAutoGalleryDealer = (typeof dealers)[number];

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
              src={asset(`dealer-illustrations/seoul-auto-gallery/v02/suit/${dealer.image}`)}
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

