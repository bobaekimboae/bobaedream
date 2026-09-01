import type { ReactNode } from "react";
import type { CatalogGroup } from "./catalog";
import {
  bobaedreamTokens,
  componentSpecs,
  ebayGroups,
  fuseGroups,
  iconLibraries,
  referenceSystems,
} from "./catalog";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ChipState = "default" | "selected" | "disabled";

const statusClass = (status?: string) => {
  if (status === "필수") return "is-required";
  if (status === "보류") return "is-hold";
  return "is-recommended";
};

const formatItemName = (item: { label: string; korean?: string }) =>
  item.korean ? `${item.label} (${item.korean})` : item.label;

export function StoryFrame({ title, eyebrow, children }: { title: string; eyebrow?: string; children: ReactNode }) {
  return (
    <main className="bd-story-frame">
      <div className="bd-story-heading">
        {eyebrow ? <p>{eyebrow}</p> : null}
        <h1>{title}</h1>
      </div>
      {children}
    </main>
  );
}

export function ReferenceMatrix() {
  return (
    <StoryFrame eyebrow="Cars.com Fuse + eBay Playbook" title="레퍼런스 매트릭스">
      <section className="bd-grid bd-grid-4">
        {referenceSystems.map((system) => (
          <article className="bd-panel" key={system.name}>
            <span className="bd-kicker">{system.role}</span>
            <h2>{system.name}</h2>
            <p>{system.apply}</p>
            <a href={system.url} target="_blank" rel="noreferrer">
              원문 보기
            </a>
          </article>
        ))}
      </section>
      <section className="bd-two-column">
        <CatalogColumn title="Fuse 카테고리" groups={fuseGroups} />
        <CatalogColumn title="eBay 카테고리" groups={ebayGroups} />
      </section>
    </StoryFrame>
  );
}

