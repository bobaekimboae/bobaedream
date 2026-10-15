// 프로토타입(src/prototype/data/seoul-autogallery-v01.ts)의 서울오토갤러리 매물을 앱 자산으로 내보낸다.
// 사용: node apps/seoul-autogallery-flutter/tool/export_data.mjs  (저장소 루트 기준)
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../../..");
const app = path.resolve(import.meta.dirname, "..");
const src = fs.readFileSync(path.join(root, "src/prototype/data/seoul-autogallery-v01.ts"), "utf8");
const rows = src.split("\n").filter((l) => /^\s*\{"number"/.test(l)).map((l) => JSON.parse(l.trim().replace(/,$/, "")));
const carDir = path.join(root, "public/assets/cars/seoul-autogallery-v01");
const logoDir = path.join(root, "public/assets/brand/kr");
const logoSlug = { BMW: "bmw", 벤츠: "mercedes-benz", 포르쉐: "porsche", 랜드로버: "land-rover", 렉서스: "lexus", 벤틀리: "bentley", 재규어: "jaguar", 현대: "hyundai", 기아: "kia" };
const stripCorp = (s) => s.replace(/\(주\)|주식회사/g, "").trim();

const copy = (from, to) => { fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(from, to); };
const out = rows.map((r) => {
  const nn = String(r.number).padStart(2, "0");
  let photos = [];
  if (r.photoSet) {
    const dir = path.join(carDir, r.photoSet.dir);
    photos = fs.readdirSync(dir).filter((f) => /\.(jpg|jpeg|webp)$/.test(f)).sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
    photos = photos.map((f) => { copy(path.join(dir, f), path.join(app, "assets/photos", `${r.number}`, f)); return `assets/photos/${r.number}/${f}`; });
  } else {
    for (let i = 1; i <= 5; i += 1) {
      const f = `sag-${nn}-${i}.webp`;
      if (fs.existsSync(path.join(carDir, f))) { copy(path.join(carDir, f), path.join(app, "assets/photos", `${r.number}`, f)); photos.push(`assets/photos/${r.number}/${f}`); }
    }
  }
  let thumb = photos[0] ?? null;
  const t = path.join(carDir, "thumb", `sag-${nn}.webp`);
  if (!r.photoSet && fs.existsSync(t)) { copy(t, path.join(app, "assets/thumbs", `sag-${nn}.webp`)); thumb = `assets/thumbs/sag-${nn}.webp`; }
  return { id: r.number, maker: r.maker, model: r.model, generation: r.generation, trim: r.trim, year: r.year, mileage: r.mileage, fuel: r.fuel, price: r.price, priceKind: r.priceKind, company: stripCorp(r.company), dealer: r.dealer, body: r.body, origin: r.origin, posted: r.posted, stock: r.stock, photos, thumb, cropFill: Boolean(r.photoSet) };
});
for (const [maker, slug] of Object.entries(logoSlug)) copy(path.join(logoDir, `${slug}.png`), path.join(app, "assets/logos", `${slug}.png`));
fs.writeFileSync(path.join(app, "assets/data/cars.json"), JSON.stringify({ logos: logoSlug, cars: out }, null, 1));
console.log(`cars ${out.length}, photos ${out.reduce((n, c) => n + c.photos.length, 0)}`);
