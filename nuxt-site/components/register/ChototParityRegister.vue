<script setup lang="ts">
// 리액트 src/prototype/register/ChototParityRegister.tsx(기본 ?register 화면). notify 는 함수 prop(리액트와 같은 이름).
import { ref, computed, onBeforeUnmount } from "vue";
import { asset } from "@proto/data";
import "@proto/register/chotot-parity.css";
import ChatBubbleIcon from "../icons/ChatBubbleIcon.vue";
import Cross2Icon from "../icons/Cross2Icon.vue";
import HamburgerMenuIcon from "../icons/HamburgerMenuIcon.vue";
import HeartIcon from "../icons/HeartIcon.vue";
import ImageIcon from "../icons/ImageIcon.vue";
import InfoCircledIcon from "../icons/InfoCircledIcon.vue";
import MagnifyingGlassIcon from "../icons/MagnifyingGlassIcon.vue";
import PlusIcon from "../icons/PlusIcon.vue";
import Field from "./chotot-parity/Field.vue";
import PillGroup from "./chotot-parity/PillGroup.vue";
import { syncControlled } from "../../lib/controlled-input";

const props = defineProps<{ notify: (message: string) => void }>();
const notify = (message: string) => props.notify(message);

const initialPhoto = asset("cars/supercar-sheet-v01/sc-019.jpg");
type MediaItem = { id: string; name: string; src: string; objectUrl?: boolean };

const media = ref<MediaItem[]>([{ id: "sample", name: "차량 대표 사진", src: initialPhoto }]);
const draggedId = ref<string | null>(null);
const description = ref("2022년식 현대 그랜저입니다. 주행거리 25,000km, 무사고 차량이며 깔끔하게 관리했습니다.");
const title = ref("현대 그랜저 2022 검정 25,000km");
const price = ref("");
const address = ref("");
const seller = ref("개인");
const category = ref("자동차 / 승용차");
const condition = ref("중고");
const maker = ref("현대");
const model = ref("그랜저");
const year = ref("2022");
const variant = ref("");
const transmission = ref("");
const fuel = ref("");
const mileage = ref("25000");
const origin = ref("");
const seats = ref("");
const bodyType = ref("");
const color = ref("검정");
const ownerCount = ref("1인 소유");
const accessories = ref("없음");
const inspection = ref("있음");
const showDocument = ref(false);
const documentName = ref("");
const previewOpen = ref(false);
const fileRef = ref<HTMLInputElement | null>(null);
const documentRef = ref<HTMLInputElement | null>(null);
let objectUrls: string[] = [];

const errors = computed(() => ({
  price: price.value && Number(price.value.replace(/[^0-9]/g, "")) >= 500 ? "" : "판매가격을 500만원 이상 입력해주세요.",
  address: address.value ? "" : "거래지역을 선택해주세요.",
  transmission: transmission.value ? "" : "변속기를 선택해주세요.",
  fuel: fuel.value ? "" : "연료를 선택해주세요.",
}));

onBeforeUnmount(() => {
  objectUrls.forEach((url) => URL.revokeObjectURL(url));
});

const addMedia = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []).slice(0, Math.max(0, 10 - media.value.length));
  if (!files.length) return;
  const next = files.map((file) => {
    const src = URL.createObjectURL(file);
    objectUrls.push(src);
    return { id: `${file.name}-${file.lastModified}-${Math.random()}`, name: file.name, src, objectUrl: true };
  });
  media.value = [...media.value, ...next];
  input.value = "";
};

const removeMedia = (id: string) => {
  const current = media.value;
  const target = current.find((item) => item.id === id);
  if (target?.objectUrl) {
    URL.revokeObjectURL(target.src);
    objectUrls = objectUrls.filter((url) => url !== target.src);
  }
  media.value = current.filter((item) => item.id !== id);
};

const dropMedia = (targetId: string) => {
  if (!draggedId.value || draggedId.value === targetId) return;
  const current = media.value;
  const from = current.findIndex((item) => item.id === draggedId.value);
  const to = current.findIndex((item) => item.id === targetId);
  if (from >= 0 && to >= 0) {
    const next = [...current];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    media.value = next;
  }
  draggedId.value = null;
};
const onTouchEnd = (event: TouchEvent) => {
  const touch = event.changedTouches[0];
  const targetId = document.elementFromPoint(touch.clientX, touch.clientY)?.closest<HTMLElement>("[data-media-id]")?.dataset.mediaId;
  if (targetId) dropMedia(targetId);
};

