// 과쯔 승용 제조사 레일 로고(public/assets/brand/rail-v01, manifest.json). Drive 원본_오토홈_0925에서 받아 투명 여백을 잘라낸 파일.
// 르노코리아·KGM=헤이딜러 로고 폴더의 현행 로고(평면 다이아몬드 · 남색 KGM 글자). 구형 르노삼성·쌍용 로고는 쓰지 않음.
// width: 사용자 지시(2026-10-07 「키워」)로 제네시스·KGM만 초톳 r ≥ 4 규칙(폭 61%) 대신 폭 100%.
export const railBrandLogosV01: Record<string, { file: string; ratio: number; width?: string }> = {
  "현대": { file: "hyundai.png", ratio: 1.943 },
  "제네시스": { file: "genesis.png", ratio: 4.924, width: "100%" },
  "기아": { file: "kia.png", ratio: 4.168 },
  "쉐보레": { file: "chevrolet.png", ratio: 3.552 },
  "쉐보레(국산)": { file: "chevrolet.png", ratio: 3.552 },
  "르노코리아": { file: "renault.png", ratio: 0.761 },
  "르노코리아(삼성)": { file: "renault.png", ratio: 0.761 },
  "KGM": { file: "kgm.png", ratio: 6.297, width: "100%" },
  "KG모빌리티": { file: "kgm.png", ratio: 6.297, width: "100%" },
  "KG모빌리티(쌍용)": { file: "kgm.png", ratio: 6.297, width: "100%" },
  "BMW": { file: "bmw.png", ratio: 1.0 },
  "벤츠": { file: "mercedes-benz.png", ratio: 1.0 },
  "아우디": { file: "audi.png", ratio: 2.857 },
  "포르쉐": { file: "porsche.png", ratio: 0.747 },
};
