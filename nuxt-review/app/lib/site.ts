// 사이트 공용 파일 주소. 코드에 「/assets/」 글자를 쓰지 않도록 조각으로 이어 붙인다(배포 단계가 그 글자를 바꾸기 때문).
import { sitePath, icon } from "@kit/site";
export { sitePath, icon };
/** public/assets 아래 파일 */
export const asset = (p: string) => (p ? sitePath(["as", "sets"].join(""), p) : "");
/** public 아래 파일(커뮤니티 아바타 등) */
export const site = (p: string) => (p ? sitePath(p) : "");

/** 프사: 데이터에는 파일 이름(avatar-03.svg)만 둔다. 예전 전체 경로가 와도 파일 이름만 써서 커뮤니티 프사 폴더로 잇는다. */
export const avatarUrl = (a: string) => sitePath("community", ["as", "sets"].join(""), "profile-avatars", a.split("/").pop() || "avatar-01.svg");
