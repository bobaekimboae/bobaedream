import { onBeforeUnmount, ref, toValue, watch, type MaybeRefOrGetter } from "vue";

// 리액트 src/prototype/listing/viewed-listings.ts 의 useViewedListing.
// readViewed · 키 이름은 export 되어 있지 않아 그대로 옮겼다(같은 localStorage 키 · 같은 이벤트 이름).
const storageKey = "bbm-viewed-listings-v1";
const changeEvent = "bbm-listing-viewed";

function readViewed(): number[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
    return Array.isArray(value) ? value.filter((id): id is number => typeof id === "number" && Number.isFinite(id)) : [];
  } catch {
    return [];
  }
}

export function useViewedListing(idSource: MaybeRefOrGetter<number>) {
  const viewed = ref(readViewed().includes(toValue(idSource)));
  let cleanup: (() => void) | undefined;
  watch(
    () => toValue(idSource),
    (id) => {
      cleanup?.();
      const sync = () => { viewed.value = readViewed().includes(id); };
      sync();
      window.addEventListener(changeEvent, sync);
      window.addEventListener("storage", sync);
      cleanup = () => {
        window.removeEventListener(changeEvent, sync);
        window.removeEventListener("storage", sync);
      };
    },
    { immediate: true },
  );
  onBeforeUnmount(() => cleanup?.());

  const markViewed = () => {
    const id = toValue(idSource);
    viewed.value = true;
    try {
      localStorage.setItem(storageKey, JSON.stringify([...readViewed().filter((value) => value !== id), id].slice(-1000)));
      window.dispatchEvent(new Event(changeEvent));
    } catch {
      // Storage can be unavailable; opening the listing must still work.
    }
  };
  return { viewed, markViewed };
}