export function CatalogColumn({ title, groups }: { title: string; groups: CatalogGroup[] }) {
  return (
    <div className="bd-catalog-column">
      <h2>{title}</h2>
      {groups.map((group) => (
        <article className="bd-catalog-group" key={group.group}>
          <h3>{group.group}</h3>
          <p>{group.description}</p>
          <div className="bd-catalog-list">
            {group.items.map((item) => (
              <article className={`bd-catalog-item ${statusClass(item.status)}`} key={`${group.group}-${item.label}`}>
                <div className="bd-catalog-title-row">
                  <strong>{formatItemName(item)}</strong>
                  <em>{item.status ?? "권장"}</em>
                </div>
                {item.parent ? <small>{item.parent}</small> : null}
                <p>{item.note}</p>
              </article>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

export function TokenTable() {
  return (
    <StoryFrame eyebrow="Foundations" title="보배드림 디자인 토큰">
      <div className="bd-token-grid">
        {bobaedreamTokens.map((token) => {
          const isColor = token.value.startsWith("#");
          return (
            <article className="bd-token-card" key={token.name}>
              <div className="bd-token-swatch" style={isColor ? { background: token.value } : undefined}>
                {!isColor ? token.value : null}
              </div>
              <div>
                <strong>{token.name}</strong>
                <span>{token.korean}</span>
                <p>{token.usage}</p>
                <code>{token.value}</code>
              </div>
            </article>
          );
        })}
      </div>
    </StoryFrame>
  );
}

export function IconGlyph({ label }: { label: string }) {
  const path = {
    search: "M9.5 16a6.5 6.5 0 1 1 4.6-1.9l3.4 3.4",
    filter: "M3 5h18M6 12h12M10 19h4",
    car: "M5 15l1.6-5.2A3 3 0 0 1 9.5 7.7h5a3 3 0 0 1 2.9 2.1L19 15M6 15h12M7.5 18h.1M16.5 18h.1",
    save: "M6 4h12v17l-6-3.5L6 21V4Z",
    call: "M6.5 4.5l2.2-.8 2.2 4-1.5 1.5a12.5 12.5 0 0 0 5.4 5.4l1.5-1.5 4 2.2-.8 2.2c-.3.9-1.1 1.5-2 1.5C10.6 19 5 13.4 5 6.5c0-.9.6-1.7 1.5-2Z",
    video: "M4 7h10v10H4V7Zm10 3 5-3v10l-5-3",
    chevron: "M9 6l6 6-6 6",
  }[label] ?? "M12 4v16M4 12h16";

  return (
    <svg className="bd-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

export function IconLibrary() {
  return (
    <StoryFrame eyebrow="Style Guide / Icons" title="아이콘 라이브러리">
      <div className="bd-icon-section">
        <div className="bd-note">
          Fuse의 아이콘 라이브러리 분류인 material, custom, cars-duotone, social, oem 구조를 보배드림용
          interface, vehicle, commerce, media로 재정의했습니다.
        </div>
        {iconLibraries.map((library) => (
          <section className="bd-icon-library" key={library.library}>
            <header>
              <span>{library.source}</span>
              <h2>{library.korean}</h2>
            </header>
            <div className="bd-icon-grid">
              {library.icons.map((icon, index) => (
                <article className="bd-icon-card" key={icon.name}>
                  <div className="bd-icon-preview">
                    <IconGlyph label={["search", "filter", "chevron", "car", "save", "call", "video"][index % 7]} />
                  </div>
                  <strong>{icon.korean}</strong>
                  <code>{icon.name}</code>
                  <small>
                    {icon.size} · {icon.usage}
                  </small>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </StoryFrame>
  );
}

export function BobaBreadcrumb({ mobile = false }: { mobile?: boolean }) {
  const crumbs = ["홈", "중고차", "국산차", "현대", "그랜저"];
  if (mobile) {
    return (
      <nav className="bd-breadcrumb is-mobile" aria-label="Breadcrumb">
        <a href="#">‹ 중고차</a>
        <span aria-current="page">현대 그랜저</span>
      </nav>
    );
  }

  return (
    <nav className="bd-breadcrumb" aria-label="Breadcrumb">
      <ol>
        {crumbs.map((crumb, index) => (
          <li key={crumb} aria-current={index === crumbs.length - 1 ? "page" : undefined}>
            {index === crumbs.length - 1 ? <span>{crumb}</span> : <a href="#">{crumb}</a>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function BobaButton({
  children,
  variant = "primary",
  disabled = false,
}: {
  children: ReactNode;
  variant?: ButtonVariant;
  disabled?: boolean;
}) {
  return (
    <button className={`bd-button is-${variant}`} disabled={disabled} type="button">
      {children}
    </button>
  );
}

export function ButtonShowcase() {
  return (
    <StoryFrame eyebrow="Components / Buttons" title="버튼 스타일">
      <div className="bd-showcase-row">
        <BobaButton>매물 보기</BobaButton>
        <BobaButton variant="secondary">문의하기</BobaButton>
        <BobaButton variant="outline">초기화</BobaButton>
        <BobaButton variant="ghost">텍스트 버튼</BobaButton>
        <BobaButton disabled>비활성</BobaButton>
      </div>
    </StoryFrame>
  );
}

export function BobaFilterChip({
  label,
  state = "default",
  count,
}: {
  label: string;
  state?: ChipState;
  count?: number;
}) {
  return (
    <button className={`bd-filter-chip is-${state}`} disabled={state === "disabled"} type="button">
      {label}
      {count ? <span>{count}</span> : null}
    </button>
  );
}

export function FilterRail() {
  return (
    <StoryFrame eyebrow="Components / Filtering" title="필터 칩 레일">
      <div className="bd-filter-rail">
        <BobaFilterChip label="필터" count={2} />
        <BobaFilterChip label="전체" state="selected" />
        <BobaFilterChip label="제조사" />
        <BobaFilterChip label="연식" />
        <BobaFilterChip label="가격" />
        <BobaFilterChip label="무사고" state="selected" />
        <BobaFilterChip label="결과 0건" state="disabled" />
      </div>
    </StoryFrame>
  );
}

export function ListingCard({ compact = false }: { compact?: boolean }) {
  return (
    <article className={`bd-listing-card ${compact ? "is-compact" : ""}`}>
      <div className="bd-listing-photo">
        <img src="../assets/detail/raw-18.jpeg" alt="벤츠 E클래스 전면 사진" />
        <span>사진 24</span>
      </div>
      <div className="bd-listing-body">
        <div className="bd-listing-top">
          <div>
            <h2>벤츠 E클래스 E 300 4MATIC</h2>
            <p>AMG Line 제조사보증</p>
          </div>
          <button className="bd-save-button" aria-label="찜하기" type="button">
            <IconGlyph label="save" />
          </button>
        </div>
        <p className="bd-meta">2023년식 · 1만km · 가솔린 · 서울 강남구</p>
        <strong className="bd-price">8,420 만원</strong>
        <div className="bd-badge-row">
          <span>브랜드인증</span>
          <span>무사고</span>
          <span>가격인하</span>
        </div>
        <p className="bd-seller">한성자동차 · 오토갤러리 김태윤</p>
      </div>
    </article>
  );
}

export function DetailCTA() {
  return (
    <StoryFrame eyebrow="Components / Sticky Action" title="상세 하단 문의 바">
      <div className="bd-phone">
        <div className="bd-phone-content">
          <BobaBreadcrumb mobile />
          <ListingCard compact />
        </div>
        <footer className="bd-detail-cta">
          <button aria-label="찜하기" type="button">
            <IconGlyph label="save" />
          </button>
          <BobaButton variant="secondary">채팅</BobaButton>
          <BobaButton>전화문의</BobaButton>
        </footer>
      </div>
    </StoryFrame>
  );
}

export function ComponentSpecTable() {
  return (
    <StoryFrame eyebrow="Components" title="컴포넌트 대응표">
      <div className="bd-table-wrap">
        <table className="bd-table">
          <thead>
            <tr>
              <th>컴포넌트명</th>
              <th>분류</th>
              <th>PC 기준</th>
              <th>MO 기준</th>
              <th>참고</th>
            </tr>
          </thead>
          <tbody>
            {componentSpecs.map((spec) => (
              <tr key={spec.name}>
                <td>
                  <code>{spec.name}</code>
                </td>
                <td>{spec.category}</td>
                <td>{spec.pc}</td>
                <td>{spec.mo}</td>
                <td>{spec.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </StoryFrame>
  );
}

export function Overview() {
  return (
    <StoryFrame eyebrow="Bobaedream DS" title="보배드림 디자인 시스템">
      <section className="bd-hero-panel">
        <div>
          <span className="bd-kicker">Storybook + Chromatic Ready</span>
          <h2>디자이너와 개발자가 같은 화면을 보는 운영형 디자인 시스템</h2>
          <p>
            Cars.com Fuse의 자동차 도메인 구조와 eBay Playbook의 마켓플레이스 문서 구조를 합쳐,
            보배드림 중고차/신차/숏폼/차량이력 화면의 컴포넌트를 상태별로 관리합니다.
          </p>
        </div>
        <div className="bd-hero-preview">
          <BobaBreadcrumb />
          <FilterRailPreview />
          <ListingCard compact />
        </div>
      </section>
      <ComponentSpecTable />
    </StoryFrame>
  );
}

function FilterRailPreview() {
  return (
    <div className="bd-filter-rail is-preview">
      <BobaFilterChip label="필터" />
      <BobaFilterChip label="전체" state="selected" />
      <BobaFilterChip label="제조사" />
      <BobaFilterChip label="연식" />
      <BobaFilterChip label="가격" />
    </div>
  );
}
