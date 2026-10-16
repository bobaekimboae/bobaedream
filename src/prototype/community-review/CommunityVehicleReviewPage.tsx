import { useEffect } from "react";
import VehicleReviewBoard from "../dealer-page/VehicleReviewBoard";
import { seoulAutoGalleryCars } from "../data";
import "./community-vehicle-review.css";

const reviewParam = () => new URLSearchParams(window.location.search).get("review");

export default function CommunityVehicleReviewPage() {
  const subview = Boolean(reviewParam());

  useEffect(() => {
    if (!subview) window.location.replace("./community/naver-cafe-list.html?board=vehicle-review");
  }, [subview]);

  if (!subview) return null;

  return <div className={`community-review-page${subview ? " is-subview" : ""}`}>
    <main><VehicleReviewBoard cars={seoulAutoGalleryCars} /></main>
  </div>;
}
