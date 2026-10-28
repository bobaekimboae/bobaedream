<script setup lang="ts">
// 리액트 src/prototype/register/BikeRegister.tsx 의 Vue 판(?register=bike).
// 선택지 상수 · 타입은 리액트 파일에서 export 하지 않아 이 파일에 옮겼다(keep in sync). 작은 부품은 ./bike/ 아래.
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";
import regionsKr from "@proto/data/regions-kr.json";
import { bbmCheckOptions } from "@proto/filters/bbm-filter-options";
import "@proto/register/bike-register.css";
import { AI_DESCRIPTION_LIMIT, generateBikeDescription } from "@proto/register/ai-description";
import { syncControlled } from "../../lib/controlled-input";
import { asset, chotot, digits, icons, samplePhoto, withComma } from "./bike/bike-register-icons";
import BikePills from "./bike/BikePills.vue";
import BikeSelectRow from "./bike/BikeSelectRow.vue";
import BikeDetailInput from "./bike/BikeDetailInput.vue";
import BikeBoxField from "./bike/BikeBoxField.vue";
import BikeFullPicker from "./bike/BikeFullPicker.vue";
import BikeBottomSheet from "./bike/BikeBottomSheet.vue";

type BikeModel = { code: string; name: string; genre?: string; cc_band?: string };
type BikeGroup = { code: string; name: string; models?: BikeModel[] };
type BikeMaker = {
  code: string;
  name: string;
  visible?: boolean;
  popular?: boolean;
  sort?: number;
  uses_groups?: boolean;
  groups?: BikeGroup[];
  models?: BikeModel[];
};
type PickerName = "maker" | "model" | "year" | "type" | "origin" | "fuel" | "transmission" | "color" | "ccBand" | "warranty" | "sido" | "district" | "motor" | "range" | "charge" | null;
type SheetName = "address" | "draft" | "gallery" | "photoRules" | "docInfo" | "options" | null;

const yearOptions = [...Array.from({ length: 47 }, (_, index) => `${2026 - index}년`), "1979년 이전"];
const bikeTypeOptions = ["스쿠터", "네이키드", "스포츠", "크루저", "투어러", "멀티퍼퍼스", "클래식", "오프로드", "언더본·비즈니스", "삼륜", "ATV", "기타"];
const ccBandOptions = ["50cc 이하", "51~125cc", "126~250cc", "251~400cc", "401~750cc", "751cc 이상"];
const originOptions = ["국산", "일본", "유럽", "미국", "중국", "대만", "기타"];
const showExtraSpecs = false;
const electricBand = "전기";
const fuelOptions = ["가솔린", "전기", "하이브리드", "기타"];
const transmissionOptions = ["수동", "자동(CVT)", "자동(DCT)", "전자제어 수동(E-Clutch)"];
const colorOptions = bbmCheckOptions.exteriorColor;
const bikeOptionGroups: Array<[string, string[]]> = [
  ["안전·주행", ["ABS", "트랙션 컨트롤(TCS)", "크루즈 컨트롤", "퀵시프터", "주행 모드", "LED 헤드라이트"]],
  ["편의", ["스마트키", "TFT 계기판", "블루투스·내비 연동", "USB 충전", "열선 그립", "열선 시트", "전동 스크린"]],
  ["수납·보호", ["사이드 케이스", "탑 케이스", "엔진 가드", "블랙박스"]],
];
const motorOptions = ["2,000W 미만", "2,000~2,999W", "3,000~3,999W", "4,000~5,000W", "5,000W 초과"];
const rangeOptions = ["100km 미만", "100~199km", "200~299km", "300~399km", "400~500km", "500km 초과"];
const chargeOptions = ["1시간 미만", "1~3시간", "4~6시간", "6시간 초과"];
const galleryCount = 23;
const warrantyOptions = ["1~6개월", "7~11개월", "1년", "2년", "3년", "3년 초과"];
const pinnedMakers = ["KR모터스(효성)", "디앤에이모터스(대림)"];
const maxPhotos = 10;
const titleMax = 50;
const priceMin = 10;
const priceMax = 99999;
const regionDistricts = regionsKr.districts as Record<string, string[]>;
const fieldMila = new URLSearchParams(window.location.search).get("field") === "mila";
const galleryPhotos = Array.from({ length: galleryCount }, (_, index) => samplePhoto(index));

