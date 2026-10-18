import { useState } from "react";
import "./ferrari-category-header.css";

// Ferrari 공식 홈페이지의 Sports Cars 히어로 영상과 포스터.
// 원본 출처: https://www.ferrari.com/en-EN
const FERRARI_HERO_VIDEO = "https://s7mbrstream-g1.scene7.com/is/content/ferrari/_media_/13d/13d2b055-5408-40dc-b461-c1e2439868f6-stream.mp4?utm_medium=fmp4_dash";
const FERRARI_HERO_POSTER = "https://ferrari.scene7.com/is/image/ferrari/GT-Cover_Auto_Gamma-AVS?fit=constrain,1&wid=1265&hei=720";

export function FerrariCategoryHeader() {
  const [videoFailed, setVideoFailed] = useState(false);
  const reduceMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <section className="ferrari-category-hero" aria-label="보배드림 페라리 소개">
      <img
        className="ferrari-category-hero-backdrop"
        src={FERRARI_HERO_POSTER}
        alt=""
        aria-hidden="true"
        draggable={false}
      />
      {videoFailed || reduceMotion ? (
        <img
          className="ferrari-category-hero-media"
          src={FERRARI_HERO_POSTER}
          alt=""
          aria-hidden="true"
          draggable={false}
        />
      ) : (
        <video
          className="ferrari-category-hero-media"
          src={FERRARI_HERO_VIDEO}
          poster={FERRARI_HERO_POSTER}
          muted
          autoPlay
          playsInline
          loop
          preload="metadata"
          aria-hidden="true"
          onError={() => setVideoFailed(true)}
        />
      )}
      <span className="ferrari-category-hero-shade" aria-hidden="true" />
      <span className="ferrari-category-hero-copy">
        <strong>보배드림 페라리</strong>
        <span>국내 유일 페라리 쇼핑몰</span>
      </span>
    </section>
  );
}
