// 동처띠(懂车帝 9.2.9) 발행 화면(NewPublisherActivityV2) 8개 글 종류 — 보배드림 동처띠 글쓰기 키트 공용 자료.
// 실측 2026-11-03 POCO 1080×2400 adb: 动态 · 懂车分 · 提问 · 视频 · 长帖 · 卖车帖 · 车主价 · 能耗.
// 커뮤니티 기본 글쓰기는 치지직 방식(public/community)이고, 이 키트는 따로 관리한다.
import { reactive } from "vue";
import type { Kind } from "./route";
import type { CarModel } from "./data";

export const KIND_LABEL: Record<Kind, string> = {
  dynamic: "일상", review: "리뷰", ask: "질문", video: "영상", long: "긴 글", sell: "내 차 팔기", price: "구매가", fuel: "연비·전비",
};
/** 원본 탭 이름(대조용) */
export const KIND_ORIGIN: Record<Kind, string> = {
  dynamic: "动态", review: "懂车分", ask: "提问", video: "视频", long: "长帖", sell: "卖车帖", price: "车主价", fuel: "能耗",
};

/** 화제(话题) — 원본은 주간 인기 화제 2개를 칩으로 보여 주고 「添加话题 ▸」로 전체 목록을 연다 */
export const TOPICS = [
  { id: "t1", name: "BMW iX3, 6천만 원대 시작 값어치 있나?", hot: true, posts: 18420 },
  { id: "t2", name: "F1 새 챔피언 탄생? 멕시코 GP 결승 직관", hot: false, posts: 9310 },
  { id: "t3", name: "내 차 연비 자랑", hot: false, posts: 22190 },
  { id: "t4", name: "첫 차 고르기 고민", hot: false, posts: 15870 },
  { id: "t5", name: "출고 인증", hot: false, posts: 30544 },
  { id: "t6", name: "겨울철 전기차 주행거리", hot: true, posts: 7720 },
  { id: "t7", name: "블랙박스 영상 모음", hot: false, posts: 41022 },
  { id: "t8", name: "튜닝 · 드레스업", hot: false, posts: 12056 },
];
/** 차량 모임(圈子) — 원본 「关联圈子 ▸」 + 최근 본 차 칩 */
export const CIRCLES = ["투싼", "테슬라 모델 Y", "BMW G 310 R", "아반떼", "쏘렌토", "그랜저", "캐스퍼", "아이오닉 5", "카니발", "GV80"];

/** 내용 성격 표시(内容自主声明) — 원본 5개 그대로 */
export const CLAIMS = ["AI로 만든 내용 포함", "꾸며 낸 연출 포함", "광고 · 홍보 내용 포함", "개인 의견, 참고만", "표시 필요 없음"];

/** 표정(원본 「最近使用 · 全部表情」) — 시스템 이모지로 대신한다 */
export const EMOJI_RECENT = ["👍", "😱", "😊", "🥹", "🥒"];
export const EMOJI_ALL = "😀😍🤩😎😂🤣😭😡🤔😅😏😉😘🥰😮😴🤯🥳😤😬🙄😇🤗🤫👏🙏💪🔥💯❤️🚗🏎️🛻🚙⛽🔋⚡🛞🔧🎉".match(/\p{Extended_Pictographic}️?/gu) ?? [];

/** 차량 색상(卖车帖 车身颜色 13개, 원본 순서) */
export const CAR_COLORS = ["흰색", "검정", "진회색", "은회색", "갈색", "빨강", "파랑", "샴페인", "주황", "노랑", "초록", "보라", "기타"];
/** 부품 종류(长帖 改装 「选择配件类型」) */
export const PART_TYPES = ["휠", "타이어", "브레이크", "서스펜션", "배기", "랩핑", "직접 입력"] as const;
export const PART_METRIC: Record<string, string> = { 휠: "지름 / J값 / ET값", 타이어: "폭 / 편평비 / 인치", 브레이크: "캘리퍼 · 디스크 규격", 서스펜션: "차고 조절 범위", 배기: "구성 · 재질", 랩핑: "색상 · 필름 브랜드", "직접 입력": "규격" };

