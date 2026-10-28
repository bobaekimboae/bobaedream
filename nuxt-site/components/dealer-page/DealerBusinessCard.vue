<script setup lang="ts">
// 리액트 src/prototype/dealer-page/DealerBusinessCard.tsx 의 DealerBusinessCard(+ 안쪽 CardPreview · Ico).
// props: contact: CardContact · shop: string · emp: string · standalone?: boolean(기본 false) · extras?: CardExtras
// slots: trigger — 리액트 trigger(ReactNode, Radix Dialog.Trigger asChild). 넣은 요소(하나)에 열기 클릭 · aria-haspopup · aria-expanded ·
//        aria-controls · data-state 를 붙여 그대로 그린다. 안 넣으면 리액트 기본 버튼(.dp-businesscard-trigger)을 그린다.
// @radix-ui/react-dialog 는 리액트 전용이라 같은 동작을 직접 만든다: body 로 Teleport, 오버레이(.dbc-overlay) · 내용(.dbc-dialog, role=dialog,
// aria-modal, aria-labelledby/-describedby, data-state=open), 열면 첫 포커스 요소로 · Tab 가두기 · Esc · 바깥 누르기 · × 로 닫기, 닫으면 트리거로 포커스,
// 여는 동안 body 스크롤 잠금. (Radix 의 바깥 요소 aria-hidden 처리는 하지 않는다.)
// 050 안심번호는 리액트와 같이 tel: 링크를 만들지 않는다(safe 면 버튼 → 안내 문구).
import { cloneVNode, computed, defineComponent, h, nextTick, onBeforeUnmount, ref, shallowRef, useSlots, watch, type CSSProperties, type FunctionalComponent, type VNode } from "vue";
import { cardContact, cardCompanyName, cardPng, cardThemes, cardVcf, defaultCardStyle, downloadBlob, profileUrl, readCardStyle, serializeCardStyle, cardFields, cardFieldHref, loadCardLogo, safePhoneNote, type CardContact, type CardExtras, type CardStyle } from "@proto/dealer-page/business-card";
import "@proto/dealer-page/business-card.css";
import { stockUrl } from "@proto/dealer-page/dealer-stock";
import { cardQr, cardServiceLive, cardServiceOrigin, fetchPublishedCard, publishingUrl, sharingUrl, type PublishedCard } from "@proto/dealer-page/card-sharing";
import { handleDialogKeyDown } from "../../composables/filters/useDialogFocus";

const props = withDefaults(defineProps<{ contact: CardContact; shop: string; emp: string; standalone?: boolean; extras?: CardExtras }>(), { standalone: false });
const slots = useSlots();

// 원본 publicBase(new URL(".", location.href))는 넉스트 판에서 nuxt/ 아래를 가리키므로 사이트 맨 위 주소를 쓴다.
const publicBase: string = import.meta.env.BASE_URL;
// 아이콘은 노션 오토스카우트24·초톳 원본 파일을 그대로 쓰고, 색만 mask로 글자색에 맞춘다(2026-10-22 명함 벤치마킹 적용).
const icons = {
  phone: "icons/dealer-profile/phone-as24.svg", sms: "icons/dealer-profile/speech-bubble-as24.svg", chat: "icons/chotot/chotot-common-chat.svg",
  consult: "icons/dealer-profile/speech-bubble-text-as24.svg", verified: "icons/chotot/chotot-list-detail-verified-check-circle.svg",
  location: "icons/dealer-profile/location-as24.svg", valuation: "icons/dealer-profile/car-sale-as24.svg", contact: "icons/chotot/chotot-common-contact-list.svg",
  share: "icons/chotot/chotot-common-share.svg", link: "icons/chotot/chotot-common-copy.svg", image: "icons/chotot/chotot-common-image.svg", clock: "icons/dealer-profile/clock.svg",
} as const;
const Ico: FunctionalComponent<{ name: keyof typeof icons }> = (p) => h("i", { class: "dbc-ico", "aria-hidden": "true", style: { "--dbc-ico": `url("${publicBase}${icons[p.name]}")` } as CSSProperties });
Ico.props = ["name"];
const contactTimes = ["언제든", "오전", "오후", "저녁"] as const;
const withCar = (href: string, car?: number) => { if (!car) return href; const url = new URL(href); url.searchParams.set("car", String(car)); return url.href; };
const cardRoleLabel = (role: string) => role === "소속딜러" || role === "딜러" || role === "인증딜러" ? "중고차 딜러" : role === "대표" ? "대표 딜러" : role;

