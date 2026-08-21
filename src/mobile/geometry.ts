export type MobileDeviceGeometry = {
  device: {
    width: number;
    height: number;
  };
  screen: {
    x: number;
    y: number;
    width: number;
    height: number;
    radius: number;
  };
  safeArea: {
    top: number;
    bottom: number;
  };
  keyboard: {
    height: number;
  };
};

export const iphoneGeometry = {
  // The responsive web runtime uses this as its interaction/animation baseline.
  // Browser safe areas and the live viewport size are resolved in CSS/DOM.
  device: {
    width: 393,
    height: 852,
  },
  screen: {
    x: 0,
    y: 0,
    width: 393,
    height: 852,
    radius: 0,
  },
  safeArea: {
    top: 0,
    bottom: 0,
  },
  keyboard: {
    height: 0,
  },
} as const satisfies MobileDeviceGeometry;

export const pixelGeometry = {
  // Pixel10.png is a 2x asset. Its 854 x 1904 screen opening renders at
  // exactly 427 x 952 CSS pixels inside the 566 x 1022 asset canvas.
  device: {
    width: 566,
    height: 1022,
  },
  screen: {
    x: 70,
    y: 35,
    width: 427,
    height: 952,
    radius: 58,
  },
  safeArea: {
    top: 64,
    bottom: 48,
  },
  keyboard: {
    height: 316,
  },
} as const satisfies MobileDeviceGeometry;

export type IPhoneGeometry = typeof iphoneGeometry;
