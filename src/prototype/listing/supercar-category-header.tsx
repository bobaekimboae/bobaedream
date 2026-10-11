import { useEffect, useState } from "react";
import { asset } from "../data";
import "./supercar-category-header.css";

type SupercarHeroSlide = {
  id: string;
  kind: "image" | "video";
  src: string;
  poster?: string;
  position: string;
};

const SUPERCAR_HERO_SLIDES: SupercarHeroSlide[] = [
  {
    id: "ferrari-f80",
    kind: "image",
    src: asset("supercar-header/ferrari-f80.jpg"),
    position: "58% 52%",
  },
  {
    id: "enzo-ferrari",
    kind: "image",
    src: asset("supercar-header/enzo-ferrari.jpg"),
    position: "58% 42%",
  },
  {
    id: "lamborghini-motion",
    kind: "video",
    src: asset("supercar-header/lamborghini-official-hero.mp4"),
    poster: asset("supercar-header/lamborghini-official-poster.jpg"),
    position: "50% 50%",
  },
];

const HERO_INTERVAL_MS = 6000;

export function SupercarCategoryHeader() {
  const [activeIndex, setActiveIndex] = useState(() => Math.floor(Math.random() * SUPERCAR_HERO_SLIDES.length));
  const [reduceMotion] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const slide = SUPERCAR_HERO_SLIDES[activeIndex];

  useEffect(() => {
    if (typeof window === "undefined" || reduceMotion) return;
    let timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % SUPERCAR_HERO_SLIDES.length);
    }, HERO_INTERVAL_MS);
    const onVisibilityChange = () => {
      window.clearInterval(timer);
      if (!document.hidden) {
        timer = window.setInterval(() => {
          setActiveIndex((current) => (current + 1) % SUPERCAR_HERO_SLIDES.length);
        }, HERO_INTERVAL_MS);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [reduceMotion]);

  const showNext = () => setActiveIndex((current) => (current + 1) % SUPERCAR_HERO_SLIDES.length);

  return (
    <section className="supercar-category-hero" aria-label="보배드림 슈퍼카 소개">
      <button className="supercar-category-hero-hit" type="button" onClick={showNext} aria-label="다음 슈퍼카 배너 보기">
        {slide.kind === "video" ? (
          <video
            key={slide.id}
            className="supercar-category-hero-media"
            src={slide.src}
            poster={slide.poster}
            style={{ objectPosition: slide.position }}
            muted
            autoPlay={!reduceMotion}
            playsInline
            loop
            preload="metadata"
            aria-hidden="true"
          />
        ) : (
          <img
            key={slide.id}
            className="supercar-category-hero-media"
            src={slide.src}
            style={{ objectPosition: slide.position }}
            alt=""
            aria-hidden="true"
            draggable={false}
          />
        )}
        <span className="supercar-category-hero-shade" aria-hidden="true" />
        <span className="supercar-category-hero-copy">
          <strong>보배드림 슈퍼카</strong>
          <span>국내 유일 슈퍼카 쇼핑몰</span>
        </span>
      </button>
      <div className="supercar-category-hero-dots" role="group" aria-label="슈퍼카 배너 선택">
        {SUPERCAR_HERO_SLIDES.map((item, index) => (
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
