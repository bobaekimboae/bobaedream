// 서울오토갤러리 딜러·상사 SNS(2026-10-21 「인스타그램 또는 유튜브 있는 딜러들은 이렇게 링크 걸어줘, 매핑해봐」).
// 출처: 구글 시트 「SNS 레퍼런스」 › 인스타딜러 탭(서울오토갤러리 소속 표기가 있는 행만). 키 = `상사번호:딜러 이름`, 상사 공식 계정은 `상사번호:*`.
// 이름이 그 상사 소속딜러 명단에 있는 사람만 연결했다. 명단에 없는 사람(우진오토모빌 박재현 · 플로시모터스 릴리)은 넣지 않았다.
export type DealerSns = { instagram?: string; youtube?: string };

export const seoulAutoGallerySns: Readonly<Record<string, DealerSns>> = {
  "450548:선우혁": { instagram: "https://www.instagram.com/8289.superfast/", youtube: "https://www.youtube.com/@seonuhyeok-0304" },
  "450548:박찬민": { instagram: "https://www.instagram.com/car.the.chan/" },
  "450548:송금배": { instagram: "https://www.instagram.com/songkeumbae/" },
  "450548:이혜성": { instagram: "https://www.instagram.com/car_hyesung/" },
  "450560:한지훈": { instagram: "https://www.instagram.com/bi.turbo/", youtube: "https://www.youtube.com/channel/UC5HplMJqw3WCWhdJ9ll33xA" },
  "450560:장지수": { instagram: "https://www.instagram.com/jang.zilla/" },
  "450560:주한솔": { instagram: "https://www.instagram.com/aka_flossy/" },
  "450560:*": { instagram: "https://www.instagram.com/flossy_motors/", youtube: "https://www.youtube.com/@flossy717" },
  "450461:공지만": { instagram: "https://www.instagram.com/viarosso_jm/" },
  "450461:강심균": { instagram: "https://www.instagram.com/viarosso_richard/" },
  "450461:*": { instagram: "https://www.instagram.com/viarosso_official/", youtube: "https://www.youtube.com/@viarossotv" },
  "450564:정지원": { instagram: "https://www.instagram.com/a1_wonstar/", youtube: "https://www.youtube.com/@A1_wonstar" },
  "450564:*": { instagram: "https://www.instagram.com/a1international1/", youtube: "https://www.youtube.com/channel/UC9JSFgYLqrrfE9Whs7o_6zw" },
  "450541:정다인": { instagram: "https://www.instagram.com/dy_neer/" },
  "450573:장금용": { instagram: "https://www.instagram.com/jangs_life/" },
  "450573:장정훈": { instagram: "https://www.instagram.com/jjangji_25/" },
  "450557:*": { instagram: "https://www.instagram.com/gold_supercar/", youtube: "https://www.youtube.com/channel/UCoo89uDNcgQBAIN5lUGQC_A" },
};

// 딜러 본인 계정이 있으면 그것을, 없으면 상사 공식 계정을 쓴다.
export function dealerSnsLinks(shopNo: string, name: string): { links: DealerSns; shop: boolean } | null {
  const own = seoulAutoGallerySns[`${shopNo}:${name}`];
  if (own) return { links: own, shop: false };
  const shop = seoulAutoGallerySns[`${shopNo}:*`];
  return shop ? { links: shop, shop: true } : null;
}

// 화면 표시용 짧은 주소: instagram.com/bi.turbo · youtube.com/@flossy717 · 채널 ID 주소는 「유튜브 채널」
export function snsLabel(url: string): string {
  const u = new URL(url);
  const path = decodeURIComponent(u.pathname).replace(/\/$/, "");
  const host = u.hostname.replace(/^www\./, "");
  if (path.startsWith("/channel/")) return "유튜브 채널";
  return `${host}${path}`;
}
