export type TruckFormatGroup = {
  name: string;
  subtypes: readonly string[];
};

// 엔카 화물·특장차 형식/세부형식 원문 기준. 오탈자처럼 보이는 표기도 원문을 보존한다.
export const truckFormatCatalog = [
  { name: "카고(화물)트럭", subtypes: ["카고(화물)트럭", "파워게이트", "트랜스/와이드 파워게이트"] },
  {
    name: "윙바디/탑",
    subtypes: [
      "윙바디", "윙바디 파워게이트", "상승 윙바디", "저상형 윙바디", "냉동윙", "냉장윙", "보냉윙", "보온윙",
      "내장탑", "상승내장탑", "내장탑 파워게이트", "저상형 내장탑", "저상형 내장탑 파워게이트", "익스(하이)내장탑",
      "익스(하이)내장탑 파워게이트", "냉동탑", "냉동탑 파워게이트", "익스(하이)냉동탑", "익스(하이)냉동탑 파워게이트",
      "저상형 냉동탑", "냉장탑", "냉장탑 파워게이트", "익스(하이)냉장탑", "익스(하이)냉장탑 파워게이트",
      "저상형 냉장탑", "저상형 냉장탑 파워게이트", "보냉탑", "냉온장탑", "다용도탑", "씨티/워크스루밴",
      "이동/광고/응급차", "이동식 목욕차", "기타",
    ],
  },
  { name: "버스", subtypes: ["버스", "기타"] },
  { name: "덤프/건설/중기", subtypes: ["덤프", "레미콘", "지게차", "굴삭기", "기타"] },
  { name: "크레인 형태", subtypes: ["바가지차", "사다리차", "오가크레인", "집게차", "카고크레인", "활선차(고소작업)", "기타"] },
  {
    name: "탱크로리",
    subtypes: ["LPG/LNG탱크로리", "버큠로리", "사료운반차", "살수차", "유류/액상탱크로리", "이동방제차", "소맥분/분말탱크로리", "특수/케미컬(VOC,테플론)탱크로리", "기타"],
  },
  { name: "캠핑카/캠핑 트레일러", subtypes: ["캠핑카", "캠핑트레일러"] },
  {
    name: "폐기/음식물수송",
    subtypes: ["암롤/롤온", "압착진개", "압축진개", "진개덤프", "음식물수거", "노면청소차", "준설차", "재활용품수집차", "워킹플로어", "톱밥운반차", "기타"],
  },
  { name: "활어차", subtypes: ["활어차"] },
  { name: "차량견인/운송", subtypes: ["셀프로더", "언더리프트", "카케리어", "기타"] },
  { name: "트렉터", subtypes: ["트렉터"] },
  {
    name: "트레일러",
    subtypes: ["LPG/LNG트레일러", "곡물트레일러", "덤프트레일러", "로우베드/릴리리", "벌크시멘트트레일러", "윙트레일러", "유류/액상탱크트레일러", "컨테이너 샤시", "평판트레일러", "기타"],
  },
  { name: "기타", subtypes: ["기타"] },
] as const satisfies readonly TruckFormatGroup[];

export const truckSubtypesFor = (format: string | null): readonly string[] => truckFormatCatalog.find((group) => group.name === format)?.subtypes ?? [];

export const normalizeTruckFormatSelection = (format: string | null, subtype: string | null) => {
  const safeFormat = truckFormatCatalog.some((group) => group.name === format) ? format : null;
  const safeSubtype = safeFormat && truckSubtypesFor(safeFormat).includes(subtype ?? "") ? subtype : null;
  return { format: safeFormat, subtype: safeSubtype };
};
