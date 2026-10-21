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

// SK V1 모터스 단지 머리(2026-10-21 「조이모터스 … 단지도 새로 입력하고」): 도이치오토월드 머리와 같은 칸에 대표 상사 바로가기를 붙인다.
export function SkV1MotorsHeader({ cover, shopCount }: { cover?: string; shopCount: number }) {
  return (
    <section className="sag-category-hero sag-category-hero--deutsch sag-category-hero--skv1" aria-label="SK V1 모터스 안내">
      {cover ? <img className="sag-category-hero__building" src={cover} alt="" aria-hidden="true" draggable={false} /> : null}
      <div className="sag-category-hero__shade" aria-hidden="true" />
      <div className="sag-category-hero__content">
        <div className="sag-category-hero__copy">
          <h1>SK V1 모터스</h1>
          <p>경기 수원시 권선구 수입차 매매단지</p>
        </div>
        <a className="sag-category-hero__shop" href={`${window.location.pathname}?qf=guazi&profile=dealer&shop=joy&emp=1`}>조이모터스 <span>매물 {shopCount.toLocaleString("ko-KR")}대</span> ›</a>
      </div>
    </section>
  );
}
