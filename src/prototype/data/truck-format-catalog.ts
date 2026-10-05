export type TruckFormatGroup = {
  name: string;
  subtypes: readonly string[];
};

export type TruckTypeNode = {
  label: string;
  value?: string;
  children?: readonly TruckTypeNode[];
};

const leaf = (label: string, value = label): TruckTypeNode => ({ label, value });
const branch = (label: string, children: readonly TruckTypeNode[], value = label): TruckTypeNode => ({ label, value, children });

// 보배드림 트럭·특장 최종 분류. 트리 표기와 실제 URL 값의 단일 기준이다.
export const truckTypeTree: readonly TruckTypeNode[] = [
  branch("카고(화물)트럭", [leaf("경형"), leaf("소형"), leaf("준중형"), leaf("중형"), leaf("준대형"), leaf("대형")]),
  branch("윙바디·탑차", [leaf("윙바디"), branch("내장탑", [leaf("일반", "내장탑 - 일반"), leaf("하이탑·익스탑", "내장탑 - 하이탑·익스탑"), leaf("저상형", "내장탑 - 저상형"), leaf("상승형", "내장탑 - 상승형")]), leaf("워크스루밴"), leaf("다용도탑")]),
  branch("냉장·냉동차", [branch("냉동탑", [leaf("일반", "냉동탑 - 일반"), leaf("하이탑·익스탑", "냉동탑 - 하이탑·익스탑"), leaf("저상형", "냉동탑 - 저상형")]), leaf("냉장윙"), leaf("냉장탑"), leaf("냉동윙"), leaf("냉온장탑"), branch("보냉·보온 윙·탑차", [leaf("보냉탑"), leaf("보냉윙"), leaf("보온윙")])]),
  branch("덤프·믹서", [leaf("덤프"), leaf("레미콘·믹서트럭"), leaf("콘크리트 펌프카")]),
  branch("크레인·고소작업차", [leaf("카고크레인"), leaf("집게차"), leaf("활선차"), leaf("고소작업차"), leaf("사다리차"), leaf("오거크레인"), leaf("셀프크레인"), leaf("기타 크레인·작업차")]),
  branch("탱크로리", [leaf("살수차"), leaf("유류 탱크로리"), leaf("사료운반차"), leaf("LPG·LNG 탱크로리"), leaf("급수차"), leaf("식품 탱크로리"), leaf("벌크 탱크로리"), leaf("분말 탱크로리"), leaf("케미컬 탱크로리"), leaf("기타 탱크로리")]),
  branch("환경·폐기물차", [leaf("암롤"), leaf("버큠로리"), leaf("음식물수거차"), leaf("압착진개차"), leaf("노면청소차"), leaf("재활용품수거차"), leaf("압축진개차"), leaf("진개덤프"), leaf("무빙플로어"), leaf("준설차"), leaf("우드칩·톱밥 운반차"), leaf("진공흡입·세정차"), leaf("기타 환경차")]),
  branch("견인·운송차", [leaf("셀프로더"), leaf("레커·구난차"), leaf("카캐리어"), leaf("세이프티로더"), leaf("기타 견인·운송차")]),
  leaf("트랙터 헤드"),
  branch("트레일러", [leaf("컨테이너 섀시"), leaf("덤프 트레일러"), leaf("유류·액상 탱크 트레일러"), leaf("평판 트레일러"), leaf("저상·로우베드 트레일러"), leaf("차량·장비운반 트레일러"), leaf("코일·철판운송 트레일러"), leaf("윙·탑 트레일러"), leaf("냉장·냉동 트레일러"), leaf("LPG·LNG 탱크 트레일러"), leaf("벌크시멘트 트레일러"), leaf("호퍼·곡물 트레일러"), leaf("기타 트레일러")]),
  branch("특수차", [branch("특수운반차", [leaf("활어차", "특수운반차 - 활어차"), leaf("동물·가축운반차", "특수운반차 - 동물·가축운반차"), leaf("보틀카·루트배송차", "특수운반차 - 보틀카·루트배송차"), leaf("기타 특수운반차", "특수운반차 - 기타")]), branch("이동서비스차", [leaf("광고·홍보·상담차", "이동서비스차 - 광고·홍보·상담차"), leaf("이동검진차", "이동서비스차 - 이동검진차"), leaf("이동식 목욕·복지차", "이동서비스차 - 이동식 목욕·복지차"), leaf("푸드트럭", "이동서비스차 - 푸드트럭"), leaf("이동급식차", "이동서비스차 - 이동급식차"), leaf("이동전시·교육차", "이동서비스차 - 이동전시·교육차"), leaf("이동공연·무대차", "이동서비스차 - 이동공연·무대차"), leaf("이동도서관", "이동서비스차 - 이동도서관"), leaf("방송·중계차", "이동서비스차 - 방송·중계차"), leaf("이동집무차", "이동서비스차 - 이동집무차")]), branch("공공·안전차", [leaf("구급·의료차", "공공·안전차 - 구급·의료차"), leaf("방역·소독차", "공공·안전차 - 방역·소독차"), leaf("소방차", "공공·안전차 - 소방차"), leaf("도로정비차", "공공·안전차 - 도로정비차"), leaf("경찰차", "공공·안전차 - 경찰차"), leaf("군용·공공특수차", "공공·안전차 - 군용·공공특수차")]), branch("지원차", [leaf("이동정비차", "지원차 - 이동정비차"), leaf("전원·발전차", "지원차 - 전원·발전차"), leaf("항공지원차", "지원차 - 항공지원차"), leaf("다목적 특수차", "지원차 - 다목적 특수차")]), leaf("기타 특수차")]),
  branch("버스", [leaf("소형버스"), leaf("준중형버스"), leaf("중형버스"), leaf("대형버스"), leaf("특수버스")]),
  branch("캠핑카·카라반", [branch("일체형 캠핑카", [leaf("캠퍼밴", "일체형 캠핑카 - 캠퍼밴"), leaf("캠핑트럭", "일체형 캠핑카 - 캠핑트럭"), leaf("캠핑버스", "일체형 캠핑카 - 캠핑버스"), leaf("기타 일체형 캠핑카", "일체형 캠핑카 - 기타")]), leaf("카라반·캠핑트레일러"), leaf("기타 캠핑차")]),
  leaf("기타 화물차"),
];

