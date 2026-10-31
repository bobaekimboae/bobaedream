// 트럭 형식 13개 · 세부형식 89개는 시안 사이트 원장(src/prototype/data/truck-format-catalog.ts) 하나를 그대로 쓴다.
import { truckFormatCatalog, truckSubtypesFor } from "@proto/data/truck-format-catalog";

export default {
  formats: truckFormatCatalog.map((g) => g.name),
  subtypes: (format: string) => [...truckSubtypesFor(format)],
};
