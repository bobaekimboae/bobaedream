import { useEffect, useState } from "react";
import { asset } from "../data";
import "./oldcar-category-header.css";

type OldcarHeroSlide = {
  id: string;
  year: string;
  model: string;
  src: string;
  shift: string;
};

const OLDCAR_HERO_SLIDES: OldcarHeroSlide[] = [
  {
    id: "brisa",
    year: "1974",
    model: "기아 브리사",
    src: asset("oldcar-header/kia-brisa-official-kv-1920x1080.webp"),
    shift: "24%",
  },
  {
    id: "bongo",
    year: "1981",
    model: "기아 봉고",
    src: asset("oldcar-header/kia-bongo-official-kv-1920x1080.webp"),
    shift: "18%",
  },
  {
    id: "pride",
    year: "1987",
    model: "기아 프라이드",
    src: asset("oldcar-header/kia-pride-official-kv-1920x1080.webp"),
    shift: "24%",
  },
  {
    id: "concord",
    year: "1987",
    model: "기아 콩코드",
    src: asset("oldcar-header/kia-concord-official-kv-1920x1080.webp"),
    shift: "22%",
  },
  {
    id: "rocsta",
    year: "1990",
    model: "기아 록스타",
    src: asset("oldcar-header/kia-rocsta-official-kv-1920x1080.webp"),
    shift: "24%",
  },
  {
    id: "elan",
    year: "1996",
    model: "기아 엘란",
    src: asset("oldcar-header/kia-elan-official-kv-1920x1080.webp"),
    shift: "24%",
  },
];

const HERO_INTERVAL_MS = 6000;

export function OldcarCategoryHeader() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [reduceMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
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

  const showNext = () => setActiveIndex((current) => (current + 1) % OLDCAR_HERO_SLIDES.length);

  return (
    <section className="oldcar-category-hero" aria-label="보배드림 올드카 소개">
      <button className="oldcar-category-hero-hit" type="button" onClick={showNext} aria-label="다음 올드카 배너 보기">
        <img
          key={slide.id}
          className="oldcar-category-hero-media"
          src={slide.src}
          alt={`${slide.year} ${slide.model}`}
          style={{ transform: `translateX(${slide.shift})` }}
          draggable={false}
        />
        <span className="oldcar-category-hero-shade" aria-hidden="true" />
        <span className="oldcar-category-hero-copy">
          <span className="oldcar-category-hero-heading">
            <strong>보배드림 올드카</strong>
            <span className="oldcar-category-hero-model">
              <small>{slide.year}</small>
              <em>{slide.model}</em>
            </span>
          </span>
          <span className="oldcar-category-hero-subtitle">올드카ㆍ클래식카ㆍ올드바이크 매물</span>
        </span>
      </button>
      <div className="oldcar-category-hero-dots" role="group" aria-label="올드카 배너 선택">
        {OLDCAR_HERO_SLIDES.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={index === activeIndex ? "is-active" : ""}
            aria-label={`${item.year} ${item.model} 배너`}
            aria-current={index === activeIndex ? "true" : undefined}
            onClick={() => setActiveIndex(index)}
          />
        ))}
      </div>
    </section>
  );
}
