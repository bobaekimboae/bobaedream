<script setup lang="ts">
// 리액트 src/prototype/register/index.tsx 의 RegisterForm — 등록 폼.
// onBack → emit("back"), notify 는 함수 prop(리액트와 같은 이름).
// 리액트 안의 countModal · saleExtraModal · colorChip 함수는 같은 마크업의 작은 부품(CountSelectModal · SaleExtraModal · ColorChip)으로 옮겼다.
// 리액트 판에서도 지금은 CarRegisterPage 가 ChototParityRegister 만 그려 이 화면은 주소로 열리지 않는다(리액트와 같이 옮겨만 둔다).
import { ref, computed, watch, onBeforeUnmount } from "vue";
import { asset } from "@proto/data";
import { registerPhotoGuideHtml } from "@proto/register/header-html";
import {
  countOptions,
  descriptionDrafts,
  exteriorColors,
  levelGroups,
  mediaProhibitions,
  mockLookup,
  mockSellerPhone,
  monthOptions,
  optionGroups,
  registerIcons,
  seatColors,
  seatFinishes,
  subModels,
  yearOptions,
  formYearOptions,
} from "@proto/register/data";
import MobileHeader from "./MobileHeader.vue";
import CountSelectModal from "./CountSelectModal.vue";
import SaleExtraModal from "./SaleExtraModal.vue";
import ColorChip from "./ColorChip.vue";
import OptionSlot from "./OptionSlot.vue";
import InspectionPcModal from "./InspectionPcModal.vue";
import FloatInput from "./ui/FloatInput.vue";
import FloatSelect from "./ui/FloatSelect.vue";
import ChoiceGroup from "./ui/ChoiceGroup.vue";
import Checkbox from "./ui/Checkbox.vue";
import Pop from "./ui/Pop.vue";
import RegisterLayer from "./ui/RegisterLayer.vue";
import ValidationMessage from "./ui/ValidationMessage.vue";
import { syncControlled } from "../../lib/controlled-input";
import { cx, descriptionTemplate, emptySaleExtra, mockAddresses, parseSeat, photoSlots, type PopName, type SaleExtra } from "./register-local";

const props = defineProps<{ notify: (message: string) => void }>();
const emit = defineEmits<{ back: [] }>();
const notify = (message: string) => props.notify(message);

const pop = ref<PopName>(null);
const close = () => { pop.value = null; };
const subModel = ref(mockLookup.subModel);
const levelGroup = ref(mockLookup.levelGroup);
const level = ref(`${mockLookup.level} ${mockLookup.levelClass}`);
const openGroup = ref(mockLookup.levelGroup);
const openLevel = ref(mockLookup.level);
const seizure = ref(mockLookup.seizure);
const mortgage = ref(mockLookup.mortgage);
const color = ref("");
const seat = ref("");
const seatDraft = ref({ color: "", finish: "" });
const mileage = ref("");
const transmission = ref(mockLookup.transmission);
const warranty = ref("available");
const importType = ref("official");
const saleType = ref("direct");
const initialOptions = new Set(optionGroups.flatMap((group) => group.items.filter((item) => item.checked).map((item) => `${group.title}:${item.name}`)));
const options = ref<Set<string>>(initialOptions);
const optionDraft = ref<Set<string>>(initialOptions);
const optionTab = ref(optionGroups[0].title);
const photos = ref<Array<string | null>>(photoSlots.map(() => null));
const photoDraft = ref<Array<string | null>>(photos.value);
const photoGuideOpen = ref(false);
const saleCategory = ref("normal");
const lease = ref<SaleExtra>(emptySaleExtra("operating"));
const rent = ref<SaleExtra>(emptySaleExtra("succession"));
const price = ref("");
const address = ref({ base: "", detail: "" });
const addressDraft = ref({ base: "", detail: "" });
const addressLayer = ref(false);
const contact = ref(true);
const descTitle = ref("");
const descType = ref("direct");
const descBody = ref("");
const inspection = ref({ number: "", accident: "no", repair: "no" });
const inspectionDraft = ref(inspection.value);

const photoGuideHtml = registerPhotoGuideHtml.split("%ASSET%").join(asset(""));

const errors = computed(() => ({
  color: color.value ? "" : "색상을 선택해주세요.",
  seat: seat.value ? "" : "시트색상을 선택해주세요.",
  mileage: mileage.value ? "" : "주행거리를 입력해주세요.",
  price: price.value ? "" : "판매가격을 입력해주세요.",
  region: address.value.base ? "" : "거래지역을 입력해주세요.",
}));
const optionLabel = computed(() => {
  const firstOption = optionGroups.flatMap((group) => group.items.filter((item) => options.value.has(`${group.title}:${item.name}`)).map((item) => item.name))[0];
  return options.value.size ? (options.value.size > 1 ? `${firstOption} 외 ${options.value.size - 1}개` : firstOption) : "";
});
const photoCount = computed(() => photos.value.filter(Boolean).length);