const makers = shallowRef<BikeMaker[]>([]);
const picker = ref<PickerName>(null);
const toast = ref("");
const photos = ref<string[]>([]);
const description = ref("");
const title = ref("");
const price = ref("");
const sido = ref("");
const district = ref("");
const seller = ref("");
const condition = ref("");
const maker = ref("");
const model = ref("");
const year = ref("");
const type = ref("");
const mileage = ref("");
const ccBand = ref("");
const origin = ref("");
const fuel = ref("");
const transmission = ref("");
const color = ref("");
const options = ref<string[]>([]);
const optionDraft = ref<string[]>([]);
const warranty = ref("");
const docPhotos = ref<string[]>([]);
const docShow = ref(false);
const motor = ref("");
const battery = ref("");
const range = ref("");
const charge = ref("");
const gallerySelection = ref<string[]>([]);
const detailAddress = ref("");
const sheet = ref<SheetName>(null);
const addrDraft = ref({ sido: "", district: "", detail: "" });
const submitted = ref(false);
let photoCounter = 0;
// AI 설명 초안(초톳 「AI Viết giúp」)
const aiUsed = ref(0);
const aiLoading = ref(false);
const aiFilled = ref(false);
let aiSession = "";
let aiBase = "";
const descriptionRef = ref<HTMLTextAreaElement | null>(null);
const uploading = ref<Record<string, number>>({});

onMounted(() => {
  document.documentElement.classList.add("bbm-bike-register-page");
  if (!document.getElementById("bike-reg-reddit-sans")) {
    const link = document.createElement("link");
    link.id = "bike-reg-reddit-sans";
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Reddit+Sans:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }
  document.title = "바이크 매물 등록 - 보배드림";
  window.scrollTo(0, 0);
  fetch(asset("data/bike-catalog-1005/catalog.json"))
    .then((response) => response.json())
    .then((data) => { makers.value = (data.makers as BikeMaker[])
      .filter((item) => item.visible !== false)
      .sort((a, b) => {
        const ea = a.name === "기타 제조사" ? 1 : 0;
        const eb = b.name === "기타 제조사" ? 1 : 0;
        if (ea !== eb) return ea - eb;
        const pa = pinnedMakers.indexOf(a.name);
        const pb = pinnedMakers.indexOf(b.name);
        if (pa !== -1 || pb !== -1) return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb);
        return (a.sort ?? 999) - (b.sort ?? 999) || a.name.localeCompare(b.name, "ko");
      }); })
    .catch(() => { makers.value = []; });
});
onBeforeUnmount(() => document.documentElement.classList.remove("bbm-bike-register-page"));

// 시트·선택창을 열면 떠 있던 토스트를 바로 닫는다
watch([sheet, picker], ([s, p]) => { if (s || p) toast.value = ""; });
watch(toast, (value, _old, onCleanup) => {
  if (!value) return;
  const timer = window.setTimeout(() => { toast.value = ""; }, 2200);
  onCleanup(() => window.clearTimeout(timer));
});

const selectedMaker = computed(() => makers.value.find((item) => item.name === maker.value));
const modelOptions = computed(() => {
  const m = selectedMaker.value;
  return m?.uses_groups === false
    ? (m.models ?? m.groups?.flatMap((group) => group.models ?? []) ?? []).map((item) => item.name)
    : (m?.groups ?? []).map((item) => item.name);
});
const modelChoices = computed(() => modelOptions.value.length ? [...modelOptions.value, "기타 모델"] : modelOptions.value);
const modelInfo = (name: string) => {
  const group = selectedMaker.value?.groups?.find((item) => item.name === name);
  const list = group?.models ?? selectedMaker.value?.models?.filter((item) => item.name === name) ?? [];
  return list[0];
};

const errors = computed(() => ({
  photos: submitted.value && photos.value.length === 0,
  description: submitted.value && !description.value.trim() ? "매물 설명을 입력해 주세요" : "",
  title: submitted.value && !title.value.trim() ? "매물 제목을 입력해 주세요" : "",
  price: submitted.value && !price.value ? "판매 가격을 입력해 주세요" : price.value && (Number(price.value) < priceMin || Number(price.value) > priceMax) ? `${priceMin}만원 ~ ${priceMax.toLocaleString("ko-KR")}만원 사이로 입력해 주세요` : "",
  address: submitted.value && !sido.value ? "거래 지역을 선택해 주세요" : "",
  seller: submitted.value && !seller.value,
  condition: submitted.value && !condition.value,
  maker: submitted.value && !maker.value,
  model: submitted.value && !model.value,
  year: submitted.value && !year.value,
  type: submitted.value && !type.value,
  mileage: submitted.value && !mileage.value ? "주행거리를 입력해 주세요" : "",
}));

