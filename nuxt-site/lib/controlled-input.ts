// 리액트 "제어 입력칸"(value={x} onChange) 흉내: 부모가 값을 바꾼 뒤(또는 바꾸지 않았을 때) 입력칸 글자를 그 값으로 되돌린다.
// Vue 는 값이 그대로면 다시 그리지 않아서, 예: "50,000" 을 넣어 부모가 "50000" 으로 저장하면 입력칸에 쉼표가 남는다.
import { nextTick } from "vue";

export function syncControlled(event: Event, current: () => string) {
  const el = event.currentTarget as HTMLInputElement | null;
  if (!el) return;
  void nextTick(() => { const next = current(); if (el.value !== next) el.value = next; });
}