const flattenNodeValues = (nodes: readonly TruckTypeNode[]): string[] => nodes.flatMap((node) => [node.value ?? node.label, ...flattenNodeValues(node.children ?? [])]);
export const truckFormatCatalog: readonly TruckFormatGroup[] = truckTypeTree.map((node) => ({ name: node.value ?? node.label, subtypes: flattenNodeValues(node.children ?? []) }));

export const truckSubtypesFor = (format: string | null): readonly string[] => truckFormatCatalog.find((group) => group.name === format)?.subtypes ?? [];

// 카고 차급은 명칭만으로 실제 적재 규모를 가늠하기 어려워 퀵필터와 선택 시트에
// 대표 톤수를 두 번째 줄로 함께 표시한다. 실제 차량의 승인 톤수는 매물 정보가 기준이다.
export const truckCargoClassTonnage: Readonly<Record<string, string>> = {
  "경형": "1톤 미만",
  "소형": "1~2톤",
  "준중형": "2.5~3.5톤",
  "중형": "4~6.5톤",
  "준대형": "7~10.8톤",
  "대형": "11톤 이상",
};

export const truckSubtypeSecondaryLabel = (format: string | null, subtype: string): string | null => (
  format === "카고(화물)트럭" ? truckCargoClassTonnage[subtype] ?? null : null
);

const findNode = (nodes: readonly TruckTypeNode[], value: string): TruckTypeNode | null => {
  for (const node of nodes) {
    if ((node.value ?? node.label) === value) return node;
    const nested = findNode(node.children ?? [], value);
    if (nested) return nested;
  }
  return null;
};

