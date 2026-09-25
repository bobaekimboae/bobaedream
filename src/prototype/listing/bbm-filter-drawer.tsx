import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { BbmActionBar } from "../filters/bbm-filter-parts";
import { bbmIcon } from "./bbm-list";
import "./pc-hybrid.css";

// QF-093: PC 1024~1279 에서 좌측 필터를 숨기고 상단 "필터" 칩으로 여는 왼쪽 펼침판(참고: 트레이드미 Refine).
// 폭 320, 뒤는 딤 rgba(0,0,0,.5). 내용은 좌측 필터와 같은 부품·같은 필터 상태(children).
// 머리 "필터" + 닫기, 아래 [초기화](원본 확인 창) [N대 보기](닫기). 바깥 누르기·닫기·Esc 로 닫힘, 열린 동안 뒤 목록 스크롤 막기.
// 좌측 필터 스타일이 .marketplace.is-bbm 아래에 걸려 있어 body 로 옮긴 펼침판도 같은 클래스를 단다(bbm-drawer-root 에서 배경·여백만 지움).
export function BbmFilterDrawer({ count, onClose, onReset, children }: { count: number; onClose: () => void; onReset: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const scroller = document.querySelector<HTMLElement>(".marketplace.is-bbm .mobile-scroll, .mobile-scroll");
    const previous = scroller?.style.overflowY ?? "";
    if (scroller) scroller.style.overflowY = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      if (scroller) scroller.style.overflowY = previous;
    };
  }, [onClose]);
  return createPortal(
    <div className="marketplace is-bbm is-hybrid bbm-drawer-root">
      <div className="bbm-drawer-dim" onClick={onClose} aria-hidden="true" />
      <section className="bbm-drawer" role="dialog" aria-modal="true" aria-label="필터">
        <header className="bbm-drawer-header">
          <h2>필터</h2>
          <button type="button" className="bbm-drawer-close" aria-label="닫기" onClick={onClose}><img src={bbmIcon("m-full-close")} alt="" aria-hidden="true" /></button>
        </header>
        <div className="bbm-drawer-body">{children}</div>
        <BbmActionBar variant="sheet" confirmStyle="보기" count={count} onReset={onReset} onConfirm={onClose} />
      </section>
    </div>,
    document.body,
  );
}