// 리액트 CardPreview(내보내지 않은 부품). photoFailed 상태가 있어 작은 부품으로 둔다. (style 은 Vue 예약 속성이라 prop 이름만 cardStyle)
const CardPreview = defineComponent((p: { contact: CardContact; cardStyle: CardStyle }) => {
  const photoFailed = ref(false);
  return () => {
    const contact = cardContact(p.contact, p.cardStyle);
    const style = p.cardStyle;
    const palette = cardThemes[style.theme];
    const company = cardCompanyName(contact.company);
    const title = style.title.trim() || company;
    const separateTitle = title.replace(/\s/g, "") !== company.replace(/\s/g, "");
    const mobileHref = cardFieldHref("mobile", style.fields.mobile);
    return h("article", { class: "dbc-card", style: { "--dbc-bg": palette.background, "--dbc-ink": palette.ink } as CSSProperties, "aria-label": `${contact.name} 딜러 명함` }, [
      h("div", { class: `dbc-heading${photoFailed.value || !contact.photo ? " is-text-only" : ""}` }, [
        h("div", { class: "dbc-heading-copy" }, [
          h("div", { class: "dbc-brand-block" }, [
            contact.gallery ? h("small", { class: "dbc-affiliation", "aria-label": "단지명" }, contact.gallery) : null,
            h("div", { class: "dbc-brand" }, [style.logo ? h("img", { src: style.logo, alt: "명함 로고" }) : null, h("strong", { "aria-label": separateTitle ? "명함 타이틀" : "상사명" }, title)]),
            separateTitle ? h("p", { class: "dbc-company", "aria-label": "상사명" }, company) : null,
          ]),
          h("div", { class: "dbc-identity" }, [h("h2", contact.name), h("p", cardRoleLabel(contact.role))]),
        ]),
        !photoFailed.value && contact.photo ? h("div", { class: "dbc-photo-frame" }, [h("img", { class: "dbc-photo", src: contact.photo, alt: `${contact.name} 프로필`, onError: () => { photoFailed.value = true; } })]) : null,
      ]),
      h("p", { class: "dbc-intro" }, style.intro),
      h("div", { class: "dbc-contact" }, [
        mobileHref || contact.phone ? h("strong", [mobileHref ? style.fields.mobile : contact.phone, !mobileHref && contact.safe ? h("em", { class: "dbc-safe" }, "안심번호") : null]) : null,
        h("span", contact.address),
      ]),
    ]);
  };
}, { props: ["contact", "cardStyle"] });

const key = computed(() => `bobaedream:dealer-card:${props.shop}:${props.emp}`);
const open = ref(false);
const editing = ref(false);
const dialogRef = ref<HTMLElement | null>(null);
const readInitialStyle = (): CardStyle => {
  if (props.standalone) return readCardStyle(window.location.hash);
  try { const saved = localStorage.getItem(key.value); return saved ? readCardStyle(saved) : defaultCardStyle; } catch { return defaultCardStyle; }
};
const style = shallowRef<CardStyle>(readInitialStyle());
const status = ref("");
const busy = ref(false);
const manualLink = ref(false);
const imageUrl = ref("");
const logoBusy = ref(false);
const published = shallowRef<PublishedCard | null>(null);
const serverError = ref("");
const moreShare = ref(false);
const qrUrl = ref("");
const qrBusy = ref(false);
const shareCar = ref<number | undefined>(props.standalone ? Number(new URLSearchParams(window.location.search).get("car")) || undefined : undefined);
const consultOpen = ref(false);
type Consult = { car: string; time: (typeof contactTimes)[number]; phone: string; agree: boolean; sent: boolean; error: string };
const consult = ref<Consult>({ car: "", time: "언제든", phone: "", agree: false, sent: false, error: "" });
let draftChanged = false;

// 리액트는 그릴 때마다 계산하던 값들(주소·해시는 그 시점 값을 읽는다). hashchange 로 다시 그리도록 hashTick 을 둔다.
const hashTick = ref(0);
const legacy = computed(() => {
  void hashTick.value;
  const hashFields = new URLSearchParams(window.location.hash.slice(1));
  return props.standalone && ["theme", "intro", "title", "logo", "gallery", "company", ...cardFields.map(({ id }) => id)].some(id => hashFields.has(id));
});
const requiresPublished = computed(() => cardServiceLive && props.standalone && !legacy.value && new URLSearchParams(window.location.search).get("published") === "1");
const receiverContact = computed<CardContact>(() => props.standalone && !legacy.value && published.value ? { ...published.value.contact, listingCount: props.contact.listingCount } : props.contact);
const effectiveContact = computed(() => cardContact(receiverContact.value, style.value));
const baseUrl = computed(() => { void hashTick.value; return sharingUrl(window.location.href, props.shop, props.emp, style.value, published.value); });
const isFixed = computed(() => !!published.value && baseUrl.value === published.value.url);
const url = computed(() => withCar(baseUrl.value, shareCar.value));
const featuredId = props.standalone ? Number(new URLSearchParams(window.location.search).get("car")) || undefined : undefined;
const featured = computed(() => featuredId ? props.extras?.listings?.find((car) => car.id === featuredId) : undefined);
const dealerUrl = computed(() => profileUrl(window.location.href, props.shop, props.emp));
const phoneHref = computed(() => cardFieldHref("mobile", style.value.fields.mobile) || (receiverContact.value.phone && !receiverContact.value.safe ? `tel:${receiverContact.value.phone.replace(/[^+\d]/g, "")}` : null));

