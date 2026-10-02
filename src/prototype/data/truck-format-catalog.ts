export type TruckFormatGroup = {
  name: string;
  subtypes: readonly string[];
};

// 엔카 화물·특장차 형식/세부형식을 바탕으로 보배드림 화면 명칭을 적용한다.
export const truckFormatCatalog = [
  {
    name: "카고(화물)트럭",
    subtypes: [
      "경형 트럭 (1톤)",
      "소형 트럭 (1.1~3.5톤)",
      "중형 트럭 (4~8.5톤)",
      "대형 트럭 (9톤 이상)",
      "파워게이트",
      "트랜스/와이드 파워게이트",
    ],
  },
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

// 트럭 형식 이미지는 상위 형식별로 검수 완료된 묶음부터 순차 등록한다.
// 적재용량·규격은 이미지가 아니라 알약칩으로 표시하며, 제조사는 브랜드 로고를 사용한다.
const truckFormatImages: Readonly<Record<string, string>> = {
  "카고(화물)트럭": "truck/formats/v01/truck_format_cargo_v01.png",
  "윙바디/탑": "truck/formats/v01/truck_format_wingbody_top_v01.png",
  "버스": "truck/formats/v01/truck_format_bus_v01.png",
  "덤프/건설/중기": "truck/formats/v01/truck_format_dump_heavy_v01.png",
  "크레인 형태": "truck/formats/v01/truck_format_crane_v01.png",
  "탱크로리": "truck/formats/v01/truck_format_tanker_v01.png",
  "캠핑카/캠핑 트레일러": "truck/formats/v01/truck_format_camper_trailer_v01.png",
  "폐기/음식물수송": "truck/formats/v01/truck_format_waste_transport_v01.png",
  "활어차": "truck/formats/v01/truck_format_live_fish_v01.png",
  "차량견인/운송": "truck/formats/v01/truck_format_vehicle_transport_v01.png",
  "트렉터": "truck/formats/v01/truck_format_tractor_v01.png",
  "트레일러": "truck/formats/v01/truck_format_trailer_v01.png",
  "기타": "truck/formats/v01/truck_format_other_v01.png",
};

const truckSubtypeImages: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  "카고(화물)트럭": {
    "경형 트럭 (1톤)": "truck/formats/v01/truck_format_one_ton_v01.png",
    "소형 트럭 (1.1~3.5톤)": "truck/formats/v01/truck_subtype_light_class_v01.png",
    "중형 트럭 (4~8.5톤)": "truck/formats/v01/truck_subtype_cargo_v01.png",
    "대형 트럭 (9톤 이상)": "truck/formats/v01/truck_subtype_large_class_v01.png",
    "파워게이트": "truck/formats/v01/truck_subtype_powergate_v01.png",
    "트랜스/와이드 파워게이트": "truck/formats/v01/truck_subtype_transform_wide_powergate_v01.png",
  },
  "윙바디/탑": {
    "윙바디": "truck/formats/v01/truck_subtype_wingbody_v01.png",
    "윙바디 파워게이트": "truck/formats/v01/truck_subtype_wingbody_powergate_v01.png",
    "상승 윙바디": "truck/formats/v01/truck_subtype_rising_wingbody_v01.png",
    "저상형 윙바디": "truck/formats/v01/truck_subtype_low_floor_wingbody_v01.png",
    "냉동윙": "truck/formats/v01/truck_subtype_frozen_wing_v01.png",
    "냉장윙": "truck/formats/v01/truck_subtype_refrigerated_wing_v01.png",
    "보냉윙": "truck/formats/v01/truck_subtype_insulated_wing_v01.png",
    "보온윙": "truck/formats/v01/truck_subtype_heated_wing_v01.png",
    "내장탑": "truck/formats/v01/truck_subtype_dry_box_v01.png",
    "상승내장탑": "truck/formats/v01/truck_subtype_rising_dry_box_v01.png",
    "내장탑 파워게이트": "truck/formats/v01/truck_subtype_dry_box_powergate_v01.png",
    "저상형 내장탑": "truck/formats/v01/truck_subtype_low_floor_dry_box_v01.png",
    "저상형 내장탑 파워게이트": "truck/formats/v01/truck_subtype_low_floor_dry_box_powergate_v01.png",
    "익스(하이)내장탑": "truck/formats/v01/truck_subtype_extra_high_dry_box_v01.png",
    "익스(하이)내장탑 파워게이트": "truck/formats/v01/truck_subtype_extra_high_dry_box_powergate_v01.png",
    "냉동탑": "truck/formats/v01/truck_subtype_frozen_box_v01.png",
    "냉동탑 파워게이트": "truck/formats/v01/truck_subtype_frozen_box_powergate_v01.png",
    "익스(하이)냉동탑": "truck/formats/v01/truck_subtype_extra_high_frozen_box_v01.png",
    "익스(하이)냉동탑 파워게이트": "truck/formats/v01/truck_subtype_extra_high_frozen_box_powergate_v01.png",
    "저상형 냉동탑": "truck/formats/v01/truck_subtype_low_floor_frozen_box_v01.png",
    "냉장탑": "truck/formats/v01/truck_subtype_refrigerated_box_v01.png",
    "냉장탑 파워게이트": "truck/formats/v01/truck_subtype_refrigerated_box_powergate_v01.png",
    "익스(하이)냉장탑": "truck/formats/v01/truck_subtype_extra_high_refrigerated_box_v01.png",
    "익스(하이)냉장탑 파워게이트": "truck/formats/v01/truck_subtype_extra_high_refrigerated_box_powergate_v01.png",
    "저상형 냉장탑": "truck/formats/v01/truck_subtype_low_floor_refrigerated_box_v01.png",
    "저상형 냉장탑 파워게이트": "truck/formats/v01/truck_subtype_low_floor_refrigerated_box_powergate_v01.png",
    "보냉탑": "truck/formats/v01/truck_subtype_insulated_box_v01.png",
    "냉온장탑": "truck/formats/v01/truck_subtype_dual_temperature_box_v01.png",
    "다용도탑": "truck/formats/v01/truck_subtype_multipurpose_box_v01.png",
    "씨티/워크스루밴": "truck/formats/v01/truck_subtype_city_walkthrough_van_v01.png",
    "이동/광고/응급차": "truck/formats/v01/truck_subtype_mobile_ad_emergency_v01.png",
    "이동식 목욕차": "truck/formats/v01/truck_subtype_mobile_bath_v01.png",
    "기타": "truck/formats/v01/truck_subtype_other_box_v01.png",
  },
  "버스": {
    "버스": "truck/formats/v01/truck_subtype_bus_v01.png",
    "기타": "truck/formats/v01/truck_subtype_bus_other_v01.png",
  },
  "덤프/건설/중기": {
    "덤프": "truck/formats/v01/truck_subtype_dump_v01.png",
    "레미콘": "truck/formats/v01/truck_subtype_concrete_mixer_v01.png",
    "지게차": "truck/formats/v01/truck_subtype_forklift_v01.png",
    "굴삭기": "truck/formats/v01/truck_subtype_excavator_v01.png",
    "기타": "truck/formats/v01/truck_subtype_heavy_other_v01.png",
  },
  "크레인 형태": {
    "바가지차": "truck/formats/v01/truck_subtype_bucket_truck_v01.png",
    "사다리차": "truck/formats/v01/truck_subtype_ladder_truck_v01.png",
    "오가크레인": "truck/formats/v01/truck_subtype_auger_crane_v01.png",
    "집게차": "truck/formats/v01/truck_subtype_grapple_truck_v01.png",
    "카고크레인": "truck/formats/v01/truck_subtype_cargo_crane_v01.png",
    "활선차(고소작업)": "truck/formats/v01/truck_subtype_live_line_aerial_v01.png",
    "기타": "truck/formats/v01/truck_subtype_mobile_crane_other_v01.png",
  },
  "탱크로리": {
    "LPG/LNG탱크로리": "truck/formats/v01/truck_subtype_lpg_lng_tanker_v01.png",
    "버큠로리": "truck/formats/v01/truck_subtype_vacuum_tanker_v01.png",
    "사료운반차": "truck/formats/v01/truck_subtype_feed_carrier_v01.png",
    "살수차": "truck/formats/v01/truck_subtype_water_sprinkler_v01.png",
    "유류/액상탱크로리": "truck/formats/v01/truck_subtype_fuel_liquid_tanker_v01.png",
    "이동방제차": "truck/formats/v01/truck_subtype_mobile_sprayer_v01.png",
    "소맥분/분말탱크로리": "truck/formats/v01/truck_subtype_powder_tanker_v01.png",
    "특수/케미컬(VOC,테플론)탱크로리": "truck/formats/v01/truck_subtype_chemical_tanker_v01.png",
    "기타": "truck/formats/v01/truck_subtype_tanker_other_v01.png",
  },
  "캠핑카/캠핑 트레일러": {
    "캠핑카": "truck/formats/v01/truck_subtype_motorhome_v01.png",
    "캠핑트레일러": "truck/formats/v01/truck_subtype_camper_trailer_v01.png",
  },
  "폐기/음식물수송": {
    "암롤/롤온": "truck/formats/v01/truck_subtype_hook_lift_v01.png",
    "압착진개": "truck/formats/v01/truck_subtype_refuse_packer_v01.png",
    "압축진개": "truck/formats/v01/truck_subtype_compression_refuse_v01.png",
    "진개덤프": "truck/formats/v01/truck_subtype_refuse_dump_v01.png",
    "음식물수거": "truck/formats/v01/truck_subtype_food_waste_v01.png",
    "노면청소차": "truck/formats/v01/truck_subtype_road_sweeper_v01.png",
    "준설차": "truck/formats/v01/truck_subtype_sewer_dredger_v01.png",
    "재활용품수집차": "truck/formats/v01/truck_subtype_recycling_collector_v01.png",
    "워킹플로어": "truck/formats/v01/truck_subtype_walking_floor_v01.png",
    "톱밥운반차": "truck/formats/v01/truck_subtype_sawdust_carrier_v01.png",
    "기타": "truck/formats/v01/truck_subtype_waste_other_v01.png",
  },
  "활어차": {
    "활어차": "truck/formats/v01/truck_subtype_live_fish_v01.png",
  },
  "차량견인/운송": {
    "셀프로더": "truck/formats/v01/truck_subtype_self_loader_v01.png",
    "언더리프트": "truck/formats/v01/truck_subtype_underlift_v01.png",
    "카케리어": "truck/formats/v01/truck_subtype_car_carrier_v01.png",
    "기타": "truck/formats/v01/truck_subtype_vehicle_transport_other_v01.png",
  },
  "트렉터": {
    "트렉터": "truck/formats/v01/truck_subtype_tractor_v01.png",
  },
  "트레일러": {
    "LPG/LNG트레일러": "truck/formats/v01/truck_subtype_lpg_lng_trailer_v01.png",
    "곡물트레일러": "truck/formats/v01/truck_subtype_grain_trailer_v01.png",
    "덤프트레일러": "truck/formats/v01/truck_subtype_dump_trailer_v01.png",
    "로우베드/릴리리": "truck/formats/v01/truck_subtype_lowbed_trailer_v01.png",
    "벌크시멘트트레일러": "truck/formats/v01/truck_subtype_bulk_cement_trailer_v01.png",
    "윙트레일러": "truck/formats/v01/truck_subtype_wing_trailer_v01.png",
    "유류/액상탱크트레일러": "truck/formats/v01/truck_subtype_fuel_liquid_trailer_v01.png",
    "컨테이너 샤시": "truck/formats/v01/truck_subtype_container_chassis_v01.png",
    "평판트레일러": "truck/formats/v01/truck_subtype_flatbed_trailer_v01.png",
    "기타": "truck/formats/v01/truck_subtype_trailer_other_v01.png",
  },
  "기타": {
    "기타": "truck/formats/v01/truck_subtype_other_v01.png",
  },
};

export const truckFormatImageFor = (format: string) => truckFormatImages[format] ?? null;
export const truckSubtypeImageFor = (format: string | null, subtype: string) => format ? truckSubtypeImages[format]?.[subtype] ?? null : null;

export const normalizeTruckFormatSelection = (format: string | null, subtype: string | null) => {
  const legacyOneTon = format === "1톤트럭";
  const aliasedFormat = legacyOneTon || format === "화물트럭" || format === "카고트럭" ? "카고(화물)트럭" : format;
  const aliasedSubtype = (legacyOneTon && !subtype) || subtype === "1톤트럭"
    ? "경형 트럭 (1톤)"
    : subtype === "카고(화물)트럭" || subtype === "카고트럭" || subtype === "화물트럭"
      ? "중형 트럭 (4~8.5톤)"
      : subtype;
  const safeFormat = truckFormatCatalog.some((group) => group.name === aliasedFormat) ? aliasedFormat : null;
  const safeSubtype = safeFormat && truckSubtypesFor(safeFormat).includes(aliasedSubtype ?? "") ? aliasedSubtype : null;
  return { format: safeFormat, subtype: safeSubtype };
};
