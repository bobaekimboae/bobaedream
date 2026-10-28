<script setup lang="ts">
// 리액트 bbm-list.tsx 의 BbmResultCard(원본 car-list-result-card). variant pc: 사진 160, 마력 포함 / mobile 목록형: 초톳 기준 사진 120×120, 마력 없음
// 콜백 → emit: onToggleLike → "toggleLike", onOpen → "open", onChat → "chat", onCall → "call"(리액트도 없으면 아무 일 없음이라 보이는 차이 없음).
// 피드 사양 줄(renderFeedSpec)은 bbm-list-local.ts 의 feedSpecItems 로 항목을 만들고 이 템플릿에서 같은 DOM을 그린다.
import { computed, type CSSProperties } from "vue";
import { asset, displayListPlace, placeSidoGugun, sellerAvatar, sellerLabel, sellerRealPhoto, type Car } from "@proto/data";
import { bbmCardBadges, bbmCardSpec, bbmSampleHorsepower } from "@proto/data/bbm-card-samples";
import { oldCarGeneration } from "@proto/data/old-car-generation-v01";
import { normalizedListThumb } from "@proto/listing/list-thumbs";
import { thumbnailPostedText } from "@proto/listing/thumbnail-posted";
import { truckPlaceV09 } from "@proto/truck/scenario-v09";
import { formatLocalListingPrice, localPriceDisclosure, translateListingText } from "@proto/listing/listing-i18n";
import { bbmIcon } from "@proto/listing/bbm-list";
import "@proto/listing/bbm-tokens.css";
import "@proto/listing/thumbnail-states.css";
import { useListingLocale } from "../../composables/listing/useListingLocale";
import { useViewedListing } from "../../composables/listing/useViewedListing";
import { cardTitleText, feedSpecItems, getHeadlinePosition, getHeadlineTone, wishMaskStyle } from "./bbm-list-local";
import FeedPhotoCarousel from "./FeedPhotoCarousel.vue";

const props = withDefaults(defineProps<{
  car: Car;
  eagerPhoto?: boolean;
  locationDong?: string;
  detailLocation?: { dealer?: string; shop?: string };
  variant: "pc" | "mobile";
  featured?: boolean;
  detailSummary?: boolean;
  detailPower?: string;
  detailBodyType?: string;
  feedPhotos?: string[];
  liked: boolean;
}>(), { eagerPhoto: true, featured: false, detailSummary: false });
const emit = defineEmits<{ toggleLike: []; open: []; chat: []; call: [] }>();

const { locale } = useListingLocale();
const seller = computed(() => sellerLabel(props.car));
const { viewed, markViewed } = useViewedListing(() => props.car.id);
const openListing = () => { if (!props.detailSummary) markViewed(); emit("open"); };

