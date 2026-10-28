<script setup lang="ts">
// 원본: src/prototype/listing/pc-bbmuseum.tsx BbHeader
// 대응: onChooseCategory → emit chooseCategory(category, detail?) · onNotify → emit notify · onOpenFavorites → emit openFavorites
//       searchSlot(ReactNode) → 이름 있는 slot "searchSlot"(넘겼을 때만 .bbm-header-search-slot 를 그린다)
import { computed, onBeforeUnmount, onMounted, ref, useSlots, watch } from "vue";
import BbIcon from "./BbIcon.vue";
import BbmVehicleTypeDropdown from "./BbmVehicleTypeDropdown.vue";
import ListingLanguageSelect from "./ListingLanguageSelect.vue";
import { bbLnbVariant, bbSearchVariant, bbStandaloneBikeSite, bbStandaloneTruckSite } from "@proto/listing/pc-bbmuseum";
import {
  bbActiveGnbItem, bbAuthState, bbBikeSiteGnbItems, bbGnbActiveMode, bbGnbItems, bbGnbMoreItems, bbGnbSearchPill, bbGnbSearchPillBlue,
  bbLogoLanguage, bbmAsset, bbmServiceLogo, bbTruckSiteGnbItems, type BbAuthState, type BbGnbItem,
} from "../../lib/listing/pc-bbmuseum-internal";

const props = defineProps<{ category: string }>();
const emit = defineEmits<{ chooseCategory: [category: string, detail?: string]; notify: [message: string]; openFavorites: [] }>();
const slots = useSlots();

const moreOpen = ref(false);
const accountOpen = ref(false);
const authState = ref<BbAuthState>(bbAuthState());
const moreEl = ref<HTMLElement | null>(null);
const accountRef = ref<HTMLDivElement | null>(null);
const variant = bbSearchVariant();
const logoLanguage = bbLogoLanguage();
const isMember = computed(() => authState.value === "member");
const isBikeSite = bbStandaloneBikeSite();
const isTruckSite = bbStandaloneTruckSite();
const isStandaloneSite = isBikeSite || isTruckSite;
const siteName = isTruckSite ? "트럭" : "바이크";
const siteEmblem = isTruckSite ? "truck-emblem" : "bike-emblem";
const serviceLogo = computed(() => bbmServiceLogo(isBikeSite ? "바이크" : isTruckSite ? "트럭 · 특장" : props.category));
const activeItem = computed(() => {
  const menuParam = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const isBikeParts = props.category === "부품 · 용품" && menuParam?.get("bikeMenu") === "parts";
  const isTruckParts = props.category === "부품 · 용품" && menuParam?.get("truckMenu") === "parts";
  return isBikeSite ? isBikeParts ? "중고 용품·장비" : "중고 바이크" : isTruckSite ? isTruckParts ? "트럭 부품" : "중고 트럭" : bbActiveGnbItem(props.category);
});
const gnbItems = isBikeSite ? bbBikeSiteGnbItems : isTruckSite ? bbTruckSiteGnbItems : bbGnbItems;

const headerClass = () => `bbm-header${isStandaloneSite ? " is-bike-site" : ""}${isTruckSite ? " is-truck-site" : ""}${variant === "default" ? "" : ` is-search-${variant}`}${bbGnbActiveMode() === "pill" ? "" : bbGnbActiveMode() === "text" ? " is-gnb-text" : " is-gnb-text is-gnb-line"}${bbGnbSearchPill() ? " is-gnb-searchpill" : ""}${bbGnbSearchPillBlue() ? " is-gnb-searchpill-blue" : ""}`;
const logoSrc = () => serviceLogo.value ?? bbmAsset(isBikeSite && document.documentElement.dataset.bikelogo === "mark" ? "bike-logo-mark" : isStandaloneSite ? siteEmblem : "header-logo");

