// 리액트 src/prototype/detail/index.tsx 의 export(DetailUiProvider, useDetailUi, VehicleDetail, DetailFooter)와 같은 자리.
// vehicleDetailScreen 은 리액트 src/Prototype.tsx 의 detailScreen 과 같은 FlowScreen(목록에서 flow.push 할 때 씀).
import { markRaw } from "vue";
import type { FlowScreen } from "../../composables/mobile/useFlow";
import VehicleDetail from "./VehicleDetail.vue";
import VehicleDetailScreen from "./VehicleDetailScreen.vue";
import DetailFooter from "./DetailFooter.vue";
import DetailUiProvider from "./DetailUiProvider.vue";

export { VehicleDetail, VehicleDetailScreen, DetailFooter, DetailUiProvider };
export { useDetailUi, type DetailUi } from "../../composables/detail/useDetailUi";

export const vehicleDetailScreen: FlowScreen = {
  id: "vehicle-detail",
  component: markRaw(VehicleDetailScreen),
  footer: markRaw(DetailFooter),
  footerHeight: 56,
};
