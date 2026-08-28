"use client";

import { ChangeEvent, ClipboardEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CaretDown,
  CaretRight,
  Check,
  CheckCircle,
  FilmStrip,
  Garage,
  IdentificationCard,
  ImageSquare,
  LinkSimple,
  Microphone,
  MusicNote,
  PencilSimpleLine,
  Play,
  Plus,
  Sparkle,
  TextT,
  X,
} from "@phosphor-icons/react";

type PhotoItem = { id: string; file?: File; url: string; sample?: boolean };
type SavedAsset = { name: string; type: string; url: string };
type RenderedVideo = {
  url: string;
  downloadUrl: string;
  name: string;
  size: number;
  hasMusic: boolean;
  hasNarration: boolean;
  format: "MP4" | "WebM";
};
type StyleKey = "premium" | "clean" | "dynamic";
type MusicCategory = "all" | "trend" | "drive" | "luxury" | "bright";
type VideoDuration = 15 | 30 | 45 | 60 | 90 | 120;
type MediaInputMode = "photo" | "video";
type VehicleInputMode = "inventory" | "manual" | "url" | "plate";
type ListingProvider = "auto" | "encar" | "bobaedream" | "kcar" | "daangn" | "kbchachacha" | "chutcha" | "other";
type ImportedListing = {
  source: string;
  listingId: string;
  importedPhotoCount: number;
  totalPhotoCount: number;
  meta?: { plate?: string; location?: string };
};
const BUILT_IN_SAMPLE_AUDIO = "/samples/CARVID-encar-42501957-15s.m4a";
type CtaType = "listing" | "call" | "inquiry";
type InventoryItem = {
  id: string;
  stockNo: string;
  year: string;
  make: string;
  model: string;
  trim: string;
  mileage: string;
  price: string;
  photo: string;
  status: "판매중" | "가격변경" | "신규";
};
type VehicleFeatureGroup = {
  title: string;
  description: string;
  items: string[];
};
type CaptionPosition = "top" | "middle" | "bottom";
type CaptionStyle = "classic" | "box" | "highlight";
type SubtitleCue = {
  text: string;
  startMs: number;
  endMs: number;
};
type TemplateCategory = "featured" | "new" | "retro" | "drive" | "sale";
type TemplateKey =
  | "dealer-clean"
  | "xhs-diary"
  | "luxury-cut"
  | "dynamic-sale"
  | "retro-film"
  | "road-trip";
type VideoTemplate = {
  id: TemplateKey;
  name: string;
  description: string;
  categories: TemplateCategory[];
  cover: number;
  style: StyleKey;
  captionPosition: CaptionPosition;
  captionStyle: CaptionStyle;
  captionSize: number;
  brandColor: string;
  music: string;
};
const MAX_PHOTOS = 20;
const LISTING_PROVIDERS: { id: ListingProvider; label: string; placeholder: string }[] = [
  { id: "auto", label: "자동 감지", placeholder: "매물 URL을 붙여넣으세요" },
  { id: "encar", label: "엔카", placeholder: "https://fem.encar.com/cars/detail/..." },
  { id: "bobaedream", label: "보배드림", placeholder: "보배드림 매물 URL" },
  { id: "kcar", label: "K Car", placeholder: "K Car 매물 URL" },
  { id: "daangn", label: "당근 중고차", placeholder: "당근 자동차 매물 URL" },
  { id: "kbchachacha", label: "KB차차차", placeholder: "KB차차차 매물 URL" },
  { id: "chutcha", label: "첫차", placeholder: "첫차 매물 URL" },
  { id: "other", label: "기타", placeholder: "다른 중고차 사이트 매물 URL" },
];

function detectListingProvider(value: string): ListingProvider {
  const url = value.toLowerCase();
  if (/encar\.com/.test(url)) return "encar";
  if (/bobaedream\.co\.kr/.test(url)) return "bobaedream";
  if (/kcar\.com/.test(url)) return "kcar";
  if (/daangn\.com|karrotmarket\.com/.test(url)) return "daangn";
  if (/kbchachacha\.com/.test(url)) return "kbchachacha";
  if (/chutcha\.net|chutcha\.com/.test(url)) return "chutcha";
  return value.trim() ? "other" : "auto";
}
const DEFAULT_FORM: Record<string, string> = {
  make: "BMW",
  model: "X3",
  trim: "xDrive20d",
  year: "2016",
  mileage: "165536",
  fuel: "디젤",
  transmission: "자동",
  price: "1490",
  feature: "사륜구동 · 파노라마 선루프 · 전동 가죽시트",
  seller: "KB차차차 제휴매물",
  phone: "1588-0000",
  accidentHistory: "없음",
  repairHistory: "",
  specialNotes: "",
};

const SAMPLE_INVENTORY: InventoryItem[] = [
  { id: "inventory-x3-01", stockNo: "BB-240813-01", year: "2016", make: "BMW", model: "X3", trim: "xDrive20d", mileage: "165536", price: "1490", photo: SAMPLE_PHOTOS_PLACEHOLDER(0), status: "판매중" },
  { id: "inventory-x3-02", stockNo: "BB-240813-02", year: "2017", make: "BMW", model: "X3", trim: "xDrive20d", mileage: "132400", price: "1680", photo: SAMPLE_PHOTOS_PLACEHOLDER(2), status: "가격변경" },
  { id: "inventory-x3-03", stockNo: "BB-240813-03", year: "2016", make: "BMW", model: "X3", trim: "xDrive28i", mileage: "98400", price: "1790", photo: SAMPLE_PHOTOS_PLACEHOLDER(5), status: "신규" },
];

function SAMPLE_PHOTOS_PLACEHOLDER(index: number) {
  return `/sample-bmw-x3/${String(index + 1).padStart(2, "0")}-100001${1407 + index}.jpg`;
}

const VEHICLE_FEATURE_GROUPS: VehicleFeatureGroup[] = [
  {
    title: "소유·이력",
    description: "신뢰도를 빠르게 보여주는 정보",
    items: ["1인소유", "보험이력없음", "비흡연차", "완전무사고", "제조사AS", "리콜완료"],
  },
  {
    title: "주행·관리",
    description: "관리 상태와 소모품 점검 정보",
    items: ["저주행", "정비완료", "차계부", "타이어 교체", "소모품 교환", "성능점검"],
  },
  {
    title: "안전·주행",
    description: "주행 안정성과 운전자 보조 기능",
    items: ["사륜구동", "주행보조", "어댑티브 크루즈", "차선 유지", "전방 충돌방지", "360도 카메라"],
  },
  {
    title: "편의·실내",
    description: "구매자가 많이 찾는 핵심 옵션",
    items: ["파노라마 선루프", "전동 가죽시트", "통풍 시트", "열선 시트", "헤드업 디스플레이", "프리미엄 오디오"],
  },
  {
    title: "공간·상품성",
    description: "공간 활용과 매물 경쟁력",
    items: ["7인승", "브라운 시트", "베이지 시트", "전동 트렁크", "세금계산서", "보증연장"],
  },
];

const POPULAR_VEHICLE_FEATURES = [
  "1인소유", "저주행", "사륜구동", "파노라마 선루프", "전동 가죽시트",
  "비흡연차", "완전무사고", "통풍 시트", "주행보조", "보증연장",
];

const SAMPLE_SCRIPT =
  "2016년식 BMW X3 xDrive20d입니다. 네이비 외장과 균형 잡힌 SUV 디자인이 돋보입니다. 디젤 엔진과 사륜구동을 갖췄으며 주행거리는 16만 5천 536킬로미터입니다. 전동 가죽시트, 내비게이션, 전자식 변속기와 듀얼존 에어컨이 적용됐습니다. 판매가는 1천 490만원입니다.";

function timedVehicleScript(form: Record<string, string>, duration: VideoDuration, variant = 0) {
  const name = [form.year, form.make, form.model, form.trim].filter(Boolean).join(" ");
  const mileage = `${Number(form.mileage || 0).toLocaleString("ko-KR")}킬로미터`;
  const price = formatPrice(form.price);
  const opener = ["오늘의 추천 매물", "놓치기 아쉬운 실매물", "사진으로 확인하는 추천 차량"][variant % 3];
  const core = `${opener}, ${name}입니다. ${form.fuel} ${form.transmission} 차량이며 주행거리는 ${mileage}입니다. 핵심 장점은 ${form.feature}, 판매가는 ${price}입니다.`;
  const disclosureParts = [
    form.accidentHistory && `사고 이력 ${form.accidentHistory}`,
    form.repairHistory && `수리 이력 ${form.repairHistory}`,
    form.specialNotes && `특이사항 ${form.specialNotes}`,
  ].filter(Boolean);
  const disclosure = disclosureParts.length
    ? `차량 상태 고지 사항은 ${disclosureParts.join(", ")}입니다.`
    : "차량 상태와 이력은 성능점검기록부와 실제 차량을 기준으로 확인해 주세요.";
  const exterior = `외관은 전체적인 차체 균형과 도장 상태를 사진 순서대로 확인해 보세요. 실내는 시트와 스티어링 휠, 센터페시아 상태를 자세히 공개합니다.`;
  const driving = `운전자 중심의 편안한 구성과 실용적인 공간을 갖춰 출퇴근과 장거리 주행에 모두 잘 어울립니다. 계기판 주행거리와 엔진룸 관리 상태도 함께 확인할 수 있습니다.`;
  const guidance = `차량의 실제 옵션과 사고·보험 이력은 상담할 때 다시 안내해 드립니다. 방문 전 재고 여부를 확인하시고 실제 차량 확인과 시승을 권해드립니다.`;
  if (duration === 15)
    return `${name}입니다. ${mileage} 주행, ${form.feature}. 판매가는 ${price}입니다.`;
  if (duration === 30)
    return `${core} 사진으로 외관과 실내 상태를 확인해 보세요.`;
  if (duration === 45)
    return `${core} ${exterior} ${disclosure} 자세한 상담은 ${form.seller}로 문의해 주세요.`;
  if (duration === 60)
    return `${core} ${exterior} ${driving} ${disclosure} 자세한 상담과 시승 문의는 ${form.seller}로 연락해 주세요.`;
  return `${core} ${exterior} ${driving} ${disclosure} ${guidance} ${form.feature} 구성을 원하는 고객에게 특히 추천하는 매물입니다. 차량 상태는 촬영 시점을 기준으로 하며 판매 전에 변동될 수 있습니다. 자세한 문의는 ${form.seller}, ${form.phone}으로 연락해 주세요.`;
}

const SAMPLE_PHOTOS: PhotoItem[] = Array.from({ length: 10 }, (_, index) => ({
  id: `bmw-x3-sample-${index + 1}`,
  url: `/sample-bmw-x3/${String(index + 1).padStart(2, "0")}-100001${1407 + index}.jpg`,
  sample: true,
}));

const SAMPLE_SCENES = [
  ["BMW X3 첫인상", "네이비 컬러 · 정면 디자인"],
  ["안정적인 후면", "SUV 특유의 균형 잡힌 비율"],
  ["xDrive SUV", "도심과 장거리 모두 편안하게"],
  ["디젤 엔진", "효율과 실용성을 갖춘 구성"],
  ["실주행거리", "165,536 km 확인"],
  ["운전석 전경", "내비게이션 · 블랙 가죽시트"],
  ["전자식 변속기", "iDrive 컨트롤러 · 오토홀드"],
  ["멀티펑션 핸들", "운전자 중심의 BMW 인테리어"],
  ["듀얼존 에어컨", "앞좌석 열선 · 자동 공조"],
  ["전동 가죽시트", "판매가 1,490만원"],
];
const SAMPLE_CAPTIONS = SAMPLE_SCENES.map((scene) => scene[1]);

const templateCategories: { id: TemplateCategory; label: string }[] = [
  { id: "featured", label: "추천" },
  { id: "new", label: "신규" },
  { id: "retro", label: "레트로" },
  { id: "drive", label: "드라이브" },
  { id: "sale", label: "판매" },
];

const videoTemplates: VideoTemplate[] = [
  {
    id: "dealer-clean",
    name: "딜러 클린",
    description: "차량 정보가 선명한 기본 매물형",
    categories: ["featured", "sale"],
    cover: 0,
    style: "clean",
    captionPosition: "bottom",
    captionStyle: "box",
    captionSize: 30,
    brandColor: "#14213d",
    music: "urban-motion",
  },
  {
    id: "xhs-diary",
    name: "샤오홍수 다이어리",
    description: "감성 타이틀과 느린 사진 전환",
    categories: ["featured", "new"],
    cover: 6,
    style: "premium",
    captionPosition: "middle",
    captionStyle: "classic",
    captionSize: 32,
    brandColor: "#f4efe7",
    music: "quiet-luxury",
  },
  {
    id: "luxury-cut",
    name: "럭셔리 컷",
    description: "수입차에 맞춘 블랙 라벨 구성",
    categories: ["featured", "new"],
    cover: 2,
    style: "premium",
    captionPosition: "bottom",
    captionStyle: "box",
    captionSize: 28,
    brandColor: "#8da6ff",
    music: "black-label",
  },
  {
    id: "dynamic-sale",
    name: "다이내믹 세일",
    description: "가격과 핵심 옵션을 빠르게 강조",
    categories: ["new", "sale"],
    cover: 1,
    style: "dynamic",
    captionPosition: "bottom",
    captionStyle: "highlight",
    captionSize: 34,
    brandColor: "#ff355d",
    music: "speed-line",
  },
  {
    id: "retro-film",
    name: "레트로 필름",
    description: "클래식카·올드카용 필름 톤",
    categories: ["retro"],
    cover: 7,
    style: "clean",
    captionPosition: "top",
    captionStyle: "classic",
    captionSize: 30,
    brandColor: "#d7a86e",
    music: "quiet-luxury",
  },
  {
    id: "road-trip",
    name: "로드 트립",
    description: "SUV·캠핑카에 어울리는 여행형",
    categories: ["drive", "featured"],
    cover: 5,
    style: "clean",
    captionPosition: "middle",
    captionStyle: "box",
    captionSize: 30,
    brandColor: "#18a987",
    music: "open-road",
  },
];

const styles: { id: StyleKey; name: string; desc: string; colors: string[] }[] =
  [
    {
      id: "premium",
      name: "프리미엄",
      desc: "고급 수입차에 어울리는 깊고 차분한 구성",
      colors: ["#08111f", "#4f7cff"],
    },
    {
      id: "clean",
      name: "클린",
      desc: "차량과 핵심 정보가 선명한 매물형 구성",
      colors: ["#f4f7fb", "#111827"],
    },
    {
      id: "dynamic",
      name: "다이내믹",
      desc: "빠른 전환과 강한 가격 강조",
      colors: ["#140b08", "#ff632f"],
    },
  ];

const voiceOptions = [
  {
    id: "female-soft",
    name: "차분한 전문가",
    label: "전기차 · 프리미엄 차량",
    gender: "female",
    icon: "아",
    speaker: "vara",
    emotion: 0,
    rate: 0.93,
    pitch: 1.08,
    preview: "차분한 전문가 음성입니다. 차량의 상태와 핵심 정보를 안정적으로 안내해 드립니다.",
  },
  {
    id: "female-bright",
    name: "밝은 쇼호스트",
    label: "경차 · SUV · 패밀리카",
    gender: "female",
    icon: "유",
    speaker: "vyuna",
    emotion: 2,
    rate: 1.06,
    pitch: 1.16,
    preview: "밝은 쇼호스트 음성입니다. 실용성과 매력을 기분 좋게 소개해 드립니다.",
  },
  {
    id: "female-ad",
    name: "또렷한 안내",
    label: "전체 매물 · 정보 전달",
    gender: "female",
    icon: "미",
    speaker: "vmikyung",
    emotion: 2,
    rate: 1.12,
    pitch: 1.04,
    preview: "또렷한 안내 음성입니다. 차량명과 가격, 주요 옵션을 정확하게 전달합니다.",
  },
  {
    id: "male-trust",
    name: "신뢰감 있는 딜러",
    label: "일반 중고차",
    gender: "male",
    icon: "대",
    speaker: "vdaeseong",
    emotion: 0,
    rate: 0.91,
    pitch: 0.72,
    preview: "신뢰감 있는 딜러 음성입니다. 과장 없이 차량의 장점을 꼼꼼하게 설명해 드립니다.",
  },
  {
    id: "male-energy",
    name: "밝고 역동적인 딜러",
    label: "수입차 · SUV · 스포츠카",
    gender: "male",
    icon: "박",
    speaker: "nreview",
    emotion: 0,
    rate: 1.05,
    pitch: 0.82,
    preview: "밝고 역동적인 딜러 음성입니다. 주행 성능과 매력적인 옵션을 힘 있게 소개합니다.",
  },
  {
    id: "male-deep",
    name: "중후한 전문가",
    label: "대형 세단 · 고급차",
    gender: "male",
    icon: "이",
    speaker: "vian",
    emotion: 0,
    rate: 0.84,
    pitch: 0.58,
    preview: "중후한 전문가 음성입니다. 고급 차량의 품격과 상품성을 차분하게 전달합니다.",
  },
];

const KOREAN_DIGITS = ["영", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];

function koreanNumber(value: number) {
  if (!Number.isFinite(value) || value === 0) return "영";
  const smallUnits = ["", "십", "백", "천"];
  const largeUnits = ["", "만", "억"];
  const groups: string[] = [];
  let remaining = Math.floor(Math.abs(value));
  for (let groupIndex = 0; remaining > 0 && groupIndex < largeUnits.length; groupIndex += 1) {
    const group = remaining % 10000;
    remaining = Math.floor(remaining / 10000);
    if (!group) continue;
    let spoken = "";
    for (let unitIndex = 0; unitIndex < 4; unitIndex += 1) {
      const digit = Math.floor(group / (10 ** unitIndex)) % 10;
      if (!digit) continue;
      spoken = `${digit === 1 && unitIndex > 0 ? "" : KOREAN_DIGITS[digit]}${smallUnits[unitIndex]}${spoken}`;
    }
    groups.unshift(`${spoken}${largeUnits[groupIndex]}`);
  }
  return groups.join(" ");
}

