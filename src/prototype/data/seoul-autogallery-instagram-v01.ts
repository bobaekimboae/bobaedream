// 서울오토갤러리 딜러 인스타그램 매물 게시물(2026-10-21 「한지훈 딜러 sns 매물에 여기 인스타 매물 20대 임베드해라」).
// 출처: instagram.com/bi.turbo 공개 프로필 그리드(로그인 없이 보이는 최신 12개). 게시물 코드·종류·게시일만 옮기고 사진·글은 저장하지 않는다.
// 기본은 인스타그램 공식 퍼가기(instagram.com/p/<코드>/embed)로 그리고, 내부 재생 요청을 받은 공개 릴스는 최적화한 정적 영상으로 그린다.
export type DealerInstagramPost = {
  code: string;
  kind: "photo" | "reel";
  date: string;
  /** 보배드림 안에서 바로 재생하는, 판매자가 공개한 릴스의 정적 사본. */
  video?: string;
  poster?: string;
};

export const dealerInstagramPosts: Readonly<Record<string, readonly DealerInstagramPost[]>> = {
  "450560:한지훈": [
    { code: "Det0BkRk_IQ", kind: "photo", date: "2026-10-20" },
    { code: "DesaIwBzGM_", kind: "reel", date: "2026-10-19" },
    { code: "Deq-gDTk1I6", kind: "photo", date: "2026-10-19" },
    { code: "DeqgDyixgJG", kind: "reel", date: "2026-10-18" },
    { code: "DeohRmgk5dZ", kind: "photo", date: "2026-10-18" },
    { code: "DenduxQTKvk", kind: "reel", date: "2026-10-17" },
    { code: "DemD63tk5Xt", kind: "photo", date: "2026-10-17" },
    { code: "DelIBHyzwkM", kind: "reel", date: "2026-10-16" },
    { code: "DejgndXkyEN", kind: "photo", date: "2026-10-16" },
    { code: "DUE5G6bExdB", kind: "photo", date: "2026-01-28" },
    { code: "DNmdHVZT8qZ", kind: "photo", date: "2025-08-20" },
    { code: "DLhTZMOxmV1", kind: "photo", date: "2025-06-30" },
  ],
  // 장지수(@jang.zilla) 공개 릴스 탭 최신 12개(2026-10-21 「인스타 릴스 임베드로 피드 50개 등록해」 → 「장지수 먼저 50개」 → 로그인 없이 보이는 12개로 「배포해라」).
  // 게시일은 게시물 코드에서 계산(코드 → 미디어 번호 → 시각). 로그인 후 38개를 더 받아 50개로 채울 예정.
  "450560:장지수": [
    { code: "Delb1qPBh4b", kind: "reel", date: "2026-10-17", video: "dealer-instagram/450560-3/Delb1qPBh4b.mp4", poster: "dealer-instagram/450560-3/Delb1qPBh4b.webp" },
    { code: "DeeIr1vhNWb", kind: "reel", date: "2026-10-14", video: "dealer-instagram/450560-3/DeeIr1vhNWb.mp4", poster: "dealer-instagram/450560-3/DeeIr1vhNWb.webp" },
    { code: "DeQid-ppZhZ", kind: "reel", date: "2026-10-09", video: "dealer-instagram/450560-3/DeQid-ppZhZ.mp4", poster: "dealer-instagram/450560-3/DeQid-ppZhZ.webp" },
    { code: "DeJrAoPpaOI", kind: "reel", date: "2026-10-06", video: "dealer-instagram/450560-3/DeJrAoPpaOI.mp4", poster: "dealer-instagram/450560-3/DeJrAoPpaOI.webp" },
    { code: "Dd_LfdfJQVB", kind: "reel", date: "2026-10-02" },
    { code: "Dd3mWAZpMPj", kind: "reel", date: "2026-09-29" },
    { code: "DdyHCv6JKDI", kind: "reel", date: "2026-09-27" },
    { code: "DdqDB2cpGl5", kind: "reel", date: "2026-09-24" },
    { code: "DdjNX6BPnse", kind: "reel", date: "2026-09-21" },
    { code: "DddVlPCJcHb", kind: "reel", date: "2026-09-19" },
    { code: "DdYvJUbJJ8t", kind: "reel", date: "2026-09-17" },
    { code: "DdTgao5JG4u", kind: "reel", date: "2026-09-15" },
  ],
  // 조이모터스(@e_joymotors24) 공개 프로필 최신 12개(2026-10-21 「인스타 릴스 매물 임베드시켜라, 피드와 매물 두곳 다」): 릴스 10 · 사진 2(고정 글)
  "joy:이지유": [
    { code: "DM7UiB5xc2z", kind: "reel", date: "2025-08-04" },
    { code: "DMr87cIxS5O", kind: "reel", date: "2025-07-29" },
    { code: "DMZ2kn-xFl-", kind: "reel", date: "2025-07-22" },
    { code: "DMM9G3zxAjQ", kind: "reel", date: "2025-07-17" },
    { code: "DL82aEKRzpU", kind: "reel", date: "2025-07-10" },
    { code: "DLrHkYpThmv", kind: "reel", date: "2025-07-03" },
    { code: "DLhKX0dPibt", kind: "reel", date: "2025-06-30" },
    { code: "DLWyr42vsqo", kind: "reel", date: "2025-06-26" },
    { code: "DLHDcdJvgfs", kind: "reel", date: "2025-06-19" },
    { code: "DK_xzcfP27i", kind: "reel", date: "2025-06-17" },
    { code: "C-106Jxytag", kind: "photo", date: "2024-08-18" },
    { code: "C-1w3puSekL", kind: "photo", date: "2024-08-18" },
  ],
};

export const instagramPostsFor = (shopNo: string, name: string) => dealerInstagramPosts[`${shopNo}:${name}`] ?? [];

export const instagramHandleFor = (shopNo: string, name: string) => ({ "450560:한지훈": "bi.turbo", "joy:이지유": "e_joymotors24", "450560:장지수": "jang.zilla" } as Record<string, string>)[`${shopNo}:${name}`] ?? "";
