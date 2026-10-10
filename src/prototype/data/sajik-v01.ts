// 사직오토랜드(부산 연제구) 실데이터 v01 — 2026-10-10 「사직은 중고차에 넣어라」
// 도이치오토월드 폴더(Drive 1imQqamfHupcBJ6gRYlVrVOq9d1YwMiV9)에 함께 있던 시트 「도이치오토월드」 탭의 부산 사직오토랜드 매물 4대. 별도 카테고리 없이 중고차 목록에 넣는다.
// 상사명 · 딜러명은 시트의 실제 값, 전화번호 · 차량번호 · 원본 URL · 매물번호는 저장하지 않는다. 판매중 대수(stock)는 시트 전체에서 같은 상사·딜러의 실제 대수다.
import type { DeutschAutoworldRow } from "./deutsch-autoworld-v01";

export const sajikRows: DeutschAutoworldRow[] = [
  {"number": 1, "maker": "볼보", "model": "XC40", "generation": "", "trim": "B4 울트라 다크", "year": 2026, "mileage": 427, "fuel": "가솔린", "price": 4300, "company": "(주)아이언모터스 볼보", "dealer": "최정원", "stock": 65, "posted": "22분 전", "body": "SUV", "origin": "스웨덴"},
  {"number": 2, "maker": "볼보", "model": "XC90", "generation": "2세대", "trim": "B6 울트라 브라이트", "year": 2026, "mileage": 257, "fuel": "가솔린", "price": 8500, "company": "(주)아이언모터스 볼보", "dealer": "최정원", "stock": 65, "posted": "39분 전", "body": "SUV", "origin": "스웨덴"},
  {"number": 3, "maker": "볼보", "model": "XC90", "generation": "2세대", "trim": "B6 울트라 브라이트", "year": 2026, "mileage": 116, "fuel": "가솔린", "price": 8500, "company": "(주)아이언모터스 볼보", "dealer": "최정원", "stock": 65, "posted": "16분 전", "body": "SUV", "origin": "스웨덴"},
  {"number": 4, "maker": "벤츠", "model": "E클래스", "generation": "W213", "trim": "E220d 4MATIC 익스클루시브", "year": 2017, "mileage": 141440, "fuel": "디젤", "price": 1890, "company": "하이엔드모터스", "dealer": "배형빈", "stock": 4, "posted": "33분 전", "body": "세단", "origin": "독일"},
];