type PickerConf = { title: string; options: readonly string[]; selected: string; searchable?: boolean };
const pickerMap = computed<Record<Exclude<PickerName, null>, PickerConf>>(() => ({
  maker: { title: "제조사 선택", options: makers.value.map((item) => item.name), selected: maker.value, searchable: true },
  model: { title: "모델 선택", options: modelChoices.value, selected: model.value, searchable: true },
  year: { title: "연식 선택", options: yearOptions, selected: year.value, searchable: true },
  fuel: { title: "연료 선택", options: fuelOptions, selected: fuel.value },
  transmission: { title: "변속기 선택", options: transmissionOptions, selected: transmission.value },
  origin: { title: "원산지 선택", options: originOptions, selected: origin.value },
  ccBand: { title: "배기량 선택", options: ccBandOptions, selected: ccBand.value },
  color: { title: "색상 선택", options: colorOptions, selected: color.value },
  type: { title: "바이크 유형 선택", options: bikeTypeOptions, selected: type.value },
  warranty: { title: "보증 선택", options: warrantyOptions, selected: warranty.value },
  motor: { title: "모터 출력 선택", options: motorOptions, selected: motor.value },
  range: { title: "1회 충전 주행거리 선택", options: rangeOptions, selected: range.value },
  charge: { title: "충전 시간 선택", options: chargeOptions, selected: charge.value },
  sido: { title: "시/도 선택", options: regionsKr.sido as string[], selected: addrDraft.value.sido },
  district: { title: "구/군 선택", options: (regionDistricts[addrDraft.value.sido] ?? []) as string[], selected: addrDraft.value.district },
}));
const activePicker = computed(() => picker.value ? pickerMap.value[picker.value] : null);

const choose = (picked: string) => {
  const p = picker.value;
  const current = p ? pickerMap.value[p]?.selected : "";
  const value = p !== "sido" && p !== "district" && current === picked ? "" : picked;
  // 리액트 판은 같은 렌더의 값(바뀌기 전)을 읽으므로 먼저 읽어 둔다
  const prevType = type.value;
  const prevFuel = fuel.value;
  const prevCcBand = ccBand.value;
  if (p === "sido") { const draft = addrDraft.value; addrDraft.value = { ...draft, sido: value, district: draft.sido === value ? draft.district : "" }; }
  if (p === "district") addrDraft.value = { ...addrDraft.value, district: value };
  if (p === "maker") { maker.value = value; model.value = ""; }
  if (p === "model") {
    model.value = value;
    const info = modelInfo(value);
    if (info?.genre && !prevType) type.value = info.genre;
    if (info?.cc_band === electricBand) { if (!prevFuel) fuel.value = electricBand; }
    else if (info?.cc_band && !prevCcBand) ccBand.value = info.cc_band;
  }
  if (p === "ccBand") {
    ccBand.value = value;
    if (value === electricBand) fuel.value = electricBand;
    else if (prevFuel === electricBand) fuel.value = "";
  }
  if (p === "fuel") {
    fuel.value = value;
    if (value === electricBand) ccBand.value = electricBand;
    else if (prevCcBand === electricBand) ccBand.value = "";
  }
  if (p === "origin") origin.value = value;
  if (p === "transmission") transmission.value = value;
  if (p === "color") color.value = value;
  if (p === "year") year.value = value;
  if (p === "type") type.value = value;
  if (p === "warranty") warranty.value = value;
  if (p === "motor") motor.value = value;
  if (p === "range") range.value = value;
  if (p === "charge") charge.value = value;
  picker.value = null;
};

