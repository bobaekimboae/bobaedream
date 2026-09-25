import { useEffect, useRef, useState, type ReactNode } from "react";
import { bbmIcon } from "./bbm-list";
import "./bbm-top-chotot.css";

// QF-095: 과쯔 PC 상단 카드를 초톳 PC(xe.chotot.com) 상단과 같은 구조로 — 1줄 경로 · 2줄 제목 + 검색 저장 · 3줄 칩 줄(+ 필터 초기화) · 4줄 유형 줄/퀵필터 레일.
// 수치는 2026-09-25 초톳 1440 실측(bbm-top-chotot.css). 개발 시안 원본과 다른 배치라 개발팀·디자이너 합의가 필요하다.

export type BbmCrumb = { label: string; onClick?: () => void };

// 1줄 경로: 12/18 #8C8C8C, 마지막 항목 700 #222(누르지 않음), 사이 "/"(초톳 실측)
export function BbmTopCrumbs({ items }: { items: BbmCrumb[] }) {
  return (
    <nav className="bbm-ct-crumbs" aria-label="현재 위치">
      <ol>
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`}>
              {last ? <strong aria-current="page">{item.label}</strong> : <button type="button" onClick={item.onClick}>{item.label}</button>}
              {last ? null : <span className="bbm-ct-crumb-sep" aria-hidden="true">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// 2줄 제목: "[지역] [유형·제조사·모델] 중고차 N대 · YYYY년 M월"(조건 없으면 "중고차 N대 · …"). 연월은 오늘 기준
export function bbmTopTitlePrefix(parts: Array<string | null | undefined>) {
  return [...parts.filter(Boolean), "중고차"].join(" ");
}
export function bbmTopMonth(date = new Date()) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}

// 3줄 칩 줄의 가로 스크롤(초톳 WrapperScrollV2): 넘치면 양옆 화살표 28, 누르면 한 화면 폭만큼 이동
export function BbmChipScroller({ children }: { children: ReactNode }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ prev: false, next: false });
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return undefined;
    const update = () => setEdges({ prev: scroller.scrollLeft > 1, next: scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 1 });
    update();
    scroller.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(scroller);
    if (scroller.firstElementChild) observer.observe(scroller.firstElementChild);
    return () => { scroller.removeEventListener("scroll", update); observer.disconnect(); };
  }, []);
  const move = (direction: 1 | -1) => scrollerRef.current?.scrollBy({ left: direction * (scrollerRef.current.clientWidth - 80), behavior: "smooth" });
  return (
    <div className="bbm-ct-chip-scroll">
      <div ref={scrollerRef} className="bbm-ct-chip-track-wrap">
        <div className="bbm-ct-chip-track">{children}</div>
      </div>
      {edges.prev ? <button type="button" className="bbm-ct-chip-arrow is-prev" aria-label="이전 칩" onClick={() => move(-1)}><img src={bbmIcon("filter-chevron")} alt="" aria-hidden="true" /></button> : null}
      {edges.next ? <button type="button" className="bbm-ct-chip-arrow is-next" aria-label="다음 칩" onClick={() => move(1)}><img src={bbmIcon("filter-chevron")} alt="" aria-hidden="true" /></button> : null}
    </div>
  );
}