// 중간 그룹(예: 내장탑)을 선택하면 그 아래 실제 매물을 모두 포함한다.
export const truckSubtypeValuesForSelection = (format: string | null, subtype: string | null): readonly string[] => {
  if (!format || !subtype) return [];
  const root = truckTypeTree.find((node) => (node.value ?? node.label) === format);
  const node = root ? findNode(root.children ?? [], subtype) : null;
  return node ? flattenNodeValues(node.children?.length ? node.children : [node]) : [subtype];
};

// 트럭 형식 이미지는 한국·일본 상용차 체형을 기준으로 제작한 좌향 완전 측면 실사형을 사용한다.
// 적재용량·규격은 이미지가 아니라 알약칩으로 표시하며, 제조사는 브랜드 로고를 사용한다.
const truckFormatImages: Readonly<Record<string, string>> = {
  "카고(화물)트럭": "truck/formats/v03/truck_format_cargo_side_v03.png",
  "윙바디·탑차": "truck/pilot/autoscout24-v01/web/truck_format_wingbody_autoscout24_v01.png",
  "윙바디/탑": "truck/pilot/autoscout24-v01/web/truck_format_wingbody_autoscout24_v01.png",
  "냉장·냉동차": "truck/pilot/autoscout24-v01/web/truck_format_reefer_autoscout24_v01.png",
  "버스": "truck/formats/v03/truck_format_bus_side_v03.png",
  "덤프·믹서": "truck/pilot/autoscout24-v02/web/truck_format_dump_autoscout24_v02.png",
  "덤프·콘크리트차": "truck/pilot/autoscout24-v02/web/truck_format_dump_autoscout24_v02.png",
  "덤프/건설/중기": "truck/pilot/autoscout24-v02/web/truck_format_dump_autoscout24_v02.png",
  "크레인·고소작업차": "truck/formats/v03/truck_format_crane_side_v03.png",
  "크레인 형태": "truck/formats/v03/truck_format_crane_side_v03.png",
  "탱크로리": "truck/pilot/autoscout24-v01/web/truck_format_tanker_autoscout24_v01.png",
  "캠핑카·카라반": "truck/formats/v03/truck_format_motorhome_side_v03.png",
  "캠핑카/캠핑 트레일러": "truck/formats/v03/truck_format_motorhome_side_v03.png",
  "환경·폐기물차": "truck/formats/v03/truck_format_waste_side_v03.png",
  "폐기/음식물수송": "truck/formats/v03/truck_format_waste_side_v03.png",
  "활어차": "truck/formats/v03/truck_format_special_side_v03.png",
  "견인·운송차": "truck/pilot/autoscout24-v01/web/truck_format_transport_autoscout24_v01.png",
  "차량견인/운송": "truck/pilot/autoscout24-v01/web/truck_format_transport_autoscout24_v01.png",
  "트랙터 헤드": "truck/formats/v03/truck_format_tractor_side_v03.png",
  "트랙터·헤드": "truck/formats/v03/truck_format_tractor_side_v03.png",
  "트렉터": "truck/formats/v03/truck_format_tractor_side_v03.png",
  "트랙터·트레일러": "truck/formats/v03/truck_format_trailer_side_v03.png",
  "트레일러": "truck/formats/v03/truck_format_trailer_side_v03.png",
  "특수차": "truck/formats/v03/truck_format_special_side_v03.png",
  "기타 화물차": "truck/formats/v03/truck_format_other_side_v03.png",
  "기타": "truck/formats/v03/truck_format_other_side_v03.png",
};

