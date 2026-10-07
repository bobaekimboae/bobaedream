import type { ReactNode } from "react";

type UsedCarPcListLayoutProps = {
  header: ReactNode;
  overview?: ReactNode;
  sidebar: ReactNode;
  results: ReactNode;
  footer: ReactNode;
  className?: string;
};

/**
 * PC 전용 목록 뼈대. 모바일 목록의 DOM/CSS와 분리하고 데이터와 이벤트만
 * 상위 컨테이너에서 전달받는다.
 */
function UsedCarPcListLayout({ header, overview, sidebar, results, footer, className = "" }: UsedCarPcListLayoutProps) {
  return (
    <main className={`marketplace is-bbm${className ? ` ${className}` : ""}`} aria-label="중고차 PC 리스트">
      {header}
      {overview ? <div className="bbm-hybrid-top">{overview}</div> : null}
      <div className="bbm-page">
        {sidebar}
        <div className="bbm-content">{results}</div>
      </div>
      {footer}
    </main>
  );
}

export { UsedCarPcListLayout };
