<script setup lang="ts">
// 리액트 src/prototype/fuel-economy/FuelEconomyBoard.tsx 의 FuelEconomyBoard(+ 안쪽 UiIcon · Logo)를 옮김.
// 데이터는 fuel-economy-data.ts 를 그대로 불러오고, 파일 안 작은 상수·계산 함수(icons · cities · oneDecimal · integer)는 export 되지 않아 복사했다(keep in sync).
// 차이: publicBase 는 리액트의 new URL(".", location.href) 대신 사이트 맨 위 주소(import.meta.env.BASE_URL = /bobaedream/)를 쓴다(넉스트 주소는 nuxt/ 아래라서).
//       입력칸 onChange → @input. UiIcon · Logo 는 템플릿에 그대로 펼쳤다.
import { computed, ref } from "vue";
import { asset } from "@proto/data";
import { ENERGY_STORAGE_KEY, energyModels, energyTypeLabel, type EnergyModel, type SavedEnergyPost } from "@proto/fuel-economy/fuel-economy-data";
import "@proto/fuel-economy/fuel-economy-board.css";

const publicBase: string = import.meta.env.BASE_URL;
const icon = (path: string) => `${publicBase}${path}`;
const icons = {
  close: ["assets", "register", "chotot-v01", "close-x.svg"].join("/"),
  back: "community/%61ssets/reddit-ui/back.svg",
  write: "community/%61ssets/reddit-ui/write.svg",
  image: ["assets", "register", "chotot-v01", "image.svg"].join("/"),
  chevron: ["assets", "register", "chotot-v01", "chevron-right.svg"].join("/"),
  check: ["assets", "register", "chotot-v01", "check-mark.svg"].join("/"),
  location: "icons/chotot/chotot-common-location-icon.svg",
};
const iconSrc = (name: keyof typeof icons) => icon(icons[name]);

const exampleImages = [
  ["assets", "register", "guide", "car_interior_cluster_on.jpg"].join("/"),
  ["assets", "register", "guide", "car_interior_dashboard.jpg"].join("/"),
];

const cities = [
  "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
  "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
];

type PickerStep = "brand" | "model" | "trim";

const logoSrc = (m: EnergyModel) => asset(`brand/kr/${m.logo}`);

function oneDecimal(value: string) {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const [head, ...tail] = cleaned.split(".");
  return tail.length ? `${head}.${tail.join("").slice(0, 1)}` : head;
}

function integer(value: string) {
  return value.replace(/[^0-9]/g, "").slice(0, 7);
}

const model = ref<EnergyModel | null>(null);
const showPicker = ref(false);
const title = ref("");
const body = ref("");
const city = ref("");
const odometer = ref("");
const fuelConsumption = ref("");
const energyConsumption = ref("");
const fullChargeRange = ref("");
const temperature = ref("15");
const imageData = ref("");
const error = ref("");
const pickerStep = ref<PickerStep>("brand");
const pickerBrand = ref("");
const pickerModel = ref("");
const modelQuery = ref("");
const showCityPicker = ref(false);
const cityQuery = ref("");

const needsFuel = computed(() => model.value?.type === "ice" || model.value?.type === "hybrid" || model.value?.type === "phev");
const needsEnergy = computed(() => model.value?.type === "ev" || model.value?.type === "phev");
const needsRange = computed(() => model.value?.type === "ev");
const progress = computed(() => Math.min(100, Math.round(body.value.trim().length / 2)));
const brands = Array.from(new Map(energyModels.map((item) => [item.brand, item])).values());
const series = computed(() => Array.from(new Map(energyModels.filter((item) => item.brand === pickerBrand.value).map((item) => [item.model, item])).values()));
const trims = computed(() => energyModels.filter((item) => item.brand === pickerBrand.value && item.model === pickerModel.value));
const visibleBrands = computed(() => brands.filter((item) => item.brand.toLowerCase().includes(modelQuery.value.trim().toLowerCase())));
const visibleCities = computed(() => cities.filter((item) => item.includes(cityQuery.value.trim())));
const brandCount = (brand: string) => energyModels.filter((row) => row.brand === brand).length;

