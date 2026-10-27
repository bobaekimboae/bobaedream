// 리액트 src/prototype/listing/index.tsx 의 MarketplaceScreen(927~3682줄)을 Vue 렌더 함수(TSX)로 옮긴 것.
// 리액트 판과 줄 단위로 대조할 수 있게 본문을 그대로 두었다. 바꾼 규칙:
//  · useState → setup 의 useState(lib/listing/react-state)가 [x$, setX] 를 돌려주고, 렌더 함수 같은 자리에서 `const x = x$.value`
//  · useRef → setup 의 { current } 상자 · useEffect/useLayoutEffect/useMemo → hooks.effect/layoutEffect/memo(lib/render-hooks, 리액트와 같은 deps 규칙)
//  · useFlow · useKeyboard · useFavorites · useVehicleCatalog · useDesktopLayout · useMediaMatch → setup 에서 한 번
//  · 기본 요소 속성: className → class, htmlFor → for, fillRule → fill-rule, onPointerDown → onPointerdown 같은 이벤트 이름(Vue 규칙)
//  · ReactNode 를 prop 으로 받던 부품(DepthCard image 등)은 lib/listing/vue-adapters 로 감싸 같은 prop 이름을 그대로 쓴다(DOM 추가 없음)
//  · 리액트 판 railBrandLogo(key)(JSX 를 돌려주는 함수) → RailBrandLogo 부품 + hasRailBrandLogo
// 이 파일 안의 작은 부품(Header · FilterChip · CarCard …)은 MarketplaceParts.tsx, 모듈 상수·계산 함수는 lib/listing/marketplace-local.ts.
// 형식 검사: 2,700줄 리액트 JSX 를 줄 단위로 맞추려고 Vue JSX 형식 검사는 끈다(@ts-nocheck). 계산 부분은 리액트 판에서 검사된다.
// @ts-nocheck
import { defineComponent, h, type VNodeChild } from "vue";
import { useFlow } from "../../composables/mobile/useFlow";
import { useKeyboard } from "../../composables/mobile/useKeyboard";
import { useFavorites } from "../../composables/data/useFavorites";
import { useVehicleCatalog } from "../../composables/vehicle-catalog/useVehicleCatalog";
import { useDesktopLayout, useMediaMatch } from "../../composables/listing/useDesktopLayout";
import { renderHooks } from "../../lib/render-hooks";
import { useRef, useState } from "../../lib/listing/react-state";
import { adaptReactProps } from "../../lib/listing/vue-adapters";
import { detailScreen, savedListingsScreen } from "../../lib/listing/listing-screens";
import {
  allVehicleMixedCars,
  bbmCategoryDescription,
  bbmFilterIconName,
  bbmPartsMode,
  bikeTypeQuickOptions,
  bmwGuaziQuickRank,
  bmwGuaziSideVisuals,
  bmwGuaziThreeQuarterVisuals,
  bmwModelBodyTypes,
  carBodyQuickImage,
  carBodyQuickOptions,
  debugMode,
  desktopLayoutQuery,
  domesticModelsByBodyType,
  feedPhotosFor,
  ferrariBannerFull,
  ferrariLatestModelOrder,
  ferrariLatestModelRank,
  ferrariProvinceOrder,
  ferrariSpecialRegions,
  getInitialOldcarDecade,
  hybridLayoutQuery,
  hybridNarrowQuery,
  hyundaiBusModelVisuals,
  importedModelsByBodyType,
  initialAutohomeMakerSheetPreview,
  initialBbmMobileView,
  initialSeoulAutoGallerySection,
  initialTruckFormatSelection,
  oldcarDecades,
  pcBodyLinks,
  pcFilterLayout,
  pcLayoutStyle,
  pcPriceLinks,
  truckQuickLabel,
  wingbodyQuickSubtypes,
  type BbmMobileView,
  type CarBodyBrandTheme,
  type OldcarDecade,
} from "../../lib/listing/marketplace-local";
import { emptyChoTotFilters, type ChoTotFilterFocus, type ChoTotFilterState } from "@src/ChoTotFilterSheet";
import {
  asset,
  bodyTypeLabel,
  categoryBrandRails,
  chototTestCars,
  bbmSampleCars,
  bikeCars,
  campingCars,
  luxuryUiTestCars,
  luxuryCategoryCars,
  oldCarCategoryCars,
  jdmCategoryCars,
  supercarCategoryCars,
  compactYearLabel,
  compactGenerationCardYearLabel,
  emptyPrice,
  emptyRegion,
  formatModelLabel,
  getInitialChoTotFilters,
  getInitialQuickFilterStyle,
  generationCardLabel,
  generationCodeLabel,
  generationCountLabel,
  generationDisplayLabel,
  heavyCars,
  materialHandlingCars,
  partsCars,
  truckCars,
  seoulAutoGalleryCars,
  deutschAutoworldCars,
  joyMotorsCars,
  matchesChoTotFilters,
  normalizeModelSearchText,
  parsePrice,
  priceFilterLabel,
  quickFilterStyleOptions,
  quickGenerationsByMakerModel,
  quickModelVisualsByMaker,
  quickModelsByMaker,
  setActiveDetailCar,
  sheetLabels,
  showGuaziInventoryCounts,
  toTrimOption,
  vehicleCategories,
  vehicleCategoryOptions,
  type Car,
  type QuickGenerationOption,
  type QuickModelVisual,
  type QuickTrimOption,
  type QuickFilterStyle,
  type RegionSelection,
  type SellerType,
  type SheetType,
} from "@proto/data";
import { bbCatalog, bbLnbVariant, bbStandaloneBikeSite, bbStandaloneTruckSite, type BbMakerSelection, type BbMakerSection, type BbTruckFilter } from "@proto/listing/pc-bbmuseum";
import { bbmCarChecks, emptyBbmFilters, isBbmDataOption, matchesBbmFilters, resetBbmFilters, setBbmChecks, setBbmRange, type BbmCheckKey, type BbmFilterValues } from "@proto/filters/bbm-filter-state";
import { bbmAppliedChips, bbmItemValue } from "@proto/filters/bbm-applied";
import { mileageSummary } from "@proto/filters/bbm-mileage";
import { BBM_MAKER_ITEM, bbmFilterOrder, bbmSidebarItems, bikeFilterOrder, daangnFilterLabel, partsFilterOrder, partsPricePresets, splitDaangnFilterOrder, truckFilterOrder, type BbmFilterItem } from "@proto/filters/bbm-filter-options";
import { clearBbmItem } from "@proto/filters/bbm-filter-panels";
import { bbmCategoryGroups, bbmGroupLabel, bbmIcon } from "@proto/listing/bbm-list";
import { categoryRailLabel, krRailLabel, krTopTenSections, krTypeTop10 } from "@proto/listing/bbm-brand-logos";
import { luxuryLogoBrands, luxuryLogoPath, luxuryLogoSource } from "@proto/listing/luxury-logo-rail";
import { luxuryHeadVariant } from "@proto/listing/luxury-theme-header";
import { stableRegionLabel, stablePageTitle, stableKeywordPills } from "@proto/listing/stable-top";
import { catalogMakerNames, catalogModelOfCar, guaziGenerationsByMakerModel, guaziModelVisualsByMaker, guaziModelsByMaker } from "@proto/listing/model-catalog-kr";
import type { BbmCrumb } from "@proto/listing/bbm-top-chotot";
import { setPretendard } from "@proto/fonts/pretendard";
import { BBM_PAGE_SIZE, bbmSortOptions, bbmViewOptionsMobile, bbmViewOptionsPc, sortBbmCars, type BbmSort } from "@proto/listing/bbm-list-area";
import { bikeListingModelsByMaker, bikeListingModelVisualsByMaker } from "@proto/bike/data";
import { bikeModelsByMaker } from "@proto/data/bike-filter-catalog";
import { truckFormatCatalog, truckSubtypeImageFor, truckSubtypeLabel, truckSubtypesFor, truckSubtypeSecondaryLabel, truckSubtypeValuesForSelection } from "@proto/data/truck-format-catalog";
import { truckSpecGroupsFor } from "@proto/data/truck-depth4-catalog";
import { truckModelsByMaker } from "@proto/truck/scenario-v09";
import type { SeoulAutoGalleryDealer } from "@proto/listing/seoul-auto-gallery-dealer-rail";
import type { SeoulAutoGallerySection } from "@proto/listing/seoul-auto-gallery-directory";
import { emptyHeavySelection, getInitialHeavySelection, replaceHeavyParams, type HeavySelection } from "@proto/heavy/data";
import type { VehicleSearchRecord } from "@proto/vehicle-catalog";
import "@proto/listing/qf-pc-view-modes.css";
import "@proto/listing/qf-m-view-modes.css";
import "@proto/listing/qf-car-body-types.css";
import "@proto/listing/qf-chotot-vehicle-slots.css";
import "@proto/listing/qf-brand-shadowcard.css";
import "@proto/listing/bike-site-theme.css";
import "@proto/listing/truck-site-theme.css";
// Vue 부품
import BottomSheet from "../mobile/BottomSheet.vue";
import Carousel from "../mobile/Carousel.vue";
import MobileScroll from "../mobile/MobileScroll.vue";
import ChoTotFilterSheet from "../ChoTotFilterSheet.vue";
import ChoTotQuickFilterSheet from "../ChoTotQuickFilterSheet.vue";
import Icon from "../shared/Icon.vue";
import BrandRailMark from "../quick-filter/BrandRailMark.vue";
import CategoryFilterSheet from "../quick-filter/CategoryFilterSheet.vue";
import DepthCardVue from "../quick-filter/DepthCard.vue";
import DepthTextChip from "../quick-filter/DepthTextChip.vue";
import MakerSheet from "../quick-filter/MakerSheet.vue";
import ModelImagePillVue from "../quick-filter/ModelImagePill.vue";
import PriceSheet from "../quick-filter/PriceSheet.vue";
import TrimChip from "../quick-filter/TrimChip.vue";
import VehiclePickerSheetVue from "../quick-filter/VehiclePickerSheet.vue";
import BbBreadcrumb from "./BbBreadcrumb.vue";
import BbLnbTitleMenu from "./BbLnbTitleMenu.vue";
import BbLnbTitleTabs from "./BbLnbTitleTabs.vue";
import BbFilterSidebarVue from "./BbFilterSidebar.vue";
import BbHeaderVue from "./BbHeader.vue";
import BbSecondaryNav from "./BbSecondaryNav.vue";
import BbSwitch from "./BbSwitch.vue";
import MileageFinalSheet from "../filters/MileageFinalSheet.vue";
import PriceFinalSheet from "../filters/PriceFinalSheet.vue";
import BbmPartsGallery from "../filters/BbmPartsGallery.vue";
import BbmActionBar from "../filters/BbmActionBar.vue";
import BbmFullExcludeAction from "../filters/BbmFullExcludeAction.vue";
import BbmFullFilterVue from "../filters/BbmFullFilter.vue";
import BbmFullItemVue from "../filters/BbmFullItem.vue";
import BbmModalVue from "../filters/BbmModal.vue";
import BbmSheetVue from "../filters/BbmSheet.vue";
import BbmBodyTypeSheet from "../filters/BbmBodyTypeSheet.vue";
import BbmExpandPanel from "../filters/BbmExpandPanel.vue";
import BbmModalPanel from "../filters/BbmModalPanel.vue";
import BbmSellerTypeSheet from "../filters/BbmSellerTypeSheet.vue";
import TruckTypePicker from "../filters/TruckTypePicker.vue";
import BbmBottomGnb from "./BbmBottomGnb.vue";
import BbmBrandMenuVue from "./BbmBrandMenu.vue";
import BbmCategoryMenuVue from "./BbmCategoryMenu.vue";
import BbmCategoryPicker from "./BbmCategoryPicker.vue";
import BbmGroupRail from "./BbmGroupRail.vue";
import BbmHeadlinePreviewLinks from "./BbmHeadlinePreviewLinks.vue";
import BbmMakerListVue from "./BbmMakerList.vue";
import BbmMobileOptionsVue from "./BbmMobileOptions.vue";
import BbmModelList from "./BbmModelList.vue";
import BbmOneLineCard from "./BbmOneLineCard.vue";
import BbmResultCard from "./BbmResultCard.vue";
import BbmTextViewTable from "./BbmTextViewTable.vue";
import BbmFilterDrawer from "./BbmFilterDrawer.vue";
import CategoryBrandLogo from "./CategoryBrandLogo.vue";
import RailBrandLogo, { hasRailBrandLogo } from "./RailBrandLogo.vue";
import LuxuryThemeHeroVue from "./LuxuryThemeHero.vue";
import StableRegionSheet from "./StableRegionSheet.vue";
import StableYearRow from "./StableYearRow.vue";
import CatalogModelImage from "./CatalogModelImage.vue";
import BbmChipScroller from "./BbmChipScroller.vue";
import BbmTopCrumbs from "./BbmTopCrumbs.vue";
import BbmFooter from "./BbmFooter.vue";
import BbmPagination from "./BbmPagination.vue";
import BbmPopOptions from "./BbmPopOptions.vue";
import BbmToolbarMenu from "./BbmToolbarMenu.vue";
import QuickRailCarousel from "./QuickRailCarousel.vue";
import MakerHierarchyModalVue from "./MakerHierarchyModal.vue";
import HeavyQuickFilter from "../heavy/HeavyQuickFilter.vue";
import HeavySidebarFilters from "../heavy/HeavySidebarFilters.vue";
import SeoulAutoGalleryDealerRail from "./SeoulAutoGalleryDealerRail.vue";
import SeoulAutoGalleryHeader from "./SeoulAutoGalleryHeader.vue";
import DeutschAutoworldHeader from "./DeutschAutoworldHeader.vue";
import SkV1MotorsHeader from "./SkV1MotorsHeader.vue";
import DeutschAutoworldAbout from "./DeutschAutoworldAbout.vue";
import DeutschAutoworldCompanyDirectory from "./DeutschAutoworldCompanyDirectory.vue";
import DeutschAutoworldDealerDirectory from "./DeutschAutoworldDealerDirectory.vue";
import DeutschAutoworldDealerRail from "./DeutschAutoworldDealerRail.vue";
import DeutschAutoworldTabs from "./DeutschAutoworldTabs.vue";
import SupercarCategoryHeader from "./SupercarCategoryHeader.vue";
import FerrariCategoryHeader from "./FerrariCategoryHeader.vue";
import OldcarCategoryHeader from "./OldcarCategoryHeader.vue";
import SeoulAutoGalleryAbout from "./SeoulAutoGalleryAbout.vue";
import SeoulAutoGalleryCompanyDirectory from "./SeoulAutoGalleryCompanyDirectory.vue";
import SeoulAutoGalleryTabs from "./SeoulAutoGalleryTabs.vue";
import CatalogLogo from "../vehicle-catalog/CatalogLogo.vue";
import CatalogVehicleImage from "../vehicle-catalog/CatalogVehicleImage.vue";
import CatalogVehiclePickerSheet from "../vehicle-catalog/CatalogVehiclePickerSheet.vue";
import VideoListingViewer from "./VideoListingViewer.vue";
import ChevronRightIcon from "../icons/ChevronRightIcon.vue";
import ChevronDownIcon from "../icons/ChevronDownIcon.vue";
import BookmarkFilledIcon from "../icons/BookmarkFilledIcon.vue";
import BookmarkIcon from "../icons/BookmarkIcon.vue";
import DashboardIcon from "../icons/DashboardIcon.vue";
import RowsIcon from "../icons/RowsIcon.vue";
import { BbmCatalogHeaderSearch, CarCard, FilterChip, Header, PcCarRow, PcHeader, PcSidebarCard, RegionSheet } from "./MarketplaceParts";

type ReactNode = VNodeChild;

// ReactNode · 그리는 함수를 prop 으로 받던 부품 → slot 으로 바꿔 넘기는 얇은 감싸기(lib/listing/vue-adapters)
const DepthCard = adaptReactProps(DepthCardVue, { node: { image: "image" } }, "DepthCard");
const ModelImagePill = adaptReactProps(ModelImagePillVue, { node: { image: "image" } }, "ModelImagePill");
const BbHeader = adaptReactProps(BbHeaderVue, { node: { searchSlot: "searchSlot" } }, "BbHeader");
const BbFilterSidebar = adaptReactProps(BbFilterSidebarVue, { node: { leadingFilters: "leadingFilters" } }, "BbFilterSidebar");
const LuxuryThemeHero = adaptReactProps(LuxuryThemeHeroVue, { node: { header: "header" } }, "LuxuryThemeHero");
const BbmMobileOptions = adaptReactProps(BbmMobileOptionsVue, { node: { extra: "extra" } }, "BbmMobileOptions");
const BbmModal = adaptReactProps(BbmModalVue, { node: { footer: "footer", titleIcon: "titleIcon" }, show: { onBack: "showBack" } }, "BbmModal");
const BbmSheet = adaptReactProps(BbmSheetVue, { node: { footer: "footer" }, show: { onBack: "showBack" } }, "BbmSheet");
const BbmFullFilter = adaptReactProps(BbmFullFilterVue, { node: { footer: "footer" } }, "BbmFullFilter");
const BbmFullItem = adaptReactProps(BbmFullItemVue, { show: { onClear: "showClear" } }, "BbmFullItem");
const BbmCategoryMenu = adaptReactProps(BbmCategoryMenuVue, { show: { onOpenGroup: "showOpenGroup" } }, "BbmCategoryMenu");
const VehiclePickerSheet = adaptReactProps(VehiclePickerSheetVue, { render: { renderMakerLogo: ["maker-logo", (fn, { option }) => fn(option)] } }, "VehiclePickerSheet");
const MakerHierarchyModal = adaptReactProps(MakerHierarchyModalVue, { render: { renderMakerLogo: ["makerLogo", (fn, { maker }) => fn(maker)] } }, "MakerHierarchyModal");
const BbmMakerList = adaptReactProps(BbmMakerListVue, { render: { renderLogo: ["logo", (fn, { rowKey, label }) => fn(rowKey, label)] } }, "BbmMakerList");
const BbmBrandMenu = adaptReactProps(BbmBrandMenuVue, { render: { renderLogo: ["logo", (fn, { name }) => fn(name)] } }, "BbmBrandMenu");
// 리액트 bbm-brand-logos.tsx 의 railBrandLogo(name): 로고 파일이 없으면 null, 있으면 로고 요소
const railBrandLogo = (name: string) => (hasRailBrandLogo(name) ? h(RailBrandLogo, { name }) : null);

// QF-120: 모듈을 읽는 순간(첫 렌더 전) 과쯔면 글꼴 CSS·미리 불러오기를 붙여 글꼴 요청을 앞당김
if (getInitialQuickFilterStyle() === "guazi") setPretendard(true);