watch([editing, open], () => { if (open.value) nextTick(() => dialogRef.value?.scrollTo({ top: 0 })); });
watch(url, () => { qrUrl.value = ""; imageUrl.value = ""; manualLink.value = false; });

// 서버 명함(cardServiceLive 가 false 인 지금은 실행되지 않는다)
watch([open, () => props.standalone, () => props.shop, () => props.emp, key, legacy, requiresPublished], (_v, _o, onCleanup) => {
  if (!cardServiceLive || (!open.value && !props.standalone)) return;
  const controller = new AbortController();
  const refresh = async () => {
    try {
      const result = await fetchPublishedCard(props.shop, props.emp, controller.signal);
      if (controller.signal.aborted) return;
      published.value = result; serverError.value = !result && requiresPublished.value ? "아직 공개되지 않은 명함이에요. 판매자 페이지에서 확인해 주세요." : "";
      if (result && !draftChanged && !legacy.value) {
        let localDraft = false;
        try { localDraft = !!localStorage.getItem(key.value); } catch { /* The published card works without local storage. */ }
        if (props.standalone || !localDraft) style.value = result.style;
      }
    } catch {
      if (!controller.signal.aborted) serverError.value = "서버 명함을 불러오지 못했어요. 잠시 후 다시 열어 주세요.";
    }
  };
  void refresh();
  const message = (event: MessageEvent) => {
    if (event.origin === cardServiceOrigin && event.data?.type === "dealer-card-published" && event.data.shop === props.shop && event.data.emp === props.emp) void refresh();
  };
  window.addEventListener("focus", refresh);
  window.addEventListener("message", message);
  onCleanup(() => { controller.abort(); window.removeEventListener("focus", refresh); window.removeEventListener("message", message); });
}, { immediate: true });

watch(imageUrl, (_next, prev) => { if (prev) URL.revokeObjectURL(prev); });
onBeforeUnmount(() => { if (imageUrl.value) URL.revokeObjectURL(imageUrl.value); });
watch(style, () => { imageUrl.value = ""; });
watch(open, (value, _o, onCleanup) => {
  if (!value) return;
  const back = (event: Event) => { event.preventDefault(); setOpen(false); };
  window.addEventListener("bbm-app-back", back);
  onCleanup(() => window.removeEventListener("bbm-app-back", back));
});

watch([() => props.standalone, () => props.contact.name, () => props.contact.company], (_v, _o, onCleanup) => {
  if (!props.standalone) return;
  const update = () => { hashTick.value++; style.value = readCardStyle(window.location.hash); status.value = ""; manualLink.value = false; };
  window.addEventListener("hashchange", update);
  document.title = `${props.contact.name} · ${props.contact.company} | 디지털 명함`;
  onCleanup(() => window.removeEventListener("hashchange", update));
}, { immediate: true });