onMounted(() => {
  const lnb = bbLnbVariant();
  if (lnb === "default") return;
  document.documentElement.dataset.lnb = lnb;
});
onBeforeUnmount(() => {
  if (bbLnbVariant() !== "default") delete document.documentElement.dataset.lnb;
});

let moreCleanup: (() => void) | null = null;
watch(moreOpen, (open) => {
  moreCleanup?.();
  moreCleanup = null;
  if (!open) return;
  const closeMore = (event: PointerEvent) => {
    if (!moreEl.value?.contains(event.target as Node)) moreOpen.value = false;
  };
  document.addEventListener("pointerdown", closeMore);
  moreCleanup = () => document.removeEventListener("pointerdown", closeMore);
});
let accountCleanup: (() => void) | null = null;
watch(accountOpen, (open) => {
  accountCleanup?.();
  accountCleanup = null;
  if (!open) return;
  const closeAccount = (event: PointerEvent) => {
    if (!accountRef.value?.contains(event.target as Node)) accountOpen.value = false;
  };
  document.addEventListener("pointerdown", closeAccount);
  accountCleanup = () => document.removeEventListener("pointerdown", closeAccount);
});
onBeforeUnmount(() => { moreCleanup?.(); accountCleanup?.(); });

const setMoreRef = (el: unknown) => { moreEl.value = (el as HTMLElement | null) ?? null; };