export default defineComponent({
  name: "MarketplaceScreen",
  setup() {
    const flow = useFlow();
    const keyboard = useKeyboard();
    const favorites = useFavorites();
    const initialFilters = getInitialChoTotFilters();
    const [query$, setQuery] = useState(() => new URLSearchParams(window.location.search).get("q") ?? "");
    const [filters$, setFilters] = useState<ChoTotFilterState>(() => initialFilters);
    const [draftFilters$, setDraftFilters] = useState<ChoTotFilterState>(() => initialFilters);
    const [heavySelection$, setHeavySelection] = useState<HeavySelection>(() => getInitialHeavySelection());
    const [selectedTruckFormat$, setSelectedTruckFormat] = useState<string | null>(() => initialFilters.category === "트럭 · 특장" ? initialTruckFormatSelection().format : null);
    const [selectedTruckSubtype$, setSelectedTruckSubtype] = useState<string | null>(() => initialFilters.category === "트럭 · 특장" ? initialTruckFormatSelection().subtype : null);
    const [selectedTruckSpec$, setSelectedTruckSpec] = useState<string | null>(() => initialFilters.category === "트럭 · 특장" ? initialTruckFormatSelection().spec : null);
    const [selectedOldcarDecade$, setSelectedOldcarDecade] = useState<OldcarDecade | null>(() => initialFilters.category === "올드카" ? getInitialOldcarDecade() : null);
    const [selectedFerrariDealer$, setSelectedFerrariDealer] = useState<string | null>(null);
    const [truckTypePickerOpen$, setTruckTypePickerOpen] = useState(false);
    const [filterFocus$, setFilterFocus] = useState<ChoTotFilterFocus | null>(null);
    const [quickFilterFocus$, setQuickFilterFocus] = useState<ChoTotFilterFocus | null>(null);
    const [sheet$, setSheet] = useState<SheetType>(null);
    const [stableRegionOpen$, setStableRegionOpen] = useState(false);
    const [sort$, setSort] = useState("최신순");
    const [cardView$, setCardView] = useState(false);
    const [region$, setRegion] = useState<RegionSelection>(emptyRegion);
    const [draftRegion$, setDraftRegion] = useState<RegionSelection>(emptyRegion);
    const [searchSaved$, setSearchSaved] = useState(false);
    const [searchToast$, setSearchToast] = useState("");
    const [videoViewerOpen$, setVideoViewerOpen] = useState(() => new URLSearchParams(window.location.search).get("video") === "1");
    const [seoulAutoGallerySection$, setSeoulAutoGallerySection] = useState<SeoulAutoGallerySection>(initialSeoulAutoGallerySection);
    const [categoryLandingOpen$, setCategoryLandingOpen] = useState(() => !initialFilters.maker && initialFilters.category === "전체");
    const [quickFilterStyle$, setQuickFilterStyle] = useState<QuickFilterStyle>(() => getInitialQuickFilterStyle());
    const [selectedGeneration$, setSelectedGeneration] = useState<string | null>(() => new URLSearchParams(window.location.search).get("generation"));
    const [selectedVariants$, setSelectedVariants] = useState<string[]>(() => new URLSearchParams(window.location.search).getAll("grade"));
    const [selectedGradeLevels$, setSelectedGradeLevels] = useState<string[]>(() => new URLSearchParams(window.location.search).getAll("gradeLevel"));
    const [selectedGradeGroups$, setSelectedGradeGroups] = useState<string[]>(() => new URLSearchParams(window.location.search).getAll("gradeGroup"));
    const [catalogSelectionRecord$, setCatalogSelectionRecord] = useState<VehicleSearchRecord | null>(null);
    const [debouncedSelectedVariants$, setDebouncedSelectedVariants] = useState<string[]>([]);
    const [trimApplied$, setTrimApplied] = useState(false);
    const [bbmDrawerOpen$, setBbmDrawerOpen] = useState(false);
    const [bbmDrawerReset$, setBbmDrawerReset] = useState(0);
    const [bbmTopReset$, setBbmTopReset] = useState(0);
    const [bbmFullOpen$, setBbmFullOpen] = useState(() => initialAutohomeMakerSheetPreview());
    const [bbmFullMoreOpen$, setBbmFullMoreOpen] = useState(false);
    const [bbmAvailableOnly$, setBbmAvailableOnly] = useState(false);
    const [bbmFullAvailableOnly$, setBbmFullAvailableOnly] = useState(false);
    const [bbmCategoryOpen$, setBbmCategoryOpen] = useState(false);
    const [bbmCategoryDraft$, setBbmCategoryDraft] = useState(() => initialFilters.category);
    const [bbmCategoryChild$, setBbmCategoryChild] = useState<string | null>(null);
    const [groupRail$, setGroupRail] = useState<string | null>(null);
    const [bbmCategoryChildDraft$, setBbmCategoryChildDraft] = useState<string | null>(null);
    const [bbmFullItem$, setBbmFullItem] = useState<BbmFilterItem | "카테고리" | "제조사 · 모델" | null>(() => initialAutohomeMakerSheetPreview() ? "제조사 · 모델" : null);
    const [bbmMakerDraft$, setBbmMakerDraft] = useState<string | null>(() => initialAutohomeMakerSheetPreview() ? initialFilters.maker : null);
    const [bbmKeepSearch$, setBbmKeepSearch] = useState(false);
    const [bbmChipPanel$, setBbmChipPanel] = useState<string | null>(null);
    const [bbmFrozen$, setBbmFrozen] = useState<{ cars: typeof chototTestCars; history: number } | null>(null);
    const [bbmFullDraft$, setBbmFullDraft] = useState<BbmFilterValues | null>(null);
    const [pcGridView$, setPcGridView] = useState(false);
    const [bbmSort$, setBbmSort] = useState<BbmSort>("업데이트순");
    const [bbmPage$, setBbmPage] = useState(1);
    const [bbmMenu$, setBbmMenu] = useState<"sort" | "view" | "m-sort" | "m-view" | null>(null);
    const [bbmMobileView$, setBbmMobileView] = useState<BbmMobileView>(initialBbmMobileView);
    const [bbmRailScrolled$, setBbmRailScrolled] = useState(false);
    const pcFilterRowRef = useRef<HTMLDivElement | null>(null);
    const [pcFilterCanScroll$, setPcFilterCanScroll] = useState(false);
    const [selectedBikeShop$, setSelectedBikeShop] = useState<string | null>(() => new URLSearchParams(window.location.search).get("bikeShop"));
    const [allRailOpen$, setAllRailOpen] = useState<Record<string, boolean>>({ type: true, region: true, info: true });
    const railLeftWide = useRef<number | null>(null);
    const desktop$ = useDesktopLayout(() => quickFilterStyle$.value === "guazi" && pcLayoutStyle === "bbmuseum" ? hybridLayoutQuery : desktopLayoutQuery);
    const hybridNarrow$ = useMediaMatch(hybridNarrowQuery);
    const vehicleCatalog = useVehicleCatalog(() => (filters$.value.category === "바이크" ? "bike" : "car"), () => filters$.value.maker);
    const hooks = renderHooks();

    return () => {
      hooks.begin();
      // (setup) const flow = useFlow();
      const openCarDetail = (car: Car) => {
        // 사진이 1장뿐인 매물도 상세에서 썸네일 줄이 보이도록 피드와 같은 임시 슬라이드(3~6장)를 붙인다. 실제 다중 사진이 오면 photoList를 그대로 쓴다
        const slides = feedPhotosFor(shownCars, shownCars.findIndex((other) => other.id === car.id));
        setActiveDetailCar(slides && slides.length > 1 && !(car.photoList && car.photoList.length > 1) ? { ...car, photoList: slides } : car);
        flow.push(detailScreen);
      };
      // 딜러 화면은 목록 위 덮개가 아닌 독립 화면(?profile=dealer)이다. 같은 탭에서 열어 뒤로 가기로 목록에 돌아온다.
      const openDealerProfile = (dealer: SeoulAutoGalleryDealer) => {
        window.location.assign(`${window.location.pathname}?profile=dealer&shop=${dealer.shopNo}&emp=${dealer.empNo}`);
      };
      // (setup) const keyboard = useKeyboard();
      const likedIds = favorites.likedIds.value; const { toggleLiked } = favorites;
      // (setup) const initialFilters = getInitialChoTotFilters();
      const query = query$.value;
      const filters = filters$.value;
      const draftFilters = draftFilters$.value;
      const heavySelection = heavySelection$.value;
      const selectedTruckFormat = selectedTruckFormat$.value;
      const selectedTruckSubtype = selectedTruckSubtype$.value;
      const selectedTruckSpec = selectedTruckSpec$.value;
      const selectedOldcarDecade = selectedOldcarDecade$.value;
      const selectedFerrariDealer = selectedFerrariDealer$.value;
      const truckTypePickerOpen = truckTypePickerOpen$.value;
      const filterFocus = filterFocus$.value;
      const quickFilterFocus = quickFilterFocus$.value;
      const sheet = sheet$.value;
      // QF-111 과쯔 모바일 지역 바텀시트(시도 → 구·군)
      const stableRegionOpen = stableRegionOpen$.value;
      const sort = sort$.value;
      const cardView = cardView$.value;
      const region = region$.value;
      const draftRegion = draftRegion$.value;
      const searchSaved = searchSaved$.value;
      const searchToast = searchToast$.value;
      const videoViewerOpen = videoViewerOpen$.value;
      const seoulAutoGallerySection = seoulAutoGallerySection$.value;
      const categoryLandingOpen = categoryLandingOpen$.value;
      const quickFilterStyle = quickFilterStyle$.value;
      // QF-120: 과쯔일 때만 Pretendard Variable(첫 그림 전에 붙이도록 layout effect)
      hooks.layoutEffect(() => { setPretendard(quickFilterStyle === "guazi"); }, [quickFilterStyle]);
      const selectedGeneration = selectedGeneration$.value;
      const selectedVariants = selectedVariants$.value;
      const selectedGradeLevels = selectedGradeLevels$.value;
      const selectedGradeGroups = selectedGradeGroups$.value;
      const catalogSelectionRecord = catalogSelectionRecord$.value;
      const debouncedSelectedVariants = debouncedSelectedVariants$.value;
      const trimApplied = trimApplied$.value;
      hooks.effect(() => {
        if (!ferrariSpecialRegions.includes(region.province as (typeof ferrariSpecialRegions)[number])) setSelectedFerrariDealer(null);
      }, [region.province]);
      const desktop = desktop$.value;
      const hybridNarrow = hybridNarrow$.value;
      // QF-093: 1024~1279 왼쪽 필터 펼침판
      const bbmDrawerOpen = bbmDrawerOpen$.value;
      const bbmDrawerReset = bbmDrawerReset$.value;
      // QF-095: 상단 칩 줄 오른쪽 끝 "필터 초기화" → 좌측 필터 "초기화"와 같은 확인 창
      const bbmTopReset = bbmTopReset$.value;
      // QF-091: 과쯔(개발 시안형) 모바일 전체 필터 화면과 그 안의 항목 시트
      const bbmFullOpen = bbmFullOpen$.value;
      const bbmFullMoreOpen = bbmFullMoreOpen$.value;
      const bbmAvailableOnly = bbmAvailableOnly$.value;
      const bbmFullAvailableOnly = bbmFullAvailableOnly$.value;
      const bbmCategoryOpen = bbmCategoryOpen$.value;
      const bbmCategoryDraft = bbmCategoryDraft$.value;
      const bbmCategoryChild = bbmCategoryChild$.value;
      // 동그란 카테고리 줄에서 그룹(중고차 · 테마별 중고차 · 캠핑카)을 눌렀을 때 하위 칩 줄을 보여주는 중인 그룹
      const groupRail = groupRail$.value;
      const bbmCategoryChildDraft = bbmCategoryChildDraft$.value;
      const bbmFullItem = bbmFullItem$.value;
      const bbmMakerDraft = bbmMakerDraft$.value;
      const bbmKeepSearch = bbmKeepSearch$.value;
      // QF-085·086: 상단 칩 모달(PC)·바텀시트(모바일). "제조사" · "모델" · 사이드바 항목 이름
      const bbmChipPanel = bbmChipPanel$.value;
      // 적용 칩(예: "SUV")을 눌러 연 모달인지(원본: 버튼이 항상 "N대 보기")
      // 원본 실측(2026-09-24): 상단 칩 모달·시트는 고르는 즉시 적용 칩·배지가 바뀌지만 목록·총 대수·최근검색기록은 창을 닫을 때 갱신된다(bbmFrozen).
      // 모바일 전체 필터 안의 항목 시트는 초안(bbmFullDraft)이고 시트의 [N대 보기]에서 건다
      const bbmFrozen = bbmFrozen$.value;
      const bbmFullDraft = bbmFullDraft$.value;
      const pcGridView = pcGridView$.value;
      // QF-092: 과쯔 목록 영역 — 정렬(원본 10개) · 페이지(한 페이지 20대) · 열린 메뉴(PC 드롭다운 sort·view, 모바일 시트 m-sort·m-view)
      const bbmSort = bbmSort$.value;
      const bbmPage = bbmPage$.value;
      const bbmMenu = bbmMenu$.value;
      const bbmMobileView = bbmMobileView$.value;
      // 모바일 칩 줄이 가로로 밀려 있으면 "필터" 칩을 아이콘만 + 오른쪽 구분선(원본 is-scrolled)
      const bbmRailScrolled = bbmRailScrolled$.value;
      // 모바일 칩 줄 고정 막대(2026-10-10 「하단 내리면 필터 스티치 어설프다 고정위치」): 칩 줄이 위에 붙으면 위 10 · 아래 8 여백과 아래 구분선을 준다(레이아웃은 그대로, box-shadow 만)
      hooks.effect(() => {
        const scroller = document.querySelector<HTMLElement>(".mobile-scroll");
        const shell = document.querySelector<HTMLElement>(".marketplace.is-bbm-m > .filter-shell.is-bbm");
        if (!scroller || !shell) return;
        let frame = 0;
        const update = () => {
          frame = 0;
          const stuck = shell.getBoundingClientRect().top <= scroller.getBoundingClientRect().top + 10.5 && scroller.scrollTop > 0;
          shell.classList.toggle("is-stuck", stuck);
        };
        const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
        scroller.addEventListener("scroll", onScroll, { passive: true });
        update();
        return () => { scroller.removeEventListener("scroll", onScroll); cancelAnimationFrame(frame); shell.classList.remove("is-stuck"); };
      });
      // (setup) const pcFilterRowRef = useRef(...)
      const pcFilterCanScroll = pcFilterCanScroll$.value;
  
      hooks.effect(() => {
        if (!searchToast) return;
        const timer = window.setTimeout(() => setSearchToast(""), 1800);
        return () => window.clearTimeout(timer);
      }, [searchToast]);
  
      hooks.effect(() => {
        const syncVideoViewer = () => setVideoViewerOpen(new URLSearchParams(window.location.search).get("video") === "1");
        window.addEventListener("popstate", syncVideoViewer);
        return () => window.removeEventListener("popstate", syncVideoViewer);
      }, []);
  
      hooks.effect(() => {
        const url = new URL(window.location.href);
        const normalizedQuery = query.trim();
        if (normalizedQuery) url.searchParams.set("q", normalizedQuery);
        else url.searchParams.delete("q");
        window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
      }, [query]);
  
      const closeSheet = () => {
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        keyboard.hide();
        setSheet(null);
      };
      const openVideoViewer = () => {
        const url = new URL(window.location.href);
        url.searchParams.set("video", "1");
        window.history.pushState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
        setVideoViewerOpen(true);
      };
      const closeVideoViewer = () => {
        const url = new URL(window.location.href);
        url.searchParams.delete("video");
        window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
        setVideoViewerOpen(false);
      };
  
      const regionLabel = region.radius ? `내 주변 ${region.radius}` : [region.province, region.district, region.neighborhood].filter(Boolean).join(" ") || "전국";
      const regionKeyword = region.province === "광주" ? "광주" : region.province;
      const { maker, model: selectedModel, price, seller: sellerType, videoOnly, category } = filters;
      const isBikeCategory = category === "바이크";
      const sellerTabLabel = (tab: SellerType) => isBikeCategory && tab === "딜러" ? "바이크샵" : tab;
      const selectedBikeShop = selectedBikeShop$.value;
      const isHeavyCategory = category === "건설기계";
      const isMaterialHandlingCategory = category === "자재운반장비";
      const isCampingCategory = category === "캠핑카";
      const isPartsCategory = category === "부품 · 용품";
      const bikeMenuMode = typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("bikeMenu");
      const isStandaloneBikeSite = bbStandaloneBikeSite();
      const isStandaloneTruckSite = bbStandaloneTruckSite();
      const truckMenuMode = typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("truckMenu");
      // 럭셔리카(차량 › 중고차 › 럭셔리카): 과쯔에서는 전용 가상 매물 29대(luxury-category-v01)
      const isLuxuryCategory = category === "럭셔리카";
      // 수입차·슈퍼카·서울오토갤러리는 럭셔리카와 같은 16개 브랜드·로고 슬롯을 사용한다.
      // 각 카테고리의 매물 데이터는 그대로 유지한다.
      const usesLuxuryBrandRail = isLuxuryCategory || category === "수입차" || category === "슈퍼카" || category === "서울오토갤러리" || category === "SK V1 모터스";
      const isTruckCategory = category === "트럭 · 특장";
      const isUsedCarCategory = !isTruckCategory && !isHeavyCategory && !isMaterialHandlingCategory && !isBikeCategory && !isCampingCategory && !isPartsCategory;
      // PC 바이크·트럭·중장비도 중고차와 같은 차란차형 2열 구조(좌측 필터 + 우측 검색조건/매물)를 쓴다.
      // 필터 항목과 제조사 데이터는 각 카테고리 전용 값을 유지하고 배치 규칙만 공유한다.
      const usesReferencePcLayout = isUsedCarCategory || isBikeCategory || isTruckCategory || isHeavyCategory;
      const supportsVehicleCatalog = isBikeCategory || ["전체", "중고차", "국산차", "수입차", "전기차", "럭셔리카", "슈퍼카", "서울오토갤러리", "도이치오토월드", "SK V1 모터스"].includes(category);
      // (setup) const vehicleCatalog = useVehicleCatalog(...)
      const autohomeLogoPreview = new URLSearchParams(window.location.search).get("brandlogo") === "autohome";
      const truckDepthPreviewMode = typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("truckdepth");
      const showWingbodyImageDepth = selectedTruckFormat === "윙바디/탑" && truckDepthPreviewMode === "image";
      const showWingbodyPillDepth = selectedTruckFormat === "윙바디/탑" && truckDepthPreviewMode === "pill";
      const truckSubtypeOptions = truckSubtypesFor(selectedTruckFormat);
      const truckSpecGroups = truckSpecGroupsFor(selectedTruckFormat, selectedTruckSubtype);
      const truckSpecOptions = truckSpecGroups.flatMap((group) => group.options.map((option) => ({ group: group.label, value: option })));
      const applyHeavySelection = (next: HeavySelection) => {
        setHeavySelection(next);
        replaceHeavyParams(next);
      };
      const clearHeavyForm = () => applyHeavySelection(emptyHeavySelection);
      const clearHeavyMaker = () => applyHeavySelection(emptyHeavySelection);
      const clearHeavyModel = () => applyHeavySelection({
        ...heavySelection,
        form: null,
        detail: null,
        model: null,
        submodel: null,
        equipmentTypeCode: null,
        detailTypeCode: null,
        modelCode: null,
        submodelCode: null,
      });
      const clearHeavySubmodel = () => applyHeavySelection({
        ...heavySelection,
        form: null,
        detail: null,
        submodel: null,
        equipmentTypeCode: null,
        detailTypeCode: null,
        submodelCode: null,
      });
      const categoryIsDefault = category === "전체";
      const usedCarChildValues = (bbmCategoryGroups.find((group) => group.value === "중고차")?.children ?? []).map((child) => child.value).filter((value) => value !== "중고차");
      // 전체 중고차 랜딩은 GNB와 제목만 유지하고 퀵필터 안의 중복 텍스트 하위 카테고리는 표시하지 않는다.
      const showDefaultCategoryLnb = !isStandaloneBikeSite && (isTruckCategory || ["국산차", "수입차", "전기차", "리스/렌트차량", "브랜드 인증중고차", "서울오토갤러리", "매매단지별 검색"].includes(category));
      const pageCategoryTitle = isStandaloneBikeSite && isBikeCategory ? "보배드림 바이크" : isStandaloneTruckSite && isTruckCategory ? "보배드림 트럭" : isPartsCategory && truckMenuMode === "parts" ? "트럭 부품" : isPartsCategory && bikeMenuMode === "parts" ? "중고 용품·장비" : category === "중고차" ? "전체 중고차" : stablePageTitle(category);
      const categorySearchPlaceholder = isStandaloneBikeSite && isBikeCategory ? "중고 바이크" : isStandaloneTruckSite && isTruckCategory ? "중고 트럭" : categoryIsDefault ? "전체차량" : pageCategoryTitle;
      const categoryBrandRail = categoryBrandRails[category] ?? categoryBrandRails["전체"];
      // QF-097: 과쯔 카탈로그 제조사(9개)도 모델 → 세부 모델 → 트림 단계
      const usesUxDepth = Boolean(isTruckCategory && maker) || Boolean(supportsVehicleCatalog && maker && vehicleCatalog.index?.manufacturers.some((item) => item.name === maker));
      const isGuaziQuickStyle = quickFilterStyle === "guazi";
      // 2026-10-19 「전체차량은 피씨에서는 좌측 필터가 안쓰는게 어떨까 → 진행해라」: 여러 차종이 섞인 전체 차량 목록은 PC 좌측 필터를 숨기고 목록을 전체 폭으로, 상단 칩은 가격 · 지역만 둔다.
      const allVehiclesWide = isGuaziQuickStyle && category === "전체" && !isStandaloneBikeSite && !isStandaloneTruckSite;
      const quickCardMode = typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("qfcard");
      // 2026-10-15 「이 디자인으로 별도 주소」: 흰 카드 + 그림자 + 이름 · (대수) 브랜드 칩 테스트(&qfbrand=shadowcard).
      const brandShadowCard = isGuaziQuickStyle && typeof window !== "undefined" && new URLSearchParams(window.location.search).get("qfbrand") === "shadowcard";
      const carBodyBrandTheme: CarBodyBrandTheme = category === "국산차" ? "hyundai" : "mercedes";
      // 과쯔 카드칩 비교 시안: 기존 plain/card 모드는 그대로 두고 모델 뎁스만 가변폭 카드 레일로 비교한다.
      const guaziCardChipPreview = isGuaziQuickStyle && quickCardMode === "guazi-card";
      const guaziCardSidePreview = guaziCardChipPreview
        && maker === "BMW"
        && typeof window !== "undefined"
        && new URLSearchParams(window.location.search).get("qfangle") === "side";
      const guaziCardThreeQuarterPreview = guaziCardChipPreview
        && maker === "BMW"
        && typeof window !== "undefined"
        && new URLSearchParams(window.location.search).get("qfangle") === "three-quarter";
      // 브랜드 최종안: 럭셔리 16개 브랜드 레일은 사각칩 비교 파라미터가 있어도 무배경형을 유지한다.
      // 제조사를 선택한 뒤의 모델 비교 시안에는 기존 qfcard 동작을 그대로 남긴다.
      const forcePlainLuxuryBrandRail = usesLuxuryBrandRail && !maker;
      const plainQuickCards = isGuaziQuickStyle && (forcePlainLuxuryBrandRail || (quickCardMode !== "card" && quickCardMode !== "guazi-card"));
      // 2026-10-09 초톳 가로형 이미지 알약칩 비교 시안. 기본 모델 레일은 유지한다.
      const horizontalBikeModelPills = isGuaziQuickStyle
        && isBikeCategory
        && maker === "BMW"
        && typeof window !== "undefined"
        && new URLSearchParams(window.location.search).get("qfmodelpill") === "chotot";
      const textOnlyBikeModelPills = isGuaziQuickStyle
        && isBikeCategory
        && maker === "BMW"
        && typeof window !== "undefined"
        && new URLSearchParams(window.location.search).get("qfmodelpill") === "text";
      const horizontalBikeBrandPills = isGuaziQuickStyle
        && isBikeCategory
        && typeof window !== "undefined"
        && new URLSearchParams(window.location.search).get("qfbrandpill") === "chotot";
      // QF-090: 과쯔(개발 시안형)는 필터 동작 확인용 샘플 60대, 초톳·동처띠는 기존 19대 그대로
      const luxuryUiTestMode = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("scenario") === "luxury30";
      const listingCars = isHeavyCategory
        ? heavyCars
        : isMaterialHandlingCategory
          ? materialHandlingCars
          : isTruckCategory
            ? truckCars
            : isBikeCategory
              ? bikeCars
              : isCampingCategory
                ? campingCars
                : isPartsCategory
                  ? partsCars
                  : luxuryUiTestMode
                    ? luxuryUiTestCars
                    : isGuaziQuickStyle && category === "슈퍼카"
                      ? supercarCategoryCars
                    : isGuaziQuickStyle && isLuxuryCategory
                      ? luxuryCategoryCars
                    : isGuaziQuickStyle && category === "올드카"
                      ? oldCarCategoryCars
                    : isGuaziQuickStyle && category === "JDM"
                      ? jdmCategoryCars
                    : isGuaziQuickStyle && category === "서울오토갤러리"
                      ? seoulAutoGalleryCars
                    : isGuaziQuickStyle && category === "도이치오토월드"
                      ? deutschAutoworldCars
                    : isGuaziQuickStyle && category === "SK V1 모터스"
                      ? joyMotorsCars
                    : isGuaziQuickStyle ? (category === "전체" ? allVehicleMixedCars : bbmSampleCars) : chototTestCars;
      const bikeShopOptions = hooks.memo(() => Array.from(new Set(bikeCars.filter((car) => car.sellerType === "딜러").map((car) => car.dealer))).sort((first, second) => first.localeCompare(second, "ko-KR")), []);
      hooks.effect(() => {
        if (!isBikeCategory && selectedBikeShop) setSelectedBikeShop(null);
      }, [isBikeCategory, selectedBikeShop]);
      hooks.effect(() => {
        const url = new URL(window.location.href);
        if (isBikeCategory && selectedBikeShop) url.searchParams.set("bikeShop", selectedBikeShop);
        else url.searchParams.delete("bikeShop");
        window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
      }, [isBikeCategory, selectedBikeShop]);
      const ferrariRegionOptions = hooks.memo(() => {
        if (maker !== "페라리") return [];
        const ferrariCars = listingCars.filter((car) => car.maker === "페라리");
        const specialOptions = ferrariSpecialRegions.map((name) => ({
          value: name,
          label: name,
          count: ferrariCars.filter((car) => car.place.includes(name)).length,
        })).filter((option) => option.count > 0);
        const provinceCounts = new Map<string, number>();
        ferrariCars.forEach((car) => {
          const province = car.place.trim().split(/\s+/)[0];
          if (province) provinceCounts.set(province, (provinceCounts.get(province) ?? 0) + 1);
        });
        const provinceOptions = [...provinceCounts.entries()]
          .map(([value, count]) => ({ value, label: value, count }))
          .filter((option) => option.count > 0)
          .sort((first, second) => {
            const firstRank = ferrariProvinceOrder.indexOf(first.value as (typeof ferrariProvinceOrder)[number]);
            const secondRank = ferrariProvinceOrder.indexOf(second.value as (typeof ferrariProvinceOrder)[number]);
            return (firstRank < 0 ? ferrariProvinceOrder.length : firstRank) - (secondRank < 0 ? ferrariProvinceOrder.length : secondRank);
          });
        return [...specialOptions, ...provinceOptions];
      }, [listingCars, maker]);
      const ferrariRegionDepthOptions = hooks.memo(() => {
        if (maker !== "페라리" || !region.province) return [];
        const isDealerDepth = ferrariSpecialRegions.includes(region.province as (typeof ferrariSpecialRegions)[number]);
        const scopedCars = listingCars.filter((car) => car.maker === "페라리" && (isDealerDepth
          ? car.place.includes(region.province)
          : car.place.trim().startsWith(`${region.province} `)));
        const counts = new Map<string, number>();
        scopedCars.forEach((car) => {
          const value = isDealerDepth
            ? car.dealer
            : car.place.split(" · ")[0].trim().split(/\s+/).slice(0, 2).join(" ");
          if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
        });
        return [...counts.entries()]
          .map(([value, count]) => ({ value, label: value, count, kind: isDealerDepth ? "dealer" as const : "district" as const }))
          .filter((option) => option.count > 0)
          .sort((first, second) => second.count - first.count || first.label.localeCompare(second.label, "ko"));
      }, [listingCars, maker, region.province]);
      const bbmValue = filters.bbm ?? emptyBbmFilters;
      // QF-097: 과쯔는 9개 제조사의 모델·세부 모델을 카탈로그 스냅숏으로(model-catalog-kr), 나머지 제조사·다른 모드는 기존 데이터
      // 바이크는 30대 가상 매물에 나온 모델만 쓰지 않고 전체 카탈로그를 쓴다.
      // 빠른 선택은 현재 매물이 있는 모델만, 전체 모델 시트는 0대 모델도 함께 보여준다.
      const truckModelsByCurrentDepth = selectedTruckFormat === "버스"
        ? {
          ...truckModelsByMaker,
          // 엔카 트럭: 버스 → 버스 → 현대에서 노출되는 모델 목록(2026-10-19 실동작 대조).
          // 형식을 고른 뒤에는 포터·마이티·트라고 같은 다른 형식 모델을 섞지 않는다.
          현대: ["e에어로타운", "e카운티", "글로벌 900 (그린시티)", "뉴 카운티", "슈퍼에어로시티", "에어로타운", "유니버스", "유니시티", "카운티"],
        }
        : truckModelsByMaker;
      const modelsByMakerMap = supportsVehicleCatalog && vehicleCatalog.index ? vehicleCatalog.modelsByMaker : isBikeCategory ? bikeModelsByMaker : isTruckCategory ? truckModelsByCurrentDepth : isGuaziQuickStyle ? guaziModelsByMaker : quickModelsByMaker;
      const rawGenerationsByMakerModelMap = supportsVehicleCatalog && vehicleCatalog.index ? vehicleCatalog.generationsByMakerModel : isGuaziQuickStyle ? guaziGenerationsByMakerModel : quickGenerationsByMakerModel;
      const rawModelVisualsByMakerMap = supportsVehicleCatalog && vehicleCatalog.index ? vehicleCatalog.modelVisualsByMaker : isBikeCategory ? bikeListingModelVisualsByMaker : isGuaziQuickStyle ? guaziModelVisualsByMaker : quickModelVisualsByMaker;
      const isCatalogMaker = Boolean(!isBikeCategory && !isTruckCategory && isGuaziQuickStyle && maker && catalogMakerNames.has(maker));
      const generationQuickOptions = maker && selectedModel ? rawGenerationsByMakerModelMap[maker]?.[selectedModel] ?? [] : [];
      const selectedGenerationOption = generationQuickOptions.find((generation) => generation.name === selectedGeneration);
      const variantQuickOptions = selectedGenerationOption?.variants ?? [];
      const directVariantQuickOptions: Array<string | QuickTrimOption> = [];
      const activeVariantQuickOptions = selectedGeneration ? variantQuickOptions : directVariantQuickOptions;
      const effectiveSelectedVariants = isGuaziQuickStyle ? debouncedSelectedVariants : selectedVariants;
      const selectedTruckSubtypeValues = truckSubtypeValuesForSelection(selectedTruckFormat, selectedTruckSubtype);
      const matchesTruckSelection = (car: Car) => !isTruckCategory || Boolean(car.truck
        && (!selectedTruckFormat || car.truck.format === selectedTruckFormat)
        && (!selectedTruckSubtype || selectedTruckSubtypeValues.includes(car.truck.subtype))
        && (!selectedTruckSpec || car.truck.load === selectedTruckSpec));
  
      hooks.effect(() => {
        if (!isGuaziQuickStyle) {
          setDebouncedSelectedVariants(selectedVariants);
          return undefined;
        }
        const timer = window.setTimeout(() => setDebouncedSelectedVariants(selectedVariants), 300);
        return () => window.clearTimeout(timer);
      }, [isGuaziQuickStyle, selectedVariants]);
  
      const activeFilterCount = [
        Boolean(maker),
        Boolean(selectedModel),
        Boolean(heavySelection.manufacturerCode),
        Boolean(heavySelection.modelCode),
        Boolean(heavySelection.submodelCode),
        Boolean(selectedTruckFormat),
        Boolean(selectedTruckSubtype),
        Boolean(selectedTruckSpec),
        Boolean(selectedOldcarDecade),
        Boolean(selectedGeneration),
        isGuaziQuickStyle ? selectedVariants.length > 0 : trimApplied && selectedVariants.length > 0,
        price.min !== 0 || price.max !== null,
        filters.year !== "전체",
        filters.condition !== "전체",
        filters.seller !== "전체",
        filters.seats !== "전체",
        Boolean(filters.mileageMax),
        filters.owners !== "전체",
        filters.transmission !== "전체",
        filters.fuel !== "전체",
        filters.colors.length > 0,
        filters.origin !== "전체",
        filters.body !== "전체",
        filters.videoOnly,
        Boolean(selectedBikeShop),
      ].filter(Boolean).length;
      // QF-074: 적용 필터 개수 배지 = 선택된 필터 "값"의 개수(퀵필터·상세필터 모두). 트림·색상은 고른 개수만큼, 지역도 포함
      const selectedFilterValueCount = [
        Boolean(maker),
        Boolean(selectedModel),
        Boolean(heavySelection.manufacturerCode),
        Boolean(heavySelection.modelCode),
        Boolean(heavySelection.submodelCode),
        Boolean(selectedTruckFormat),
        Boolean(selectedTruckSubtype),
        Boolean(selectedTruckSpec),
        Boolean(selectedOldcarDecade),
        Boolean(selectedGeneration),
        price.min !== 0 || price.max !== null,
        filters.year !== "전체",
        filters.condition !== "전체",
        filters.seller !== "전체",
        filters.seats !== "전체",
        Boolean(filters.mileageMax),
        filters.owners !== "전체",
        filters.transmission !== "전체",
        filters.fuel !== "전체",
        filters.origin !== "전체",
        filters.body !== "전체",
        filters.videoOnly,
        Boolean(region.province || region.district || region.radius),
        Boolean(selectedBikeShop),
      ].filter(Boolean).length
        + (isGuaziQuickStyle || trimApplied ? selectedVariants.length + selectedGradeLevels.length + selectedGradeGroups.length : 0)
        + filters.colors.length;
  
      const baseListCars = hooks.memo(() => {
        const normalized = query.trim().toLowerCase();
        return listingCars.filter((car) => {
          const searchText = `${car.title} ${car.trim} ${car.maker} ${car.modelGroup ?? ""}`;
          const searchKey = normalizeModelSearchText(searchText);
          // QF-097: 카탈로그 세부 모델은 코드(없으면 N세대)가 매물 이름·트림에 들어 있으면 해당
          const generationMatch = !selectedGeneration || (selectedGenerationOption?.matchKeys
            ? !selectedGenerationOption.matchKeys.length || selectedGenerationOption.matchKeys.some((key) => searchKey.includes(normalizeModelSearchText(key)))
            : searchKey.includes(normalizeModelSearchText(generationDisplayLabel(selectedGenerationOption ?? { name: selectedGeneration, years: "", variants: [] }))) || searchKey.includes(normalizeModelSearchText(selectedGeneration)));
          const activeTrimVariants = isGuaziQuickStyle ? effectiveSelectedVariants : trimApplied ? selectedVariants : [];
          const trimMatch = activeTrimVariants.length === 0 || activeTrimVariants.some((variant) => normalizeModelSearchText(searchText).includes(normalizeModelSearchText(variant.split(" › ").at(-1) ?? variant)));
          // QF-097 보완: 과쯔 카탈로그 제조사는 매물이 연결된 모델 하나로만 거른다(이름 일부 겹침 방지)
          const catalogModelMatch = !isCatalogMaker || !filters.model || catalogModelOfCar(car) === filters.model;
          const categoryChildMatch = !isCampingCategory || !bbmCategoryChild || car.virtualCategory?.categoryDetail === bbmCategoryChild;
          const heavyMatch = !isHeavyCategory || (
            (!heavySelection.equipmentTypeCode || car.heavy?.equipmentTypeCode === heavySelection.equipmentTypeCode)
            && (!heavySelection.detailTypeCode || heavySelection.detailTypeCode === "all" || car.heavy?.detailTypeCode === heavySelection.detailTypeCode)
            && (!heavySelection.manufacturerCode || car.heavy?.manufacturerCode === heavySelection.manufacturerCode)
            && (!heavySelection.modelCode || car.heavy?.modelCode === heavySelection.modelCode)
            && (!heavySelection.submodelCode || car.heavy?.submodelCode === heavySelection.submodelCode)
          );
          const oldcarDecadeMatch = category !== "올드카" || selectedOldcarDecade === null || Math.floor((car.filter?.year ?? 0) / 10) * 10 === selectedOldcarDecade;
          const ferrariDealerMatch = maker !== "페라리" || !selectedFerrariDealer || car.dealer === selectedFerrariDealer;
          const bikeShopMatch = !isBikeCategory || !selectedBikeShop || car.dealer === selectedBikeShop;
          return categoryChildMatch && heavyMatch && oldcarDecadeMatch && matchesTruckSelection(car) && matchesChoTotFilters(car, filters) && catalogModelMatch && generationMatch && trimMatch && ferrariDealerMatch && bikeShopMatch && (!regionKeyword || car.place.includes(regionKeyword)) && (!region.district || car.place.includes(region.district)) && (!region.neighborhood || car.place.includes(region.neighborhood)) && (!normalized || searchText.toLowerCase().includes(normalized));
        });
      }, [bbmCategoryChild, category, effectiveSelectedVariants, filters, heavySelection, isBikeCategory, isCampingCategory, isCatalogMaker, isGuaziQuickStyle, isHeavyCategory, isTruckCategory, listingCars, maker, query, region.district, region.neighborhood, regionKeyword, selectedBikeShop, selectedFerrariDealer, selectedGeneration, selectedGenerationOption, selectedOldcarDecade, selectedTruckFormat, selectedTruckSpec, selectedTruckSubtype, selectedVariants, trimApplied]);
      // QF-090: 우리 데이터가 있는 개발 시안형 항목(바디타입·연식·주행거리·가격·연료·변속기·인승·외부색상·판매자 구분·지역)으로 거른다
      const filteredWithoutPrice = hooks.memo(() => isGuaziQuickStyle ? baseListCars.filter((car) => matchesBbmFilters(car, filters.bbm)) : baseListCars, [baseListCars, filters.bbm, isGuaziQuickStyle]);
      // QF-097 보완(매물 수 기준 하나로): 과쯔 카탈로그 제조사의 모델·세부 모델·트림 수 = 화면 샘플 매물 수(모델·세부 모델·트림만 뺀 지금 조건).
      // 퀵필터 카드는 1대 이상만 보이고(눌러도 0대가 되지 않게), 좌측 필터·칩 모달·차종 시트는 원본처럼 0대도 보인다(0은 흐리게·비활성)
      const depthBaseCars = hooks.memo(() => {
        if (!isGuaziQuickStyle) return [];
        return listingCars.filter((car) => {
          return matchesTruckSelection(car) && matchesChoTotFilters(car, { ...filters, model: null }) && matchesBbmFilters(car, filters.bbm) && (!regionKeyword || car.place.includes(regionKeyword)) && (!region.district || car.place.includes(region.district)) && (!region.neighborhood || car.place.includes(region.neighborhood));
        });
      }, [filters, isGuaziQuickStyle, isTruckCategory, listingCars, region.district, region.neighborhood, regionKeyword, selectedTruckFormat, selectedTruckSpec, selectedTruckSubtype]);
      const { generationsByMakerModelMap, modelVisualsByMakerMap } = hooks.memo(() => {
        if (!isGuaziQuickStyle || supportsVehicleCatalog && vehicleCatalog.index) return { generationsByMakerModelMap: rawGenerationsByMakerModelMap, modelVisualsByMakerMap: rawModelVisualsByMakerMap };
        const generations = { ...rawGenerationsByMakerModelMap };
        const visuals = { ...rawModelVisualsByMakerMap };
        for (const makerName of catalogMakerNames) {
          // 매물 한 대는 카탈로그 모델 하나에만 연결(catalogModelOfCar: 제목 앞부분이 가장 길게 맞는 모델)
          const makerCars = depthBaseCars.filter((car) => car.maker === makerName).map((car) => ({ model: catalogModelOfCar(car), text: normalizeModelSearchText(`${car.title} ${car.trim} ${car.modelGroup ?? ""}`) }));
          const makerGenerations: Record<string, QuickGenerationOption[]> = {};
          const makerVisuals: Record<string, QuickModelVisual> = {};
          for (const modelName of modelsByMakerMap[makerName] ?? []) {
            const modelCars = makerCars.filter((car) => car.model === modelName).map((car) => car.text);
            makerVisuals[modelName] = { ...(rawModelVisualsByMakerMap[makerName]?.[modelName] ?? { image: "" }), count: `${modelCars.length.toLocaleString("ko-KR")}대` };
            makerGenerations[modelName] = (rawGenerationsByMakerModelMap[makerName]?.[modelName] ?? []).map((generation) => {
              const keys = generation.matchKeys ?? [];
              const generationCars = modelCars.filter((text) => !keys.length || keys.some((key) => text.includes(normalizeModelSearchText(key))));
              return {
                ...generation,
                count: generationCars.length,
                variants: generation.variants.map((variant) => { const option = toTrimOption(variant); return { ...option, count: generationCars.filter((text) => text.includes(normalizeModelSearchText(option.name))).length }; }),
              };
            });
          }
          generations[makerName] = makerGenerations;
          visuals[makerName] = makerVisuals;
        }
        return { generationsByMakerModelMap: generations, modelVisualsByMakerMap: visuals };
      }, [depthBaseCars, isGuaziQuickStyle, modelsByMakerMap, rawGenerationsByMakerModelMap, rawModelVisualsByMakerMap, supportsVehicleCatalog, vehicleCatalog.index]);
      // 퀵필터 줄(과쯔 카탈로그 제조사): 샘플 매물 1대 이상인 모델·세부 모델만
      const modelQuickOptions = maker ? (isBikeCategory && maker === "BMW"
        ? (bikeModelsByMaker.BMW ?? []).filter((name) => Boolean(bikeListingModelVisualsByMaker.BMW?.[name]?.image)).slice(0, 10)
        : (modelsByMakerMap[maker] ?? []).filter((name) => {
        if (supportsVehicleCatalog && vehicleCatalog.index) return true;
        if (isBikeCategory) {
          const key = normalizeModelSearchText(name);
          const hasListing = bikeListingModelsByMaker[maker]?.some((listingName) => normalizeModelSearchText(listingName) === key);
          const hasGeneratedQuickImage = Boolean(rawModelVisualsByMakerMap[maker]?.[name]?.image?.includes("/assets/bike/models/"));
          return Boolean(hasListing || hasGeneratedQuickImage);
        }
        return !isCatalogMaker || modelVisualsByMakerMap[maker]?.[name]?.count !== "0대";
      })) : [];
      const cardChipModelQuickOptions = maker === "페라리"
        ? [...modelQuickOptions].sort((first, second) => (ferrariLatestModelRank.get(first) ?? ferrariLatestModelOrder.length) - (ferrariLatestModelRank.get(second) ?? ferrariLatestModelOrder.length))
        : guaziCardChipPreview && maker === "BMW"
          ? [...modelQuickOptions].sort((first, second) => (bmwGuaziQuickRank.get(first) ?? 999) - (bmwGuaziQuickRank.get(second) ?? 999))
          : modelQuickOptions;
      const railGenerationOptions = maker && selectedModel ? (generationsByMakerModelMap[maker]?.[selectedModel] ?? []).filter((generation) => !isCatalogMaker || (generation.count ?? 0) > 0) : [];
      // 선택지 옆 매물 수: 그 항목만 뺀 나머지 조건을 모두 반영(원본과 같은 방식). 데이터 없는 항목은 null → 원본 숫자 글자
      const bbmCountOf = (key: BbmCheckKey, option: string) => isBbmDataOption(key, option)
        ? baseListCars.filter((car) => matchesBbmFilters(car, filters.bbm, key) && bbmCarChecks(car)[key]?.includes(option)).length
        : null;
      const visibleCars = hooks.memo(() => isGuaziQuickStyle ? sortBbmCars(filteredWithoutPrice, bbmSort) : [...filteredWithoutPrice].sort((first, second) => sort === "낮은 가격순" ? parsePrice(first.price) - parsePrice(second.price) : sort === "높은 가격순" ? parsePrice(second.price) - parsePrice(first.price) : second.id - first.id), [bbmSort, filteredWithoutPrice, isGuaziQuickStyle, sort]);
      const draftFilterCount = hooks.memo(() => listingCars.filter((car) => matchesChoTotFilters(car, draftFilters)).length, [draftFilters, listingCars]);
  
      const replaceFilterParams = (nextMaker: string | null, nextModel: string | null, nextCategory = filters.category) => {
        const url = new URL(window.location.href);
        if (nextCategory === "전체") url.searchParams.delete("category");
        else url.searchParams.set("category", nextCategory);
        if (nextMaker) url.searchParams.set("maker", nextMaker);
        else url.searchParams.delete("maker");
        if (nextMaker && nextModel) url.searchParams.set("model", nextModel);
        else url.searchParams.delete("model");
        url.searchParams.delete("generation");
        url.searchParams.delete("grade");
        url.searchParams.delete("gradeLevel");
        url.searchParams.delete("gradeGroup");
        window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
      };
  
      const replaceVehicleDepthParams = (nextGeneration: string | null, nextGrades: string[]) => {
        const url = new URL(window.location.href);
        if (nextGeneration) url.searchParams.set("generation", nextGeneration);
        else url.searchParams.delete("generation");
        url.searchParams.delete("grade");
        for (const grade of nextGrades) url.searchParams.append("grade", grade);
        if (nextGeneration !== selectedGeneration) {
          url.searchParams.delete("gradeLevel");
          url.searchParams.delete("gradeGroup");
        }
        window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
      };
  
      const replaceGradeBranchParams = (nextLevels: string[], nextGroups: string[]) => {
        const url = new URL(window.location.href);
        url.searchParams.delete("gradeLevel");
        url.searchParams.delete("gradeGroup");
        for (const level of nextLevels) url.searchParams.append("gradeLevel", level);
        for (const group of nextGroups) url.searchParams.append("gradeGroup", group);
        window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
      };
  
      const replaceTruckParams = (nextFormat: string | null, nextSubtype: string | null, nextSpec: string | null = null) => {
        const url = new URL(window.location.href);
        if (nextFormat) url.searchParams.set("truckFormat", nextFormat);
        else url.searchParams.delete("truckFormat");
        if (nextFormat && nextSubtype) url.searchParams.set("truckSubtype", nextSubtype);
        else url.searchParams.delete("truckSubtype");
        if (nextFormat && nextSubtype && nextSpec) url.searchParams.set("truckSpec", nextSpec);
        else url.searchParams.delete("truckSpec");
        window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
      };
  
      const replaceOldcarDecadeParam = (value: OldcarDecade | null) => {
        const url = new URL(window.location.href);
        if (value === null) url.searchParams.delete("decade");
        else url.searchParams.set("decade", String(value));
        window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
      };
  
      const chooseOldcarDecade = (nextDecade: OldcarDecade) => {
        const value = selectedOldcarDecade === nextDecade ? null : nextDecade;
        setSelectedOldcarDecade(value);
        replaceOldcarDecadeParam(value);
      };
  
      const chooseFerrariRegion = (nextRegion: string) => {
        const next = region.province === nextRegion && !region.district && !region.radius
          ? emptyRegion
          : { province: nextRegion, district: "", radius: "" };
        setRegion(next);
        setDraftRegion(next);
        setSelectedFerrariDealer(null);
      };
  
      const chooseFerrariRegionDepth = (option: (typeof ferrariRegionDepthOptions)[number]) => {
        if (option.kind === "dealer") {
          setSelectedFerrariDealer((current) => current === option.value ? null : option.value);
          return;
        }
        const next = region.district === option.value
          ? { province: region.province, district: "", radius: "" }
          : { province: region.province, district: option.value, radius: "" };
        setRegion(next);
        setDraftRegion(next);
      };
  
      const resetFilters = ({ closeActiveSheet = true }: { closeActiveSheet?: boolean } = {}) => {
        // QF-106: 과쯔 "필터 초기화"는 1번 상태(들어온 카테고리 유지 · ④ 제조사 이미지 줄)로 — 카테고리 없이 들어왔으면 첫 화면
        const keepCategory = isGuaziQuickStyle && filters.category !== "전체" ? filters.category : null;
        setFilters((current) => ({ ...emptyChoTotFilters, ...(keepCategory ? { category: keepCategory } : {}), bbm: resetBbmFilters(current.bbm ?? emptyBbmFilters) }));
        setDraftFilters(emptyChoTotFilters);
        setDraftRegion(emptyRegion);
        setQuery("");
        setSort("최신순");
        setRegion(emptyRegion);
        setCategoryLandingOpen(!keepCategory);
        setFilterFocus(null);
        setQuickFilterFocus(null);
        setSelectedGeneration(null);
        setSelectedVariants([]);
        setSelectedGradeLevels([]);
        setSelectedGradeGroups([]);
        setTrimApplied(false);
        setSelectedTruckFormat(null);
        setSelectedTruckSubtype(null);
        setSelectedTruckSpec(null);
        setSelectedOldcarDecade(null);
        setSelectedFerrariDealer(null);
        setSelectedBikeShop(null);
        setBbmAvailableOnly(false);
        applyHeavySelection(emptyHeavySelection);
        replaceFilterParams(null, null, keepCategory ?? undefined);
        replaceTruckParams(null, null);
        replaceOldcarDecadeParam(null);
        if (closeActiveSheet) setSheet(null);
      };
  
      const clearCategoryFilter = () => {
        setFilters((current) => ({ ...current, category: "전체", maker: null, model: null }));
        setDraftFilters((current) => ({ ...current, category: "전체", maker: null, model: null }));
        setSelectedGeneration(null);
        setSelectedVariants([]);
        setSelectedGradeLevels([]);
        setSelectedGradeGroups([]);
        setTrimApplied(false);
        setCategoryLandingOpen(true);
        setSelectedTruckFormat(null);
        setSelectedTruckSubtype(null);
        setSelectedTruckSpec(null);
        setSelectedOldcarDecade(null);
        setSelectedFerrariDealer(null);
        applyHeavySelection(emptyHeavySelection);
        replaceFilterParams(null, null, "전체");
        replaceTruckParams(null, null);
        replaceOldcarDecadeParam(null);
      };
  
      const clearTruckFormat = () => {
        setSelectedTruckFormat(null);
        setSelectedTruckSubtype(null);
        setSelectedTruckSpec(null);
        setFilters((current) => ({ ...current, maker: null, model: null }));
        setDraftFilters((current) => ({ ...current, maker: null, model: null }));
        setSelectedGeneration(null);
        setSelectedVariants([]);
        setSelectedGradeLevels([]);
        setSelectedGradeGroups([]);
        setTrimApplied(false);
        replaceFilterParams(null, null);
        replaceTruckParams(null, null);
      };
  
      const clearTruckSubtype = () => {
        setSelectedTruckSubtype(null);
        setSelectedTruckSpec(null);
        setFilters((current) => ({ ...current, maker: null, model: null }));
        setDraftFilters((current) => ({ ...current, maker: null, model: null }));
        setSelectedGeneration(null);
        setSelectedVariants([]);
        setSelectedGradeLevels([]);
        setSelectedGradeGroups([]);
        setTrimApplied(false);
        replaceFilterParams(null, null);
        replaceTruckParams(selectedTruckFormat, null);
      };
  
      const clearTruckSpec = () => {
        setSelectedTruckSpec(null);
        setFilters((current) => ({ ...current, maker: null, model: null }));
        setDraftFilters((current) => ({ ...current, maker: null, model: null }));
        setSelectedGeneration(null);
        setSelectedVariants([]);
        setSelectedGradeLevels([]);
        setSelectedGradeGroups([]);
        setTrimApplied(false);
        replaceFilterParams(null, null);
        replaceTruckParams(selectedTruckFormat, selectedTruckSubtype, null);
      };
  
      const chooseTruckFormat = (formatName: string) => {
        setSelectedTruckFormat(formatName);
        setSelectedTruckSubtype(null);
        setSelectedTruckSpec(null);
        setFilters((current) => ({ ...current, maker: null, model: null }));
        setDraftFilters((current) => ({ ...current, maker: null, model: null }));
        setSelectedGeneration(null);
        setSelectedVariants([]);
        setSelectedGradeLevels([]);
        setSelectedGradeGroups([]);
        setTrimApplied(false);
        replaceFilterParams(null, null);
        replaceTruckParams(formatName, null);
      };
  
      const chooseTruckSubtype = (subtypeName: string) => {
        if (!selectedTruckFormat || !truckSubtypeOptions.includes(subtypeName)) return;
        setSelectedTruckSubtype(subtypeName);
        setSelectedTruckSpec(null);
        setFilters((current) => ({ ...current, maker: null, model: null }));
        setDraftFilters((current) => ({ ...current, maker: null, model: null }));
        setSelectedGeneration(null);
        setSelectedVariants([]);
        setSelectedGradeLevels([]);
        setSelectedGradeGroups([]);
        setTrimApplied(false);
        replaceFilterParams(null, null);
        replaceTruckParams(selectedTruckFormat, subtypeName);
      };
  
      const chooseTruckSpec = (spec: string) => {
        if (!truckSpecOptions.some((option) => option.value === spec)) return;
        setSelectedTruckSpec(spec);
        setFilters((current) => ({ ...current, maker: null, model: null }));
        setDraftFilters((current) => ({ ...current, maker: null, model: null }));
        setSelectedGeneration(null);
        setSelectedVariants([]);
        setSelectedGradeLevels([]);
        setSelectedGradeGroups([]);
        setTrimApplied(false);
        replaceFilterParams(null, null);
        replaceTruckParams(selectedTruckFormat, selectedTruckSubtype, spec);
      };
  
      const applyTruckTypeSelection = (formatName: string | null, subtypeName: string | null) => {
        setSelectedTruckFormat(formatName);
        setSelectedTruckSubtype(formatName ? subtypeName : null);
        setSelectedTruckSpec(null);
        setFilters((current) => ({ ...current, maker: null, model: null }));
        setDraftFilters((current) => ({ ...current, maker: null, model: null }));
        setSelectedGeneration(null);
        setSelectedVariants([]);
        setSelectedGradeLevels([]);
        setSelectedGradeGroups([]);
        setTrimApplied(false);
        replaceFilterParams(null, null);
        replaceTruckParams(formatName, formatName ? subtypeName : null, null);
      };
  
      const applyTruckQuickSpec = (spec: string) => {
        const formatName = "카고(화물)트럭";
        const subtypeName = "카고(화물)트럭";
        setSelectedTruckFormat(formatName);
        setSelectedTruckSubtype(subtypeName);
        setSelectedTruckSpec(spec);
        setFilters((current) => ({ ...current, maker: null, model: null }));
        setDraftFilters((current) => ({ ...current, maker: null, model: null }));
        setSelectedGeneration(null);
        setSelectedVariants([]);
        setSelectedGradeLevels([]);
        setSelectedGradeGroups([]);
        setTrimApplied(false);
        replaceFilterParams(null, null);
        replaceTruckParams(formatName, subtypeName, spec);
      };
  
      const clearMakerFilter = () => {
        setFilters((current) => ({ ...current, maker: null, model: null }));
        setDraftFilters((current) => ({ ...current, maker: null, model: null }));
        setSelectedGeneration(null);
        setSelectedVariants([]);
        setSelectedGradeLevels([]);
        setSelectedGradeGroups([]);
        setTrimApplied(false);
        setCatalogSelectionRecord(null);
        setSelectedFerrariDealer(null);
        setCategoryLandingOpen(category === "전체");
        replaceFilterParams(null, null);
      };
  
      const chooseSeoulAutoGallerySection = (next: SeoulAutoGallerySection) => {
        setSeoulAutoGallerySection(next);
        if (next !== "vehicles" && maker) clearMakerFilter();
        const url = new URL(window.location.href);
        if (next === "vehicles") url.searchParams.delete("sag");
        else url.searchParams.set("sag", next);
        window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
      };
  
      const clearModelFilter = () => {
        setFilters((current) => ({ ...current, model: null }));
        setDraftFilters((current) => ({ ...current, model: null }));
        setSelectedGeneration(null);
        setSelectedVariants([]);
        setSelectedGradeLevels([]);
        setSelectedGradeGroups([]);
        setTrimApplied(false);
        setCatalogSelectionRecord(null);
        replaceFilterParams(maker, null);
      };
  
      const clearGenerationFilter = () => {
        setSelectedGeneration(null);
        setSelectedVariants([]);
        setSelectedGradeLevels([]);
        setSelectedGradeGroups([]);
        setTrimApplied(false);
        setCatalogSelectionRecord(null);
        replaceVehicleDepthParams(null, []);
      };
  
      const clearVariantFilter = () => {
        setSelectedVariants([]);
        setSelectedGradeLevels([]);
        setSelectedGradeGroups([]);
        setTrimApplied(false);
        setCatalogSelectionRecord(null);
        replaceVehicleDepthParams(selectedGeneration, []);
        replaceGradeBranchParams([], []);
      };
  
      const returnToModelDepth = () => {
        setFilters((current) => ({ ...current, model: null }));
        setDraftFilters((current) => ({ ...current, model: null }));
        setSelectedGeneration(null);
        setSelectedVariants([]);
        setSelectedGradeLevels([]);
        setSelectedGradeGroups([]);
        setTrimApplied(false);
        replaceFilterParams(maker, null);
      };
  
      const returnToGenerationDepth = () => {
        setSelectedGeneration(null);
        setSelectedVariants([]);
        setSelectedGradeLevels([]);
        setSelectedGradeGroups([]);
        setTrimApplied(false);
      };
  
      const returnToTrimDepth = () => {
        setTrimApplied(false);
      };
  
      const clearVehicleSummaryStep = () => {
        if (selectedGeneration) {
          clearGenerationFilter();
          return;
        }
        if (selectedModel) {
          clearModelFilter();
          return;
        }
        clearMakerFilter();
      };
  
      const applyMakerFilter = (nextMaker: string | null) => {
        setFilters((current) => ({ ...current, maker: nextMaker, model: null }));
        setDraftFilters((current) => ({ ...current, maker: nextMaker, model: null }));
        setSelectedGeneration(null);
        setSelectedVariants([]);
        setSelectedGradeLevels([]);
        setSelectedGradeGroups([]);
        setTrimApplied(false);
        setSelectedFerrariDealer(null);
        replaceFilterParams(nextMaker, null);
      };
  
      const openRegionSheet = () => {
        setDraftRegion(region);
        setSheet("region");
      };
  
      const openPriceSheet = () => {
        setDraftFilters(filters);
        setSheet("price");
      };
  
      const openQuickFilter = (focus: ChoTotFilterFocus) => {
        setDraftFilters(filters);
        if (focus === "category") {
          setQuickFilterFocus(null);
          setSheet("carType");
          return;
        }
        setQuickFilterFocus(focus);
        setSheet("quick");
      };
  
      const toggleSearchSaved = () => {
        const nextSaved = !searchSaved;
        setSearchSaved(nextSaved);
        setSearchToast(nextSaved ? "검색 조건을 저장했습니다." : "저장한 검색 조건을 삭제했습니다.");
      };
  
      const chooseMaker = (nextMaker: string | null) => {
        applyMakerFilter(nextMaker);
        closeSheet();
      };
  
      const applyVehicleSummarySelection = (nextMaker: string | null, nextModel: string | null, nextGeneration: string | null) => {
        const safeModel = nextMaker && nextModel ? nextModel : null;
        const generationOptionsForSelection = nextMaker && safeModel ? generationsByMakerModelMap[nextMaker]?.[safeModel] ?? [] : [];
        const safeGeneration = generationOptionsForSelection.some((option) => option.name === nextGeneration) ? nextGeneration : null;
        const nextFilters = { ...filters, maker: nextMaker, model: safeModel };
        setFilters(nextFilters);
        setDraftFilters(nextFilters);
        setSelectedGeneration(safeGeneration);
        setSelectedVariants([]);
        setSelectedGradeLevels([]);
        setSelectedGradeGroups([]);
        setTrimApplied(false);
        setCategoryLandingOpen(!nextMaker && category === "전체");
        replaceFilterParams(nextMaker, safeModel);
        if (safeGeneration) replaceVehicleDepthParams(safeGeneration, []);
        closeSheet();
      };
  
      const chooseCatalogRecord = (record: VehicleSearchRecord) => {
        const nextMaker = record.path[0] ?? null;
        const nextModel = record.path[1] ?? null;
        const nextGeneration = record.path[2] ?? null;
        const selectedLeaf = record.path.length >= 5 ? record.path.at(-1) ?? null : null;
        const nextFilters = { ...filters, maker: nextMaker, model: nextModel };
        setFilters(nextFilters);
        setDraftFilters(nextFilters);
        setSelectedGeneration(nextGeneration);
        setSelectedVariants(selectedLeaf ? [selectedLeaf] : []);
        setSelectedGradeLevels([]);
        setSelectedGradeGroups([]);
        setTrimApplied(false);
        setCatalogSelectionRecord(record);
        setCategoryLandingOpen(false);
        setQuery("");
        replaceFilterParams(nextMaker, nextModel);
        setSheet("vehicle");
      };
  
      const chooseModel = (modelName: string) => {
        const nextModel = selectedModel === modelName ? null : modelName;
        // 과쯔 카탈로그 제조사는 샘플 매물이 있는 세부 모델만 센다(하나뿐이면 바로 고른다)
        const nextGenerations = nextModel && maker ? (generationsByMakerModelMap[maker]?.[nextModel] ?? []).filter((generation) => !isCatalogMaker || (generation.count ?? 0) > 0) : [];
        setFilters((current) => ({ ...current, model: nextModel }));
        setDraftFilters((current) => ({ ...current, model: nextModel }));
        setSelectedGeneration(isGuaziQuickStyle && nextGenerations.length === 1 ? nextGenerations[0].name : null);
        setSelectedVariants([]);
        setSelectedGradeLevels([]);
        setSelectedGradeGroups([]);
        setTrimApplied(false);
        replaceFilterParams(maker, nextModel);
      };
  
      const chooseGeneration = (generationName: string) => {
        const nextGeneration = selectedGeneration === generationName ? null : generationName;
        setSelectedGeneration(nextGeneration);
        setSelectedVariants([]);
        setSelectedGradeLevels([]);
        setSelectedGradeGroups([]);
        setTrimApplied(false);
        replaceVehicleDepthParams(nextGeneration, []);
      };
  
      // QF-105: 과쯔 퀵필터 트림 알약 — 누르면 그 트림 하나로 바로 적용(칩 줄에 [C200 ×], 트림 줄은 닫힘). 좌측 필터 등급은 chooseVariant(여럿 선택) 그대로
      const chooseTrimPill = (variantName: string) => {
        setSelectedVariants([variantName]);
        setTrimApplied(false);
        replaceVehicleDepthParams(selectedGeneration, [variantName]);
      };
      const chooseVariant = (variantName: string) => {
        setSelectedVariants((current) => {
          const next = current.includes(variantName) ? current.filter((variant) => variant !== variantName) : [...current, variantName];
          replaceVehicleDepthParams(selectedGeneration, next);
          return next;
        });
        setTrimApplied(false);
      };
  
      const chooseQuickFilterStyle = (style: QuickFilterStyle) => {
        setQuickFilterStyle(style);
        const url = new URL(window.location.href);
        if (style === "chotot") url.searchParams.delete("qf");
        else url.searchParams.set("qf", style);
        window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
      };
  
      const chooseVehicleCategory = (categoryName: string) => {
        if (vehicleCategoryOptions.includes(categoryName)) {
          const nextFilters = { ...filters, category: categoryName, maker: null, model: null };
          setFilters(nextFilters);
          setDraftFilters(nextFilters);
          setSelectedGeneration(null);
          setSelectedVariants([]);
          setSelectedGradeLevels([]);
          setSelectedGradeGroups([]);
          setTrimApplied(false);
          setSelectedTruckFormat(null);
          setSelectedTruckSubtype(null);
          setSelectedTruckSpec(null);
          setSelectedOldcarDecade(null);
          applyHeavySelection(emptyHeavySelection);
          setCategoryLandingOpen(categoryName === "전체");
          replaceFilterParams(null, null, categoryName);
          replaceTruckParams(null, null);
          replaceOldcarDecadeParam(null);
          return;
        }
        setSearchToast(`${categoryName.replace("\n", " ")} 카테고리는 준비 중입니다.`);
      };
  
      const chooseCategoryFilter = (categoryName: string) => {
        if (vehicleCategoryOptions.includes(categoryName)) {
          const nextFilters = { ...filters, category: categoryName, maker: null, model: null };
          setFilters(nextFilters);
          setDraftFilters(nextFilters);
          setSelectedGeneration(null);
          setSelectedVariants([]);
          setSelectedGradeLevels([]);
          setSelectedGradeGroups([]);
          setTrimApplied(false);
          setSelectedTruckFormat(null);
          setSelectedTruckSubtype(null);
          setSelectedTruckSpec(null);
          setSelectedOldcarDecade(null);
          setCategoryLandingOpen(categoryName === "전체");
          replaceFilterParams(null, null, categoryName);
          replaceTruckParams(null, null);
          replaceOldcarDecadeParam(null);
          closeSheet();
          return;
        }
        setSearchToast(`${categoryName} 카테고리는 준비 중입니다.`);
        closeSheet();
      };
  
      const chooseHierarchyCategory = (categoryName: string, detail?: string) => {
        if (detail === "__bike_sell__") {
          const url = new URL(window.location.href);
          url.searchParams.set("register", "bike");
          url.searchParams.set("category", "바이크");
          url.searchParams.delete("bikeMenu");
          window.location.assign(`${url.pathname}${url.search}${url.hash}`);
          return;
        }
        const bikeParts = detail === "__bike_parts__";
        const truckParts = detail === "__truck_parts__";
        const normalizedDetail = bikeParts || truckParts ? undefined : detail;
        chooseVehicleCategory(categoryName);
        setBbmCategoryChild(normalizedDetail ?? null);
        if (categoryName === "트럭 · 특장" && normalizedDetail) chooseTruckFormat(normalizedDetail);
        const url = new URL(window.location.href);
        if (bikeParts) url.searchParams.set("bikeMenu", "parts");
        else url.searchParams.delete("bikeMenu");
        if (truckParts) url.searchParams.set("truckMenu", "parts");
        else url.searchParams.delete("truckMenu");
        window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
      };
  
      const guaziVisualsForMaker = maker ? (isBikeCategory && maker === "BMW" ? bikeListingModelVisualsByMaker.BMW : modelVisualsByMakerMap[maker]) : undefined;
      const selectedGenerationVisual = selectedGenerationOption?.image ?? (selectedModel && guaziVisualsForMaker ? guaziVisualsForMaker[selectedModel]?.image : undefined);
      const selectedGenerationSummary = selectedGenerationOption
        ? (showGuaziInventoryCounts
            ? `${compactYearLabel(selectedGenerationOption.years)} · ${generationCountLabel(selectedGenerationOption)}`
            : compactYearLabel(selectedGenerationOption.years))
        : "";
      // 과쯔 카탈로그 제조사: 트림 수도 샘플 매물 기준(0대 트림은 비활성)
      const selectedGenerationView = isCatalogMaker && maker && selectedModel ? generationsByMakerModelMap[maker]?.[selectedModel]?.find((generation) => generation.name === selectedGeneration) : undefined;
      const variantTrimOptions = (selectedGenerationView && selectedGeneration ? selectedGenerationView.variants : activeVariantQuickOptions).map(toTrimOption);
      const selectedTrimChipLabel = selectedVariants.length === 0
        ? "트림"
        : selectedVariants.length === 1
          ? selectedVariants[0].split(" › ").at(-1) ?? selectedVariants[0]
          : `${selectedVariants[0].split(" › ").at(-1) ?? selectedVariants[0]} 외 ${selectedVariants.length - 1}`;
      const mileageChipLabel = filters.mileageMax
        ? `${Number(filters.mileageMax).toLocaleString("ko-KR")}km 이하`
        : "주행";
      const accessibleDepthLabel = (value: string | null) => (value ? formatModelLabel(value).replaceAll("A-클래스", "A클래스") : "");
      const vehicleSummaryLabel = isHeavyCategory
        ? [heavySelection.maker, heavySelection.model, heavySelection.submodel].filter(Boolean).join(" ")
        : isTruckCategory
          ? [selectedTruckFormat, selectedTruckSubtype, selectedTruckSpec, maker, selectedModel ? formatModelLabel(selectedModel) : null].filter(Boolean).join(" ")
        : [
            maker,
            selectedModel ? formatModelLabel(selectedModel) : null,
            selectedGenerationOption ? generationDisplayLabel(selectedGenerationOption) : null,
          ].filter(Boolean).join(" ");
  
      type QuickFilterChip = { key: string; label: string; active: boolean; className?: string; onClick: () => void; onClear?: () => void };
      const quickFilterChips: QuickFilterChip[] = ([
        {
          key: "category",
          label: categoryIsDefault ? (groupRail && !maker ? bbmGroupLabel(groupRail) : "전체차량") : category,
          active: true,
          className: "is-category-chip",
          onClick: () => openQuickFilter("category"),
          onClear: categoryIsDefault && groupRail ? () => setGroupRail(null) : clearCategoryFilter,
        },
        isGuaziQuickStyle && maker ? {
          key: "vehicle-summary",
          label: vehicleSummaryLabel,
          active: true,
          className: "is-vehicle-summary",
          onClick: () => setSheet("vehicle"),
          onClear: clearVehicleSummaryStep,
        } : maker ? {
          key: "maker",
          label: maker,
          active: true,
          onClick: () => openQuickFilter("maker"),
          onClear: clearMakerFilter,
        } : {
          key: "maker",
          label: "제조사",
          active: false,
          onClick: () => openQuickFilter("maker"),
        },
        isGuaziQuickStyle ? null : maker && selectedModel ? {
          key: "model",
          label: formatModelLabel(selectedModel),
          active: true,
          onClick: usesUxDepth ? returnToModelDepth : () => openQuickFilter("model"),
          onClear: clearModelFilter,
        } : maker ? {
          key: "model",
          label: "모델",
          active: false,
          onClick: () => openQuickFilter("model"),
        } : null,
        isGuaziQuickStyle ? null : usesUxDepth && selectedModel ? {
          key: "generation",
          label: selectedGenerationOption ? generationDisplayLabel(selectedGenerationOption) : "세대",
          active: Boolean(selectedGeneration),
          onClick: selectedGeneration ? returnToGenerationDepth : () => setSearchToast("아래 세대 칩에서 선택하세요."),
          onClear: selectedGeneration ? clearGenerationFilter : undefined,
        } : null,
        usesUxDepth && selectedGeneration ? {
          key: "variant",
          label: selectedTrimChipLabel,
          active: isGuaziQuickStyle ? selectedVariants.length > 0 : trimApplied && selectedVariants.length > 0,
          onClick: selectedVariants.length ? returnToTrimDepth : () => setSearchToast("아래 트림 칩에서 선택하세요."),
          onClear: selectedVariants.length ? clearVariantFilter : undefined,
        } : null,
        {
          key: "price",
          label: priceFilterLabel(price),
          active: price.min !== 0 || price.max !== null,
          onClick: () => openQuickFilter("price"),
        },
        !selectedGeneration ? {
          key: "year",
          label: filters.year === "전체" ? "연식" : filters.year,
          active: filters.year !== "전체",
          onClick: () => openQuickFilter("year"),
        } : null,
        {
          key: "mileage",
          label: mileageChipLabel,
          active: Boolean(filters.mileageMax),
          onClick: () => openQuickFilter("mileage"),
          onClear: filters.mileageMax ? () => {
            setFilters((current) => ({ ...current, mileageMax: "" }));
            setDraftFilters((current) => ({ ...current, mileageMax: "" }));
          } : undefined,
        },
        {
          key: "color",
          label: filters.colors.length ? filters.colors.join(", ") : "색상",
          active: filters.colors.length > 0,
          onClick: () => openQuickFilter("color"),
          onClear: filters.colors.length ? () => {
            setFilters((current) => ({ ...current, colors: [] }));
            setDraftFilters((current) => ({ ...current, colors: [] }));
          } : undefined,
        },
      ] as Array<QuickFilterChip | null>).filter((chip): chip is QuickFilterChip => Boolean(chip));
      const marketSheet = (
          <BottomSheet open={sheet !== null} onOpenChange={(open) => !open && closeSheet()} title={sheet ? sheetLabels[sheet] : "필터"} description={sheet === "region" || sheet === "maker" || sheet === "vehicle" || sheet === "price" || sheet === "filter" || sheet === "quick" || sheet === "carType" ? undefined : "원하는 조건을 선택해 매물을 좁혀보세요."} snap={sheet === "filter" || sheet === "maker" || sheet === "quick" ? 0.96 : sheet === "vehicle" ? 0.8 : sheet === "carType" ? 0.8 : sheet === "region" ? (isBikeCategory ? 0.68 : 0.53) : sheet === "price" ? 0.62 : 0.48}>
            {sheet === "filter" ? <ChoTotFilterSheet value={draftFilters} focus={filterFocus} onChange={setDraftFilters} onClose={() => { setFilterFocus(null); closeSheet(); }} onReset={() => resetFilters({ closeActiveSheet: false })} onConfirm={() => { setFilters(draftFilters); setFilterFocus(null); closeSheet(); }} resultCount={draftFilterCount} /> : sheet === "carType" ? <CategoryFilterSheet selected={category} onChoose={chooseCategoryFilter} onClose={closeSheet} /> : sheet === "quick" && quickFilterFocus ? <ChoTotQuickFilterSheet focus={quickFilterFocus} value={draftFilters} onChange={setDraftFilters} onClose={() => { setQuickFilterFocus(null); closeSheet(); }} onConfirm={() => { setFilters(draftFilters); setQuickFilterFocus(null); closeSheet(); }} resultCount={draftFilterCount} /> : sheet === "vehicle" ? supportsVehicleCatalog && vehicleCatalog.index ? <CatalogVehiclePickerSheet catalog={vehicleCatalog} maker={maker} model={selectedModel} generation={selectedGeneration} initialRecord={catalogSelectionRecord} onChoose={chooseCatalogRecord} onReset={clearMakerFilter} /> : <VehiclePickerSheet maker={maker} model={selectedModel} generation={selectedGeneration} makerOptions={categoryBrandRail.options} onApply={applyVehicleSummarySelection} modelsByMaker={modelsByMakerMap} generationsByMakerModel={generationsByMakerModelMap} modelVisualsByMaker={modelVisualsByMakerMap} renderMakerLogo={isGuaziQuickStyle ? (option) => <CategoryBrandLogo category={category} name={option.maker ?? option.name} kind="list" /> : undefined} /> : sheet === "maker" ? <MakerSheet selected={maker} onChoose={chooseMaker} onClose={closeSheet} /> : sheet === "region" ? <RegionSheet value={draftRegion} resultCount={filteredWithoutPrice.length} onChange={setDraftRegion} onClose={closeSheet} onConfirm={() => { setRegion(draftRegion); closeSheet(); }} allowNeighborhood={isBikeCategory} /> : sheet === "price" ? <PriceSheet value={draftFilters.price} onChange={(nextPrice) => setDraftFilters((current) => ({ ...current, price: nextPrice }))} onClose={closeSheet} onReset={() => setDraftFilters((current) => ({ ...current, price: emptyPrice }))} onConfirm={() => { setFilters((current) => ({ ...current, price: draftFilters.price })); closeSheet(); }} resultCount={draftFilterCount} /> : <div class="sheet-options">
              {sheet === "sort" ? ["최신순", "낮은 가격순", "높은 가격순"].map((label) => <button key={label} type="button" class={sort === label ? "is-selected" : ""} onClick={() => { setSort(label); setSheet(null); }}>{label}</button>) : ["전체", "추천 조건", "인기 조건"].map((label) => <button key={label} type="button" onClick={() => setSheet(null)}>{label}</button>)}
            </div>}
          </BottomSheet>
      );
  
      if (desktop) {
        // PC 필터 칩 줄은 초톳 PC처럼 연료·변속기를 색상 앞에 추가한다(모바일 칩 순서는 그대로).
        const colorIndex = quickFilterChips.findIndex((chip) => chip.key === "color");
        quickFilterChips.splice(colorIndex < 0 ? quickFilterChips.length : colorIndex, 0,
          {
            key: "fuel",
            label: filters.fuel === "전체" ? "연료" : filters.fuel,
            active: filters.fuel !== "전체",
            onClick: () => openQuickFilter("fuel"),
            onClear: filters.fuel !== "전체" ? () => {
              setFilters((current) => ({ ...current, fuel: "전체" }));
              setDraftFilters((current) => ({ ...current, fuel: "전체" }));
            } : undefined,
          },
          {
            key: "transmission",
            label: filters.transmission === "전체" ? "변속기" : filters.transmission,
            active: filters.transmission !== "전체",
            onClick: () => openQuickFilter("transmission"),
            onClear: filters.transmission !== "전체" ? () => {
              setFilters((current) => ({ ...current, transmission: "전체" }));
              setDraftFilters((current) => ({ ...current, transmission: "전체" }));
            } : undefined,
          },
        );
      }
  
      hooks.effect(() => {
        if (!desktop) return undefined;
        const rail = pcFilterRowRef.current?.querySelector<HTMLElement>(".filter-rail");
        if (!rail) return undefined;
        const update = () => setPcFilterCanScroll(rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 1);
        update();
        rail.addEventListener("scroll", update, { passive: true });
        const observer = new ResizeObserver(update);
        observer.observe(rail);
        const track = rail.querySelector(".filter-track");
        if (track) observer.observe(track);
        return () => {
          rail.removeEventListener("scroll", update);
          observer.disconnect();
        };
      }, [desktop, quickFilterChips.length]);
  
      const hasGenerationDepth = Boolean(usesUxDepth && selectedModel && railGenerationOptions.length);
      const hasDirectVariantDepth = Boolean(usesUxDepth && selectedModel && !hasGenerationDepth && directVariantQuickOptions.length);
      const shouldStayOnSelectedModelRail = Boolean(isGuaziQuickStyle && selectedModel && !hasGenerationDepth && !hasDirectVariantDepth);
      const showModelQuickRail = Boolean(maker && modelQuickOptions.length && (!selectedModel || shouldStayOnSelectedModelRail));
      // QF-097: 카탈로그 세부 모델을 골랐는데 트림 데이터가 없으면 세부 모델 줄에 선택된 채로 남는다
      // QF-105: 과쯔는 트림이 1개뿐이면 트림 줄을 띄우지 않고 세부모델 줄에 선택된 채로 둔다. 트림을 고르면 트림 줄은 닫힌다(칩 [트림 ×] 로만 푼다)
      const guaziTrimRailOptions = isGuaziQuickStyle && selectedGeneration ? variantTrimOptions : [];
      const guaziTrimChosen = Boolean(isGuaziQuickStyle && selectedGeneration && selectedVariants.length > 0);
      const stayOnGenerationRail = Boolean(isCatalogMaker && selectedGeneration && (isGuaziQuickStyle ? variantQuickOptions.length <= 1 : !variantQuickOptions.length) && !guaziTrimChosen);
      const showGenerationQuickRail = Boolean(usesUxDepth && selectedModel && (!selectedGeneration || stayOnGenerationRail) && railGenerationOptions.length);
      const showVariantQuickRail = Boolean(usesUxDepth && ((selectedGeneration && (isGuaziQuickStyle ? guaziTrimRailOptions.length > 1 && !guaziTrimChosen : variantQuickOptions.length)) || hasDirectVariantDepth) && (isGuaziQuickStyle || !trimApplied));
      const showVehicleHeaderRail = Boolean(!isGuaziQuickStyle && usesUxDepth && selectedGeneration && trimApplied);
      const showCategoryQuickRail = categoryLandingOpen && !maker;
      const selectedBikeType = isBikeCategory ? bbmValue.checks.bikeGenre?.[0] : undefined;
      const showBikeTypeQuickRail = Boolean(isGuaziQuickStyle && isBikeCategory && !maker && !selectedBikeType);
      const showTruckFormatRail = Boolean(isTruckCategory && !selectedTruckFormat);
      const showTruckSubtypeRail = Boolean(isTruckCategory && selectedTruckFormat && !selectedTruckSubtype);
      const showTruckSpecRail = Boolean(isTruckCategory && selectedTruckSubtype && truckSpecOptions.length && !selectedTruckSpec);
      const truckSpecDepthComplete = Boolean(!truckSpecOptions.length || selectedTruckSpec);
      // QF-106: 연식 알약 줄 = 계층이 끝난 뒤(트림을 골랐거나 트림 1개 이하, 또는 세부모델이 없는 모델)
      const showYearQuickRail = Boolean(isGuaziQuickStyle && maker && selectedModel && (
        (selectedGeneration && (guaziTrimChosen || guaziTrimRailOptions.length <= 1)) || (!hasGenerationDepth && !hasDirectVariantDepth)
      ));
      const categoryTypeBrandList = krTypeTop10(category);
      const useCarBodyPillRail = Boolean(desktop && isGuaziQuickStyle && !maker && (category === "국산차" || category === "수입차"));
      const showCarBodyTypeRail = Boolean(isGuaziQuickStyle && !maker && (category === "국산차" || category === "수입차") && !useCarBodyPillRail);
      const selectedCarBodyTypes = bbmValue.checks.bodyType ?? [];
      const selectedCarBodyType = selectedCarBodyTypes[0] ?? null;
      const bodyModelOptions = hooks.memo(() => {
        const modelsByBodyType = category === "국산차"
          ? domesticModelsByBodyType
          : category === "수입차"
            ? importedModelsByBodyType
            : null;
        if (!modelsByBodyType || !selectedCarBodyType) return [];
        return (modelsByBodyType[selectedCarBodyType] ?? []).flatMap(([makerName, modelName]) => {
          if (!(modelsByMakerMap[makerName] ?? []).includes(modelName)) return [];
          const visual = modelVisualsByMakerMap[makerName]?.[modelName] ?? guaziModelVisualsByMaker[makerName]?.[modelName];
          const matchingCars = listingCars.filter((car) => car.maker === makerName && (
            catalogModelOfCar(car) === modelName
            || car.modelGroup === modelName
            || normalizeModelSearchText(car.title).includes(normalizeModelSearchText(modelName))
          ));
          return [{
            maker: makerName,
            model: modelName,
            visual,
            listingCount: matchingCars.length,
            fallbackImage: matchingCars.find((car) => car.image)?.image,
          }];
        });
      }, [category, listingCars, modelVisualsByMakerMap, modelsByMakerMap, selectedCarBodyType]);
      const carBodyTypeCount = (label: string) => listingCars.filter((car) => {
        const body = car.filter?.body ?? "";
        return (body === "승합" ? "밴(승합)" : body === "스포츠카" ? "쿠페" : body) === label;
      }).length;
      const chooseCarBodyType = (bodyType: string) => {
        const nextValues = selectedCarBodyTypes.includes(bodyType) ? [] : [bodyType];
        setBbmFilters(setBbmChecks(bbmValue, "bodyType", nextValues));
      };
      const chooseBodyModel = (makerName: string, modelName: string) => {
        applyVehicleSummarySelection(makerName, modelName, null);
      };
      // 트럭은 형식 → 차급 → 적재중량(톤수)을 확정한 다음 단계에서만 제조사 로고를 노출한다.
      hooks.effect(() => { setGroupRail(null); }, [category]);
      const showGroupRail = Boolean(isGuaziQuickStyle && groupRail && categoryIsDefault && !maker);
      const showGuaziMakerRail = Boolean(isGuaziQuickStyle && (!isTruckCategory || Boolean(selectedTruckSubtype && truckSpecDepthComplete)) && !guaziTrimChosen && !showCategoryQuickRail && !showBikeTypeQuickRail && !showModelQuickRail && !showGenerationQuickRail && !showVariantQuickRail && !showVehicleHeaderRail && (categoryBrandRail.title === "제조사" || category === "바이크" || categoryTypeBrandList));
      // PC 첫 화면 카테고리 시안: 각 유형의 현재 샘플 매물 수를 이름 바로 아래에 표시한다.
      const bbmCategoryDraftCount = (value: string, detail: string | null): number => {
        if (!isGuaziQuickStyle) return 0;
        switch (value) {
          case "전체": return allVehicleMixedCars.length;
          case "테마별 중고차": return supercarCategoryCars.length + luxuryCategoryCars.length + oldCarCategoryCars.length + jdmCategoryCars.length;
          case "럭셔리카": return luxuryCategoryCars.length;
          case "올드카": return oldCarCategoryCars.length;
          case "슈퍼카": return supercarCategoryCars.length;
          case "서울오토갤러리": return seoulAutoGalleryCars.length;
          case "도이치오토월드": return deutschAutoworldCars.length;
          case "SK V1 모터스": return joyMotorsCars.length;
          case "트럭 · 특장": return truckCars.filter((car) => !detail || car.truck?.format === detail).length;
          case "바이크": return bikeCars.length;
          case "캠핑카": return campingCars.filter((car) => !detail || car.virtualCategory?.categoryDetail === detail).length;
          case "건설기계": return heavyCars.length;
          case "자재운반장비": return materialHandlingCars.length;
          case "부품 · 용품": return partsCars.length;
          case "JDM": return jdmCategoryCars.length;
          case "레어카": case "튜닝·커스텀카": case "셀럽카": return 0;
          default: return bbmSampleCars.filter((car) => matchesChoTotFilters(car, { ...emptyChoTotFilters, category: value })).length;
        }
      };
      const bbmCategoryRootCounts = Object.fromEntries(
        bbmCategoryGroups.filter((group) => group.value !== "전체").map((group) => [group.value, bbmCategoryDraftCount(group.value, null)]),
      );
      // 2026-10-19 「초톳처럼 우측에 필터 잡아라」: PC 전체 차량은 좌측 필터 대신 xe.chotot.com처럼 목록 오른쪽 300 칸에
      // 흰 상자(반경 12 · 위아래 16) 묶음 — 차량 종류 · 지역 · 유용한 정보. 상자 제목 14/700 + 접기 꺾쇠, 항목 14/400 줄 높이 41.
      const allRailOpen = allRailOpen$.value;
      const allRailRegions = ["서울", "경기", "인천", "부산", "대구", "대전", "광주", "울산", "세종", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];
      const allRailTypes: Array<[string, string]> = [["중고차", "중고차"], ["테마별 중고차", "테마별 중고차"], ["트럭 · 특장", "트럭 · 특장"], ["바이크", "바이크"], ["캠핑카", "캠핑카"], ["건설기계", "건설기계"], ["자재운반장비", "자재운반장비"], ["부품 · 용품", "부품 · 용품"]];
      const renderAllVehiclesRail = () => {
        const selectedRegions = bbmValue.checks.region ?? [];
        const toggleRegion = (sido: string) => {
          const next = selectedRegions.includes(sido) ? selectedRegions.filter((r) => r !== sido) : [sido];
          setBbmFilters({ ...bbmValue, checks: { ...bbmValue.checks, region: next } });
        };
        const box = (key: string, title: string, body: ReactNode) => (
          <section class="bbm-all-rail-box" key={key} aria-label={title}>
            <button type="button" class="bbm-all-rail-head" aria-expanded={allRailOpen[key]} onClick={() => setAllRailOpen((v) => ({ ...v, [key]: !v[key] }))}>
              <span>{title}</span><i aria-hidden="true" />
            </button>
            {allRailOpen[key] ? body : null}
          </section>
        );
        return (
          <aside class="bbm-all-rail" aria-label="전체 차량 필터">
            {box("type", "차량 종류", <ul>{allRailTypes.map(([label, value]) => {
              const n = value === "테마별 중고차" ? bbmCategoryDraftCount(value, null) : bbmCategoryDraftCount(value, null);
              return <li key={value}><button type="button" onClick={() => value === "테마별 중고차" ? setGroupRail("테마별 중고차") : chooseHierarchyCategory(value)}><span>{label}</span><em>{n.toLocaleString("ko-KR")}</em></button></li>;
            })}</ul>)}
            {box("region", "지역", <ul>{allRailRegions.map((sido) => {
              const on = selectedRegions.includes(sido);
              const n = countWithBbm({ ...bbmValue, checks: { ...bbmValue.checks, region: [sido] } });
              return <li key={sido}><button type="button" aria-pressed={on} class={on ? "is-on" : ""} onClick={() => toggleRegion(sido)}><span>{sido}</span><em>{n.toLocaleString("ko-KR")}</em></button></li>;
            })}</ul>)}
            {box("info", "유용한 정보", <ul>{["허위매물 구별법", "매매 서류 안내", "이전비 계산"].map((t) => <li key={t}><button type="button" onClick={() => setSearchToast(`${t} 화면은 준비 중입니다.`)}><span>{t}</span></button></li>)}</ul>)}
          </aside>
        );
      };
      // 필터 칩 줄과 퀵필터 레일은 모바일·PC가 같은 마크업을 쓰고, PC에서는 필터 헤더 패널 안으로 위치만 옮긴다.
      const filterShell = (
              <section class={`filter-shell quick-style-${quickFilterStyle}${activeFilterCount ? " has-active-filters" : ""}`} aria-label="중고차 필터">
                <button class="filter-fixed" type="button" aria-label={activeFilterCount ? `필터 ${activeFilterCount}개 적용됨` : "필터"} onClick={() => { setDraftFilters(filters); setFilterFocus(null); setSheet("filter"); }}><Icon name="filter.svg" /><span>{activeFilterCount || "필터"}</span></button>
                <Carousel ariaLabel="중고차 조건" className="filter-rail" contentClassName="filter-track">
                  {quickFilterChips.map((chip) => <FilterChip key={chip.key} label={chip.label} active={chip.active} className={chip.className} onClick={chip.onClick} onClear={chip.onClear} />)}
                </Carousel>
              </section>
      );
      const baseQuickRail = (
              // QF-105: 트림까지 고르면 퀵필터 줄은 닫힌다(칩 [트림 ×] 로 다시 연다)
              // QF-106: ④ 퀵필터 자리는 닫지 않는다 — 계층(제조사 → 모델 → 세부모델 → 트림)이 끝나면 연식 알약 줄
              showGroupRail && groupRail ? <BbmGroupRail groupValue={groupRail} onChoose={chooseHierarchyCategory} /> :
              isHeavyCategory ? <HeavyQuickFilter value={heavySelection} onChange={applyHeavySelection} /> :
              // 바이크 유형 = 우리 알약칩 규칙(적재중량 알약과 같은 모양, 2026-10-19). 그림자 카드 시안(&qfbrand=shadowcard)만 이미지 카드 유지
              showBikeTypeQuickRail && !brandShadowCard ? <section class="depth-rail no-label is-bike-type-pill-row is-rule-pill-row" aria-label="바이크 유형 빠른 선택">
                <QuickRailCarousel ariaLabel="바이크 유형" className="brand-carousel" contentClassName="depth-rail-track is-chips is-rule-pill-track">
                  {bikeTypeQuickOptions.map((option) => (
                    <TrimChip key={option.label} label={option.label} onClick={() => setBbmFilters(setBbmChecks(bbmValue, "bikeGenre", [option.label]))} />
                  ))}
                </QuickRailCarousel>
              </section> :
              showBikeTypeQuickRail ? <section class={`depth-rail no-label is-bike-type-row${brandShadowCard ? " is-brand-shadowcard" : ""}`} aria-label="바이크 유형 빠른 선택">
                <QuickRailCarousel ariaLabel="바이크 유형" className="brand-carousel" contentClassName="depth-rail-track">
                  {bikeTypeQuickOptions.map((option) => (
                    <DepthCard
                      key={option.label}
                      className="is-bike-type-depth"
                      label={option.label}
                      sub={brandShadowCard ? `(${listingCars.filter((car) => car.filter?.bikeGenre === option.label).length})` : undefined}
                      image={<img src={asset(option.image)} alt="" aria-hidden="true" draggable={false} />}
                      onClick={() => setBbmFilters(setBbmChecks(bbmValue, "bikeGenre", [option.label]))}
                    />
                  ))}
                </QuickRailCarousel>
              </section> :
              showTruckFormatRail ? <>
                {/* 적재중량 줄은 뺐다(2026-10-19 「적재중량은 빼고 트럭 형식 유형만」). 적재용량은 좌측 필터 · 형식 선택 뒤 단계에서 고른다 */}
                <section class="depth-rail no-label is-truck-depth-chip-row is-truck-type-pill-row is-rule-pill-row" aria-label="트럭 유형 빠른 선택">
                  <QuickRailCarousel ariaLabel="트럭 유형" className="brand-carousel" contentClassName="depth-rail-track is-chips is-rule-pill-track">
                    {truckFormatCatalog.map((group) => (
                      <TrimChip
                        key={group.name}
                        label={desktop ? group.name : truckQuickLabel(group.name)}
                        selected={selectedTruckFormat === group.name}
                        onClick={() => chooseTruckFormat(group.name)}
                      />
                    ))}
                  </QuickRailCarousel>
                </section>
              </> :
                        showTruckSubtypeRail ? <section class={showWingbodyImageDepth
                ? "depth-rail no-label is-truck-image-row is-format-sub"
                : `depth-rail no-label is-truck-depth-chip-row${showWingbodyPillDepth ? " is-wingbody-pill-row" : ""}`} aria-label={`${selectedTruckFormat} 세부 형식 빠른 선택`}>
                <QuickRailCarousel ariaLabel={`${selectedTruckFormat} 세부 형식`} className="brand-carousel" contentClassName={showWingbodyImageDepth
                  ? "depth-rail-track"
                  : `depth-rail-track${showWingbodyPillDepth ? " is-chips" : ""}`}>
                  {showWingbodyImageDepth ? <>
                    {wingbodyQuickSubtypes.map((subtype) => (
                      <DepthCard
                        key={subtype}
                        className="is-truck-depth"
                        label={subtype}
                        image={<img src={asset(truckSubtypeImageFor(selectedTruckFormat, subtype) ?? "")} alt="" aria-hidden="true" draggable={false} />}
                        onClick={() => chooseTruckSubtype(subtype)}
                      />
                    ))}
                  </> : showWingbodyPillDepth ? <>
                    {wingbodyQuickSubtypes.map((subtype) => <TrimChip key={subtype} label={subtype} onClick={() => chooseTruckSubtype(subtype)} />)}
                  </> : <>
                    {truckSubtypeOptions.map((subtype) => {
                      const secondaryLabel = truckSubtypeSecondaryLabel(selectedTruckFormat, subtype);
                      return <DepthTextChip key={subtype} label={desktop ? subtype : truckQuickLabel(subtype)} sub={secondaryLabel ?? undefined} onClick={() => chooseTruckSubtype(subtype)} />;
                    })}
                  </>}
                </QuickRailCarousel>
              </section> :
              showTruckSpecRail ? <section class="depth-rail is-trim-row no-label" aria-label={`${selectedTruckSubtype} 적재용량 및 규격 빠른 선택`}>
                <QuickRailCarousel ariaLabel={`${selectedTruckSubtype} 적재용량 및 규격`} className="brand-carousel" contentClassName="depth-rail-track is-chips">
                  {truckSpecOptions.map((option) => <TrimChip key={`${option.group}-${option.value}`} label={option.value} onClick={() => chooseTruckSpec(option.value)} />)}
                </QuickRailCarousel>
              </section> :
              showYearQuickRail ? <StableYearRow value={bbmValue} onChange={(next) => setBbmFilters(next)} /> :
              // QF-091: 과쯔(개발 시안형)는 퀵필터 0단계 대신 원본 차량 유형 줄. 유형을 고르면 같은 자리가 제조사 레일로 바뀐다
              showCategoryQuickRail && isGuaziQuickStyle ? <BbmCategoryMenu onChoose={chooseHierarchyCategory} onOpenGroup={setGroupRail} counts={desktop ? bbmCategoryRootCounts : undefined} /> : showCategoryQuickRail ? <section class="category-row" aria-label="차량 대카테고리 선택">
                <Carousel ariaLabel="차량 대카테고리" className="category-carousel" contentClassName="category-track">
                  {vehicleCategories.map((categoryOption) => (
                    <button key={categoryOption.name} class="category-item" type="button" onClick={() => chooseVehicleCategory(categoryOption.name)}>
                      <span class={`category-icon is-fit-${categoryOption.bodyFit}`}><img src={asset(categoryOption.icon)} alt="" aria-hidden="true" draggable={false} /></span>
                      <span>{categoryOption.name.split("\n").map((line, index) => <span key={line}>{index ? <><br />{line}</> : line}</span>)}</span>
                    </button>
                  ))}
                </Carousel>
              </section> : showModelQuickRail && textOnlyBikeModelPills ? <section class="depth-rail is-trim-row no-label" aria-label="BMW 모델 텍스트 알약칩 빠른 선택">
                <QuickRailCarousel ariaLabel="BMW 모델" className="brand-carousel" contentClassName="depth-rail-track is-chips">
                  {modelQuickOptions.map((model) => (
                    <TrimChip
                      key={model}
                      label={formatModelLabel(model)}
                      selected={selectedModel === model}
                      onClick={() => chooseModel(model)}
                    />
                  ))}
                </QuickRailCarousel>
              </section> : showModelQuickRail && horizontalBikeModelPills ? <section class="model-image-pill-rail" aria-label="BMW 모델 이미지 알약칩 빠른 선택">
                <QuickRailCarousel ariaLabel="BMW 모델" className="brand-carousel" contentClassName="model-image-pill-track">
                  {modelQuickOptions.map((model) => {
                    const modelVisual = guaziVisualsForMaker?.[model];
                    return (
                      <ModelImagePill
                        key={model}
                        label={formatModelLabel(model)}
                        image={modelVisual?.image ? <img src={modelVisual.image} alt="" aria-hidden="true" draggable={false} /> : undefined}
                        selected={selectedModel === model}
                        onClick={() => chooseModel(model)}
                      />
                    );
                  })}
                </QuickRailCarousel>
              </section> : showModelQuickRail && isGuaziQuickStyle && (!isBikeCategory || maker === "BMW") ? <section class={`depth-rail no-label${isLuxuryCategory ? " is-luxury-model-row" : ""}${maker === "페라리" ? " is-ferrari-model-row" : ""}${brandShadowCard ? " is-brand-shadowcard" : ""}${brandShadowCard && maker !== "페라리" ? " is-shadow-model-row" : ""}${isBikeCategory ? " is-bike-model-row" : ""}${guaziCardChipPreview ? " is-guazi-card-chip-row" : ""}`} aria-label={`${maker} 모델 빠른 선택`}>
                <QuickRailCarousel ariaLabel={`${maker} 모델`} className="brand-carousel" contentClassName={`depth-rail-track${guaziCardChipPreview ? " is-guazi-card-chip-track" : ""}`}>
                  {cardChipModelQuickOptions.map((model) => {
                    const modelVisual = guaziVisualsForMaker?.[model];
                    const truckModelVisual = isTruckCategory && selectedTruckFormat === "버스" && maker === "현대"
                      ? hyundaiBusModelVisuals[model]
                      : undefined;
                    // The unified vehicle catalog intentionally leaves model-group images empty.
                    // Until the dedicated Bobaedream artwork is ready, use the already-audited
                    // Daangn-backed catalogue cutouts as a temporary visual fallback.
                    const dedicatedCardVisual = guaziCardChipPreview && maker ? quickModelVisualsByMaker[maker]?.[model] : undefined;
                    const catalogCardVisual = maker ? guaziModelVisualsByMaker[maker]?.[model] : undefined;
                    const angleCardVisual = guaziCardThreeQuarterPreview
                      ? bmwGuaziThreeQuarterVisuals[model]
                      : guaziCardSidePreview
                        ? bmwGuaziSideVisuals[model]
                        : undefined;
                    // 전용 카드 이미지가 있는 모델은 색과 실루엣 차이가 더 잘 보이는
                    // 해당 자산을 우선하고, 나머지만 카탈로그 최신 세대 이미지로 보완한다.
                    const cardVisual = truckModelVisual?.image
                      ? truckModelVisual
                      : angleCardVisual?.image
                      ? angleCardVisual
                      : dedicatedCardVisual?.image
                      ? dedicatedCardVisual
                      : modelVisual?.image
                        ? modelVisual
                        : catalogCardVisual?.image
                          ? catalogCardVisual
                          : modelVisual;
                    return (
                      <DepthCard
                        key={model}
                        className={guaziCardChipPreview ? "is-guazi-card-chip" : undefined}
                        label={formatModelLabel(model)}
                        sub={brandShadowCard ? `(${listingCars.filter((car) => car.maker === maker && (isCatalogMaker ? catalogModelOfCar(car) === model : car.title.includes(model))).length})` : guaziCardChipPreview && maker === "BMW" ? bmwModelBodyTypes[model] : bodyTypeLabel(cardVisual?.bodyType)}
                        image={supportsVehicleCatalog && vehicleCatalog.index ? <CatalogVehicleImage path={cardVisual?.image} name={model} compact /> : isCatalogMaker ? <CatalogModelImage src={cardVisual?.image || undefined} /> : cardVisual?.image ? <img src={cardVisual.image} alt="" aria-hidden="true" draggable={false} /> : undefined}
                        imageFit={cardVisual?.bodyFit ?? "width"}
                        isEV={cardVisual?.isEV}
                        selected={selectedModel === model}
                        disabled={Boolean(isCatalogMaker && modelVisual?.count === "0대")}
                        onClick={() => chooseModel(model)}
                      />
                    );
                  })}
                  {guaziCardChipPreview ? <button type="button" class="guazi-card-chip-more" onClick={() => setSheet("vehicle")} aria-label={`${maker} 전체 모델 선택 화면 열기`}>
                    <span>전체 모델</span><ChevronRightIcon aria-hidden="true" />
                  </button> : null}
                </QuickRailCarousel>
              </section> : showModelQuickRail ? <section class={`brand-row is-benz-model-mode is-titleless${isBikeCategory ? " is-bike-model-text" : ""}`} aria-label={`${maker} 모델 빠른 선택`}>
                <Carousel ariaLabel={`${maker} 모델`} className="brand-carousel" contentClassName="benz-model-track">
                  {modelQuickOptions.map((model) => {
                    const modelVisual = guaziVisualsForMaker?.[model];
                    return <button key={model} class={`benz-model-chip${selectedModel === model ? " is-selected" : ""}`} type="button" aria-pressed={selectedModel === model} disabled={Boolean(isCatalogMaker && modelVisual?.count === "0대")} onClick={() => chooseModel(model)}>{formatModelLabel(model)}</button>;
                  })}
                  {isBikeCategory && maker ? <button type="button" class="benz-model-chip is-all-models" onClick={() => openBbmChipPanel("모델")}>전체 {modelsByMakerMap[maker]?.length.toLocaleString("ko-KR")}개</button> : null}
                </Carousel>
              </section> : showGenerationQuickRail && isGuaziQuickStyle ? <section class={`depth-rail no-label${brandShadowCard ? " is-brand-shadowcard is-shadow-model-row" : ""}`} aria-label={`${accessibleDepthLabel(selectedModel)} 세부모델 빠른 선택`}>
                <QuickRailCarousel ariaLabel={`${accessibleDepthLabel(selectedModel)} 세부모델`} className="brand-carousel" contentClassName="depth-rail-track">
                  {railGenerationOptions.map((generation) => {
                    const catalogModelVisual = selectedModel && maker ? guaziModelVisualsByMaker[maker]?.[selectedModel] : undefined;
                    const selectedModelVisual = selectedModel && guaziVisualsForMaker?.[selectedModel]?.image
                      ? guaziVisualsForMaker[selectedModel]
                      : catalogModelVisual;
                    const daangnCandidates = maker && selectedModel ? guaziGenerationsByMakerModel[maker]?.[selectedModel] ?? [] : [];
                    const generationKeys = [generation.cardLabel, generation.displayLabel, generationCodeLabel(generation), generation.name]
                      .filter(Boolean)
                      .map((value) => normalizeModelSearchText(String(value)));
                    const exactDaangnGeneration = daangnCandidates.find((candidate) => [candidate.cardLabel, candidate.displayLabel, generationCodeLabel(candidate), candidate.name]
                      .filter(Boolean)
                      .map((value) => normalizeModelSearchText(String(value)))
                      .some((key) => key && generationKeys.includes(key)));
                    const generationNameKey = normalizeModelSearchText(generation.name);
                    const namedDaangnGeneration = generationNameKey.length > 3
                      ? daangnCandidates.find((candidate) => normalizeModelSearchText(candidate.name).includes(generationNameKey))
                      : undefined;
                    const generationStartYear = generation.years.match(/\d{2,4}/)?.[0]?.slice(-2);
                    const sameStartYear = generationStartYear
                      ? daangnCandidates.filter((candidate) => candidate.years.match(/\d{2,4}/)?.[0]?.slice(-2) === generationStartYear)
                      : [];
                    const daangnGenerationVisual = exactDaangnGeneration
                      ?? namedDaangnGeneration
                      ?? (sameStartYear.length === 1 ? sameStartYear[0] : undefined);
                    // 전용 제작 이미지 전까지 세부모델도 당근 매칭 컷을 우선 사용하고,
                    // 정확한 세대 매칭이 없으면 해당 모델 대표 컷으로만 임시 보완한다.
                    const generationImage = generation.image || daangnGenerationVisual?.image || selectedModelVisual?.image;
                    const generationImageFit = generation.bodyFit ?? daangnGenerationVisual?.bodyFit ?? selectedModelVisual?.bodyFit ?? "width";
                    return (
                      <DepthCard
                        key={generation.name}
                        label={generationCardLabel(generation)}
                        sub={generation.cardSub ?? compactGenerationCardYearLabel(generation.years)}
                        image={supportsVehicleCatalog && vehicleCatalog.index ? <CatalogVehicleImage path={generationImage} name={generation.name} compact /> : isCatalogMaker ? <CatalogModelImage src={generationImage} /> : generationImage ? <img src={generationImage} alt="" aria-hidden="true" draggable={false} /> : undefined}
                        imageFit={generationImageFit}
                        isEV={generation.isEV ?? selectedModelVisual?.isEV}
                        selected={selectedGeneration === generation.name}
                        disabled={(generation.count ?? generation.variants.reduce((sum, variant) => sum + toTrimOption(variant).count, 0)) === 0}
                        onClick={() => chooseGeneration(generation.name)}
                      />
                    );
                  })}
                </QuickRailCarousel>
              </section> : showGenerationQuickRail ? <section class="brand-row is-generation-mode is-titleless" aria-label={`${accessibleDepthLabel(selectedModel)} 세대 빠른 선택`}>
                <Carousel ariaLabel={`${accessibleDepthLabel(selectedModel)} 세대`} className="brand-carousel" contentClassName="generation-track">
                  {railGenerationOptions.map((generation) => {
                    return (
                      <button key={generation.name} class={`benz-model-chip generation-chip${selectedGeneration === generation.name ? " is-selected" : ""}`} type="button" aria-pressed={selectedGeneration === generation.name} onClick={() => chooseGeneration(generation.name)}>
                        <strong>{generation.name}</strong>
                        <span>{generation.years}</span>
                      </button>
                    );
                  })}
                </Carousel>
              </section> : showVariantQuickRail && isGuaziQuickStyle ? <section class="depth-rail is-trim-row no-label" aria-label={`${accessibleDepthLabel(selectedGeneration ?? selectedModel)} 트림 빠른 선택`}>
                {/* QF-105: 초톳 알약 줄 — "전체" 칩·선택 표시 없음, 처음엔 모든 트림, 누르면 바로 적용 */}
                <QuickRailCarousel ariaLabel={`${accessibleDepthLabel(selectedGeneration ?? selectedModel)} 트림`} className="brand-carousel" contentClassName="depth-rail-track is-chips">
                  {variantTrimOptions.map((variant) => (
                    <TrimChip key={variant.name} label={variant.name} disabled={variant.count === 0} onClick={() => chooseTrimPill(variant.name)} />
                  ))}
                </QuickRailCarousel>
              </section> : showVariantQuickRail ? <section class="brand-row is-benz-model-mode is-titleless" aria-label={`${accessibleDepthLabel(selectedGeneration ?? selectedModel)} 트림 빠른 선택`}>
                <Carousel ariaLabel={`${accessibleDepthLabel(selectedGeneration ?? selectedModel)} 트림`} className="brand-carousel" contentClassName="benz-model-track">
                  {variantTrimOptions.map((variant) => (
                    <button key={variant.name} class={`benz-model-chip${selectedVariants.includes(variant.name) ? " is-selected" : ""}`} type="button" aria-pressed={selectedVariants.includes(variant.name)} disabled={variant.count === 0} onClick={() => chooseVariant(variant.name)}>{variant.name}</button>
                  ))}
                </Carousel>
              </section> : showVehicleHeaderRail && isGuaziQuickStyle ? <section class="depth-rail is-vehicle-header no-label" aria-label="선택 차종 요약">
                <div class="depth-vehicle-header">
                  {selectedGenerationVisual ? <img src={selectedGenerationVisual} alt="" aria-hidden="true" draggable={false} /> : null}
                  <div>
                    <strong>{maker} {selectedModel ? formatModelLabel(selectedModel) : ""} {selectedGenerationOption ? generationDisplayLabel(selectedGenerationOption) : ""}</strong>
                    <span>{selectedGenerationSummary}</span>
                  </div>
                </div>
              </section> : showGuaziMakerRail && isGuaziQuickStyle ? (() => {
                // 제조사 줄은 현재 초톳처럼 별도 왼쪽 제목 칸 없이 로고 슬롯부터 배치한다.
                // QF-108: 월 단위 상위 10(brand-top10.json) + 11번째 "기타 브랜드"(제조사 칩과 같은 목록 창을 연다)
                // QF-114: 바이크 · 트럭·특장은 유형별 상위 10(승용 브랜드 없음), 샘플 0대 칸은 흐리게(빼지 않음), 로고가 없으면 첫 글자 원형
                const typeList = categoryTypeBrandList;
                const sections = krTopTenSections(category === "국산차" ? "domestic" : category === "수입차" || category === "도이치오토월드" || category === "SK V1 모터스" ? "imported" : "all", typeList ? category : undefined);
                // 올드카는 고정 인기 제조사 목록을 쓰지 않는다. 현재 목록(선택한 연대·검색·필터 반영)에
                // 실제로 남아 있는 제조사만, 매물에 처음 등장하는 순서대로 로고 레일에 노출한다.
                const oldcarListingBrands = category === "올드카"
                  ? Array.from(new Map(visibleCars
                    .filter((car) => Boolean(car.maker))
                    .map((car) => [car.maker, { label: car.maker, key: car.maker }])).values())
                    .sort((first, second) => Number(second.key === "현대") - Number(first.key === "현대"))
                  : null;
                const sampleCount = (key: string) => isTruckCategory
                  ? listingCars.filter((car) => car.maker === key && matchesTruckSelection(car)).length
                  : listingCars.filter((car) => car.maker === key).length;
                if (horizontalBikeBrandPills) {
                  const bikeBrands = [...sections.domestic, ...sections.imported];
                  return (
                    <section class="model-image-pill-rail is-brand-pill-rail" aria-label="바이크 브랜드 로고 알약칩 빠른 선택">
                      <QuickRailCarousel ariaLabel="바이크 브랜드" className="brand-carousel" contentClassName="model-image-pill-track">
                        {bikeBrands.map((item) => (
                          <ModelImagePill
                            key={item.label}
                            label={categoryRailLabel(category, item.label)}
                            image={<CategoryBrandLogo category={category} name={item.label} kind="rail" initialFallback />}
                            variant="brand"
                            className={sampleCount(item.key) === 0 ? "is-dim" : undefined}
                            selected={maker === item.key}
                            onClick={() => applyMakerFilter(item.key)}
                          />
                        ))}
                        <ModelImagePill
                          label="기타 브랜드"
                          image={<span class="kr-all-brands" aria-hidden="true"><svg viewBox="0 0 22 24" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M17 13.5c-.85 0-1.5-.65-1.5-1.5s.65-1.5 1.5-1.5 1.5.65 1.5 1.5-.65 1.5-1.5 1.5Zm0-1c.3 0 .5-.2.5-.5s-.2-.5-.5-.5-.5.2-.5.5.2.5.5.5Zm-6-2c.85 0 1.5.65 1.5 1.5s-.65 1.5-1.5 1.5-1.5-.65-1.5-1.5.65-1.5 1.5-1.5Zm0 1c-.3 0-.5.2-.5.5s.2.5.5.5.5-.2.5-.5-.2-.5-.5-.5Zm-4.5.5c0-.85-.65-1.5-1.5-1.5s-1.5.65-1.5 1.5.65 1.5 1.5 1.5 1.5-.65 1.5-1.5Zm-2 0c0-.3.2-.5.5-.5s.5.2.5.5-.2.5-.5.5-.5-.2-.5-.5Z" fill="currentColor" /></svg></span>}
                          variant="brand"
                          onClick={() => setBbmChipPanel("제조사")}
                        />
                      </QuickRailCarousel>
                    </section>
                  );
                }
                if (usesLuxuryBrandRail) {
                  // 럭셔리카 로고 3종 시안: 확정 16개 순서 · 기본은 초톳식 무배경,
                  // 비교 주소의 &qfcard=card 에서는 같은 로고를 사각 카드칩으로 표시한다.
                  const logoSource = luxuryLogoSource();
                  return (
                    <>
                      {showCarBodyTypeRail ? <section class={`depth-rail is-car-body-type no-label${brandShadowCard ? " is-brand-shadowcard" : ""}`} aria-label={`${category} 바디타입 빠른 선택`} data-bodyview="side" data-bodybrand={carBodyBrandTheme}>
                        <QuickRailCarousel ariaLabel={`${category} 바디타입`} className="brand-carousel" contentClassName="depth-rail-track">
                          {carBodyQuickOptions.map((option) => (
                            <DepthCard
                              key={option.label}
                              className={`is-car-body-depth is-body-${option.assetName}`}
                              sub={brandShadowCard ? `(${carBodyTypeCount(option.label)})` : undefined}
                              label={option.label}
                              image={<img src={carBodyQuickImage(option.assetName, carBodyBrandTheme)} alt="" aria-hidden="true" draggable={false} />}
                              selected={selectedCarBodyTypes.includes(option.label)}
                              onClick={() => chooseCarBodyType(option.label)}
                            />
                          ))}
                        </QuickRailCarousel>
                      </section> : null}
                      <section class={`depth-rail is-kr-maker is-lux-logo no-label${brandShadowCard ? " is-brand-shadowcard" : ""}`} aria-label={`${category} 브랜드 빠른 선택`} data-luxlogo={logoSource}>
                        <QuickRailCarousel ariaLabel={`${category} 브랜드`} className="brand-carousel" contentClassName="depth-rail-track">
                          {luxuryLogoBrands.map((brand, index) => (
                            <DepthCard key={brand.maker} label={brand.maker} sub={brandShadowCard ? `(${listingCars.filter((car) => car.maker === brand.maker).length})` : undefined} image={<img class={`lux-qf-logo lux-qf-logo--${brand.slug}`} src={asset(luxuryLogoPath(logoSource, index))} alt="" draggable={false} />} mediaKind="brand" selected={maker === brand.maker} onClick={() => applyMakerFilter(brand.maker)} />
                          ))}
                        </QuickRailCarousel>
                      </section>
                    </>
                  );
                }
                const card = (item: { label: string; key: string }) => {
                  const catalogMake = vehicleCatalog.index?.manufacturers.find((entry) => entry.name === item.key || entry.name === item.label);
                  const image = category === "바이크"
                    ? <CategoryBrandLogo category={category} name={item.label} kind={plainQuickCards ? "plain" : "rail"} initialFallback />
                    : (!typeList || category === "JDM") && plainQuickCards && railBrandLogo(item.key)
                      ? railBrandLogo(item.key)
                      : catalogMake
                        ? <CatalogLogo path={catalogMake.logoPath} name={catalogMake.name} kind="rail" />
                        : <CategoryBrandLogo category={category} name={item.label} kind={plainQuickCards ? "plain" : "rail"} initialFallback={Boolean(typeList)} />;
                  const cardClassName = typeList && sampleCount(item.key) === 0 ? "is-dim" : undefined;
                  return <DepthCard key={item.label} className={cardClassName} label={categoryRailLabel(category, item.label)} sub={brandShadowCard ? `(${sampleCount(item.key)})` : undefined} image={image} mediaKind="brand" selected={maker === item.key} onClick={() => applyMakerFilter(item.key)} />;
                };
                return (
                  <>
                    {showCarBodyTypeRail ? <section class={`depth-rail is-car-body-type no-label${brandShadowCard ? " is-brand-shadowcard" : ""}`} aria-label={`${category} 바디타입 빠른 선택`} data-bodyview="side" data-bodybrand={carBodyBrandTheme}>
                      <QuickRailCarousel ariaLabel={`${category} 바디타입`} className="brand-carousel" contentClassName="depth-rail-track">
                        {carBodyQuickOptions.map((option) => (
                          <DepthCard
                            key={option.label}
                            className={`is-car-body-depth is-body-${option.assetName}`}
                              sub={brandShadowCard ? `(${carBodyTypeCount(option.label)})` : undefined}
                            label={option.label}
                            image={<img src={carBodyQuickImage(option.assetName, carBodyBrandTheme)} alt="" aria-hidden="true" draggable={false} />}
                            selected={selectedCarBodyTypes.includes(option.label)}
                            onClick={() => chooseCarBodyType(option.label)}
                          />
                        ))}
                      </QuickRailCarousel>
                    </section> : null}
                    <section class={`depth-rail is-kr-maker no-label${brandShadowCard ? " is-brand-shadowcard" : ""}`} aria-label={`${categoryBrandRail.title} 빠른 선택`}>
                      <QuickRailCarousel ariaLabel={categoryBrandRail.title} className="brand-carousel" contentClassName="depth-rail-track">
                        {oldcarListingBrands ? oldcarListingBrands.map(card) : <>
                          {sections.domestic.map(card)}
                          {sections.imported.map(card)}
                          <DepthCard key="기타 브랜드" label="기타 브랜드" image={<span class="kr-all-brands" aria-hidden="true"><svg viewBox="0 0 22 24" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M17 13.5c-.85 0-1.5-.65-1.5-1.5s.65-1.5 1.5-1.5 1.5.65 1.5 1.5-.65 1.5-1.5 1.5Zm0-1c.3 0 .5-.2.5-.5s-.2-.5-.5-.5-.5.2-.5.5.2.5.5.5Zm-6-2c.85 0 1.5.65 1.5 1.5s-.65 1.5-1.5 1.5-1.5-.65-1.5-1.5.65-1.5 1.5-1.5Zm0 1c-.3 0-.5.2-.5.5s.2.5.5.5.5-.2.5-.5-.2-.5-.5-.5Zm-4.5.5c0-.85-.65-1.5-1.5-1.5s-1.5.65-1.5 1.5.65 1.5 1.5 1.5 1.5-.65 1.5-1.5Zm-2 0c0-.3.2-.5.5-.5s.5.2.5.5-.2.5-.5.5-.5-.2-.5-.5Z" fill="currentColor" /></svg></span>} mediaKind="brand" onClick={() => setBbmChipPanel("제조사")} />
                        </>}
                      </QuickRailCarousel>
                    </section>
                  </>
                );
              })() : showGuaziMakerRail ? <section class="depth-rail no-label" aria-label={`${categoryBrandRail.title} 빠른 선택`}>
                <Carousel ariaLabel={categoryBrandRail.title} className="brand-carousel" contentClassName="depth-rail-track">
                  {categoryBrandRail.options.map((option) => (
                    <DepthCard
                      key={option.name}
                      label={option.name}
                      image={<BrandRailMark option={option} variant="depth" />}
                      mediaKind="brand"
                      selected={Boolean(option.maker && maker === option.maker)}
                      onClick={() => option.maker ? applyMakerFilter(option.maker) : undefined}
                    />
                  ))}
                </Carousel>
              </section> : <section class="brand-row category-brand-row is-titleless" aria-label={`${categoryBrandRail.title} 빠른 선택`}>
                <Carousel ariaLabel={categoryBrandRail.title} className="brand-carousel" contentClassName="brand-track">
                  {categoryBrandRail.options.map((option) => (
                    <button key={option.name} class={`brand-item${option.maker && maker === option.maker ? " is-selected" : ""}`} type="button" aria-pressed={Boolean(option.maker && maker === option.maker)} onClick={() => option.maker ? applyMakerFilter(option.maker) : undefined}>
                      <BrandRailMark option={option} />
                      <span>{option.name}</span>
                    </button>
                  ))}
                </Carousel>
              </section>
      );
      const quickRail = useCarBodyPillRail ? <>
        <section class="depth-rail no-label is-car-body-pill-row" aria-label={`${category} 바디타입 빠른 선택`}>
          <QuickRailCarousel ariaLabel={`${category} 바디타입`} className="brand-carousel" contentClassName="depth-rail-track is-chips is-car-body-pill-track">
            {carBodyQuickOptions.map((option) => (
              <TrimChip
                key={option.label}
                label={option.label}
                selected={selectedCarBodyTypes.includes(option.label)}
                onClick={() => chooseCarBodyType(option.label)}
              />
            ))}
          </QuickRailCarousel>
        </section>
        {selectedCarBodyType && bodyModelOptions.length ? <section class="depth-rail no-label is-body-direct-model-row" aria-label={`${selectedCarBodyType} 모델 빠른 선택`}>
          <QuickRailCarousel ariaLabel={`${selectedCarBodyType} 모델`} className="brand-carousel" contentClassName="depth-rail-track is-body-direct-model-track">
            {bodyModelOptions.map((option) => {
              const modelImage = option.visual?.image
                ? supportsVehicleCatalog && vehicleCatalog.index
                  ? <CatalogVehicleImage path={option.visual.image} name={option.model} compact />
                  : <CatalogModelImage src={option.visual.image} />
                : option.fallbackImage
                  ? <img src={asset(option.fallbackImage)} alt="" aria-hidden="true" draggable={false} />
                  : <CatalogModelImage />;
              return <DepthCard
                key={`${option.maker}-${option.model}`}
                className="is-body-direct-model-card"
                label={formatModelLabel(option.model)}
                ariaLabel={`${option.maker} ${formatModelLabel(option.model)} 모델 선택`}
                sub={`${option.maker}${option.listingCount ? ` · ${option.listingCount.toLocaleString("ko-KR")}대` : ""}`}
                image={modelImage}
                imageFit={option.visual?.bodyFit ?? "width"}
                isEV={option.visual?.isEV}
                onClick={() => chooseBodyModel(option.maker, option.model)}
              />;
            })}
          </QuickRailCarousel>
        </section> : baseQuickRail}
      </> : isGuaziQuickStyle && category === "올드카" && !maker ? <>
        <section class="depth-rail no-label is-oldcar-decade-row" aria-label="올드카 연대 빠른 선택">
          <QuickRailCarousel ariaLabel="올드카 연대" className="brand-carousel" contentClassName="depth-rail-track is-chips is-oldcar-decade-track">
            <span class="oldcar-decade-label">연대</span>
            {oldcarDecades.map((option) => (
              <TrimChip
                key={option.value}
                label={option.label}
                selected={selectedOldcarDecade === option.value}
                onClick={() => chooseOldcarDecade(option.value)}
              />
            ))}
          </QuickRailCarousel>
        </section>
        {baseQuickRail}
      </> : isGuaziQuickStyle && maker === "페라리" && showModelQuickRail && ferrariRegionOptions.length ? <>
        <section class="depth-rail no-label is-ferrari-region-row" aria-label="페라리 지역 빠른 선택">
          <QuickRailCarousel ariaLabel="페라리 지역" className="brand-carousel" contentClassName="depth-rail-track is-chips is-ferrari-region-track">
            <span class="ferrari-region-label">지역</span>
            {ferrariRegionOptions.map((option) => (
              <TrimChip
                key={option.value}
                label={`${option.label} ${option.count.toLocaleString("ko-KR")}대`}
                selected={region.province === option.value && !region.radius}
                onClick={() => chooseFerrariRegion(option.value)}
              />
            ))}
          </QuickRailCarousel>
        </section>
        {region.province && ferrariRegionDepthOptions.length ? <section class="depth-rail no-label is-ferrari-region-depth-row" aria-label={ferrariSpecialRegions.includes(region.province as (typeof ferrariSpecialRegions)[number]) ? "페라리 딜러 빠른 선택" : "페라리 시군구 빠른 선택"}>
          <QuickRailCarousel ariaLabel={ferrariSpecialRegions.includes(region.province as (typeof ferrariSpecialRegions)[number]) ? "페라리 딜러" : "페라리 시군구"} className="brand-carousel" contentClassName="depth-rail-track is-chips is-ferrari-region-track is-depth-two">
            <span class="ferrari-region-label">{ferrariSpecialRegions.includes(region.province as (typeof ferrariSpecialRegions)[number]) ? "딜러" : "시·군·구"}</span>
            {ferrariRegionDepthOptions.map((option) => (
              <TrimChip
                key={`${option.kind}-${option.value}`}
                label={`${option.label} ${option.count.toLocaleString("ko-KR")}대`}
                selected={option.kind === "dealer" ? selectedFerrariDealer === option.value : region.district === option.value}
                onClick={() => chooseFerrariRegionDepth(option)}
              />
            ))}
          </QuickRailCarousel>
        </section> : null}
        {baseQuickRail}
      </> : baseQuickRail;
      const seoulAutoGalleryDealerRail = isGuaziQuickStyle && category === "서울오토갤러리" && !maker
        ? <SeoulAutoGalleryDealerRail onOpenDealer={openDealerProfile} />
        : isGuaziQuickStyle && category === "도이치오토월드" && !maker
          ? <DeutschAutoworldDealerRail />
          : null;
      const seoulAutoGalleryHeader = isGuaziQuickStyle && category === "서울오토갤러리" && !maker
        ? <SeoulAutoGalleryHeader />
        : null;
      const deutschAutoworldHeader = isGuaziQuickStyle && category === "도이치오토월드" && !maker
        ? <DeutschAutoworldHeader />
        : null;
      const skV1Header = isGuaziQuickStyle && category === "SK V1 모터스" && !maker
        ? <SkV1MotorsHeader cover={joyMotorsCars.find((car) => car.image)?.image} shopCount={joyMotorsCars.length} />
        : null;
      const supercarCategoryHeader = isGuaziQuickStyle && category === "슈퍼카" && !maker
        ? <SupercarCategoryHeader />
        : null;
      const ferrariCategoryHeader = isGuaziQuickStyle && maker === "페라리"
        ? <FerrariCategoryHeader />
        : null;
      const oldcarCategoryHeader = isGuaziQuickStyle && category === "올드카" && !maker
        ? <OldcarCategoryHeader />
        : null;
      const categoryComplexHeader = ferrariCategoryHeader ?? supercarCategoryHeader ?? oldcarCategoryHeader ?? seoulAutoGalleryHeader ?? deutschAutoworldHeader ?? skV1Header;
      const isSeoulAutoGalleryLanding = isGuaziQuickStyle && category === "서울오토갤러리";
      // 도이치오토월드도 서울오토갤러리와 같은 판매 차량 · 상사 · 딜러 · 소개 탭(2026-10-23). 탭 값은 같은 `sag` 주소 값을 쓴다.
      const isDeutschLanding = isGuaziQuickStyle && category === "도이치오토월드";
      const showSeoulAutoGalleryVehicles = !(isSeoulAutoGalleryLanding || isDeutschLanding) || seoulAutoGallerySection === "vehicles";
      const quickStyleSelect = (
                <label class="quick-style-select">
                  <span>적용 사이트</span>
                  <select value={quickFilterStyle} onChange={(event) => chooseQuickFilterStyle(event.currentTarget.value as QuickFilterStyle)}>
                    {quickFilterStyleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
      );
      const carListItems = visibleCars.length ? visibleCars.map((car) => desktop && !pcGridView
        ? <PcCarRow key={car.id} car={car} liked={likedIds.includes(car.id)} onOpen={() => openCarDetail(car)} onToggleLike={() => toggleLiked(car.id)} />
        : <CarCard key={car.id} car={car} cardView={cardView && !desktop} liked={likedIds.includes(car.id)} onOpen={() => openCarDetail(car)} onToggleLike={() => toggleLiked(car.id)} />) : (
        <div class="empty-state"><strong>조건에 맞는 차량이 없어요</strong><span>{query.trim() ? "선택한 차종은 유지하고 검색어만 지워보세요." : "필터를 초기화하고 다시 찾아보세요."}</span><button type="button" onClick={() => query.trim() ? setQuery("") : resetFilters()}>{query.trim() ? "검색어 지우기" : "필터 초기화"}</button></div>
      );
      const pcToday = new Date();
      const pcTitleMonth = `${pcToday.getFullYear()}.${String(pcToday.getMonth() + 1).padStart(2, "0")}`;
      const pcCurrentSelection = vehicleSummaryLabel || (categoryIsDefault ? "전체차량" : category);
      const pcActivePriceLink = pcPriceLinks.find((link) => link.min === price.min && link.max === price.max)?.label;
  
      // QF-076: 제조사·모델·등급 외 필터(filters.bbm)는 선택 모양만 남기고 목록을 거르지 않는다 → "확인 N대"는 지금 목록 수
      const countWithBbm = (bbm: BbmFilterValues) => isGuaziQuickStyle ? baseListCars.filter((car) => matchesBbmFilters(car, bbm)).length : visibleCars.length;
      const setBbmFilters = (bbm: BbmFilterValues) => setFilters((current) => ({ ...current, bbm }));
      // 2026-10-18 클래시파이드 우선순위: 카테고리·차종 → 제조사 → 가격 → 연식 → 주행거리 → 연료 → 지역 → 매매단지.
      // 일반 중고차 계열은 PC·모바일 모두 판매자 칩을 생략한다. 판매자 조건은 좌측 상세 필터와 목록 탭에서 계속 제공한다.
      // 모바일은 빈 지역·매매단지 칩도 생략하고 전체 필터/지역 헤더를 유지한다.
      // 값이 걸린 필터 칩은 줄에서 빠지고 그 자리에 적용 칩(진한 채움 + ×)이 생긴다. 요약 칩·트림 칩은 퀵필터 규격 그대로
      const chipByKey = (key: string) => quickFilterChips.find((chip) => chip.key === key);
      // QF-117: 과쯔 주행거리 칩 표기 = "3~6만km"(칩) · "3.5~8만km"(직접 범위) · "10만km 이상"(최대 없음)
      const bbmApplied = bbmAppliedChips(bbmValue).map((chip) => (isGuaziQuickStyle && chip.id === "range:mileage" ? { ...chip, label: mileageSummary(bbmValue.ranges.mileage) || chip.label } : chip));
      const bbmPanelForId = (id: string) => {
        const [kind, key] = id.split(":");
        if (id === "ad") return "광고기간";
        if (id === "keyword") return "차량번호 / 판매자";
        if (isBikeCategory && kind === "check" && ["region", "district", "neighborhood"].includes(key)) return "바이크 지역";
        return bbmSidebarItems.find((item) => kind === "check" ? item.checkKey === key || (key === "seatFinish" && item.label === "시트색상") : item.rangeKey === key || (["length", "width", "height"].includes(key) && item.label === "크기"))?.label ?? null;
      };
      const openBbmChipPanel = (panel: string | null) => { setBbmFrozen({ cars: visibleCars, history: bbmValue.history ?? 0 }); setBbmChipPanel(panel); };
      // 칩 창이 열려 있는 동안 목록·총 대수·최근검색기록은 연 순간 그대로
      const shownCars = bbmFrozen?.cars ?? visibleCars;
      const shownHistory = bbmFrozen ? bbmFrozen.history : bbmValue.history ?? 0;
      // QF-092: 한 페이지 20대(원본). 필터·정렬·판매자 탭·검색을 바꾸면 1페이지로
      const bbmPageKey = JSON.stringify([filters, heavySelection, selectedTruckFormat, selectedTruckSubtype, selectedTruckSpec, selectedOldcarDecade, selectedBikeShop, query, region, selectedGeneration, effectiveSelectedVariants, bbmSort]);
      hooks.effect(() => { setBbmPage(1); }, [bbmPageKey]);
      const bbmPageCount = Math.max(1, Math.ceil(shownCars.length / BBM_PAGE_SIZE));
      const bbmPageNow = Math.min(bbmPage, bbmPageCount);
      const pagedCars = isGuaziQuickStyle ? shownCars.slice((bbmPageNow - 1) * BBM_PAGE_SIZE, bbmPageNow * BBM_PAGE_SIZE) : shownCars;
      // 원본 실측: 페이지를 바꾸면 PC는 목록 상자 위 16px(scrollY 125), 모바일은 맨 위 근처로 올라간다
      const goBbmPage = (next: number) => {
        setBbmPage(next);
        window.requestAnimationFrame(() => {
          const scroller = document.querySelector<HTMLElement>(".marketplace.is-bbm, .marketplace.is-bbm-m")?.closest<HTMLElement>(".mobile-scroll");
          const content = document.querySelector<HTMLElement>(".marketplace.is-bbm .bbm-content");
          if (!scroller) return;
          scroller.scrollTop = content ? scroller.scrollTop + content.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 16 : 0;
        });
      };
      const chooseBbmSort = (option: string) => { setBbmSort(option as BbmSort); setBbmMenu(null); };
      const chooseBbmView = (option: string) => {
        setBbmMenu(null);
        if (option === "목록으로 보기" || option === "피드로 보기" || option === "갤러리로 보기" || option === "한줄 광고로 보기" || option === "텍스트로 보기") {
          setBbmMobileView(option);
          return;
        }
        setSearchToast(`${option}는 준비 중입니다.`);
      };
      const groupChip = (key: string, label: string, panel: string, applied: boolean) => applied ? null : { key, label, active: false, onClick: () => openBbmChipPanel(panel) };
      type BbmChip = { key: string; label: string; active?: boolean; className?: string; prefix?: ReactNode; onClick: () => void; onClear?: () => void };
      const toAppliedBbmChip = (chip: (typeof bbmApplied)[number]): BbmChip => ({
        key: `applied-${chip.id}`,
        label: chip.label,
        active: true,
        className: chip.id === "range:mileage" ? "is-applied is-mileage" : chip.id === "range:price" ? "is-applied is-price" : "is-applied",
        onClick: () => openBbmChipPanel(bbmPanelForId(chip.id)),
        onClear: () => setBbmFilters(chip.clear(bbmValue)),
      });
      const sellerApplied = bbmApplied.filter((chip) => chip.id.startsWith("check:sellerKind:"));
      const priceApplied = bbmApplied.filter((chip) => chip.id === "range:price");
      const yearApplied = bbmApplied.filter((chip) => chip.id === "range:year");
      const mileageApplied = bbmApplied.filter((chip) => chip.id === "range:mileage");
      const fuelApplied = bbmApplied.filter((chip) => chip.id.startsWith("check:fuel:"));
      const bikeGenreApplied = bbmApplied.filter((chip) => chip.id.startsWith("check:bikeGenre:"));
      const bikeDisplacementApplied = bbmApplied.filter((chip) => chip.id === "range:displacement");
      const bikeLicenseApplied = bbmApplied.filter((chip) => chip.id.startsWith("check:bikeLicense:"));
      const truckAxleApplied = bbmApplied.filter((chip) => chip.id.startsWith("check:truckAxle:"));
      const regionApplied = bbmApplied.filter((chip) => chip.id.startsWith("check:region:") || chip.id.startsWith("check:district:") || chip.id.startsWith("check:neighborhood:"));
      const complexApplied = bbmApplied.filter((chip) => chip.id.startsWith("check:complex:"));
      const hideSellerQuickChip = desktop && isGuaziQuickStyle && (isUsedCarCategory || isBikeCategory || isTruckCategory);
      const fixedSlotAppliedIds = new Set([...sellerApplied, ...priceApplied, ...yearApplied, ...mileageApplied, ...fuelApplied, ...bikeGenreApplied, ...bikeDisplacementApplied, ...bikeLicenseApplied, ...truckAxleApplied, ...regionApplied, ...complexApplied].map((chip) => chip.id));
      const otherApplied = bbmApplied.filter((chip) => !fixedSlotAppliedIds.has(chip.id));
      const openMakerPicker = () => openBbmChipPanel("제조사");
      // 모든 차량 카테고리는 필터 줄 첫 칸에 현재 선택 카테고리를 같은 규격으로 표시한다.
      // 카테고리 이름은 카테고리 시트를 열고, ×는 전체차량으로 돌아간다.
      const openBbmCategorySheet = () => {
        setBbmCategoryDraft(category);
        setBbmCategoryChildDraft(category === "트럭 · 특장" ? selectedTruckFormat : bbmCategoryChild);
        setBbmCategoryOpen(true);
      };
      const selectedCategoryChip: BbmChip = {
        key: "category",
        label: categoryIsDefault ? (groupRail && !maker ? bbmGroupLabel(groupRail) : "전체차량") : category,
        active: true,
        className: "is-category-chip is-vehicle-summary is-step",
        prefix: isBikeCategory ? <img class="filter-chip-bike-icon" src={asset("bbm/filter-bike-selected.svg")} alt="" aria-hidden="true" /> : undefined,
        onClick: desktop ? () => openQuickFilter("category") : openBbmCategorySheet,
        onClear: categoryIsDefault && groupRail ? () => setGroupRail(null) : clearCategoryFilter,
      };
      const bbmChips: BbmChip[] = ([
        selectedCategoryChip,
        // 바이크는 카테고리 다음에 유형(장르) → 제조사 → 모델 순서로 탐색한다.
        ...(isBikeCategory ? [
          ...(bikeGenreApplied.length ? bikeGenreApplied.map(toAppliedBbmChip) : [groupChip("bike-type", "유형", "장르", false)]),
          ...(!maker ? [{ key: "maker", label: "제조사", active: false, onClick: openMakerPicker }] : []),
        ] : []),
        // 건설기계 퀵필터 3단계: 제조사 로고 → 모델 이미지 → 세부모델·세부 형식 이미지
        ...(isHeavyCategory ? [
          heavySelection.manufacturerCode
            ? { key: "heavy-maker", label: heavySelection.maker ?? "제조사", active: true, className: "is-vehicle-summary is-step", onClick: clearHeavyMaker, onClear: clearHeavyMaker }
            : { key: "heavy-maker", label: "제조사", active: false, onClick: clearHeavyMaker },
          heavySelection.manufacturerCode && heavySelection.modelCode
            ? { key: "heavy-model", label: heavySelection.model ?? "모델", active: true, className: "is-vehicle-summary is-step", onClick: clearHeavyModel, onClear: clearHeavyModel }
            : heavySelection.manufacturerCode ? { key: "heavy-model", label: "모델", active: false, onClick: clearHeavyModel } : null,
          heavySelection.modelCode && heavySelection.submodelCode
            ? { key: "heavy-submodel", label: heavySelection.submodel ?? "세부모델", active: true, className: "is-vehicle-summary is-step", onClick: clearHeavySubmodel, onClear: clearHeavySubmodel }
            : heavySelection.modelCode ? { key: "heavy-submodel", label: "세부모델 · 세부 형식", active: false, onClick: clearHeavySubmodel } : null,
        ] : []),
        // 트럭·특장은 엔카 기준 형식 → 세부 형식 → 제조사 순서
        ...(isTruckCategory ? [
          selectedTruckFormat
            ? { key: "truck-format", label: selectedTruckFormat, active: true, className: "is-vehicle-summary is-step", onClick: () => setTruckTypePickerOpen(true), onClear: clearTruckFormat }
            : { key: "truck-format", label: "형식/적재용량", active: false, onClick: () => setTruckTypePickerOpen(true) },
          selectedTruckFormat && selectedTruckSubtype
            ? { key: "truck-subtype", label: selectedTruckFormat === "카고(화물)트럭" ? truckSubtypeSecondaryLabel(selectedTruckFormat, selectedTruckSubtype) ?? truckSubtypeLabel(selectedTruckSubtype) : truckSubtypeLabel(selectedTruckSubtype), active: true, className: "is-vehicle-summary is-step", onClick: () => setTruckTypePickerOpen(true), onClear: clearTruckSubtype }
            : selectedTruckFormat ? { key: "truck-subtype", label: "세부 유형", active: false, onClick: () => setTruckTypePickerOpen(true) } : null,
          selectedTruckSubtype && truckSpecOptions.length && selectedTruckSpec
            ? { key: "truck-spec", label: selectedTruckSpec, active: true, className: "is-vehicle-summary is-step", onClick: clearTruckSpec, onClear: clearTruckSpec }
            : selectedTruckSubtype && truckSpecOptions.length ? { key: "truck-spec", label: "적재용량", active: false, onClick: clearTruckSpec } : null,
          ...(!maker ? [{ key: "maker", label: "제조사", active: false, onClick: openMakerPicker }] : []),
        ] : []),
        // 원본: 제조사를 고르면 [현대 ×][모델] 이 적용 칩 앞, 고르기 전에는 적용 칩 뒤에 [제조사]
        // QF-097 보완: 제조사·모델·세부 모델을 단계별 검정 적용 칩으로 [벤츠 ×][E클래스 ×][W213 ×]. 각 × 는 그 단계부터 아래만 푼다
        // (세부 모델 × → 세부 모델 줄, 모델 × → 모델 줄(제조사 유지), 제조사 × → 제조사 줄). 칩을 누르면 차종 시트. 경로·제목은 그대로 이어 쓴다
        ...(maker ? [
          { key: "step-maker", label: maker, active: true, className: "is-vehicle-summary is-step", prefix: supportsVehicleCatalog ? <CatalogLogo path={vehicleCatalog.index?.manufacturers.find((item) => item.name === maker)?.logoPath} name={maker} kind="chip" /> : undefined, onClick: () => openBbmChipPanel("제조사"), onClear: clearMakerFilter },
          selectedModel ? { key: "step-model", label: formatModelLabel(selectedModel), active: true, className: "is-vehicle-summary is-step", onClick: () => openBbmChipPanel("모델"), onClear: clearModelFilter } : null,
          selectedModel && selectedGenerationOption ? { key: "step-generation", label: generationDisplayLabel(selectedGenerationOption), active: true, className: "is-vehicle-summary is-step", onClick: () => setSheet("vehicle"), onClear: clearGenerationFilter } : null,
          selectedModel && selectedGenerationOption && selectedVariants.length ? { key: "step-trim", label: selectedTrimChipLabel, active: true, className: "is-vehicle-summary is-step", onClick: () => setSheet("vehicle"), onClear: clearVariantFilter } : null,
        ] : []),
        maker && !selectedModel ? { key: "model", label: "모델", active: false, onClick: () => openBbmChipPanel("모델") } : null,
        // QF-106: 안 고른 단계 칩 = 다음 단계 이름(모델 ▾ → 세부모델 ▾ → 트림 ▾ → 연식 ▾)
        maker && selectedModel && !selectedGeneration && hasGenerationDepth ? { key: "sub-model", label: "세부모델", active: false, onClick: () => setSheet("vehicle") } : null,
        // 모바일 지역(② 드롭다운)으로 고른 지역 = 검정 적용 칩
        !desktop && !isGuaziQuickStyle && regionLabel !== "전국" ? { key: "region", label: regionLabel, active: true, className: "is-applied", onClick: openRegionSheet, onClear: () => setRegion(emptyRegion) } : null,
        // QF-105: 트림을 고르면 빈 "트림" 칩 대신 단계 칩 [트림 ×]
        selectedVariants.length || (selectedGeneration && guaziTrimRailOptions.length <= 1) ? null : chipByKey("variant"),
        ...otherApplied.map(toAppliedBbmChip),
        isHeavyCategory || isBikeCategory || isTruckCategory ? null : maker ? null : { key: "maker", label: "제조사", active: false, onClick: openMakerPicker },
        // 부품·용품: 연식·주행거리·연료 대신 분류 · 상태 · 적용 차종(2026-10-07)
        ...(isPartsCategory ? [
          groupChip("parts-subtype", "분류", "부품 분류", Boolean(bbmValue.checks.partsSubtype?.length)),
          groupChip("parts-condition", "상태", "부품 상태", Boolean(bbmValue.checks.partsCondition?.length)),
          groupChip("parts-fit", "적용 차종", "적용 차종", Boolean(bbmValue.checks.partsFit?.length)),
        ] : []),
        ...(isTruckCategory ? [
          ...(yearApplied.length ? yearApplied.map(toAppliedBbmChip) : [groupChip("year", "연식", "연식", false)]),
          ...(priceApplied.length ? priceApplied.map(toAppliedBbmChip) : [(() => { const chip = groupChip("price", "가격", "가격", false); return chip ? { ...chip, className: "is-price" } : null; })()]),
          ...(mileageApplied.length ? mileageApplied.map(toAppliedBbmChip) : [(() => { const chip = groupChip("mileage", "주행거리", "주행거리", false); return chip ? { ...chip, className: "is-mileage" } : null; })()]),
          ...(truckAxleApplied.length ? truckAxleApplied.map(toAppliedBbmChip) : [groupChip("truck-axle", "가변축", "트럭 가변축", false)]),
        ] : isBikeCategory ? [
          ...(priceApplied.length ? priceApplied.map(toAppliedBbmChip) : [(() => { const chip = groupChip("price", "가격", "가격", false); return chip ? { ...chip, className: "is-price" } : null; })()]),
          ...(yearApplied.length ? yearApplied.map(toAppliedBbmChip) : [groupChip("year", "연식", "연식", false)]),
          ...(mileageApplied.length ? mileageApplied.map(toAppliedBbmChip) : [(() => { const chip = groupChip("mileage", "주행거리", "주행거리", false); return chip ? { ...chip, className: "is-mileage" } : null; })()]),
          ...(bikeDisplacementApplied.length ? bikeDisplacementApplied.map(toAppliedBbmChip) : [groupChip("bike-displacement", "배기량", "배기량", false)]),
          ...(bikeLicenseApplied.length ? bikeLicenseApplied.map(toAppliedBbmChip) : [groupChip("bike-license", "면허", "면허", false)]),
        ] : [
          ...(priceApplied.length ? priceApplied.map(toAppliedBbmChip) : [(() => { const chip = groupChip("price", "가격", "가격", false); return chip ? { ...chip, className: "is-price" } : null; })()]),
          ...(isPartsCategory ? [] : yearApplied.length ? yearApplied.map(toAppliedBbmChip) : [groupChip("year", "연식", "연식", false)]),
          // QF-118: 과쯔 PC 는 연식 다음 "주행거리 ▾"(누르면 가운데 모달). 모바일은 적용값만 칩으로 보여 준다.
          ...(isPartsCategory ? [] : mileageApplied.length ? mileageApplied.map(toAppliedBbmChip) : desktop && isGuaziQuickStyle ? [(() => { const chip = groupChip("mileage", "주행거리", "주행거리", false); return chip ? { ...chip, className: "is-mileage" } : null; })()] : []),
          ...(isPartsCategory ? [] : fuelApplied.length ? fuelApplied.map(toAppliedBbmChip) : [groupChip("fuel", "연료", "연료", false)]),
        ]),
        ...(hideSellerQuickChip ? [] : sellerApplied.length ? sellerApplied.map(toAppliedBbmChip) : [groupChip("seller", "판매자", "판매자 유형", false)]),
        // 트럭 PC compact는 초톳처럼 칩 위에 독립 지역 줄을 둔다. 같은 기능의 지역 칩은 중복 노출하지 않는다.
        ...(isTruckCategory && desktop
          ? []
          : regionApplied.length ? regionApplied.map(toAppliedBbmChip) : desktop || isBikeCategory ? [groupChip("region-filter", "지역", isBikeCategory ? "바이크 지역" : "지역", false)] : []),
        ...(isBikeCategory
          ? [
            selectedBikeShop
            ? { key: "bike-shop", label: selectedBikeShop, active: true, className: "is-applied", onClick: () => openBbmChipPanel("바이크샵"), onClear: () => setSelectedBikeShop(null) }
            : groupChip("bike-shop", "바이크샵", "바이크샵", false)]
          : isTruckCategory ? [] : complexApplied.length ? complexApplied.map(toAppliedBbmChip) : desktop ? [groupChip("complex", "매매단지", "매매단지", false)] : []),
      ] as Array<BbmChip | null | undefined>).filter((chip): chip is BbmChip => Boolean(chip))
        .filter((chip) => !(desktop && allVehiclesWide) || chip.key === "category" || /price|region/.test(chip.key));
      // 별도 `카테고리 ▾` 칩 없이 선택된 카테고리 칩의 이름을 누르면 카테고리 시트가 열리고, ×는 전체차량으로 돌아간다.
      // 카테고리 시트 하단 `선택 · N대`(2026-10-11 「매물 있는 건 선택되면 하단 선택에 개수 표기」): 임시로 고른 카테고리의 매물 수. 매물이 없으면(JDM 등) 표기하지 않는다.
      const mobileBbmChips: BbmChip[] = bbmChips
        .filter((chip) => chip.key !== "seller" && !chip.key.startsWith("applied-check:sellerKind:"));
      // (setup) const railLeftWide = useRef(...)
      // QF-092 원본 재실측(2026-09-25): 적용 칩이 바뀌어도 칩 줄 스크롤은 그대로(칩을 누를 때만 revealBbmChip). 예전 "맨 앞 적용 칩 47px" 규칙은 우연히 맞았던 것이라 뺐다
      hooks.effect(() => {
        if (desktop || !isGuaziQuickStyle) return;
        const rail = document.querySelector<HTMLElement>(".filter-shell.is-bbm .filter-rail");
        if (!rail) return;
        const update = () => {
          const scrolled = rail.scrollLeft > 0;
          // 필터 칩이 아직 넓을 때(밀리기 직전)의 칩 줄 왼쪽 끝을 기억한다
          if (scrolled && !rail.style.paddingLeft && !document.querySelector(".filter-shell.is-bbm.is-scrolled")) railLeftWide.current = rail.getBoundingClientRect().left;
          setBbmRailScrolled(scrolled);
        };
        update();
        rail.addEventListener("scroll", update, { passive: true });
        return () => rail.removeEventListener("scroll", update);
      }, [desktop, isGuaziQuickStyle]);
      // 칩 줄 끊김 보정(2026-10-12 「필터칩 좌측 이동시키면 부자연스럽게 뚝뚝 끊긴다」): "필터" 칩이 줄어들면 칩 줄 왼쪽 끝이 그만큼 왼쪽으로 옮겨
      // 칩들이 손가락 밑에서 한 번에 튀었다. 줄어든 폭만큼 칩 줄 왼쪽 안쪽 여백을 더해 칩 위치를 그대로 두고, 다시 펴지면 여백을 뺀다.
      hooks.layoutEffect(() => {
        if (desktop || !isGuaziQuickStyle) return;
        const rail = document.querySelector<HTMLElement>(".filter-shell.is-bbm .filter-rail");
        if (!rail) return;
        if (bbmRailScrolled) {
          const wide = railLeftWide.current;
          if (wide !== null) {
            const delta = wide - rail.getBoundingClientRect().left;
            if (delta > 0) rail.style.paddingLeft = `${delta}px`;
          }
        } else {
          rail.style.paddingLeft = "";
        }
      }, [bbmRailScrolled, desktop, isGuaziQuickStyle]);
      // QF-092 원본 실측(2026-09-25): 모바일 칩을 누르면 칩 오른쪽 끝이 칩 줄 밖일 때만 그만큼 스크롤(가격 57 · 판매자 끝까지 · 연식 그대로)
      const revealBbmChip = (label: string) => {
        const rail = document.querySelector<HTMLElement>(".filter-shell.is-bbm .filter-rail");
        const chip = [...(rail?.querySelectorAll<HTMLElement>(".filter-chip") ?? [])].find((element) => element.textContent?.trim().startsWith(label));
        if (!rail || !chip) return;
        const railRect = rail.getBoundingClientRect();
        const chipRect = chip.getBoundingClientRect();
        if (chipRect.right > railRect.right) rail.scrollLeft += chipRect.right - railRect.right;
        else if (chipRect.left < railRect.left) rail.scrollLeft -= railRect.left - chipRect.left;
      };
      // 적용 개수(필터 칩 숫자·사이드바 배지): 제조사·모델·등급 등 기존 값 + 개발 시안형 적용 칩
      const bbmAppliedCount = selectedFilterValueCount + bbmApplied.length + (bbmAvailableOnly ? 1 : 0);
      // 제조사 목록 매물 수: 제조사·모델만 뺀 지금 조건으로 우리 데이터에서 센다(원본처럼 0대는 흐리게)
      const bbmMakerBase = listingCars.filter((car) => matchesTruckSelection(car) && matchesChoTotFilters(car, { ...filters, maker: null, model: null }) && (!isGuaziQuickStyle || matchesBbmFilters(car, filters.bbm)));
      // QF-114: 바이크 · 트럭·특장의 제조사 목록(전체 브랜드 · 제조사 칩)은 그 유형 목록만(국산 → 수입 이름순 → 기타), 승용 목록과 섞지 않음
      const bbmTypeList = isGuaziQuickStyle ? krTypeTop10(category) : null;
      const charanchaMakerFlow = isGuaziQuickStyle && !isPartsCategory && !isHeavyCategory;
      const bbmMakerSections = bbmTypeList
        ? (category === "바이크"
          ? [["인기 브랜드", bbmTypeList.all.imported]].map(([title, labels]) => ({ title: title as string, rows: (labels as string[]).map((label) => ({ label, key: label, count: bbmMakerBase.filter((car) => car.maker === label).length })) }))
          : [["국산", bbmTypeList.all.domestic], ["수입 이름순", bbmTypeList.all.imported], ["기타", bbmTypeList.all.etc]].map(([title, labels]) => ({ title: title as string, rows: (labels as string[]).map((label) => ({ label, key: label, count: bbmMakerBase.filter((car) => car.maker === label).length })) })))
        : bbCatalog.map((section) => ({ title: section.title, rows: section.rows.map(([label, , key]) => ({ label, key: key ?? label, count: bbmMakerBase.filter((car) => car.maker === (key ?? label)).length })) }));
      const bbmSidebarSectionSource = charanchaMakerFlow && category === "국산차"
        ? bbmMakerSections.filter((section) => section.title.includes("국산"))
        : charanchaMakerFlow && category === "수입차"
          ? bbmMakerSections.filter((section) => section.title.includes("수입"))
          : bbmMakerSections;
      const charanchaHiddenDomesticMakers = new Set(["GM대우", "어울림모터스"]);
      const charanchaMakerLabel = (label: string) => label === "쉐보레(국산)"
        ? "쉐보레(GM대우)"
        : label === "KG모빌리티(쌍용)"
          ? "KGM(쌍용)"
          : label;
      // 테스트 매물 수와 좌측 탐색 가능 여부를 분리한다. 실제 재고 연동 전까지 승용 좌측 필터는 모든 카탈로그 항목을 연다.
      const bbmSidebarMakerSections: BbMakerSection[] = bbmSidebarSectionSource.map((section) => ({
        title: charanchaMakerFlow ? section.title.replace("국산차", "국산").replace("수입차 인기", "수입인기").replace("수입차 이름순", "수입전체") : section.title,
        rows: section.rows
          .filter((row) => !(charanchaMakerFlow && section.title.includes("국산") && charanchaHiddenDomesticMakers.has(row.label)))
          .map((row) => [charanchaMakerFlow ? charanchaMakerLabel(row.label) : row.label, charanchaMakerFlow ? (modelsByMakerMap[row.key]?.length ?? row.count) : row.count, row.key] as [string, number, string?]),
      }));
      const bbmModelRows = (makerName: string) => (modelsByMakerMap[makerName] ?? []).map((name) => {
        if (isBikeCategory) {
          const key = normalizeModelSearchText(name);
          const count = listingCars.filter((car) => car.maker === makerName && normalizeModelSearchText(car.modelGroup ?? "") === key).length;
          return { name, label: formatModelLabel(name), count };
        }
        const visualCount = isTruckCategory ? undefined : modelVisualsByMakerMap[makerName]?.[name]?.count;
        const key = normalizeModelSearchText(name);
        const count = visualCount ? Number(visualCount.replace(/[^0-9]/g, "")) : listingCars.filter((car) => car.maker === makerName && normalizeModelSearchText(`${car.title} ${car.trim} ${car.modelGroup ?? ""}`).includes(key)).length;
        return { name, label: formatModelLabel(name), count };
      });
      const truckSidebarBase = isTruckCategory ? listingCars.filter((car) => {
        const normalized = query.trim().toLowerCase();
        const searchText = `${car.title} ${car.trim} ${car.maker} ${car.modelGroup ?? ""}`;
        return matchesChoTotFilters(car, { ...filters, maker: null, model: null })
          && matchesBbmFilters(car, filters.bbm)
          && (!regionKeyword || car.place.includes(regionKeyword))
          && (!region.district || car.place.includes(region.district))
          && (!normalized || searchText.toLowerCase().includes(normalized));
      }) : [];
      const truckSidebarCount = (predicate: (car: Car) => boolean) => truckSidebarBase.filter(predicate).length;
      const truckSidebarFilter: BbTruckFilter | undefined = isTruckCategory ? {
        format: selectedTruckFormat,
        subtype: selectedTruckSubtype,
        spec: selectedTruckSpec,
        formats: truckFormatCatalog.map((group) => ({ name: group.name, count: truckSidebarCount((car) => car.truck?.format === group.name) })),
        subtypes: truckSubtypeOptions.map((subtype) => ({ name: subtype, count: truckSidebarCount((car) => car.truck?.format === selectedTruckFormat && car.truck?.subtype === subtype) })),
        specGroups: truckSpecGroups.map((group) => ({
          label: group.label,
          options: group.options.map((option) => ({ name: option, count: truckSidebarCount((car) => car.truck?.format === selectedTruckFormat && car.truck?.subtype === selectedTruckSubtype && car.truck?.load === option) })),
        })),
        countForSelection: (formatName, subtypeName = null) => {
          const subtypeValues = truckSubtypeValuesForSelection(formatName, subtypeName);
          return truckSidebarCount((car) => car.truck?.format === formatName && (!subtypeName || subtypeValues.includes(car.truck?.subtype ?? "")));
        },
        onChooseFormat: chooseTruckFormat,
        onChooseSubtype: chooseTruckSubtype,
        onChooseSpec: chooseTruckSpec,
        onApplySelection: applyTruckTypeSelection,
        onClearFormat: clearTruckFormat,
        onClearSubtype: clearTruckSubtype,
        onClearSpec: clearTruckSpec,
      } : undefined;
      // 칩 모달(PC 412) · 바텀시트(모바일). 버튼 숫자는 원본처럼 누르기 전 목록 수. 버튼 문구: PC 연식·가격 "N대 보기", 연료·판매자 "확인 N대", 모바일은 모두 "N대 보기"
      const focusMileageChip = () => {
        const chip = document.querySelector<HTMLElement>(".marketplace.is-bbm .bbm-chips .filter-chip.is-mileage");
        return chip ? (chip.matches("button") ? chip : chip.querySelector<HTMLElement>(".filter-chip-label")) : null;
      };
      const focusPriceChip = () => {
        const chip = document.querySelector<HTMLElement>(".marketplace.is-bbm .bbm-chips .filter-chip.is-price");
        return chip ? (chip.matches("button") ? chip : chip.querySelector<HTMLElement>(".filter-chip-label")) : null;
      };
      const renderBbmChipPanel = (onDesktop: boolean) => {
        if (!bbmChipPanel) return null;
        const close = () => { setBbmChipPanel(null); setBbmFrozen(null); };
        const panelValue = bbmValue;
        const setPanelValue = setBbmFilters;
        const apply = close;
        const Frame = onDesktop ? BbmModal : BbmSheet;
        if ((bbmChipPanel === "제조사" || bbmChipPanel === "모델") && supportsVehicleCatalog && vehicleCatalog.index) {
          const hierarchyMakers = vehicleCatalog.index.manufacturers.filter((item) => (
            category === "국산차" ? item.kind === "국산" : category === "수입차" ? item.kind === "수입" : true
          ));
          return <MakerHierarchyModal
            mode={onDesktop ? "modal" : "sheet"}
            onClose={close}
            onApply={(nextMaker, nextModel, nextGeneration) => { applyVehicleSummarySelection(nextMaker, nextModel, nextGeneration); close(); }}
            initialMaker={maker}
            initialModel={selectedModel}
            initialGeneration={selectedGeneration}
            startStep={bbmChipPanel === "제조사" ? "maker" : "model"}
            makers={hierarchyMakers}
            renderMakerLogo={(option) => <CatalogLogo path={option.logoPath} name={option.name} kind="sheet" scope={isBikeCategory ? "bike" : "car"} />}
            modelsByMaker={modelsByMakerMap}
            modelVisualsByMaker={modelVisualsByMakerMap}
            generationsByMakerModel={generationsByMakerModelMap}
            formatModel={formatModelLabel}
            onPreviewMaker={(name) => { void vehicleCatalog.loadMake(name); }}
          />;
        }
        if (bbmChipPanel === "제조사") {
          // QF-096: 제조사 목록 로고 = 승용 제조사 로고(brand/kr) 24×24, 로고 없는 행은 빈 칸
          const list = <BbmMakerList sections={bbmMakerSections} allowEmpty={Boolean(bbmTypeList)} selected={maker} renderLogo={(_key, label) => <CategoryBrandLogo category={category} name={label} kind="list" initialFallback={Boolean(bbmTypeList)} />} onChoose={(key) => { if (maker !== key) applyMakerFilter(key); close(); }} />;
          return <Frame title="제조사" flush onClose={close}>{list}</Frame>;
        }
        if (bbmChipPanel === "모델") {
          const list = <BbmModelList rows={maker ? bbmModelRows(maker) : []} selected={selectedModel} onChoose={(name) => { if (selectedModel !== name) chooseModel(name); close(); }} />;
          return <Frame title="모델" flush onClose={close}>{list}</Frame>;
        }
        if (bbmChipPanel === "바이크샵") {
          return <Frame title="바이크샵" flush onClose={close}><BbmPopOptions options={bikeShopOptions} selected={selectedBikeShop ?? ""} onSelect={(shop) => { setSelectedBikeShop(shop); close(); }} /></Frame>;
        }
        const item = bbmSidebarItems.find((entry) => entry.label === bbmChipPanel);
        if (!item) return null;
        if (item.checkKey === "sellerKind") return <BbmSellerTypeSheet value={bbmValue} countWith={countWithBbm} countOf={bbmCountOf} onApply={setBbmFilters} onClose={close} />;
        if (item.checkKey === "bodyType") return <BbmBodyTypeSheet value={bbmValue} countWith={countWithBbm} countOf={bbmCountOf} onApply={setBbmFilters} onClose={close} />;
        // QF-117: 과쯔 주행거리 칩 — 모바일은 전용 바텀시트, PC 모달은 확정 시안 패널(즉시 반영)
        if (isGuaziQuickStyle && item.label === "주행거리" && !onDesktop) return <MileageFinalSheet value={bbmValue} countOf={countWithBbm} onApply={setBbmFilters} onClose={close} />;
        // QF-118: 과쯔 PC 주행거리 칩 → 가운데 모달(모바일 시트와 같은 내용, 임시 값 · "N대 보기"로 적용). 닫히면 주행거리 칩(적용 칩 포함)으로 포커스 복귀
        if (isGuaziQuickStyle && item.label === "주행거리" && onDesktop) return <MileageFinalSheet variant="modal" value={bbmValue} countOf={countWithBbm} onApply={setBbmFilters} onClose={close} returnFocus={focusMileageChip} />;
        // 가격도 주행거리와 동일하게 모바일 바텀시트·PC 중앙 모달이 한 본문을 공유하며, 결과 버튼을 눌러야 적용한다.
        if (isGuaziQuickStyle && item.label === "가격") return <PriceFinalSheet variant={onDesktop ? "modal" : "sheet"} value={bbmValue} countOf={countWithBbm} onApply={setBbmFilters} onClose={close} returnFocus={onDesktop ? focusPriceChip : undefined} presets={isPartsCategory ? partsPricePresets : undefined} hideTabs={isPartsCategory} />;
        // 원본 실측(2026-09-24): PC 칩으로 연 모달 버튼은 항목 종류를 따른다 — 펼침형(바디타입·연식·가격) "N대 보기", 모달형(연료·인승·판매자) "확인 N대"
        const confirmStyle = !onDesktop || item.mode === "expand" ? "보기" : "확인";
        const footer = item.label === "광고기간" ? undefined : <BbmActionBar variant={onDesktop ? "modal" : "sheet"} confirmStyle={confirmStyle} count={shownCars.length} onReset={() => setPanelValue(clearBbmItem(item, panelValue))} onConfirm={apply} />;
        const body = item.mode === "expand"
          ? <BbmExpandPanel label={item.label} variant="chip" value={panelValue} onChange={setPanelValue} countOf={bbmCountOf} mileageFinal={isGuaziQuickStyle} />
          : <BbmModalPanel item={item} value={panelValue} onChange={setPanelValue} countOf={bbmCountOf} />;
        return <Frame title={item.modalTitle ?? item.label} onClose={close} footer={footer}>{item.mode === "expand" && item.label !== "가격" ? <div class="bbmf-chip-expand">{body}</div> : body}</Frame>;
      };
      // QF-106: 경로는 PC 상단 카드 ① · 모바일 ⑤(회색 띠 아래)에서 같이 쓴다
      const bbmCrumbs: BbmCrumb[] = [
        { label: "보배드림", onClick: () => setSearchToast("보배드림 홈은 정식 서비스에서 이용해 주세요.") },
        // QF-109: 유형이 "중고차"(기본)면 "전체차량" 단계를 빼고 둘째 칸 "중고차"가 그 단계(누르면 제조사 풀기). 다른 유형은 셋째 칸에 유형 이름
        // 초톳 크로스체크(2026-10-10): 초톳 빵부스러기는 `사이트 / 카테고리` 한 칸(「Chợ Tốt Xe / Xe cộ」 · 「Chợ Tốt Xe / Ô tô」)이다.
        // 전체차량 = 「전체차량」, 중고차 = 「중고차」, 중고차 하위(국산차 · 수입차 · 럭셔리카 …) = 「중고차 / 하위」, 트럭 · 바이크 등 다른 유형은 중고차 아래가 아니라 이름 한 칸
        ...(categoryIsDefault
          ? [{ label: "전체차량", onClick: clearMakerFilter }]
          : category === "중고차"
            ? [{ label: "중고차", onClick: clearMakerFilter }]
            : usedCarChildValues.includes(category)
              ? [{ label: "중고차", onClick: clearCategoryFilter }, { label: category, onClick: clearMakerFilter }]
              : [{ label: category, onClick: clearMakerFilter }]),
        ...(isHeavyCategory && heavySelection.maker ? [{ label: heavySelection.maker, onClick: clearHeavyModel }] : []),
        ...(isHeavyCategory && heavySelection.model ? [{ label: heavySelection.model, onClick: clearHeavySubmodel }] : []),
        ...(isHeavyCategory && heavySelection.submodel ? [{ label: heavySelection.submodel }] : []),
        ...(!isHeavyCategory && maker ? [{ label: maker, onClick: clearModelFilter }] : []),
        ...(!isHeavyCategory && maker && selectedModel ? [{ label: formatModelLabel(selectedModel), onClick: clearGenerationFilter }] : []),
        ...(!isHeavyCategory && maker && selectedModel && selectedGenerationOption ? [{ label: generationDisplayLabel(selectedGenerationOption), onClick: selectedVariants.length ? clearVariantFilter : undefined }] : []),
        // QF-105: 트림까지 고르면 경로에 트림 이름을 이어 붙인다
        ...(!isHeavyCategory && maker && selectedModel && selectedGenerationOption && selectedVariants.length ? [{ label: selectedTrimChipLabel }] : []),
      ];
      const bbmMobileCrumbs = bbmCrumbs;
      // QF-106 모바일 ⑤ 관련 검색어 알약: 누르면 해당 조건 적용
      const applyKeywordPill = (id: string) => {
        if (id === "domestic" || id === "imported") { chooseCategoryFilter(id === "domestic" ? "국산차" : "수입차"); return; }
        if (id === "price-1000") { setBbmFilters(setBbmRange(bbmValue, "price", { min: "", max: "1000" })); return; }
        if (id === "light") { setBbmFilters(setBbmChecks(bbmValue, "carClass", ["경형"])); return; }
        if (id === "suv") { setBbmFilters(setBbmChecks(bbmValue, "bodyType", ["SUV"])); return; }
        if (id === "hybrid") setBbmFilters(setBbmChecks(bbmValue, "fuel", ["가솔린 하이브리드"]));
      };
      if (videoViewerOpen) {
        return <><VideoListingViewer onClose={closeVideoViewer} onNotify={setSearchToast} />{searchToast ? <div class="market-toast vlf-toast" role="status" aria-live="polite">{searchToast}</div> : null}</>;
      }
      if (bbmPartsMode) {
        return <MobileScroll className="app-screen"><BbmPartsGallery value={filters.bbm ?? emptyBbmFilters} onChange={setBbmFilters} cars={listingCars} countWith={countWithBbm} /></MobileScroll>;
      }
      if (desktop && pcLayoutStyle === "bbmuseum") {
        // QF-067: 좌측 필터 제조사·모델·등급 = 퀵필터 제조사·모델·세대·트림과 같은 상태(하나의 원본)
        const bbmGenerationLabel = (generation: QuickGenerationOption) => generation.name
          .replace(/\s+\d{2,4}(?:년)?\s*~\s*(?:\d{2,4}(?:년)?|현재)$/, "")
          .replace(/\s+#\d+$/, "")
          .trim();
        const bbmModelCount = (makerName: string, modelName: string) => {
          const visualCount = isTruckCategory ? undefined : modelVisualsByMakerMap[makerName]?.[modelName]?.count;
          if (visualCount) return Number(visualCount.replace(/[^0-9]/g, ""));
          const key = normalizeModelSearchText(modelName);
          return listingCars.filter((car) => car.maker === makerName && normalizeModelSearchText(`${car.title} ${car.trim} ${car.modelGroup ?? ""}`).includes(key)).length;
        };
        const bbmSelection: BbMakerSelection = {
          maker,
          model: selectedModel,
          modelLabel: selectedModel ? formatModelLabel(selectedModel) : null,
          generation: selectedGeneration,
          generationLabel: selectedGenerationOption ? bbmGenerationLabel(selectedGenerationOption) : null,
          generationYears: selectedGenerationOption?.years ?? null,
          grades: selectedVariants,
          gradeLevels: selectedGradeLevels,
          gradeGroups: selectedGradeGroups,
          modelsFor: (makerName) => (modelsByMakerMap[makerName] ?? []).map((name) => {
            const catalogGenerations = generationsByMakerModelMap[makerName]?.[name] ?? [];
            const catalogCount = catalogGenerations.reduce((sum, generation) => sum + Math.max(1, vehicleCatalog.gradeTreeByGeneration[generation.name]?.reduce((treeSum, fuel) => treeSum + fuel.count, 0) ?? 0), 0);
            return { name, label: formatModelLabel(name), count: charanchaMakerFlow ? catalogCount : bbmModelCount(makerName, name) };
          }),
          gradeGroupsFor: (makerName, modelName) => (generationsByMakerModelMap[makerName]?.[modelName] ?? []).map((generation) => ({
            name: generation.name,
            title: `${generationCardLabel(generation)} · ${generation.cardSub ?? compactGenerationCardYearLabel(generation.years)}`,
            displayName: bbmGenerationLabel(generation),
            years: generation.years,
            grades: generation.variants.map(toTrimOption),
            count: vehicleCatalog.gradeTreeByGeneration[generation.name]?.reduce((sum, fuel) => sum + fuel.count, 0) ?? generation.count,
          })),
          gradeTreeFor: (generationName) => vehicleCatalog.gradeTreeByGeneration[generationName] ?? [],
          onChooseMaker: (makerName) => { if (maker !== makerName) applyMakerFilter(makerName); },
          onChooseModel: (modelName) => { if (selectedModel !== modelName) chooseModel(modelName); },
          onToggleGrade: (generationName, grade) => {
            if (generationName && selectedGeneration !== generationName) chooseGeneration(generationName);
            chooseVariant(grade);
          },
          onToggleGrades: (generationName, gradeTokens, checked) => {
            if (selectedGeneration !== generationName) setSelectedGeneration(generationName);
            setSelectedVariants((current) => {
              const next = checked
                ? [...current, ...gradeTokens.filter((token) => !current.includes(token))]
                : current.filter((token) => !gradeTokens.includes(token));
              replaceVehicleDepthParams(generationName, next);
              return next;
            });
            setTrimApplied(false);
          },
          onToggleGradeLevel: (generationName, id) => {
            if (selectedGeneration !== generationName) setSelectedGeneration(generationName);
            setSelectedGradeLevels((current) => {
              const next = current.includes(id) ? current.filter((value) => value !== id) : [...current, id];
              replaceGradeBranchParams(next, selectedGradeGroups);
              return next;
            });
            setTrimApplied(false);
          },
          onToggleGradeGroup: (generationName, id) => {
            if (selectedGeneration !== generationName) setSelectedGeneration(generationName);
            setSelectedGradeGroups((current) => {
              const next = current.includes(id) ? current.filter((value) => value !== id) : [...current, id];
              replaceGradeBranchParams(selectedGradeLevels, next);
              return next;
            });
            setTrimApplied(false);
          },
          onClearMaker: clearMakerFilter,
          onClearModel: clearModelFilter,
          // 등급 단계 × = 세대 묶음과 등급을 함께 해제
          onClearGrades: clearGenerationFilter,
          onChooseGeneration: isGuaziQuickStyle ? (generationName) => chooseGeneration(generationName) : undefined,
        };
        const drawerFilterChip = isGuaziQuickStyle && hybridNarrow;
        const bbmContentHead = (
                    <section class={`bbm-content-head${showCategoryQuickRail && isGuaziQuickStyle ? " has-category-menu" : ""}`} aria-label="검색 조건">
                      <div class="bbm-content-header">
                      <nav class="bbm-breadcrumb" aria-label="현재 위치"><strong>{categoryIsDefault ? "전체차량" : category}</strong>{vehicleSummaryLabel ? <span>{vehicleSummaryLabel}</span> : null}</nav>
                      <div class="bbm-summary">
                        <strong>{shownCars.length.toLocaleString("ko-KR")}대</strong>
                        <button type="button" class={`bbm-save-search${searchSaved ? " is-saved" : ""}`} aria-pressed={searchSaved} onClick={toggleSearchSaved}><img src={bbmIcon("search-save")} alt="" aria-hidden="true" />검색저장</button>
                      </div>
                      <div class="bbm-chips">
                        <button type="button" class={`bbm-filter-button${bbmAppliedCount ? " is-applied" : ""}`} aria-disabled={drawerFilterChip ? undefined : "true"} aria-haspopup={drawerFilterChip ? "dialog" : undefined} onClick={drawerFilterChip ? () => setBbmDrawerOpen(true) : undefined} aria-label={bbmAppliedCount ? `필터 ${bbmAppliedCount}개 적용됨` : "필터"}><img src={bbmIcon(bbmFilterIconName)} alt="" aria-hidden="true" />{bbmAppliedCount ? <b>{bbmAppliedCount}</b> : <span>필터</span>}</button>
                        {bbmChips.map((chip) => <FilterChip key={chip.key} bbm label={chip.label} active={chip.active} className={chip.className} prefix={chip.prefix} onClick={chip.onClick} onClear={chip.onClear} />)}
                      </div>
                      </div>
                      <div class="bbm-quick-slot">{quickRail}</div>
                      {seoulAutoGalleryDealerRail}
                    </section>
        );
        // QF-095: 과쯔 PC 상단 카드 — 초톳 PC 상단과 같은 구조(1줄 경로 · 2줄 제목 + 검색저장 · 3줄 칩 줄 + 필터 초기화 · 4줄 유형 줄/퀵필터 레일)
        const lnbVariant = bbLnbVariant();
        /* 헤이딜러·하틀라투이식 균형 배치(2026-10-18 기본): 좌측 필터와 우측 검색조건 카드가 같은 윗선에서 시작한다. */
        // 트럭 compact와 국산차·수입차 기본 화면은 검색조건 카드를 두 열 위의 1200px 전체 폭에 둔다.
        // 선택지가 긴 퀵필터가 오른쪽 880px 칸에서 답답해지지 않고,
        // 그 아래부터 좌측 상세 필터와 매물 목록이 같은 윗선에서 시작한다.
        // 2026-10-21 「서울오토갤러리 PC: 차량 카테고리 줄(전체차량 · 중고차 …) 제거, 필터·브랜드 로고 박스를 좌측 필터 위로 올려 와이드하게」:
        // 서울오토갤러리도 국산차와 같은 전체 폭 검색조건 카드(제목 줄 없음 · 1200px · 아래에 좌측 필터 + 매물)를 쓴다. 딜러 레일은 카드 안에 있어 함께 올라간다.
        const fullTopQuickCard = isGuaziQuickStyle && usesReferencePcLayout && (
          isTruckCategory && pcFilterLayout === "compact"
          || (category === "국산차" || category === "수입차" || category === "서울오토갤러리") && pcFilterLayout === "balanced"
        );
        const topCardChips = bbmChips;
        const balancedTopCard = isGuaziQuickStyle && usesReferencePcLayout && !fullTopQuickCard && (isHeavyCategory || pcFilterLayout === "balanced");
        // 전체 폭 퀵필터 자체가 카테고리 문맥을 충분히 제공하므로
        // 제목 배너를 중복 노출하지 않고 GNB 다음에 바로 검색 조건을 배치한다.
        const bbmCategoryBanner = lnbVariant === "default" && !fullTopQuickCard && (!isBikeCategory || isStandaloneBikeSite) ? (
              <div class="bbm-ct-banner">{/* 포쉬마크식 카테고리 헤더 배너(2026-10-18) */}
                <h1 class="bbm-ct-banner-title bbm-summary" data-count={shownCars.length}>{pageCategoryTitle}</h1>
                <button type="button" class={`bbm-save-search bbm-ct-save${searchSaved ? " is-saved" : ""}`} aria-pressed={searchSaved} onClick={toggleSearchSaved}><img src={bbmIcon("search-save")} alt="" aria-hidden="true" />검색저장</button>
              </div>
            ) : null;
        const bbmTopCard = (
          <section class={`bbm-content-head is-chotot${showCategoryQuickRail ? " has-category-menu" : ""}`} aria-label="검색 조건">
            {lnbVariant === "c"
              ? <BbBreadcrumb category={category} categoryDetail={category === "트럭 · 특장" ? selectedTruckFormat : bbmCategoryChild} onChooseCategory={chooseHierarchyCategory} />
              : null}
            {fullTopQuickCard ? null : lnbVariant === "default" && !showDefaultCategoryLnb ? null : <div class="bbm-ct-title-row">
              {/* QF-106: 제목은 상단 메뉴 카테고리 이름으로 고정(대수·날짜·칩 조건 없음). 탭 제목은 그대로 */}
              {lnbVariant === "f" || (lnbVariant === "default" && showDefaultCategoryLnb)
                ? <BbLnbTitleTabs category={category} categoryDetail={category === "트럭 · 특장" ? selectedTruckFormat : bbmCategoryChild} onChooseCategory={chooseHierarchyCategory} />
                : lnbVariant === "c"
                ? <BbLnbTitleMenu title={stablePageTitle(category)} category={category} categoryDetail={category === "트럭 · 특장" ? selectedTruckFormat : bbmCategoryChild} onChooseCategory={chooseHierarchyCategory} />
                : <h1 class="bbm-ct-title bbm-summary" data-count={shownCars.length}>{pageCategoryTitle}</h1>}
              {lnbVariant === "default" ? null : <button type="button" class={`bbm-save-search bbm-ct-save${searchSaved ? " is-saved" : ""}`} aria-pressed={searchSaved} onClick={toggleSearchSaved}><img src={bbmIcon("search-save")} alt="" aria-hidden="true" />검색저장</button>}
            </div>}
            {lnbVariant !== "default" ? <p class="bbm-ct-desc">{bbmCategoryDescription(category)}</p> : null}
            {lnbVariant === "e" ? <BbSecondaryNav category={category} categoryDetail={category === "트럭 · 특장" ? selectedTruckFormat : bbmCategoryChild} onChooseCategory={chooseHierarchyCategory} /> : null}
            <div class="bbm-ct-chip-row">
              <div class="bbm-chips">
                <button type="button" class={`bbm-filter-button${bbmAppliedCount ? " is-applied" : ""}${fullTopQuickCard ? " is-reference-active" : ""}`} aria-disabled={drawerFilterChip ? undefined : "true"} aria-haspopup={drawerFilterChip ? "dialog" : undefined} onClick={drawerFilterChip ? () => setBbmDrawerOpen(true) : undefined} aria-label={bbmAppliedCount ? `필터 ${bbmAppliedCount}개 적용됨` : "필터"}><img src={bbmIcon(bbmFilterIconName)} alt="" aria-hidden="true" />{/* QF-113 T2: "필터" 글자는 늘 두고 조건 수를 덧붙임(폭 고정, qf-align.css) */}<span>필터</span>{bbmAppliedCount ? <b>{bbmAppliedCount}</b> : null}</button>
                <BbmChipScroller>
                  {topCardChips.map((chip) => <FilterChip key={chip.key} bbm label={chip.label} active={chip.active} className={chip.className} prefix={chip.prefix} onClick={chip.onClick} onClear={chip.onClear} />)}
                </BbmChipScroller>
              </div>
              {fullTopQuickCard
                ? <button type="button" class="bbm-ct-reset bbm-ct-clear-all" onClick={() => resetFilters()}>필터 초기화</button>
                : bbmAppliedCount
                  ? <button type="button" class="bbm-ct-reset" onClick={() => setBbmTopReset((value) => value + 1)}>필터 초기화</button>
                  : null}
            </div>
            {/* PC 지역 선택은 전체 필터에서 제공한다. 상단에는 지역 나열 칩을 렌더하지 않는다. */}
            <div class="bbm-quick-slot">{quickRail}</div>
            {/* 2026-10-21 「딜러 박스는 기존처럼 리스트 바로 위(좌측 필터 오른쪽)」: 전체 폭 카드일 때는 목록 열에서 그린다 */}
            {fullTopQuickCard ? null : seoulAutoGalleryDealerRail}
          </section>
        );
        // 개발 시안 PC 보기 방식(테스트 서버 dev.bbmuseum 실측 10/9): 목록형 · 갤러리형(4열) · 한줄 광고(표). 피드·텍스트는 PC 메뉴에 없어 목록으로 보여준다
        const bbmPcView = isGuaziQuickStyle && (bbmMobileView === "갤러리로 보기" || bbmMobileView === "한줄 광고로 보기") ? bbmMobileView : "목록으로 보기";
        const bbmPcViewLabel = bbmPcView === "갤러리로 보기" ? "갤러리형" : bbmPcView === "한줄 광고로 보기" ? "한줄 광고로 보기" : "목록형";
        const bbmItems = shownCars.length && bbmPcView === "한줄 광고로 보기"
          ? <BbmTextViewTable cars={pagedCars} likedIds={likedIds} onOpen={openCarDetail} onToggleLike={(car) => toggleLiked(car.id)} />
          : shownCars.length ? pagedCars.map((car) => pcGridView
          ? <CarCard key={car.id} car={car} cardView={false} liked={likedIds.includes(car.id)} onOpen={() => openCarDetail(car)} onToggleLike={() => toggleLiked(car.id)} />
          : <BbmResultCard key={car.id} car={car} variant="pc" liked={likedIds.includes(car.id)} onOpen={() => openCarDetail(car)} onToggleLike={() => toggleLiked(car.id)} onChat={() => setSearchToast("채팅은 정식 서비스에서 이용해 주세요.")} />) : carListItems;
        return (
          <>
            <MobileScroll className="app-screen">
              <main class={`marketplace is-bbm${isStandaloneBikeSite ? " is-bike-site" : ""}${isStandaloneTruckSite ? " is-truck-site" : ""}${isGuaziQuickStyle ? " is-hybrid" : ""}${balancedTopCard ? " is-balanced-layout" : ""}${fullTopQuickCard ? " is-full-top-filter" : ""}${isGuaziQuickStyle && usesReferencePcLayout && pcFilterLayout === "right" ? " is-list-first-layout" : ""}${isGuaziQuickStyle && usesReferencePcLayout && pcFilterLayout === "compact" && !balancedTopCard && !fullTopQuickCard ? " is-compact-top-filter" : ""}${isGuaziQuickStyle && usesReferencePcLayout && pcFilterLayout === "bare" ? " is-no-top-filter" : ""}${isGuaziQuickStyle && isUsedCarCategory && pcFilterLayout === "modern" ? " is-modern-filter-layout" : ""}${isGuaziQuickStyle && isUsedCarCategory && pcFilterLayout === "charancha" ? " is-charancha-filter-layout" : ""}${plainQuickCards ? " is-qf-plain" : ""}${guaziCardChipPreview ? " is-qf-guazi-card-chip" : ""}${isGuaziQuickStyle ? " is-qf-guazi" : ""}${isTruckCategory ? " is-truck-category" : ""}${isBikeCategory ? " is-bike-category" : ""}${isHeavyCategory ? " is-heavy-category" : ""}${category === "수입차" && !maker ? " is-imported-car-category" : ""}${maker === "페라리" ? ` is-ferrari-category${ferrariBannerFull ? " is-ferrari-banner-full" : ""}` : ""}${category === "올드카" ? " is-oldcar-category" : ""}${allVehiclesWide ? " is-all-vehicles-wide" : ""}`} aria-label={isStandaloneBikeSite ? "바이크 매물 리스트" : isStandaloneTruckSite ? "트럭 매물 리스트" : "중고차 리스트"}>
                <BbHeader category={category} onChooseCategory={chooseHierarchyCategory} onNotify={setSearchToast} onOpenFavorites={() => flow.push(savedListingsScreen)} searchSlot={<BbmCatalogHeaderSearch query={query} setQuery={setQuery} searchPlaceholder={categorySearchPlaceholder} catalogRecords={supportsVehicleCatalog ? vehicleCatalog.records : undefined} onCatalogFocus={supportsVehicleCatalog ? () => { void vehicleCatalog.ensureSearch(); } : undefined} onCatalogChoose={supportsVehicleCatalog ? chooseCatalogRecord : undefined} category={category} onChooseCategory={(value) => chooseHierarchyCategory(value)} />} />
                {/* QF-093: 과쯔는 상단 패널(전체차량 · N대 · 검색저장 · 칩 줄 · 유형 줄/퀵필터 레일)을 본문 폭 전체로 */}
                {/* 중고차·트럭은 텍스트 GNB 바로 아래 사각형 LNB를 유지하고, 필터 카드에는 경로·중복 카테고리 칩을 두지 않는다. */}
                {isGuaziQuickStyle ? <div class="bbm-hybrid-top">{lnbVariant === "a" || lnbVariant === "b" || lnbVariant === "d" ? <BbSecondaryNav category={category} categoryDetail={category === "트럭 · 특장" ? selectedTruckFormat : bbmCategoryChild} onChooseCategory={chooseHierarchyCategory} /> : null}{bbmCategoryBanner}{lnbVariant === "default" && pcFilterLayout === "bare" && isUsedCarCategory && showDefaultCategoryLnb ? <div class="bbm-bare-lnb"><BbLnbTitleTabs category={category} categoryDetail={category === "트럭 · 특장" ? selectedTruckFormat : bbmCategoryChild} onChooseCategory={chooseHierarchyCategory} /></div> : null}{categoryComplexHeader}{balancedTopCard && !allVehiclesWide ? null : bbmTopCard}</div> : null}
                <div class="bbm-page">
                  {allVehiclesWide ? null : <BbFilterSidebar collapsible leadingFilters={isHeavyCategory ? <HeavySidebarFilters value={heavySelection} onChange={applyHeavySelection} /> : undefined} mileageFinal={isGuaziQuickStyle} priceFinal={isGuaziQuickStyle} order={isHeavyCategory ? ["가격", "연식", "연료", "지역", "판매자 유형", "판매방식"] : isGuaziQuickStyle ? isTruckCategory ? truckFilterOrder : category === "바이크" ? bikeFilterOrder : isPartsCategory ? partsFilterOrder : bbmFilterOrder : undefined} pricePresets={isPartsCategory ? partsPricePresets : undefined} makerSections={bbmSidebarMakerSections} selection={bbmSelection} historyCount={shownHistory} countOf={bbmCountOf} appliedCount={bbmAppliedCount} onReset={() => resetFilters()} onNotify={setSearchToast} bbm={filters.bbm ?? emptyBbmFilters} onBbmChange={setBbmFilters} countWithBbm={countWithBbm} resetSignal={bbmTopReset} brandLogos={isGuaziQuickStyle && !isTruckCategory} brandLogoCategory={category} truckFilter={truckSidebarFilter} referenceMakerFlow={charanchaMakerFlow || isHeavyCategory} makerOpenByDefault={isUsedCarCategory || isBikeCategory || isTruckCategory} singleOpen={pcFilterLayout === "charancha" && !isTruckCategory} showMakerCounts allowEmptyMakerOptions={charanchaMakerFlow} makerLabel={isBikeCategory ? "브랜드 · 모델" : charanchaMakerFlow ? "제조사 · 모델 · 등급" : undefined} />}
                  <div class="bbm-content">
                    {isGuaziQuickStyle ? balancedTopCard && !allVehiclesWide ? bbmTopCard : null : bbmContentHead}
                    {fullTopQuickCard && seoulAutoGalleryDealerRail ? <div class="bbm-dealer-rail-box">{seoulAutoGalleryDealerRail}</div> : null}
                    <section class="bbm-results" aria-label="매물 목록">
                      {luxuryUiTestMode ? <><p class="bbm-ui-test-notice">UI 테스트용 가상 매물 · 실제 판매 가격·조건이 아닙니다</p><BbmHeadlinePreviewLinks /></> : null}
                      <nav class="bbm-toolbar" aria-label="매물 유형과 정렬">
                        <div class="bbm-seller-tabs" role="tablist" aria-label="판매자 유형">
                          {(["전체", "개인", "딜러"] as SellerType[]).map((tab) => <button key={tab} type="button" role="tab" aria-selected={sellerType === tab} class={sellerType === tab ? "is-selected" : ""} onClick={() => setFilters((current) => ({ ...current, seller: tab }))}>{sellerTabLabel(tab)}</button>)}
                          <button type="button" role="tab" aria-selected={false} onClick={() => setSearchToast(`${isBikeCategory ? "브랜드 인증" : "브랜드"} 매물은 정식 서비스에서 이용해 주세요.`)}>{isBikeCategory ? "브랜드인증" : "브랜드"}</button>
                        </div>
                        <div class="bbm-toolbar-actions">
                          <label class="bbm-video-filter"><span>숏폼카</span><BbSwitch checked={videoViewerOpen} label="숏폼카" onChange={openVideoViewer} /></label>
                          <span class="bbm-toolbar-divider" aria-hidden="true" />
                          {isGuaziQuickStyle ? (
                            <>
                              {/* QF-092: 원본 정렬 드롭다운 10개 · 보기 방식 드롭다운 4개(예전 바텀시트 제거) */}
                              <BbmToolbarMenu open={bbmMenu === "sort"} onClose={() => setBbmMenu(null)} options={bbmSortOptions} selected={bbmSort} onSelect={chooseBbmSort}>
                                <button type="button" class="bbm-sort" aria-haspopup="true" aria-expanded={bbmMenu === "sort"} onClick={() => setBbmMenu((open) => open === "sort" ? null : "sort")}>{bbmSort}<img src={bbmIcon("toolbar-sort-chevron")} alt="" aria-hidden="true" /></button>
                              </BbmToolbarMenu>
                              <span class="bbm-toolbar-divider" aria-hidden="true" />
                              <BbmToolbarMenu open={bbmMenu === "view"} onClose={() => setBbmMenu(null)} options={bbmViewOptionsPc} selected={bbmPcView} onSelect={chooseBbmView}>
                                <button type="button" class="bbm-view" aria-label="보기 방식 선택" aria-haspopup="true" aria-expanded={bbmMenu === "view"} onClick={() => setBbmMenu((open) => open === "view" ? null : "view")}>{bbmPcViewLabel}<img src={bbmIcon(bbmPcView === "갤러리로 보기" ? "view-grid-chotot-v02" : "view-list-chotot-v02")} alt="" aria-hidden="true" /></button>
                              </BbmToolbarMenu>
                            </>
                          ) : (
                            <>
                              <button type="button" class="bbm-sort" onClick={() => setSheet("sort")}>{sort === "최신순" ? "업데이트순" : sort}<img src={bbmIcon("toolbar-sort-chevron")} alt="" aria-hidden="true" /></button>
                              <span class="bbm-toolbar-divider" aria-hidden="true" />
                              <button type="button" class="bbm-view" aria-pressed={pcGridView} onClick={() => setPcGridView((value) => !value)}>{pcGridView ? "앨범형" : "목록형"}<img src={bbmIcon("view-list-chotot-v02")} alt="" aria-hidden="true" /></button>
                            </>
                          )}
                        </div>
                      </nav>
                      <div class={`car-list ${pcGridView ? "is-pc-grid" : "bbm-list"}${bbmPcView === "갤러리로 보기" ? " is-gallery" : bbmPcView === "한줄 광고로 보기" ? " is-text-view" : ""}`} aria-live="polite">{bbmItems}</div>
                      {isGuaziQuickStyle && shownCars.length ? <BbmPagination page={bbmPageNow} total={bbmPageCount} windowSize={10} onChange={goBbmPage} /> : null}
                    </section>
                  </div>
                  {allVehiclesWide ? renderAllVehiclesRail() : null}
                </div>
                {isGuaziQuickStyle ? <BbmFooter onNotify={setSearchToast} /> : null}
              </main>
            </MobileScroll>
            {searchToast ? <div class="market-toast" role="status" aria-live="polite">{searchToast}</div> : null}
            {renderBbmChipPanel(true)}
            {truckSidebarFilter ? <TruckTypePicker desktop open={truckTypePickerOpen} onClose={() => setTruckTypePickerOpen(false)} value={truckSidebarFilter} /> : null}
            {drawerFilterChip && bbmDrawerOpen ? (
              <BbmFilterDrawer count={visibleCars.length} onClose={() => setBbmDrawerOpen(false)} onReset={() => setBbmDrawerReset((value) => value + 1)}>
                <BbFilterSidebar leadingFilters={isHeavyCategory ? <HeavySidebarFilters value={heavySelection} onChange={applyHeavySelection} /> : undefined} mileageFinal={isGuaziQuickStyle} priceFinal={isGuaziQuickStyle} order={isHeavyCategory ? ["가격", "연식", "연료", "지역", "판매자 유형", "판매방식"] : isGuaziQuickStyle ? isTruckCategory ? truckFilterOrder : category === "바이크" ? bikeFilterOrder : isPartsCategory ? partsFilterOrder : bbmFilterOrder : undefined} pricePresets={isPartsCategory ? partsPricePresets : undefined} makerSections={bbmSidebarMakerSections} selection={bbmSelection} historyCount={shownHistory} countOf={bbmCountOf} appliedCount={bbmAppliedCount} onReset={() => resetFilters()} onNotify={setSearchToast} bbm={filters.bbm ?? emptyBbmFilters} onBbmChange={setBbmFilters} countWithBbm={countWithBbm} resetSignal={bbmDrawerReset} brandLogos={isGuaziQuickStyle && !isTruckCategory} brandLogoCategory={category} truckFilter={truckSidebarFilter} referenceMakerFlow={charanchaMakerFlow || isHeavyCategory} makerOpenByDefault={isUsedCarCategory || isBikeCategory || isTruckCategory} showMakerCounts allowEmptyMakerOptions={charanchaMakerFlow} makerLabel={isBikeCategory ? "브랜드 · 모델" : charanchaMakerFlow ? "제조사 · 모델 · 등급" : undefined} />
              </BbmFilterDrawer>
            ) : null}
            {marketSheet}
          </>
        );
      }
  
      if (desktop) {
        return (
          <>
            <MobileScroll className="app-screen">
              <main class="marketplace is-pc" aria-label="중고차 리스트">
                <PcHeader query={query} setQuery={setQuery} searchPlaceholder={categorySearchPlaceholder} regionLabel={regionLabel} onOpenRegion={openRegionSheet} onOpenFavorites={() => flow.push(savedListingsScreen)} onNotify={setSearchToast} catalogRecords={supportsVehicleCatalog ? vehicleCatalog.records : undefined} onCatalogFocus={supportsVehicleCatalog ? () => { void vehicleCatalog.ensureSearch(); } : undefined} onCatalogChoose={supportsVehicleCatalog ? chooseCatalogRecord : undefined} />
                <div class="pc-page">
                  <section class="pc-filter-panel" aria-label="검색 조건">
                    <nav class="pc-breadcrumb" aria-label="현재 위치"><span>보배드림 중고차</span><span>중고차</span><span>{regionLabel}</span><strong>{pcCurrentSelection}</strong></nav>
                    <div class="pc-filter-title">
                      <h1>{visibleCars.length.toLocaleString("ko-KR")}대 중고차 · {regionLabel} · {pcTitleMonth}</h1>
                      <button type="button" class={`pc-save-search${searchSaved ? " is-saved" : ""}`} aria-pressed={searchSaved} onClick={toggleSearchSaved}>{searchSaved ? <BookmarkFilledIcon /> : <BookmarkIcon />}검색 저장</button>
                    </div>
                    <div class="pc-filter-row" ref={(el: any) => { pcFilterRowRef.current = el; }}>
                      {filterShell}
                      {pcFilterCanScroll ? <button type="button" class="pc-filter-next" aria-label="필터 더 보기" onClick={() => pcFilterRowRef.current?.querySelector<HTMLElement>(".filter-rail")?.scrollBy({ left: 240, behavior: "smooth" })}><ChevronRightIcon /></button> : null}
                      <button type="button" class="pc-filter-reset" onClick={() => resetFilters()}>초기화</button>
                    </div>
                    <div class="pc-quick-slot">{quickRail}</div>
                    {seoulAutoGalleryDealerRail}
                  </section>
                  <div class="pc-columns">
                    <section class="pc-list-panel" aria-label="매물 목록">
                      <nav class="pc-list-head" aria-label="매물 유형과 정렬">
                        <div class="pc-seller-tabs" role="tablist" aria-label="판매자 유형">
                          {(["전체", "개인", "딜러"] as SellerType[]).map((tab) => <button key={tab} type="button" role="tab" aria-selected={sellerType === tab} class={sellerType === tab ? "is-selected" : ""} onClick={() => setFilters((current) => ({ ...current, seller: tab }))}>{sellerTabLabel(tab)}</button>)}
                        </div>
                        <div class="pc-list-controls">
                          <label class="pc-video-toggle"><span>숏폼매물</span><button type="button" role="switch" aria-checked={videoViewerOpen} class={videoViewerOpen ? "is-on" : ""} onClick={openVideoViewer}><span /></button></label>
                          <span class="pc-list-divider" aria-hidden="true" />
                          <button type="button" class="pc-sort-button" onClick={() => setSheet("sort")}>{sort}<ChevronDownIcon /></button>
                          <span class="pc-list-divider" aria-hidden="true" />
                          <button type="button" class="pc-view-toggle" aria-pressed={pcGridView} onClick={() => setPcGridView((value) => !value)}>{pcGridView ? <RowsIcon /> : <DashboardIcon />}{pcGridView ? "목록 보기" : "그리드 보기"}</button>
                        </div>
                      </nav>
                      <section class={`car-list ${pcGridView ? "is-pc-grid" : "is-pc-rows"}`} aria-live="polite">{carListItems}</section>
                    </section>
                    <aside class="pc-sidebar" aria-label="추천 검색">
                      <section class="pc-sidebar-card is-site-select" aria-label="퀵필터 사례">{quickStyleSelect}</section>
                      <PcSidebarCard title="가격대별 중고차" items={pcPriceLinks.map((link) => link.label)} activeLabel={pcActivePriceLink} onChoose={(label) => {
                        const link = pcPriceLinks.find((item) => item.label === label);
                        if (!link) return;
                        const nextPrice = label === pcActivePriceLink ? emptyPrice : { ...price, min: link.min, max: link.max };
                        setFilters((current) => ({ ...current, price: nextPrice }));
                        setDraftFilters((current) => ({ ...current, price: nextPrice }));
                      }} />
                      <PcSidebarCard title="차체 유형별 중고차" items={pcBodyLinks} activeLabel={filters.body === "전체" ? undefined : filters.body} onChoose={(label) => {
                        const nextBody = filters.body === label ? "전체" : label;
                        setFilters((current) => ({ ...current, body: nextBody }));
                        setDraftFilters((current) => ({ ...current, body: nextBody }));
                      }} />
                    </aside>
                  </div>
                </div>
              </main>
            </MobileScroll>
            {searchToast ? <div class="market-toast" role="status" aria-live="polite">{searchToast}</div> : null}
            {marketSheet}
          </>
        );
      }
  
      // QF-091: 과쯔(개발 시안형) 모바일 = 개발 시안 원본과 같은 화면(헤더·지역·칩·유형 줄·영상/정렬·목록 탭·카드·하단 탭바). 퀵필터 레일 자체는 그대로
      if (isGuaziQuickStyle) {
        const openBbmFull = () => { setBbmFullDraft(bbmValue); setBbmFullAvailableOnly(bbmAvailableOnly); setBbmFullItem(null); setBbmFullMoreOpen(false); setBbmFullOpen(true); };
        const fullValue = bbmFullDraft ?? bbmValue;
        const closeFull = () => { setBbmFullOpen(false); setBbmFullMoreOpen(false); setBbmFullItem(null); setBbmFullDraft(null); setBbmMakerDraft(null); };
        const applyFull = () => { setBbmFilters(fullValue); setBbmAvailableOnly(bbmFullAvailableOnly); closeFull(); };
        const openFullItem = (item: BbmFilterItem | "카테고리" | "제조사 · 모델") => { setBbmFullItem(item); };
        const sheetValue = fullValue;
        const setSheetValue = (next: BbmFilterValues) => setBbmFullDraft(next);
        const closeFullItem = () => { setBbmFullItem(null); setBbmMakerDraft(null); };
        const previewBrandSections = krTopTenSections("all", category);
        const previewBrandItems = [...previewBrandSections.domestic, ...previewBrandSections.imported].map((item) => ({ label: krRailLabel(item.label), key: item.key, logoName: item.label }));
        const fullItems = category === "바이크"
          ? [null, ...bikeFilterOrder.filter((label) => label !== "제조사 · 모델").map((label) => bbmSidebarItems.find((item) => item.label === label)).filter((item): item is BbmFilterItem => Boolean(item))]
          : isTruckCategory
            ? [null, ...truckFilterOrder.filter((label) => label !== "제조사 · 모델").map((label) => bbmSidebarItems.find((item) => item.label === label)).filter((item): item is BbmFilterItem => Boolean(item))]
            : isPartsCategory
              ? [null, ...partsFilterOrder.filter((label) => label !== "제조사 · 모델").map((label) => bbmSidebarItems.find((item) => item.label === label)).filter((item): item is BbmFilterItem => Boolean(item))]
            : [bbmSidebarItems[0], bbmSidebarItems[1], null, ...bbmSidebarItems.filter((item) => !item.scope).slice(2)];
        const fullItemMap = new Map(fullItems.map((item) => [item?.label ?? BBM_MAKER_ITEM, item]));
        const { primary: primaryFullOrder, secondary: secondaryFullOrder } = splitDaangnFilterOrder([...fullItemMap.keys()]);
        const truckFormatPath = [selectedTruckFormat, selectedTruckSubtype ? truckSubtypeLabel(selectedTruckSubtype) : null, selectedTruckSpec].filter(Boolean).join(" › ");
        const renderFullFilterItem = (label: string) => {
          const item = fullItemMap.get(label);
          if (item) return <BbmFullItem key={item.label} label={isTruckCategory && item.label === "차량번호 / 판매자" ? "차량번호/판매자 이름" : daangnFilterLabel(item.label)} icon={item.label === "전기차 주행 가능 거리" ? bbmIcon("filter-ev-range") : undefined} value={isGuaziQuickStyle && item.label === "주행거리" ? mileageSummary(fullValue.ranges.mileage) : bbmItemValue(item.label, fullValue)} onClear={() => setSheetValue(clearBbmItem(item, fullValue))} onOpen={() => openFullItem(item)} />;
          return <div key="maker" class="bbmf-full-maker">
            <BbmFullItem label={isBikeCategory ? "인기 브랜드" : "브랜드"} value={maker ? vehicleSummaryLabel : ""} onClear={clearMakerFilter} onOpen={() => {
              if (autohomeLogoPreview && !isTruckCategory) { setBbmMakerDraft(maker); openFullItem("제조사 · 모델"); return; }
              setBbmFullOpen(false); setSheet("vehicle");
            }} />
          </div>;
        };
        const luxuryHead = isLuxuryCategory && plainQuickCards ? luxuryHeadVariant() : null;
        const bbmMobileHeader = <Header bbm siteTitle={isStandaloneBikeSite ? "보배드림 바이크" : isStandaloneTruckSite ? "보배드림 트럭" : undefined} query={query} setQuery={setQuery} searchPlaceholder={categorySearchPlaceholder} searchSaved={searchSaved} onToggleSearchSaved={toggleSearchSaved} onOpenFavorites={() => flow.push(savedListingsScreen)} catalogRecords={supportsVehicleCatalog ? vehicleCatalog.records : undefined} onCatalogFocus={supportsVehicleCatalog ? () => { void vehicleCatalog.ensureSearch(); } : undefined} onCatalogChoose={supportsVehicleCatalog ? chooseCatalogRecord : undefined} />;
        return (
          <>
            <MobileScroll className="app-screen">
              <main class={`marketplace is-bbm-m${plainQuickCards ? " is-qf-plain" : ""}${guaziCardChipPreview ? " is-qf-guazi-card-chip" : ""}${isGuaziQuickStyle ? " is-qf-guazi" : ""}${isTruckCategory ? " is-truck-category" : ""}${isBikeCategory ? " is-bike-category" : ""}${isHeavyCategory ? " is-heavy-category" : ""}${category === "올드카" ? " is-oldcar-category" : ""}${isSeoulAutoGalleryLanding || isDeutschLanding ? " is-seoul-auto-gallery" : ""}`} aria-label="중고차 리스트">
                {luxuryHead ? <>
                  <LuxuryThemeHero variant={luxuryHead} header={bbmMobileHeader} listingCount={luxuryCategoryCars.length} dealerCount={new Set(luxuryCategoryCars.map((car) => car.dealer)).size} onNotify={setSearchToast} />
                  <div class="lux-hero-sheet"><div class="bbm-m-quick-slot">{quickRail}</div></div>
                </> : bbmMobileHeader}
                {luxuryHead ? null : categoryComplexHeader}
                {luxuryHead ? null : isSeoulAutoGalleryLanding ? <SeoulAutoGalleryTabs value={seoulAutoGallerySection} onChange={chooseSeoulAutoGallerySection} /> : isDeutschLanding ? <DeutschAutoworldTabs value={seoulAutoGallerySection} onChange={chooseSeoulAutoGallerySection} /> : <section class="region-bar is-bbm" aria-label="지역 선택">
                  <button type="button" aria-label={`현재 지역 ${isGuaziQuickStyle ? stableRegionLabel(bbmValue) : regionLabel}, 지역 선택 열기`} onClick={isGuaziQuickStyle ? () => setStableRegionOpen(true) : openRegionSheet}><span class="region-text">{isGuaziQuickStyle ? <img class="region-location-icon" src={bbmIcon("header-location-chotot-v01")} alt="" aria-hidden="true" /> : <span class="region-label">지역:</span>}<strong>{isGuaziQuickStyle ? stableRegionLabel(bbmValue) : regionLabel}</strong></span><span class="region-chevron-icon" aria-hidden="true"><img src={bbmIcon("triangle-down-chotot")} alt="" /></span></button>
                  <button type="button" class="reset-button" onClick={() => resetFilters()}>초기화</button>
                </section>}
                {showSeoulAutoGalleryVehicles ? <section class={`filter-shell quick-style-guazi is-bbm${bbmRailScrolled ? " is-scrolled" : ""}`} aria-label="중고차 필터" data-history={shownHistory}>
                  <button class={`filter-fixed${bbmAppliedCount ? " is-applied" : ""}`} type="button" aria-label={bbmAppliedCount ? `필터 ${bbmAppliedCount}개 적용됨` : "필터"} onClick={openBbmFull}><img class="ui-icon" src={bbmIcon(bbmFilterIconName)} alt="" aria-hidden="true" />{isGuaziQuickStyle ? <><span>필터</span>{bbmAppliedCount ? <b class="filter-fixed-count">{bbmAppliedCount}</b> : null}</> : bbmAppliedCount ? <b class="filter-fixed-count">{bbmAppliedCount}</b> : <span>필터</span>}</button>
                  <Carousel ariaLabel="중고차 조건" className="filter-rail" contentClassName="filter-track">
                    {mobileBbmChips.map((chip) => <FilterChip key={chip.key} bbm label={chip.label} active={chip.active} className={chip.className} prefix={chip.prefix} onClick={() => { revealBbmChip(chip.label); chip.onClick(); }} onClear={chip.onClear} />)}
                  </Carousel>
                </section> : null}
                {/* QF-106 ④ 퀵필터 자리. 과쯔 원본은 바로 숏폼매물 줄로 이어지고 별도 경로·제목·추천어가 없다. */}
                {luxuryHead || !showSeoulAutoGalleryVehicles ? null : <div class="bbm-m-quick-slot">{quickRail}</div>}
                {isSeoulAutoGalleryLanding && seoulAutoGallerySection === "companies" ? <SeoulAutoGalleryCompanyDirectory /> : null}
                {isSeoulAutoGalleryLanding && seoulAutoGallerySection === "dealers" ? <div class="sag-tab-panel"><SeoulAutoGalleryDealerRail all onOpenDealer={openDealerProfile} /></div> : null}
                {isSeoulAutoGalleryLanding && seoulAutoGallerySection === "about" ? <SeoulAutoGalleryAbout onBrowse={() => chooseSeoulAutoGallerySection("vehicles")} /> : null}
                {isDeutschLanding && seoulAutoGallerySection === "companies" ? <DeutschAutoworldCompanyDirectory /> : null}
                {isDeutschLanding && seoulAutoGallerySection === "dealers" ? <div class="sag-tab-panel"><DeutschAutoworldDealerDirectory /></div> : null}
                {isDeutschLanding && seoulAutoGallerySection === "about" ? <DeutschAutoworldAbout onBrowse={() => chooseSeoulAutoGallerySection("vehicles")} /> : null}
                {luxuryUiTestMode ? <><p class="bbm-ui-test-notice">UI 테스트용 가상 매물 · 실제 판매 가격·조건이 아닙니다</p><BbmHeadlinePreviewLinks /></> : null}
                {!isGuaziQuickStyle ? (
                  <section class="bbm-m-head" aria-label="목록 머리">
                    <BbmTopCrumbs items={bbmMobileCrumbs} />
                    <h1 class="bbm-m-title" data-count={shownCars.length}>{stablePageTitle(category)}</h1>
                    <div class="bbm-m-keywords" role="list">
                      {stableKeywordPills.map((pill) => <button key={pill.label} type="button" role="listitem" class="bbm-m-keyword" onClick={() => applyKeywordPill(pill.id)}>{pill.label}</button>)}
                    </div>
                  </section>
                ) : null}
                {showSeoulAutoGalleryVehicles ? <><BbmMobileOptions
                  videoOnly={videoViewerOpen}
                  onToggleVideo={openVideoViewer}
                  sortLabel={bbmSort}
                  onSort={() => setBbmMenu("m-sort")}
                  sellerTabs={isSeoulAutoGalleryLanding ? (["국산차", "수입차", "슈퍼카", "럭셔리카", "클래식카"] as const) : isBikeCategory ? (["개인", "바이크샵"] as const) : (["개인", "딜러"] as const)}
                  sellerValue={isSeoulAutoGalleryLanding ? "" : isBikeCategory && sellerType === "딜러" ? "바이크샵" : sellerType}
                  onSellerChange={(tab) => {
                    if (isSeoulAutoGalleryLanding) {
                      chooseVehicleCategory(tab === "클래식카" ? "올드카" : tab);
                      return;
                    }
                    const sellerTab = (tab === "바이크샵" ? "딜러" : tab) as "개인" | "딜러";
                    setFilters((current) => ({ ...current, seller: current.seller === sellerTab ? "전체" : sellerTab }));
                  }}
                  groupLabel={isSeoulAutoGalleryLanding ? "숏폼카와 차량 카테고리" : undefined}
                  navigationLabel={isSeoulAutoGalleryLanding ? "정렬, 숏폼카, 차량 카테고리와 보기 방식" : undefined}
                  onView={() => setBbmMenu("m-view")}
                  viewMode={bbmMobileView}
                  extra={debugMode ? quickStyleSelect : null}
                />
                <section class={`bbm-m-list${bbmMobileView === "피드로 보기" ? " is-feed" : bbmMobileView === "갤러리로 보기" ? " is-gallery" : bbmMobileView === "한줄 광고로 보기" ? " is-one-line" : bbmMobileView === "텍스트로 보기" ? " is-text" : ""}`} aria-live="polite">
                  {shownCars.length && bbmMobileView === "한줄 광고로 보기" ? <div class="bbm-one-line-head"><span>모델</span><span>연식(연형)</span><span>가격(만원)</span><i /></div> : null}
                  {shownCars.length ? pagedCars.map((car, index) => bbmMobileView === "한줄 광고로 보기"
                    ? <BbmOneLineCard key={car.id} car={car} liked={likedIds.includes(car.id)} onOpen={() => openCarDetail(car)} onToggleLike={() => toggleLiked(car.id)} />
                    : <BbmResultCard key={car.id} car={car} variant="mobile" eagerPhoto={index < 4} featured={bbmMobileView === "피드로 보기"} feedPhotos={bbmMobileView === "피드로 보기" ? feedPhotosFor(pagedCars, index) : undefined} liked={likedIds.includes(car.id)} onOpen={() => openCarDetail(car)} onToggleLike={() => toggleLiked(car.id)} onChat={() => setSearchToast("채팅 연결 예정")} onCall={() => setSearchToast("전화는 정식 서비스에서 이용해 주세요.")} />) : carListItems}
                  {shownCars.length ? <BbmPagination page={bbmPageNow} total={bbmPageCount} windowSize={3} onChange={goBbmPage} /> : null}
                </section></> : null}
                <BbmFooter onNotify={setSearchToast} />
              </main>
            </MobileScroll>
            <BbmBottomGnb onNotify={setSearchToast} />
            {bbmMenu === "m-sort" ? <BbmSheet title="정렬" flush onClose={() => setBbmMenu(null)}><BbmPopOptions options={bbmSortOptions} selected={bbmSort} onSelect={chooseBbmSort} /></BbmSheet> : null}
            {bbmMenu === "m-view" ? <BbmSheet title="리스트 필터" flush onClose={() => setBbmMenu(null)}><BbmPopOptions options={bbmViewOptionsMobile} selected={bbmMobileView} onSelect={chooseBbmView} /></BbmSheet> : null}
            {bbmCategoryOpen ? <BbmSheet variant="category" title="카테고리" onClose={() => setBbmCategoryOpen(false)} footer={<div class="bbmf-category-footer"><button type="button" disabled={bbmCategoryDraft === "전체" && !bbmCategoryChildDraft} onClick={() => { setBbmCategoryDraft("전체"); setBbmCategoryChildDraft(null); }}>초기화</button><button type="button" class="bbmf-category-confirm" onClick={() => { chooseHierarchyCategory(bbmCategoryDraft, bbmCategoryChildDraft ?? undefined); setBbmCategoryOpen(false); }}>선택{bbmCategoryDraftCount(bbmCategoryDraft, bbmCategoryChildDraft) > 0 ? ` · ${bbmCategoryDraftCount(bbmCategoryDraft, bbmCategoryChildDraft).toLocaleString("ko-KR")}대` : ""}</button></div>}>
              <BbmCategoryPicker selected={bbmCategoryDraft} selectedChild={bbmCategoryChildDraft} onChoose={(label, detail) => { setBbmCategoryDraft(label); setBbmCategoryChildDraft(detail ?? null); }} />
            </BbmSheet> : null}
            {bbmFullOpen ? (
              <BbmFullFilter
                variant="daangn"
                onClose={closeFull}
                keepSearch={bbmKeepSearch}
                onToggleKeep={() => setBbmKeepSearch((value) => !value)}
                onSaveSearch={toggleSearchSaved}
                history={shownHistory}
                footer={<BbmActionBar variant="full" confirmStyle="보기" count={countWithBbm(fullValue)} onReset={() => { setBbmFullAvailableOnly(false); setBbmFullMoreOpen(false); setSheetValue(resetBbmFilters(fullValue)); }} onConfirm={applyFull} />}
              >
                <section class="bbmf-daangn-status" aria-label="상태">
                  <h4>상태</h4>
                  <label><button type="button" role="switch" aria-checked={bbmFullAvailableOnly} aria-label="거래 가능만 보기" class={`bbmf-daangn-switch${bbmFullAvailableOnly ? " is-on" : ""}`} onClick={() => setBbmFullAvailableOnly((value) => !value)}><span /></button><strong>거래 가능만 보기</strong></label>
                </section>
                {primaryFullOrder.map(renderFullFilterItem)}
                <button type="button" class="bbmf-full-more" aria-expanded={bbmFullMoreOpen} onClick={() => setBbmFullMoreOpen((value) => !value)}><span>{bbmFullMoreOpen ? "필터 접기" : "필터 더보기"}</span><i aria-hidden="true" /></button>
                {bbmFullMoreOpen ? <div class="bbmf-full-more-content">
                  <BbmFullItem label="카테고리" onOpen={() => openFullItem("카테고리")} />
                  {isTruckCategory ? <>
                    <BbmFullItem label="트럭 유형" value={truckFormatPath} onClear={clearTruckFormat} onOpen={() => { setBbmFullOpen(false); setTruckTypePickerOpen(true); }} />
                    <div class="bbmf-full-group-title">추가 필터</div>
                  </> : null}
                  {secondaryFullOrder.map(renderFullFilterItem)}
                  {isBikeCategory ? null : <BbmFullExcludeAction onClick={() => setSearchToast("제조사·모델 제외하기는 정식 서비스에서 이용해 주세요.")} />}
                </div> : null}
              </BbmFullFilter>
            ) : null}
            {/* QF-117: 과쯔 모바일 주행거리는 전용 바텀시트(임시 값 · 대수 실시간 · 적용해야 확정) */}
            {bbmFullOpen && bbmFullItem && typeof bbmFullItem === "object" && bbmFullItem.label === "주행거리" && isGuaziQuickStyle ? <MileageFinalSheet value={fullValue} countOf={countWithBbm} onApply={setSheetValue} onClose={closeFullItem} /> : null}
            {bbmFullOpen && bbmFullItem && typeof bbmFullItem === "object" && bbmFullItem.label === "가격" && isGuaziQuickStyle ? <PriceFinalSheet value={fullValue} countOf={countWithBbm} onApply={setSheetValue} onClose={closeFullItem} presets={isPartsCategory ? partsPricePresets : undefined} hideTabs={isPartsCategory} /> : null}
            {bbmFullOpen && bbmFullItem && typeof bbmFullItem === "object" && bbmFullItem.checkKey === "sellerKind" ? <BbmSellerTypeSheet value={fullValue} countWith={countWithBbm} countOf={bbmCountOf} onApply={setSheetValue} onClose={closeFullItem} /> : null}
            {bbmFullOpen && bbmFullItem && typeof bbmFullItem === "object" && bbmFullItem.checkKey === "bodyType" ? <BbmBodyTypeSheet value={fullValue} countWith={countWithBbm} countOf={bbmCountOf} onApply={setSheetValue} onClose={closeFullItem} /> : null}
            {truckSidebarFilter ? <TruckTypePicker desktop={false} open={truckTypePickerOpen} onClose={() => setTruckTypePickerOpen(false)} value={truckSidebarFilter} /> : null}
            {bbmFullOpen && bbmFullItem === "제조사 · 모델" ? (
              <BbmSheet title="제조사" onClose={closeFullItem} footer={<BbmActionBar variant="sheet" confirmStyle="보기" count={visibleCars.length} onReset={() => setBbmMakerDraft(null)} onConfirm={() => { applyMakerFilter(bbmMakerDraft); closeFullItem(); }} />}>
                <BbmBrandMenu items={previewBrandItems} selected={bbmMakerDraft} renderLogo={(name) => <CategoryBrandLogo category={category} name={name} kind="plain" />} onChoose={setBbmMakerDraft} />
              </BbmSheet>
            ) : null}
            {bbmFullOpen && bbmFullItem && bbmFullItem !== "제조사 · 모델" && !(bbmFullItem !== "카테고리" && (bbmFullItem.checkKey === "sellerKind" || bbmFullItem.checkKey === "bodyType" || (bbmFullItem.label === "주행거리" || bbmFullItem.label === "가격") && isGuaziQuickStyle || bbmFullItem.label === "형식/적재용량")) ? (
              <BbmSheet title={bbmFullItem === "카테고리" ? "카테고리" : bbmFullItem.modalTitle ?? bbmFullItem.displayLabel ?? bbmFullItem.label} modalBody={bbmFullItem !== "카테고리" && bbmFullItem.mode !== "expand"} onClose={closeFullItem} footer={<BbmActionBar variant="sheet" confirmStyle="보기" count={bbmFullItem === "카테고리" ? visibleCars.length : countWithBbm(sheetValue)} onReset={() => { if (bbmFullItem !== "카테고리") setSheetValue(clearBbmItem(bbmFullItem, sheetValue)); }} onConfirm={() => { setBbmFilters(sheetValue); closeFullItem(); }} />}>
                {bbmFullItem === "카테고리" ? <BbmCategoryMenu onChoose={(label, detail) => { chooseHierarchyCategory(label, detail); setBbmFullItem(null); }} />
                  : bbmFullItem.mode === "expand" ? <div class="bbmf-chip-expand"><BbmExpandPanel label={bbmFullItem.label} variant={bbmFullItem.label === "가격" ? "chip" : "sidebar"} value={sheetValue} onChange={setSheetValue} countOf={bbmCountOf} /></div>
                  : <BbmModalPanel item={bbmFullItem} value={sheetValue} onChange={setSheetValue} countOf={bbmCountOf} />}
              </BbmSheet>
            ) : null}
            {renderBbmChipPanel(false)}
            {isGuaziQuickStyle && stableRegionOpen ? <StableRegionSheet value={bbmValue} onChange={setBbmFilters} onClose={() => setStableRegionOpen(false)} onNearby={() => setSearchToast("내 주변 매물은 정식 서비스에서 이용해 주세요.")} /> : null}
            {searchToast ? <div class="market-toast" role="status" aria-live="polite">{searchToast}</div> : null}
            {marketSheet}
          </>
        );
      }
  
      return (
        <>
          <MobileScroll className="app-screen">
            <main class="marketplace" aria-label="중고차 리스트">
              <Header query={query} setQuery={setQuery} searchPlaceholder={categorySearchPlaceholder} searchSaved={searchSaved} onToggleSearchSaved={toggleSearchSaved} onOpenFavorites={() => flow.push(savedListingsScreen)} catalogRecords={supportsVehicleCatalog ? vehicleCatalog.records : undefined} onCatalogFocus={supportsVehicleCatalog ? () => { void vehicleCatalog.ensureSearch(); } : undefined} onCatalogChoose={supportsVehicleCatalog ? chooseCatalogRecord : undefined} />
              <section class="region-bar" aria-label="지역 선택">
                <button type="button" aria-label={`현재 지역 ${regionLabel}, 지역 선택 열기`} onClick={openRegionSheet}><Icon name="location-blue.svg" /><span class="region-label">지역:</span><strong>{regionLabel}</strong><span class="region-chevron-icon" aria-hidden="true"><Icon name="region-chevron.svg" /></span></button>
                <button type="button" class="reset-button" onClick={() => resetFilters()}>초기화</button>
              </section>
              {filterShell}
              {quickRail}
              <section class="video-toggle-row" aria-label="숏폼매물과 퀵필터 사례 선택">
                <div class="video-toggle-copy">
                  <span>숏폼매물</span>
                  <button type="button" role="switch" aria-checked={videoViewerOpen} class={videoViewerOpen ? "is-on" : ""} onClick={openVideoViewer}><span /></button>
                </div>
                <label class="quick-style-select">
                  <span>적용 사이트</span>
                  <select value={quickFilterStyle} onChange={(event) => chooseQuickFilterStyle(event.currentTarget.value as QuickFilterStyle)}>
                    {quickFilterStyleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
              </section>
              <nav class="list-toolbar" aria-label="매물 유형과 정렬">
                <div class="seller-tabs" role="tablist" aria-label="판매자 유형">
                  {(["전체", "개인", "딜러"] as SellerType[]).map((tab) => <button key={tab} type="button" role="tab" aria-selected={sellerType === tab} class={sellerType === tab ? "is-selected" : ""} onClick={() => setFilters((current) => ({ ...current, seller: tab }))}>{sellerTabLabel(tab)}</button>)}
                </div>
                <div class="sort-controls">
                  <button type="button" class="sort-button" onClick={() => setSheet("sort")}>{sort}<span class="sort-arrow-icon" aria-hidden="true"><Icon name="sort-arrow.svg" /></span></button><span class="toolbar-divider" />
                  <button type="button" class={`density-button${cardView ? " is-active" : ""}`} aria-label={cardView ? "목록형 보기로 전환" : "카드형 보기로 전환"} aria-pressed={cardView} onClick={() => setCardView((value) => !value)}><Icon name={cardView ? "card-view.svg" : "notion-list.svg"} /></button>
                </div>
              </nav>
              <section class="car-list" aria-live="polite">{carListItems}</section>
            </main>
          </MobileScroll>
          {searchToast ? <div class="market-toast" role="status" aria-live="polite">{searchToast}</div> : null}
          {marketSheet}
        </>
      );
    };
  },
});