const saveDraft = () => {
  localStorage.setItem("bbm-register-draft", JSON.stringify({ description: description.value, title: title.value, price: price.value, address: address.value, seller: seller.value, category: category.value, condition: condition.value, maker: maker.value, model: model.value, year: year.value, variant: variant.value, transmission: transmission.value, fuel: fuel.value, mileage: mileage.value, origin: origin.value, seats: seats.value, bodyType: bodyType.value, color: color.value, ownerCount: ownerCount.value, accessories: accessories.value, inspection: inspection.value, showDocument: showDocument.value }));
  notify("임시저장했습니다.");
};

const submit = () => {
  const firstError = Object.values(errors.value).find(Boolean);
  if (firstError) {
    notify(firstError);
    document.querySelector(".ct-field-wrap.is-error")?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  notify("등록 전 최종 확인이 완료되었습니다.");
};
const onDescription = (event: Event) => { description.value = (event.currentTarget as HTMLTextAreaElement).value; syncControlled(event, () => description.value); };
const onDocument = (event: Event) => { documentName.value = (event.currentTarget as HTMLInputElement).files?.[0]?.name ?? ""; };
const onShowDocument = (event: Event) => { showDocument.value = (event.currentTarget as HTMLInputElement).checked; };
</script>
<template>
  <div class="ct-register-page">
    <header class="ct-register-header">
      <div class="ct-register-header__top">
        <button type="button" aria-label="전체 메뉴" @click="notify('전체 메뉴')"><HamburgerMenuIcon /></button>
        <img :src="asset('bbm/header-logo.svg')" alt="보배드림" />
        <button type="button" class="ct-open-app" @click="notify('보배드림 앱 열기')">앱 열기</button>
      </div>
      <div class="ct-register-header__search">
        <div><MagnifyingGlassIcon aria-hidden="true" /><span>차량을 검색해보세요</span></div>
        <button type="button" aria-label="찜"><HeartIcon /></button>
        <button type="button" aria-label="채팅"><ChatBubbleIcon /></button>
      </div>
    </header>

    <main class="ct-register-main" aria-label="자동차 매물 등록">
      <section class="ct-card ct-primary-card">
        <div class="ct-section-title-row">
          <h1>사진/영상 <span>*</span></h1>
          <button type="button" aria-label="사진 및 영상 안내" @click="notify('차량 전체가 잘 보이는 사진을 등록해주세요.')"><InfoCircledIcon /></button>
        </div>
        <div class="ct-media-row" aria-label="등록 사진과 영상">
          <button type="button" class="ct-media-add" aria-label="사진 또는 영상 추가" @click="fileRef?.click()">
            <span class="ct-media-add__icon"><ImageIcon /><PlusIcon /></span>
          </button>
          <input ref="fileRef" class="ct-native-file" type="file" accept="image/*,video/*" multiple @change="addMedia" />
          <div v-for="(item, index) in media" :key="item.id" :data-media-id="item.id" class="ct-media-thumb" draggable="true" @dragstart="draggedId = item.id" @dragover.prevent @drop="dropMedia(item.id)" @touchstart="draggedId = item.id" @touchend="onTouchEnd">
            <img :src="item.src" :alt="item.name" />
            <button type="button" class="ct-media-remove" :aria-label="`${item.name} 삭제`" @click="removeMedia(item.id)"><Cross2Icon /></button>
            <span v-if="index === 0" class="ct-cover-badge">대표</span>
          </div>
        </div>
        <p class="ct-media-help">길게 눌러 사진 순서를 변경할 수 있습니다.</p>

        <div class="ct-description-field">
          <label for="ct-description">매물 설명 <span>*</span></label>
          <textarea id="ct-description" maxlength="1500" :value="description" @input="onDescription" />
          <span>{{ description.length }}/1,500자</span>
        </div>

        <Field id="ct-title" label="매물 제목" required :value="title" clearable @change="title = $event" @clear="title = ''" />
        <Field id="ct-price" label="판매가격" required :value="price" suffix="만원" :error="errors.price" @change="price = $event" />
        <Field id="ct-address" label="거래지역" required :value="address" placeholder="지역 선택" :error="errors.address" select :options="['서울특별시', '경기도', '인천광역시', '부산광역시', '대구광역시']" @change="address = $event" />
        <PillGroup label="판매자 유형 *" :value="seller" :options="['개인', '전문 판매자']" @change="seller = $event" />
      </section>

      <section class="ct-card ct-detail-card">
        <h2>상세 정보</h2>
        <div class="ct-detail-grid">
          <div class="ct-grid-full"><Field id="ct-category" label="카테고리" required :value="category" select :options="['자동차 / 승용차', '자동차 / SUV', '자동차 / 화물차', '자동차 / 기타']" @change="category = $event" /></div>

          <div class="ct-grid-full ct-document-box">
            <div class="ct-document-head"><strong>차량 서류</strong><InfoCircledIcon aria-hidden="true" /></div>
            <button type="button" class="ct-document-upload" @click="documentRef?.click()"><ImageIcon /><span>{{ documentName || "서류 추가" }}</span></button>
            <input ref="documentRef" class="ct-native-file" type="file" accept="image/*,.pdf" @change="onDocument" />
            <label class="ct-document-toggle"><span>매물에 표시</span><input type="checkbox" :checked="showDocument" @change="onShowDocument" /><i aria-hidden="true" /></label>
          </div>

          <PillGroup label="차량 상태 *" :value="condition" :options="['중고', '신차']" compact @change="condition = $event" />
          <Field id="ct-maker" label="제조사" required :value="maker" clearable @change="maker = $event" @clear="maker = ''" />
          <Field id="ct-model" label="모델" required :value="model" clearable @change="model = $event" @clear="model = ''" />
          <Field id="ct-year" label="연식" required :value="year" clearable @change="year = $event" @clear="year = ''" />
          <Field id="ct-variant" label="세부모델" :value="variant" placeholder="선택" select :options="['2.5 가솔린', '3.5 가솔린', '1.6 하이브리드']" @change="variant = $event" />
          <Field id="ct-transmission" label="변속기" required :value="transmission" placeholder="선택" :error="errors.transmission" select :options="['자동', '수동', 'CVT']" @change="transmission = $event" />
          <Field id="ct-fuel" label="연료" required :value="fuel" placeholder="선택" :error="errors.fuel" select :options="['가솔린', '디젤', '하이브리드', '전기', 'LPG']" @change="fuel = $event" />
          <Field id="ct-mileage" label="주행거리" required :value="mileage" clearable @change="mileage = $event" @clear="mileage = ''" />
          <Field id="ct-origin" label="수입구분" :value="origin" placeholder="선택" select :options="['국산', '정식수입', '병행수입']" @change="origin = $event" />
          <Field id="ct-seats" label="승차정원" :value="seats" placeholder="선택" select :options="['2인승', '4인승', '5인승', '7인승', '9인승 이상']" @change="seats = $event" />
          <Field id="ct-body" label="차종" :value="bodyType" placeholder="선택" select :options="['세단', 'SUV', '해치백', '쿠페', '왜건', '승합']" @change="bodyType = $event" />
          <Field id="ct-color" label="색상" :value="color" clearable @change="color = $event" @clear="color = ''" />
          <PillGroup label="소유자 변경" :value="ownerCount" :options="['1인 소유', '2인 이상']" compact @change="ownerCount = $event" />
          <PillGroup label="부속품 포함" :value="accessories" :options="['있음', '없음']" compact @change="accessories = $event" />
          <PillGroup label="검사 유효기간" :value="inspection" :options="['있음', '없음']" compact @change="inspection = $event" />
        </div>
      </section>
    </main>

    <footer class="ct-register-actions">
      <button type="button" @click="previewOpen = true">미리보기</button>
      <button type="button" @click="saveDraft">임시저장</button>
      <button type="button" class="is-primary" @click="submit">등록하기</button>
    </footer>

    <div v-if="previewOpen" class="ct-preview-backdrop" role="presentation" @click="previewOpen = false">
      <section class="ct-preview" role="dialog" aria-modal="true" aria-label="매물 미리보기" @click.stop>
        <button type="button" aria-label="미리보기 닫기" @click="previewOpen = false"><Cross2Icon /></button>
        <img v-if="media[0]" :src="media[0].src" alt="대표 차량" />
        <h2>{{ title || "매물 제목" }}</h2>
        <strong>{{ price ? `${price}만원` : "가격 미정" }}</strong>
        <p>{{ description }}</p>
      </section>
    </div>
  </div>
</template>
