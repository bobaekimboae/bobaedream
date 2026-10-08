import { useState, type ReactNode } from "react";
import { asset } from "../data";
import "./luxury-theme-header.css";

/** 럭셔리카 테마 헤더 시안(2026-10-08). `?luxhead=a` 보배 피그마 「슈퍼카 리스트」형(왼쪽 프로필) · `b` 좐좐 브랜드형(가운데 제목 + 차량 라인업). 없으면 기존 헤더 그대로 */
export type LuxuryHeadVariant = "a" | "b";

export function luxuryHeadVariant(): LuxuryHeadVariant | null {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("luxhead");
  return value === "a" || value === "b" ? value : null;
}

/** 구독자 수는 UI 검증용 가상 값 */
const LUXURY_SUBSCRIBERS = 1284;

export function LuxuryThemeHero({ variant, header, listingCount, dealerCount, onNotify }: { variant: LuxuryHeadVariant; header: ReactNode; listingCount: number; dealerCount: number; onNotify: (message: string) => void }) {
  const [subscribed, setSubscribed] = useState(false);
  const subscribers = LUXURY_SUBSCRIBERS + (subscribed ? 1 : 0);
  const toggleSubscribe = () => {
    setSubscribed((value) => !value);
    onNotify(subscribed ? "럭셔리카 구독을 해제했습니다." : "럭셔리카를 구독했습니다. 새 매물이 올라오면 알려드릴게요.");
  };
  const subscribeButton = (
    <button type="button" className={`lux-hero-subscribe${subscribed ? " is-on" : ""}`} aria-pressed={subscribed} onClick={toggleSubscribe}>
      {subscribed ? <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.2 5 8.6l4.6-5.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg> : <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 2.2v7.6M2.2 6h7.6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>}
      {subscribed ? "구독중" : "구독"}
    </button>
  );
  const stats = <p className="lux-hero-stats"><b>{listingCount.toLocaleString("ko-KR")}대</b> 판매 중 · 딜러 {dealerCount}명 · <b>{subscribers.toLocaleString("ko-KR")}명</b> 구독 중</p>;
  const sell = (
    <button type="button" className="lux-hero-sell" onClick={() => onNotify("럭셔리카 매물 등록 화면으로 이동 예정")}>
      <span className="lux-hero-sell-plus" aria-hidden="true">+</span>
      <span>럭셔리카를 판매하시나요? <b>딜러 매물 등록하기</b></span>
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3.5 4.5 4.5L6 12.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </button>
  );
  return (
    <section className={`lux-hero is-${variant}`} aria-label="럭셔리카 카테고리 소개" style={{ backgroundImage: `url(${asset(`cars/luxury-category-v01/hero/hero-${variant}.webp`)})` }}>
      <div className="lux-hero-nav">{header}</div>
      {variant === "a" ? (
        <div className="lux-hero-body">
          <div className="lux-hero-profile">
            <img className="lux-hero-avatar" src={asset("cars/luxury-category-v01/hero/avatar.png")} alt="" />
            <div className="lux-hero-copy">
              <div className="lux-hero-title-row"><h1>럭셔리카</h1>{subscribeButton}</div>
              {stats}
            </div>
          </div>
          <p className="lux-hero-desc">보배드림은 한국 유일의 럭셔리카 플랫폼. 검증된 딜러의 슈퍼카·하이엔드 매물만 모았습니다.</p>
          {sell}
        </div>
      ) : (
        <div className="lux-hero-body">
          <span className="lux-hero-eyebrow">BOBAEDREAM LUXURY</span>
          <h1>럭셔리카</h1>
          <p className="lux-hero-desc">보배드림은 한국 유일의 럭셔리카 플랫폼</p>
          {stats}
          {subscribeButton}
        </div>
      )}
    </section>
  );
}
