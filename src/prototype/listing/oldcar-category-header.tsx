import { asset } from "../data";
import "./oldcar-category-header.css";

export function OldcarCategoryHeader() {
  return (
    <section className="oldcar-category-hero" aria-label="보배드림 올드카 소개">
      <img
        className="oldcar-category-hero-media"
        src={asset("oldcar-header/mercedes-benz-300sl-w198-official.jpg")}
        alt="메르세데스-벤츠 300 SL 걸윙 클래식카"
        draggable={false}
      />
      <div className="oldcar-category-hero-shade" aria-hidden="true" />
      <div className="oldcar-category-hero-copy">
        <strong>보배드림 올드카</strong>
        <span>국내 유일 올드카ㆍ클래식카 쇼핑몰</span>
      </div>
    </section>
  );
}
