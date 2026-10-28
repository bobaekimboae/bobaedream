// copy of src/prototype/listing/index.tsx — keep in sync (원본 402~408줄).
// 목록 화면이 띄우는 상세 · 저장한 매물 화면. app.vue 가 configureListingScreens 로 정해 준다(리액트 Prototype.tsx 와 같음).
import type { FlowScreen } from "../../composables/mobile/useFlow";

export let detailScreen: FlowScreen;
export let savedListingsScreen: FlowScreen;

export function configureListingScreens(screens: { detailScreen: FlowScreen; savedListingsScreen: FlowScreen }) {
  detailScreen = screens.detailScreen;
  savedListingsScreen = screens.savedListingsScreen;
}
