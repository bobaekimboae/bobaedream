// 보배드림 리뉴얼 백엔드(staging)의 실매물 숏폼을 받아 app/data/shorts-snapshot.json 으로 저장한다.
// GitHub Pages 는 원본 서버가 다른 도메인 요청을 막아(CORS) 바로 부를 수 없어서, 이 사본을 보여 준다.
// 공개 저장소에 올라가므로 안심번호는 빼고(문의는 매물 상세로), 차량번호 · 설명글은 원래 넣지 않는다.
// 사용: pnpm snapshot   (원본 주소 바꾸기: SHORTS_UPSTREAM=https://… pnpm snapshot)
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { normalizeCar } from "../app/lib/normalize.js";

const base = (process.env.SHORTS_UPSTREAM || "https://staging.bbmuseum.co.kr").replace(/\/$/, "");
const categories = ["cars", "trucks", "bikes", "campers", "machinery", "parts"];
const items = [];
for (const category of categories) {
  const seen = new Set();
  let cursor = null;
  for (let i = 0; i < 200; i++) {
    const res = await fetch(`${base}/v2/cars/shorts`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(cursor ? { category_code: category, public_car_id: cursor } : { category_code: category }),
    });
    if (!res.ok) break;
    const b = await res.json();
    const car = b?.data?.[0];
    if (!car || seen.has(car.public_id)) break;
    seen.add(car.public_id);
    const it = normalizeCar(car);
    if (it && it.status === "selling") {
      it.seller.phone = null;
      items.push(it);
    }
    cursor = b?.meta?.navigation?.next?.public_id ?? null;
    if (!cursor) break;
  }
}
const out = fileURLToPath(new URL("../app/data/shorts-snapshot.json", import.meta.url));
writeFileSync(out, JSON.stringify({ source: base, fetched_at: new Date().toISOString(), items }, null, 1) + "\n");
console.log(`${items.length}대 저장 →`, out);