const openModel = () => { picker.value = maker.value ? "model" : "maker"; };
const addPhoto = () => {
  if (photos.value.length >= maxPhotos) { toast.value = `사진은 ${maxPhotos}장까지 올릴 수 있어요.`; return; }
  gallerySelection.value = []; sheet.value = "gallery";
};
const toggleGallery = (photo: string) => {
  const current = gallerySelection.value;
  if (current.includes(photo)) { gallerySelection.value = current.filter((item) => item !== photo); return; }
  if (photos.value.length + current.length >= maxPhotos) { toast.value = `사진은 ${maxPhotos}장까지 올릴 수 있어요.`; return; }
  gallerySelection.value = [...current, photo];
};
const applyGallery = () => {
  const added = gallerySelection.value;
  photos.value = [...photos.value, ...added];
  sheet.value = null;
  uploading.value = { ...uploading.value, ...Object.fromEntries(added.map((photo) => [photo, 0])) };
  added.forEach((photo, order) => {
    [25, 60, 99, 100].forEach((value, step) => window.setTimeout(() => { uploading.value = { ...uploading.value, [photo]: value }; }, 250 * (step + 1) + order * 200));
  });
};
const runAiDescription = async () => {
  if (aiLoading.value) return;
  if (!photos.value.length) { toast.value = "사진을 1장 이상 올리면 AI가 설명을 써 드려요."; return; }
  if (aiUsed.value >= AI_DESCRIPTION_LIMIT) { toast.value = `AI 작성은 ${AI_DESCRIPTION_LIMIT}번까지예요. 직접 작성해 주세요.`; return; }
  aiLoading.value = true;
  if (!aiFilled.value) aiBase = description.value;
  try {
    const result = await generateBikeDescription({ category: "bike", imageUris: photos.value, description: aiBase, maker: maker.value, model: model.value, year: year.value, type: type.value, mileage: mileage.value, ccBand: ccBand.value, condition: condition.value, seller: seller.value, sessionId: aiSession }, aiUsed.value);
    aiSession = result.sessionId;
    description.value = result.description;
    aiUsed.value += 1;
    aiFilled.value = true;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const box = descriptionRef.value;
      if (!box) return;
      box.focus({ preventScroll: true });
      box.setSelectionRange(box.value.length, box.value.length);
    }));
  } catch {
    toast.value = "설명을 만들지 못했어요. 다시 시도하거나 직접 작성해 주세요.";
  } finally {
    aiLoading.value = false;
  }
};
const addDocPhoto = () => {
  if (docPhotos.value.length >= 2) { toast.value = "서류 사진은 2장까지 올릴 수 있어요."; return; }
  docPhotos.value = [...docPhotos.value, samplePhoto(40 + photoCounter++)];
};
const isElectric = computed(() => fuel.value === electricBand);
const openAddress = () => { addrDraft.value = { sido: sido.value, district: district.value, detail: detailAddress.value }; sheet.value = "address"; };
const addrNeedsDistrict = computed(() => Boolean((regionDistricts[addrDraft.value.sido] ?? []).length));
const addrReady = computed(() => Boolean(addrDraft.value.sido) && (!addrNeedsDistrict.value || Boolean(addrDraft.value.district)));
const addrPreview = computed(() => [addrDraft.value.sido, addrDraft.value.district, addrDraft.value.detail.trim()].filter(Boolean).join(" "));
const applyAddress = () => {
  if (!addrReady.value) { toast.value = addrDraft.value.sido ? "구/군을 선택해 주세요." : "시/도를 선택해 주세요."; return; }
  sido.value = addrDraft.value.sido; district.value = addrDraft.value.district; detailAddress.value = addrDraft.value.detail.trim(); sheet.value = null;
};
const submit = () => {
  submitted.value = true;
  const required = [photos.value.length > 0, description.value.trim(), title.value.trim(), price.value, sido.value, seller.value, condition.value, maker.value, model.value, year.value, type.value, mileage.value];
  if (required.some((item) => !item) || errors.value.price) {
    toast.value = "필수 항목을 입력해 주세요.";
    // 리액트는 setTimeout 0 시점에 이미 다시 그려져 있다. Vue 는 nextTick 뒤에 오류 class 가 붙는다.
    void nextTick(() => window.setTimeout(() => document.querySelector(".bike-reg-page .is-error")?.scrollIntoView({ block: "center", behavior: "smooth" }), 0));
    return;
  }
  toast.value = "시안에서는 실제 등록을 진행하지 않습니다.";
};
const optionsSummary = computed(() => options.value.length ? (options.value.length > 2 ? `${options.value.slice(0, 2).join(", ")} 외 ${options.value.length - 2}개` : options.value.join(", ")) : "");
const toggleOptionDraft = (item: string) => { optionDraft.value = optionDraft.value.includes(item) ? optionDraft.value.filter((value) => value !== item) : [...optionDraft.value, item]; };
const aiLabel = computed(() => aiLoading.value ? "AI가 설명을 쓰는 중이에요" : aiFilled.value ? "AI로 다시 쓰기" : description.value.trim() ? "AI로 설명 다듬기" : "AI로 설명 쓰기");