const updateStyle = (next: CardStyle) => {
  draftChanged = true;
  style.value = next; status.value = "";
  try { localStorage.setItem(key.value, serializeCardStyle(next)); } catch { /* The current card can still be shared without storage. */ }
};
const valid = () => {
  if (!effectiveContact.value.company) { status.value = "상사명을 입력해 주세요."; return false; }
  const invalid = cardFields.find(({ id }) => style.value.fields[id] !== undefined && !cardFieldHref(id, style.value.fields[id]));
  if (invalid) { status.value = `${invalid.label} 입력값을 확인하거나 선택을 해제해 주세요.`; return false; }
  return true;
};
const publish = () => {
  if (!valid()) return;
  window.open(publishingUrl(props.shop, props.emp, effectiveContact.value, style.value), "_blank", "noopener,noreferrer");
  status.value = "새 창에서 관리자 로그인 후 명함을 저장해 주세요. 저장 후 돌아오면 고정 주소가 적용돼요.";
};
const showQr = async () => {
  if (!valid()) return;
  qrBusy.value = true; status.value = "";
  try { qrUrl.value = await cardQr(url.value); }
  catch (error) { status.value = error instanceof Error ? error.message : "QR을 만들지 못했어요. 링크 복사를 이용해 주세요."; }
  finally { qrBusy.value = false; }
};
const copy = async () => {
  if (!valid()) return;
  try { await navigator.clipboard.writeText(url.value); manualLink.value = false; status.value = "명함 링크를 복사했어요. 원하는 대화방에 붙여 넣으세요."; }
  catch { manualLink.value = true; status.value = "아래 명함 링크를 선택해 복사해 주세요."; }
};
const share = async (kakao = false) => {
  if (!valid()) return;
  if (!navigator.share) { await copy(); if (kakao) status.value = "명함 링크를 카카오톡 대화방에 붙여 넣어 주세요. 복사가 안 되면 아래 링크를 직접 복사하세요."; return; }
  const car = shareCar.value ? props.extras?.listings?.find((item) => item.id === shareCar.value) : undefined;
  try { await navigator.share({ title: `${props.contact.name} · ${style.value.title.trim() || effectiveContact.value.company}`, text: car ? `${car.title} · ${car.price} — ${props.contact.name} 딜러가 추천하는 차량이에요.` : `${props.contact.name} 딜러 명함 · ${cardCompanyName(effectiveContact.value.company)}`, url: url.value }); status.value = "공유 창을 닫았어요."; }
  catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) await copy(); }
};
const saveImage = async () => {
  if (!valid()) return;
  busy.value = true; status.value = "";
  try { imageUrl.value = URL.createObjectURL(await cardPng(receiverContact.value, style.value)); status.value = "아래 이미지를 확인하고 PNG 파일로 저장하세요."; }
  catch { status.value = "이미지를 저장하지 못했어요. 링크 공유를 이용해 주세요."; }
  finally { busy.value = false; }
};
const saveContact = () => {
  if (!valid()) return;
  downloadBlob(new Blob([cardVcf(receiverContact.value, isFixed.value ? baseUrl.value : dealerUrl.value, style.value)], { type: "text/vcard;charset=utf-8" }), `${props.contact.name}-연락처.vcf`);
  status.value = "연락처 파일을 열면 주소록에 저장할 수 있어요.";
};
const reels = computed(() => (props.extras?.reels ?? []).filter((reel) => reel.poster).slice(0, 3));
const sns = computed(() => ({ instagram: cardFieldHref("instagram", style.value.fields.instagram) ?? props.extras?.sns?.instagram, youtube: cardFieldHref("youtube", style.value.fields.youtube) ?? props.extras?.sns?.youtube, tiktok: cardFieldHref("tiktok", style.value.fields.tiktok) ?? undefined }));
// 문자는 휴대폰 번호(01X)일 때만. 상사·단지 대표 일반전화(02-…)로는 문자를 보낼 수 없다.
const smsHref = computed(() => phoneHref.value && /^tel:(\+?82|0)1[016789]/.test(phoneHref.value) ? phoneHref.value.replace(/^tel:/, "sms:") : null);
const trust = computed(() => [props.extras?.rating ? `★ ${props.extras.rating.toFixed(1)}` : "", props.extras?.reviewCount ? `리뷰 ${props.extras.reviewCount.toLocaleString("ko-KR")}` : "", props.extras?.sold ? `판매완료 ${props.extras.sold.toLocaleString("ko-KR")}대` : ""].filter(Boolean));
const mapQuery = computed(() => effectiveContact.value.gallery || receiverContact.value.address);
const valuationUrl = computed(() => { const target = new URL(dealerUrl.value); target.searchParams.set("tab", "valuation"); return target.href; });
const sendConsult = (event: Event) => {
  event.preventDefault();
  const digits = consult.value.phone.replace(/\D/g, "");
  if (!/^01[016789]\d{7,8}$/.test(digits)) { consult.value = { ...consult.value, error: "휴대폰 번호를 확인해 주세요." }; return; }
  if (!consult.value.agree) { consult.value = { ...consult.value, error: "번호 전달에 동의해 주세요." }; return; }
  consult.value = { ...consult.value, sent: true, error: "" };
};
const openConsult = (car?: string) => { consult.value = { ...consult.value, car: car ?? consult.value.car, sent: false, error: "" }; consultOpen.value = true; window.setTimeout(() => document.querySelector(".dbc-consult")?.scrollIntoView({ block: "center", behavior: "smooth" }), 0); };
const resetConsult = () => { consultOpen.value = false; consult.value = { car: "", time: "언제든", phone: "", agree: false, sent: false, error: "" }; };
const priceStockUrl = (label?: string) => label ? stockUrl(window.location.href, props.shop, props.emp, label as Parameters<typeof stockUrl>[3]) : stockUrl(window.location.href, props.shop, props.emp);
const toggleField = (id: (typeof cardFields)[number]["id"], checked: boolean) => { const fields = { ...style.value.fields }; if (checked) fields[id] = ""; else delete fields[id]; updateStyle({ ...style.value, fields }); };
const onLogo = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0]; input.value = ""; if (!file) return;
  logoBusy.value = true;
  try { const logo = await loadCardLogo(file); draftChanged = true; const next = { ...style.value, logo }; try { localStorage.setItem(key.value, serializeCardStyle(next)); } catch { /* Session only. */ } style.value = next; status.value = ""; }
  catch (error) { status.value = error instanceof Error ? error.message : "로고를 불러올 수 없어요."; }
  finally { logoBusy.value = false; }
};
const finishEdit = () => { if (!valid()) return; editing.value = false; status.value = ""; imageUrl.value = ""; manualLink.value = false; };
const startEdit = () => { editing.value = true; moreShare.value = false; status.value = ""; imageUrl.value = ""; manualLink.value = false; };

