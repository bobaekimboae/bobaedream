import { useMemo, useState, type ReactNode } from "react";
import type { CatalogGroup, SidebarNode } from "./catalog";
import {
  bobaedreamUseCases,
  bobaedreamTokens,
  componentSpecs,
  ebayGroups,
  fuseSidebarTree,
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
  item.korean && item.korean !== item.label ? `${item.label} (${item.korean})` : item.label;

const formatSidebarName = (item: { title: string; koTitle?: string }) =>
  item.koTitle && item.koTitle !== item.title ? `${item.title} (${item.koTitle})` : item.title;

const sidebarMatches = (item: SidebarNode, query: string) =>
  [item.title, item.koTitle, item.href].join(" ").toLowerCase().includes(query);

const filterSidebar = (nodes: SidebarNode[], query: string): SidebarNode[] => {
  if (!query) return nodes;

  return nodes.reduce<SidebarNode[]>((result, node) => {
    const children = node.children ? filterSidebar(node.children, query) : undefined;
    if (sidebarMatches(node, query) || children?.length) {
      result.push({ ...node, children });
    }
    return result;
  }, []);
};

const countSidebarItems = (nodes: SidebarNode[]): number =>
  nodes.reduce((total, node) => total + 1 + (node.children ? countSidebarItems(node.children) : 0), 0);

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
    <StoryFrame eyebrow="Bobaedream DS" title="레퍼런스 매트릭스">
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
        <CatalogColumn title="보배드림 문서 항목" groups={fuseGroups} />
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

function SidebarTree({
  nodes,
  activeId,
  onSelect,
}: {
  nodes: SidebarNode[];
  activeId: string;
  onSelect: (node: SidebarNode) => void;
}) {
  return (
    <ul className="bd-fuse-nav-list">
      {nodes.map((node) => (
        <li className="bd-fuse-nav-item" key={node.id}>
          <button
            className={`bd-fuse-nav-link is-depth-${node.depth} ${node.id === activeId ? "is-active" : ""} ${
              node.status === "deprecated" ? "is-deprecated" : ""
            } ${node.status === "custom" ? "is-custom" : ""}`}
            style={{ paddingLeft: 10 + node.depth * 14 }}
            type="button"
            onClick={() => onSelect(node)}
          >
            <span className="bd-fuse-nav-content">
              {node.children?.length ? <span className="bd-fuse-nav-caret">›</span> : null}
              <span>{formatSidebarName(node)}</span>
            </span>
            {node.status === "deprecated" ? <em>deprecated</em> : null}
          </button>
          {node.children?.length ? <SidebarTree nodes={node.children} activeId={activeId} onSelect={onSelect} /> : null}
        </li>
      ))}
    </ul>
  );
}

function findSidebarNode(nodes: SidebarNode[], predicate: (node: SidebarNode) => boolean): SidebarNode | undefined {
  for (const node of nodes) {
    if (predicate(node)) return node;
    const child = node.children ? findSidebarNode(node.children, predicate) : undefined;
    if (child) return child;
  }
  return undefined;
}

export function BobaNavigationPreview() {
  const defaultNode = findSidebarNode(fuseSidebarTree, (node) => node.title === "Icons") ?? fuseSidebarTree[0];
  const [query, setQuery] = useState("");
  const [activeNode, setActiveNode] = useState<SidebarNode>(defaultNode);
  const filteredTree = useMemo(() => filterSidebar(fuseSidebarTree, query.trim().toLowerCase()), [query]);
  const activeUseCases = bobaedreamUseCases[activeNode.title] ?? [
    `${formatSidebarName(activeNode)}는 보배드림 화면에서 쓰는 UI 항목입니다.`,
    "명칭, 상태, 기준값을 함께 관리합니다.",
    "확정 항목만 Figma와 코드에 반영합니다.",
  ];

  return (
    <StoryFrame eyebrow="보배드림 DS" title="보배드림 문서 탐색">
      <div className="bd-fuse-shell">
        <aside className="bd-fuse-sidebar" aria-label="보배드림 디자인 시스템 메뉴">
          <a className="bd-fuse-brand" href="#overview">
            <span className="bd-fuse-brand-mark">B</span>
            <span>
              <strong>보배드림 DS</strong>
              <small>보배드림 운영 문서</small>
            </span>
          </a>
          <label className="bd-fuse-search">
            <span>검색</span>
            <input
              aria-label="문서 메뉴 검색"
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="Button, 버튼, Icons, 아이콘"
            />
          </label>
          <nav className="bd-fuse-nav">
            {filteredTree.length ? (
              <SidebarTree nodes={filteredTree} activeId={activeNode.id} onSelect={setActiveNode} />
            ) : (
              <p className="bd-fuse-empty">검색 결과가 없습니다.</p>
            )}
          </nav>
        </aside>
        <article className="bd-fuse-doc">
          <p className="bd-fuse-breadcrumb">스타일 가이드 / 아이콘</p>
          <h2>{formatSidebarName(activeNode)}</h2>
          <p>
            영문명과 한국어명을 함께 표기합니다. 각 항목은 한 문장으로 정의합니다.
          </p>
          <div className="bd-fuse-doc-grid">
            {activeUseCases.map((item) => (
              <section key={item}>
                <strong>{item}</strong>
                <span>보배드림 중고차 PC웹, 모바일웹, 앱 화면 기준으로 관리합니다.</span>
              </section>
            ))}
          </div>
          <div className="bd-note">
            검색어 <code>Button</code>, <code>버튼</code>, <code>Icon</code>, <code>아이콘</code>, <code>Filter</code>,
            <code>필터</code>를 모두 같은 메뉴에서 찾을 수 있습니다.
          </div>
        </article>
      </div>
      <p className="bd-fuse-count">총 {countSidebarItems(fuseSidebarTree)}개 문서 항목입니다.</p>
    </StoryFrame>
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
    <StoryFrame eyebrow="스타일 가이드 / 아이콘" title="아이콘 라이브러리">
      <div className="bd-icon-section">
        <div className="bd-note">
          아이콘은 interface, vehicle, commerce, media로 분류합니다.
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
          <h2>보배드림 디자인 시스템 기준</h2>
          <p>
            보배드림 화면에 쓰는 토큰, 컴포넌트, 아이콘 기준입니다.
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
