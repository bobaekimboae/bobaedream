import { useEffect } from "react";
import { FlowStack, type FlowScreen } from "./mobile";
import { FavoritesProvider, isForcedMobileView, forcedMobileDesignWidth } from "./prototype/data";
import { DetailFooter, DetailUiProvider, VehicleDetail } from "./prototype/detail";
import { configureListingScreens, MarketplaceScreen, SavedListingsHeader, SavedListingsScreen } from "./prototype/listing";
import "./prototype.css";

export type { PriceSelection, SellerType } from "./prototype/data";

const listScreen: FlowScreen = { id: "marketplace", render: () => <MarketplaceScreen /> };
const savedListingsScreen: FlowScreen = { id: "saved-listings", header: () => <SavedListingsHeader />, headerHeight: 58, render: () => <SavedListingsScreen /> };
const detailScreen: FlowScreen = { id: "vehicle-detail", footer: () => <DetailFooter />, footerHeight: 56, render: () => <VehicleDetail /> };

configureListingScreens({ detailScreen, savedListingsScreen });

export default function Prototype() {
  useEffect(() => {
    const root = document.documentElement;
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
  }, []);

  return <FavoritesProvider><DetailUiProvider><FlowStack initial={listScreen} /></DetailUiProvider></FavoritesProvider>;
}
