import { useEffect } from "react";
import { FlowStack, type FlowScreen } from "./mobile";
import { FavoritesProvider, isForcedMobileView, forcedMobileDesignWidth } from "./prototype/data";
import { DetailFooter, DetailUiProvider, VehicleDetail } from "./prototype/detail";
import { configureListingScreens, MarketplaceScreen, SavedListingsHeader, SavedListingsScreen } from "./prototype/listing";
import { BuildBadge } from "./prototype/build-badge";
import MainHome from "./main-home/MainHome";
import "./prototype.css";

// JOB-7: ?register 매물 등록 화면(dev /car/register 동일).
// 따로 나눠 불러오면(lazy) Pages 배포의 /assets/ → /bobaedream/assets/ 경로 변환이 조각 주소에 적용되지 않아 404가 나므로 함께 묶는다
import RegisterPage from "./prototype/register";

export type { PriceSelection, SellerType } from "./prototype/data";

const listScreen: FlowScreen = { id: "marketplace", render: () => <MarketplaceScreen /> };
const savedListingsScreen: FlowScreen = { id: "saved-listings", header: () => <SavedListingsHeader />, headerHeight: 58, render: () => <SavedListingsScreen /> };
const detailScreen: FlowScreen = { id: "vehicle-detail", footer: () => <DetailFooter />, footerHeight: 56, render: () => <VehicleDetail /> };

configureListingScreens({ detailScreen, savedListingsScreen });

const listingParams = ["qf", "scenario", "view", "titlepos", "filtericon", "desktop", "pc", "bbmparts", "pcl"];
const shouldShowMainHome = () => {
  const params = new URLSearchParams(window.location.search);
  return !listingParams.some((key) => params.has(key));
};
const shouldShowRegister = () => new URLSearchParams(window.location.search).has("register");

export default function Prototype() {
  const showRegister = shouldShowRegister();
  const showMainHome = showRegister || shouldShowMainHome();

  useEffect(() => {
    const root = document.documentElement;
    if (showMainHome) {
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
  if (showMainHome) return <MainHome />;

  return <FavoritesProvider><DetailUiProvider><FlowStack initial={listScreen} /><BuildBadge /></DetailUiProvider></FavoritesProvider>;
}