const view = computed(() => {
  const { car, variant, featured, detailSummary, detailPower, detailBodyType, locationDong, feedPhotos } = props;
  // 목록 썸네일은 정규화 사본(럭셔리카와 같은 규칙)을 쓰고, 피드 대표 사진·그림(contain)은 원본 그대로
  // PC 승용 카드는 원본 가로 사진을 쓴다. 트럭 PC는 2026-10-19 모바일 우선 시안부터
  // Chợ Tốt처럼 정사각 썸네일을 쓰되, 차량 전체가 안전 영역에 들어간 정규화 사본으로 잘림을 막는다.
  const pcPhoto = variant === "pc";
  const listPhoto = featured || car.imageAspectRatio || (pcPhoto && !car.truck) || car.imageFit === "contain" ? undefined : car.listThumb ?? normalizedListThumb(car.image);
  const listCrop = pcPhoto || car.imageAspectRatio ? undefined : car.listCrop;
  // 중고차(승용)는 「시도 구군 · 단지」, 그 밖의 카테고리(트럭·바이크·건설기계·캠핑카 등)는 「시도 구군」까지만(2026-10-08)
  const isPassenger = !(car.truck || car.bike || car.heavy || car.virtualCategory);
  // 중고차는 개인·딜러 모두 「시도 구군 · 단지」(2026-10-08 「중고차 매물은 지역에 단지 붙이고」)
  // 럭셔리카 가상 매물은 데이터에 정한 단지를 그대로(지역별 기본 단지로 바꾸지 않음), 표기 축약 규칙만 적용
  const listPlace = car.luxuryCategory || car.seoulAutoGallery || car.realDealer || car.oldCar || car.supercarSheet || car.jdm
    ? [placeSidoGugun(car.place.split(" · ")[0]), ...car.place.split(" · ").slice(1)].join(" · ").replaceAll("자동차매매단지", "단지").replaceAll("매매단지", "단지")
    : car.bike ? car.place.split(" · ")[0].trim().split(/\s+/).slice(0, 3).join(" ")
    : car.truck && car.place.includes(" · ")
      ? [placeSidoGugun(car.place.split(" · ")[0]), ...car.place.split(" · ").slice(1)].join(" · ").replaceAll("자동차매매단지", "단지").replaceAll("매매단지", "단지")
      : !isPassenger
        // 바이크·건설기계·캠핑카·자재운반장비·부품 딜러도 KB 마스터의 실제 단지를 붙인다(2026-10-10 「지역 매매단지 다 추가」). 개인은 지역만
        ? truckPlaceV09(placeSidoGugun(car.place.split(" · ")[0]), car.sellerType === "개인" ? "개인" : "딜러", car.id).split(" · ").map((part, index) => index ? part.replaceAll("자동차매매단지", "단지").replaceAll("매매단지", "단지") : part).join(" · ")
        : displayListPlace(car.place, "딜러");
  const badges = bbmCardBadges(car);
  // 모바일 목록형 트럭은 적재를 뺀다(2026-10-10 「적재는 빼는게 어떨까, 목록형에서」): 2행에 톤수가 이미 있다. 피드·PC·트레일러는 그대로
  // 올드카 피드형은 메타정보 맨 끝에 세대(코드네임)를 붙인다(2026-10-12). 값은 old-car-generation-v01.ts
  const oldCarGen = featured && car.oldCar ? oldCarGeneration[car.oldCar.number] : undefined;
  const specBase = car.truck && !car.truck.trailer && !featured && variant !== "pc"
    ? bbmCardSpec(car, false).split(" · ").filter((part) => !/^적재 [\d.]+톤$/.test(part)).join(" · ")
    : bbmCardSpec(car, variant === "pc");
  // 피드형은 승용·지시값 매물도 연료 뒤에 마력을 붙인다(트럭은 이미 있고, 바이크·건설기계·캠핑카는 해당 없음). 올드카 세대는 그 뒤 맨 끝
  const isPassengerCar = !(car.truck || car.bike || car.heavy || car.virtualCategory);
  const withFeedPower = featured && isPassengerCar && !car.deutschSource && !specBase.includes("마력") ? `${specBase} · ${bbmSampleHorsepower(car.id)}` : specBase;
  const withDetailPower = detailSummary && detailPower && !withFeedPower.includes("마력") ? `${withFeedPower} · ${detailPower}` : withFeedPower;
  const withDetailBodyType = detailSummary && detailBodyType ? `${withDetailPower} · ${detailBodyType}` : withDetailPower;
  const specText = oldCarGen ? `${withDetailBodyType} · ${oldCarGen}` : withDetailBodyType;
  // 2026-10-19 「메타정보 한줄로」: PC 목록 카드는 트럭(마력 · 적재 · 차축) · 모터홈(승차 · 취침)도 둘째 줄로 내리지 않고 한 줄로 잇는다(넘치면 말줄임).
  const seatSplit = featured || variant === "pc" ? -1 : car.virtualCategory?.category === "캠핑카" ? specText.search(/ · 승차 /) : car.truck && !car.truck.trailer ? specText.search(/ · (적재 [\d.]+톤|\d+인승|[\d.]+(㎘|㎥|m) · |\d+마력)/) : -1;
  const specMain = seatSplit > 0 ? specText.slice(0, seatSplit) : specText;
  const specCapacity = seatSplit > 0 ? specText.slice(seatSplit + 3) : "";
  // 2026-10-19 「트럭 마력이 위로 올라가」: PC 트럭도 모바일과 같이 연식·주행·연료 줄 다음에 마력 · 적재 · 차축 줄을 둔다
  const prioritizeTruckCapacity = false;
  const [locationBase, ...locationSecondaryParts] = listPlace.split(" · ");
  const locationMain = locationDong ? `${locationBase} ${locationDong}` : locationBase; // 상세 상단만 동까지(2026-10-14)
  const priceMatch = car.price.match(/^(월\s*)?(.+?)\s*(만원)$/);
  const wonPrice = priceMatch ? Number(priceMatch[2].replace(/,/g, "")) * 10000 : null;
  const localPrice = wonPrice === null ? null : formatLocalListingPrice(wonPrice, locale.value);
  const originalWonPrice = wonPrice === null ? null : `₩${wonPrice.toLocaleString("en-US")}`;
  const monthlyPrefix = priceMatch?.[1] ? `${translateListingText(priceMatch[1].trim(), locale.value)} ` : "";
  const headlinePosition = getHeadlinePosition();
  const headlineTone = car.uiTest ? getHeadlineTone() : "default";
  const alt = car.uiTest?.fullTitle ?? `${car.title} ${car.trim}`.trim();
  const squareOriginalPhoto = !!car.imageAspectRatio && !featured;
  const photoStyle: CSSProperties | undefined = car.imageAspectRatio && !squareOriginalPhoto ? { height: "auto", aspectRatio: car.imageAspectRatio, alignSelf: "flex-start" } : undefined;
  const photoCount = car.photoList?.length || car.photos;
  const isCarousel = Boolean(featured && car.image && feedPhotos && feedPhotos.length > 1);
  const showFill = Boolean(car.image && (squareOriginalPhoto || listCrop && listCrop[0] === 100 && !listPhoto));
  const imgStyle: CSSProperties = listCrop && !listPhoto
    ? { position: "absolute", width: `${listCrop[0]}%`, height: `${listCrop[1]}%`, left: `${listCrop[2]}%`, top: `${listCrop[3]}%`, objectFit: "fill" }
    : { objectFit: car.imageAspectRatio ? "contain" : undefined, objectPosition: listPhoto ? "center center" : car.imagePosition ?? "center center" };
  const imgClass = squareOriginalPhoto ? "is-square-original" : car.imageFit === "contain" ? "is-catalog" : "";
  const articleClass = `bbm-result-card is-${variant}${viewed.value && !detailSummary ? " is-viewed" : ""}${featured ? " is-feed-featured" : ""}${detailSummary ? " is-detail-summary" : ""}${badges.length ? " has-badges" : " has-no-badges"}${car.uiTest ? ` is-ui-test headline-${headlinePosition}` : ""}`;
  return {
    listPhoto, badges, specMain, specCapacity, prioritizeTruckCapacity, locationMain, locationSecondaryParts, priceMatch, localPrice, originalWonPrice, monthlyPrefix,
    headlinePosition, headlineTone, alt, squareOriginalPhoto, photoStyle, photoCount, isCarousel, showFill, imgStyle, imgClass, articleClass,
    titleText: cardTitleText(car),
    feedFit: (car.imageAspectRatio || car.imageFit === "contain" ? "contain" : "cover") as "cover" | "contain",
    disclosure: localPriceDisclosure(locale.value),
    feedItems: featured && !car.adDescription ? feedSpecItems(specMain) : [],
  };
});

