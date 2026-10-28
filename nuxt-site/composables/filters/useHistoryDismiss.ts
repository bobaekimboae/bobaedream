// 리액트 src/prototype/filters/bbm-filter-parts.tsx 의 useHistoryDismiss(내보내지 않은 것이라 여기로 옮김).
// 열 때 history 에 표시를 하나 쌓고, 뒤로 가기(popstate)면 onClose. 실제로 닫힐 때(언마운트) 쌓은 표시를 한 번 지운다.
// (리액트 Strict Mode 재실행 취소용 타이머 보정은 Vue에는 필요 없어 뺐다.)
import { onBeforeUnmount, onMounted } from "vue";

export function useHistoryDismiss(stateKey: string, marker: string, onClose: () => void) {
  let closedByPopState = false;
  const onPopState = () => {
    if (window.history.state?.[stateKey] === marker) return;
    closedByPopState = true;
    onClose();
  };
  onMounted(() => {
    const previousState = window.history.state;
    if (previousState?.[stateKey] !== marker) window.history.pushState({ ...previousState, [stateKey]: marker }, "", window.location.href);
    window.addEventListener("popstate", onPopState);
  });
  onBeforeUnmount(() => {
    window.removeEventListener("popstate", onPopState);
    if (!closedByPopState && window.history.state?.[stateKey] === marker) {
      window.setTimeout(() => {
        if (window.history.state?.[stateKey] === marker) window.history.back();
      }, 0);
    }
  });
}