// ── Radix Dialog 대신 ──
const titleId = `dbc-title-${Math.random().toString(36).slice(2, 8)}`;
const descId = `${titleId}-desc`;
const contentId = `${titleId}-content`;
let triggerEl: HTMLElement | null = null;
let previousOverflow = "";
const setOpen = (value: boolean) => {
  // 리액트 onOpenChange 와 같이 열고 닫을 때마다 창 안 상태를 비운다
  open.value = value; editing.value = false; moreShare.value = false; shareCar.value = undefined; consultOpen.value = false; qrUrl.value = ""; imageUrl.value = ""; status.value = ""; manualLink.value = false;
};
watch(open, async (value) => {
  if (value) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    await nextTick();
    const first = dialogRef.value?.querySelector<HTMLElement>("a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex='-1'])");
    (first ?? dialogRef.value)?.focus();
  } else {
    document.body.style.overflow = previousOverflow;
    if (triggerEl?.isConnected) triggerEl.focus();
  }
});
onBeforeUnmount(() => { if (open.value) document.body.style.overflow = previousOverflow; });
const onOverlayDown = () => setOpen(false);
const reload = () => window.location.reload();

// trigger slot 의 요소에 Dialog.Trigger 속성을 붙인다(asChild)
const TriggerSlot = () => {
  const nodes = slots.trigger?.() as VNode[] | undefined;
  const extra = { onClick: (event: MouseEvent) => { triggerEl = event.currentTarget as HTMLElement; setOpen(!open.value); }, "aria-haspopup": "dialog", "aria-expanded": open.value, "aria-controls": contentId, "data-state": open.value ? "open" : "closed" };
  if (nodes?.length) return nodes.map((node) => cloneVNode(node, extra, true));
  return h("button", { type: "button", class: "dp-businesscard-trigger", ...extra }, ["명함 만들기 · 공유 ", h("span", { "aria-hidden": "true" }, "↗")]);
};
</script>