function prepareAutomotivePronunciation(value: string) {
  const letterNames: Record<string, string> = {
    a: "에이", b: "비", c: "씨", d: "디", e: "이", f: "에프", g: "지", h: "에이치",
    i: "아이", j: "제이", k: "케이", l: "엘", m: "엠", n: "엔", o: "오", p: "피",
    q: "큐", r: "알", s: "에스", t: "티", u: "유", v: "브이", w: "더블유", x: "엑스",
    y: "와이", z: "지",
  };
  return value
    .replace(/\bMercedes[- ]?Benz\b/gi, "메르세데스 벤츠")
    .replace(/\bBMW\b/gi, "비엠더블유")
    .replace(/\bAMG\s*GT\b/gi, "에이엠지 지티")
    .replace(/\bGV80\b/gi, "지브이 에이티")
    .replace(/\bModel\s*Y\b/gi, "모델 와이")
    .replace(/\b4WD\b/gi, "사륜구동")
    .replace(/\bAWD\b/gi, "에이더블유디")
    .replace(/\bPHEV\b/gi, "플러그인 하이브리드")
    .replace(/제조사\s*AS/gi, "제조사 에이에스")
    .replace(/1인\s*소유/g, "일 인 소유")
    .replace(/(\d[\d,]*)\s*km\b/gi, (_, amount: string) => `${koreanNumber(Number(amount.replace(/,/g, "")))} 킬로미터`)
    .replace(/(\d[\d,]*)\s*만원/g, (_, amount: string) => `${koreanNumber(Number(amount.replace(/,/g, "")))}만 원`)
    .replace(/\b(\d{2,4})([a-z])\b/gi, (_, digits: string, letter: string) => (
      `${digits.split("").map((digit) => KOREAN_DIGITS[Number(digit)]).join("")} ${letterNames[letter.toLowerCase()] || letter}`
    ));
}

const musicOptions = [
  {
    id: "neon-drive",
    name: "네온 드라이브",
    genre: "트렌드",
    category: "trend",
    mood: "감각적인 신차",
    bpm: 118,
    icon: "⚡",
    color: "#695cff",
    notes: [220, 277, 330, 415],
  },
  {
    id: "urban-motion",
    name: "어반 모션",
    genre: "드라이브",
    category: "drive",
    mood: "도심 주행",
    bpm: 108,
    icon: "◈",
    color: "#248cf2",
    notes: [196, 247, 294, 370],
  },
  {
    id: "black-label",
    name: "블랙 라벨",
    genre: "프리미엄",
    category: "luxury",
    mood: "수입차·슈퍼카",
    bpm: 82,
    icon: "◆",
    color: "#222937",
    notes: [147, 185, 220, 277],
  },
  {
    id: "fresh-start",
    name: "프레시 스타트",
    genre: "밝은",
    category: "bright",
    mood: "패밀리카",
    bpm: 124,
    icon: "☀",
    color: "#ff9d38",
    notes: [262, 330, 392, 494],
  },
  {
    id: "speed-line",
    name: "스피드 라인",
    genre: "트렌드",
    category: "trend",
    mood: "빠른 매물 소개",
    bpm: 132,
    icon: "≫",
    color: "#ff526b",
    notes: [233, 294, 349, 466],
  },
  {
    id: "open-road",
    name: "오픈 로드",
    genre: "드라이브",
    category: "drive",
    mood: "SUV·캠핑카",
    bpm: 96,
    icon: "♬",
    color: "#15a886",
    notes: [175, 220, 262, 349],
  },
  {
    id: "quiet-luxury",
    name: "콰이어트 럭셔리",
    genre: "프리미엄",
    category: "luxury",
    mood: "차분한 고급감",
    bpm: 74,
    icon: "✦",
    color: "#8a6eaa",
    notes: [131, 165, 196, 247],
  },
  {
    id: "happy-deal",
    name: "해피 딜",
    genre: "밝은",
    category: "bright",
    mood: "할인·프로모션",
    bpm: 116,
    icon: "♪",
    color: "#f25f8b",
    notes: [294, 370, 440, 587],
  },
] as const;

function formatPrice(value: string) {
  const amount = Number(value.replace(/[^0-9]/g, ""));
  return amount ? `${amount.toLocaleString("ko-KR")}만원` : "가격 상담";
}

function splitSubtitleText(text: string, maxChars = 22) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];
  const sentences = normalized.match(/[^.!?。！？]+[.!?。！？]?/g) || [normalized];
  return sentences.flatMap((sentence) => {
    const clean = sentence.trim();
    if (clean.length <= maxChars) return [clean];
    const words = clean.split(" ");
    const chunks: string[] = [];
    let current = "";
    words.forEach((word) => {
      if (!current && word.length > maxChars) {
        for (let index = 0; index < word.length; index += maxChars)
          chunks.push(word.slice(index, index + maxChars));
        return;
      }
      const next = current ? `${current} ${word}` : word;
      if (next.length > maxChars && current) {
        chunks.push(current);
        current = word;
      } else current = next;
    });
    if (current) chunks.push(current);
    return chunks;
  });
}

function buildSubtitleCues(text: string, durationMs: number) {
  const chunks = splitSubtitleText(text);
  const safeDuration = Math.max(1000, durationMs);
  const totalWeight = chunks.reduce(
    (sum, chunk) => sum + Math.max(5, chunk.replace(/\s/g, "").length),
    0,
  );
  let cursor = 0;
  return chunks.map((chunk, index): SubtitleCue => {
    const startMs = cursor;
    const weight = Math.max(5, chunk.replace(/\s/g, "").length);
    cursor = index === chunks.length - 1
      ? safeDuration
      : cursor + (safeDuration * weight) / Math.max(1, totalWeight);
    return { text: chunk, startMs, endMs: cursor };
  });
}

function subtitleAt(cues: SubtitleCue[], elapsedMs: number) {
  return cues.find((cue) => elapsedMs >= cue.startMs && elapsedMs < cue.endMs)?.text || "";
}

async function mediaDurationMs(url: string, fallbackMs: number) {
  if (!url) return fallbackMs;
  return new Promise<number>((resolve) => {
    const audio = new Audio();
    const finish = (value: number) => {
      audio.removeAttribute("src");
      resolve(value);
    };
    audio.preload = "metadata";
    audio.onloadedmetadata = () =>
      finish(Number.isFinite(audio.duration) ? audio.duration * 1000 : fallbackMs);
    audio.onerror = () => finish(fallbackMs);
    audio.src = url;
  });
}