const val = (event: Event) => (event.target as HTMLInputElement | HTMLTextAreaElement).value;

const close = () => {
  if ((title.value || body.value || model.value || imageData.value) && !window.confirm("작성 중인 연비·전비 기록을 닫을까요? 입력한 내용은 저장되지 않습니다.")) return;
  window.location.href = "./community/naver-cafe-list.html?board=fuel-economy";
};

const selectModel = (next: EnergyModel) => {
  if (model.value && model.value.id !== next.id && (odometer.value || fuelConsumption.value || energyConsumption.value || fullChargeRange.value) && !window.confirm("차량을 바꾸면 입력한 에너지 수치가 초기화됩니다. 변경할까요?")) return;
  model.value = next;
  odometer.value = "";
  fuelConsumption.value = "";
  energyConsumption.value = "";
  fullChargeRange.value = "";
  temperature.value = "15";
  showPicker.value = false;
  error.value = "";
};

const openModelPicker = () => {
  pickerStep.value = "brand";
  pickerBrand.value = "";
  pickerModel.value = "";
  modelQuery.value = "";
  showPicker.value = true;
};

const setError = (message: string) => { error.value = message; };

const submit = () => {
  const m = model.value;
  if (!m) return setError("차량 모델을 선택해 주세요.");
  if (!city.value) return setError("주행한 지역을 선택해 주세요.");
  if (!odometer.value) return setError("현재 총주행거리를 입력해 주세요.");
  if (needsFuel.value && !fuelConsumption.value) return setError("평균 연비를 입력해 주세요.");
  if (needsEnergy.value && !energyConsumption.value) return setError("평균 전비를 입력해 주세요.");
  if (needsRange.value && !fullChargeRange.value) return setError("완충 실주행거리를 입력해 주세요.");
  if (!body.value.trim()) return setError("실주행 경험을 입력해 주세요.");
  const fallback = `${m.brand} ${m.model} 실주행 ${needsEnergy.value ? "전비" : "연비"} 기록`;
  const post: SavedEnergyPost = {
    id: `energy-local-${Date.now()}`,
    modelId: m.id,
    title: title.value.trim() || fallback,
    body: body.value.trim(),
    city: city.value,
    odometer: odometer.value,
    fuelConsumption: needsFuel.value ? fuelConsumption.value : undefined,
    energyConsumption: needsEnergy.value ? energyConsumption.value : undefined,
    fullChargeRange: needsRange.value ? fullChargeRange.value : undefined,
    temperature: needsRange.value ? temperature.value : undefined,
    imageData: imageData.value || undefined,
    createdAt: new Date().toISOString(),
    author: "보배드림 회원",
  };
  try {
    const rows = JSON.parse(localStorage.getItem(ENERGY_STORAGE_KEY) ?? "[]") as SavedEnergyPost[];
    localStorage.setItem(ENERGY_STORAGE_KEY, JSON.stringify([post, ...rows]));
  } catch {
    return setError("기록을 저장하지 못했습니다. 저장 공간을 확인해 주세요.");
  }
  window.location.href = `./community/naver-cafe-list.html?board=fuel-economy&energy=${encodeURIComponent(post.id)}`;
};

const onFile = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  if (file.size > 4 * 1024 * 1024) return setError("사진은 4MB 이하만 첨부할 수 있어요.");
  const reader = new FileReader();
  reader.onload = () => { imageData.value = String(reader.result || ""); };
  reader.readAsDataURL(file);
};
const onBody = (event: Event) => { body.value = val(event); error.value = ""; };
const onTemperature = (event: Event) => { temperature.value = val(event).replace(/[^0-9-]/g, "").slice(0, 3); };
const openCityPicker = () => { cityQuery.value = ""; showCityPicker.value = true; };
const pickBrand = (brand: string) => { pickerBrand.value = brand; pickerStep.value = "model"; };
const pickSeries = (m: string) => { pickerModel.value = m; pickerStep.value = "trim"; };
const pickCity = (item: string) => { city.value = item; showCityPicker.value = false; error.value = ""; };
</script>

