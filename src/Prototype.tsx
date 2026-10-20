import { useEffect } from "react";
import { FlowStack, type FlowScreen } from "./mobile";
import { FavoritesProvider, isForcedMobileView, forcedMobileDesignWidth } from "./prototype/data";
import { DetailFooter, DetailUiProvider, VehicleDetail } from "./prototype/detail";
import { configureListingScreens, MarketplaceScreen, SavedListingsHeader, SavedListingsScreen } from "./prototype/listing";
import { BuildBadge } from "./prototype/build-badge";
import MainHome from "./main-home/MainHome";
import DealerPage from "./prototype/dealer-page/DealerPage";
import CommunityVehicleReviewPage from "./prototype/community-review/CommunityVehicleReviewPage";
import CommunityFuelEconomyPage from "./prototype/community-fuel-economy/CommunityFuelEconomyPage";
import { ListingLocaleProvider } from "./prototype/listing/listing-i18n";
import "./prototype.css";
import { registerPrototypeApp } from "./prototype/app/register";
import { AppFlowBack } from "./prototype/app/AppFlowBack";

// JOB-7: ?register 매물 등록 화면(dev /car/register 동일).
// 따로 나눠 불러오면(lazy) Pages 배포의 /assets/ → /bobaedream/assets/ 경로 변환이 조각 주소에 적용되지 않아 404가 나므로 함께 묶는다
import RegisterPage from "./prototype/register";

export type { PriceSelection, SellerType } from "./prototype/data";

const listScreen: FlowScreen = { id: "marketplace", render: () => <><AppFlowBack screenId="marketplace" /><MarketplaceScreen /></> };
const savedListingsScreen: FlowScreen = { id: "saved-listings", header: () => <SavedListingsHeader />, headerHeight: 58, render: () => <><AppFlowBack screenId="saved-listings" /><SavedListingsScreen /></> };
const detailScreen: FlowScreen = { id: "vehicle-detail", footer: () => <DetailFooter />, footerHeight: 56, render: () => <><AppFlowBack screenId="vehicle-detail" /><VehicleDetail /></> };

configureListingScreens({ detailScreen, savedListingsScreen });

const listingParams = ["qf", "scenario", "view", "titlepos", "filtericon", "desktop", "pc", "bbmparts", "pcl", "profile", "shop"];
const shouldShowMainHome = () => {
  const params = new URLSearchParams(window.location.search);
  return !listingParams.some((key) => params.has(key));
};
const shouldShowDealerPage = () => new URLSearchParams(window.location.search).get("profile") === "dealer";
const shouldShowCommunityReviews = () => new URLSearchParams(window.location.search).get("community") === "reviews";
const shouldShowCommunityFuelEconomy = () => new URLSearchParams(window.location.search).get("community") === "fuel-economy";
const shouldShowRegister = () => new URLSearchParams(window.location.search).has("register");

export default function Prototype() {
  useEffect(registerPrototypeApp, []);
  const showRegister = shouldShowRegister();
  const showMainHome = showRegister || shouldShowMainHome();

  useEffect(() => {
    const root = document.documentElement;
    if (showMainHome || shouldShowDealerPage() || shouldShowCommunityReviews() || shouldShowCommunityFuelEconomy()) {
      root.removeAttribute("data-force-mobile");
      root.removeAttribute("data-force-mobile-wide");
      root.style.removeProperty("--force-mobile-scale");
      root.style.removeProperty("--force-mobile-height");
      return;
    }

    const updateForcedMobileViewport = () => {
      const forced = isForcedMobileView();
      const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const wide = forced && viewportWidth > forcedMobileDesignWidth;
      const scale = wide ? viewportWidth / forcedMobileDesignWidth : 1;

      root.toggleAttribute("data-force-mobile", forced);
      root.toggleAttribute("data-force-mobile-wide", wide);
      root.style.setProperty("--force-mobile-scale", String(scale));
      root.style.setProperty("--force-mobile-height", `${viewportHeight / scale}px`);
    };

    updateForcedMobileViewport();
    window.addEventListener("resize", updateForcedMobileViewport);
    window.visualViewport?.addEventListener("resize", updateForcedMobileViewport);
    return () => {
      root.removeAttribute("data-force-mobile");
      root.removeAttribute("data-force-mobile-wide");
      root.style.removeProperty("--force-mobile-scale");
      root.style.removeProperty("--force-mobile-height");
      window.removeEventListener("resize", updateForcedMobileViewport);
      window.visualViewport?.removeEventListener("resize", updateForcedMobileViewport);
    };
  }, [showMainHome]);

  if (showRegister) return <><RegisterPage /><BuildBadge /></>;
  if (shouldShowCommunityFuelEconomy()) return <><CommunityFuelEconomyPage /><BuildBadge /></>;
  if (shouldShowCommunityReviews()) return <><CommunityVehicleReviewPage /><BuildBadge /></>;
  if (shouldShowDealerPage()) return <><DealerPage /><BuildBadge /></>;
  if (showMainHome) return <MainHome />;

  return <ListingLocaleProvider><FavoritesProvider><DetailUiProvider><FlowStack initial={listScreen} /><BuildBadge /></DetailUiProvider></FavoritesProvider></ListingLocaleProvider>;
}
