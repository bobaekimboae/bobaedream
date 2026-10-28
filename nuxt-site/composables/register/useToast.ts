// 리액트 src/prototype/register/index.tsx 의 useToast(1.8초 뒤 사라지는 알림 글자)
import { ref } from "vue";

export function useToast() {
  const toast = ref("");
  const notify = (message: string) => {
    toast.value = message;
    window.setTimeout(() => { toast.value = ""; }, 1800);
  };
  return { toast, notify };
}
