// 「내 프로젝트에서 가져오기」(원본 Bring in from my projects): 사진 8장 이상 · 차량 정보가 이미 있는 매물.
// 지금은 보배드림 서울오토갤러리 실매물 중 사진이 8장 이상인 2대(시트 값 그대로). 서버 연결 뒤에는 로그인한 딜러의 등록 매물을 불러온다.
import { sitePath } from "./site";
import { emptyDetails, type Details } from "./types";

export type Project = { id: string; title: string; photos: string[]; details: Details; dealer: string; company: string; date: string };

const pics = (dir: string, prefix: string, n: number, ext: string) => Array.from({ length: n }, (_, i) => sitePath("assets", "cars", "seoul-autogallery-v01", dir, `${prefix}-${dir === "rr" ? String(i + 1).padStart(2, "0") : i + 1}.${ext}`));

export const PROJECTS: Project[] = [
  {
    id: "sag-24",
    title: "랜드로버 레인지로버",
    photos: pics("rr", "rr", 17, "jpg"),
    details: { ...emptyDetails(), make: "랜드로버", model: "레인지로버", year: "2019", mileage: "52000", transmission: "auto", fuel: "gasoline", drivetrain: "awd", body: "suv", color: "beige", condition: "used", dealer: "투제이모터웍스", address: "서울 서초구 · 서울오토갤러리" },
    dealer: "김태규", company: "투제이모터웍스", date: "2026.10.15",
  },
  {
    id: "sag-1",
    title: "BMW M3",
    photos: pics("m3-original", "m3", 20, "webp"),
    details: { ...emptyDetails(), make: "BMW", model: "M3", year: "2023", mileage: "22000", price: "9595", transmission: "auto", fuel: "gasoline", drivetrain: "awd", body: "sedan", condition: "used", dealer: "디앤디플러스", address: "서울 서초구 · 서울오토갤러리" },
    dealer: "박상용", company: "디앤디플러스", date: "2026.10.14",
  },
];
