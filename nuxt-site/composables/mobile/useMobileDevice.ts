// 리액트 src/mobile/Device.tsx 의 MobileDeviceContext(Provider + useMobileDevice) → provide/inject.
// mobileDevices 표는 Device.tsx 에서 그대로 import 하지 않고 같은 값으로 다시 만든다:
// Device.tsx 는 @radix-ui/react-dropdown-menu(리액트 부품)를 함께 불러와서 넉스트 판에서 읽을 수 없다.
// 기하값(geometry.ts) · 그림 주소(assets.ts)는 공용 파일에서 그대로 가져온다.
import { computed, inject, reactive, ref, type InjectionKey } from "vue";
import { mobileAssets } from "@src/mobile/assets";
import { iphoneGeometry, pixelGeometry, type MobileDeviceGeometry } from "@src/mobile/geometry";

export type MobileDeviceId = "iphone" | "pixel-10";

export type MobileDevicePreset = {
  id: MobileDeviceId;
  label: string;
  platform: "ios" | "android";
  bezel: string;
  bezelLayer: "above-screen" | "below-screen";
  geometry: MobileDeviceGeometry;
  camera?: { size: number; top: number };
};

export const mobileDevices: Record<MobileDeviceId, MobileDevicePreset> = {
  iphone: {
    id: "iphone",
    label: "iPhone",
    platform: "ios",
    bezel: mobileAssets.iphoneBezel,
    bezelLayer: "above-screen",
    geometry: iphoneGeometry,
  },
  "pixel-10": {
    id: "pixel-10",
    label: "Pixel 10",
    platform: "android",
    bezel: mobileAssets.pixel10Bezel,
    bezelLayer: "below-screen",
    geometry: pixelGeometry,
    camera: { size: 32, top: 23 },
  },
};

// 리액트와 같은 모양 { device, deviceId, setDeviceId }. reactive 객체라 구조 분해하지 말고 ctx.device 처럼 읽는다
// (기기는 DevicePicker 로만 바뀌므로 구조 분해해도 첫 값은 맞다).
export type MobileDeviceContextValue = {
  readonly device: MobileDevicePreset;
  readonly deviceId: MobileDeviceId;
  setDeviceId: (deviceId: MobileDeviceId) => void;
};

export const MobileDeviceKey: InjectionKey<MobileDeviceContextValue> = Symbol("MobileDevice");

export function createMobileDevice(): MobileDeviceContextValue {
  const deviceId = ref<MobileDeviceId>("iphone");
  return reactive({
    device: computed(() => mobileDevices[deviceId.value]),
    deviceId,
    setDeviceId: (id: MobileDeviceId) => { deviceId.value = id; },
  }) as MobileDeviceContextValue;
}

export function useMobileDevice() {
  const context = inject(MobileDeviceKey, null);
  if (!context) throw new Error("useMobileDevice must be used inside MobileDeviceProvider");
  return context;
}
