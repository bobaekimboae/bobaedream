import { inject, type InjectionKey, type Ref } from "vue";

// 리액트 src/prototype/data/index.tsx 의 FavoritesContext + useFavorites.
// 돌려주는 모양은 리액트와 같다: { likedIds, toggleLiked }.
// 단 likedIds 는 Ref<number[]>(읽기 전용) — 스크립트에서는 likedIds.value, 템플릿에서는 구조 분해해 최상위에 두면 자동으로 풀린다.
// toggleLiked 는 리액트처럼 새 배열을 대입한다(제자리 변경 없음).
export type FavoritesUi = { likedIds: Readonly<Ref<readonly number[]>>; toggleLiked: (id: number) => void };

export const favoritesKey: InjectionKey<FavoritesUi> = Symbol("Favorites");

export function useFavorites() {
  const context = inject(favoritesKey, null);
  if (!context) throw new Error("FavoritesProvider is missing");
  return context;
}
