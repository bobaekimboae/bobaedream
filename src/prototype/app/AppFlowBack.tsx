import { useEffect } from "react";
import { useFlow } from "../../mobile";

// The native shell asks the current prototype screen to consume Back before
// falling back to WebView's document history. No native methods are exposed.
export function AppFlowBack({ screenId }: { screenId: string }) {
  const flow = useFlow();
  useEffect(() => {
    const back = (event: Event) => {
      if (event.defaultPrevented || flow.current.id !== screenId) return;
      if (document.querySelector('[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]')) {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true }));
        event.preventDefault();
      } else if (flow.canGoBack) {
        event.preventDefault();
        flow.pop();
      }
    };
    window.addEventListener("bbm-app-back", back);
    return () => window.removeEventListener("bbm-app-back", back);
  }, [flow, screenId]);
  return null;
}
