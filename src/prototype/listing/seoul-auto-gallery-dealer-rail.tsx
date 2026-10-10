import { asset } from "../data";
import "./seoul-auto-gallery-dealer-rail.css";

const dealers = [
  { name: "강홍구", listingCount: 23, shopNo: "450555", empNo: "1", image: "dealer-01.png" },
  { name: "서용석", listingCount: 23, shopNo: "450441", empNo: "1", image: "dealer-03.png" },
  { name: "주한솔", listingCount: 21, shopNo: "450560", empNo: "1", image: "dealer-05.png" },
  { name: "박진희", listingCount: 5, shopNo: "450563", empNo: "1", image: "dealer-02.png" },
  { name: "방지윤", listingCount: 2, shopNo: "450560", empNo: "4", image: "dealer-04.png" },
] as const;

const dealerInventoryUrl = (shopNo: string, empNo: string) =>
  `https://www.seoulautogallery.com/car/dealer_detail.html?EmpNo=${empNo}&ShopNo=${shopNo}`;

export function SeoulAutoGalleryDealerRail() {
  return (
    <section className="sag-dealer-rail" aria-labelledby="sag-dealer-rail-title">
      <h2 id="sag-dealer-rail-title">딜러</h2>
      <div className="sag-dealer-track">
        {dealers.map((dealer) => (
          <a
            key={`${dealer.shopNo}-${dealer.empNo}`}
            className="sag-dealer-card"
            href={dealerInventoryUrl(dealer.shopNo, dealer.empNo)}
            target="_blank"
            rel="noreferrer"
            aria-label={`${dealer.name} 딜러 매물 ${dealer.listingCount}대 보기`}
          >
            <img
              src={asset(`dealer-illustrations/seoul-auto-gallery/v02/suit/${dealer.image}`)}
              alt=""
              aria-hidden="true"
              draggable={false}
            />
            <strong>{dealer.name}</strong>
            <span>{dealer.listingCount}대</span>
          </a>
        ))}
      </div>
    </section>
  );
}

