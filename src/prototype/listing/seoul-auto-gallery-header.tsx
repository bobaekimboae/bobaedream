import { asset } from "../data";
import "./seoul-auto-gallery-header.css";

export function SeoulAutoGalleryHeader() {
  return (
    <section className="sag-category-hero" aria-label="서울오토갤러리 안내">
      <img
        className="sag-category-hero__building"
        src={asset("seoul-auto-gallery/header/building-bluehour-v01.png")}
        alt=""
        aria-hidden="true"
        draggable={false}
      />
      <div className="sag-category-hero__shade" aria-hidden="true" />
      <div className="sag-category-hero__content">
        <img
          className="sag-category-hero__mark"
          src={asset("seoul-auto-gallery/header/sag-mark-banner-v02.png")}
          alt=""
          aria-hidden="true"
          draggable={false}
        />
        <div className="sag-category-hero__copy">
          <h1>서울오토갤러리</h1>
          <p>수입차 전문 매매단지</p>
        </div>
      </div>
    </section>
  );
}
