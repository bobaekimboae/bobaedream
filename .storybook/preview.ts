import type { Preview } from "@storybook/react-vite";
import "../src/design-system/design-system.css";

const preview: Preview = {
  parameters: {
    a11y: {
      test: "todo",
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      toc: true,
    },
    layout: "fullscreen",
    options: {
      storySort: {
        order: [
          "보배드림 디자인 시스템",
          ["개요", "레퍼런스 매트릭스"],
          "Foundations",
          ["토큰", "아이콘"],
          "Components",
          ["Breadcrumb", "Buttons", "Filter Chip", "Listing Card", "Detail CTA"],
          "Patterns",
        ],
      },
    },
  },
};

export default preview;