<template>
  <section class="fe-write" aria-label="연비·전비 기록 등록">
    <header class="fe-head"><button type="button" aria-label="닫기" @click="close"><img :src="iconSrc('close')" alt="" aria-hidden="true" /></button><strong>연비·전비 기록</strong><button type="button" @click="submit"><img :src="iconSrc('write')" alt="" aria-hidden="true" />등록</button></header>
    <div class="fe-progress"><b>실제 주행 조건을 자세히 적으면 더 유용한 기록이 돼요</b><span><i :style="{ width: `${progress}%` }" /></span></div>

    <section class="fe-card fe-media-card">
      <h2>에너지 사용 사진</h2>
      <p>계기판이나 차량 앱의 연비·전비 화면을 올려주세요.</p>
      <div class="fe-media-row">
        <div v-if="imageData" class="fe-preview"><img :src="imageData" alt="첨부한 에너지 사용 사진" /><button type="button" @click="imageData = ''">삭제</button></div>
        <label v-else class="fe-image-add"><input type="file" accept="image/jpeg,image/png,image/webp" @change="onFile" /><img :src="iconSrc('image')" alt="" aria-hidden="true" /><b>사진 추가</b><small>계기판 · 앱 화면</small></label>
        <figure v-for="(src, index) in exampleImages" :key="src" class="fe-example"><img :src="icon(src)" :alt="`에너지 사용 사진 참고 예시 ${index + 1}`" /><figcaption>참고 예시</figcaption></figure>
      </div>
    </section>

    <label class="fe-card fe-title"><span><b>제목</b><small>선택 · {{ title.length }}/60</small></span><input :maxlength="60" :value="title" placeholder="제목을 입력하면 더 쉽게 발견돼요" @input="title = val($event)" /></label>
    <label class="fe-card fe-body"><span><b>실주행 경험</b><small>{{ body.length }}/600</small></span><textarea :maxlength="600" :value="body" placeholder="도심·고속도로 비율, 날씨, 공조 사용, 충전 주기와 비용 등 실제 주행 경험을 알려주세요." @input="onBody" /></label>

    <section class="fe-card fe-vehicle">
      <h2>차량과 주행 정보</h2>
      <button type="button" class="fe-model" @click="openModelPicker">
        <template v-if="model"><span class="fe-logo"><img :src="logoSrc(model)" :alt="`${model.brand} 엠블럼`" /></span><span><b>{{ model.brand }} {{ model.model }}</b><small>{{ model.trim }} · {{ energyTypeLabel[model.type] }}</small></span></template>
        <span v-else><b>차량 모델 선택</b><small>브랜드·차종·세부 모델을 선택해 주세요</small></span>
        <img :src="iconSrc('chevron')" alt="" aria-hidden="true" />
      </button>
      <div v-if="model" class="fe-fields">
        <button type="button" class="fe-field-button" @click="openCityPicker"><span>주행 지역<em>*</em></span><b>{{ city || "선택" }}</b><img :src="iconSrc('chevron')" alt="" aria-hidden="true" /></button>
        <label><span>현재 총주행거리</span><div><input inputmode="numeric" :value="odometer" placeholder="0" @input="odometer = integer(val($event)); ($event.target as HTMLInputElement).value = odometer" /><em>km</em></div></label>
        <label v-if="needsEnergy"><span>평균 전비</span><div><input inputmode="decimal" :value="energyConsumption" placeholder="0.0" @input="energyConsumption = oneDecimal(val($event)); ($event.target as HTMLInputElement).value = energyConsumption" /><em>kWh/100km</em></div></label>
        <label v-if="needsFuel"><span>평균 연비</span><div><input inputmode="decimal" :value="fuelConsumption" placeholder="0.0" @input="fuelConsumption = oneDecimal(val($event)); ($event.target as HTMLInputElement).value = fuelConsumption" /><em>L/100km</em></div></label>
        <label v-if="needsRange" class="fe-range-row"><span>완충 실주행거리</span><div class="fe-range-fields"><input aria-label="측정 온도" class="fe-temperature" inputmode="numeric" :value="temperature" @input="onTemperature($event); ($event.target as HTMLInputElement).value = temperature" /><em>℃</em><input aria-label="완충 실주행거리" inputmode="numeric" :value="fullChargeRange" placeholder="0" @input="fullChargeRange = integer(val($event)); ($event.target as HTMLInputElement).value = fullChargeRange" /><em>km</em></div></label>
      </div>
      <p v-else class="fe-helper">차량을 선택하면 연료 유형에 맞는 연비·전비 입력란이 자동으로 표시됩니다.</p>
    </section>

    <p v-if="error" class="fe-error" role="alert">{{ error }}</p>
    <button type="button" class="fe-submit" @click="submit">연비·전비 기록 등록</button>

    <div v-if="showPicker" class="fe-sheet" role="dialog" aria-modal="true" aria-label="차량 모델 선택"><button class="fe-sheet-backdrop" type="button" aria-label="닫기" @click="showPicker = false" /><section>
      <header><button v-if="pickerStep !== 'brand'" type="button" aria-label="이전" @click="pickerStep = pickerStep === 'trim' ? 'model' : 'brand'"><img :src="iconSrc('back')" alt="" aria-hidden="true" /></button><span v-else />
        <strong>{{ pickerStep === "brand" ? "브랜드 선택" : pickerStep === "model" ? "차종 선택" : "세부 모델 선택" }}</strong>
        <button type="button" aria-label="닫기" @click="showPicker = false"><img :src="iconSrc('close')" alt="" aria-hidden="true" /></button>
      </header>
      <template v-if="pickerStep === 'brand'"><label class="fe-sheet-search"><input :value="modelQuery" placeholder="브랜드 검색" @input="modelQuery = val($event)" /></label><button v-for="item in visibleBrands" :key="item.brand" type="button" @click="pickBrand(item.brand)"><span class="fe-logo"><img :src="logoSrc(item)" :alt="`${item.brand} 엠블럼`" /></span><span><b>{{ item.brand }}</b><small>{{ brandCount(item.brand) }}개 차종</small></span><img :src="iconSrc('chevron')" alt="" aria-hidden="true" /></button></template>
      <template v-if="pickerStep === 'model'"><button v-for="item in series" :key="item.model" type="button" @click="pickSeries(item.model)"><span class="fe-logo"><img :src="logoSrc(item)" :alt="`${item.brand} 엠블럼`" /></span><span><b>{{ item.brand }} {{ item.model }}</b><small>{{ energyTypeLabel[item.type] }}</small></span><img :src="iconSrc('chevron')" alt="" aria-hidden="true" /></button></template>
      <template v-if="pickerStep === 'trim'"><button v-for="item in trims" :key="item.id" type="button" :class="model?.id === item.id ? 'is-active' : ''" @click="selectModel(item)"><span class="fe-logo"><img :src="logoSrc(item)" :alt="`${item.brand} 엠블럼`" /></span><span><b>{{ item.trim }}</b><small>{{ item.brand }} {{ item.model }} · {{ energyTypeLabel[item.type] }}</small></span><img v-if="model?.id === item.id" :src="iconSrc('check')" alt="" aria-hidden="true" /></button></template>
    </section></div>

    <div v-if="showCityPicker" class="fe-sheet fe-city-sheet" role="dialog" aria-modal="true" aria-label="주행 지역 선택"><button class="fe-sheet-backdrop" type="button" aria-label="닫기" @click="showCityPicker = false" /><section>
      <header><span /><strong>주행 지역 선택</strong><button type="button" aria-label="닫기" @click="showCityPicker = false"><img :src="iconSrc('close')" alt="" aria-hidden="true" /></button></header>
      <label class="fe-sheet-search"><input :value="cityQuery" placeholder="지역 검색" @input="cityQuery = val($event)" /></label>
      <button v-for="item in visibleCities" :key="item" type="button" :class="city === item ? 'is-active' : ''" @click="pickCity(item)"><span><b>{{ item }}</b><small>{{ item === "서울" ? "서울특별시" : item }}</small></span><img :src="iconSrc(city === item ? 'check' : 'chevron')" alt="" aria-hidden="true" /></button>
    </section></div>
  </section>
</template>
