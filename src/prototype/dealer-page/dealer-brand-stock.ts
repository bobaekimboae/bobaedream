// 기존 재고의 구표기·신표기를 같은 제조사로 집계하고 필터에도 같은 기준을 적용한다.
export const dealerBrandName = (maker: string) => maker === "도요타" ? "토요타" : maker;

/** 필터 적용 전 판매자 전체 재고로 계산해 선택 중에도 로고 순서·대수를 유지한다. */
export function dealerBrandStock(cars: readonly { maker: string }[]) {
  const counts = new Map<string, number>();
  for (const car of cars) {
    const maker = dealerBrandName(car.maker);
    if (maker) counts.set(maker, (counts.get(maker) ?? 0) + 1);
  }
  return [...counts].map(([maker, count]) => ({ maker, count }))
    .sort((a, b) => b.count - a.count || a.maker.localeCompare(b.maker, "ko"));
}
