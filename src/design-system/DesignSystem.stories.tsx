import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  BobaBreadcrumb,
  ButtonShowcase,
  ComponentSpecTable,
  DetailCTA,
  FilterRail,
  BobaNavigationPreview,
  IconLibrary,
  ListingCard,
  Overview,
  ReferenceMatrix,
  StoryFrame,
  TokenTable,
} from "./DesignSystem";

const meta = {
  title: "보배드림 디자인 시스템/개요",
  component: Overview,
  parameters: {
    docs: {
      description: {
        component:
          "보배드림 화면에 쓰는 토큰, 컴포넌트, 아이콘 기준입니다.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Overview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const 개요: Story = {
  render: () => <Overview />,
};

export const 레퍼런스_매트릭스: Story = {
  name: "Reference / 목차",
  render: () => <ReferenceMatrix />,
};

export const 보배드림_좌측_사이드바: Story = {
  name: "Navigation / 좌측 사이드바",
  render: () => <BobaNavigationPreview />,
};

export const 토큰: Story = {
  name: "Foundations / 토큰",
  render: () => <TokenTable />,
};

export const 아이콘: Story = {
  name: "Foundations / 아이콘",
  render: () => <IconLibrary />,
};

export const Breadcrumb_PC: Story = {
  name: "Components / Breadcrumb / PC",
  render: () => (
    <StoryFrame eyebrow="Components / Breadcrumb" title="PC Breadcrumb">
      <BobaBreadcrumb />
    </StoryFrame>
  ),
};

export const Breadcrumb_MO: Story = {
  name: "Components / Breadcrumb / Mobile",
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
  render: () => (
    <StoryFrame eyebrow="Components / Breadcrumb" title="Mobile Breadcrumb">
      <BobaBreadcrumb mobile />
    </StoryFrame>
  ),
};

export const Buttons: Story = {
  name: "Components / Buttons",
  render: () => <ButtonShowcase />,
};

export const Filter_Chip: Story = {
  name: "Components / Filter Chip",
  render: () => <FilterRail />,
};

export const Listing_Card: Story = {
  name: "Components / Listing Card",
  render: () => (
    <StoryFrame eyebrow="Components / Listing Card" title="매물 카드">
      <div className="bd-grid bd-grid-2">
        <ListingCard />
        <ListingCard compact />
      </div>
    </StoryFrame>
  ),
};

export const Detail_CTA: Story = {
  name: "Components / Detail CTA",
  render: () => <DetailCTA />,
};

export const 컴포넌트_대응표: Story = {
  name: "Components / 대응표",
  render: () => <ComponentSpecTable />,
};
