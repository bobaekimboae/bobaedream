import { useEffect, useRef, type ReactNode } from "react";
import type { Car } from "../data";
import { bbmIcon } from "./bbm-list";
import "./bbm-list-area.css";

// QF-092: 개발 시안 원본 목록 영역 — 페이지 이동 · 푸터 · 정렬/보기 방식 메뉴. DOM·클래스·문구는 원본(2026-09-25 수집)과 같다.

// ── 정렬: 원본 드롭다운(PC)·시트(모바일) 10개. 우리 데이터에 값이 있는 등록·가격·연식·주행거리만 실제로 정렬하고 나머지는 선택 표시만(업데이트순 순서 유지)
export const bbmSortOptions = ["업데이트순", "등록순", "가격 낮은순", "가격 높은순", "연식 최신순", "주행거리 짧은순", "최고출력순", "연비순", "제시신고순", "가까운순"] as const;
export type BbmSort = (typeof bbmSortOptions)[number];
// 보기 방식: PC 드롭다운 4개, 모바일 "리스트 필터" 시트 6개(원본). 이번 과제는 "목록으로 보기"만 동작
export const bbmViewOptionsPc = ["목록으로 보기", "갤러리로 보기", "쇼츠 영상으로 보기", "한줄 광고로 보기"];
export const bbmViewOptionsMobile = ["목록으로 보기", "피드로 보기", "갤러리로 보기", "쇼츠 영상으로 보기", "한줄 광고로 보기", "텍스트로 보기"];
export const BBM_PAGE_SIZE = 20;

const priceOf = (car: Car) => Number(car.price.replace(/[^0-9]/g, "")) || 0;
// "3분 전" · "2시간 전" · "어제" · "3일 전" → 분
const postedMinutes = (car: Car) => {
  const text = car.posted;
  const n = Number(text.match(/\d+/)?.[0] ?? 0);
  if (/분/.test(text)) return n;
  if (/시간/.test(text)) return n * 60;
  if (/어제/.test(text)) return 1440;
  if (/일/.test(text)) return n * 1440;
  return 99999;
};
const yearOf = (car: Car) => car.filter?.year ?? 0;
const mileageOf = (car: Car) => car.filter?.mileage ?? Number.MAX_SAFE_INTEGER;

export function sortBbmCars(cars: Car[], sort: BbmSort) {
  const byUpdate = (a: Car, b: Car) => b.id - a.id;
  const compare: Partial<Record<BbmSort, (a: Car, b: Car) => number>> = {
    등록순: (a, b) => postedMinutes(a) - postedMinutes(b) || byUpdate(a, b),
    "가격 낮은순": (a, b) => priceOf(a) - priceOf(b) || byUpdate(a, b),
    "가격 높은순": (a, b) => priceOf(b) - priceOf(a) || byUpdate(a, b),
    "연식 최신순": (a, b) => yearOf(b) - yearOf(a) || byUpdate(a, b),
    "주행거리 짧은순": (a, b) => mileageOf(a) - mileageOf(b) || byUpdate(a, b),
  };
  return [...cars].sort(compare[sort] ?? byUpdate);
}

