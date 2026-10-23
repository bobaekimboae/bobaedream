import { useState } from "react";
import { asset } from "../data";

// 상사 탭 검색바 + ㄱㄴㄷ 색인(2026-10-23 「상사에 검색바랑 ㄱㄴㄷ」).
// 검색은 상사명 · 대표 · 호수(띄어쓰기 · (주) 무시)와 초성(예: ㅋㅁㅇㅌ → 카메이트)을 함께 찾는다.
// 색인은 상사명 첫 글자의 초성(쌍자음은 홑자음으로), 영문은 A-Z, 숫자는 0-9로 묶는다.
const CHOSEONG = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const SINGLE: Record<string, string> = { "ㄲ": "ㄱ", "ㄸ": "ㄷ", "ㅃ": "ㅂ", "ㅆ": "ㅅ", "ㅉ": "ㅈ" };
export const COMPANY_INDEX = ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ", "A-Z", "0-9"] as const;

const choseongOf = (char: string) => {
  const code = char.charCodeAt(0) - 0xac00;
  return code >= 0 && code < 11172 ? CHOSEONG[Math.floor(code / 588)] : char;
};
export const choseongString = (text: string) => [...text].map(choseongOf).join("");
export function companyIndexOf(name: string) {
  const first = name.replace(/\(주\)|\(유\)|주식회사|\s/g, "")[0] ?? "";
  if (/[0-9]/.test(first)) return "0-9";
  if (/[a-z]/i.test(first)) return "A-Z";
  const cho = choseongOf(first);
  return SINGLE[cho] ?? cho;
}
const norm = (text: string) => text.toLowerCase().replace(/\(주\)|\(유\)|주식회사|\s/g, "");
const isChoseongQuery = (q: string) => q.length > 0 && [...q].every((char) => CHOSEONG.includes(char));

export function matchCompany(query: string, name: string, extras: string[]) {
  const q = norm(query);
  if (!q) return true;
  if (isChoseongQuery(q)) return choseongString(norm(name)).includes(q);
  return [name, ...extras].some((text) => norm(text).includes(q));
}

// 딜러 검색(2026-10-23 「딜러도 초성하자」): 이름 · 상사명을 찾고, 자음만 넣으면 이름 · 상사명의 초성으로 찾는다(ㄱㅁㅅ → 김민석).
export function matchDealer(query: string, name: string, company: string) {
  const q = norm(query);
  if (!q) return true;
  if (isChoseongQuery(q)) return choseongString(norm(name)).includes(q) || choseongString(norm(company)).includes(q);
  return norm(name).includes(q) || norm(company).includes(q);
}

export function useCompanyFinder() {
  const [query, setQuery] = useState("");
  const [letter, setLetter] = useState("");
  return { query, setQuery, letter, setLetter };
}

export function CompanyFinder({ finder, names }: { finder: ReturnType<typeof useCompanyFinder>; names: string[] }) {
  const counts = new Map<string, number>();
  for (const name of names) counts.set(companyIndexOf(name), (counts.get(companyIndexOf(name)) ?? 0) + 1);
  const { query, setQuery, letter, setLetter } = finder;
  return (
    <>
      <label className="sag-dealer-search sag-company-search">
        <img src={asset("bbm/header-search.svg")} alt="" aria-hidden="true" />
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="상사명 · 대표 · 호수 · 초성으로 검색" aria-label="상사 검색" />
        {query ? <button type="button" aria-label="검색어 지우기" onClick={() => setQuery("")}>×</button> : null}
      </label>
      <div className="sag-dealer-shops sag-company-index" role="group" aria-label="상사명 첫 글자">
        <button type="button" aria-pressed={!letter} className={!letter ? "is-selected" : ""} onClick={() => setLetter("")}>전체</button>
        {COMPANY_INDEX.map((item) => {
          const count = counts.get(item) ?? 0;
          return (
            <button key={item} type="button" disabled={!count} aria-pressed={letter === item} className={letter === item ? "is-selected" : ""} aria-label={`${item} 상사 ${count}곳`} onClick={() => setLetter(letter === item ? "" : item)}>{item}</button>
          );
        })}
      </div>
    </>
  );
}