const truckSubtypeImages: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  "카고(화물)트럭": {
    "경형": "truck/pilot/v14/truck_cargo_light_side_v14.webp",
    "소형": "truck/pilot/v14/truck_cargo_small_side_v14.webp",
    "준중형": "truck/pilot/v14/truck_cargo_semi_medium_side_v14.webp",
    "중형": "truck/pilot/v14/truck_cargo_medium_side_v14.webp",
    "준대형": "truck/pilot/v14/truck_cargo_quasi_large_side_v14.webp",
    "대형": "truck/pilot/v14/truck_cargo_large_side_v14.webp",
    "경형 트럭 (1톤 미만)": "truck/pilot/v13/truck_cargo_light_side_v13.webp",
    "1톤 트럭": "truck/pilot/v13/truck_cargo_small_side_v13.webp",
    "소형 트럭 (1.1~3.5톤)": "truck/pilot/v13/truck_cargo_semi_medium_side_v13.webp",
    "중형 트럭 (4~8.5톤)": "truck/pilot/v13/truck_cargo_medium_side_v13.webp",
    "대형 트럭 (9톤 이상)": "truck/pilot/v13/truck_cargo_large_side_v13.webp",
    "파워게이트": "truck/formats/v01/truck_subtype_powergate_v01.png",
    "트랜스/와이드 파워게이트": "truck/formats/v01/truck_subtype_transform_wide_powergate_v01.png",
  },
  "윙바디/탑": {
    "윙바디": "truck/pilot/v02/truck_type_wingbody_side_v02.png",
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
    "카고크레인": "truck/pilot/v02/truck_type_cargo_crane_side_v02.png",
    "활선차(고소작업)": "truck/formats/v01/truck_subtype_live_line_aerial_v01.png",
    "기타": "truck/formats/v01/truck_subtype_mobile_crane_other_v01.png",
  },
  "탱크로리": {
    "LPG/LNG탱크로리": "truck/formats/v01/truck_subtype_lpg_lng_tanker_v01.png",
    "버큠로리": "truck/formats/v01/truck_subtype_vacuum_tanker_v01.png",
    "사료운반차": "truck/formats/v01/truck_subtype_feed_carrier_v01.png",
    "살수차": "truck/formats/v01/truck_subtype_water_sprinkler_v01.png",
    "유류/액상탱크로리": "truck/pilot/v02/truck_type_tanker_side_v02.png",
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
    "LPG/LNG트레일러": "truck/pilot/v04/truck_trailer_gas_tanker_side_v04.png",
    "곡물트레일러": "truck/pilot/v04/truck_trailer_grain_hopper_side_v04.png",
    "덤프트레일러": "truck/pilot/v04/truck_trailer_dump_side_v04.png",
    "로우베드/릴리리": "truck/pilot/v04/truck_trailer_lowbed_side_v04.png",
    "벌크시멘트트레일러": "truck/pilot/v04/truck_trailer_bulk_cement_side_v04.png",
    "윙트레일러": "truck/pilot/v04/truck_trailer_wing_side_v04.png",
    "유류/액상탱크트레일러": "truck/pilot/v04/truck_trailer_tanker_side_v04.png",
    "컨테이너 샤시": "truck/pilot/v04/truck_trailer_container_chassis_side_v04.png",
    "평판트레일러": "truck/pilot/v04/truck_trailer_flatbed_side_v04.png",
    "차량·장비운반 트레일러": "truck/pilot/v04/truck_trailer_equipment_side_v04.png",
    "코일·철판운송 트레일러": "truck/pilot/v04/truck_trailer_coil_side_v04.png",
    "냉장·냉동 트레일러": "truck/pilot/v04/truck_trailer_refrigerated_side_v04.png",
    "기타": "truck/formats/v01/truck_subtype_trailer_other_v01.png",
  },
  "특수차": {
    "특수운반차": "truck/pilot/v12/truck_special_transport_group_side_v12.png",
    "이동서비스차": "truck/pilot/v12/truck_special_mobile_service_group_side_v12.png",
    "공공·안전차": "truck/pilot/v12/truck_special_public_safety_group_side_v12.png",
    "지원차": "truck/pilot/v12/truck_special_support_group_side_v12.png",
    "활어차": "truck/pilot/v12/truck_special_live_fish_side_v12.png",
    "특수운반차 - 동물·가축운반차": "truck/pilot/v12/truck_special_livestock_side_v12.png",
    "특수운반차 - 보틀카·루트배송차": "truck/pilot/v12/truck_special_bottle_route_side_v12.png",
    "특수운반차 - 기타": "truck/pilot/v12/truck_special_other_transport_side_v12.png",
    "이동서비스차 - 광고·홍보·상담차": "truck/pilot/v12/truck_special_advertising_consulting_side_v12.png",
    "이동서비스차 - 이동검진차": "truck/pilot/v12/truck_special_medical_exam_side_v12.png",
    "이동서비스차 - 이동식 목욕·복지차": "truck/pilot/v12/truck_special_bath_welfare_side_v12.png",
    "이동서비스차 - 푸드트럭": "truck/pilot/v12/truck_special_food_truck_side_v12.png",
    "이동서비스차 - 이동급식차": "truck/pilot/v12/truck_special_mobile_catering_side_v12.png",
    "이동서비스차 - 이동전시·교육차": "truck/pilot/v12/truck_special_exhibition_education_side_v12.png",
    "이동서비스차 - 이동공연·무대차": "truck/pilot/v12/truck_special_stage_side_v12.png",
    "이동서비스차 - 이동도서관": "truck/pilot/v12/truck_special_library_side_v12.png",
    "이동서비스차 - 방송·중계차": "truck/pilot/v12/truck_special_broadcast_side_v12.png",
    "이동서비스차 - 이동집무차": "truck/pilot/v12/truck_special_mobile_office_side_v12.png",
    "공공·안전차 - 구급·의료차": "truck/pilot/v12/truck_special_ambulance_medical_side_v12.png",
    "공공·안전차 - 방역·소독차": "truck/pilot/v12/truck_special_disinfection_side_v12.png",
    "공공·안전차 - 소방차": "truck/pilot/v12/truck_special_fire_side_v12.png",
    "공공·안전차 - 도로정비차": "truck/pilot/v12/truck_special_road_maintenance_side_v12.png",
    "공공·안전차 - 경찰차": "truck/pilot/v12/truck_special_police_side_v12.png",
    "공공·안전차 - 군용·공공특수차": "truck/pilot/v12/truck_special_military_public_side_v12.png",
    "지원차 - 이동정비차": "truck/pilot/v12/truck_special_mobile_repair_side_v12.png",
    "지원차 - 전원·발전차": "truck/pilot/v12/truck_special_generator_side_v12.png",
    "지원차 - 항공지원차": "truck/pilot/v12/truck_special_aviation_support_side_v12.png",
    "지원차 - 다목적 특수차": "truck/pilot/v12/truck_special_multipurpose_side_v12.png",
    "기타 특수차": "truck/pilot/v12/truck_special_other_special_side_v12.png",
  },
  "기타": {
    "기타": "truck/formats/v01/truck_subtype_other_v01.png",
  },
};

