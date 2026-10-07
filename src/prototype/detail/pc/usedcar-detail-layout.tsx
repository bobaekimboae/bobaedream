import type { ReactNode, RefObject } from "react";

type UsedCarPcDetailLayoutProps = {
  header: ReactNode;
  sectionNav: ReactNode;
  gallery: ReactNode;
  overview: ReactNode;
  leftBody: ReactNode;
  sidebar: ReactNode;
  belowColumns: ReactNode;
  footer: ReactNode;
  rootRef: RefObject<HTMLDivElement | null>;
};

/** PC 전용 상세 뼈대. 767px 이하 모바일 상세와 마크업을 공유하지 않는다. */
function UsedCarPcDetailLayout({ header, sectionNav, gallery, overview, leftBody, sidebar, belowColumns, footer, rootRef }: UsedCarPcDetailLayoutProps) {
  return (
    <div className="pc-detail is-usedcar-pc" ref={rootRef}>
      {header}
      {sectionNav}
      <main className="pc-detail-container" aria-label="중고차 PC 상세">
        <div className="pc-detail-columns">
          <div className="pc-detail-left">
            {gallery}
            {overview}
            {leftBody}
          </div>
          {sidebar}
        </div>
        {belowColumns}
      </main>
      {footer}
    </div>
  );
}

export { UsedCarPcDetailLayout };
