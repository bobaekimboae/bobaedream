import { useEffect, useState } from "react";
import { asset } from "../data";
import "./oldcar-category-header.css";

type OldcarHeroSlide = {
  id: "ssangyong" | "kia" | "daewoo";
  src: string;
};

const OLDCAR_HERO_SLIDES: OldcarHeroSlide[] = [
  {
    id: "ssangyong",
    src: asset("maker-model/generations/kg-mobility-v1/kgm_asset_2e618273e0af665f493b.png"),
  },
  {
    id: "kia",
    src: asset("maker-model/generations/kia-v1/kia_asset_45c3a9007fd772150bab.png"),
  },
  {
    id: "daewoo",
    src: asset("maker-model/generations/chevrolet-gm-v1/chevrolet_asset_07e9d2f8421fad682cd0.png"),
  },
];

const HERO_INTERVAL_MS = 6000;

export function OldcarCategoryHeader() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [reduceMotion] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const slide = OLDCAR_HERO_SLIDES[activeIndex];

  useEffect(() => {
    if (typeof window === "undefined" || reduceMotion) return;
    let timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % OLDCAR_HERO_SLIDES.length);
    }, HERO_INTERVAL_MS);
    const onVisibilityChange = () => {
      window.clearInterval(timer);
      if (!document.hidden) {
        timer = window.setInterval(() => {
          setActiveIndex((current) => (current + 1) % OLDCAR_HERO_SLIDES.length);
        }, HERO_INTERVAL_MS);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [reduceMotion]);

  return (
    <section className={`oldcar-category-hero is-${slide.id}`} aria-label="보배드림 올드카 소개">
      <button
        className="oldcar-category-hero-hit"
        type="button"
        onClick={() => setActiveIndex((current) => (current + 1) % OLDCAR_HERO_SLIDES.length)}
        aria-label="다음 올드카 배너 보기"
      >
        <img key={slide.id} className="oldcar-category-hero-media" src={slide.src} alt="" aria-hidden="true" draggable={false} />
        <span className="oldcar-category-hero-copy">
          <strong>보배드림 올드카</strong>
          <span>쌍용 · 기아 · 대우 명차 컬렉션</span>
        </span>
      </button>
      <div className="oldcar-category-hero-dots" role="group" aria-label="올드카 배너 선택">
        {OLDCAR_HERO_SLIDES.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={index === activeIndex ? "is-active" : ""}
            aria-label={`${index + 1}번째 배너`}
            aria-current={index === activeIndex ? "true" : undefined}
            onClick={() => setActiveIndex(index)}
          />
        ))}
      </div>
    </section>
  );
}
