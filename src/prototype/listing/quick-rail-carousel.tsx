import { useEffect, useRef, useState, type PropsWithChildren } from "react";
import { Carousel } from "../../mobile";
import { asset } from "../data";

type QuickRailCarouselProps = PropsWithChildren<{
  ariaLabel: string;
  className?: string;
  contentClassName?: string;
}>;

/** 퀵필터 전용 가로 레일. 실제로 넘칠 때만 초톳 원본 이전·다음 버튼을 표시한다. */
export function QuickRailCarousel({ ariaLabel, className, contentClassName, children }: QuickRailCarouselProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ previous: false, next: false });

  useEffect(() => {
    const scroller = shellRef.current?.querySelector<HTMLElement>(":scope > .mobile-carousel");
    if (!scroller) return undefined;
    const update = () => {
      const maximum = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
      setEdges({ previous: scroller.scrollLeft > 1, next: scroller.scrollLeft < maximum - 1 });
    };
    scroller.scrollLeft = 0;
    update();
    scroller.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(scroller);
    if (scroller.firstElementChild) observer.observe(scroller.firstElementChild);
    return () => { scroller.removeEventListener("scroll", update); observer.disconnect(); };
  }, [ariaLabel]);

  const move = (direction: -1 | 1) => {
    const scroller = shellRef.current?.querySelector<HTMLElement>(":scope > .mobile-carousel");
    if (!scroller) return;
    scroller.scrollBy({ left: direction * Math.max(80, scroller.clientWidth - 80), behavior: "smooth" });
  };

  return (
    <div ref={shellRef} className="quick-rail-carousel">
      <Carousel ariaLabel={ariaLabel} className={className} contentClassName={contentClassName}>{children}</Carousel>
      {edges.previous ? <button type="button" className="quick-rail-nav is-previous" aria-label={`${ariaLabel} 이전`} onClick={() => move(-1)}><img src={asset("bbm/quick-filter-prev.svg")} alt="" aria-hidden="true" /></button> : null}
      {edges.next ? <button type="button" className="quick-rail-nav is-next" aria-label={`${ariaLabel} 다음`} onClick={() => move(1)}><img src={asset("bbm/quick-filter-next.svg")} alt="" aria-hidden="true" /></button> : null}
    </div>
  );
}