<template>
  <!-- 서버 명함 확인 필요(cardServiceLive 가 false 인 지금은 나오지 않는다) -->
  <main v-if="requiresPublished && (!published || serverError)" class="dbc-page"><div class="dbc-page-wrap"><a class="dbc-home" :href="dealerUrl">← 판매자 페이지</a><header><h1>{{ contact.name }} · {{ cardCompanyName(effectiveContact.company) }}</h1></header><p role="status">{{ serverError || "최신 명함을 불러오고 있어요." }}</p><button v-if="serverError" type="button" class="dbc-publish" @click="reload">다시 불러오기</button></div></main>
  <template v-else>
    <TriggerSlot v-if="!standalone" />
    <Teleport to="body" :disabled="standalone">
      <template v-if="standalone || open">
        <div v-if="!standalone" class="dbc-overlay" data-state="open" @pointerdown="onOverlayDown" />
        <component :is="standalone ? 'main' : 'div'" ref="dialogRef" v-bind="standalone ? { class: 'dbc-page' } : { id: contentId, class: 'dbc-dialog', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': titleId, 'aria-describedby': descId, 'data-state': 'open', tabindex: -1 }" @keydown="(event: KeyboardEvent) => { if (!standalone) handleDialogKeyDown(event, () => setOpen(false)) }">
          <header v-if="!standalone" class="dbc-dialog-head"><div><h2 :id="titleId">{{ editing ? "명함 편집" : `${contact.name} · ${cardCompanyName(effectiveContact.company)}` }}</h2><p :id="descId" class="dbc-sr-only">{{ editing ? "명함 정보를 수정하고 편집 완료를 눌러 주세요." : "고객에게 보낼 명함을 확인하고 카카오톡으로 보내세요." }}</p></div><button v-if="!editing" type="button" class="dbc-head-edit" :disabled="logoBusy" @click="startEdit">편집</button><button type="button" aria-label="명함 닫기" @click="setOpen(false)">×</button></header>
          <div :class="standalone ? 'dbc-page-wrap' : 'dbc-dialog-body'">
            <template v-if="standalone"><div class="dbc-page-top"><a class="dbc-home" :href="dealerUrl">← 판매자 페이지</a></div><header><h1>{{ contact.name }} · {{ cardCompanyName(effectiveContact.company) }}</h1><p>중고차 딜러 명함</p></header></template>
            <!-- content -->
            <div :class="`dbc-layout${editing ? ' is-editing' : ''}`">
              <a v-if="featured && !editing" class="dbc-featured" :href="featured.href" :aria-label="`${contact.name} 딜러가 보낸 차량 ${featured.title}`"><small>{{ contact.name }} 딜러가 보낸 차량</small><span class="dbc-featured-photo"><img :src="featured.image" alt="" /></span><b>{{ featured.title }}</b><strong>{{ featured.price }}</strong></a>
              <CardPreview :contact="receiverContact" :card-style="style" />
              <button v-if="featured && !editing" type="button" class="dbc-featured-ask" @click="openConsult(featured.title)">이 차 상담 남기기</button>
              <template v-if="!editing">
                <!-- 고객이 받는 명함(2026-10-22 국내외 딜러·중개사 명함 벤치마킹 적용):
                     ① 문의 차량 → ② 누가(명함) → ③ 믿을 만한지 → ④ 바로 연락 + 상담 남기기 → ⑤ 무슨 차가 있는지 → ⑥ 어디로 가면 되는지 → ⑦ 내 차 팔기 → ⑧ 쇼츠 → ⑨ 연락처 저장. -->
                <p v-if="trust.length || effectiveContact.gallery" class="dbc-trust" aria-label="딜러 확인 정보"><b v-if="effectiveContact.gallery" class="dbc-verified"><Ico name="verified" />{{ effectiveContact.gallery }} 등록 딜러</b><span v-for="item in trust" :key="item">{{ item }}</span></p>
                <div class="dbc-cta" role="group" aria-label="딜러에게 연락">
                  <a v-if="phoneHref" class="is-primary" :href="phoneHref"><Ico name="phone" />전화</a>
                  <button v-else-if="receiverContact.safe && receiverContact.phone" type="button" class="is-primary" @click="status = safePhoneNote(receiverContact.phone)"><Ico name="phone" />전화</button>
                  <button v-else type="button" @click="status = '등록된 전화번호가 없어요. 채팅으로 문의해 주세요.'"><Ico name="phone" />전화</button>
                  <a v-if="smsHref" :href="smsHref"><Ico name="sms" />문자</a>
                  <a :href="dealerUrl"><Ico name="chat" />채팅</a>
                </div>
                <section :class="`dbc-consult${consultOpen ? ' is-open' : ''}`" aria-label="상담 남기기">
                  <button v-if="!consultOpen" type="button" class="dbc-consult-open" @click="openConsult()"><Ico name="consult" /><span><b>전화가 어려우면 상담 남기기</b><small>번호를 남기면 딜러가 먼저 연락드려요</small></span><i aria-hidden="true">›</i></button>
                  <div v-else-if="consult.sent" class="dbc-consult-done" role="status"><b>상담 요청을 남겼어요</b><p>{{ contact.name }} 딜러가 {{ consult.time === "언제든" ? "확인하는 대로" : `${consult.time}에` }} 연락드릴 거예요.</p><small>시안 화면이라 실제로 전달되지는 않아요.</small><button type="button" @click="resetConsult">닫기</button></div>
                  <form v-else class="dbc-consult-form" novalidate @submit="sendConsult">
                    <p class="dbc-consult-title"><Ico name="consult" />상담 남기기</p>
                    <label>관심 차량<select :value="consult.car" @change="consult = { ...consult, car: ($event.target as HTMLSelectElement).value }"><option value="">아직 정하지 않았어요</option><option v-for="car in extras?.listings ?? []" :key="car.id" :value="car.title">{{ car.title }}</option></select></label>
                    <fieldset><legend>연락받을 시간</legend><div class="dbc-consult-times"><button v-for="time in contactTimes" :key="time" type="button" :aria-pressed="consult.time === time" @click="consult = { ...consult, time }">{{ time }}</button></div></fieldset>
                    <label>휴대폰 번호<input type="tel" inputmode="tel" autocomplete="tel" :maxlength="13" placeholder="010-0000-0000" :value="consult.phone" @input="consult = { ...consult, phone: ($event.target as HTMLInputElement).value, error: '' }" /></label>
                    <label class="dbc-consult-agree"><input type="checkbox" :checked="consult.agree" @change="consult = { ...consult, agree: ($event.target as HTMLInputElement).checked, error: '' }" /><span>상담을 위해 번호를 {{ contact.name }} 딜러에게 전달하는 데 동의해요</span></label>
                    <p v-if="consult.error" class="dbc-consult-error" role="alert">{{ consult.error }}</p>
                    <div class="dbc-consult-actions"><button type="button" @click="consultOpen = false">취소</button><button type="submit">상담 남기기</button></div>
                  </form>
                </section>
                <section v-if="contact.listingCount" class="dbc-stock" aria-label="판매차량">
                  <a class="dbc-stock-head" :href="priceStockUrl()"><b>판매차량 {{ contact.listingCount ?? 0 }}대</b><span>전체 보기 <i aria-hidden="true">›</i></span></a>
                  <div v-if="extras?.categories?.length" class="dbc-stock-chips"><a v-for="item in extras.categories" :key="item.label" :href="priceStockUrl(item.label)">{{ item.label }}<span>{{ item.count }}</span></a></div>
                  <div v-if="extras?.listings?.length" class="dbc-stock-thumbs"><a v-for="car in extras.listings.filter((car) => car.id !== featured?.id).slice(0, 3)" :key="car.id" :href="car.href"><span class="dbc-stock-photo"><img :src="car.image" alt="" loading="lazy" /></span><b>{{ car.title }}</b><strong>{{ car.price }}</strong></a></div>
                </section>
                <section v-if="mapQuery" class="dbc-visit" aria-label="방문 안내">
                  <p class="dbc-visit-place"><Ico name="location" /><span><b>{{ effectiveContact.gallery || "방문 안내" }}</b><small>{{ receiverContact.address }}</small></span></p>
                  <div class="dbc-visit-maps"><a :href="`https://map.kakao.com/link/search/${encodeURIComponent(mapQuery)}`" target="_blank" rel="noopener noreferrer">카카오맵 길찾기</a><a :href="`https://map.naver.com/p/search/${encodeURIComponent(mapQuery)}`" target="_blank" rel="noopener noreferrer">네이버지도 길찾기</a></div>
                </section>
                <a class="dbc-row-link" :href="valuationUrl"><Ico name="valuation" /><span><b>내 차 팔 때 시세 견적 받기</b><small>{{ contact.name }} 딜러가 무료로 견적을 드려요</small></span><i aria-hidden="true">›</i></a>
                <section v-if="reels.length || sns.instagram || sns.youtube || sns.tiktok" class="dbc-sns" aria-label="SNS">
                  <p class="dbc-sns-title">SNS</p>
                  <div v-if="reels.length" class="dbc-reels"><a v-for="reel in reels" :key="reel.href" :href="reel.href" target="_blank" rel="noopener noreferrer" :aria-label="`${reel.label ?? '인스타그램 릴스'} 보기`"><img :src="reel.poster" alt="" loading="lazy" /><span aria-hidden="true">▶</span></a></div>
                  <div class="dbc-sns-links"><a v-if="sns.instagram" :href="sns.instagram" target="_blank" rel="noopener noreferrer">인스타그램</a><a v-if="sns.youtube" :href="sns.youtube" target="_blank" rel="noopener noreferrer">유튜브</a><a v-if="sns.tiktok" :href="sns.tiktok" target="_blank" rel="noopener noreferrer">틱톡</a></div>
                </section>
                <button type="button" class="dbc-save-contact" @click="saveContact"><Ico name="contact" />연락처 저장</button>
              </template>
              <div v-if="!standalone && editing" class="dbc-editor">
                <fieldset class="dbc-brand-editor"><legend>단지 · 상사 정보</legend>
                  <label>단지명<input type="text" :maxlength="80" placeholder="실제 소속 단지명" :value="effectiveContact.gallery ?? ''" @input="updateStyle({ ...style, gallery: ($event.target as HTMLInputElement).value })" /></label>
                  <label>상사명<input type="text" :maxlength="80" placeholder="실제 소속 상사명" :value="style.company ?? cardCompanyName(receiverContact.company)" @input="updateStyle({ ...style, company: ($event.target as HTMLInputElement).value })" /></label>
                </fieldset>
                <fieldset class="dbc-brand-editor"><legend>로고 · 타이틀</legend>
                  <div class="dbc-logo-edit"><img v-if="style.logo" :src="style.logo" alt="선택한 로고" /><label class="dbc-upload">{{ logoBusy ? "로고 불러오는 중…" : style.logo ? "로고 변경" : "로고 추가" }}<input type="file" accept="image/png,image/jpeg,image/webp" aria-label="로고 파일" :disabled="logoBusy" @change="onLogo" /></label><button v-if="style.logo" type="button" @click="updateStyle({ ...style, logo: '' })">로고 삭제</button><small>PNG·JPG·WebP · 최대 2MB</small></div>
                  <label>명함 타이틀<input type="text" :maxlength="30" :placeholder="cardCompanyName(effectiveContact.company)" :value="style.title" @input="updateStyle({ ...style, title: ($event.target as HTMLInputElement).value })" /></label>
                </fieldset>
                <fieldset class="dbc-optional"><legend>선택 정보 추가</legend><div v-for="{ id, label, placeholder } in cardFields" :key="id" class="dbc-optional-row"><label class="dbc-field-toggle"><input type="checkbox" :checked="style.fields[id] !== undefined" @change="toggleField(id, ($event.target as HTMLInputElement).checked)" />{{ label }}</label><label v-if="style.fields[id] !== undefined" class="dbc-field-input"><span class="dbc-sr-only">{{ label }} 입력</span><input :type="id === 'mobile' ? 'tel' : 'text'" :inputmode="id === 'mobile' ? 'tel' : 'text'" :maxlength="id === 'mobile' ? 30 : 180" autocomplete="off" :placeholder="placeholder" :value="style.fields[id]" @input="updateStyle({ ...style, fields: { ...style.fields, [id]: ($event.target as HTMLInputElement).value } })" /></label></div></fieldset>
                <fieldset><legend>명함 색상</legend><div class="dbc-swatches"><button v-for="(palette, theme) in cardThemes" :key="theme" type="button" :aria-pressed="style.theme === theme" @click="updateStyle({ ...style, theme: theme as CardStyle['theme'] })"><i :style="{ background: palette.background }" />{{ palette.label }}<span v-if="style.theme === theme" aria-hidden="true">✓</span></button></div></fieldset>
                <label>소개 문구<textarea :maxlength="60" :rows="2" :value="style.intro" @input="updateStyle({ ...style, intro: ($event.target as HTMLTextAreaElement).value.replace(/[\r\n]/g, ' ') })" /><small>{{ style.intro.length }}/60</small></label>
                <p>편집 내용은 이 기기에 임시 저장돼요. ‘고정 주소에 저장’을 누르면 관리자 확인 후 공개 명함에 반영돼요.</p>
                <button v-if="cardServiceLive" type="button" class="dbc-publish" :disabled="logoBusy" @click="publish">고정 주소에 저장 ↗</button>
                <button v-if="published && !isFixed" type="button" class="dbc-publish dbc-restore" @click="updateStyle(published.style)">공개 명함 내용 불러오기</button>
                <p v-if="serverError">{{ serverError }}</p>
              </div>
              <div v-if="imageUrl" class="dbc-export"><img :src="imageUrl" :alt="`${contact.name} 저장용 명함 이미지`" /><a :href="imageUrl" :download="`${contact.name}-명함.png`">PNG 다운로드</a></div>
              <label v-if="manualLink" class="dbc-manual-link">명함 링크<input readonly :value="url" @focus="($event.target as HTMLInputElement).select()" /></label>
              <p class="dbc-status" role="status">{{ status }}</p>
              <div v-if="!standalone && editing" class="dbc-edit-footer"><button type="button" class="dbc-edit-toggle" :disabled="logoBusy" @click="finishEdit">편집 완료</button></div>
            </div>
          </div>
          <!-- 명함 창 아래에 늘 붙어 있는 공유 막대: 카카오톡 하나를 크게, 나머지는 「더보기」로(2026-10-22 「공유하기 이런거 없잖아」). -->
          <section v-if="!editing" class="dbc-sharebar" aria-label="명함 공유">
            <div v-if="moreShare" class="dbc-share-more">
              <div v-if="!standalone && extras?.listings?.length" class="dbc-share-car"><p>함께 보낼 차량 <small>선택하면 명함 위에 이 차가 크게 보여요</small></p><div class="dbc-share-car-list"><button v-for="car in extras.listings" :key="car.id" type="button" :aria-pressed="shareCar === car.id" @click="shareCar = shareCar === car.id ? undefined : car.id"><img :src="car.image" alt="" loading="lazy" /><span>{{ car.title }}</span></button></div></div>
              <div class="dbc-share-icons"><button type="button" @click="share()"><Ico name="share" />다른 앱</button><button type="button" @click="copy"><Ico name="link" />링크 복사</button><button type="button" :disabled="qrBusy" @click="showQr"><span class="dbc-qr-mark" aria-hidden="true" />{{ qrBusy ? "만드는 중" : "QR 코드" }}</button><button type="button" :disabled="busy" @click="saveImage"><Ico name="image" />{{ busy ? "만드는 중" : "이미지 저장" }}</button></div>
              <div v-if="qrUrl" class="dbc-qr"><img :src="qrUrl" :alt="`${contact.name} 딜러 모바일 명함 QR 코드`" /><p>카메라로 QR을 비추면 명함이 열려요.</p><a :href="qrUrl" :download="`${contact.name}-명함-QR.png`">QR 이미지 저장</a></div>
            </div>
            <div class="dbc-sharebar-row"><button type="button" class="dbc-kakao-main" @click="share(true)">{{ shareCar ? "카카오톡으로 차량+명함 보내기" : "카카오톡으로 명함 보내기" }}</button><button type="button" class="dbc-share-more-toggle" :aria-expanded="moreShare" @click="moreShare = !moreShare">{{ moreShare ? "닫기" : "더보기" }}</button></div>
          </section>
        </component>
      </template>
    </Teleport>
  </template>
</template>
