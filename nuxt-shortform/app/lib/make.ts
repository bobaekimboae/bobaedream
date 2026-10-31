// 사진 → 쇼츠 자동 제작(2026-10-31). 촬영 키트의 그리기 엔진(@kit/render)을 그대로 쓴다.
// 반사기 원칙: 사진은 고치지 않는다(자르기 · 천천히 이동 · 흐린 채움만). 차를 새로 그리는 AI 생성은 쓰지 않는다.
// 자막은 딜러가 적은 사실(연식 · 주행 · 색상 · 요청사항 · 가격)만 쓴다. 판단 표현 · 휴대폰 번호는 @kit/text-guard가 막는다.
import { ASPECT_SIZE, END_CARD, exportMp4, loadImage, makeQr, mp4VideoCodec, planDuration, type Cut, type ShortformAspect, type ShortformPlan } from "@kit/render";
import { formatPrice } from "@kit/text-guard";
import { bpmOf, makeMusic } from "./music";
import type { Car, Order, Profile } from "./store";

export const MIN_PHOTOS = 4;
export const MAX_PHOTOS = 20;

export const carTitle = (c: Car) => [c.maker, c.model].map((x) => x.trim()).filter(Boolean).join(" ");
export const mileageText = (raw: string) => {
  const n = Number(raw.replace(/[^\d]/g, ""));
  if (!n) return "";
  return n >= 10000 ? `${(Math.round(n / 1000) / 10).toLocaleString("ko-KR")}만km` : `${n.toLocaleString("ko-KR")}km`;
};
export const yearText = (raw: string) => (/^\d{4}$/.test(raw.trim()) ? `${raw.trim()}년식` : raw.trim());

/** 요청사항을 자막 줄로: 쉼표 · 줄바꿈으로 나눈 짧은 문구만(18자 이하) */
export function noteLines(note: string) {
  return note.split(/[,\n·]/).map((x) => x.trim()).filter((x) => x && x.length <= 18).slice(0, 4);
}

/** 컷 자막 초안: 사실만, 같은 말을 되풀이하지 않는다(모자라면 빈 자막) */
export function captionLines(car: Car, note: string, n: number) {
  const facts = [yearText(car.year), mileageText(car.mileage) && `${mileageText(car.mileage)} 주행`, car.color.trim(), ...noteLines(note)].filter(Boolean) as string[];
  const price = car.price.trim() ? formatPrice(car.price) : "";
  const lines = Array.from({ length: n }, (_, i) => facts[i] ?? "");
  if (price && n > 1) lines[n - 1] = price;
  return lines;
}

/** 한 컷 = 음악 4박(박자에 맞춰 넘어간다) */
export const cutSeconds = (o: Order) => (4 * 60) / bpmOf(o.style.music);
export function cutCount(o: Order) {
  return Math.max(1, Math.min(o.photos.length, Math.round((o.style.seconds - END_CARD) / cutSeconds(o))));
}

export async function buildPlan(o: Order, profile: Profile, aspect: ShortformAspect): Promise<ShortformPlan> {
  const [width, height] = ASPECT_SIZE[aspect];
  const n = cutCount(o);
  const urls = o.photos.slice(0, n).map((b) => URL.createObjectURL(b));
  try {
    const images = await Promise.all(urls.map((u) => loadImage(u)));
    const lines = captionLines(o.car, o.note, n);
    const cuts: Cut[] = [];
    images.forEach((image, i) => image && cuts.push({ source: { kind: "image", image }, duration: cutSeconds(o), line: lines[i] ?? "" }));
    const logo = profile.logo ? await loadImage(profile.logo) : null;
    const title = carTitle(o.car);
    const plan: ShortformPlan = {
      template: aspect === "9:16" ? o.style.template : "card",
      width,
      height,
      fps: 30,
      cuts,
      hook: title,
      title,
      trim: [yearText(o.car.year), o.car.color.trim()].filter(Boolean).join(" · "),
      price: o.car.price.trim() ? formatPrice(o.car.price) : "",
      specs: [yearText(o.car.year), mileageText(o.car.mileage), o.car.color.trim()].filter(Boolean),
      place: "",
      showPrice: Boolean(o.car.price.trim()),
      dealer: { name: profile.name.trim() || "보배드림", company: profile.company.trim(), phone: profile.phone.trim(), label: profile.name.trim() ? undefined : "보배드림 매물" },
      qr: /^https?:\/\//.test(o.car.url.trim()) ? await makeQr(o.car.url.trim()) : null,
      logo,
    };
    plan.voice = await makeMusic(o.style.music, planDuration(plan));
    return plan;
  } finally {
    // 그림은 이미 불러왔다: 주소는 mp4를 다 만든 뒤가 아니라도 놓아도 된다(이미지가 메모리에 남아 있음)
    window.setTimeout(() => urls.forEach((u) => URL.revokeObjectURL(u)), 60_000);
  }
}

export async function render(o: Order, profile: Profile, aspect: ShortformAspect, onProgress: (r: number) => void) {
  const plan = await buildPlan(o, profile, aspect);
  if (plan.cuts.length < MIN_PHOTOS) throw new Error("사진을 읽지 못했어요. JPG · PNG 사진으로 다시 올려 주세요.");
  const codec = (await mp4VideoCodec()) ?? "";
  const video = await exportMp4(plan, onProgress);
  return { video, seconds: Math.round(planDuration(plan)), codec };
}

/** 첫 사진으로 작은 표지(목록용) */
export async function posterOf(photo: Blob): Promise<string> {
  const u = URL.createObjectURL(photo);
  try {
    const img = await loadImage(u);
    if (!img) return "";
    const c = document.createElement("canvas");
    const s = 320 / Math.max(img.naturalWidth, img.naturalHeight);
    c.width = Math.round(img.naturalWidth * s);
    c.height = Math.round(img.naturalHeight * s);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.8);
  } finally {
    URL.revokeObjectURL(u);
  }
}

/** SNS에 함께 올릴 글(사실만) */
export function captionFor(o: Order, p: Profile) {
  const t = carTitle(o.car);
  const lines = [
    [t, o.car.price.trim() && formatPrice(o.car.price)].filter(Boolean).join(" · "),
    [yearText(o.car.year), mileageText(o.car.mileage), o.car.color.trim()].filter(Boolean).join(" · "),
    [p.name.trim() && `${p.name.trim()} 딜러`, p.company.trim(), p.phone.trim()].filter(Boolean).join(" · "),
    o.car.url.trim(),
    ["#보배드림", "#중고차", ...t.split(/\s+/).filter(Boolean).map((w, i, a) => (i === 0 ? `#${w}` : i === 1 ? `#${a[0]}${w}` : "")).filter(Boolean), "#Shorts"].join(" "),
  ];
  return lines.filter(Boolean).join("\n");
}
