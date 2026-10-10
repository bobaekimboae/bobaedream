import { asset } from "../data";
import "./seoul-auto-gallery-header.css";

export function DeutschAutoworldHeader() {
  return (
    <section className="sag-category-hero sag-category-hero--deutsch" aria-label="도이치오토월드 안내">
      <img
        className="sag-category-hero__building"
        src={asset("deutsch-autoworld/header/building-bluehour-v01.png")}
        alt=""
        aria-hidden="true"
        draggable={false}
      />
      <div className="sag-category-hero__shade" aria-hidden="true" />
      <div className="sag-category-hero__content">
        <div className="sag-category-hero__copy">
          <h1>도이치오토월드</h1>
          <p>수입차 전문 매매단지</p>
        </div>
      </div>
    </section>
  );
}
