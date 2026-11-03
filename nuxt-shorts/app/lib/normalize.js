// 보배드림 리뉴얼 백엔드 매물(/v2/cars/shorts data[0])을 숏폼 화면 모양(ShortItem)으로 바꾼다.
// shorts-api/app/Shorts/Normalizer.php 와 같은 규칙이다(화면이 원본을 직접 부르는 경우 · 스냅숏 만들기에 씀).
// 차량번호는 넣지 않고, 안심번호는 tel 링크용 숫자만 둔다.

/** @param {string | null | undefined} url @returns {import('./types').ShortVideo | null} */
export function videoOf(url) {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/(?:shorts\/|watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,20})/);
  if (yt) return { kind: "youtube", id: yt[1], url };
  const f = url.match(/^https:\/\/\S+\.(mp4|webm|mov|m3u8)(\?.*)?$/i);
  if (f) return { kind: f[1].toLowerCase() === "m3u8" ? "hls" : "file", url };
  return null;
}

/** @param {string | number | null | undefined} v */
function yyyymm(v) {
  const m = v == null ? null : String(v).match(/^(\d{4})(\d{2})/);
  return m ? `${m[1]}.${m[2]}` : null;
}

/** @param {any} c @returns {import('./types').ShortItem | null} */
export function normalizeCar(c) {
  if (!c || !c.public_id) return null;
  const video = videoOf(Array.isArray(c.videos) ? c.videos[0] : null);
  if (!video) return null;
  const images = (c.images || []).filter((i) => i && i.url).map((i) => ({ url: i.url, type: i.type ?? null }));
  const region = [c.region_sido, c.region_gugun].filter(Boolean).join(" ") || c.address || null;
  const phone = String(c.safe_phone_number || "").replace(/[^0-9]/g, "");
  return {
    id: String(c.public_id),
    title: c.car_name || [c.maker_name, c.model_name].filter(Boolean).join(" "),
    maker: c.maker_name ?? null,
    model: c.model_name ?? null,
    year: c.model_year != null ? Number(c.model_year) : null,
    registered: yyyymm(c.first_register) ?? yyyymm(c.model_month),
    mileage: c.mileage ?? null,
    fuel: c.fuel_type ?? null,
    transmission: c.transmission ?? null,
    price: c.sale_price ?? null,
    region,
    complex: c.dealer_complex_name ?? c.seller_dealer_complex_name ?? null,
    hashtags: (c.hashtags || []).filter((t) => typeof t === "string"),
    status: c.status ?? null,
    video,
    poster: images[0]?.url ?? null,
    images,
    likes: Number(c.like_count || 0),
    liked: Boolean(c.is_liked),
    views: Number(c.view_count || 0),
    seller: {
      id: c.seller_user_public_id ?? null,
      name: c.seller_name ?? null,
      company: c.seller_company_name ?? null,
      type: c.seller_type === "D" ? "dealer" : "private",
      avatar: c.seller_profile_image_url ?? null,
      selling: Number(c.seller_selling_count || 0),
      sold: Number(c.seller_sold_count || 0),
      phone: phone.length >= 9 ? phone : null,
      can_inquire: c.can_inquire !== false,
    },
    updated_at: c.updated_at ?? null,
    chapters: [],
  };
}
