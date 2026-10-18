import { useEffect, useRef, useState, type CSSProperties } from "react";
import { asset } from "../data";
import "./bbm-vehicle-type-dropdown.css";

type VehicleTypeItem = {
  label: string;
  category: string;
  icon: string;
};

const vehicleTypes: readonly VehicleTypeItem[] = [
  { label: "승용차", category: "중고차", icon: "personbil.svg" },
  { label: "트럭·밴", category: "트럭 · 특장", icon: "transportbil.svg" },
  { label: "모터사이클", category: "바이크", icon: "motorcykel.svg" },
  { label: "스쿠터", category: "바이크", icon: "moped.svg" },
  { label: "스노모빌", category: "바이크", icon: "snoskoter.svg" },
  { label: "ATV", category: "바이크", icon: "atv-fyrhjuling.svg" },
  { label: "캠핑카", category: "캠핑카", icon: "husbil.svg" },
  { label: "카라반", category: "캠핑카", icon: "husvagn.svg" },
  { label: "트레일러", category: "트럭 · 특장", icon: "slap.svg" },
];

function VehicleTypeIcon({ name }: { name: string }) {
  const style = { "--bbm-vehicle-type-icon": `url("${asset(`bbm/nav-icons/bytbil/${name}`)}")` } as CSSProperties;
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
      <span>차량검색</span><span className="bbm-vehicle-search-caret" aria-hidden="true" />
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
