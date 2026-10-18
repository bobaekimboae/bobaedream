import { useEffect, useRef, useState, type CSSProperties } from "react";
import { asset } from "../data";
import "./bbm-vehicle-type-dropdown.css";

type VehicleTypeItem = {
  label: string;
  category: string;
  icon: string;
};

const vehicleTypes: readonly VehicleTypeItem[] = [
  { label: "전체차량", category: "전체", icon: "category_all_vehicles_v01.svg" },
  { label: "중고차", category: "중고차", icon: "category_used_car_v01.svg" },
  { label: "테마별 중고차", category: "테마별 중고차", icon: "category_theme_used_car_v01.svg" },
  { label: "트럭 · 특장", category: "트럭 · 특장", icon: "category_truck_special_v01.svg" },
  { label: "바이크", category: "바이크", icon: "category_bike_v01.svg" },
  { label: "캠핑카", category: "캠핑카", icon: "category_camper_v01.svg" },
  { label: "건설기계", category: "건설기계", icon: "category_construction_v01.svg" },
  { label: "자재운반장비", category: "자재운반장비", icon: "category_material_handling_v01.svg" },
  { label: "부품 · 용품", category: "부품 · 용품", icon: "category_parts_v01.svg" },
];

function VehicleTypeIcon({ name }: { name: string }) {
  const style = { "--bbm-vehicle-type-icon": `url("${asset(`category/icons/v01/${name}`)}")` } as CSSProperties;
  return <span className="bbm-vehicle-type-icon" style={style} aria-hidden="true" />;
}

export function BbmVehicleTypeDropdown({ active, onChoose }: { active: boolean; onChoose: (category: string) => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  return <div className="bbm-vehicle-search-wrap" ref={rootRef}>
    <button type="button" className={`bbm-vehicle-search-trigger${active ? " is-active" : ""}`} aria-current={active ? "page" : undefined} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
      <span>전체 차량</span>
    </button>
    {open ? <div className="bbm-vehicle-type-menu" role="menu" aria-label="차량 유형 선택">
      <div className="bbm-vehicle-type-heading">차량 유형</div>
      <div className="bbm-vehicle-type-grid">
        {vehicleTypes.map((item) => <button key={item.label} type="button" className="bbm-vehicle-type-option" role="menuitem" onClick={() => { setOpen(false); onChoose(item.category); }}>
          <VehicleTypeIcon name={item.icon} /><span>{item.label}</span>
        </button>)}
      </div>
    </div> : null}
  </div>;
}
