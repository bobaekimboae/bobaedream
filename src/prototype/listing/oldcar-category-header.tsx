import { useEffect, useRef, useState, type PointerEvent } from "react";
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
    id: "besta",
    year: "1986",
    model: "기아 베스타",
    src: asset("oldcar-header/kia-besta-official-kv-1920x1080.webp"),
    shift: "22%",
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
    id: "potentia",
    year: "1992",
    model: "기아 포텐샤",
    src: asset("oldcar-header/kia-potentia-official-kv-1920x1080.webp"),
    shift: "22%",
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
  const showPrev = () => setActiveIndex((current) => (current - 1 + OLDCAR_HERO_SLIDES.length) % OLDCAR_HERO_SLIDES.length);
  // 좌우로 밀면 이전·다음 차(2026-10-11 「인디게이터로 차량 제스처 가능하게」). 밀어서 넘긴 뒤에는 터치(다음)가 한 번 더 일어나지 않게 막는다.
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => { dragStart.current = { x: event.clientX, y: event.clientY }; swiped.current = false; };
  const onPointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    const start = dragStart.current;
    dragStart.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      swiped.current = true;
      if (dx < 0) showNext(); else showPrev();
    }
  };
  const onHeroClick = () => { if (swiped.current) { swiped.current = false; return; } showNext(); };

  return (
    <section className="oldcar-category-hero" aria-label="보배드림 올드카 소개">
      <button className="oldcar-category-hero-hit" type="button" onClick={onHeroClick} onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => { dragStart.current = null; }} aria-label="다음 올드카 배너 보기">
        <img
          key={slide.id}
          className="oldcar-category-hero-media"
          src={slide.src}
          alt={`${slide.year} ${slide.model}`}
          style={{ transform: `translate(${slide.shift}, -5%) scale(.9)` }}
          draggable={false}
        />
        <span className="oldcar-category-hero-shade" aria-hidden="true" />
        <span className="oldcar-category-hero-copy">
          <strong>보배드림 올드카</strong>
          <span className="oldcar-category-hero-subtitle">올드카ㆍ클래식카 판매</span>
        </span>
      </button>
      <div className="oldcar-category-hero-footer">
        <span className="oldcar-category-hero-model">
          <small>{slide.year}</small>
          <em>{slide.model}</em>
        </span>
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
      </div>
    </section>
  );
}
