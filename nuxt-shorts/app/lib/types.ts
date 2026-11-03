// 숏폼 보기 화면 계약(shorts-api GET /api/shorts 응답의 data[] 와 같은 모양, docs/shorts-api.md)

export type ShortVideo = { kind: "file" | "hls"; url: string; id?: undefined } | { kind: "youtube"; id: string; url: string };

export type TourKey = "tour-walk" | "tour-feature" | "tour-dash" | "tour-seat" | "tour-pov" | "tour-boot" | "tour-tyre" | "tour-engine";

export type Chapter = { key: TourKey; from: number; to: number };

export type ShortItem = {
  id: string;
  title: string;
  maker: string | null;
  model: string | null;
  year: number | null;
  registered: string | null;
  mileage: string | null;
  fuel: string | null;
  transmission: string | null;
  price: string | null;
  region: string | null;
  complex: string | null;
  hashtags: string[];
  status: string | null;
  video: ShortVideo;
  poster: string | null;
  images: { url: string; type: string | null }[];
  likes: number;
  liked: boolean;
  views: number;
  seller: {
    id: string | null;
    name: string | null;
    company: string | null;
    type: "dealer" | "private";
    avatar: string | null;
    selling: number;
    sold: number;
    phone: string | null;
    can_inquire: boolean;
  };
  updated_at: string | null;
  chapters: Chapter[];
};

export type Page = { items: ShortItem[]; next: string | null };

export type SourceKind = "api" | "live" | "snapshot";
