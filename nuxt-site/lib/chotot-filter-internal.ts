// src/ChoTotFilterSheet.tsx 안에서 export 되지 않은 상수의 사본(ChoTotFilterSheet · ChoTotQuickFilterSheet 가 함께 씀).
// export 된 것(vehicleCategoryOptions · emptyChoTotFilters · 형식)은 원본에서 바로 import 한다.
import { asset as dataAsset } from "@proto/data";
import type { ChoTotFilterFocus } from "@src/ChoTotFilterSheet";

export type View = "root" | "color" | "origin" | "model";

export const makerOptions = ["현대", "기아", "제네시스", "BMW", "벤츠", "아우디", "포르쉐", "랜드로버", "렉서스", "벤틀리", "페라리", "람보르기니", "롤스로이스", "맥라렌", "애스턴마틴", "코닉세그", "리막", "루시드", "폴스타", "애큐라", "DS", "마이바흐"];
export const modelsByMaker: Record<string, string[]> = {
  현대: ["그랜저 GN7", "아이오닉 5"],
  기아: ["카니발 4세대", "쏘렌토 MQ4"],
  제네시스: ["G80 RG3"],
  BMW: ["3시리즈", "5시리즈", "X1", "X3", "1시리즈"],
  벤츠: [
    "A-클래스", "B-클래스", "C-클래스", "CL-클래스", "CLA-클래스", "CLE-클래스", "CLK-클래스", "CLS-클래스",
    "E-클래스", "EQA", "EQB", "EQC", "EQE", "EQS", "G-클래스", "GL-클래스", "GLA-클래스", "GLB-클래스",
    "GLC-클래스", "GLE-클래스", "GLK-클래스", "GLS-클래스", "M-클래스", "R-클래스", "S-클래스",
    "SL-클래스", "SLC-클래스", "SLK-클래스", "SLR", "SLS AMG", "AMG GT", "SEL/SEC", "V-클래스",
    "스프린터", "190-클래스", "기타",
  ],
  아우디: ["A6 3.0 TDI 콰트로"],
  포르쉐: ["718 박스터"],
  랜드로버: ["레인지로버 스포츠"],
  렉서스: ["ES300h"],
  벤틀리: ["컨티넨탈 GT"],
  페라리: ["296 GTB"],
  람보르기니: ["우라칸 EVO"],
  롤스로이스: ["팬텀"],
  맥라렌: ["570S", "720S", "아투라"],
  애스턴마틴: ["DB11", "밴티지", "DBX"],
  코닉세그: ["제스코", "레제라", "아제라"],
  리막: ["네베라"],
  루시드: ["에어"],
  폴스타: ["폴스타 2", "폴스타 3"],
  애큐라: ["NSX", "TLX"],
  DS: ["DS 7", "DS 9"],
  마이바흐: ["S클래스 마이바흐", "GLS 마이바흐"],
};
export const colorOptions = ["흰색", "검정", "회색", "은색", "빨강", "노랑", "파랑", "초록"];
export const originOptions = ["국산", "독일", "일본", "영국", "이탈리아"];

// 원본 asset(path) = `${BASE_URL}assets/ui/${path}` — 공용 asset()으로 같은 주소를 만든다
export const uiAsset = (path: string) => dataAsset(`ui/${path}`);

export const quickFilterTitles: Record<ChoTotFilterFocus, string> = {
  category: "차량 카테고리", price: "가격", seats: "좌석 수", maker: "제조사", model: "모델", year: "연식", condition: "차량 상태", mileage: "주행거리", owners: "소유자 수", transmission: "변속기", fuel: "연료", color: "색상", origin: "원산지", body: "차체 유형", video: "숏폼매물", seller: "판매자",
};