const onKeyDown = (event: KeyboardEvent) => {
  if (event.target !== event.currentTarget) return;
  if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openListing(); }
};
const wishOff = bbmIcon("card-wish-off");
</script>
<template>
  <article :class="view.articleClass" role="link" tabindex="0" :aria-label="`${car.uiTest?.fullTitle ?? `${car.title} ${car.trim}`.trim()} 상세 보기`" @click="openListing" @keydown="onKeyDown">
    <strong v-if="car.uiTest && view.headlinePosition === 'top'" :class="`bbm-card-headline is-${view.headlinePosition}${view.headlineTone === 'blue' ? ' is-blue' : ''}`">{{ car.uiTest.headline }}</strong>
    <div class="bbm-card-main">
      <!-- 사진이 없는 매물은 원본처럼 빈 회색 칸(car-list-result-card__image 배경 #EBEBEB) -->
      <div v-if="view.headlinePosition === 'photo-top'" class="bbm-card-photo-column">
        <strong v-if="car.uiTest" :class="`bbm-card-headline is-${view.headlinePosition}${view.headlineTone === 'blue' ? ' is-blue' : ''}`">{{ car.uiTest.headline }}</strong>
        <template v-if="view.isCarousel">
          <div class="bbm-card-photo is-carousel" :style="view.photoStyle">
            <FeedPhotoCarousel :photos="feedPhotos!" :alt="view.alt" :fit="view.feedFit" />
            <div class="bbm-card-media-footer" aria-hidden="true"><span class="bbm-card-time" :title="car.posted">{{ thumbnailPostedText(car.posted) }}</span><span v-if="!featured && view.photoCount > 0" class="bbm-card-count">{{ view.photoCount }}<img :src="bbmIcon('card-photo-count')" alt="" /></span></div>
          </div>
        </template>
        <div v-else :class="`bbm-card-photo${car.image ? '' : ' is-empty'}`" :style="view.photoStyle">
          <img v-if="view.showFill" :class="`bbm-card-photo-fill${view.squareOriginalPhoto ? ' is-square-fill' : ''}`" :src="asset(car.image)" alt="" aria-hidden="true" :draggable="false" :loading="eagerPhoto ? 'eager' : 'lazy'" decoding="async" />
          <img v-if="car.image" :class="view.imgClass" :src="asset(view.listPhoto ?? car.image)" :alt="car.uiTest?.fullTitle ?? `${car.title} ${car.trim}`.trim()" :draggable="false" :loading="eagerPhoto ? 'eager' : 'lazy'" decoding="async" :style="view.imgStyle" />
          <div class="bbm-card-media-footer" aria-hidden="true"><span class="bbm-card-time" :title="car.posted">{{ thumbnailPostedText(car.posted) }}</span><span v-if="!featured && view.photoCount > 0" class="bbm-card-count">{{ view.photoCount }}<img :src="bbmIcon('card-photo-count')" alt="" /></span></div>
        </div>
      </div>
      <template v-else>
        <div v-if="view.isCarousel" class="bbm-card-photo is-carousel" :style="view.photoStyle">
          <FeedPhotoCarousel :photos="feedPhotos!" :alt="view.alt" :fit="view.feedFit" />
          <div class="bbm-card-media-footer" aria-hidden="true"><span class="bbm-card-time" :title="car.posted">{{ thumbnailPostedText(car.posted) }}</span><span v-if="!featured && view.photoCount > 0" class="bbm-card-count">{{ view.photoCount }}<img :src="bbmIcon('card-photo-count')" alt="" /></span></div>
        </div>
        <div v-else :class="`bbm-card-photo${car.image ? '' : ' is-empty'}`" :style="view.photoStyle">
          <img v-if="view.showFill" :class="`bbm-card-photo-fill${view.squareOriginalPhoto ? ' is-square-fill' : ''}`" :src="asset(car.image)" alt="" aria-hidden="true" :draggable="false" :loading="eagerPhoto ? 'eager' : 'lazy'" decoding="async" />
          <img v-if="car.image" :class="view.imgClass" :src="asset(view.listPhoto ?? car.image)" :alt="car.uiTest?.fullTitle ?? `${car.title} ${car.trim}`.trim()" :draggable="false" :loading="eagerPhoto ? 'eager' : 'lazy'" decoding="async" :style="view.imgStyle" />
          <div class="bbm-card-media-footer" aria-hidden="true"><span class="bbm-card-time" :title="car.posted">{{ thumbnailPostedText(car.posted) }}</span><span v-if="!featured && view.photoCount > 0" class="bbm-card-count">{{ view.photoCount }}<img :src="bbmIcon('card-photo-count')" alt="" /></span></div>
        </div>
      </template>
      <div class="bbm-card-content">
        <div class="bbm-card-text">
          <div v-if="detailSummary" class="bbm-card-detail-title-row">
            <strong class="bbm-card-title"><span class="bbm-card-model is-joined">{{ view.titleText }}</span></strong>
            <button type="button" :class="`bbm-card-wish${liked ? ' is-liked' : ''}`" :aria-label="`${car.title} ${liked ? '찜 해제' : '찜'}`" :aria-pressed="liked" @click.stop="emit('toggleLike')">
              <span v-if="liked" class="bbm-card-wish-on" :style="wishMaskStyle(wishOff)" aria-hidden="true" />
              <img v-else :src="wishOff" alt="" aria-hidden="true" />
            </button>
          </div>
          <strong v-else class="bbm-card-title"><span class="bbm-card-model is-joined">{{ view.titleText }}</span></strong>
          <span v-if="car.bike?.listingTitle" class="bbm-card-listing-title">{{ car.bike.listingTitle }}</span>
          <strong v-if="car.uiTest && view.headlinePosition === 'after-model'" :class="`bbm-card-headline is-${view.headlinePosition}${view.headlineTone === 'blue' ? ' is-blue' : ''}`">{{ car.uiTest.headline }}</strong>
          <span v-if="view.prioritizeTruckCapacity" class="bbm-card-spec is-capacity is-priority">{{ view.specCapacity }}</span>
          <span :class="`bbm-card-spec${view.prioritizeTruckCapacity ? ' is-secondary' : ''}${car.adDescription ? ' is-ad-description' : ''}`"><template v-if="car.adDescription">{{ car.adDescription }}</template><template v-else-if="featured"><span v-for="spec in view.feedItems" :key="spec.index" class="bbm-card-spec-item"><span v-if="spec.dot" class="bbm-card-spec-dot" aria-hidden="true" /><i v-if="spec.icon" class="bbm-card-spec-icon" aria-hidden="true" :style="{ '--spec-icon': `url(${asset(`bbm/meta-icons/${spec.icon}.svg`)})` }" /><span class="bbm-card-spec-text">{{ spec.item }}</span></span></template><template v-else>{{ view.specMain }}</template><span v-if="!(car.adDescription || (variant === 'pc' && Boolean(car.bike)))" class="bbm-card-spec-seller"> · {{ seller }}</span></span>
          <span v-if="!view.prioritizeTruckCapacity && !car.adDescription && view.specCapacity" class="bbm-card-spec is-capacity">{{ view.specCapacity }}</span>
          <div class="bbm-card-price-badges">
            <span class="bbm-card-price-pair">
              <strong class="bbm-card-price"><span v-if="view.localPrice">{{ view.monthlyPrefix }}{{ view.localPrice }}</span><template v-else><span>{{ view.priceMatch?.[1] ?? "" }}{{ view.priceMatch?.[2] ?? car.price }}</span><span v-if="view.priceMatch" class="bbm-card-price-unit">만원</span></template></strong>
              <span v-if="view.localPrice && view.originalWonPrice" class="bbm-card-origin-price" :title="view.disclosure" :aria-label="`${view.originalWonPrice}. ${view.disclosure}`">≈ {{ view.originalWonPrice }}</span>
            </span>
            <div v-if="view.badges.length" class="bbm-card-badges"><span v-for="badge in view.badges" :key="badge">{{ badge }}</span></div>
          </div>
        </div>
        <div class="bbm-card-meta">
          <div class="bbm-card-location"><img :src="bbmIcon('card-location')" alt="" aria-hidden="true" /><span class="bbm-card-location-text"><template v-if="detailLocation">
            <span class="bbm-card-location-row is-first"><span>{{ view.locationMain }}</span><span v-if="view.locationSecondaryParts[0]" class="bbm-card-location-part is-complex">{{ view.locationSecondaryParts[0] }}</span></span>
            <span v-if="detailLocation.dealer || detailLocation.shop" class="bbm-card-location-row"><span v-for="part in [detailLocation.dealer, detailLocation.shop].filter(Boolean)" :key="part" class="bbm-card-location-part">{{ part }}</span></span>
          </template><template v-else><span>{{ view.locationMain }}</span><span v-if="view.locationSecondaryParts.length" class="bbm-card-location-secondary"><span v-for="(part, index) in view.locationSecondaryParts" :key="`${part}-${index}`" class="bbm-card-location-part">{{ part }}</span></span></template></span></div>
          <!-- JOB-8: 모바일도 초톳처럼 판매자 줄을 지역 바로 아래(오른쪽 글 칸 안)에 둔다 -->
          <div v-if="!detailSummary" :class="`bbm-card-meta-row${variant === 'mobile' ? ' bbm-card-mobile-footer' : ''}`">
            <div class="bbm-card-seller">
              <img class="bbm-card-seller-logo" :src="asset(featured ? sellerRealPhoto(car) : sellerAvatar(car))" alt="" :draggable="false" />
              <div class="bbm-card-seller-text"><strong>{{ seller }}<img v-if="!featured && car.luxuryCategory?.certified" class="bbm-card-verified" :src="asset('bbm/verified-dealer-wavy-chotot-v01.svg')" alt="인증딜러" :draggable="false" /></strong></div>
            </div>
            <div class="bbm-card-actions">
              <!-- 피드 보기 전용(테스트 서버 car-list-feed-card__seller-action): 전화 · 채팅 · 찜 20, 간격 24. 다른 보기에서는 CSS로 숨김 -->
              <template v-if="featured">
                <button type="button" class="bbm-card-feed-action" aria-label="전화하기" @click.stop="emit('call')"><img :src="bbmIcon('card-phone')" alt="" aria-hidden="true" /></button>
                <button type="button" class="bbm-card-feed-action" aria-label="채팅" @click.stop="emit('chat')"><img :src="bbmIcon('card-chat')" alt="" aria-hidden="true" /></button>
              </template>
              <button type="button" :class="`bbm-card-wish${liked ? ' is-liked' : ''}`" :aria-label="`${car.title} ${liked ? '찜 해제' : '찜'}`" :aria-pressed="liked" @click.stop="emit('toggleLike')">
                <span v-if="liked" class="bbm-card-wish-on" :style="wishMaskStyle(wishOff)" aria-hidden="true" />
                <img v-else :src="wishOff" alt="" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </article>
</template>
