// 원본 「Check the vehicle details」 화면의 칸을 그대로 옮긴 값 모양
export type MusicId = "presentation" | "energetic" | "cinematic" | "relaxed" | "none";
export type TemplateId = "classic" | "modern" | "showcase";
export type Aspect = "9:16" | "1:1" | "16:9";
export type Lang = "ko" | "tr" | "en" | "es" | "fr" | "de" | "it" | "ru" | "pt";
export type YesNo = "" | "no" | "yes";

export type Details = {
  make: string;
  model: string;
  year: string;
  price: string;
  currency: "KRW" | "USD" | "EUR";
  unit: "km" | "mi";
  mileage: string;
  power: string;
  engine: string;
  transmission: string;
  fuel: string;
  drivetrain: string;
  body: string;
  color: string;
  condition: string;
  // 구매자가 먼저 묻는 6가지(모두 선택)
  damage: YesNo;
  repainted: YesNo;
  replaced: YesNo;
  owners: "" | "1" | "2" | "3+";
  warranty: "" | "active" | "expired";
  tradeIn: "" | "accepted" | "not";
  // 끝 장면
  dealer: string;
  phone: string;
  address: string;
};

export type Options = {
  template: TemplateId;
  aspect: Aspect;
  music: MusicId;
  voiceover: boolean;
  logo: string | null;
  lang: Lang;
};

export type Photo = { id: string; blob: Blob; url: string; selected: boolean };

export type VideoStatus = "making" | "done" | "failed";
export type VideoItem = {
  id: string;
  createdAt: number;
  title: string;
  details: Details;
  options: Options;
  photos: Blob[];
  poster: string;
  status: VideoStatus;
  progress: number;
  video?: Blob;
  seconds?: number;
  lines?: { at: number; text: string }[];
  rating?: "up" | "down" | "";
  error?: string;
  projectId?: string;
};

export const emptyDetails = (): Details => ({
  make: "", model: "", year: "", price: "", currency: "KRW", unit: "km", mileage: "", power: "", engine: "",
  transmission: "", fuel: "", drivetrain: "", body: "", color: "", condition: "",
  damage: "", repainted: "", replaced: "", owners: "", warranty: "", tradeIn: "",
  dealer: "", phone: "", address: "",
});
export const defaultOptions = (): Options => ({ template: "classic", aspect: "9:16", music: "presentation", voiceover: true, logo: null, lang: "ko" });
