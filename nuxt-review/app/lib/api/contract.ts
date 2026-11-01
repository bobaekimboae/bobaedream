// 커뮤니티 리뷰 · 연비 API 계약(화면 쪽 타입). 서버 계약 원본 = docs/community-review-api.md · community-api/openapi.yaml (Laravel 12 · PHP 8.4).
// 이름 · 모양을 바꿀 때는 세 곳(이 파일 · openapi.yaml · Laravel Resource)을 함께 바꾼다.
import type { Comment, FuelPost, Review } from "../data";

export type Board = "review" | "fuel";

/** GET /api/community/me — 로그인 사용자와 권한(서버가 정책으로 계산해 내려줌) */
export type Me = {
  id: number | null;
  nickname: string;
  avatar: string;
  /** 서버 정책 결과: 글쓰기 · 댓글 · 반응 가능 여부(로그인 · 정지 · 휴면 반영) */
  can: { post: boolean; comment: boolean; react: boolean };
};

/** 글 한 건의 권한(PostResource.can) — 수정 · 삭제 버튼은 이 값으로만 보인다 */
export type PostCan = { update: boolean; delete: boolean; report: boolean };

export type Paged<T> = { data: T[]; meta: { next_cursor: string | null; total: number } };

/** POST /api/community/{board}/posts — 리뷰 등록 본문(StoreReviewRequest) */
export type ReviewInput = {
  model_id: string;
  owner: boolean;
  purchase?: { month: string; city: string; price: number; paid?: number | null; metric: number } | null;
  ratings: Record<string, number>; // 0.5 단위 0.5~5.0, 동력 방식별 필수 항목은 서버가 다시 검사
  body: string; // 30자 이상 5000자 이하
  cover_upload_id?: string | null;
};
/** POST /api/community/fuel/posts — 연비 등록 본문(StoreFuelRequest) */
export type FuelInput = {
  model_id: string;
  title?: string | null; // 30자 이하
  body: string; // 1~2000자
  city: string; // 17개 시 · 도
  odometer_km?: number | null;
  fuel_km_per_l?: number | null; // 내연 · 하이브리드 · 플러그인
  energy_km_per_kwh?: number | null; // 전기 · 플러그인 · 주행거리 연장
  full_charge_km?: number | null; // 전기
  temperature_c?: number | null; // 전기, 기본 15
  upload_ids?: string[];
};

/** GET · PUT · DELETE /api/community/{board}/draft — 게시판마다 한 사람 1건(원본 「发现您有○○的懂车分草稿」) */
export type Draft<T> = { board: Board; model_id: string; model_name: string; payload: T; updated_at: string };

export type ReactionKind = "like" | "dislike" | "bookmark";

export interface CommunityApi {
  me(): Promise<Me>;
  listReviews(): Promise<Review[]>;
  listFuel(): Promise<FuelPost[]>;
  createReview(input: ReviewInput, view: Review): Promise<Review>;
  createFuel(input: FuelInput, view: FuelPost): Promise<FuelPost>;
  deletePost(board: Board, id: string): Promise<void>;
  createComment(board: Board, postId: string, body: string): Promise<Comment>;
  deleteComment(board: Board, postId: string, commentId: string): Promise<void>;
  react(board: Board, postId: string, kind: ReactionKind, on: boolean): Promise<void>;
  getDraft<T>(board: Board): Promise<Draft<T> | null>;
  saveDraft<T>(board: Board, modelId: string, modelName: string, payload: T): Promise<void>;
  deleteDraft(board: Board): Promise<void>;
}