export default function Home() {
  const [photos, setPhotos] = useState<PhotoItem[]>(SAMPLE_PHOTOS);
  const [mediaInputMode, setMediaInputMode] = useState<MediaInputMode>("photo");
  const [sourceVideoFile, setSourceVideoFile] = useState<File | null>(null);
  const [sourceVideoUrl, setSourceVideoUrl] = useState("");
  const [sourceVideoName, setSourceVideoName] = useState("");
  const [sourceVideoDuration, setSourceVideoDuration] = useState(0);
  const [style, setStyle] = useState<StyleKey>("premium");
  const [voice, setVoice] = useState("male-trust");
  const [previewingVoice, setPreviewingVoice] = useState("");
  const [voiceTab, setVoiceTab] = useState<"all" | "female" | "male">("all");
  const [voiceSpeed, setVoiceSpeed] = useState(1);
  const [narrationVolume, setNarrationVolume] = useState(85);
  const [ducking, setDucking] = useState(true);
  const [videoDuration, setVideoDuration] = useState<VideoDuration>(15);
  const [descriptionMode, setDescriptionMode] = useState<"auto" | "manual">("auto");
  const [customScript, setCustomScript] = useState(SAMPLE_SCRIPT);
  const [vehicleInputMode, setVehicleInputMode] = useState<VehicleInputMode>("inventory");
  const [selectedInventory, setSelectedInventory] = useState<string[]>([SAMPLE_INVENTORY[0].id]);
  const [batchQueueOpen, setBatchQueueOpen] = useState(false);
  const [ctaType, setCtaType] = useState<CtaType>("listing");
  const [listingQuery, setListingQuery] = useState("");
  const [listingProvider, setListingProvider] = useState<ListingProvider>("auto");
  const [loadingListing, setLoadingListing] = useState(false);
  const [importedListing, setImportedListing] = useState<ImportedListing | null>(null);
  const [plateQuery, setPlateQuery] = useState("63어0894");
  const [loadingPlate, setLoadingPlate] = useState(false);
  const [plateImported, setPlateImported] = useState(false);
  const [musicName, setMusicName] = useState("");
  const [musicUrl, setMusicUrl] = useState("");
  const [selectedMusic, setSelectedMusic] = useState("black-label");
  const [musicCategory, setMusicCategory] = useState<MusicCategory>("all");
  const [musicSearch, setMusicSearch] = useState("");
  const [musicVolume, setMusicVolume] = useState(35);
  const [playingMusic, setPlayingMusic] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [narrationFile, setNarrationFile] = useState<File | null>(null);
  const [narrationName, setNarrationName] = useState("기본 한국어 내레이션");
  const [narrationUrl, setNarrationUrl] = useState(BUILT_IN_SAMPLE_AUDIO);
  const [narrationKind, setNarrationKind] = useState<"" | "sample" | "generated" | "upload">("sample");
  const [ttsGenerating, setTtsGenerating] = useState(false);
  const [ttsProgress, setTtsProgress] = useState(0);
  const [brandColor, setBrandColor] = useState("#5b7cff");
  const [plateBlur, setPlateBlur] = useState(true);
  const [captionEnabled, setCaptionEnabled] = useState(true);
  const [captionPosition, setCaptionPosition] = useState<CaptionPosition>("bottom");
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>("box");
  const [captionSize, setCaptionSize] = useState(30);
  const [captions, setCaptions] = useState<string[]>(SAMPLE_CAPTIONS);
  const [captionSync, setCaptionSync] = useState(true);
  const [previewElapsedMs, setPreviewElapsedMs] = useState(0);
  const [subtitleDurationMs, setSubtitleDurationMs] = useState(20_000);
  const [templateCategory, setTemplateCategory] = useState<TemplateCategory>("featured");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey>("luxury-cut");
  const [activePhoto, setActivePhoto] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [progress, setProgress] = useState(0);
  const [renderedVideo, setRenderedVideo] = useState<RenderedVideo | null>(null);
  const [toast, setToast] = useState("");
  const [scriptVersion, setScriptVersion] = useState(0);
  const [generatingScript, setGeneratingScript] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [savingProject, setSavingProject] = useState(false);
  const [restoringProject, setRestoringProject] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [projectError, setProjectError] = useState("");
  const [featureSheetOpen, setFeatureSheetOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const previewSourceVideo = useRef<HTMLVideoElement>(null);
  const audioInput = useRef<HTMLInputElement>(null);
  const narrationInput = useRef<HTMLInputElement>(null);
  const logoInput = useRef<HTMLInputElement>(null);
  const musicContext = useRef<AudioContext | null>(null);
  const voicePreviewAudio = useRef<HTMLAudioElement | null>(null);
  const voicePreviewToken = useRef(0);
  const voicePreviewUtterance = useRef<SpeechSynthesisUtterance | null>(null);
  const narrationControlAudio = useRef<HTMLAudioElement | null>(null);
  const musicGain = useRef<GainNode | null>(null);
  const musicAudio = useRef<HTMLAudioElement | null>(null);
  const musicStopTimer = useRef<number | null>(null);
  const previewStopTimer = useRef<number | null>(null);
  const previewStartTime = useRef(0);
  const previewNarration = useRef<HTMLAudioElement | null>(null);
  const [form, setForm] = useState<Record<string, string>>(DEFAULT_FORM);

  const selectedVehicleFeatures = useMemo(
    () =>
      form.feature
        .split(/\s*[·,]\s*/)
        .map((item) => item.trim())
        .filter(Boolean),
    [form.feature],
  );

  const title =
    [form.make, form.model, form.trim].filter(Boolean).join(" ") ||
    "차량명을 입력하세요";
  const currentTemplate =
    videoTemplates.find((item) => item.id === selectedTemplate) || videoTemplates[0];
  const generatedScript = useMemo(
    () => timedVehicleScript(form, videoDuration, scriptVersion),
    [form, videoDuration, scriptVersion],
  );
  const script = descriptionMode === "manual" ? customScript : generatedScript;
  const estimatedTtsSeconds = Math.max(
    3,
    Math.ceil(script.replace(/\s/g, "").length / (5.2 * voiceSpeed)),
  );
  const effectiveSubtitleDurationMs = narrationUrl
    ? subtitleDurationMs
    : Math.min(videoDuration, estimatedTtsSeconds) * 1000;
  const subtitleCues = useMemo(
    () => buildSubtitleCues(script, effectiveSubtitleDurationMs),
    [script, effectiveSubtitleDurationMs],
  );
  const syncedCaption = captionSync
    ? subtitleAt(subtitleCues, previewElapsedMs)
    : captions[activePhoto] || "";
  const effectiveVideoDuration = mediaInputMode === "video" && sourceVideoDuration
    ? Math.min(videoDuration, sourceVideoDuration)
    : videoDuration;
  const sceneDuration = mediaInputMode === "video"
    ? effectiveVideoDuration / 6
    : photos.length
      ? videoDuration / photos.length
      : videoDuration;
  const recommendedPhotos = videoDuration <= 15
    ? "5~6장"
    : videoDuration <= 30
      ? "8~12장"
      : videoDuration <= 45
        ? "10~14장"
        : videoDuration <= 60
          ? "12~16장"
          : "16~20장";
  const ctaLabel = ctaType === "call"
    ? "전화하기"
    : ctaType === "inquiry"
      ? "문의하기"
      : "매물 보러가기";
  const ttsBars = useMemo(
    () =>
      Array.from(
        { length: Math.min(42, Math.max(14, Math.ceil(script.length / 4))) },
        (_, index) =>
          25 +
          ((script.charCodeAt(index % Math.max(script.length, 1)) ||
            index * 7) %
            65),
      ),
    [script],
  );
  const filteredMusic = useMemo(
    () =>
      musicOptions.filter(
        (item) =>
          (musicCategory === "all" || item.category === musicCategory) &&
          `${item.name} ${item.genre} ${item.mood}`.includes(
            musicSearch.trim(),
          ),
      ),
    [musicCategory, musicSearch],
  );
  const filteredTemplates = useMemo(
    () => videoTemplates.filter((item) => item.categories.includes(templateCategory)),
    [templateCategory],
  );
  const validationMessages = useMemo(() => {
    const messages: string[] = [];
    const year = Number(form.year);
    const mileage = Number(form.mileage);
    const price = Number(form.price);
    if (
      !Number.isFinite(year) ||
      year < 1950 ||
      year > new Date().getFullYear() + 1
    )
      messages.push("연식을 확인해 주세요.");
    if (!Number.isFinite(mileage) || mileage < 0 || mileage > 2_000_000)
      messages.push("주행거리가 정상 범위를 벗어났습니다.");
    if (!Number.isFinite(price) || price <= 0 || price > 500_000)
      messages.push("판매 가격을 확인해 주세요.");
    return messages;
  }, [form]);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("project");
    if (!id) return;
    fetch(`/api/projects?id=${encodeURIComponent(id)}`)
      .then(async (response) => {
        if (!response.ok)
          throw new Error(
            response.status === 404
              ? "저장된 프로젝트를 찾을 수 없습니다."
              : "프로젝트를 불러오지 못했습니다.",
          );
        return response.json();
      })
      .then(async ({ id: restoredId, updatedAt, data }) => {
        const restoreAsset = async (asset: SavedAsset) => {
          const response = await fetch(asset.url);
          if (!response.ok)
            throw new Error("저장된 미디어를 불러오지 못했습니다.");
          const blob = await response.blob();
          return new File([blob], asset.name, {
            type: asset.type || blob.type,
          });
        };
        const restoredPhotos = await Promise.all(
          (data.photos || []).map(async (asset: SavedAsset, index: number) => {
            const file = await restoreAsset(asset);
            return {
              id: `saved-${index}-${Date.now()}`,
              file,
              url: URL.createObjectURL(file),
            };
          }),
        );
        setPhotos(restoredPhotos);
        setForm({ ...DEFAULT_FORM, ...(data.form || {}) });
        setStyle(data.style || "premium");
        setVoice(data.voice || "male-trust");
        setVoiceSpeed(data.voiceSpeed || 1);
        setNarrationVolume(data.narrationVolume ?? 85);
        setDucking(data.ducking ?? true);
        setVideoDuration(data.videoDuration || 30);
        setDescriptionMode(data.descriptionMode || "auto");
        setCustomScript(data.customScript || "");
        setSelectedMusic(data.selectedMusic || "");
        setMusicName(data.musicName || "");
        setMusicVolume(data.musicVolume ?? 35);
        setBrandColor(data.brandColor || "#5b7cff");
        setPlateBlur(data.plateBlur ?? true);
        setCaptionEnabled(data.captionEnabled ?? true);
        setCaptionPosition(data.captionPosition || "bottom");
        setCaptionStyle(data.captionStyle || "box");
        setCaptionSize(data.captionSize || 30);
        setCaptions(data.captions || []);
        setCaptionSync(data.captionSync ?? true);
        setSelectedTemplate(data.selectedTemplate || "luxury-cut");
        if (data.logo) {
          const file = await restoreAsset(data.logo);
          setLogoFile(file);
          setLogoUrl(URL.createObjectURL(file));
        }
        if (data.music) {
          const file = await restoreAsset(data.music);
          setMusicFile(file);
          setMusicUrl(URL.createObjectURL(file));
          setSelectedMusic("upload");
        }
        setProjectId(restoredId);
        setSavedAt(updatedAt);
        notify("저장된 프로젝트를 복구했습니다.");
      })
      .catch((error) =>
        setProjectError(
          error instanceof Error
            ? error.message
            : "프로젝트 복구에 실패했습니다.",
        ),
      )
      .finally(() => setRestoringProject(false));
  }, []);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      const narration = previewNarration.current;
      const elapsed = narration && !narration.paused
        ? narration.currentTime * 1000
        : performance.now() - previewStartTime.current;
      const bounded = Math.max(0, Math.min(effectiveVideoDuration * 1000, elapsed));
      setPreviewElapsedMs(bounded);
      if (mediaInputMode === "photo" && photos.length > 1)
        setActivePhoto(
          Math.min(photos.length - 1, Math.floor(bounded / Math.max(700, sceneDuration * 1000))),
        );
    }, 80);
    return () => window.clearInterval(timer);
  }, [playing, photos.length, sceneDuration, effectiveVideoDuration, mediaInputMode]);

  useEffect(() => {
    if (!featureSheetOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFeatureSheetOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [featureSheetOpen]);

  useEffect(() => () => {
    voicePreviewToken.current += 1;
    voicePreviewAudio.current?.pause();
    window.speechSynthesis?.cancel();
    voicePreviewUtterance.current = null;
  }, []);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }

  function applyTemplate(template: VideoTemplate) {
    stopMusicPreview();
    setSelectedTemplate(template.id);
    setStyle(template.style);
    setCaptionEnabled(true);
    setCaptionPosition(template.captionPosition);
    setCaptionStyle(template.captionStyle);
    setCaptionSize(template.captionSize);
    setBrandColor(template.brandColor);
    setSelectedMusic(template.music);
    setMusicName("");
    setMusicUrl("");
    setMusicFile(null);
    setRenderedVideo(null);
    notify(`${template.name} 템플릿을 전체 영상에 적용했습니다.`);
  }

  function updateField(key: string, value: string) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      const identity = `${next.make} ${next.model}`.toLowerCase();
      const electric =
        /테슬라|tesla|model\s*[3sxy]|아이오닉|ioniq|ev[3-9]|타이칸|taycan|e-tron|eq[abcesv]/i.test(
          identity,
        );
      if (electric && (key === "make" || key === "model")) {
        next.fuel = "전기";
        next.transmission = "감속기";
        if (/\b[1-9]\.[0-9]|디젤|가솔린|t?di/i.test(next.trim)) next.trim = "";
      }
      return next;
    });
    if (narrationKind === "generated") {
      if (narrationUrl.startsWith("blob:")) URL.revokeObjectURL(narrationUrl);
      setNarrationFile(null);
      setNarrationName("");
      setNarrationUrl("");
      setNarrationKind("");
    }
    setRenderedVideo(null);
  }

  function toggleVehicleFeature(feature: string) {
    const exists = selectedVehicleFeatures.includes(feature);
    const next = exists
      ? selectedVehicleFeatures.filter((item) => item !== feature)
      : [...selectedVehicleFeatures, feature];
    if (!exists && next.length > 8) {
      notify("핵심 특징은 최대 8개까지 선택할 수 있습니다.");
      return;
    }
    updateField("feature", next.join(" · "));
    setRenderedVideo(null);
  }

  function toggleInventory(item: InventoryItem) {
    setSelectedInventory((current) =>
      current.includes(item.id)
        ? current.filter((id) => id !== item.id)
        : [...current, item.id],
    );
  }

  function editInventory(item: InventoryItem) {
    setForm((current) => ({
      ...current,
      year: item.year,
      make: item.make,
      model: item.model,
      trim: item.trim,
      mileage: item.mileage,
      price: item.price,
    }));
    setSelectedInventory([item.id]);
    setVehicleInputMode("inventory");
    setActivePhoto(0);
    setRenderedVideo(null);
    notify(`${item.stockNo} 매물 정보를 편집기에 불러왔습니다.`);
  }

  function addSelectedToQueue() {
    if (!selectedInventory.length) {
      notify("영상으로 만들 매물을 선택해 주세요.");
      return;
    }
    setBatchQueueOpen(true);
    notify(`${selectedInventory.length}대를 일괄 생성 대기열에 등록했습니다.`);
  }

  async function saveProject() {
    if (savingProject) return;
    setSavingProject(true);
    setProjectError("");
    try {
      const preparedPhotos = await Promise.all(
        photos.map(async (photo, index) => {
          if (photo.file) return photo.file;
          const response = await fetch(photo.url);
          if (!response.ok) throw new Error("샘플 사진을 저장용으로 준비하지 못했습니다.");
          const blob = await response.blob();
          return new File([blob], `bmw-x3-sample-${index + 1}.jpg`, {
            type: blob.type || "image/jpeg",
          });
        }),
      );
      const totalBytes =
        preparedPhotos.reduce((sum, photo) => sum + photo.size, 0) +
        (logoFile?.size || 0) +
        (musicFile?.size || 0);
      if (totalBytes > 90 * 1024 * 1024)
        throw new Error("사진과 음원의 전체 용량이 90MB를 초과했습니다.");
      const body = new FormData();
      body.append(
        "data",
        JSON.stringify({
          projectId,
          form,
          style,
          voice,
          voiceSpeed,
          narrationVolume,
          ducking,
          videoDuration,
          descriptionMode,
          customScript,
          selectedMusic,
          musicName,
          musicVolume,
          brandColor,
          plateBlur,
          captionEnabled,
          captionPosition,
          captionStyle,
          captionSize,
          captions,
          captionSync,
          selectedTemplate,
        }),
      );
      preparedPhotos.forEach((photo) =>
        body.append("photos", photo, photo.name),
      );
      if (logoFile) body.append("logo", logoFile, logoFile.name);
      if (musicFile) body.append("music", musicFile, musicFile.name);
      const response = await fetch("/api/projects", { method: "POST", body });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result.error === "PROJECT_SAVE_FAILED"
            ? "서버 저장 처리에 실패했습니다."
            : "프로젝트를 저장하지 못했습니다.",
        );
      setProjectId(result.id);
      setSavedAt(result.updatedAt);
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}?project=${encodeURIComponent(result.id)}`,
      );
      notify("프로젝트와 사진을 서버에 저장했습니다.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "프로젝트 저장에 실패했습니다.";
      setProjectError(message);
      notify(message);
    } finally {
      setSavingProject(false);
    }
  }

  function loadSampleProject() {
    photos.forEach((photo) => {
      if (photo.url.startsWith("blob:")) URL.revokeObjectURL(photo.url);
    });
    setPhotos(SAMPLE_PHOTOS.map((photo) => ({ ...photo })));
    setForm({ ...DEFAULT_FORM });
    setCustomScript(SAMPLE_SCRIPT);
    setStyle("premium");
    setVoice("male-trust");
    setVideoDuration(30);
    setDescriptionMode("auto");
    setSelectedMusic("black-label");
    setMusicVolume(28);
    setCaptionEnabled(true);
    setCaptionPosition("bottom");
    setCaptionStyle("box");
    setCaptionSize(30);
    setCaptions([...SAMPLE_CAPTIONS]);
    setCaptionSync(true);
    setTemplateCategory("featured");
    setSelectedTemplate("luxury-cut");
    setActivePhoto(0);
    setRenderedVideo(null);
    notify("BMW X3 샘플 사진과 판매 시나리오를 다시 불러왔습니다.");
  }

  function addPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []).filter((file) =>
      file.type.startsWith("image/"),
    );
    if (!files.length) return;
    const remaining = Math.max(0, MAX_PHOTOS - photos.length);
    if (!remaining) {
      event.target.value = "";
      return notify("차량 사진은 최대 20장까지 추가할 수 있어요.");
    }
    const next = files.slice(0, remaining).map((file) => ({
      id: `${file.name}-${file.lastModified}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      url: URL.createObjectURL(file),
    }));
    setPhotos((current) => [...current, ...next].slice(0, MAX_PHOTOS));
    setCaptions((current) => [
      ...current,
      ...next.map((_, index) => `차량 상세 장면 ${current.length + index + 1}`),
    ].slice(0, MAX_PHOTOS));
    notify(
      `${next.length}장의 차량 사진을 추가했어요.${files.length > remaining ? " 최대 20장까지만 반영했습니다." : ""}`,
    );
    event.target.value = "";
  }

  function addSourceVideo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("video/")) return;
    if (sourceVideoUrl) URL.revokeObjectURL(sourceVideoUrl);
    const url = URL.createObjectURL(file);
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.onloadedmetadata = () => {
      const duration = Number.isFinite(probe.duration) ? probe.duration : 0;
      setSourceVideoDuration(duration);
      setVideoDuration((current) => {
        const choices: VideoDuration[] = [15, 30, 45, 60, 90, 120];
        return choices.find((seconds) => seconds >= Math.min(duration, 120)) || current;
      });
      probe.removeAttribute("src");
    };
    probe.src = url;
    setSourceVideoFile(file);
    setSourceVideoUrl(url);
    setSourceVideoName(file.name);
    setMediaInputMode("video");
    setRenderedVideo(null);
    notify("영상이 등록됐습니다. 원하는 길이를 선택하면 앞뒤를 자동으로 컷합니다.");
    event.target.value = "";
  }

  function removePhoto(index: number) {
    setPhotos((current) => {
      URL.revokeObjectURL(current[index].url);
      return current.filter((_, itemIndex) => itemIndex !== index);
    });
    setCaptions((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setActivePhoto(0);
  }

  function movePhoto(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= photos.length) return;
    setPhotos((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setCaptions((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function reorderPhoto(from: number, to: number) {
    if (
      from === to ||
      from < 0 ||
      to < 0 ||
      from >= photos.length ||
      to >= photos.length
    )
      return;
    setPhotos((current) => {
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setCaptions((current) => {
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setActivePhoto(to);
  }

  function updateListingQuery(value: string) {
    setListingQuery(value);
    const detected = detectListingProvider(value);
    if (detected !== "other" || listingProvider === "auto") setListingProvider(detected);
  }

  function handleListingPaste(event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text").trim();
    if (!pasted) return;
    event.preventDefault();
    updateListingQuery(pasted);
    window.setTimeout(() => void importListing(pasted), 0);
  }

  async function importListing(queryOverride?: string) {
    const query = (queryOverride || listingQuery).trim();
    const provider = listingProvider === "auto" || queryOverride
      ? detectListingProvider(query)
      : listingProvider;
    const providerLabel = LISTING_PROVIDERS.find((item) => item.id === provider)?.label || "매물";
    if (!query)
      return notify(`${providerLabel} 매물 URL을 입력해 주세요.`);
    setLoadingListing(true);
    try {
      const response = await fetch("/api/import-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: query, provider }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "LISTING_IMPORT_FAILED");
      const nextPhotos: PhotoItem[] = (data.photos || []).slice(0, MAX_PHOTOS).map((url: string, index: number) => ({
        id: `${data.source || provider}-${data.listingId}-${index}`,
        url,
        sample: true,
      }));
      if (nextPhotos.length) {
        setPhotos(nextPhotos);
        setCaptions(nextPhotos.map((_, index) => index === 0 ? `${data.vehicle.make} ${data.vehicle.model}` : index === 1 ? data.vehicle.trim : data.vehicle.feature.split(" · ")[index % 5] || "차량 디테일"));
      }
      setForm(data.vehicle);
      setImportedListing(data);
      setMediaInputMode("photo");
      setActivePhoto(0);
      setCustomScript("");
      setDescriptionMode("auto");
      if (narrationUrl.startsWith("blob:")) URL.revokeObjectURL(narrationUrl);
      setNarrationFile(null);
      setNarrationName("");
      setNarrationUrl("");
      setNarrationKind("");
      setRenderedVideo(null);
      notify(data.partial
        ? `${providerLabel}에서 확인 가능한 정보를 먼저 입력했어요. 비어 있는 항목만 확인해 주세요.`
        : `${providerLabel} ${data.listingId} · 사진 ${data.importedPhotoCount}장과 차량정보를 불러왔어요.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "LISTING_IMPORT_FAILED";
      notify(message === "UNSUPPORTED_LISTING_URL" ? `${providerLabel} 매물 주소 형식을 확인해 주세요.` : "매물을 불러오지 못했어요. URL과 공개 상태를 확인해 주세요.");
    } finally {
      setLoadingListing(false);
    }
  }

  function importVehicleByPlate() {
    const plate = plateQuery.replace(/\s/g, "").trim();
    if (!plate) return notify("차량번호를 입력해 주세요.");
    if (!/^\d{2,3}[가-힣]\d{4}$/.test(plate))
      return notify("예: 63어0894 형식으로 입력해 주세요.");
    setLoadingPlate(true);
    setPlateImported(false);
    window.setTimeout(() => {
      setForm({ ...DEFAULT_FORM });
      setCustomScript("");
      setDescriptionMode("auto");
      setLoadingPlate(false);
      setPlateImported(true);
      notify(`${plate} 차량 기본정보를 불러왔습니다.`);
    }, 650);
  }

  function handleAudio(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (musicUrl) URL.revokeObjectURL(musicUrl);
    setMusicName(file.name);
    setMusicFile(file);
    setMusicUrl(URL.createObjectURL(file));
    setSelectedMusic("upload");
    notify("배경음악이 적용됐어요.");
  }

  function handleNarration(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (narrationUrl) URL.revokeObjectURL(narrationUrl);
    setNarrationFile(file);
    setNarrationName(file.name);
    setNarrationUrl(URL.createObjectURL(file));
    setNarrationKind("upload");
    notify("내레이션 음성이 최종 영상 트랙에 적용됐어요.");
    event.target.value = "";
  }

  function useBuiltInNarration() {
    if (narrationUrl.startsWith("blob:")) URL.revokeObjectURL(narrationUrl);
    setNarrationFile(null);
    setNarrationName("기본 한국어 샘플 내레이션");
    setNarrationUrl(BUILT_IN_SAMPLE_AUDIO);
    setNarrationKind("sample");
    notify("바로 사용할 수 있는 기본 샘플 음성을 영상에 적용했습니다.");
  }

  async function generateNarration(force = false) {
    if (!force && narrationUrl && narrationFile) {
      return { url: narrationUrl, file: narrationFile, name: narrationName };
    }
    if (ttsGenerating) throw new DOMException("음성을 생성 중입니다.", "TTSError");
    setTtsGenerating(true);
    setTtsProgress(2);
    try {
      setTtsProgress(24);
      const { blob, chosen } = await fetchClovaAudio(script, voice);
      setTtsProgress(92);
      if (!blob.size) throw new Error("EMPTY_TTS");
      if (narrationUrl) URL.revokeObjectURL(narrationUrl);
      const name = `CLOVA_${chosen.name}_내레이션.mp3`;
      const file = new File([blob], name, { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      setNarrationFile(file);
      setNarrationName(name);
      setNarrationUrl(url);
      setNarrationKind("generated");
      setTtsProgress(100);
      notify(`NAVER CLOVA ${chosen.name} 음성을 최종 영상에 적용했습니다.`);
      return { url, file, name };
    } catch (error) {
      const message = error instanceof Error ? error.message : "TTS_GENERATION_FAILED";
      notify(message === "CLOVA_NOT_CONFIGURED"
        ? "CLOVA 인증값을 연결하면 고품질 음성을 바로 생성할 수 있어요."
        : "CLOVA 음성 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      throw new DOMException(
        message,
        "TTSError",
      );
    } finally {
      setTtsGenerating(false);
    }
  }

  async function fetchClovaAudio(text: string, voiceId: string) {
    const chosen = voiceOptions.find((item) => item.id === voiceId) || voiceOptions[0];
    const preparedText = prepareAutomotivePronunciation(text);
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: preparedText,
        speaker: chosen.speaker,
        rate: Math.max(0.65, Math.min(1.45, chosen.rate * voiceSpeed)),
        pitch: chosen.pitch,
        emotion: chosen.emotion,
      }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({})) as { error?: string };
      throw new Error(result.error || "CLOVA_TTS_FAILED");
    }
    const blob = await response.blob();
    if (!blob.size) throw new Error("EMPTY_TTS");
    return { blob, chosen };
  }

  function stopVoicePreview(showNotice = false) {
    voicePreviewToken.current += 1;
    voicePreviewAudio.current?.pause();
    voicePreviewAudio.current = null;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    voicePreviewUtterance.current = null;
    setPreviewingVoice("");
    if (showNotice) notify("음성 미리듣기를 정지했습니다.");
  }

  function selectVoice(voiceId: string) {
    const chosen = voiceOptions.find((item) => item.id === voiceId) || voiceOptions[0];
    stopVoicePreview();
    if (chosen.id === voice) {
      notify(`${chosen.name} 캐릭터가 이미 선택되어 있습니다.`);
      return;
    }
    if (narrationKind === "generated") {
      if (narrationUrl.startsWith("blob:")) URL.revokeObjectURL(narrationUrl);
      setNarrationFile(null);
      setNarrationName("");
      setNarrationUrl("");
      setNarrationKind("");
    }
    setVoice(chosen.id);
    notify(`${chosen.name} 캐릭터를 선택했습니다. 음성 생성 시 이 목소리가 적용됩니다.`);
  }

  function stopMusicPreview() {
    if (musicStopTimer.current) window.clearTimeout(musicStopTimer.current);
    musicAudio.current?.pause();
    musicAudio.current = null;
    void musicContext.current?.close();
    musicContext.current = null;
    setPlayingMusic("");
  }

  function schedulePreset(
    context: AudioContext,
    output: AudioNode,
    preset: (typeof musicOptions)[number],
    duration: number,
    volume: number,
  ) {
    const master = context.createGain();
    master.gain.value = volume;
    master.connect(output);
    musicGain.current = master;
    const beat = 60 / preset.bpm / 2;
    const start = context.currentTime + 0.03;
    for (let index = 0; index * beat < duration; index += 1) {
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      oscillator.type = index % 4 === 0 ? "triangle" : "sine";
      oscillator.frequency.value =
        preset.notes[index % preset.notes.length] * (index % 8 >= 6 ? 2 : 1);
      const at = start + index * beat;
      envelope.gain.setValueAtTime(0.0001, at);
      envelope.gain.exponentialRampToValueAtTime(
        index % 4 === 0 ? 0.22 : 0.11,
        at + 0.025,
      );
      envelope.gain.exponentialRampToValueAtTime(
        0.0001,
        Math.min(at + beat * 0.82, start + duration),
      );
      oscillator.connect(envelope);
      envelope.connect(master);
      oscillator.start(at);
      oscillator.stop(Math.min(at + beat, start + duration));
    }
  }

  async function previewMusic(id: string, duration = 8, force = false) {
    if (!force && playingMusic === id) return stopMusicPreview();
    stopVoicePreview();
    narrationControlAudio.current?.pause();
    stopMusicPreview();
    setSelectedMusic(id);
    setPlayingMusic(id);
    if (id === "upload" && musicUrl) {
      const audio = new Audio(musicUrl);
      audio.volume = musicVolume / 100;
      audio.loop = true;
      musicAudio.current = audio;
      await audio.play();
    } else {
      const preset = musicOptions.find((item) => item.id === id);
      if (!preset) return;
      setMusicName(preset.name);
      const context = new AudioContext();
      musicContext.current = context;
      schedulePreset(
        context,
        context.destination,
        preset,
        duration,
        musicVolume / 100,
      );
    }
    musicStopTimer.current = window.setTimeout(stopMusicPreview, duration * 1000);
  }

  function handleLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (logoUrl) URL.revokeObjectURL(logoUrl);
    setLogoFile(file);
    setLogoUrl(URL.createObjectURL(file));
    notify("딜러 로고가 적용됐어요.");
  }

  async function loadKoreanDeviceVoices() {
    const available = window.speechSynthesis.getVoices();
    if (available.length) return available.filter((item) => item.lang.toLowerCase().startsWith("ko"));
    return new Promise<SpeechSynthesisVoice[]>((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        window.speechSynthesis.removeEventListener("voiceschanged", finish);
        resolve(window.speechSynthesis.getVoices().filter((item) => item.lang.toLowerCase().startsWith("ko")));
      };
      window.speechSynthesis.addEventListener("voiceschanged", finish, { once: true });
      window.setTimeout(finish, 700);
    });
  }

  async function speak(voiceId = voice) {
    const chosen =
      voiceOptions.find((item) => item.id === voiceId) || voiceOptions[0];
    if (!("speechSynthesis" in window)) {
      notify("이 브라우저는 기기 음성 미리듣기를 지원하지 않습니다.");
      return;
    }
    if (previewingVoice === chosen.id) {
      stopVoicePreview(true);
      return;
    }

    stopVoicePreview();
    stopMusicPreview();
    narrationControlAudio.current?.pause();
    previewNarration.current?.pause();
    previewNarration.current = null;
    setVoice(chosen.id);
    setPreviewingVoice(chosen.id);
    const token = voicePreviewToken.current;
    const sample = prepareAutomotivePronunciation(chosen.preview);
    const koreanVoices = await loadKoreanDeviceVoices();
    if (token !== voicePreviewToken.current) return;

    const utterance = new SpeechSynthesisUtterance(sample);
    const roleIndex = voiceOptions.findIndex((item) => item.id === chosen.id);
    utterance.voice = koreanVoices.length ? koreanVoices[roleIndex % koreanVoices.length] : null;
    utterance.lang = "ko-KR";
    utterance.rate = Math.max(0.8, Math.min(1.2, chosen.rate * voiceSpeed));
    utterance.pitch = Math.max(0.65, Math.min(1.35, chosen.pitch));
    utterance.volume = narrationVolume / 100;
    utterance.onstart = () => {
      if (token === voicePreviewToken.current) setPreviewingVoice(chosen.id);
    };
    utterance.onend = () => {
      if (token === voicePreviewToken.current) {
        voicePreviewUtterance.current = null;
        setPreviewingVoice("");
      }
    };
    utterance.onerror = (event) => {
      if (token !== voicePreviewToken.current || event.error === "interrupted" || event.error === "canceled") return;
      voicePreviewUtterance.current = null;
      setPreviewingVoice("");
      notify("기기 음성 미리듣기에 실패했습니다.");
    };
    voicePreviewUtterance.current = utterance;
    window.setTimeout(() => {
      if (token !== voicePreviewToken.current) return;
      window.speechSynthesis.resume();
      window.speechSynthesis.speak(utterance);
      notify(`${chosen.name} 음성을 미리듣습니다.`);
    }, 80);
  }

  async function toggleLivePreview() {
    stopVoicePreview();
    narrationControlAudio.current?.pause();
    if (playing) {
      if (previewStopTimer.current) window.clearTimeout(previewStopTimer.current);
      previewNarration.current?.pause();
      previewNarration.current = null;
      previewSourceVideo.current?.pause();
      if (previewSourceVideo.current) previewSourceVideo.current.currentTime = 0;
      setPlaying(false);
      setPreviewElapsedMs(0);
      voicePreviewAudio.current?.pause();
      stopMusicPreview();
      return notify("통합 미리보기를 정지했습니다.");
    }
    if (mediaInputMode === "photo" && !photos.length)
      return notify("미리보기할 차량 사진을 먼저 추가해 주세요.");
    if (mediaInputMode === "video" && !sourceVideoUrl)
      return notify("미리보기할 차량 영상을 먼저 등록해 주세요.");
    const fallbackDuration = Math.min(effectiveVideoDuration, estimatedTtsSeconds) * 1000;
    const narrationDuration = await mediaDurationMs(narrationUrl, fallbackDuration);
    setSubtitleDurationMs(Math.min(effectiveVideoDuration * 1000, narrationDuration));
    setActivePhoto(0);
    setPreviewElapsedMs(0);
    const bundledSampleAudio = narrationUrl === BUILT_IN_SAMPLE_AUDIO;
    if (selectedMusic && !bundledSampleAudio)
      await previewMusic(selectedMusic, effectiveVideoDuration, true);
    previewStartTime.current = performance.now();
    setPlaying(true);
    if (mediaInputMode === "video" && previewSourceVideo.current) {
      previewSourceVideo.current.currentTime = 0;
      previewSourceVideo.current.muted = true;
      await previewSourceVideo.current.play();
    }
    if (narrationUrl) {
      const narration = new Audio(narrationUrl);
      narration.volume = narrationVolume / 100;
      previewNarration.current = narration;
      await narration.play();
    } else speak();
    previewStopTimer.current = window.setTimeout(() => {
      previewNarration.current?.pause();
      previewNarration.current = null;
      previewSourceVideo.current?.pause();
      if (previewSourceVideo.current) previewSourceVideo.current.currentTime = 0;
      setPlaying(false);
      setPreviewElapsedMs(0);
      voicePreviewAudio.current?.pause();
      stopMusicPreview();
      notify("통합 미리보기가 끝났습니다.");
    }, effectiveVideoDuration * 1000);
    const mediaLabel = mediaInputMode === "video" ? "영상" : "사진";
    notify(selectedMusic || bundledSampleAudio ? `${mediaLabel}·음성·음악 통합 미리보기를 시작합니다.` : `${mediaLabel}·음성 미리보기를 시작합니다. 배경음악은 선택되지 않았습니다.`);
  }

  function regenerateScript() {
    if (generatingScript) return;
    if (narrationKind === "generated") {
      if (narrationUrl.startsWith("blob:")) URL.revokeObjectURL(narrationUrl);
      setNarrationFile(null);
      setNarrationName("");
      setNarrationUrl("");
      setNarrationKind("");
    }
    setGeneratingScript(true);
    window.setTimeout(() => {
      setScriptVersion((current) => current + 1);
      setDescriptionMode("auto");
      setGeneratingScript(false);
      notify("차량 정보에 맞는 새로운 판매 문구를 만들었어요.");
    }, 550);
  }

  function changeVideoDuration(seconds: VideoDuration) {
    setVideoDuration(seconds);
    setDescriptionMode("auto");
    setPreviewElapsedMs(0);
    setRenderedVideo(null);
    if (narrationKind === "generated" && (narrationUrl !== BUILT_IN_SAMPLE_AUDIO || seconds !== 15)) {
      if (narrationUrl.startsWith("blob:")) URL.revokeObjectURL(narrationUrl);
      setNarrationFile(null);
      setNarrationName("");
      setNarrationUrl("");
      setNarrationKind("");
    }
  }

  async function loadImage(src: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }

  async function exportVideo() {
    if (mediaInputMode === "photo" && photos.length < 3)
      return notify("먼저 차량 사진을 3장 이상 올려 주세요.");
    if (mediaInputMode === "video" && !sourceVideoUrl)
      return notify("먼저 차량 영상을 등록해 주세요.");
    if (!("MediaRecorder" in window))
      return notify("현재 브라우저는 영상 내보내기를 지원하지 않아요.");
    setExporting(true);
    setProgress(1);
    if (renderedVideo) {
      URL.revokeObjectURL(renderedVideo.url);
      setRenderedVideo(null);
    }

    try {
      let effectiveNarrationUrl = narrationUrl;
      if (!effectiveNarrationUrl) {
        effectiveNarrationUrl = "";
        notify("음성이 없어 무음 영상으로 생성합니다. 기본 샘플 또는 직접 음원을 추가할 수 있어요.");
      }
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(1.5, 1.5);
      const stream = canvas.captureStream(30);
      const renderAudio: HTMLAudioElement[] = [];
      let audioContext: AudioContext | null = null;
      let renderDestination: MediaStreamAudioDestinationNode | null = null;
      let renderMusicGain: GainNode | null = null;

      const images = mediaInputMode === "photo"
        ? await Promise.all(photos.map((photo) => loadImage(photo.url)))
        : [];
      let renderSourceVideo: HTMLVideoElement | null = null;
      if (mediaInputMode === "video") {
        renderSourceVideo = document.createElement("video");
        renderSourceVideo.src = sourceVideoUrl;
        renderSourceVideo.preload = "auto";
        renderSourceVideo.muted = true;
        renderSourceVideo.playsInline = true;
        await new Promise<void>((resolve, reject) => {
          renderSourceVideo!.onloadeddata = () => resolve();
          renderSourceVideo!.onerror = () => reject(new DOMException("등록 영상을 읽을 수 없습니다.", "NotSupportedError"));
        });
        renderSourceVideo.currentTime = 0;
      }
      const total = mediaInputMode === "video"
        ? Math.max(1000, Math.min(videoDuration, renderSourceVideo?.duration || sourceVideoDuration || videoDuration) * 1000)
        : videoDuration * 1000;
      const durationPerPhoto = mediaInputMode === "video" ? total / 6 : total / images.length;
      const narrationDurationMs = Math.min(
        total,
        await mediaDurationMs(
          effectiveNarrationUrl,
          Math.min(videoDuration, estimatedTtsSeconds) * 1000,
        ),
      );
      const renderSubtitleCues = buildSubtitleCues(script, narrationDurationMs);

      const bundledSampleAudio = effectiveNarrationUrl === BUILT_IN_SAMPLE_AUDIO;
      if (selectedMusic || effectiveNarrationUrl) {
        audioContext = new AudioContext();
        await audioContext.resume();
        renderDestination = audioContext.createMediaStreamDestination();
        renderDestination.stream
          .getAudioTracks()
          .forEach((track) => stream.addTrack(track));

        if (!bundledSampleAudio && selectedMusic === "upload" && musicUrl) {
          const music = new Audio(musicUrl);
          music.loop = true;
          const source = audioContext.createMediaElementSource(music);
          renderMusicGain = audioContext.createGain();
          renderMusicGain.gain.value = musicVolume / 100;
          source.connect(renderMusicGain);
          renderMusicGain.connect(renderDestination);
          renderAudio.push(music);
        } else if (!bundledSampleAudio && selectedMusic) {
          const preset = musicOptions.find((item) => item.id === selectedMusic);
          if (preset) {
            renderMusicGain = audioContext.createGain();
            renderMusicGain.gain.value = musicVolume / 100;
            renderMusicGain.connect(renderDestination);
          schedulePreset(
            audioContext,
              renderMusicGain,
            preset,
            total / 1000,
              1,
          );
          }
        }

        if (effectiveNarrationUrl) {
          const narration = new Audio(effectiveNarrationUrl);
          narration.loop = false;
          const source = audioContext.createMediaElementSource(narration);
          const gain = audioContext.createGain();
          gain.gain.value = narrationVolume / 100;
          source.connect(gain);
          gain.connect(renderDestination);
          renderAudio.push(narration);

          if (ducking && renderMusicGain) {
            const normal = musicVolume / 100;
            renderMusicGain.gain.setValueAtTime(normal * 0.22, audioContext.currentTime);
            const restoreAt = audioContext.currentTime + narrationDurationMs / 1000;
            renderMusicGain.gain.linearRampToValueAtTime(normal, restoreAt + 0.25);
          }
        }
      }

      const mp4Types = [
        "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
        "video/mp4;codecs=h264,aac",
        "video/mp4",
      ];
      const supportedMp4 = mp4Types.find((type) =>
        MediaRecorder.isTypeSupported(type),
      );
      const mimeType = supportedMp4 ||
        (MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
          ? "video/webm;codecs=vp8,opus"
          : MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
            ? "video/webm;codecs=vp9,opus"
            : "video/webm");
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 4_500_000,
        audioBitsPerSecond: 160_000,
      });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) =>
        event.data.size && chunks.push(event.data);
      const done = new Promise<Blob>((resolve, reject) => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
        recorder.onerror = () => reject(new DOMException("브라우저 영상 인코더 오류", "EncodingError"));
      });
      recorder.start(500);
      if (renderSourceVideo) await renderSourceVideo.play();
      await Promise.all(renderAudio.map((item) => item.play()));

      const start = performance.now();

      await new Promise<void>((resolve) => {
        function draw(now: number) {
          const elapsed = Math.max(0, Math.min(total, now - start));
          const segmentCount = mediaInputMode === "video" ? 6 : images.length;
          const index = Math.min(segmentCount - 1, Math.floor(elapsed / durationPerPhoto));
          const local = (elapsed % durationPerPhoto) / durationPerPhoto;
          const frame = renderSourceVideo || images[index] || images[0];
          const frameWidth = renderSourceVideo?.videoWidth || (frame as HTMLImageElement).width;
          const frameHeight = renderSourceVideo?.videoHeight || (frame as HTMLImageElement).height;
          const accent =
            style === "dynamic"
              ? "#ff632f"
              : style === "clean"
                ? "#111827"
                : brandColor;
          ctx.fillStyle = "#05070d";
          ctx.fillRect(0, 0, 720, 1280);
          ctx.filter = "blur(34px) brightness(0.45)";
          const cover = Math.max(720 / frameWidth, 1280 / frameHeight) * 1.15;
          ctx.drawImage(
            frame,
            (720 - frameWidth * cover) / 2,
            (1280 - frameHeight * cover) / 2,
            frameWidth * cover,
            frameHeight * cover,
          );
          ctx.filter = "none";
          const scale =
            Math.min(660 / frameWidth, 870 / frameHeight) *
            (mediaInputMode === "video" ? 1 : 1 + local * 0.045);
          const w = frameWidth * scale;
          const h = frameHeight * scale;
          const panX = mediaInputMode === "video" ? 0 : (index % 2 === 0 ? 1 : -1) * (local - 0.5) * 34;
          const panY = mediaInputMode === "video" ? 0 : (index % 3 === 0 ? 1 : -1) * (local - 0.5) * 20;
          ctx.drawImage(
            frame,
            (720 - w) / 2 + panX,
            110 + (870 - h) / 2 + panY,
            w,
            h,
          );
          if (selectedTemplate === "retro-film") {
            ctx.fillStyle = "rgba(156,102,45,.18)";
            ctx.fillRect(30, 110, 660, 870);
          }
          if (selectedTemplate === "road-trip") {
            ctx.strokeStyle = brandColor;
            ctx.lineWidth = 6;
            ctx.strokeRect(30, 110, 660, 870);
          }
          const gradient = ctx.createLinearGradient(0, 720, 0, 1280);
          gradient.addColorStop(0, "rgba(4,7,14,0)");
          gradient.addColorStop(0.42, "rgba(4,7,14,.78)");
          gradient.addColorStop(1, "#04070e");
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 650, 720, 630);
          const caption = captionEnabled
            ? (captionSync
                ? subtitleAt(renderSubtitleCues, elapsed)
                : captions[index] || "").trim()
            : "";
          const captionMentionsVehicle = [form.make, form.model, form.trim]
            .filter((item) => item && item.length > 1)
            .some((item) => caption.toLowerCase().includes(item.toLowerCase()));
          ctx.fillStyle = "white";
          if (!captionMentionsVehicle) {
            ctx.font = "800 48px Pretendard, Arial";
            ctx.fillText(title, 52, 1080);
          }
          ctx.font = "900 58px Pretendard, Arial";
          ctx.fillText(formatPrice(form.price), 52, captionMentionsVehicle ? 1110 : 1150);
          ctx.fillStyle = accent;
          ctx.fillRect(52, 1195, 616 * ((index + local) / segmentCount), 8);
          if (caption) {
            const maxChars = Math.max(12, Math.floor(560 / (captionSize * 0.58)));
            const captionLines = Array.from(
              { length: Math.ceil(caption.length / maxChars) },
              (_, lineIndex) => caption.slice(lineIndex * maxChars, (lineIndex + 1) * maxChars),
            ).slice(0, 3);
            const lineHeight = captionSize * 1.38;
            const anchorY = captionPosition === "top" ? 235 : captionPosition === "middle" ? 610 : 865;
            ctx.font = `800 ${captionSize}px Pretendard, Arial`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            captionLines.forEach((captionLine, lineIndex) => {
              const y = anchorY + (lineIndex - (captionLines.length - 1) / 2) * lineHeight;
              const metrics = ctx.measureText(captionLine);
              if (captionStyle !== "classic") {
                ctx.fillStyle = captionStyle === "highlight" ? brandColor : "rgba(0,0,0,.78)";
                ctx.fillRect(360 - metrics.width / 2 - 15, y - lineHeight / 2, metrics.width + 30, lineHeight);
              }
              ctx.shadowColor = "rgba(0,0,0,.9)";
              ctx.shadowBlur = captionStyle === "classic" ? 8 : 2;
              ctx.fillStyle = "#fff";
              ctx.fillText(captionLine, 360, y);
            });
            ctx.shadowBlur = 0;
            ctx.textAlign = "start";
            ctx.textBaseline = "alphabetic";
          }
          if (elapsed >= Math.max(0, total - 2500)) {
            ctx.fillStyle = "rgba(7,15,28,.9)";
            ctx.fillRect(176, 1000, 368, 106);
            ctx.textAlign = "center";
            ctx.fillStyle = "#fff";
            ctx.font = "900 30px Pretendard, Arial";
            ctx.fillText(ctaLabel, 360, 1044);
            ctx.fillStyle = "#b7c7e7";
            ctx.font = "700 20px Pretendard, Arial";
            ctx.fillText(form.phone || form.seller, 360, 1078);
            ctx.textAlign = "start";
          }
          setProgress(Math.round((elapsed / total) * 100));
          if (elapsed < total) requestAnimationFrame(draw);
          else resolve();
        }
        requestAnimationFrame(draw);
      });

      recorder.stop();
      const blob = await done;
      renderSourceVideo?.pause();
      renderAudio.forEach((item) => item.pause());
      await audioContext?.close();
      if (!blob.size) throw new DOMException("생성된 영상 데이터가 없습니다.", "EncodingError");
      const url = URL.createObjectURL(blob);
      const format = mimeType.startsWith("video/mp4") ? "MP4" : "WebM";
      const extension = format === "MP4" ? "mp4" : "webm";
      const name = `보배드림_숏폼_${form.make || "car"}_${form.model || "shorts"}.${extension}`;
      let downloadUrl = url;
      const localResult: RenderedVideo = {
        url,
        downloadUrl: url,
        name,
        size: blob.size,
        hasMusic: Boolean(selectedMusic || bundledSampleAudio),
        hasNarration: Boolean(effectiveNarrationUrl),
        format,
      };
      setRenderedVideo(localResult);
      setUploadingVideo(true);
      setProgress(99);
      try {
        const uploadController = new AbortController();
        const uploadTimeout = window.setTimeout(() => uploadController.abort(), 20_000);
        const formData = new FormData();
        formData.append("video", new File([blob], name, { type: mimeType }));
        const response = await fetch("/api/assets", {
          method: "POST",
          body: formData,
          signal: uploadController.signal,
        });
        window.clearTimeout(uploadTimeout);
        const result = (await response.json()) as { url?: string; error?: string };
        if (!response.ok || !result.url) throw new Error(result.error || "VIDEO_UPLOAD_FAILED");
        downloadUrl = result.url;
        setRenderedVideo((current) => current ? { ...current, downloadUrl } : current);
      } catch {
        notify("영상 생성은 완료됐습니다. 기기 저장 버튼으로 바로 내려받을 수 있어요.");
      } finally {
        setUploadingVideo(false);
      }
      notify("영상 생성이 완료됐습니다. 아래 다운로드 버튼을 눌러 저장하세요.");
    } catch (error) {
      const name = error instanceof Error ? error.name : "";
      const message =
        name === "TTSError"
          ? "한국어 음성을 생성하지 못해 영상 생성을 중단했습니다. 다시 시도해 주세요."
          : name === "NotAllowedError"
          ? "오디오 재생 권한이 없어 영상 생성을 중단했습니다."
          : name === "NotSupportedError"
            ? "이 브라우저는 WebM 영상 생성을 지원하지 않습니다."
            : name === "EncodingError"
              ? "영상 인코딩에 실패했습니다. 사진 용량을 줄여 다시 시도해 주세요."
              : "영상 렌더링에 실패했습니다. 오류 코드: BBR-RENDER-01";
      notify(message);
    } finally {
      setExporting(false);
      setProgress(0);
    }
  }

  async function saveOrShareVideo() {
    if (!renderedVideo) return;
    try {
      const response = await fetch(renderedVideo.url);
      const blob = await response.blob();
      const file = new File([blob], renderedVideo.name, { type: blob.type });
      const shareData = { files: [file], title: "보배드림 숏폼 영상" };
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        return;
      }
      const anchor = document.createElement("a");
      anchor.href = renderedVideo.downloadUrl;
      anchor.download = renderedVideo.name;
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      notify("다운로드를 시작했습니다.");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      window.location.assign(renderedVideo.downloadUrl);
    }
  }

  async function downloadRenderedVideo() {
    if (!renderedVideo) return;
    const href = renderedVideo.downloadUrl || renderedVideo.url;
    try {
      if (href.startsWith("blob:") && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
        const blob = await (await fetch(renderedVideo.url)).blob();
        const file = new File([blob], renderedVideo.name, { type: blob.type });
        const shareData = { files: [file], title: "보배드림 숏폼 영상" };
        if (navigator.share && navigator.canShare?.(shareData)) {
          await navigator.share(shareData);
          return;
        }
      }
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.download = renderedVideo.name;
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      notify("영상 다운로드를 시작했습니다.");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      window.location.assign(href);
    }
  }

  const currentPhoto = photos[activePhoto]?.url;

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="보배드림 숏폼 제작 홈">
          <span className="brand-mark">B</span>
          <span>보배드림</span>
          <em>숏폼 제작</em>
        </a>
        <div className="project-name">
          <span>프로젝트</span>
          <b>{title}</b>
        </div>
        <div className="top-actions">
          <span className={`save-state ${projectError ? "error" : ""}`}>
            <i />
            {restoringProject
              ? "복구 중"
              : savedAt
                ? `${new Date(savedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })} 서버 저장`
                : "저장 필요"}
          </span>
          <button
            className="ghost-button"
            onClick={saveProject}
            disabled={savingProject}
          >
            {savingProject ? "저장 중" : "저장"}
          </button>
          <button className="preview-button" onClick={toggleLivePreview}>
            {playing ? "■ 미리보기 정지" : "▶ 미리보기"}
          </button>
          <button
            className="top-export"
            onClick={exportVideo}
            disabled={exporting || validationMessages.length > 0}
          >
            {ttsGenerating
              ? `서버 음성 ${ttsProgress}%`
              : uploadingVideo
                ? "다운로드 준비 중"
                : exporting
                  ? `${progress}% 생성 중`
                  : "영상 생성"}
          </button>
          <button className="avatar" aria-label="사용자 메뉴">
            B
          </button>
        </div>
      </header>

      <section className="mobile-editor" aria-label="모바일 숏폼 제작 편집기">
        <header className="mobile-editor-header">
          <a href="#top" aria-label="맨 위로"><ArrowLeft size={22} weight="bold" /></a>
          <b>보배드림 숏폼 제작</b>
          <button onClick={saveProject} disabled={savingProject}>
            <Check size={15} weight="bold" />
            {savingProject ? "저장 중" : "저장됨"}
          </button>
        </header>

        <section className="mobile-entry-method" aria-labelledby="entry-method-title">
          <header>
            <span>INPUT METHOD</span>
            <h1 id="entry-method-title">숏폼 정보 입력 방법</h1>
            <p>차량 정보를 가져올 방법을 먼저 선택하세요.</p>
          </header>
          <div className="mobile-entry-method-grid" role="tablist" aria-label="숏폼 정보 입력 방법">
            {([
              { mode: "inventory", label: "내 매물 선택", description: "등록 매물에서 즉시 불러오기", Icon: Garage },
              { mode: "manual", label: "직접 입력", description: "차량 정보를 직접 작성", Icon: PencilSimpleLine },
              { mode: "url", label: "판매 매물 URL 입력", description: "매물 링크로 자동 입력", Icon: LinkSimple },
              { mode: "plate", label: "차량번호 입력", description: "번호로 기본정보 조회", Icon: IdentificationCard },
            ] as const).map(({ mode, label, description, Icon }) => (
              <button
                type="button"
                role="tab"
                key={mode}
                aria-selected={vehicleInputMode === mode}
                className={vehicleInputMode === mode ? "active" : ""}
                onClick={() => setVehicleInputMode(mode)}
              >
                <i aria-hidden="true"><Icon size={18} weight="bold" /></i>
                <span><b>{label}</b><small>{description}</small></span>
                {vehicleInputMode === mode && <CheckCircle size={17} weight="fill" />}
              </button>
            ))}
          </div>
        </section>

        {vehicleInputMode === "inventory" && <section className="mobile-inventory-entry" aria-labelledby="inventory-entry-title">
          <header>
            <div>
              <span>보배드림 매물 DB</span>
              <h1 id="inventory-entry-title">내 매물에서 숏폼 만들기</h1>
              <p>매물을 선택하면 사진·제원·가격을 불러옵니다.</p>
            </div>
            <button type="button">전체 보기</button>
          </header>
          <div className="mobile-inventory-list">
            {SAMPLE_INVENTORY.map((item) => {
              const selected = selectedInventory.includes(item.id);
              return (
                <article key={item.id} className={selected ? "selected" : ""}>
                  <button
                    className="mobile-inventory-check"
                    aria-label={`${item.stockNo} ${selected ? "선택 해제" : "선택"}`}
                    aria-pressed={selected}
                    onClick={() => toggleInventory(item)}
                  >
                    {selected && <Check size={13} weight="bold" />}
                  </button>
                  <img src={item.photo} alt={`${item.year} ${item.make} ${item.model}`} />
                  <button className="mobile-inventory-copy" onClick={() => editInventory(item)}>
                    <span>{item.status} · {item.stockNo}</span>
                    <b>{item.year} {item.make} {item.model} {item.trim}</b>
                    <small>{Number(item.mileage).toLocaleString("ko-KR")}km · {formatPrice(item.price)}</small>
                  </button>
                </article>
              );
            })}
          </div>
          <div className="mobile-inventory-actions">
            <span><b>{selectedInventory.length}대</b> 선택</span>
            <button onClick={addSelectedToQueue}>선택 매물 일괄 생성</button>
          </div>
          {batchQueueOpen && (
            <div className="mobile-batch-queue" role="status">
              <CheckCircle size={19} weight="fill" />
              <div><b>일괄 생성 대기열 등록 완료</b><span>{selectedInventory.length}대 · 완료되면 알림으로 안내</span></div>
              <button onClick={() => setBatchQueueOpen(false)} aria-label="일괄 생성 안내 닫기"><X size={15} /></button>
            </div>
          )}
        </section>}

        {vehicleInputMode === "url" && (
          <section className="mobile-method-entry-panel" aria-labelledby="listing-url-entry-title">
            <header>
              <span>매물 자동 불러오기</span>
              <h2 id="listing-url-entry-title">판매 매물 URL 입력</h2>
              <p>판매 중인 매물 링크를 붙여넣으면 사진과 차량정보를 자동으로 불러옵니다.</p>
            </header>
            <div className="mobile-import-panel">
              <div className="listing-provider-chips" role="list" aria-label="매물 사이트 선택">
                {LISTING_PROVIDERS.map((provider) => (
                  <button
                    type="button"
                    role="listitem"
                    key={`mobile-provider-${provider.id}`}
                    className={listingProvider === provider.id ? "active" : ""}
                    onClick={() => setListingProvider(provider.id)}
                  >
                    {provider.label}
                  </button>
                ))}
              </div>
              <label>
                <span>{LISTING_PROVIDERS.find((item) => item.id === listingProvider)?.label} 매물 URL</span>
                <div>
                  <input
                    aria-label="중고차 매물 URL"
                    placeholder={LISTING_PROVIDERS.find((item) => item.id === listingProvider)?.placeholder}
                    value={listingQuery}
                    onChange={(event) => updateListingQuery(event.target.value)}
                    onPaste={handleListingPaste}
                    onKeyDown={(event) => event.key === "Enter" && void importListing()}
                  />
                  <button onClick={() => void importListing()} disabled={loadingListing}>
                    {loadingListing ? "불러오는 중" : "정보 불러오기"}
                  </button>
                </div>
              </label>
              <p>URL을 붙여넣으면 사이트를 자동 판별해 즉시 불러옵니다.</p>
              {!listingQuery && ["auto", "encar"].includes(listingProvider) && (
                <button className="mobile-sample-url" onClick={() => updateListingQuery("https://fem.encar.com/cars/detail/42501957?listAdvType=share")}>엔카 GLC300 샘플 URL 넣기</button>
              )}
              <a className="listing-sample-video" href="/samples/CARVID-encar-42501957-15s.mp4" target="_blank" rel="noreferrer">▶ 한국어 내레이션 포함 15초 샘플</a>
            </div>
          </section>
        )}

        {vehicleInputMode === "plate" && (
          <section className="mobile-method-entry-panel" aria-labelledby="plate-entry-title">
            <header>
              <span>차량 기본정보 조회</span>
              <h2 id="plate-entry-title">차량번호 입력</h2>
              <p>차량번호로 확인 가능한 기본정보를 먼저 불러옵니다.</p>
            </header>
            <div className="mobile-import-panel">
              <label>
                <span>차량번호</span>
                <div>
                  <input
                    aria-label="차량번호"
                    placeholder="예: 63어0894"
                    value={plateQuery}
                    onChange={(event) => { setPlateQuery(event.target.value); setPlateImported(false); }}
                    onKeyDown={(event) => event.key === "Enter" && importVehicleByPlate()}
                  />
                  <button onClick={importVehicleByPlate} disabled={loadingPlate}>
                    {loadingPlate ? "조회 중" : "차량 조회"}
                  </button>
                </div>
              </label>
            </div>
          </section>
        )}

        {vehicleInputMode === "manual" && <section className="mobile-source-register" aria-labelledby="source-register-title">
          <header>
            <div>
              <span>MEDIA</span>
              <h2 id="source-register-title">소스 등록</h2>
            </div>
            <b>{mediaInputMode === "photo" ? `${photos.length}/${MAX_PHOTOS}장` : sourceVideoUrl ? "영상 1개" : "미등록"}</b>
          </header>
          <div className="mobile-source-tabs" role="tablist" aria-label="미디어 등록 방식">
            <button
              type="button"
              role="tab"
              aria-selected={mediaInputMode === "photo"}
              className={mediaInputMode === "photo" ? "active" : ""}
              onClick={() => setMediaInputMode("photo")}
            >
              <ImageSquare size={18} weight="bold" />
              <span><b>사진 등록</b><small>최대 20장 · 자동 장면 구성</small></span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mediaInputMode === "video"}
              className={mediaInputMode === "video" ? "active" : ""}
              onClick={() => setMediaInputMode("video")}
            >
              <FilmStrip size={18} weight="bold" />
              <span><b>영상 등록</b><small>선택 길이로 자동 컷</small></span>
            </button>
          </div>
          {mediaInputMode === "photo" ? (
            <div className="mobile-source-panel">
              <div>
                <b>차량 사진 {photos.length}/{MAX_PHOTOS}장</b>
                <span>최대 20장 · 외관 → 실내 → 디테일 순으로 구성</span>
              </div>
              <button type="button" onClick={() => fileInput.current?.click()}>
                <Plus size={16} weight="bold" /> 사진 추가
              </button>
            </div>
          ) : (
            <div className="mobile-video-source-panel">
              <div className="mobile-video-file">
                <span><FilmStrip size={22} weight="fill" /></span>
                <div>
                  <b>{sourceVideoName || "차량 영상을 등록해 주세요"}</b>
                  <small>{sourceVideoDuration ? `원본 ${Math.floor(sourceVideoDuration / 60)}:${String(Math.round(sourceVideoDuration % 60)).padStart(2, "0")}` : "MP4·MOV·WebM 지원"}</small>
                </div>
                <button type="button" onClick={() => videoInput.current?.click()}>{sourceVideoUrl ? "교체" : "등록"}</button>
              </div>
              <div className="mobile-autocut-setting">
                <div><b>오토컷 길이</b><span>원본 앞부분부터 선택한 길이로 자동 컷</span></div>
                <div className="mobile-autocut-durations">
                  {([15, 30, 45, 60, 90, 120] as const).map((seconds) => (
                    <button
                      type="button"
                      key={`autocut-${seconds}`}
                      className={videoDuration === seconds ? "active" : ""}
                      onClick={() => changeVideoDuration(seconds)}
                    >{seconds}초</button>
                  ))}
                </div>
                <p>
                  <CheckCircle size={15} weight="fill" />
                  {sourceVideoDuration && sourceVideoDuration < videoDuration
                    ? `원본이 짧아 ${Math.round(sourceVideoDuration)}초까지 생성됩니다.`
                    : `${videoDuration}초 · 자동 컷 6개 · 원본 음성 분리`}
                </p>
              </div>
            </div>
          )}
          <input ref={videoInput} type="file" accept="video/*" hidden onChange={addSourceVideo} />
        </section>}

        <section className="mobile-preview-section">
          <header>
            <div><b>실제 숏폼 미리보기</b><span>최종 영상과 동일한 화면 비율</span></div>
            <strong>9:16 · 1080×1920</strong>
          </header>
          <div
            className={`mobile-live-preview style-${style} template-${selectedTemplate}`}
            style={{
              "--accent": brandColor,
              "--scene-duration": `${Math.max(0.7, sceneDuration)}s`,
            } as React.CSSProperties}
          >
            <div className="phone-screen">
              {mediaInputMode === "video" && sourceVideoUrl ? (
                <>
                  <video
                    ref={previewSourceVideo}
                    className="source-video-preview"
                    src={sourceVideoUrl}
                    muted
                    playsInline
                    preload="metadata"
                    aria-label="등록한 차량 영상 미리보기"
                  />
                  {plateBlur && <span className="plate-blur" aria-label="번호판 보호 적용" />}
                </>
              ) : currentPhoto ? (
                <>
                  <img className="blur-bg" src={currentPhoto} alt="" />
                  <img
                    className={playing ? `vehicle-photo moving motion-${activePhoto % 4}` : "vehicle-photo"}
                    src={currentPhoto}
                    alt="실제 숏폼 차량 미리보기"
                  />
                  {plateBlur && <span className="plate-blur" aria-label="번호판 보호 적용" />}
                </>
              ) : (
                <div className="empty-preview">
                  {mediaInputMode === "video" ? <FilmStrip size={32} /> : <ImageSquare size={32} />}
                  <b>{mediaInputMode === "video" ? "차량 영상을 등록해 주세요" : "차량 사진을 추가해 주세요"}</b>
                </div>
              )}
              {logoUrl && <div className="video-top video-top-logo-only"><img src={logoUrl} alt="판매자 로고" /></div>}
              {captionEnabled && syncedCaption && (
                <div
                  className={`video-caption caption-${captionPosition} caption-${captionStyle}`}
                  style={{
                    fontSize: `${Math.max(13, captionSize * 0.52)}px`,
                    "--caption-accent": brandColor,
                  } as React.CSSProperties}
                >
                  {syncedCaption}
                </div>
              )}
              <div className="video-copy">
                {![form.make, form.model, form.trim]
                  .filter((item) => item && item.length > 1)
                  .some((item) => syncedCaption.toLowerCase().includes(item.toLowerCase())) && <h3>{title}</h3>}
                <strong>{formatPrice(form.price)}</strong>
              </div>
              <div className="timeline">
                {Array.from({ length: mediaInputMode === "video" ? 6 : Math.max(photos.length, 5) }).map((_, index) => <i key={`mobile-preview-${index}`} className={index === (mediaInputMode === "video" ? Math.min(5, Math.floor(previewElapsedMs / Math.max(1, effectiveVideoDuration * 1000 / 6))) : activePhoto) ? "active" : ""} />)}
              </div>
              {playing && previewElapsedMs >= Math.max(0, effectiveVideoDuration * 1000 - 2500) && (
                <div className="mobile-preview-cta"><b>{ctaLabel}</b><span>{form.phone}</span></div>
              )}
            </div>
            <button className="mobile-preview-play" onClick={toggleLivePreview} aria-label={playing ? "실제 숏폼 미리보기 정지" : "실제 숏폼 미리보기 재생"}>
              {playing ? <X size={21} weight="bold" /> : <Play size={21} weight="fill" />}
            </button>
          </div>
          <div className="mobile-preview-stats" aria-label="영상 제작 정보">
            <div>
              <span>영상 길이</span>
              <b>{Math.round(effectiveVideoDuration)}초</b>
            </div>
            <div>
              <span>{mediaInputMode === "video" ? "오토컷" : "장면당"}</span>
              <b>{mediaInputMode === "video" ? `6개 · ${sceneDuration.toFixed(1)}초` : `${sceneDuration.toFixed(1)}초`}</b>
            </div>
            <div>
              <span>TTS 예상</span>
              <b>{Math.min(Math.round(effectiveVideoDuration), estimatedTtsSeconds)}초</b>
            </div>
          </div>
          <div className="mobile-preview-output">
            <div>
              <span>현재 출력</span>
              <b>1080×1920 · 30fps · {renderedVideo?.format || "MP4 우선"}</b>
            </div>
            <small>
              {mediaInputMode === "video" ? `영상 원본 · ${sourceVideoName || "미등록"}` : `사진 ${photos.length}/${MAX_PHOTOS}장 · 9:16 자동 리프레이밍`}
            </small>
          </div>
        </section>

        <section className="mobile-project-summary mobile-project-summary-compact">
          <div className="mobile-project-copy">
            <h1>{title}</h1>
            <p>{Number(form.mileage || 0).toLocaleString("ko-KR")}km <span /> {formatPrice(form.price)}</p>
            <div className="mobile-photo-strip" aria-label="차량 사진 목록">
              {photos.slice(0, 5).map((photo, index) => (
                <button
                  key={`mobile-${photo.id}`}
                  className={activePhoto === index ? "active" : ""}
                  onClick={() => setActivePhoto(index)}
                >
                  <img src={photo.url} alt={`차량 사진 ${index + 1}`} />
                </button>
              ))}
              <button className="mobile-photo-more" onClick={() => fileInput.current?.click()}>
                {photos.length > 5 ? `+${photos.length - 5}` : <Plus size={18} />}
              </button>
            </div>
            <button
              className="mobile-set-first"
              disabled={activePhoto === 0}
              onClick={() => reorderPhoto(activePhoto, 0)}
            >
              {activePhoto === 0 ? "현재 사진이 첫 장면입니다" : "현재 사진을 첫 장면으로"}
            </button>
          </div>
        </section>

        <div className="mobile-completion-row">
          <span><CheckCircle size={18} weight="fill" /> 필수정보 완료</span>
          <b>입력 항목 17 / 17</b>
        </div>

        <details className="mobile-editor-section mobile-vehicle-section" open>
          <summary><span>차량 정보</span><CaretDown size={18} weight="bold" /></summary>

          <div className="mobile-current-input-mode">
            <span>선택한 입력 방법</span>
            <b>{vehicleInputMode === "inventory" ? "내 매물 선택" : vehicleInputMode === "manual" ? "직접 입력" : vehicleInputMode === "url" ? "판매 매물 URL 입력" : "차량번호 입력"}</b>
            <button type="button" onClick={() => document.getElementById("entry-method-title")?.scrollIntoView({ behavior: "smooth", block: "start" })}>변경</button>
          </div>

          {vehicleInputMode !== "manual" && (vehicleInputMode !== "plate" || plateImported) && (
            <div className="mobile-import-result">
              <div>
                <span>{vehicleInputMode === "url" && importedListing ? `${LISTING_PROVIDERS.find((item) => item.id === importedListing.source)?.label || "매물"} ${importedListing.listingId} · ${importedListing.importedPhotoCount}/${importedListing.totalPhotoCount}장` : vehicleInputMode === "inventory" ? "선택한 내 매물" : "조회된 차량정보"}</span>
                <b>{form.year} {form.make} {form.model} {form.trim}</b>
                <small>{Number(form.mileage || 0).toLocaleString("ko-KR")}km · {form.fuel} · {formatPrice(form.price)}{importedListing?.meta?.plate ? ` · ${importedListing.meta.plate}` : ""}</small>
              </div>
              <span className="mobile-import-editing">아래에서 바로 수정</span>
            </div>
          )}

          {(vehicleInputMode === "inventory" || vehicleInputMode === "manual" || (vehicleInputMode === "url" && Boolean(importedListing)) || (vehicleInputMode === "plate" && plateImported)) && <div className="mobile-value-rows">
            {[
              ["브랜드", "make"], ["모델", "model"], ["세부모델", "trim"],
              ["연식", "year"], ["주행거리", "mileage"], ["가격(만원)", "price"],
            ].map(([label, key]) => (
              <label key={key}>
                <span>{label}</span>
                <input
                  aria-label={`모바일 ${label}`}
                  inputMode={["year", "mileage", "price"].includes(key) ? "numeric" : undefined}
                  value={form[key]}
                  onChange={(event) => updateField(key, event.target.value)}
                />
                <CaretRight size={16} />
              </label>
            ))}
            <label>
              <span>연료</span>
              <select value={form.fuel} onChange={(event) => updateField("fuel", event.target.value)}>
                <option>가솔린</option><option>디젤</option><option>하이브리드</option><option>전기</option><option>LPG</option>
              </select>
              <CaretRight size={16} />
            </label>
            <label>
              <span>변속기</span>
              <select value={form.transmission} onChange={(event) => updateField("transmission", event.target.value)}>
                <option>자동</option><option>수동</option><option>DCT</option><option>CVT</option><option>감속기</option><option>표시 안 함</option>
              </select>
              <CaretRight size={16} />
            </label>
          </div>}
        </details>

        <details className="mobile-editor-section mobile-feature-section" open>
          <summary>
            <span>차량 특징</span>
            <b>{selectedVehicleFeatures.length}개 선택</b>
            <CaretDown size={18} weight="bold" />
          </summary>
          <div className="mobile-feature-row">
            <div>
              {POPULAR_VEHICLE_FEATURES.slice(0, 6).map((feature) => (
                <button
                  key={`mobile-feature-${feature}`}
                  className={selectedVehicleFeatures.includes(feature) ? "selected" : ""}
                  onClick={() => toggleVehicleFeature(feature)}
                >
                  {feature}
                </button>
              ))}
            </div>
            <button className="mobile-feature-all" onClick={() => setFeatureSheetOpen(true)}>
              전체 30개 특징 보기 <CaretRight size={15} />
            </button>
          </div>
        </details>

        <details className="mobile-editor-section mobile-disclosure-section" open>
          <summary>
            <span>차량 상태 고지</span>
            <b>과장 없이 공개</b>
            <CaretDown size={18} weight="bold" />
          </summary>
          <div className="mobile-disclosure-fields">
            <label>
              <span>사고 이력</span>
              <select value={form.accidentHistory} onChange={(event) => updateField("accidentHistory", event.target.value)}>
                <option>없음</option><option>단순교환</option><option>사고이력 있음</option><option>확인 필요</option>
              </select>
            </label>
            <label><span>수리 이력</span><textarea placeholder="예: 운전석 앞휀더 단순교환" value={form.repairHistory} onChange={(event) => updateField("repairHistory", event.target.value)} /></label>
            <label><span>특이사항</span><textarea placeholder="구매자가 알아야 할 내용을 입력" value={form.specialNotes} onChange={(event) => updateField("specialNotes", event.target.value)} /></label>
            <p>입력한 고지 내용은 AI가 삭제하거나 과장하지 않고 영상 설명에 반영합니다.</p>
          </div>
        </details>

        <details className="mobile-editor-section mobile-seller-section" open>
          <summary><span>판매자 정보</span><CaretDown size={18} weight="bold" /></summary>
          <div className="mobile-value-rows">
            <label>
              <span>판매자·업체명</span>
              <input value={form.seller} onChange={(event) => updateField("seller", event.target.value)} />
              <CaretRight size={16} />
            </label>
            <label>
              <span>연락처</span>
              <input value={form.phone} inputMode="tel" onChange={(event) => updateField("phone", event.target.value)} />
              <CaretRight size={16} />
            </label>
            <button className="mobile-logo-row" onClick={() => logoInput.current?.click()}>
              <span>판매자 로고</span>
              <b>{logoUrl ? "로고 적용됨" : "로고 선택"}</b>
              <CaretRight size={16} />
            </button>
          </div>
        </details>

        <div className="mobile-accordion-list">
          <details>
            <summary>
              <i><Sparkle size={20} /></i><b>AI 설명 문구</b><span>{videoDuration}초 · 작성 완료</span><CaretDown size={17} />
            </summary>
            <div className="mobile-detail-body">
              <div className="mobile-duration-row">
                {([15, 30, 45, 60, 90, 120] as const).map((seconds) => (
                  <button key={seconds} className={videoDuration === seconds ? "active" : ""} onClick={() => changeVideoDuration(seconds)}>{seconds}초</button>
                ))}
              </div>
              <textarea
                aria-label="모바일 차량 설명 문구"
                value={script}
                readOnly={descriptionMode === "auto"}
                onChange={(event) => { setCustomScript(event.target.value); setDescriptionMode("manual"); }}
              />
              <button className="mobile-inline-action" onClick={regenerateScript}>새로 생성</button>
            </div>
          </details>
          <details>
            <summary>
              <i><FilmStrip size={20} /></i><b>영상 템플릿</b><span>{currentTemplate.name}</span><CaretDown size={17} />
            </summary>
            <div className="mobile-detail-body mobile-template-options">
              {videoTemplates.map((template) => (
                <button key={template.id} className={selectedTemplate === template.id ? "active" : ""} onClick={() => applyTemplate(template)}>
                  <b>{template.name}</b><span>{template.description}</span>
                </button>
              ))}
            </div>
          </details>
          <details>
            <summary>
              <i><Microphone size={20} /></i><b>음성</b><span>{voiceOptions.find((item) => item.id === voice)?.name} · 속도 {voiceSpeed.toFixed(1)}×</span><CaretDown size={17} />
            </summary>
            <div className="mobile-detail-body">
              <div className="mobile-voice-grid">
                {voiceOptions.map((item) => (
                  <div key={item.id} className={`mobile-voice-card ${voice === item.id ? "active" : ""}`}>
                    <button className="mobile-voice-select" onClick={() => selectVoice(item.id)}>
                      <b>{voice === item.id ? "✓ " : ""}{item.name}</b>
                      <small>{item.label}</small>
                    </button>
                    <button
                      className={`mobile-voice-preview ${previewingVoice === item.id ? "playing" : ""}`}
                      onClick={() => void speak(item.id)}
                      aria-label={`${item.name} 음성 ${previewingVoice === item.id ? "정지" : "미리듣기"}`}
                    >
                      {previewingVoice === item.id ? "■" : "▶"}
                    </button>
                  </div>
                ))}
              </div>
              <label className="mobile-range-line">
                <span>말하기 속도</span>
                <input type="range" min="0.8" max="1.25" step="0.05" value={voiceSpeed} onChange={(event) => setVoiceSpeed(Number(event.target.value))} />
                <b>{voiceSpeed.toFixed(1)}×</b>
              </label>
              <div className="mobile-choice-row">
                <button className="mobile-inline-action" onClick={() => void speak()}>{previewingVoice === voice ? "■ 미리듣기 정지" : "▶ 선택 음성 듣기"}</button>
                <button className="mobile-inline-action" onClick={useBuiltInNarration}>{narrationKind === "sample" ? "✓ 기본 샘플 적용됨" : "기본 샘플 음성 사용"}</button>
              </div>
            </div>
          </details>
          <details>
            <summary>
              <i><MusicNote size={20} /></i><b>음악</b><span>{musicName || musicOptions.find((item) => item.id === selectedMusic)?.name || "음악 없음"} · {musicVolume}%</span><CaretDown size={17} />
            </summary>
            <div className="mobile-detail-body">
              <div className="mobile-choice-row">
                {musicOptions.slice(0, 4).map((item) => (
                  <button key={item.id} className={selectedMusic === item.id ? "active" : ""} onClick={() => void previewMusic(item.id, 8)}>{playingMusic === item.id ? "정지" : item.name}</button>
                ))}
              </div>
              <label className="mobile-range-line">
                <span>음악 볼륨</span>
                <input type="range" min="0" max="100" value={musicVolume} onChange={(event) => setMusicVolume(Number(event.target.value))} />
                <b>{musicVolume}%</b>
              </label>
              <button className="mobile-inline-action" onClick={() => audioInput.current?.click()}>내 음악 업로드</button>
            </div>
          </details>
          <details>
            <summary>
              <i><TextT size={20} /></i><b>자막</b><span>{captionEnabled ? `${captionPosition === "top" ? "상단" : captionPosition === "middle" ? "중앙" : "하단"} · 자동 싱크` : "사용 안 함"}</span><CaretDown size={17} />
            </summary>
            <div className="mobile-detail-body">
              <label className="mobile-toggle-line"><span>자막 사용</span><input type="checkbox" checked={captionEnabled} onChange={(event) => setCaptionEnabled(event.target.checked)} /></label>
              <div className="mobile-choice-row">
                {(["top", "middle", "bottom"] as CaptionPosition[]).map((position) => (
                  <button key={position} className={captionPosition === position ? "active" : ""} onClick={() => setCaptionPosition(position)}>{position === "top" ? "상단" : position === "middle" ? "중앙" : "하단"}</button>
                ))}
              </div>
            </div>
          </details>
          <details>
            <summary>
              <i><CheckCircle size={20} /></i><b>엔드카드 CTA</b><span>{ctaLabel}</span><CaretDown size={17} />
            </summary>
            <div className="mobile-detail-body">
              <div className="mobile-choice-row">
                {(["listing", "call", "inquiry"] as CtaType[]).map((item) => (
                  <button key={item} className={ctaType === item ? "active" : ""} onClick={() => setCtaType(item)}>
                    {item === "listing" ? "매물 보러가기" : item === "call" ? "전화하기" : "문의하기"}
                  </button>
                ))}
              </div>
              <p className="mobile-cta-note">판매자 연락처 {form.phone || "미입력"}가 마지막 장면에 자동 적용됩니다.</p>
            </div>
          </details>
          <details>
            <summary>
              <i><Microphone size={20} /></i><b>생성 설정</b><span>1080×1920 · {videoDuration}초</span><CaretDown size={17} />
            </summary>
            <div className="mobile-detail-body mobile-output-summary">
              <span>세로 9:16</span><span>30fps</span><span>MP4 우선</span><span>번호판 보호 {plateBlur ? "사용" : "해제"}</span>
            </div>
          </details>
        </div>

        <section className="mobile-timeline-editor">
          <header>
            <div><b>영상 타임라인 편집</b><span>{mediaInputMode === "video" ? `${effectiveVideoDuration.toFixed(0)}초 · 자동 컷 6개` : `권장 ${recommendedPhotos}`}</span></div>
            <button onClick={() => mediaInputMode === "video" ? videoInput.current?.click() : fileInput.current?.click()}><Plus size={15} weight="bold" /> {mediaInputMode === "video" ? "영상 교체" : "장면 추가"}</button>
          </header>
          <div className="mobile-scene-strip">
            {mediaInputMode === "video"
              ? Array.from({ length: 6 }).map((_, index) => (
                <button key={`mobile-video-cut-${index}`} className="mobile-video-cut">
                  <FilmStrip size={18} weight="fill" /><b>컷 {index + 1}</b><span>{(sceneDuration * index).toFixed(1)}s</span>
                </button>
              ))
              : photos.map((photo, index) => (
                <button key={`mobile-scene-${photo.id}`} className={activePhoto === index ? "active" : ""} onClick={() => setActivePhoto(index)}>
                  <img src={photo.url} alt={`타임라인 장면 ${index + 1}`} /><span>{index + 1}</span>
                </button>
              ))}
          </div>
          <div className="mobile-time-ruler"><span>0초</span><i /><span>{Math.round(effectiveVideoDuration / 2)}초</span><i /><span>{Math.round(effectiveVideoDuration)}초</span></div>
          <div className="mobile-track-grid">
            <b><FilmStrip size={14} />영상</b><div className="mobile-video-blocks">{mediaInputMode === "video" ? Array.from({ length: 6 }).map((_, index) => <i key={`video-block-${index}`} />) : photos.slice(0, 8).map((photo) => <i key={`block-${photo.id}`} />)}</div>
            <b><TextT size={14} />자막</b><div className="mobile-caption-blocks"><i>{subtitleAt(subtitleCues, activePhoto * sceneDuration * 1000) || "BMW X3"}</i><i>핵심 옵션</i></div>
            <b><Microphone size={14} />음성</b><div className="mobile-wave-track">{ttsBars.slice(0, 30).map((height, index) => <i key={`mvoice-${index}`} style={{ height: `${Math.max(18, height)}%` }} />)}</div>
            <b><MusicNote size={14} />음악</b><div className="mobile-wave-track light">{ttsBars.slice(5, 35).map((height, index) => <i key={`mmusic-${index}`} style={{ height: `${Math.max(14, 82 - height)}%` }} />)}</div>
          </div>
        </section>

        {(exporting || uploadingVideo || renderedVideo) && (
          <section className="mobile-render-result" aria-live="polite">
            {renderedVideo ? (
              <>
                <header>
                  <div><CheckCircle size={20} weight="fill" /><span><b>영상 생성 완료</b><small>{renderedVideo.format} · {(renderedVideo.size / 1024 / 1024).toFixed(1)}MB</small></span></div>
                  {uploadingVideo && <em>다운로드 주소 준비 중</em>}
                </header>
                <video src={renderedVideo.url} controls playsInline preload="metadata" aria-label="생성된 숏폼 영상" />
                <a className="mobile-download-primary" href={renderedVideo.downloadUrl || renderedVideo.url} download={renderedVideo.name}>
                  ⇩ 영상 파일 다운로드
                </a>
                <button className="mobile-share-secondary" type="button" onClick={saveOrShareVideo}>
                  휴대폰에 저장·공유
                </button>
                <p>서버 저장이 지연돼도 생성된 파일은 바로 다운로드할 수 있습니다.</p>
              </>
            ) : (
              <div className="mobile-render-progress">
                <span><FilmStrip size={22} weight="fill" /></span>
                <div><b>영상을 생성하고 있습니다</b><small>화면을 닫지 말아 주세요 · {progress}%</small><i><em style={{ width: `${Math.max(3, progress)}%` }} /></i></div>
              </div>
            )}
          </section>
        )}

        <div className="mobile-bottom-actions">
          <button onClick={toggleLivePreview}>{playing ? "미리보기 정지" : "미리보기"}</button>
          {renderedVideo ? (
            <a href={renderedVideo.downloadUrl || renderedVideo.url} download={renderedVideo.name}>영상 다운로드</a>
          ) : (
            <button onClick={exportVideo} disabled={exporting || validationMessages.length > 0}>
              {exporting ? `${progress}% 생성 중` : "영상 생성"}
            </button>
          )}
        </div>
      </section>

      <section id="top" className="studio-workspace">
        <aside className="asset-rail">
          <section className="template-library" aria-label="영상 템플릿">
            <div className="template-library-head">
              <div>
                <span>TEMPLATE</span>
                <h2>영상 템플릿</h2>
              </div>
              <b>원터치 적용</b>
            </div>
            <div className="template-tabs" aria-label="템플릿 카테고리">
              {templateCategories.map((item) => (
                <button
                  key={item.id}
                  className={templateCategory === item.id ? "active" : ""}
                  aria-pressed={templateCategory === item.id}
                  onClick={() => setTemplateCategory(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="template-cards">
              {filteredTemplates.map((item) => (
                <button
                  key={item.id}
                  aria-label={`${item.name} 템플릿 적용`}
                  aria-pressed={selectedTemplate === item.id}
                  className={selectedTemplate === item.id ? "active" : ""}
                  onClick={() => applyTemplate(item)}
                >
                  <span className={`template-thumb template-thumb-${item.id}`}>
                    <img
                      src={photos[item.cover]?.url || SAMPLE_PHOTOS[item.cover].url}
                      alt=""
                    />
                    <i>{item.name}</i>
                    {selectedTemplate === item.id && <em>적용 중</em>}
                  </span>
                  <b>{item.name}</b>
                  <small>{item.description}</small>
                </button>
              ))}
            </div>
          </section>
          <div className="panel-heading">
            <div>
              <span>MEDIA</span>
              <h2>차량 사진</h2>
            </div>
            <b>
              {photos.length}/{MAX_PHOTOS}
            </b>
          </div>
          <button className="sample-project-button" onClick={loadSampleProject}>
            <span>DEMO</span>
            BMW X3 샘플 다시 불러오기
          </button>
          <div className="listing-import">
            <span>매물 URL 자동 불러오기</span>
            <div className="listing-provider-chips" role="list" aria-label="매물 사이트 선택">
              {LISTING_PROVIDERS.map((provider) => (
                <button
                  type="button"
                  role="listitem"
                  key={`desktop-provider-${provider.id}`}
                  className={listingProvider === provider.id ? "active" : ""}
                  onClick={() => setListingProvider(provider.id)}
                >
                  {provider.label}
                </button>
              ))}
            </div>
            <div>
              <input
                aria-label="중고차 매물 URL"
                placeholder={LISTING_PROVIDERS.find((item) => item.id === listingProvider)?.placeholder}
                value={listingQuery}
                onChange={(event) => updateListingQuery(event.target.value)}
                onPaste={handleListingPaste}
                onKeyDown={(event) => event.key === "Enter" && void importListing()}
              />
              <button onClick={() => void importListing()} disabled={loadingListing}>
                {loadingListing ? "분석 중" : "불러오기"}
              </button>
            </div>
            <small>
              붙여넣기 즉시 사이트 자동 감지 · 차량정보와 사진 최대 20장 불러오기
            </small>
            {!listingQuery && ["auto", "encar"].includes(listingProvider) && <button className="sample-url-fill" onClick={() => updateListingQuery("https://fem.encar.com/cars/detail/42501957?listAdvType=share")}>엔카 GLC300 샘플 URL 넣기</button>}
            <a className="listing-sample-video" href="/samples/CARVID-encar-42501957-15s.mp4" target="_blank" rel="noreferrer">▶ 한국어 내레이션 포함 15초 샘플</a>
          </div>
          <button
            className="rail-upload"
            onClick={() => fileInput.current?.click()}
          >
            <span>＋</span>
            <b>사진 추가</b>
            <small>3~20장 · 가로 사진 지원</small>
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={addPhotos}
          />
          <div className="rail-photos">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                draggable
                className={`rail-photo ${activePhoto === index ? "selected" : ""}`}
                onDragStart={(e) =>
                  e.dataTransfer.setData("text/photo-index", String(index))
                }
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  reorderPhoto(
                    Number(e.dataTransfer.getData("text/photo-index")),
                    index,
                  );
                }}
                onClick={() => setActivePhoto(index)}
              >
                <img src={photo.url} alt={`차량 사진 ${index + 1}`} />
                <span>{index === 0 ? "대표" : index + 1}</span>
                <div className="rail-tools">
                  <button
                    aria-label="앞으로"
                    onClick={(e) => {
                      e.stopPropagation();
                      movePhoto(index, -1);
                    }}
                    disabled={index === 0}
                  >
                    ↑
                  </button>
                  <button
                    aria-label="뒤로"
                    onClick={(e) => {
                      e.stopPropagation();
                      movePhoto(index, 1);
                    }}
                    disabled={index === photos.length - 1}
                  >
                    ↓
                  </button>
                  <button
                    aria-label="삭제"
                    onClick={(e) => {
                      e.stopPropagation();
                      removePhoto(index);
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
            {!photos.length && (
              <div className="empty-assets">
                <span>▧</span>
                <p>
                  사진을 추가하면
                  <br />
                  장면이 여기에 표시됩니다.
                </p>
              </div>
            )}
          </div>
          <div className="rail-tip">
            사진을 끌어서 장면 순서를 바꾸고
            <br />
            9:16 미리보기에서 바로 확인하세요.
          </div>
        </aside>

        <section className="canvas-stage">
          <div className="canvas-toolbar">
            <div>
              <span className="live-dot" /> 실시간 미리보기
            </div>
            <div className="duration-switch" aria-label="영상 길이">
              {([15, 30, 45, 60, 90, 120] as const).map((seconds) => (
                <button
                  key={seconds}
                  className={videoDuration === seconds ? "active" : ""}
                  onClick={() => changeVideoDuration(seconds)}
                >
                  {seconds}초
                </button>
              ))}
            </div>
            <div className="canvas-tools">
              <button
                onClick={() =>
                  setActivePhoto((value) => Math.max(0, value - 1))
                }
                disabled={!photos.length}
              >
                ↶
              </button>
              <b>9:16</b>
              <button
                onClick={() =>
                  setActivePhoto((value) =>
                    photos.length ? Math.min(photos.length - 1, value + 1) : 0,
                  )
                }
                disabled={!photos.length}
              >
                ↷
              </button>
            </div>
          </div>
          <div className="one-screen-flow" aria-label="한 화면 영상 제작 순서">
            <span className={photos.length >= 3 ? "done" : "active"}>1 사진</span>
            <span className={validationMessages.length === 0 ? "done" : "active"}>2 차량정보</span>
            <span className="done">3 템플릿</span>
            <span className={narrationUrl ? "done" : "active"}>4 음성·음악</span>
            <span className={renderedVideo ? "done" : "active"}>5 생성·다운로드</span>
          </div>
          <div className="stage-center">
            <aside className="preview-panel">
              <div className="preview-head">
                <div>
                  <span>LIVE PREVIEW</span>
                  <h2>실시간 영상 미리보기</h2>
                </div>
                <button onClick={toggleLivePreview}>
                  {playing ? "■ 정지" : "▶ 통합 미리보기"}
                </button>
              </div>
              <div
                className={`phone-frame style-${style} template-${selectedTemplate}`}
                style={
                  {
                    "--accent": brandColor,
                    "--scene-duration": `${Math.max(0.7, sceneDuration)}s`,
                  } as React.CSSProperties
                }
              >
                <div className="phone-screen">
                  {currentPhoto ? (
                    <>
                      <img className="blur-bg" src={currentPhoto} alt="" />
                      <img
                        className={
                          playing
                            ? `vehicle-photo moving motion-${activePhoto % 4}`
                            : "vehicle-photo"
                        }
                        src={currentPhoto}
                        alt="영상 미리보기 차량"
                      />
                      {plateBlur && (
                        <span className="plate-blur">번호판 자동 보호</span>
                      )}
                    </>
                  ) : (
                    <div className="empty-preview">
                      <span>＋</span>
                      <b>
                        차량 사진을
                        <br />
                        추가해 주세요
                      </b>
                      <small>
                        가로 사진도 화면을 채워
                        <br />
                        자연스럽게 움직입니다.
                      </small>
                    </div>
                  )}
                  <div className="video-top">
                    <span>보배드림 숏폼</span>
                    {logoUrl && <img src={logoUrl} alt="딜러 로고" />}
                  </div>
                  <div className="template-masthead">
                    <span>{currentTemplate.name}</span>
                    <i>{String(activePhoto + 1).padStart(2, "0")} / {String(Math.max(photos.length, 1)).padStart(2, "0")}</i>
                  </div>
                  {captionEnabled && syncedCaption && (
                    <div
                      className={`video-caption caption-${captionPosition} caption-${captionStyle}`}
                      style={{
                        fontSize: `${Math.max(9, captionSize * 0.38)}px`,
                        "--caption-accent": brandColor,
                      } as React.CSSProperties}
                    >
                      {syncedCaption}
                    </div>
                  )}
                  <div className="video-copy">
                    <em>
                      {activePhoto === 0
                        ? "AI 추천 매물"
                        : ["주행거리", "핵심 사양", "추천 포인트", "판매 가격"][
                            Math.min(activePhoto - 1, 3)
                          ] || "실매물 확인"}
                    </em>
                    <h3>{title}</h3>
                    <p>{form.feature}</p>
                    <strong>{formatPrice(form.price)}</strong>
                    <small>
                      {form.mileage
                        ? `${Number(form.mileage).toLocaleString("ko-KR")} km`
                        : "주행거리 확인"}{" "}
                      · {form.fuel}
                      {form.transmission !== "표시 안 함"
                        ? ` · ${form.transmission}`
                        : ""}
                    </small>
                  </div>
                  <div className="timeline">
                    {Array.from({ length: Math.max(photos.length, 5) }).map(
                      (_, index) => (
                        <i
                          key={index}
                          className={index === activePhoto ? "active" : ""}
                        />
                      ),
                    )}
                  </div>
                </div>
              </div>
              <div className="preview-meta">
                <div>
                  <span>영상 길이</span>
                  <b>{videoDuration}초</b>
                </div>
                <div>
                  <span>장면당</span>
                  <b>{sceneDuration.toFixed(1)}초</b>
                </div>
                <div>
                  <span>TTS 예상</span>
                  <b>{estimatedTtsSeconds}초</b>
                </div>
              </div>
              <div className="render-spec">
                <b>현재 출력</b>
                <span>1080×1920 · 30fps · MP4 우선</span>
                <small>기기에서 MP4 인코딩이 불가능한 경우 WebM으로 자동 전환</small>
              </div>
              {renderedVideo && (
                <div className="render-result">
                  <div>
                    <b>영상 생성 완료</b>
                    <span>
                      {renderedVideo.format} · {(renderedVideo.size / 1024 / 1024).toFixed(1)}MB · {renderedVideo.hasNarration ? "음성 포함" : "음성 없음"} · {renderedVideo.hasMusic ? "음악 포함" : "음악 없음"}
                    </span>
                  </div>
                  <video
                    src={renderedVideo.url}
                    controls
                    playsInline
                    preload="metadata"
                    aria-label="생성된 영상과 음악 확인"
                  />
                  <button className="render-download" type="button" onClick={downloadRenderedVideo}>⇩ 영상 파일 다운로드</button>
                  <button className="render-share" onClick={saveOrShareVideo}>
                    휴대폰에 저장·공유
                  </button>
                  <small>HTTPS 다운로드와 휴대폰 공유 저장을 모두 지원합니다.</small>
                </div>
              )}
            </aside>
          </div>
        </section>

        <aside className="inspector-panel">
          <div className="panel-heading">
            <div>
              <span>PROPERTIES</span>
              <h2>영상 설정</h2>
            </div>
            <i>모두 펼침</i>
          </div>
          <section className="inspector-section">
            <div className="inspector-title">
              <b>차량 정보</b>
              <span>전기차 자동 보정</span>
            </div>
            <div className="field-grid compact-fields">
              <label>
                <span>제조사</span>
                <input
                  value={form.make}
                  onChange={(e) => updateField("make", e.target.value)}
                />
              </label>
              <label>
                <span>모델</span>
                <input
                  value={form.model}
                  onChange={(e) => updateField("model", e.target.value)}
                />
              </label>
              <label>
                <span>트림</span>
                <input
                  value={form.trim}
                  onChange={(e) => updateField("trim", e.target.value)}
                />
              </label>
              <label>
                <span>연식</span>
                <input
                  value={form.year}
                  inputMode="numeric"
                  onChange={(e) => updateField("year", e.target.value)}
                />
              </label>
              <label>
                <span>주행거리</span>
                <input
                  value={form.mileage}
                  inputMode="numeric"
                  onChange={(e) => updateField("mileage", e.target.value)}
                />
              </label>
              <label>
                <span>가격(만원)</span>
                <input
                  value={form.price}
                  inputMode="numeric"
                  onChange={(e) => updateField("price", e.target.value)}
                />
              </label>
              <label>
                <span>연료</span>
                <select
                  value={form.fuel}
                  onChange={(e) => updateField("fuel", e.target.value)}
                >
                  <option>가솔린</option>
                  <option>디젤</option>
                  <option>하이브리드</option>
                  <option>전기</option>
                  <option>LPG</option>
                </select>
              </label>
              <label>
                <span>변속기</span>
                <select
                  value={form.transmission}
                  onChange={(e) => updateField("transmission", e.target.value)}
                >
                  <option>자동</option>
                  <option>수동</option>
                  <option>DCT</option>
                  <option>CVT</option>
                  <option>감속기</option>
                  <option>표시 안 함</option>
                </select>
              </label>
              <div className="wide vehicle-feature-field">
                <div className="vehicle-feature-heading">
                  <span>차량 특징</span>
                  <b>{selectedVehicleFeatures.length}/8 선택</b>
                </div>
                <div className="vehicle-feature-strip-wrap">
                  <div className="vehicle-feature-strip" aria-label="인기 차량 특징, 좌우로 밀어 더 보기">
                    {POPULAR_VEHICLE_FEATURES.map((feature) => {
                      const selected = selectedVehicleFeatures.includes(feature);
                      return (
                        <button
                          key={feature}
                          type="button"
                          aria-pressed={selected}
                          className={selected ? "feature-chip selected" : "feature-chip"}
                          onClick={() => toggleVehicleFeature(feature)}
                        >
                          {selected && <Check size={12} weight="bold" aria-hidden="true" />}
                          {feature}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      className="feature-chip feature-all-chip"
                      onClick={() => setFeatureSheetOpen(true)}
                    >
                      전체 30개
                      <CaretRight size={12} weight="bold" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <div className="feature-field-foot">
                  <span>좌우로 밀어서 빠르게 선택</span>
                  <button type="button" onClick={() => setFeatureSheetOpen(true)}>
                    전체 보기
                  </button>
                </div>
                <label className="feature-direct-input">
                  <span>직접 입력</span>
                  <input
                    aria-label="차량 특징 직접 입력"
                    value={form.feature}
                    onChange={(e) => updateField("feature", e.target.value)}
                    placeholder="직접 입력하거나 위 특징을 선택하세요"
                  />
                </label>
              </div>
              <label>
                <span>판매자·업체명</span>
                <input
                  value={form.seller}
                  onChange={(e) => updateField("seller", e.target.value)}
                />
              </label>
              <label>
                <span>연락처</span>
                <input
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                />
              </label>
            </div>
            {validationMessages.length > 0 && (
              <div className="validation-box">
                {validationMessages.map((message) => (
                  <span key={message}>! {message}</span>
                ))}
              </div>
            )}
          </section>
          {featureSheetOpen && (
            <div
              className="feature-sheet-backdrop"
              role="presentation"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) setFeatureSheetOpen(false);
              }}
            >
              <section
                className="feature-sheet"
                role="dialog"
                aria-modal="true"
                aria-labelledby="feature-sheet-title"
              >
                <div className="feature-sheet-handle" aria-hidden="true" />
                <header className="feature-sheet-header">
                  <div>
                    <span>차량 상품성</span>
                    <h2 id="feature-sheet-title">차량 특징 전체보기</h2>
                    <p>영상에 강조할 특징을 최대 8개 선택하세요.</p>
                  </div>
                  <button
                    type="button"
                    aria-label="차량 특징 전체보기 닫기"
                    onClick={() => setFeatureSheetOpen(false)}
                  >
                    <X size={20} weight="bold" aria-hidden="true" />
                  </button>
                </header>
                <div className="feature-sheet-summary">
                  <b>{selectedVehicleFeatures.length}개 선택됨</b>
                  <div className="feature-sheet-selected">
                    {selectedVehicleFeatures.length ? (
                      selectedVehicleFeatures.map((feature) => (
                        <button
                          key={feature}
                          type="button"
                          aria-label={`${feature} 선택 해제`}
                          onClick={() => toggleVehicleFeature(feature)}
                        >
                          {feature}
                          <X size={11} weight="bold" aria-hidden="true" />
                        </button>
                      ))
                    ) : (
                      <span>선택한 특징이 없습니다.</span>
                    )}
                  </div>
                </div>
                <div className="feature-sheet-content">
                  {VEHICLE_FEATURE_GROUPS.map((group) => (
                    <div className="feature-sheet-group" key={group.title}>
                      <div>
                        <h3>{group.title}</h3>
                        <span>{group.description}</span>
                      </div>
                      <div className="feature-sheet-grid">
                        {group.items.map((feature) => {
                          const selected = selectedVehicleFeatures.includes(feature);
                          return (
                            <button
                              key={feature}
                              type="button"
                              aria-pressed={selected}
                              className={selected ? "selected" : ""}
                              onClick={() => toggleVehicleFeature(feature)}
                            >
                              {selected && <Check size={13} weight="bold" aria-hidden="true" />}
                              {feature}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <footer className="feature-sheet-footer">
                  <button
                    type="button"
                    className="feature-reset"
                    onClick={() => updateField("feature", "")}
                    disabled={!selectedVehicleFeatures.length}
                  >
                    전체 해제
                  </button>
                  <button
                    type="button"
                    className="feature-complete"
                    onClick={() => setFeatureSheetOpen(false)}
                  >
                    {selectedVehicleFeatures.length
                      ? `${selectedVehicleFeatures.length}개 적용하기`
                      : "선택 완료"}
                  </button>
                </footer>
              </section>
            </div>
          )}
          <section className="inspector-section">
            <div className="inspector-title">
              <b>차량 설명</b>
              <div className="script-actions">
                {descriptionMode === "auto" && (
                  <button onClick={regenerateScript} disabled={generatingScript}>
                    {generatingScript ? "생성 중…" : "↻ 새로 생성"}
                  </button>
                )}
              </div>
            </div>
            <div className="script-mode-switch" aria-label="차량 설명 입력 방식">
              <button
                className={descriptionMode === "auto" ? "active" : ""}
                onClick={() => setDescriptionMode("auto")}
              >
                AI 자동 · {videoDuration}초
              </button>
              <button
                className={descriptionMode === "manual" ? "active" : ""}
                onClick={() => {
                  if (descriptionMode !== "manual") setCustomScript(script);
                  setDescriptionMode("manual");
                }}
              >
                직접 입력
              </button>
            </div>
            <div className="script-duration-switch" aria-label="차량 설명 길이">
              {([15, 30, 45, 60, 90, 120] as const).map((seconds) => (
                <button
                  key={seconds}
                  aria-pressed={videoDuration === seconds}
                  className={videoDuration === seconds ? "active" : ""}
                  onClick={() => changeVideoDuration(seconds)}
                >
                  {seconds}초
                </button>
              ))}
            </div>
            <textarea
              aria-label="차량 설명 문구"
              className={
                generatingScript ? "script-editor generating" : "script-editor"
              }
              value={
                generatingScript ? "차량 정보를 분석하고 있습니다…" : script
              }
              onChange={(e) => {
                setCustomScript(e.target.value);
                setDescriptionMode("manual");
              }}
              readOnly={descriptionMode === "auto"}
              disabled={generatingScript}
            />
            <div className="script-meta">
              <span>{script.length}자</span>
              <span>TTS 약 {estimatedTtsSeconds}초</span>
              <span
                className={estimatedTtsSeconds > videoDuration ? "warn" : "ok"}
              >
                {estimatedTtsSeconds > videoDuration
                  ? `${estimatedTtsSeconds - videoDuration}초 초과`
                  : "길이 적합"}
              </span>
            </div>
          </section>
          <section className="inspector-section">
            <div className="inspector-title">
              <b>영상 스타일</b>
              <span>즉시 적용</span>
            </div>
            <div className="style-chips">
              {styles.map((item) => (
                <button
                  key={item.id}
                  className={style === item.id ? "selected" : ""}
                  onClick={() => setStyle(item.id)}
                >
                  <i
                    style={{
                      background: `linear-gradient(135deg, ${item.colors[0]}, ${item.colors[1]})`,
                    }}
                  />
                  {item.name}
                </button>
              ))}
            </div>
          </section>
          <section className="inspector-section">
            <div className="inspector-title">
              <b>한국어 내레이션</b>
              <button onClick={() => void speak()}>{previewingVoice === voice ? "■ 미리듣기 정지" : "▶ 선택 음성 듣기"}</button>
            </div>
            <div className="tts-engine-grid" aria-label="음성 엔진 운영 상태">
              <span className="active"><b>현재 사용 가능</b> 기기 음성 미리보기 · 기본 샘플 음성</span>
              <span><b>기본 예정</b> MeloTTS CPU</span>
              <span><b>Premium 예정</b> Chatterbox Multilingual V3</span>
              <span className="hold"><b>검토 보류</b> Supertonic 3 · 공식 지원 종료</span>
            </div>
            <div className="implementation-note">
              캐릭터 선택과 미리듣기를 분리했습니다. 미리듣기는 기기 음성이며,
              최종 영상에는 기본 샘플 음성 또는 직접 추가한 음원이 포함됩니다.
              차명·트림·연식·주행거리·가격은 자동차 발음 사전으로 전처리합니다.
            </div>
            <div className="narration-upload-row">
              <button
                disabled={exporting}
                onClick={useBuiltInNarration}
              >
                {narrationKind === "sample" ? "✓ 기본 샘플 적용됨" : "기본 샘플 음성 사용"}
              </button>
              <button
                className="narration-file-button"
                onClick={() => narrationInput.current?.click()}
              >
                음성 파일 직접 추가
              </button>
              <input
                ref={narrationInput}
                type="file"
                accept="audio/*"
                hidden
                onChange={handleNarration}
              />
              <span>{narrationName || "MP3·WAV · 최종 영상에 실제 포함"}</span>
              {narrationUrl && (
                <audio
                  ref={narrationControlAudio}
                  className="narration-preview"
                  src={narrationUrl}
                  controls
                  preload="metadata"
                  onPlay={() => {
                    stopVoicePreview();
                    stopMusicPreview();
                  }}
                />
              )}
              {narrationFile && (
                <button
                  className="remove-narration"
                  aria-label="내레이션 제거"
                  onClick={() => {
                    URL.revokeObjectURL(narrationUrl);
                    setNarrationFile(null);
                    setNarrationName("");
                    setNarrationUrl("");
                    setNarrationKind("");
                    notify("내레이션 음성을 제거했습니다.");
                  }}
                >
                  ×
                </button>
              )}
            </div>
            <div className="voice-tabs">
              <button
                className={voiceTab === "all" ? "active" : ""}
                onClick={() => setVoiceTab("all")}
              >
                전체
              </button>
              <button
                className={voiceTab === "female" ? "active" : ""}
                onClick={() => setVoiceTab("female")}
              >
                여성
              </button>
              <button
                className={voiceTab === "male" ? "active" : ""}
                onClick={() => setVoiceTab("male")}
              >
                남성
              </button>
            </div>
            <div className="voice-list inspector-voices">
              {voiceOptions
                .filter(
                  (item) => voiceTab === "all" || item.gender === voiceTab,
                )
                .map((item) => (
                  <div key={item.id} className={`voice-card ${voice === item.id ? "selected" : ""}`}>
                    <button
                      className="voice-select"
                      onClick={() => selectVoice(item.id)}
                      aria-pressed={voice === item.id}
                    >
                      <span className={item.gender}>{item.icon}</span>
                      <b>
                        {item.name}
                        <small>{item.label}</small>
                      </b>
                      <i>{voice === item.id ? "✓" : ""}</i>
                    </button>
                    <button
                      className={`voice-preview ${previewingVoice === item.id ? "playing" : ""}`}
                      onClick={() => void speak(item.id)}
                      aria-label={`${item.name} 음성 ${previewingVoice === item.id ? "정지" : "미리듣기"}`}
                      title={`${item.name} 음성 ${previewingVoice === item.id ? "정지" : "미리듣기"}`}
                    >
                      {previewingVoice === item.id ? "■" : "▶"}
                    </button>
                  </div>
                ))}
            </div>
            <div className="voice-controls mixer-controls">
              <label>
                <span>
                  속도 <b>{voiceSpeed.toFixed(1)}×</b>
                </span>
                <input
                  type="range"
                  min="0.8"
                  max="1.2"
                  step="0.1"
                  value={voiceSpeed}
                  onChange={(e) => setVoiceSpeed(Number(e.target.value))}
                />
              </label>
              <label>
                <span>
                  내레이션 <b>{narrationVolume}%</b>
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={narrationVolume}
                  onChange={(e) => setNarrationVolume(Number(e.target.value))}
                />
              </label>
            </div>
            <label className="ducking-row">
              <span>
                <b>자동 오디오 닥킹</b>
                <small>음성 재생 중 배경음악을 자동으로 낮춤</small>
              </span>
              <input
                type="checkbox"
                checked={ducking}
                onChange={(e) => setDucking(e.target.checked)}
              />
              <i />
            </label>
          </section>
          <section className="inspector-section music-library">
            <div className="inspector-title">
              <b>배경음악</b>
              <span>Web Audio 시안음 · 직접 음원</span>
            </div>
            <div className="music-search">
              <span>⌕</span>
              <input
                aria-label="음악 검색"
                placeholder="음악·분위기 검색"
                value={musicSearch}
                onChange={(e) => setMusicSearch(e.target.value)}
              />
              <button onClick={() => audioInput.current?.click()}>
                ＋ 직접 추가
              </button>
              <input
                ref={audioInput}
                type="file"
                accept="audio/*"
                hidden
                onChange={handleAudio}
              />
            </div>
            <div className="music-tabs">
              {(
                [
                  ["all", "전체"],
                  ["trend", "트렌드"],
                  ["drive", "드라이브"],
                  ["luxury", "프리미엄"],
                  ["bright", "밝은"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  className={musicCategory === id ? "active" : ""}
                  onClick={() => setMusicCategory(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            {selectedMusic === "upload" && (
              <button
                className="uploaded-music selected"
                onClick={() => previewMusic("upload")}
              >
                <span>♫</span>
                <b>
                  {musicName}
                  <small>내 음악 · 직접 추가</small>
                </b>
                <i>{playingMusic === "upload" ? "Ⅱ" : "▶"}</i>
                <em>✓</em>
              </button>
            )}
            <div className="music-list">
              {filteredMusic.map((item) => (
                <button
                  key={item.id}
                  className={selectedMusic === item.id ? "selected" : ""}
                  onClick={() => previewMusic(item.id)}
                >
                  <span style={{ background: item.color }}>{item.icon}</span>
                  <b>
                    {item.name}
                    <small>
                      {item.genre} · {item.mood}
                    </small>
                  </b>
                  <i>{playingMusic === item.id ? "Ⅱ" : "▶"}</i>
                  <em>{item.bpm} BPM</em>
                </button>
              ))}
            </div>
            <div className="music-volume">
              <label>
                <span>
                  음악 음량 <b>{musicVolume}%</b>
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={musicVolume}
                  onChange={(e) => setMusicVolume(Number(e.target.value))}
                />
              </label>
              <button
                className={!selectedMusic ? "active" : ""}
                onClick={() => {
                  stopMusicPreview();
                  setSelectedMusic("");
                  setMusicName("");
                }}
              >
                음악 없음
              </button>
            </div>
          </section>
          <section className="inspector-section caption-editor-panel">
            <div className="inspector-title">
              <b>자동 자막</b>
              <span>Pretendard · 장면별 편집</span>
            </div>
            <label className="toggle-row caption-toggle">
              <span>
                <b>자막 사용</b>
                <small>미리보기와 최종 영상에 적용</small>
              </span>
              <input
                type="checkbox"
                checked={captionEnabled}
                onChange={(e) => setCaptionEnabled(e.target.checked)}
              />
              <i />
            </label>
            <label className="toggle-row caption-toggle caption-sync-toggle">
              <span>
                <b>음성 자동 싱크</b>
                <small>음성 길이에 맞춰 문장별 타임코드 생성</small>
              </span>
              <input
                type="checkbox"
                checked={captionSync}
                disabled={!captionEnabled}
                onChange={(e) => {
                  setCaptionSync(e.target.checked);
                  setPreviewElapsedMs(0);
                }}
              />
              <i />
            </label>
            {captionSync && (
              <div className="caption-sync-status">
                <b>SYNC</b>
                <span>{subtitleCues.length}개 문장 · {Math.round(effectiveSubtitleDurationMs / 1000)}초 음성 기준</span>
              </div>
            )}
            <label className="caption-text-field">
              <span>{captionSync ? "현재 음성 자막" : "현재 장면 자막"}</span>
              <textarea
                aria-label="현재 장면 자막"
                value={captionSync ? syncedCaption : captions[activePhoto] || ""}
                disabled={!captionEnabled || !photos.length || captionSync}
                onChange={(e) => setCaptions((current) => {
                  const next = [...current];
                  next[activePhoto] = e.target.value;
                  return next;
                })}
              />
            </label>
            <div className="caption-control-label">위치</div>
            <div className="caption-segments">
              {(["top", "middle", "bottom"] as const).map((position) => (
                <button
                  key={position}
                  className={captionPosition === position ? "active" : ""}
                  onClick={() => setCaptionPosition(position)}
                >
                  {{ top: "상단", middle: "중앙", bottom: "하단" }[position]}
                </button>
              ))}
            </div>
            <div className="caption-control-label">스타일</div>
            <div className="caption-segments">
              {(["classic", "box", "highlight"] as const).map((item) => (
                <button
                  key={item}
                  className={captionStyle === item ? "active" : ""}
                  onClick={() => setCaptionStyle(item)}
                >
                  {{ classic: "기본", box: "박스", highlight: "강조" }[item]}
                </button>
              ))}
            </div>
            <label className="caption-size-control">
              <span>크기 <b>{captionSize}px</b></span>
              <input
                type="range"
                min="20"
                max="48"
                step="2"
                value={captionSize}
                onChange={(e) => setCaptionSize(Number(e.target.value))}
              />
            </label>
          </section>
          <section className="inspector-section media-options">
            <div>
              <div className="inspector-title">
                <b>딜러 로고</b>
              </div>
              <button
                className="compact-upload"
                onClick={() => logoInput.current?.click()}
              >
                {logoUrl ? <img src={logoUrl} alt="딜러 로고" /> : "＋"}
                <span>{logoUrl ? "로고 적용됨" : "로고 선택"}</span>
              </button>
              <input
                ref={logoInput}
                type="file"
                accept="image/*"
                hidden
                onChange={handleLogo}
              />
            </div>
            <div className="music-selected-summary">
              <span>선택 음악</span>
              <b>{musicName || "없음"}</b>
            </div>
          </section>
          <section className="inspector-section brand-row">
            <label>
              <span>브랜드 색상</span>
              <input
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
              />
            </label>
            <label className="toggle-row">
              <span>
                <b>번호판 블러</b>
                <small>위치 탐지 연결 전 시안</small>
              </span>
              <input
                type="checkbox"
                checked={plateBlur}
                onChange={(e) => setPlateBlur(e.target.checked)}
              />
              <i />
            </label>
          </section>
        </aside>

        <section className="timeline-dock">
          <div className="timeline-head">
            <div>
              <b>장면 타임라인</b>
              <span>
                {videoDuration}초 · 장면당 {sceneDuration.toFixed(1)}초 ·
                드래그해서 순서 변경
              </span>
            </div>
            <div>
              <button onClick={toggleLivePreview}>
                {playing ? "■ 정지" : "▶ 미리보기"}
              </button>
              <button onClick={() => fileInput.current?.click()}>
                ＋ 장면 추가
              </button>
            </div>
          </div>
          <div className="scene-track">
            <div className="track-label">
              <span>영상</span>
              <span>자막</span>
              <span>음성</span>
              <span>음악</span>
            </div>
            <div className="track-content">
              <div className="scene-row">
                {photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    draggable
                    className={activePhoto === index ? "active" : ""}
                    onDragStart={(e) =>
                      e.dataTransfer.setData("text/photo-index", String(index))
                    }
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      reorderPhoto(
                        Number(e.dataTransfer.getData("text/photo-index")),
                        index,
                      );
                    }}
                    onClick={() => setActivePhoto(index)}
                  >
                    <img src={photo.url} alt="" />
                    <span>{index + 1}</span>
                    <small>
                      {photo.sample
                        ? SAMPLE_SCENES[index]?.[0]
                        : `${sceneDuration.toFixed(1)}초`}
                    </small>
                  </button>
                ))}
                {!photos.length && (
                  <button
                    className="empty-scene"
                    onClick={() => fileInput.current?.click()}
                  >
                    ＋ 첫 장면 추가
                  </button>
                )}
              </div>
              <div className={`caption-track ${captionEnabled && !captionSync ? "active" : "disabled"}`}>
                {photos.map((photo, index) => (
                  <input
                    key={`caption-${photo.id}`}
                    aria-label={`장면 ${index + 1} 자막`}
                    className={activePhoto === index ? "active" : ""}
                    value={captionSync
                      ? subtitleAt(subtitleCues, index * sceneDuration * 1000)
                      : captions[index] || ""}
                    disabled={!captionEnabled || captionSync}
                    onFocus={() => setActivePhoto(index)}
                    onChange={(e) => setCaptions((current) => {
                      const next = [...current];
                      next[index] = e.target.value;
                      return next;
                    })}
                  />
                ))}
                {!captionEnabled && <em>자막 꺼짐</em>}
                {captionEnabled && captionSync && <em>음성 타임코드 자동 싱크</em>}
              </div>
              <div className="audio-row">
                <div className="dynamic-wave">
                  {ttsBars.map((height, index) => (
                    <i key={index} style={{ height: `${height}%` }} />
                  ))}
                </div>
                <b>
                  {narrationName || `${voiceOptions.find((item) => item.id === voice)?.name} · TTS 약 ${estimatedTtsSeconds}초`}
                </b>
                <em>{narrationFile ? `파일 포함 · ${narrationVolume}%` : `AI 자동 생성 · ${narrationVolume}%`}</em>
              </div>
              <div className={`music-row ${selectedMusic ? "active" : ""}`}>
                <span>♫</span>
                <b>
                  {musicName ||
                    musicOptions.find((item) => item.id === selectedMusic)?.name ||
                    "배경음악 없음"}
                </b>
                {selectedMusic && (
                  <em>
                    {musicVolume}% {ducking ? "· 자동 닥킹" : ""}
                  </em>
                )}
              </div>
            </div>
          </div>
        </section>
      </section>
      {toast && (
        <div className="toast">
          <span>✓</span>
          {toast}
        </div>
      )}
    </main>
  );
}