watch(pop, (value, _prev, onCleanup) => {
  if (value !== "descload") return;
  const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
  document.addEventListener("keydown", onKey);
  onCleanup(() => document.removeEventListener("keydown", onKey));
});
watch(pop, (value) => { document.documentElement.classList.toggle("is-modal-scroll-locked", value !== null); }, { immediate: true });
onBeforeUnmount(() => document.documentElement.classList.remove("is-modal-scroll-locked"));

const submit = () => {
  const missing = Object.entries(errors.value).find(([, message]) => message);
  if (missing) {
    const target = document.querySelector(".bbm-register .is-validation-error");
    target?.scrollIntoView({ block: "center", behavior: "smooth" });
    notify(missing[1]);
    return;
  }
  notify("시안 목업이라 등록 요청을 보내지 않았습니다.");
};

const saleChoice = (value: string) => {
  saleCategory.value = value;
  if (value === "lease") pop.value = "lease";
  if (value === "rent") pop.value = "rent";
};
const patchSale = (kind: "lease" | "rent", next: Partial<SaleExtra>) => {
  const target = kind === "lease" ? lease : rent;
  target.value = { ...target.value, ...next };
};
const countRows = computed(() => [["seizure", "압류", seizure.value], ["mortgage", "저당", mortgage.value]] as const);
const setCount = (key: "seizure" | "mortgage", value: string) => { (key === "seizure" ? seizure : mortgage).value = value; };
const openSeat = () => { seatDraft.value = parseSeat(seat.value); pop.value = "seat"; };
const openOptions = () => { optionDraft.value = new Set(options.value); pop.value = "options"; };
const openPhotos = () => { photoDraft.value = photos.value; pop.value = "photos"; };
const openRegion = () => { addressDraft.value = address.value; addressLayer.value = false; pop.value = "region"; };
const pickDescType = (next: string) => { descType.value = next; if (next === "template" && !descBody.value) descBody.value = descriptionTemplate; };
const onDescBody = (event: Event) => { descBody.value = (event.currentTarget as HTMLTextAreaElement).value; syncControlled(event, () => descBody.value); };
const openInspection = () => { inspectionDraft.value = inspection.value; pop.value = window.matchMedia("(min-width: 769px)").matches ? "inspectionPc" : "inspection"; };
const pickSubModel = (name: string) => { subModel.value = name; close(); };
const requestModel = () => notify("제조사/모델 추가 요청은 정식 서비스에서 이용해 주세요.");
const pickLevel = (groupName: string, value: string) => { levelGroup.value = groupName; level.value = value; close(); };
const clickLevel = (groupName: string, item: { name: string; classes: string[] }) => {
  const levelOpen = openLevel.value === item.name;
  if (item.classes.length) openLevel.value = levelOpen ? "" : item.name; else pickLevel(groupName, item.name);
};
const applySeat = () => { seat.value = seatDraft.value.finish ? `${seatDraft.value.color} / ${seatDraft.value.finish}` : seatDraft.value.color; close(); };
const applyOptions = () => { options.value = new Set(optionDraft.value); close(); };
const onPhotoFile = (event: Event, index: number) => {
  const file = (event.currentTarget as HTMLInputElement).files?.[0];
  if (!file) return;
  const next = [...photoDraft.value];
  next[index] = URL.createObjectURL(file);
  photoDraft.value = next;
};
const applyPhotos = () => { photos.value = photoDraft.value; close(); };
const applyRegion = () => { if (addressDraft.value.base) address.value = addressDraft.value; close(); };
const pickAddress = (item: string) => { addressDraft.value = { ...addressDraft.value, base: item }; addressLayer.value = false; };
const onAddressDetail = (event: Event) => { addressDraft.value = { ...addressDraft.value, detail: (event.currentTarget as HTMLInputElement).value }; syncControlled(event, () => addressDraft.value.detail); };
const pickDraft = (draft: { title: string; body: string }) => { descTitle.value = draft.title; descBody.value = draft.body; descType.value = "direct"; close(); };
const onInspectionNumber = (event: Event) => { inspectionDraft.value = { ...inspectionDraft.value, number: (event.currentTarget as HTMLInputElement).value }; syncControlled(event, () => inspectionDraft.value.number); };
const inspectionRows = [["accident", "사고이력"], ["repair", "단순수리"]] as const;
const onInspectionFile = (event: Event, page: number) => { if ((event.currentTarget as HTMLInputElement).files?.length) notify(`목업: 기록부 ${page}쪽 사진 선택됨(업로드하지 않음)`); };
const applyInspection = () => { inspection.value = inspectionDraft.value; close(); };
const saleTypeOptions = [{ value: "direct", label: "직접매도(실차주)" }, { value: "broker-own", label: "매매알선(소속 상사 매물)" }, { value: "broker-other", label: "매매알선(타 상사 매물)" }, { value: "consignment", label: "위탁판매(개인/법인)" }];
</script>
<template>
  <section class="app-content-panel car-register-form-page">
    <section class="ui-app screen active" id="register-detail-page">
      <div class="register-detail-workspace">
        <MobileHeader title="매물 등록" class-name="register-detail-header" @back="emit('back')">
          <template #right><button type="button" class="register-detail-header__save" @click="notify('시안 목업이라 임시저장하지 않았습니다.')">임시저장</button></template>
        </MobileHeader>
        <main class="ui-app__main register-detail-main">
          <div class="register-detail-content">
            <div class="register-detail-vehicle-section">
              <div class="register-detail-vehicle-header">
                <img class="register-detail-vehicle-header-icon" :src="registerIcons.vehicleHeader" alt="" aria-hidden="true" />
                <span class="ui-text-heading-16">매물 정보</span>
              </div>
              <div class="register-detail-vehicle-body">
                <div class="register-detail-vehicle-grid">
                  <div class="frow vnum-row register-detail-field--full"><div class="fv-area"><FloatInput label="차량번호" required read-only :value="mockLookup.plate" /></div></div>
                  <div class="frow"><div class="fv-area"><FloatInput label="제조사" required read-only disabled chevron selected class-name="register-detail-modal-input" validation="maker" :value="mockLookup.maker" /></div></div>
                  <div class="frow"><div class="fv-area"><FloatInput label="모델" required read-only disabled chevron selected class-name="register-detail-modal-input" validation="group" :value="mockLookup.model" /></div></div>
                  <div class="frow">
                    <div class="fv-area register-detail-year-selects">
                      <FloatSelect label="연식" required disabled search validation="year" :value="mockLookup.year" :options="yearOptions" />
                      <FloatSelect label="월" required disabled validation="year" class-name="register-detail-month-select is-year-locked" :value="mockLookup.month" :options="monthOptions" />
                    </div>
                  </div>
                  <div class="frow"><div class="fv-area"><FloatSelect label="형식연도" required disabled search validation="form-year" :value="mockLookup.formYear" :options="formYearOptions" /></div></div>
                  <div class="frow"><div class="fv-area"><FloatInput label="세부모델" required read-only chevron selected class-name="register-detail-modal-input" validation="model" :value="subModel" show-open @open="pop = 'model'" /></div></div>
                  <div class="frow"><div class="fv-area"><FloatInput label="연료" required read-only disabled chevron selected class-name="register-detail-modal-input" validation="fuel" :value="mockLookup.fuel" /></div></div>
                  <div class="frow"><div class="fv-area"><FloatInput label="등급" required read-only chevron selected class-name="register-detail-modal-input" validation="level" :value="level" show-open @open="pop = 'level'" /></div></div>
                  <div class="frow register-detail-cc-row"><div class="fv-area register-detail-cc-field"><FloatInput label="배기량" required disabled numeric unit="CC" id="register-detail-cc" name="cc" :value="mockLookup.cc" /></div></div>
                  <div v-for="[key, label, value] in countRows" :key="key" class="frow">
                    <div class="fv-area">
                      <FloatSelect :label="label" required class-name="register-detail-count-select--desktop" :value="value" :options="countOptions" @change="setCount(key, $event)" />
                      <FloatInput :label="label" required read-only chevron class-name="register-detail-modal-input register-detail-count-select--mobile" :value="value" show-open @open="pop = key" />
                    </div>
                  </div>
                  <div class="frow"><div :class="cx('fv-area', errors.color && 'has-validation-message')"><FloatInput label="색상" required read-only chevron selected class-name="register-detail-modal-input" validation="exterior-color" :error="errors.color" :value="color" show-open @open="pop = 'color'" /><ValidationMessage :text="errors.color" /></div></div>
                  <div class="frow"><div :class="cx('fv-area', errors.seat && 'has-validation-message')"><FloatInput label="시트색상" required read-only chevron selected class-name="register-detail-modal-input" validation="seat-color" :error="errors.seat" :value="seat" show-open @open="openSeat" /><ValidationMessage :text="errors.seat" /></div></div>
                  <div class="frow"><div :class="cx('fv-area', errors.mileage && 'has-validation-message')"><FloatInput label="주행거리" required numeric unit="km" id="register-detail-sale-mileage" name="sale_mileage" :error="errors.mileage" :value="mileage" @change="mileage = $event" /><ValidationMessage :text="errors.mileage" /></div></div>
                  <div class="register-detail-choice-block register-detail-choice-block--transmission">
                    <span class="register-detail-choice-label is-required">변속기</span>
                    <ChoiceGroup name="register-detail-transmission" :value="transmission" :options="[{ value: 'auto', label: '자동' }, { value: 'manual', label: '수동', disabled: true }]" @change="transmission = $event" />
                  </div>
                  <div class="register-detail-choice-block">
                    <span class="register-detail-choice-label is-required">제조사 보증</span>
                    <ChoiceGroup name="register-detail-maker-warranty" :value="warranty" :options="[{ value: 'available', label: '보증가능' }, { value: 'expired', label: '보증만료' }]" @change="warranty = $event" />
                  </div>
                  <div class="register-detail-choice-block register-detail-field--full">
                    <span class="register-detail-choice-label is-required">수입구분</span>
                    <ChoiceGroup name="register-detail-import-type" :value="importType" :options="[{ value: 'official', label: '정식수입' }, { value: 'parallel', label: '병행수입' }]" @change="importType = $event" />
                  </div>
                  <div class="register-detail-choice-block register-detail-field--full register-detail-sale-type-row">
                    <span class="register-detail-choice-label is-required">매매유형</span>
                    <p class="register-detail-sale-type-guide">제시번호와 성능기록부가 없다면 '위탁판매'를 선택해 주세요.</p>
                    <div class="register-detail-sale-type-area">
                      <ChoiceGroup name="register-detail-sale-type" class-name="register-detail-sale-type-group" :value="saleType" :options="saleTypeOptions" @change="saleType = $event" />
                    </div>
                  </div>
                  <div class="frow register-detail-field--full"><div class="fv-area"><FloatInput label="옵션" read-only chevron selected class-name="register-detail-modal-input" :value="optionLabel" show-open @open="openOptions" /></div></div>
                </div>
              </div>
            </div>
            <div class="register-detail-photo-section">
              <p class="register-media-video-tip">영상을 등록하시면<br />조회수를 높일 수 있어요🔥</p>
              <div class="register-media-header">
                <h2 class="register-media-title">사진 및 영상</h2>
                <button type="button" class="register-media-prohibition-button" @click="pop = 'prohibit'">금지사항</button>
              </div>
              <div class="register-media-grid">
                <button type="button" class="register-media-action" @click="openPhotos"><img :src="registerIcons.mediaPhoto" alt="" aria-hidden="true" /><span>{{ photoCount ? `사진 ${photoCount}/20` : "사진 추가" }}</span></button>
                <button type="button" class="register-media-action" @click="notify('목업: 영상 업로드는 지원하지 않습니다.')"><img :src="registerIcons.mediaVideo" alt="" aria-hidden="true" /><span>영상 추가</span></button>
                <button type="button" class="register-media-action" @click="notify('목업: 외부영상 연결은 지원하지 않습니다.')"><img :src="registerIcons.mediaLink" alt="" aria-hidden="true" /><span>외부영상 추가</span></button>
              </div>
            </div>
            <div class="register-detail-sale-section">
              <div class="register-detail-sale-header"><span class="ui-text-heading-16">판매 정보</span></div>
              <div class="register-detail-sale-body">
                <div class="register-detail-sale-row register-detail-sale-category-row">
                  <span class="register-detail-sale-label is-required">판매구분</span>
                  <div class="register-detail-sale-value register-detail-sale-type">
                    <ChoiceGroup name="register-detail-sale-category" class-name="register-detail-sale-category-group" :value="saleCategory" :options="[{ value: 'normal', label: '일반' }, { value: 'lease', label: '리스승계' }, { value: 'rent', label: '렌트' }]" @change="saleChoice" />
                  </div>
                </div>
                <div class="register-detail-sale-row register-detail-sale-price-row">
                  <div :class="cx('register-detail-sale-value', errors.price && 'has-validation-message')">
                    <FloatInput label="판매가격" required numeric unit="만원" id="register-detail-sale-price" name="sale_price" :error="errors.price" :value="price" @change="price = $event" />
                    <ValidationMessage :text="errors.price" />
                  </div>
                </div>
                <div class="register-detail-sale-row register-detail-sale-region-row">
                  <div :class="cx('register-detail-sale-value', errors.region && 'has-validation-message')">
                    <FloatInput label="거래지역" required read-only chevron class-name="register-detail-sale-address-input" id="register-detail-sale-region-label" :error="errors.region" :value="[address.base, address.detail].filter(Boolean).join(' ')" show-open @open="openRegion" />
                    <ValidationMessage :text="errors.region" />
                  </div>
                </div>
                <div class="register-detail-sale-row register-detail-sale-contact-row">
                  <div class="register-detail-sale-contact-head">
                    <span class="register-detail-sale-label is-required">연락처</span>
                    <Checkbox size="md" class-name="register-detail-sale-contact-group" id="register-detail-sale-contact" name="register-detail-sale-contact" :checked="contact" :label="mockSellerPhone" @change="contact = $event" />
                  </div>
                  <ul class="register-detail-sale-help">
                    <li>개인정보 보호를 위해 050 안심번호로 표시됩니다.</li>
                    <li>미선택 시 채팅으로만 판매상담할 수 있습니다.</li>
                  </ul>
                </div>
              </div>
            </div>
            <div class="register-detail-sale-section register-detail-description-card">
              <div class="register-detail-sale-body">
                <div class="register-detail-description-section">
                  <div class="register-detail-description-header">
                    <span class="register-detail-description-title">상세설명</span>
                    <button type="button" class="register-detail-description-load" id="register-detail-description-list-trigger" @click="pop = 'descload'">내 설명글 불러오기<img class="register-detail-description-load__chevron" :src="registerIcons.chevronRight20" alt="" aria-hidden="true" /></button>
                  </div>
                  <FloatInput form-variant label="제목" id="register-detail-description-title" :max-length="40" :value="descTitle" @change="descTitle = $event" />
                  <div class="register-detail-description-type">
                    <span class="register-detail-description-type__label">유형선택</span>
                    <ChoiceGroup name="register-detail-description-type" class-name="register-detail-description-type__choices" :value="descType" :options="[{ value: 'direct', label: '직접입력' }, { value: 'template', label: '기본양식' }]" @change="pickDescType" />
                  </div>
                  <span :class="cx('ui-floating-label-textarea ui-floating-label-textarea--md', descBody && 'ui-floating-label-textarea--floating', 'register-detail-description-content')">
                    <span class="ui-floating-label-textarea__field">
                      <label class="ui-floating-label-textarea__label" for="register-detail-description-content">상세설명</label>
                      <textarea class="ui-floating-label-textarea__control" id="register-detail-description-content" name="register-detail-description-content" placeholder="" maxlength="2000" :value="descBody" @input="onDescBody" />
                    </span>
                    <span class="ui-floating-label-textarea__count"><span>{{ descBody.length }}</span>/2000</span>
                  </span>
                </div>
              </div>
            </div>
            <div class="register-detail-inspection-section">
              <button type="button" class="register-detail-inspection-header" aria-label="성능·상태 점검기록부 등록" @click="openInspection">
                <span class="register-detail-inspection-card-content">
                  <span class="register-detail-inspection-card-heading">
                    <span class="register-detail-inspection-title">성능 · 상태 점검기록부</span>
                    <span class="register-detail-inspection-chevron" aria-hidden="true"><img class="register-detail-inspection-header-icon" :src="registerIcons.chevronRight20" alt="" /></span>
                  </span>
                  <span class="register-detail-inspection-warning">
                    <span>딜러 회원(자동차매매업자)이 성능·상태점검기록부, 제시신고번호를 미기재 시 과태료가 부과됩니다.</span>
                    <span>(제84조 제4항 제21의3호 신설) 과태료 1차 50만 원, 2차 75만 원, 3차 100만 원 부과</span>
                  </span>
                </span>
              </button>
            </div>
            <section class="register-detail-service-section">
              <button type="button" class="register-detail-service-header" aria-label="부가서비스">
                <span class="register-detail-service-title">부가서비스</span>
                <span class="register-detail-service-chevron" aria-hidden="true"><img class="register-detail-service-chevron__icon" :src="registerIcons.chevronRight20" alt="" /></span>
              </button>
            </section>
          </div>
        </main>
      </div>
    </section>
    <footer class="register-detail-page-footer">
      <footer class="ui-bottom-action-bar ui-bottom-action-bar--stretch register-detail-footer">
        <button type="button" class="ui-btn ui-btn--outline ui-btn--xl ui-btn--mobile-md ui-btn--align-center ui-btn--full register-detail-footer__save pop-ft__button pop-ft__button--cancel" @click="notify('시안 목업이라 임시저장하지 않았습니다.')"><span class="ui-btn__label">임시저장</span></button>
        <button type="button" class="ui-btn ui-btn--primary ui-btn--xl ui-btn--mobile-md ui-btn--align-center ui-btn--full register-detail-footer__submit pop-ft__button pop-ft__button--confirm" @click="submit"><span class="ui-btn__label">등록하기</span></button>
      </footer>
    </footer>

    <Pop :open="pop === 'model'" title="세부모델 선택" class-name="register-vehicle-full-modal register-choice-apply-modal" body-class-name="register-detail-model-modal" @close="close">
      <div class="register-detail-model-list">
        <button v-for="item in subModels" :key="item.name" type="button" :class="cx('register-detail-model-list-item', item.name === subModel && 'sel')" @click="pickSubModel(item.name)">
          <span class="register-detail-model-list-item__thumb"><img class="register-detail-model-list-item__image" :src="asset(item.img)" alt="" /></span>
          <span class="register-detail-model-list-item__content"><span class="register-detail-model-list-item__name">{{ item.name }}</span></span>
        </button>
        <p class="register-vehicle-request-text">등록하려는 제조사/모델이 없나요?{{ " " }}<span @click="requestModel">제조사/모델 추가 요청하기</span></p>
      </div>
    </Pop>

    <Pop :open="pop === 'level'" title="등급 선택" class-name="register-vehicle-full-modal register-choice-apply-modal" body-class-name="register-level-modal" @close="close">
      <div class="register-level-list">
        <section v-for="(group, groupIndex) in levelGroups" :key="group.name" :class="cx('register-level-tree-group', openGroup === group.name && 'is-open')">
          <div :class="cx('register-level-tree-group__button', group.name === levelGroup && 'sel')" role="button" @click="openGroup = openGroup === group.name ? '' : group.name">
            <label class="ui-radio ui-radio--lg ui-radio--mobile-lg" @click.prevent>
              <input class="ui-radio__input" :id="`register-level-group-${groupIndex}`" type="radio" name="register-level-group" :checked="group.name === levelGroup" readonly />
              <span class="ui-radio__mark" />
              <span class="ui-radio__label">{{ group.name }}</span>
            </label>
          </div>
          <template v-if="openGroup === group.name">
            <div v-for="item in group.levels" :key="item.name" :class="cx('register-level-group', openLevel === item.name && 'is-open')">
              <div :class="cx('register-level-list-item', level.startsWith(item.name) && group.name === levelGroup && 'sel')" role="button" @click="clickLevel(group.name, item)">
                <label class="ui-checkbox ui-checkbox--square ui-checkbox--lg ui-checkbox--mobile-lg" @click.prevent>
                  <input class="ui-checkbox__input" type="checkbox" name="register-level" :checked="level.startsWith(item.name) && group.name === levelGroup" readonly />
                  <span class="ui-checkbox__mark"><i class="ui-checkbox__icon" /></span>
                  <span class="ui-checkbox__label">{{ item.name }}</span>
                </label>
              </div>
              <div v-if="openLevel === item.name && item.classes.length" class="register-level-class-list">
                <div v-for="name in item.classes" :key="name" :class="cx('register-level-class-list-item', level === `${item.name} ${name}` && 'sel')" role="button" @click="pickLevel(group.name, `${item.name} ${name}`)">
                  <label class="ui-checkbox ui-checkbox--square ui-checkbox--lg ui-checkbox--mobile-lg" @click.prevent>
                    <input class="ui-checkbox__input" type="checkbox" name="register-class" :checked="level === `${item.name} ${name}`" readonly />
                    <span class="ui-checkbox__mark"><i class="ui-checkbox__icon" /></span>
                    <span class="ui-checkbox__label">{{ name }}</span>
                  </label>
                </div>
              </div>
            </div>
          </template>
        </section>
        <p class="register-vehicle-request-text">등록하려는 제조사/모델이 없나요?{{ " " }}<span @click="requestModel">제조사/모델 추가 요청하기</span></p>
      </div>
    </Pop>

    <CountSelectModal kind="seizure" :open="pop === 'seizure'" :value="seizure" @pick="seizure = $event; close()" @close="close" />
    <CountSelectModal kind="mortgage" :open="pop === 'mortgage'" :value="mortgage" @pick="mortgage = $event; close()" @close="close" />

    <Pop :open="pop === 'color'" id="rd_p_color" title="차량 외장 색상 선택" class-name="register-choice-apply-modal register-color-modal register-vehicle-full-modal" body-class-name="register-color-select-modal" @close="close">
      <section class="register-color-select-section">
        <h2 class="register-color-select-title">대표 색상</h2>
        <div class="register-color-chip-grid"><ColorChip v-for="item in exteriorColors" :key="item.name" :item="item" :selected="color === item.name" @pick="color = item.name; close()" /></div>
      </section>
    </Pop>

    <Pop :open="pop === 'seat'" id="rd_p_color" title="차량 시트 색상 선택" class-name="register-choice-apply-modal register-color-modal" body-class-name="register-color-select-modal" @close="close">
      <section class="register-color-select-section">
        <h2 class="register-color-select-title">시트 색상</h2>
        <div class="register-color-chip-grid"><ColorChip v-for="item in seatColors" :key="item.name" :item="item" :selected="seatDraft.color === item.name" @pick="seatDraft = { ...seatDraft, color: item.name }" /></div>
      </section>
      <section class="register-color-select-section">
        <h2 class="register-color-select-title">시트 마감 (선택)</h2>
        <ChoiceGroup name="seat-finish" mobile="lg" class-name="register-color-finish-choice-group" :value="seatDraft.finish" :options="seatFinishes.map((name) => ({ value: name, label: name }))" @change="seatDraft = { ...seatDraft, finish: seatDraft.finish === $event ? '' : $event }" />
      </section>
      <template #footer>
        <div class="pop-ft">
          <button type="button" class="pop-ft__button pop-ft__button--cancel" @click="seatDraft = { color: '', finish: '' }">초기화</button>
          <button type="button" class="pop-ft__button pop-ft__button--confirm" :disabled="!seatDraft.color" @click="applySeat">색상 적용</button>
        </div>
      </template>
    </Pop>

    <Pop :open="pop === 'options'" id="rd_p_opt" title="차량 옵션" class-name="register-option-modal register-vehicle-full-modal pop-opt" raw-body @close="close">
      <OptionSlot :draft="optionDraft" :tab="optionTab" @set-draft="optionDraft = $event" @set-tab="optionTab = $event" />
      <template #footer>
        <div class="pop-ft">
          <button type="button" class="pop-ft__button pop-ft__button--cancel" @click="close">취소</button>
          <button type="button" class="pop-ft__button pop-ft__button--confirm" @click="applyOptions">선택완료{{ optionDraft.size }}</button>
        </div>
      </template>
    </Pop>

    <Pop :open="pop === 'prohibit'" title="사진 및 영상 금지사항" class-name="register-media-prohibition-modal" body-class-name="register-media-prohibition-modal__body" @close="close">
      <ul class="register-media-prohibition-list"><li v-for="item in mediaProhibitions" :key="item">{{ item }}</li></ul>
    </Pop>

    <Pop :open="pop === 'photos'" id="rd_p_images" title="차량사진" body-class-name="register-photo-modal-body" @close="close">
      <div class="register-photo-modal">
        <button type="button" class="ui-btn ui-btn--outline ui-btn--md ui-btn--mobile-sm ui-btn--align-center ui-btn--bordered register-photo-modal__guide-button" @click="photoGuideOpen = true">
          <span class="ui-btn__label ui-btn__label--with-icon">차량 촬영 가이드<span class="ui-btn__icon-right ui-btn__icon-right--chevron" /></span>
        </button>
        <ul class="register-photo-modal__guide">
          <li>권장 비율은 4:3 입니다.</li>
          <li>사진을 터치해 편집하거나, 길게 눌러 위치를 교환할 수 있습니다.</li>
          <li>홍보성 문구가 포함된 사진은 광고와 함께 삭제될 수 있습니다.</li>
        </ul>
        <div class="register-photo-modal__list">
          <label v-for="(label, index) in photoSlots" :key="index" :class="cx('register-photo-modal__item', photoDraft[index] && 'has-photo')">
            <input class="register-photo-modal__input" type="file" accept="image/*" hidden @change="onPhotoFile($event, index)" />
            <img v-if="photoDraft[index]" class="bbm-register-photo-preview" :src="photoDraft[index] ?? ''" :alt="label" />
            <span class="register-photo-modal__content"><i class="register-photo-modal__camera" /><span class="register-photo-modal__label">{{ label }}</span></span>
          </label>
        </div>
      </div>
      <template #footer>
        <div class="pop-ft">
          <button type="button" class="ui-btn ui-btn--outline ui-btn--xl ui-btn--mobile-md ui-btn--align-center ui-btn--bordered pop-ft__ui-button register-photo-modal__footer-button register-photo-modal__footer-button--cancel" @click="close"><span class="ui-btn__label">취소</span></button>
          <button type="button" class="ui-btn ui-btn--outline ui-btn--xl ui-btn--mobile-md ui-btn--align-center ui-btn--bordered pop-ft__ui-button register-photo-modal__footer-button register-photo-modal__footer-button--reset" :disabled="!photoDraft.some(Boolean)" @click="photoDraft = photoSlots.map(() => null)"><span class="ui-btn__label">초기화</span></button>
          <button type="button" class="ui-btn ui-btn--primary ui-btn--xl ui-btn--mobile-md ui-btn--align-center pop-ft__ui-button register-photo-modal__footer-button register-photo-modal__footer-button--confirm" @click="applyPhotos"><span class="ui-btn__label">등록하기</span></button>
        </div>
      </template>
    </Pop>

    <Pop :open="photoGuideOpen" id="rd_p_photo_guide" title="사진 촬영 가이드" raw-body @close="photoGuideOpen = false">
      <div class="pop-body register-photo-guide-modal-body" v-html="photoGuideHtml" />
      <template #footer><div class="pop-ft"><button type="button" class="ui-btn ui-btn--primary ui-btn--xl ui-btn--mobile-md ui-btn--align-center ui-btn--full pop-ft__ui-button pop-ft__ui-button--confirm" @click="photoGuideOpen = false"><span class="ui-btn__label">확인 완료</span></button></div></template>
    </Pop>

    <Pop :open="pop === 'region'" id="rd_p_region" title="거래 지역" class-name="register-vehicle-full-modal" body-class-name="register-region-modal" @close="close">
      <div class="register-region-modal__field register-region-modal__field--address">
        <label class="register-region-modal__label" for="register-detail-region-address">주소</label>
        <input class="register-region-modal__input" id="register-detail-region-address" type="text" placeholder="주소를 입력해주세요" readonly :value="addressDraft.base" @click="addressLayer = true" />
        <div class="register-region-modal__address-layer" id="register-detail-region-address-layer" :style="addressLayer ? { display: 'block', overflowY: 'auto' } : undefined">
          <ul v-if="addressLayer" class="bbm-register-address-mock" aria-label="주소 검색 결과(목업)">
            <li v-for="item in mockAddresses" :key="item"><button type="button" @click="pickAddress(item)">{{ item }}</button></li>
          </ul>
        </div>
      </div>
      <div class="register-region-modal__field">
        <label class="register-region-modal__label" for="register-detail-region-address-detail">상세 주소</label>
        <input class="register-region-modal__input" id="register-detail-region-address-detail" type="text" placeholder="상세주소를 입력해주세요" :value="addressDraft.detail" @input="onAddressDetail" />
      </div>
      <template #footer><div class="pop-ft"><button type="button" class="pop-ft__button pop-ft__button--single" @click="applyRegion">입력</button></div></template>
    </Pop>

    <RegisterLayer v-if="pop === 'descload'">
      <div class="ui-app-modal is-open">
        <button type="button" class="ui-app-modal__backdrop" aria-label="닫기" @click="close" />
        <div class="ui-app-modal__panel ui-app-modal__panel--default ui-fake-scrollbar" role="dialog" aria-label="내 설명글 불러오기">
          <div class="ui-app-modal__header ui-app-modal__header--default">
            <div class="ui-app-modal__header-content">
              <div class="s1-draft-modal-title-group">
                <h3 class="ui-app-modal__title">내 설명글 불러오기</h3>
                <span class="s1-draft-modal-count">{{ descriptionDrafts.length }}/9999999</span>
              </div>
            </div>
            <button type="button" class="ui-app-modal__close" aria-label="닫기" @click="close"><img class="ui-app-modal__close-icon" :src="registerIcons.modalClose" alt="" /></button>
          </div>
          <div class="ui-app-modal__main ui-app-modal__main--default">
            <div class="s1-draft-list register-description-list-modal">
              <div v-for="draft in descriptionDrafts" :key="draft.title" class="s1-draft-item" role="button" @click="pickDraft(draft)">
                <div class="s1-draft-item-left">
                  <p class="s1-draft-item-num">{{ draft.title }}</p>
                  <p class="s1-draft-item-meta"><span class="s1-draft-item-meta-light">자동차</span><span class="s1-draft-item-meta-dot">·</span><span class="s1-draft-item-meta-strong">{{ draft.date }}</span><span class="s1-draft-item-meta-light">수정됨</span></p>
                </div>
                <div class="s1-draft-item-actions">
                  <button type="button" class="ui-icon-btn" aria-label="수정" @click.stop="notify('설명글 수정은 정식 서비스에서 이용해 주세요.')"><img class="ui-icon-btn__icon" :src="registerIcons.draftEdit" alt="" /></button>
                  <button type="button" class="ui-icon-btn" aria-label="삭제" @click.stop="notify('설명글 삭제는 정식 서비스에서 이용해 주세요.')"><img class="ui-icon-btn__icon" :src="registerIcons.draftDelete" alt="" /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RegisterLayer>

    <InspectionPcModal v-if="pop === 'inspectionPc'" :notify="notify" @close="close" />

    <SaleExtraModal kind="lease" :open="pop === 'lease'" :value="lease" :notify="notify" @patch="patchSale('lease', $event)" @close="close" />
    <SaleExtraModal kind="rent" :open="pop === 'rent'" :value="rent" :notify="notify" @patch="patchSale('rent', $event)" @close="close" />

    <Pop :open="pop === 'inspection'" id="rd_p_inspection" title="성능·상태 점검기록부" @close="close">
      <div class="register-sale-modal-form register-inspection-modal">
        <div class="register-sale-modal-form__row">
          <span class="register-sale-modal-form__label">제시번호</span>
          <div class="register-sale-modal-form__value">
            <span class="ui-responsive-input">
              <span class="ui-underline-input ui-underline-input--lg ui-underline-input--mobile-sm ui-underline-input--align-right ui-responsive-input__mobile">
                <input class="ui-underline-input__control" id="register-detail-inspection-number" type="text" maxlength="12" placeholder="제시번호를 입력해주세요" :value="inspectionDraft.number" @input="onInspectionNumber" />
              </span>
              <span class="ui-box-input ui-box-input--lg ui-box-input--align-left ui-responsive-input__desktop">
                <span class="ui-box-input__field"><input class="ui-box-input__control" id="register-detail-inspection-number-pc" type="text" maxlength="12" placeholder="제시번호를 입력해주세요" :value="inspectionDraft.number" @input="onInspectionNumber" /></span>
              </span>
            </span>
          </div>
        </div>
        <p class="register-inspection-modal__help">중요정보(제시번호,성능점점기록부,조합/상사명) 미기재 또는 허위 기재시 표시 광고의 공정화에 관한 법률(20조 제1항 제1호)에 의해 1억원이하의 과태료가 부과될 수 있습니다.</p>
        <div v-for="[key, label] in inspectionRows" :key="key" class="register-sale-modal-form__row">
          <span class="register-sale-modal-form__label">{{ label }}</span>
          <div class="register-sale-modal-form__value">
            <ChoiceGroup :name="`register-detail-inspection-${key}`" class-name="register-sale-modal-form__choice-group" :value="inspectionDraft[key]" :options="[{ value: 'yes', label: '예' }, { value: 'no', label: '아니오' }]" @change="inspectionDraft = { ...inspectionDraft, [key]: $event }" />
          </div>
        </div>
        <div class="register-inspection-upload">
          <div class="register-inspection-upload__title">성능점검 기록부 사진첨부</div>
          <div class="register-inspection-upload__desc">사진으로 간편하게 등록하세요. 직접입력은 PC에서 가능합니다.</div>
          <div class="register-inspection-upload__list">
            <div v-for="page in [1, 2, 3, 4]" :key="page" class="register-inspection-upload__item">
              <label class="register-inspection-upload__box">
                <input class="register-inspection-upload__input" type="file" accept="image/*" hidden @change="onInspectionFile($event, page)" />
                <img class="register-inspection-upload__preview" :src="asset(`register/default-report${page}.png`)" alt="" />
                <span class="register-inspection-upload__overlay"><span class="register-inspection-upload__action"><i class="register-inspection-upload__camera" /><span class="register-inspection-upload__text">등록</span></span></span>
              </label>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="pop-ft">
          <button type="button" class="ui-btn ui-btn--outline ui-btn--lg ui-btn--mobile-sm ui-btn--align-center ui-btn--bordered pop-ft__ui-button--cancel" @click="close"><span class="ui-btn__label">나중에 등록하기</span></button>
          <button type="button" class="ui-btn ui-btn--primary ui-btn--lg ui-btn--mobile-sm ui-btn--align-center pop-ft__ui-button--confirm" @click="applyInspection"><span class="ui-btn__label">완료</span></button>
        </div>
      </template>
    </Pop>
  </section>
</template>
