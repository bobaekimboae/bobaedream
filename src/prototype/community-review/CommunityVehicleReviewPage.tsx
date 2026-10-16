import VehicleReviewBoard from "../dealer-page/VehicleReviewBoard";
import { asset, seoulAutoGalleryCars } from "../data";
import "./community-vehicle-review.css";

const reviewParam = () => new URLSearchParams(window.location.search).get("review");

export default function CommunityVehicleReviewPage() {
  const subview = Boolean(reviewParam());

  return <div className={`community-review-page${subview ? " is-subview" : ""}`}>
    {!subview ? <>
      <header className="community-review-appbar">
        <a href="./community/naver-cafe-list.html" aria-label="전체 게시판으로 돌아가기"><img src={asset("bbm/m-header-back.svg")} alt="" /></a>
        <div><strong>차량리뷰</strong><small>보배드림 커뮤니티</small></div>
        <a className="community-review-all" href="./community/naver-cafe-list.html">전체 게시판</a>
      </header>
      <nav className="community-review-tabs" aria-label="커뮤니티 메뉴">
        <a href="./community/naver-cafe-list.html">전체 게시글</a>
        <strong aria-current="page">차량리뷰</strong>
        <a href="./community/naver-cafe-list.html?board=best">베스트글</a>
      </nav>
    </> : null}
    <main><VehicleReviewBoard cars={seoulAutoGalleryCars} /></main>
  </div>;
}
