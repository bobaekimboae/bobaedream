// 리액트 src/prototype/filters/bbm-filter-parts.tsx 의 useDialogFocus · handleDialogKeyDown(내보내지 않은 것이라 여기로 옮김)
import { onBeforeUnmount, onMounted, type Ref } from "vue";

const dialogFocusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function useDialogFocus(dialogRef: Ref<HTMLElement | null>, initialFocusRef: Ref<HTMLElement | null>) {
  let previousOverflow = "";
  let previousActive: HTMLElement | null = null;
  let focusFrame = 0;
  onMounted(() => {
    previousOverflow = document.body.style.overflow;
    previousActive = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    focusFrame = window.requestAnimationFrame(() => initialFocusRef.value?.focus());
  });
  onBeforeUnmount(() => {
    window.cancelAnimationFrame(focusFrame);
    document.body.style.overflow = previousOverflow;
    if (previousActive?.isConnected && !dialogRef.value?.contains(previousActive)) previousActive.focus();
  });
}

export function handleDialogKeyDown(event: KeyboardEvent, onClose: () => void) {
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    onClose();
    return;
  }
  if (event.key !== "Tab") return;
  const target = event.currentTarget as HTMLElement;
  const focusable = [...target.querySelectorAll<HTMLElement>(dialogFocusableSelector)]
    .filter((element) => element.getClientRects().length > 0 && element.getAttribute("aria-hidden") !== "true");
  if (!focusable.length) {
    event.preventDefault();
    target.focus();
    return;
  }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
