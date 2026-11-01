// 커뮤니티 공용 게시판 표(public/community/data/board-vehicle-review.js · board-fuel-economy.js)를
// 넉스트 앱이 읽는 JSON(app/data/*.json)으로 옮긴다. 화면 확인용 댓글 · 구매 정보는 글 번호로 정한 가상 값이다.
// 사용: node scripts/build-data.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = fileURLToPath(new URL("../../", import.meta.url));
const out = fileURLToPath(new URL("../app/data/", import.meta.url));
const ctx = { window: {} };
vm.createContext(ctx);
for (const f of ["board-vehicle-review.js", "board-fuel-economy.js"]) vm.runInContext(readFileSync(`${root}public/community/data/${f}`, "utf8"), ctx);
const T = ctx.window.BBM_BOARD_TABLES;

// "../%61ssets/cars/x.webp" → "cars/x.webp" (앱에서 sitePath("assets", …)로 다시 붙인다)
const rel = (p) => (p ? p.replace(/^\.\.\/(%61|a)ssets\//, "") : "");
const pick = (arr, n) => arr[n % arr.length];
const num = (s) => Number(String(s).replace(/,/g, "")) || 0;

const names = ["달리는곰", "주말드라이버", "출퇴근러", "카톡안읽음", "오너9년차", "도로위산책", "서울라이더", "빨간불정지", "세차장단골", "정비는셀프", "초보운전자", "드라이브로그", "차생활연구소", "에코드라이버", "고속도로위", "남해안투어"];
const comments = [
  "실제로 타보니 공감되는 내용이 많네요.", "연비는 어느 정도 나오나요?", "저도 같은 차인데 승차감은 비슷하게 느꼈어요.",
  "출고 대기 얼마나 걸리셨어요?", "타이어는 순정 그대로인가요?", "리뷰 잘 봤습니다. 구매에 참고할게요.",
  "옵션은 어떤 걸로 하셨어요?", "고속에서 소음은 어떤가요?", "보험료는 얼마 나왔나요?", "겨울 주행거리 궁금해요.",
];
const regions = ["서울", "경기", "인천", "부산", "대구", "대전", "광주", "울산", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];
const avatar = (n) => `community/assets/profile-avatars/avatar-${String((n % 48) + 1).padStart(2, "0")}.svg`;

const mkComments = (seed, count) =>
  Array.from({ length: Math.min(count, 6) }, (_, i) => ({
    id: `c${seed}-${i}`,
    author: pick(names, seed + i * 3 + 1),
    avatar: avatar(seed * 7 + i),
    body: pick(comments, seed + i),
    likes: (seed * 3 + i * 5) % 14,
    region: pick(regions, seed + i * 2),
    daysAgo: 1 + ((seed + i) % 9),
    replies: i === 0 ? (seed % 4) : 0,
  }));

// ── 차량 리뷰 ──
const review = T["vehicle-review"].rows.map((r, i) => {
  const ratings = r.ratings.split("|").map((s) => {
    const m = s.match(/^(.*)\s([\d.]+)$/);
    return { label: m[1], score: Number(m[2]) };
  });
  const owner = r.owner === "true";
  const year = Number((r.trim.match(/^(\d{4})/) || [0, 2025])[1]);
  const price = 2400 + ((i * 937) % 9800);
  return {
    id: r.id,
    modelId: r.modelId,
    brand: r.brand,
    model: r.model,
    trim: r.trim,
    year,
    powertrain: r.powertrain,
    brandLogo: rel(r.brandLogo),
    title: r.title,
    body: r.body,
    author: r.author,
    avatar: avatar(i * 5 + 2),
    publishedAt: r.publishedAt,
    images: r.images.split("|").map(rel).filter(Boolean),
    views: num(r.views),
    comments: num(r.comments),
    likes: num(r.likes),
    rating: Number(r.rating),
    ratings,
    owner,
    ownership: r.ownershipLabel,
    location: r.location,
    benchmark: r.benchmark,
    purchase: owner ? { month: `${year}.${String(1 + (i % 12)).padStart(2, "0")}`, price, city: r.location, metric: r.powertrain === "ev" ? `${380 + (i * 13) % 140}km` : `${(9 + (i % 7) * 0.8).toFixed(1)}km/L` } : null,
    commentList: mkComments(i, num(r.comments)),
  };
});

// ── 연비·전비 ──
const F = T["fuel-economy"];
const fuel = F.rows.map((r, i) => ({
  id: r.id,
  modelId: r.modelId,
  brand: r.brand,
  model: r.model,
  trim: r.trim,
  powertrain: r.powertrain,
  brandLogo: rel(r.brandLogo),
  photo: rel(r.thumbnail),
  title: r.title,
  body: r.body,
  author: r.author,
  avatar: avatar(i * 3 + 11),
  publishedAt: r.publishedAt,
  images: r.images.split("|").map(rel).filter(Boolean),
  comments: num(r.comments),
  likes: num(r.likes),
  views: num(r.views),
  city: r.city,
  odometer: num(r.odometer),
  fuel: r.fuelConsumption ? Number(r.fuelConsumption) : null,
  energy: r.energyConsumption ? Number(r.energyConsumption) : null,
  range: r.fullChargeRange ? Number(r.fullChargeRange) : null,
  temperature: r.temperature !== "" && r.temperature != null ? Number(r.temperature) : null,
  ownerYears: 1 + (i % 6),
  commentList: mkComments(i + 50, num(r.comments)),
}));
const models = F.models.map((m) => ({ id: m.id, brand: m.brand, model: m.model, trim: m.trim, powertrain: m.powertrain, brandLogo: rel(m.brandLogo), photo: rel(m.photo) }));

writeFileSync(`${out}review.json`, JSON.stringify(review));
writeFileSync(`${out}fuel.json`, JSON.stringify({ models, posts: fuel }));
console.log("review", review.length, "fuel", fuel.length, "models", models.length);