export type OwnerPrice = { car: CarModel | null; month: string; nake: string; total: string; city: string; pay?: "full" | "loan"; dealer?: string; note?: string };
export type PartCard = { type: string; brand: string; metric: string; price: string };
export type Vote = { title: string; multi: boolean; options: string[]; until: string };
export type Media = { kind: "image" | "video"; src: string; cover?: string; duration?: number };

/** 등록한 글(서버 연결 전이라 이 브라우저에만 둔다) */
export type Post = {
  id: string; kind: Kind; createdAt: string; title: string; body: string; media: Media[];
  car?: CarModel | null; topic?: string; circle?: string; claim?: string; city?: string; vote?: Vote | null;
  ownerPrice?: OwnerPrice | null; parts?: PartCard[]; sell?: Record<string, string>; extra?: Record<string, string>;
};
const KEY = "bbm-dcd-posts-v1";
const read = (): Post[] => { try { return JSON.parse(localStorage.getItem(KEY) || "[]") as Post[]; } catch { return []; } };
export const posts = (kind?: Kind) => read().filter((p) => !kind || p.kind === kind);
export const postById = (id: string) => read().find((p) => p.id === id) ?? null;
export const savePost = (p: Post) => {
  const all = [p, ...read().filter((x) => x.id !== p.id)];
  // 큰 사진이 많으면 저장 공간이 모자라므로 오래된 글부터 뺀다
  for (let n = all.length; n > 0; n -= 1) {
    try { localStorage.setItem(KEY, JSON.stringify(all.slice(0, n))); return true; } catch { /* 공간 부족 → 줄여서 다시 */ }
  }
  return false;
};

/** 임시저장(원본: 종류마다 초안 1건 · 「草稿箱」) */
const DKEY = "bbm-dcd-drafts-v1";
type Drafts = Partial<Record<Kind, { at: string; payload: unknown }>>;
const rd = (): Drafts => { try { return JSON.parse(localStorage.getItem(DKEY) || "{}") as Drafts; } catch { return {}; } };
export const getDraft = <T>(k: Kind) => (rd()[k] as { at: string; payload: T } | undefined) ?? null;
export const saveDraft = (k: Kind, payload: unknown) => {
  const all = rd(); all[k] = { at: new Date().toISOString(), payload };
  try { localStorage.setItem(DKEY, JSON.stringify(all)); return true; } catch { return false; }
};
export const deleteDraft = (k: Kind) => { const all = rd(); delete all[k]; localStorage.setItem(DKEY, JSON.stringify(all)); };
export const allDrafts = () => rd();

/** 글쓰기 머리 상태(등록 버튼 · 미리보기 · 임시저장함) — 종류별 화면이 채운다 */
export const head = reactive({ canPost: false, hasContent: false });

/** 파일 → dataURL */
export const readFile = (f: File) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result || "")); r.onerror = rej; r.readAsDataURL(f); });

/** 「帮我写」 초안(서버 AI 연결 전): 고른 차 · 사진 수 · 종류로 문장을 만든다. 사진 속 사실은 지어내지 않는다. */
export const aiDraft = (kind: Kind, o: { car?: CarModel | null; photos?: number; title?: string; sell?: Record<string, string> }) => {
  const car = o.car ? `${o.car.brand} ${o.car.model}` : "제 차";
  if (kind === "sell") {
    const s = o.sell ?? {};
    return `${car}${o.car?.trim ? ` ${o.car.trim}` : ""} 팝니다.\n${s.month ? `${s.month} 등록, ` : ""}${s.km ? `주행 ${s.km}, ` : ""}${s.color ? `${s.color}, ` : ""}${s.owners ? `소유자 변경 ${s.owners}` : ""}\n직접 타던 차라 관리 내역을 자세히 알려 드릴 수 있어요. 궁금한 점은 댓글이나 채팅으로 물어봐 주세요.`;
  }
  if (kind === "ask") return `${car} 타시는 분들께 여쭤봅니다.\n궁금한 점: \n지금 상황: \n경험 있으신 분들 답 부탁드려요!`;
  return `${car} 사진 ${o.photos ?? 0}장 올려요.\n오늘 찍은 사진이에요. 각도를 바꿔 가며 찍어 봤는데 어떤가요?\n평소에 어떤 각도로 사진 찍으시는지 댓글로 알려 주세요.`;
};
