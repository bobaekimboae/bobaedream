/** 필터 적용 전 판매자 전체 재고로 계산해 선택 중에도 로고 순서·대수를 유지한다. */
export function dealerBrandStock(cars: readonly { maker: string }[]) {
  const counts = new Map<string, number>();
  for (const car of cars) {
    if (car.maker) counts.set(car.maker, (counts.get(car.maker) ?? 0) + 1);
  }
  return [...counts].map(([maker, count]) => ({ maker, count }))
    .sort((a, b) => b.count - a.count || a.maker.localeCompare(b.maker, "ko"));
}