const formatImageAliases: Readonly<Record<string, string>> = {
  "윙바디·탑차": "윙바디/탑",
  "덤프·믹서": "덤프/건설/중기",
  "덤프·콘크리트차": "덤프/건설/중기",
  "크레인·고소작업차": "크레인 형태",
  "환경·폐기물차": "폐기/음식물수송",
  "견인·운송차": "차량견인/운송",
  "트랙터·트레일러": "트랙터 헤드",
  "캠핑카·카라반": "캠핑카/캠핑 트레일러",
  "기타": "기타 화물차",
};

const subtypeImageAliases: Readonly<Record<string, string>> = {
  "내장탑 - 일반": "내장탑", "내장탑 - 하이탑·익스탑": "익스(하이)내장탑", "내장탑 - 저상형": "저상형 내장탑", "내장탑 - 상승형": "상승내장탑",
  "냉동탑 - 일반": "냉동탑", "냉동탑 - 하이탑·익스탑": "익스(하이)냉동탑", "냉동탑 - 저상형": "저상형 냉동탑",
  "워크스루밴": "씨티/워크스루밴", "레미콘·믹서트럭": "레미콘", "고소작업차": "바가지차", "오거크레인": "오가크레인", "활선차": "활선차(고소작업)",
  "유류 탱크로리": "유류/액상탱크로리", "LPG·LNG 탱크로리": "LPG/LNG탱크로리", "분말 탱크로리": "소맥분/분말탱크로리", "케미컬 탱크로리": "특수/케미컬(VOC,테플론)탱크로리",
  "암롤": "암롤/롤온", "음식물수거차": "음식물수거", "압착진개차": "압착진개", "압축진개차": "압축진개", "재활용품수거차": "재활용품수집차", "무빙플로어": "워킹플로어", "우드칩·톱밥 운반차": "톱밥운반차",
  "레커·구난차": "언더리프트", "카캐리어": "카케리어", "컨테이너 섀시": "컨테이너 샤시", "덤프 트레일러": "덤프트레일러", "평판 트레일러": "평판트레일러", "저상·로우베드 트레일러": "로우베드/릴리리", "윙·탑 트레일러": "윙트레일러", "유류·액상 탱크 트레일러": "유류/액상탱크트레일러", "LPG·LNG 탱크 트레일러": "LPG/LNG트레일러", "벌크시멘트 트레일러": "벌크시멘트트레일러", "호퍼·곡물 트레일러": "곡물트레일러",
  "일체형 캠핑카 - 캠퍼밴": "캠핑카", "카라반·캠핑트레일러": "캠핑트레일러", "특수운반차 - 활어차": "활어차",
};

