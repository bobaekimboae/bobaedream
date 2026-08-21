import type { PropsWithChildren } from "react";
import { MobileDeviceProvider } from "./Device";
import { KeyboardProvider } from "./Keyboard";
import { PhoneFrame } from "./PhoneFrame";

export function MobileRuntime({ children }: PropsWithChildren) {
  return (
    <MobileDeviceProvider>
      <PhoneFrame>
        <KeyboardProvider>
          <MobileAppViewport>{children}</MobileAppViewport>
        </KeyboardProvider>
      </PhoneFrame>
    </MobileDeviceProvider>
  );
}

function MobileAppViewport({ children }: PropsWithChildren) {
  return (
    <div
      className="mobile-app-viewport"
      data-keyboard-visible="false"
      data-platform="web"
      data-testid="mobile-app-viewport"
    >
      {children}
    </div>
  );
}