// ── 페이지 이동(원본 ui-pagination). 번호 묶음: PC 10개 · 모바일 3개, 끝에서는 묶음을 앞으로 당겨 채운다(원본 실측: 742쪽 → PC 734~743, 모바일 741~743).
// 첫 페이지에서는 [첫·이전], 마지막 페이지에서는 [다음·마지막]을 숨긴다
export function bbmPageWindow(page: number, total: number, size: number) {
  let start = Math.floor((page - 1) / size) * size + 1;
  const end = Math.min(start + size - 1, total);
  if (end - start < size - 1) start = Math.max(1, end - size + 1);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export function BbmPagination({ page, total, windowSize, onChange }: { page: number; total: number; windowSize: number; onChange: (page: number) => void }) {
  const pages = bbmPageWindow(page, total, windowSize);
  const control = (label: string, target: number, hidden: boolean, icon: string, left: boolean) => (
    <button type="button" className="ui-pagination__control" disabled={hidden} aria-label={label} style={hidden ? { display: "none" } : undefined} onClick={() => onChange(target)}>
      <img className={`ui-pagination__icon${left ? " ui-pagination__icon--left" : ""}`} src={bbmIcon(icon)} alt="" aria-hidden="true" />
    </button>
  );
  return (
    <div className="car-list-pagination">
      <nav className="ui-pagination" aria-label="페이지네이션">
        {control("첫 페이지", 1, page <= 1, "pagination-double", true)}
        {control("이전 페이지", page - 1, page <= 1, "pagination-single", true)}
        <ol className="ui-pagination__pages">
          {pages.map((number) => (
            <li key={number} className="ui-pagination__page-item">
              <button type="button" className={`ui-pagination__page${number === page ? " is-active" : ""}`} aria-current={number === page ? "page" : undefined} aria-label={`${number} 페이지`} onClick={() => onChange(number)}>{number}</button>
            </li>
          ))}
        </ol>
        {control("다음 페이지", page + 1, page >= total, "pagination-single", false)}
        {control("마지막 페이지", total, page >= total, "pagination-double", false)}
      </nav>
    </div>
  );
}

// ── PC 툴바 드롭다운(원본 car-list-toolbar-menu): 버튼 오른쪽 아래 8px, 바깥을 누르면 닫힘
export function BbmToolbarMenu({ open, onClose, options, selected, onSelect, children }: { open: boolean; onClose: () => void; options: readonly string[]; selected: string; onSelect: (option: string) => void; children: ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => { if (!wrapRef.current?.contains(event.target as Node)) onClose(); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", escape); };
  }, [onClose, open]);
  return (
    <div ref={wrapRef} className="bbm-menu-wrap">
      {children}
      {open ? (
        <div className="car-list-toolbar-menu">
          <div className="car-list-toolbar-menu__grid">
            {options.map((option) => (
              <button key={option} type="button" className={`ui-btn ui-btn--ghost ui-btn--md ui-btn--align-left car-list-toolbar-menu__item${option === selected ? " is-selected" : ""}`} aria-pressed={option === selected} onClick={() => onSelect(option)}>
                <span className="ui-btn__label">{option}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ── 모바일 정렬·보기 방식 시트 본문(원본 car-list-toolbar-pop-modal): 16/16/34, 버튼 44 · 간격 10, 고른 것 #1B4C8C
export function BbmPopOptions({ options, selected, onSelect }: { options: readonly string[]; selected: string; onSelect: (option: string) => void }) {
  return (
    <div className="car-list-toolbar-pop-modal__body">
      <div className="car-list-toolbar-pop-modal__options">
        {options.map((option) => (
          <button key={option} type="button" className={`ui-btn ui-btn--outline ui-btn--lg ui-btn--align-center ui-btn--full${option === selected ? " is-selected" : ""}`} aria-pressed={option === selected} onClick={() => onSelect(option)}>
            <span className="ui-btn__label">{option}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── 푸터(원본 app-shell__footer). PC는 사업자 정보·고객센터·링크·SNS·컬러 모드·앱 설치, 모바일은 연락처·바로가기·사업자 정보 접기·링크·SNS·컬러 모드.
// 링크·버튼은 모두 "정식 서비스에서 이용" 안내만 띄운다
export function BbmFooter({ onNotify }: { onNotify: (message: string) => void }) {
  const notify = (label: string) => (event: { preventDefault: () => void }) => { event.preventDefault(); onNotify(`${label}은(는) 정식 서비스에서 이용해 주세요.`); };
  const divider = <img src={bbmIcon("footer-biz-divider")} alt="" className="app-footer-biz-divider" />;
  const sns = (linkClass: string, iconClass: string) => ([["인스타그램", "footer-instagram"], ["페이스북", "footer-facebook"], ["유튜브", "footer-youtube"], ["스레드", "footer-threads"]] as const).map(([label, icon]) => (
    <a key={label} href="#" className={linkClass} aria-label={label} onClick={notify(label)}><img src={bbmIcon(icon)} alt="" className={iconClass} /></a>
  ));
  const theme = (
    <div className="app-footer-theme-toggle" aria-label="컬러 모드 선택">
      <button type="button" className="is-active app-footer-theme-toggle__button" aria-pressed="true" aria-label="라이트 모드" onClick={notify("컬러 모드")}><img src={bbmIcon("footer-theme-light")} alt="" className="app-footer-theme-toggle__icon" /></button>
      <button type="button" className="app-footer-theme-toggle__button" aria-pressed="false" aria-label="다크 모드" onClick={notify("다크 모드")}><img src={bbmIcon("footer-theme-dark")} alt="" className="app-footer-theme-toggle__icon" /></button>
    </div>
  );
  const pcLinks: Array<[string, string]> = [["회사소개", ""], ["제휴/광고문의", ""], ["이용약관", ""], ["제휴/신고센터", ""], ["고객센터", ""], ["청소년보호정책", ""], ["개인정보취급방침", " app-footer-link--primary"], ["원격지원", " app-footer-link--strong"]];
  const mobileLinks: Array<[string, string]> = [["고객센터", ""], ["제휴/광고", ""], ["제안/건의", ""], ["이용관리", ""], ["개인정보처리방침", " app-footer-mobile__link--primary"]];
  return (
    <footer className="app-shell__footer">
      <div className="app-footer">
        <div className="app-footer__inner">
          <section className="app-footer-top">
            <div className="app-footer-top__left">
              <p className="app-footer-biz-title">(주) 보배네트워크 사업자 정보</p>
              <div className="app-footer-biz-line">
                <span className="app-footer-biz-text">대표이사: 김보배</span>{divider}
                <span className="app-footer-biz-text">사업자등록번호 : 117-81-64543</span>
                <button type="button" className="app-footer-biz-check" onClick={notify("사업자정보 확인")}>사업자정보 확인</button>{divider}
                <span className="app-footer-biz-text">주소 : (07995) 서울 양천구 목동동로 233-1 드림타워 11, 12층</span>
              </div>
              <div className="app-footer-biz-line">
                <span className="app-footer-biz-text">통신판매업신고번호 : 제2013-서울양천-0465호</span>{divider}
                <span className="app-footer-biz-text">개인정보관리책임자 : 이은호</span>
              </div>
              <div className="app-footer-biz-line">
                <span className="app-footer-biz-text">팩스 : 02-6499-2329</span>{divider}
                <span className="app-footer-biz-text">메일 :</span>
                <a href="#" className="app-footer-biz-mail" onClick={notify("메일 보내기")}>bobaedream@bobaedream.co.kr</a>
              </div>
              <p className="app-footer-biz-copyright">Copyright © (주)보배네트워크</p>
            </div>
            <div className="app-footer-top__right">
              <p className="app-footer-cs-title">고객센터</p>
              <p className="app-footer-cs-phone">02-784-2329</p>
              <div className="app-footer-cs-hours">
                <p>평일 <span>09:00 - 18:00</span></p>
                <p>점심시간 <span>11:30 - 12:30</span></p>
              </div>
            </div>
          </section>
          <section className="app-footer-bottom">
            <div className="app-footer-bottom__left">
              <div className="app-footer-links">
                {pcLinks.map(([label, extra]) => <a key={label} href="#" className={`app-footer-link${extra}`} onClick={notify(label)}>{label}</a>)}
              </div>
              <div className="app-footer-sns">{sns("app-footer-sns__link", "app-footer-sns__icon")}</div>
            </div>
            <div className="app-footer-bottom__right">
              {theme}
              <div className="app-footer-app-install">
                <span className="app-footer-app-title">앱 설치</span>
                <img src={bbmIcon("footer-biz-divider")} alt="" className="app-footer-app-divider" />
                <div className="app-footer-store">
                  <a href="#" className="app-footer-store__link" aria-label="Google Play" onClick={notify("Google Play")}><img src={bbmIcon("footer-google-play")} alt="" className="app-footer-store__icon" /></a>
                  <a href="#" className="app-footer-store__link" aria-label="App Store" onClick={notify("App Store")}><img src={bbmIcon("footer-app-store")} alt="" className="app-footer-store__icon" /></a>
                </div>
              </div>
            </div>
          </section>
        </div>
        <div className="app-footer-mobile">
          <div className="app-footer-mobile__contacts">
            <div className="app-footer-mobile__contact-item"><span className="app-footer-mobile__contact-label">이용문의</span><span className="app-footer-mobile__contact-value">02-784-2329</span></div>
            <div className="app-footer-mobile__contact-item"><span className="app-footer-mobile__contact-label">제휴광고</span><span className="app-footer-mobile__contact-value">070-4272-0114</span></div>
          </div>
          <div className="app-footer-mobile__quick-links">
            {["로그인", "매물등록", "매물관리", "PC버전"].map((label) => <a key={label} href="#" className="app-footer-mobile__quick-link" onClick={notify(label)}>{label}</a>)}
          </div>
          <details className="app-footer-mobile__biz">
            <summary className="app-footer-mobile__biz-summary">
              <span className="app-footer-mobile__biz-summary-text">(주) 보배네트워크 사업자 정보</span>
              <img src={bbmIcon("footer-biz-chevron")} alt="" className="app-footer-mobile__biz-chevron" />
            </summary>
            <div className="app-footer-mobile__biz-content">
              <p>대표이사: 김보배</p>
              <p>서울 양천구 목동동로 233-1 드림타워 11,12층</p>
              <p>사업자번호: 117-81-64543</p>
              <p className="app-footer-mobile__biz-email">이메일: bobaedream@bobaedream.co.kr</p>
              <p>팩스: 02-6499-2329</p>
            </div>
          </details>
          <div className="app-footer-mobile__links">
            {mobileLinks.map(([label, extra]) => <a key={label} href="#" className={`app-footer-mobile__link${extra}`} onClick={notify(label)}>{label}</a>)}
          </div>
          <div className="app-footer-mobile__sns">{sns("app-footer-mobile__sns-link", "app-footer-mobile__sns-icon")}</div>
          <div className="app-footer-mobile__theme">{theme}</div>
        </div>
      </div>
    </footer>
  );
}