const chooseMenu = (item: BbGnbItem) => {
  if (item.action === "more") {
    moreOpen.value = !moreOpen.value;
    return;
  }
  moreOpen.value = false;
  if (item.action === "home") {
    emit("chooseCategory", "전체");
    document.querySelector(".app-screen")?.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (item.action === "community") {
    window.location.assign(new URL("community/bobaedream-pc-board-list.html?layout=reddit", window.location.href).toString());
    return;
  }
  if (item.action === "bike-sell") {
    emit("chooseCategory", "바이크", "__bike_sell__");
    return;
  }
  if (item.action === "bike-shop") {
    emit("notify", "바이크샵은 준비 중입니다.");
    return;
  }
  if (item.action === "bike-parts") {
    emit("chooseCategory", "부품 · 용품", "__bike_parts__");
    return;
  }
  if (item.action === "truck-sell") {
    emit("notify", "트럭 판매는 정식 서비스에서 이용해 주세요.");
    return;
  }
  if (item.action === "truck-parts") {
    emit("chooseCategory", "부품 · 용품", "__truck_parts__");
    return;
  }
  if (item.category) emit("chooseCategory", item.category);
};
const changeAuthState = (next: BbAuthState) => {
  authState.value = next;
  accountOpen.value = false;
  const url = new URL(window.location.href);
  if (next === "member") url.searchParams.set("pcauth", "member");
  else url.searchParams.delete("pcauth");
  window.history.replaceState({}, "", url);
};
const clickLogo = () => {
  if (isBikeSite) emit("chooseCategory", "바이크");
  if (isTruckSite) emit("chooseCategory", "트럭 · 특장");
  document.querySelector(".app-screen")?.scrollTo({ top: 0 });
};
const loginToMember = () => { changeAuthState("member"); emit("notify", "로그인 상태 화면으로 전환했습니다."); };
const logoutToGuest = () => { changeAuthState("guest"); emit("notify", "미로그인 상태 화면으로 전환했습니다."); };
const accountNotify = (message: string) => { accountOpen.value = false; emit("notify", message); };
const clickListing = () => isBikeSite ? emit("chooseCategory", "바이크", "__bike_sell__") : emit("notify", `${isTruckSite ? "트럭 판매" : "차량 판매하기"}는 정식 서비스에서 이용해 주세요.`);
const itemClassName = (item: BbGnbItem) => `${item.label === activeItem.value ? "is-active" : ""}${item.action === "home" ? " is-home" : ""}`;
</script>
<template>
  <header :class="headerClass()" :aria-label="isStandaloneSite ? `보배드림 ${siteName}` : '보배드림'">
    <div class="bbm-header-inner">
      <div class="bbm-header-main">
        <button type="button" class="bbm-logo" :aria-label="isStandaloneSite ? `보배드림 ${siteName} 처음으로` : '보배드림 처음으로'" @click="clickLogo">
          <span :class="`bbm-logo-emblem${serviceLogo ? ' is-service-logo' : ''}`" aria-hidden="true">
            <img :src="logoSrc()" alt="" :draggable="false">
          </span>
          <span :class="`bbm-logo-word is-${logoLanguage}`" aria-hidden="true">{{ logoLanguage === "ko" ? "보배드림" : "BOBAEDREAM" }}</span>
          <span v-if="isStandaloneSite" class="bbm-bike-site-badge" aria-hidden="true">{{ siteName }}</span>
        </button>
        <div v-if="slots.searchSlot" class="bbm-header-search-slot">
          <button v-if="variant === 'chotot'" type="button" class="bbm-region-pill" aria-label="지역 선택, 현재 전국" @click="emit('notify', '지역 선택은 목록 위 지역 줄에서 이용해 주세요.')"><img :src="bbmAsset('header-location-chotot-v01')" alt="" aria-hidden="true"><span>전국</span><BbIcon name="chevron-down" :size="16" /></button>
          <slot name="searchSlot" />
          <ListingLanguageSelect compact />
        </div>
        <div v-if="variant === 'default'" class="bbm-header-auth" aria-label="회원 메뉴">
          <button type="button" class="bbm-auth-icon" aria-label="관심 매물" @click="emit('openFavorites')"><BbIcon name="heart" :size="24" /></button>
          <template v-if="isMember">
            <button type="button" class="bbm-auth-icon has-badge" aria-label="읽지 않은 알림 80개" @click="emit('notify', '알림은 정식 서비스에서 이용해 주세요.')">
              <BbIcon name="notification" :size="24" />
              <span class="bbm-auth-badge" aria-hidden="true">80</span>
            </button>
            <button type="button" class="bbm-auth-pill is-contact" @click="emit('notify', '채팅은 정식 서비스에서 이용해 주세요.')"><BbIcon name="chat" :size="20" /><span>채팅</span></button>
            <button type="button" class="bbm-auth-pill is-management" @click="emit('notify', '매물관리는 정식 서비스에서 이용해 주세요.')">매물관리</button>
          </template>
          <button v-else type="button" class="bbm-auth-pill is-login" @click="loginToMember">로그인/회원가입</button>
          <button type="button" class="bbm-listing-button" @click="clickListing">{{ isStandaloneSite ? `${siteName} 판매` : "차량 판매하기" }}</button>
          <div ref="accountRef" class="bbm-account-wrap">
            <button type="button" :class="`bbm-account-button${isMember ? ' is-member' : ' is-guest'}`" :aria-label="isMember ? '회원 계정 메뉴' : '로그인 및 계정 메뉴'" aria-haspopup="menu" :aria-expanded="accountOpen" @click="accountOpen = !accountOpen">
              <span v-if="isMember" class="bbm-account-avatar" aria-hidden="true"><img :src="bbmAsset(isStandaloneSite ? siteEmblem : 'header-logo')" alt=""></span>
              <span v-else class="bbm-account-avatar is-guest" aria-hidden="true"><BbIcon name="mypage" :size="20" /></span>
              <BbIcon name="chevron-down" :size="20" class="bbm-account-chevron" />
            </button>
            <div v-if="accountOpen" class="bbm-account-menu" role="menu">
              <button v-if="isMember" type="button" role="menuitem" @click="logoutToGuest">로그아웃</button>
              <button v-else type="button" role="menuitem" @click="loginToMember">로그인</button>
              <button v-if="!isMember" type="button" role="menuitem" @click="accountNotify('회원가입은 정식 서비스에서 이용해 주세요.')">회원가입</button>
              <button type="button" role="menuitem" @click="accountNotify('고객센터는 정식 서비스에서 이용해 주세요.')">고객센터</button>
            </div>
          </div>
        </div>
        <div v-else :class="`bbm-header-actions is-${variant}`">
          <template v-if="variant === 'chotot'">
            <button type="button" class="bbm-act-icon" aria-label="찜" @click="emit('openFavorites')"><img :src="bbmAsset('header-heart')" alt="" aria-hidden="true"></button>
            <button type="button" class="bbm-act-icon" aria-label="알림" @click="emit('notify', '알림은 정식 서비스에서 이용해 주세요.')"><img :src="bbmAsset('header-notification')" alt="" aria-hidden="true"></button>
            <button type="button" class="bbm-act-pill" @click="emit('notify', '채팅은 정식 서비스에서 이용해 주세요.')"><img :src="bbmAsset('header-chat')" alt="" aria-hidden="true">채팅</button>
            <button type="button" class="bbm-act-pill" @click="emit('notify', '로그인은 정식 서비스에서 이용해 주세요.')">로그인</button>
            <button type="button" class="bbm-act-primary" @click="emit('notify', '내차팔기는 정식 서비스에서 이용해 주세요.')">내차팔기</button>
          </template>
          <template v-else>
            <button type="button" class="bbm-act-primary" @click="emit('notify', '내차팔기는 정식 서비스에서 이용해 주세요.')">내차팔기</button>
            <button type="button" class="bbm-act-circle is-tint" aria-label="채팅" @click="emit('notify', '채팅은 정식 서비스에서 이용해 주세요.')"><img :src="bbmAsset('header-chat')" alt="" aria-hidden="true"></button>
            <button type="button" class="bbm-act-circle" aria-label="찜" @click="emit('openFavorites')"><img :src="bbmAsset('header-heart')" alt="" aria-hidden="true"></button>
            <button type="button" class="bbm-act-circle" aria-label="마이페이지" @click="emit('notify', '로그인은 정식 서비스에서 이용해 주세요.')"><img :src="bbmAsset('header-mypage')" alt="" aria-hidden="true"></button>
          </template>
        </div>
      </div>
      <div class="bbm-gnb-row">
        <nav class="bbm-gnb" aria-label="주 메뉴">
          <template v-for="item in gnbItems" :key="item.label">
            <BbmVehicleTypeDropdown v-if="item.label === '전체 차량'" :active="item.label === activeItem" @choose="(nextCategory) => emit('chooseCategory', nextCategory)" />
            <div v-else-if="item.action === 'more'" :ref="setMoreRef" class="bbm-gnb-more-wrap">
              <button type="button" :class="`bbm-gnb-more ${itemClassName(item)}`.trim()" :aria-current="item.label === activeItem ? 'page' : undefined" aria-haspopup="menu" :aria-expanded="moreOpen" @click="chooseMenu(item)">
                <span>{{ item.label }}</span><span class="bbm-gnb-more-count" aria-hidden="true">{{ bbGnbMoreItems.length }}</span><BbIcon name="chevron-down" :size="18" />
              </button>
              <div v-if="moreOpen" class="bbm-gnb-more-menu" role="menu"><button v-for="moreItem in bbGnbMoreItems" :key="moreItem.label" type="button" role="menuitem" :class="moreItem.category === category ? 'is-current' : ''" @click="chooseMenu(moreItem)"><span>{{ moreItem.label }}</span></button></div>
            </div>
            <button v-else type="button" :class="itemClassName(item)" :aria-current="item.label === activeItem ? 'page' : undefined" @click="chooseMenu(item)">
              <span>{{ item.label }}</span>
            </button>
          </template>
        </nav>
        <button type="button" class="bbm-gnb-notice" aria-label="공지사항, 새로운 보배드림 서비스 안내" @click="emit('notify', '공지사항은 정식 서비스에서 이용해 주세요.')">
          <strong>공지</strong><span class="bbm-gnb-notice-divider" aria-hidden="true" /><span class="bbm-gnb-notice-copy">새로운 보배드림 서비스 안내</span>
        </button>
      </div>
    </div>
  </header>
</template>
