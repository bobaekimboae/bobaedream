import { useEffect } from "react";
import FuelEconomyBoard from "../fuel-economy/FuelEconomyBoard";

export default function CommunityFuelEconomyPage() {
  const subview = new URLSearchParams(window.location.search).get("fuel");
  useEffect(() => {
    if (!subview) window.location.replace("./community/naver-cafe-list.html?board=fuel-economy");
  }, [subview]);
  if (!subview) return null;
  return <FuelEconomyBoard />;
}
