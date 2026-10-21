// 서울오토갤러리 딜러 인스타그램 매물 게시물(2026-10-21 「한지훈 딜러 sns 매물에 여기 인스타 매물 20대 임베드해라」).
// 출처: instagram.com/bi.turbo 공개 프로필 그리드(로그인 없이 보이는 최신 12개). 게시물 코드·종류·게시일만 옮기고 사진·글은 저장하지 않는다.
// 화면은 인스타그램 공식 퍼가기(instagram.com/p/<코드>/embed)로 그린다. 로그인 후 8개를 더 받아 20개로 채울 예정.
export type DealerInstagramPost = { code: string; kind: "photo" | "reel"; date: string };

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
};

export const instagramPostsFor = (shopNo: string, name: string) => dealerInstagramPosts[`${shopNo}:${name}`] ?? [];
