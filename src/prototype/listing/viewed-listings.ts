import { useEffect, useState } from "react";

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

// Chợ Tốt's isAdWatched changes the title, not the photo. Keep the same state
// across list/gallery remounts and reloads, without depending on :visited.
export function useViewedListing(id: number) {
  const [viewed, setViewed] = useState(() => readViewed().includes(id));
  useEffect(() => {
    const sync = () => setViewed(readViewed().includes(id));
    sync();
    window.addEventListener(changeEvent, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(changeEvent, sync);
      window.removeEventListener("storage", sync);
    };
  }, [id]);

  const markViewed = () => {
    setViewed(true);
    try {
      localStorage.setItem(storageKey, JSON.stringify([...readViewed().filter((value) => value !== id), id].slice(-1000)));
      window.dispatchEvent(new Event(changeEvent));
    } catch {
      // Storage can be unavailable; opening the listing must still work.
    }
  };
  return { viewed, markViewed };
}