const onDescriptionInput = (event: Event) => { description.value = (event.currentTarget as HTMLTextAreaElement).value; };
const onTitleInput = (event: Event) => { title.value = (event.currentTarget as HTMLInputElement).value; };
const onPriceInput = (event: Event) => {
  price.value = digits((event.currentTarget as HTMLInputElement).value).slice(0, 7);
  syncControlled(event, () => withComma(price.value));
};
const onDetailInput = (event: Event) => { addrDraft.value = { ...addrDraft.value, detail: (event.currentTarget as HTMLInputElement).value }; };
const draftDiscard = () => { sheet.value = null; history.back(); };
const draftSave = () => { sheet.value = null; toast.value = "시안에서는 임시저장을 지원하지 않습니다."; };
const applyOptions = () => { options.value = optionDraft.value; sheet.value = null; };
const openOptions = () => { optionDraft.value = options.value; sheet.value = "options"; };
</script>

<template>
  <div :class="`bike-reg-page${fieldMila ? ' is-field-mila' : ''}`">
    <div class="bike-reg-shell">
      <header class="bike-reg-header"><button type="button" aria-label="뒤로가기" @click="sheet = 'draft'"><img :src="icons.back" alt=""></button><h1>바이크 매물 등록</h1><button type="button" @click="toast = '시안에서는 임시저장을 지원하지 않습니다.'">임시저장</button></header>
      <main class="bike-reg-main">
        <section class="bike-reg-card">
          <div class="bike-reg-section-title"><h2>사진/영상<em>*</em></h2><button type="button" aria-label="사진 안내" @click="sheet = 'photoRules'"><img :src="icons.info" alt=""></button></div>
          <div :class="`bike-reg-media${errors.photos ? ' is-error' : ''}`">
            <button type="button" class="bike-reg-media__add" aria-label="사진/영상 추가" @click="addPhoto"><img :src="icons.upload" alt=""></button>
            <div v-for="(photo, index) in photos" :key="`${photo}-${index}`" class="bike-reg-media__thumb">
              <img class="bike-reg-media__image" :src="photo" :alt="`사진 ${index + 1}`">
              <button type="button" class="bike-reg-media__delete" :aria-label="`사진 ${index + 1} 삭제`" @click="photos = photos.filter((_, i) => i !== index)"><img :src="icons.photoDelete" alt=""></button>
              <span v-if="index === 0" class="bike-reg-media__cover">대표</span>
              <span v-if="(uploading[photo] ?? 100) < 100" class="bike-reg-media__progress">{{ uploading[photo] }}%</span>
            </div>
          </div>
          <p :class="`bike-reg-media-hint${errors.photos ? ' is-error' : ''}`">{{ errors.photos ? "사진을 1장 이상 올려 주세요" : `길게 눌러 사진 순서를 바꿀 수 있어요 · ${photos.length}/${maxPhotos}` }}</p>

          <div class="bike-reg-ai">
            <button type="button" class="bike-reg-ai__button" :disabled="aiLoading" :aria-busy="aiLoading" @click="runAiDescription">
              <span class="bike-reg-ai__spark" aria-hidden="true" />{{ aiLabel }}
            </button>
            <span class="bike-reg-ai__count">{{ AI_DESCRIPTION_LIMIT - aiUsed }}/{{ AI_DESCRIPTION_LIMIT }}회 남음</span>
          </div>
          <BikeBoxField label="매물 설명" :class-name="`is-textarea${aiLoading ? ' is-ai-loading' : ''}`" :filled="Boolean(description)" :error="errors.description">
            <textarea ref="descriptionRef" maxlength="1500" :value="description" :readonly="aiLoading" placeholder="바이크의 상태와 특징을 자세히 알려주세요." @input="onDescriptionInput" />
          </BikeBoxField>
          <p v-if="aiFilled" class="bike-reg-ai__note">AI가 사진과 입력한 정보로 쓴 초안이에요. 사실과 다른 부분은 고쳐 주세요.</p>
          <p class="bike-reg-counter is-description">{{ description.length }}/1500자</p>
          <BikeBoxField label="매물 제목" :filled="Boolean(title)" :error="errors.title">
            <input :maxlength="titleMax" :value="title" placeholder="예: 혼다 PCX 125 무사고" @input="onTitleInput">
            <button v-if="title" type="button" class="bike-reg-field__clear" aria-label="매물 제목 지우기" @click.prevent="title = ''"><img :src="icons.clear" alt=""></button>
          </BikeBoxField>
          <p class="bike-reg-counter">{{ title.length }}/{{ titleMax }}자</p>
          <BikeBoxField label="판매가격" :filled="Boolean(price)" :error="errors.price">
            <input inputmode="numeric" :value="withComma(price)" placeholder="가격 입력" @input="onPriceInput">
            <b class="bike-reg-field__unit">만원</b>
          </BikeBoxField>
          <div :class="`bike-reg-field is-select${sido ? ' has-value' : ''}${errors.address ? ' is-error' : ''}`">
            <button type="button" class="bike-reg-field__box" @click="openAddress">
              <span class="bike-reg-field__label">거래지역<em>*</em></span>
              <span :class="`bike-reg-field__value${sido ? '' : ' is-empty'}`">{{ sido ? [sido, district, detailAddress].filter(Boolean).join(" ") : "" }}</span>
              <img class="bike-reg-field__caret" :src="icons.caret" alt="">
            </button>
            <p v-if="errors.address" class="bike-reg-error">{{ errors.address }}</p>
          </div>
          <div :class="`bike-reg-inline${errors.seller ? ' is-error' : ''}`"><span>판매자 유형<em>*</em></span><BikePills :value="seller" :options="['개인', '바이크샵']" @change="seller = $event" /></div>
        </section>

        <section class="bike-reg-card bike-reg-detail">
          <h2><img :src="icons.detail" alt="">상세 정보</h2>
          <BikeSelectRow label="카테고리" value="바이크" required fixed />
          <div class="bike-reg-doc">
            <div class="bike-reg-doc__head"><span>이륜차 사용신고필증</span><button type="button" aria-label="서류 안내" @click="sheet = 'docInfo'"><img :src="icons.info" alt=""></button></div>
            <div class="bike-reg-doc__photos">
              <button type="button" class="bike-reg-doc__add" aria-label="서류 사진 추가" @click="addDocPhoto"><img :src="chotot('image.svg')" alt=""></button>
              <div v-for="(photo, index) in docPhotos" :key="`${photo}-${index}`" class="bike-reg-doc__thumb"><img :src="photo" :alt="`서류 사진 ${index + 1}`"><button type="button" :aria-label="`서류 사진 ${index + 1} 삭제`" @click="docPhotos = docPhotos.filter((_, i) => i !== index)"><img :src="icons.photoDelete" alt=""></button></div>
            </div>
            <label class="bike-reg-check"><span>매물에 서류 사진 표시</span><input type="checkbox" :checked="docShow" @change="docShow = ($event.currentTarget as HTMLInputElement).checked"><i aria-hidden="true" /></label>
          </div>
          <div :class="`bike-reg-condition${errors.condition ? ' is-error' : ''}`"><span>상태<em>*</em></span><BikePills :value="condition" :options="['중고', '신차']" @change="condition = $event" /></div>
          <BikeSelectRow label="제조사" :value="maker" required :error="errors.maker" @click="picker = 'maker'" />
          <BikeSelectRow label="모델" :value="model" required :error="errors.model" :muted="!maker" :placeholder="maker ? '선택' : '제조사 선택 후 선택 가능'" @click="openModel" />
          <BikeSelectRow label="연식" :value="year" required :error="errors.year" @click="picker = 'year'" />
          <BikeSelectRow label="바이크 유형" :value="type" required :error="errors.type" @click="picker = 'type'" />
          <BikeDetailInput label="주행거리" :value="mileage" unit="km" required pencil :error="errors.mileage" @change="mileage = $event" />
          <BikeSelectRow label="원산지" :value="origin" @click="picker = 'origin'" />
          <template v-if="showExtraSpecs">
            <BikeSelectRow label="연료" :value="fuel" @click="picker = 'fuel'" />
            <BikeSelectRow label="변속기" :value="transmission" @click="picker = 'transmission'" />
          </template>
          <BikeSelectRow label="배기량" :value="ccBand" @click="picker = 'ccBand'" />
          <template v-if="showExtraSpecs">
            <BikeSelectRow label="색상" :value="color" @click="picker = 'color'" />
            <BikeSelectRow label="옵션" :value="optionsSummary" @click="openOptions" />
          </template>
          <template v-if="isElectric">
            <BikeSelectRow label="모터 출력" :value="motor" @click="picker = 'motor'" />
            <div class="bike-reg-condition"><span>배터리 포함</span><BikePills :value="battery" :options="['없음', '있음']" @change="battery = $event" /></div>
            <BikeSelectRow label="1회 충전 주행거리" :value="range" @click="picker = 'range'" />
            <BikeSelectRow label="충전 시간" :value="charge" @click="picker = 'charge'" />
          </template>
          <BikeSelectRow label="보증" :value="warranty" @click="picker = 'warranty'" />
        </section>
      </main>
      <footer class="bike-reg-actions"><button type="button" @click="toast = '시안에서는 미리보기를 지원하지 않습니다.'">미리보기</button><button type="button" @click="submit">매물 등록</button></footer>
    </div>
    <BikeBottomSheet v-if="sheet === 'address'" title="거래 지역" @close="sheet = null">
      <div class="bike-reg-address">
        <div :class="`bike-reg-field is-select${addrDraft.sido ? ' has-value' : ''}`"><button type="button" class="bike-reg-field__box" @click="picker = 'sido'"><span class="bike-reg-field__label">시/도<em>*</em></span><span :class="`bike-reg-field__value${addrDraft.sido ? '' : ' is-empty'}`">{{ addrDraft.sido }}</span><img class="bike-reg-field__caret" :src="icons.caret" alt=""></button></div>
        <div :class="`bike-reg-field is-select${addrDraft.district || (addrDraft.sido && !addrNeedsDistrict) ? ' has-value' : ''}`"><button type="button" class="bike-reg-field__box" :disabled="!addrNeedsDistrict" @click="picker = 'district'"><span class="bike-reg-field__label">구/군<em v-if="addrNeedsDistrict">*</em></span><span :class="`bike-reg-field__value${addrDraft.district ? '' : ' is-empty'}`">{{ addrDraft.district || (addrDraft.sido && !addrNeedsDistrict ? "구/군 없음" : "") }}</span><img class="bike-reg-field__caret" :src="icons.caret" alt=""></button></div>
        <div class="bike-reg-field is-plain"><label class="bike-reg-field__box"><input :value="addrDraft.detail" maxlength="40" placeholder="상세 주소(선택)" @input="onDetailInput"><button v-if="addrDraft.detail" type="button" class="bike-reg-field__clear" aria-label="상세 주소 지우기" @click.prevent="addrDraft = { ...addrDraft, detail: '' }"><img :src="icons.clear" alt=""></button></label></div>
        <div class="bike-reg-address__preview"><img :src="icons.pin" alt=""><p><strong>매물에 표시될 주소</strong>{{ addrPreview || "시/도와 구/군을 선택해 주세요" }}</p></div>
      </div>
      <template #footer><button type="button" class="is-primary is-wide" @click="applyAddress">완료</button></template>
    </BikeBottomSheet>
    <BikeBottomSheet v-if="sheet === 'draft'" title="임시저장할까요?" @close="sheet = null">
      <p class="bike-reg-sheet__text">작성 중인 매물을 저장해 두고 나중에 이어서 등록해요.</p>
      <template #footer><button type="button" class="is-outline" @click="draftDiscard">저장 안 함</button><button type="button" class="is-primary" @click="draftSave">임시저장</button></template>
    </BikeBottomSheet>
    <section v-if="sheet === 'gallery'" class="bike-reg-gallery" role="dialog" aria-modal="true" aria-label="사진 고르기">
      <header><button type="button" aria-label="닫기" @click="sheet = null"><img :src="icons.close" alt=""></button><h2>전체 사진<img :src="icons.caret" alt=""></h2><span /></header>
      <div class="bike-reg-gallery__grid">
        <!-- 임시: 초톳 카메라 아이콘 원본이 180개 묶음에 없음 -->
        <button type="button" class="bike-reg-gallery__camera" @click="toast = '시안에서는 카메라를 열지 않습니다.'"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 5.5 9.8 3.8c.2-.2.4-.3.7-.3h3c.3 0 .5.1.7.3l1.3 1.7H19a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7.5a2 2 0 0 1 2-2h3.5Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" /><circle cx="12" cy="12.5" r="3.6" fill="none" stroke="currentColor" stroke-width="1.6" /></svg>카메라</button>
        <button v-for="photo in galleryPhotos" :key="photo" type="button" :class="`bike-reg-gallery__item${gallerySelection.indexOf(photo) >= 0 ? ' is-selected' : ''}`" :aria-pressed="gallerySelection.indexOf(photo) >= 0" @click="toggleGallery(photo)"><img :src="photo" alt=""><i>{{ gallerySelection.indexOf(photo) >= 0 ? gallerySelection.indexOf(photo) + 1 : null }}</i></button>
      </div>
      <footer>
        <p class="bike-reg-gallery__tip">팁: 왼쪽 옆모습이 잘 보이는 사진을 대표 사진으로 올려 주세요.</p>
        <div class="bike-reg-gallery__bar">
          <div class="bike-reg-gallery__picked"><template v-if="gallerySelection.length"><span v-for="photo in gallerySelection" :key="photo"><img :src="photo" alt=""><button type="button" aria-label="선택 해제" @click="toggleGallery(photo)"><img :src="icons.photoDelete" alt=""></button></span></template><small v-else>사진을 골라 주세요 · 최대 {{ maxPhotos - photos.length }}장</small></div>
          <button type="button" class="bike-reg-gallery__next" :disabled="!gallerySelection.length" @click="applyGallery">다음{{ gallerySelection.length ? ` ${gallerySelection.length}` : "" }}</button>
        </div>
      </footer>
    </section>
    <BikeBottomSheet v-if="sheet === 'options'" title="옵션" @close="sheet = null">
      <div class="bike-reg-options">
        <section v-for="[group, items] in bikeOptionGroups" :key="group">
          <h3>{{ group }}</h3>
          <label v-for="item in items" :key="item" class="bike-reg-check"><span>{{ item }}</span><input type="checkbox" :checked="optionDraft.includes(item)" @change="toggleOptionDraft(item)"><i aria-hidden="true" /></label>
        </section>
      </div>
      <template #footer><button type="button" class="is-outline" :disabled="!optionDraft.length" @click="optionDraft = []">초기화</button><button type="button" class="is-primary" @click="applyOptions">{{ optionDraft.length ? `${optionDraft.length}개 선택 완료` : "선택 완료" }}</button></template>
    </BikeBottomSheet>
    <BikeBottomSheet v-if="sheet === 'photoRules'" title="사진 등록 규칙" @close="sheet = null">
      <div class="bike-reg-rules">
        <h3><span class="is-ok" aria-hidden="true">✓</span>권장</h3>
        <p>판매하는 바이크를 직접 찍은 사진이 보는 사람에게 믿음을 줘요.</p>
        <div class="bike-reg-rules__photos"><img :src="samplePhoto(0)" alt="좋은 예 1"><img :src="samplePhoto(1)" alt="좋은 예 2"></div>
        <h3><span class="is-no" aria-hidden="true">−</span>올릴 수 없어요</h3>
        <p>다른 매물이나 예전 매물에 쓴 사진을 그대로 쓴 사진</p>
        <h3><span class="is-no" aria-hidden="true">−</span>올릴 수 없어요</h3>
        <p>링크, 전화번호, 글자, 업체 이름, 꾸밈 테두리가 들어간 사진</p>
        <h3><span class="is-no" aria-hidden="true">−</span>올릴 수 없어요</h3>
        <p>한 장에 5MB가 넘는 사진</p>
      </div>
      <template #footer><button type="button" class="is-primary" @click="sheet = null">확인</button></template>
    </BikeBottomSheet>
    <BikeBottomSheet v-if="sheet === 'docInfo'" title="서류 사진 안내" @close="sheet = null">
      <div class="bike-reg-rules">
        <h3>서류 사진 올리는 방법</h3>
        <p>이륜차 사용신고필증 앞면을 올려 주세요.</p>
        <ul><li>번호판과 소유자 이름·주민등록번호는 가려 주세요.</li><li>서류 사진을 매물에 보여줄지는 직접 고를 수 있어요.</li><li>서류가 없으면 비워 두어도 등록할 수 있어요.</li></ul>
      </div>
      <template #footer><button type="button" class="is-primary" @click="sheet = null">확인</button></template>
    </BikeBottomSheet>
    <BikeFullPicker v-if="activePicker" :title="activePicker.title" :options="activePicker.options" :selected="activePicker.selected" :searchable="activePicker.searchable" @close="picker = null" @select="choose" />
    <div v-if="toast" class="bike-reg-toast" role="status">{{ toast }}</div>
  </div>
</template>
