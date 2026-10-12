import { useEffect, useState } from "react";
import { asset } from "../data";
import "./oldcar-category-header.css";

type OldcarHeroSlide = {
  id: string;
  year: string;
  model: string;
  src: string;
  shiftX: string;
  shiftY: string;
  scale: number;
};

const OLDCAR_HERO_SLIDES: OldcarHeroSlide[] = [
  {
    id: "brisa",
    year: "1974",
    model: "기아 브리사",
    src: asset("oldcar-header/kia-brisa-official-kv-1920x1080.webp"),
    shiftX: "24%",
    shiftY: "-4%",
    scale: 0.88,
  },
  {
    id: "brisa-2",
    year: "1977",
    model: "기아 브리사 Ⅱ",
    src: asset("oldcar-header/kia-brisa-2-official-kv-1920x1080.webp"),
    shiftX: "22%",
    shiftY: "-4%",
    scale: 0.9,
  },
  {
    id: "bongo-truck",
    year: "1980",
    model: "기아 봉고 트럭",
    src: asset("oldcar-header/kia-bongo-truck-official-kv-1920x1080.webp"),
    shiftX: "19%",
    shiftY: "-2%",
    scale: 0.76,
  },
  {
    id: "bongo",
    year: "1981",
    model: "기아 봉고",
    src: asset("oldcar-header/kia-bongo-official-kv-1920x1080.webp"),
    shiftX: "19%",
    shiftY: "-2%",
    scale: 0.75,
  },
  {
    id: "besta",
    year: "1986",
    model: "기아 베스타",
    src: asset("oldcar-header/kia-besta-official-kv-1920x1080.webp"),
    shiftX: "19%",
    shiftY: "-2%",
    scale: 0.75,
  },
  {
    id: "pride",
    year: "1987",
    model: "기아 프라이드",
    src: asset("oldcar-header/kia-pride-official-kv-1920x1080.webp"),
    shiftX: "24%",
    shiftY: "-5%",
    scale: 0.9,
  },
  {
    id: "concord",
    year: "1987",
    model: "기아 콩코드",
    src: asset("oldcar-header/kia-concord-official-kv-1920x1080.webp"),
    shiftX: "22%",
    shiftY: "-5%",
    scale: 0.9,
  },
  {
    id: "rocsta",
    year: "1990",
    model: "기아 록스타",
    src: asset("oldcar-header/kia-rocsta-official-kv-1920x1080.webp"),
    shiftX: "24%",
    shiftY: "-3%",
    scale: 0.84,
  },
  {
    id: "potentia",
    year: "1992",
    model: "기아 포텐샤",
    src: asset("oldcar-header/kia-potentia-official-kv-1920x1080.webp"),
    shiftX: "22%",
    shiftY: "-5%",
    scale: 0.9,
  },
  {
    id: "elan",
    year: "1996",
    model: "기아 엘란",
    src: asset("oldcar-header/kia-elan-official-kv-1920x1080.webp"),
    shiftX: "24%",
    shiftY: "-4%",
    scale: 0.98,
  },
];

const HERO_INTERVAL_MS = 6000;
const MAX_VISIBLE_DOTS = 5;

function getVisibleDotIndices(activeIndex: number, total: number) {
  const count = Math.min(MAX_VISIBLE_DOTS, total);
  const maxStart = Math.max(0, total - count);
  const start = Math.min(Math.max(activeIndex - Math.floor(count / 2), 0), maxStart);

  return Array.from({ length: count }, (_, index) => start + index);
}

export function OldcarCategoryHeader() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [reduceMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const slide = OLDCAR_HERO_SLIDES[activeIndex];
  const visibleDotIndices = getVisibleDotIndices(activeIndex, OLDCAR_HERO_SLIDES.length);

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
          style={{ transform: `translate(${slide.shiftX}, ${slide.shiftY}) scale(${slide.scale})` }}
          draggable={false}
        />
        <span className="oldcar-category-hero-shade" aria-hidden="true" />
        <span className="oldcar-category-hero-copy">
          <strong>보배드림 올드카</strong>
          <span className="oldcar-category-hero-subtitle">올드카ㆍ클래식카 판매</span>
        </span>
      </button>
      <span className="oldcar-category-hero-model">
        <small>{slide.year}</small>
        <em>{slide.model}</em>
      </span>
      <div
        className="oldcar-category-hero-dots"
        role="group"
        aria-label={`올드카 배너 선택, ${activeIndex + 1}/${OLDCAR_HERO_SLIDES.length}`}
      >
        {visibleDotIndices.map((index, visibleIndex) => {
          const item = OLDCAR_HERO_SLIDES[index];
          const isLeadingEdge = visibleIndex === 0 && index > 0;
          const isTrailingEdge = visibleIndex === visibleDotIndices.length - 1 && index < OLDCAR_HERO_SLIDES.length - 1;

          return (
            <button
              key={item.id}
              type="button"
              className={`${index === activeIndex ? "is-active" : ""} ${isLeadingEdge || isTrailingEdge ? "is-edge" : ""}`.trim()}
              aria-label={`${index + 1}/${OLDCAR_HERO_SLIDES.length} ${item.year} ${item.model} 배너`}
              aria-current={index === activeIndex ? "true" : undefined}
              onClick={() => setActiveIndex(index)}
            />
          );
        })}
      </div>
    </section>
  );
}
