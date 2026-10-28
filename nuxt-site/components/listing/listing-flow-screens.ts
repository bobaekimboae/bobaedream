// 리액트 src/Prototype.tsx 의 listScreen · savedListingsScreen(FlowScreen) 과 같은 묶음.
// render: `<AppFlowBack screenId=…/><화면/>` → 같은 두 부품을 그리는 함수형 부품.
import { h, markRaw, type FunctionalComponent } from "vue";
import type { FlowScreen } from "../../composables/mobile/useFlow";
import AppFlowBack from "../app/AppFlowBack.vue";
import MarketplaceScreen from "./MarketplaceScreen";
import { SavedListingsHeader, SavedListingsScreen } from "./MarketplaceParts";

const withBack = (screenId: string, Screen: unknown, name: string) => {
  const Wrapped: FunctionalComponent = () => [h(AppFlowBack, { screenId }), h(Screen as never)];
  Wrapped.displayName = name;
  return markRaw(Wrapped);
};

export const listScreen: FlowScreen = { id: "marketplace", component: withBack("marketplace", MarketplaceScreen, "MarketplaceScreenWithBack") };
export const savedListingsScreen: FlowScreen = { id: "saved-listings", header: markRaw(SavedListingsHeader), headerHeight: 58, component: withBack("saved-listings", SavedListingsScreen, "SavedListingsScreenWithBack") };