export const truckSubtypeLabel = (subtype: string) => subtype.includes(" - ") ? subtype.split(" - ").at(-1) ?? subtype : subtype;
export const truckFormatImageFor = (format: string) => truckFormatImages[format] ?? truckFormatImages[formatImageAliases[format]] ?? null;
export const truckSubtypeImageFor = (format: string | null, subtype: string) => {
  if (!format) return null;
  const imageFormat = formatImageAliases[format] ?? format;
  const imageSubtype = subtypeImageAliases[subtype] ?? subtype;
  return truckSubtypeImages[imageFormat]?.[imageSubtype] ?? null;
};

export const normalizeTruckFormatSelection = (format: string | null, subtype: string | null) => {
  const legacyOneTon = format === "1톤트럭";
  const formatAliases: Readonly<Record<string, string>> = {
    "화물트럭": "카고(화물)트럭", "카고트럭": "카고(화물)트럭", "윙바디/탑": "윙바디·탑차", "덤프/건설/중기": "덤프·믹서", "덤프·콘크리트차": "덤프·믹서", "크레인 형태": "크레인·고소작업차", "폐기/음식물수송": "환경·폐기물차", "차량견인/운송": "견인·운송차", "트렉터": "트랙터 헤드", "트랙터·헤드": "트랙터 헤드", "캠핑카/캠핑 트레일러": "캠핑카·카라반", "활어차": "특수차", "기타": "기타 화물차",
  };
  const legacySubtypeAliases: Readonly<Record<string, string>> = {
    "1톤 트럭": "소형", "소형 트럭 (1.1~3.5톤)": "준중형", "중형 트럭 (4~8.5톤)": "중형", "대형 트럭 (9톤 이상)": "대형", "경형 트럭 (1톤 미만)": "경형",
    "윙바디 파워게이트": "윙바디", "내장탑": "내장탑 - 일반", "상승내장탑": "내장탑 - 상승형", "저상형 내장탑": "내장탑 - 저상형", "익스(하이)내장탑": "내장탑 - 하이탑·익스탑",
    "냉동탑": "냉동탑 - 일반", "저상형 냉동탑": "냉동탑 - 저상형", "익스(하이)냉동탑": "냉동탑 - 하이탑·익스탑",
    "레미콘": "레미콘·믹서트럭", "바가지차": "고소작업차", "활선차(고소작업)": "활선차", "오가크레인": "오거크레인",
    "유류/액상탱크로리": "유류 탱크로리", "LPG/LNG탱크로리": "LPG·LNG 탱크로리", "암롤/롤온": "암롤", "음식물수거": "음식물수거차", "카케리어": "카캐리어",
    "캠핑카": "일체형 캠핑카 - 캠퍼밴", "캠핑트레일러": "카라반·캠핑트레일러",
  };
  const legacyCoolingSubtypes = new Set(["냉동윙", "냉장윙", "보냉윙", "보온윙", "냉동탑", "냉장탑", "보냉탑", "냉온장탑", "익스(하이)냉동탑", "저상형 냉동탑"]);
  const legacyTrailerSubtypes = new Set(["컨테이너 섀시", "컨테이너 샤시", "덤프 트레일러", "덤프트레일러", "평판 트레일러", "평판트레일러", "저상·로우베드 트레일러", "로우베드/릴리리", "차량·장비운반 트레일러", "코일·철판운송 트레일러", "윙·탑 트레일러", "윙트레일러", "냉장·냉동 트레일러", "유류·액상 탱크 트레일러", "유류/액상탱크트레일러", "LPG·LNG 탱크 트레일러", "LPG/LNG트레일러", "벌크시멘트 트레일러", "벌크시멘트트레일러", "호퍼·곡물 트레일러", "곡물트레일러", "기타 트레일러"]);
  const aliasedFormat = legacyOneTon
    ? "카고(화물)트럭"
    : format === "윙바디/탑" && legacyCoolingSubtypes.has(subtype ?? "")
      ? "냉장·냉동차"
      : format === "트랙터·트레일러" && legacyTrailerSubtypes.has(subtype ?? "")
        ? "트레일러"
      : formatAliases[format ?? ""] ?? format;
  // 이전 배포의 `경형 트럭 (1톤)`은 실제로 포터급 1톤 매물을 가리켰으므로
  // 기존 공유 링크가 라보급 경형 매물로 바뀌지 않도록 1톤 트럭으로 호환한다.
  const aliasedSubtype = (legacyOneTon && !subtype) || subtype === "1톤트럭" || subtype === "경형 트럭 (1톤)"
    ? "소형"
    : subtype === "경형트럭" || subtype === "경형 트럭"
      ? "경형"
    : subtype === "카고(화물)트럭" || subtype === "카고트럭" || subtype === "화물트럭"
      ? "중형"
      : format === "활어차" && subtype === "활어차" ? "특수운반차 - 활어차"
      : format === "버스" && subtype === "버스" ? "소형버스"
      : format === "버스" && subtype === "기타" ? "대형버스"
      : format === "트렉터" || format === "트랙터·헤드" || (format === "트랙터·트레일러" && (subtype === "트랙터·헤드" || subtype === "트렉터")) ? null
      : format === "트레일러" || format === "트랙터·트레일러" ? ({ "컨테이너 샤시": "컨테이너 섀시", "덤프트레일러": "덤프 트레일러", "평판트레일러": "평판 트레일러", "로우베드/릴리리": "저상·로우베드 트레일러", "윙트레일러": "윙·탑 트레일러", "유류/액상탱크트레일러": "유류·액상 탱크 트레일러", "LPG/LNG트레일러": "LPG·LNG 탱크 트레일러", "벌크시멘트트레일러": "벌크시멘트 트레일러", "곡물트레일러": "호퍼·곡물 트레일러" } as Record<string, string>)[subtype ?? ""] ?? subtype
      : legacySubtypeAliases[subtype ?? ""] ?? subtype;
  const safeFormat = truckFormatCatalog.some((group) => group.name === aliasedFormat) ? aliasedFormat : null;
  const safeSubtype = safeFormat && truckSubtypesFor(safeFormat).includes(aliasedSubtype ?? "") ? aliasedSubtype : null;
  return { format: safeFormat, subtype: safeSubtype };
};
