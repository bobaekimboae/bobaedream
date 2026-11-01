<script setup lang="ts">
// 연비·전비 쓰기(동처띠 能耗 작성 화면 실측 2026-11-01): 안내 줄 → 사진(추가 + 참고 예시 2장) → 제목(선택) · 본문(n/2000) → 차량 연결 → 동력별 입력칸.
// 등록 버튼은 차량 · 지역 · 본문을 채우기 전까지 흐리다(원본은 차와 본문만 있어도 켜짐, 지역은 위치로 미리 채움).
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import Ico from "./Ico.vue";
import WriteHead from "./WriteHead.vue";
import CarPicker from "./CarPicker.vue";
import Sheet from "./Sheet.vue";
import { IC } from "../lib/icons";
import { asset } from "../lib/site";
import { SIDO, type CarModel, type FuelPost } from "../lib/data";
import { api } from "../lib/api/client";
import type { FuelInput } from "../lib/api/contract";
import { ask, toast } from "../lib/ui";
import { back, replace, setLeaveGuard, type Board } from "../lib/route";

const emit = defineEmits<{ switch: [Board] }>();
const BODY_MAX = 2000;
const EXAMPLES = ["register/guide/car_interior_cluster_on.jpg", "register/guide/car_interior_dashboard.jpg"];

const car = ref<CarModel | null>(null);
const picker = ref(false);
const photos = ref<string[]>([]);
const title = ref("");
const body = ref("");
const v = reactive({ city: "", odo: "", fuel: "", energy: "", range: "", temp: "15" });
const sheet = ref<"" | "city" | "example">("");
const exampleIdx = ref(0);

const type = computed(() => car.value?.powertrain ?? "ice");
const isEv = computed(() => type.value === "ev");
const hasEnergy = computed(() => ["ev", "phev", "erev"].includes(type.value));
const hasFuel = computed(() => type.value !== "ev");
const grow = (e: Event) => { const t = e.target as HTMLTextAreaElement; t.style.height = "auto"; t.style.height = `${t.scrollHeight}px`; };
const can = computed(() => Boolean(car.value && v.city && body.value.trim()));
const dirty = computed(() => Boolean(car.value || title.value || body.value.trim() || photos.value.length));

const num = (raw: string, dec: number) => {
  const [a, b] = raw.replace(/[^\d.]/g, "").split(".");
  return dec === 0 || b === undefined ? (a ?? "") : `${a}.${b.slice(0, dec)}`;
};
const onPhoto = (e: Event) => {
  const files = [...((e.target as HTMLInputElement).files ?? [])].slice(0, 9 - photos.value.length);
  for (const f of files) {
    if (f.size > 8 * 1024 * 1024) { toast("사진은 8MB까지 올릴 수 있어요"); continue; }
    const r = new FileReader();
    r.onload = () => photos.value.push(String(r.result || ""));
    r.readAsDataURL(f);
  }
  (e.target as HTMLInputElement).value = "";
};

type DraftBody = { car: CarModel; title: string; body: string; v: typeof v };
let saveT: ReturnType<typeof setTimeout> | undefined;
const saveDraft = () => { if (car.value) void api.saveDraft("fuel", car.value.id, car.value.model, { car: car.value, title: title.value, body: body.value, v: { ...v } } satisfies DraftBody); };
watch([car, title, body, v], () => { clearTimeout(saveT); saveT = setTimeout(saveDraft, 800); }, { deep: true });

const post = async () => {
  if (!car.value) { picker.value = true; return toast("차량을 먼저 연결해 주세요"); }
  if (!v.city) { sheet.value = "city"; return toast("지역을 골라 주세요"); }
  if (!body.value.trim()) return toast("사용 소감을 써 주세요");
  const c = car.value;
  const input: FuelInput = {
    model_id: c.id, title: title.value.trim() || null, body: body.value.trim(), city: v.city, odometer_km: v.odo ? Number(v.odo) : null,
    fuel_km_per_l: hasFuel.value && v.fuel ? Number(v.fuel) : null, energy_km_per_kwh: hasEnergy.value && v.energy ? Number(v.energy) : null,
    full_charge_km: isEv.value && v.range ? Number(v.range) : null, temperature_c: isEv.value && v.temp !== "" ? Number(v.temp) : null,
  };
  const p: FuelPost = {
    id: `u${Date.now()}`, modelId: c.id, brand: c.brand, model: c.model, trim: c.trim, powertrain: c.powertrain === "erev" ? "phev" : (c.powertrain as FuelPost["powertrain"]),
    brandLogo: c.brandLogo, photo: c.photo, title: input.title || `${c.model} 연비·전비 공유`, body: input.body, author: "나",
    avatar: "community/assets/profile-avatars/avatar-01.svg", publishedAt: new Date().toISOString(), images: photos.value, comments: 0, likes: 0, views: 0,
    city: v.city, odometer: input.odometer_km ?? 0, fuel: input.fuel_km_per_l ?? null,
    energy: input.energy_km_per_kwh ? Number((100 / input.energy_km_per_kwh).toFixed(1)) : null, range: input.full_charge_km ?? null,
    temperature: input.temperature_c ?? null, ownerYears: 1, commentList: [], mine: true,
  };
  try {
    const saved = await api.createFuel(input, p);
    clearTimeout(saveT);
    await api.deleteDraft("fuel");
    setLeaveGuard(null);
    toast("연비 기록을 등록했어요");
    replace({ board: "fuel", view: "detail", id: saved.id });
  } catch (e) { toast((e as Error).message || "등록하지 못했어요"); }
};
/** 닫기: 원본 능耗 화면은 묻지 않고 나가며 초안을 남긴다 */
const close = () => {
  clearTimeout(saveT);
  if (dirty.value && car.value) { saveDraft(); toast("임시저장했어요"); }
  setLeaveGuard(null);
  back();
};
onMounted(async () => {
  setLeaveGuard(() => { clearTimeout(saveT); if (dirty.value && car.value) { saveDraft(); toast("임시저장했어요"); } return true; });
  const d = await api.getDraft<DraftBody>("fuel");
  if (!d) return;
  const load = await ask(`${d.model_name} 연비 기록 임시저장이 있어요. 불러올까요?`, "불러오지 않기", "불러오기");
  if (load) { car.value = d.payload.car; title.value = d.payload.title; body.value = d.payload.body; Object.assign(v, d.payload.v); } else await api.deleteDraft("fuel");
});
onBeforeUnmount(() => { setLeaveGuard(null); clearTimeout(saveT); });
</script>

<template>
  <main class="write write--fuel">
    <WriteHead kind="fuel" :picked="Boolean(car)" :can-post="can" @close="close" @post="post" @switch="emit('switch', $event)" />
    <p class="fhint"><Ico :src="IC.info" />{{ car ? "계기판이나 앱의 연비 화면을 올리고, 고속도로 · 시내 주행 느낌과 충전 주기 · 비용을 함께 적어 주세요" : "차량을 고르면 아래에 연비 · 주행거리 입력칸이 나와요" }}</p>

    <section class="fcard fphotos">
      <label class="fphotos__add"><input type="file" accept="image/*" multiple @change="onPhoto" /><Ico :src="IC.add" /><span>연비 사진 추가</span></label>
      <div v-for="(src, i) in photos" :key="i" class="fphotos__img"><img :src="src" alt="" /><button type="button" :aria-label="`${i + 1}번째 사진 빼기`" @click="photos.splice(i, 1)"><Ico :src="IC.remove" /></button></div>
      <template v-if="!photos.length">
        <button v-for="(src, i) in EXAMPLES" :key="src" type="button" class="fphotos__ex" @click="exampleIdx = i; sheet = 'example'"><img :src="asset(src)" alt="" /><span>참고 예시</span></button>
      </template>
    </section>

    <section class="fcard ftext" @click="($event.currentTarget as HTMLElement).querySelector<HTMLTextAreaElement>('.ftext__body')?.focus()">
      <input v-model="title" class="ftext__title" maxlength="30" placeholder="제목을 쓰면 더 많이 추천돼요(선택)" aria-label="제목" />
      <textarea v-model="body" class="ftext__body" rows="1" @input="grow" :maxlength="BODY_MAX" aria-label="사용 소감" placeholder="연비 · 주행거리와 충전 비용에 대한 소감을 나눠 주세요. 예: 시내 · 고속도로에서의 연비 만족도, 충전 주기와 비용" />
      <span v-if="body" class="ftext__count">{{ [...body].length }}/{{ BODY_MAX }}</span>
    </section>

    <section class="fcard fbind">
      <div class="fbind__row">
        <span class="fbind__label"><Ico :src="IC.car" /><span>차량 연결<i>*</i></span></span>
        <span v-if="car" class="fbind__chip"><b>{{ car.model }}</b><span>{{ car.brand }} {{ car.model }} {{ car.trim }}</span><button type="button" aria-label="연결한 차량 빼기" @click="car = null"><Ico :src="IC.close" /></button></span>
        <button v-else type="button" class="fbind__go" aria-label="차량 고르기" @click="picker = true"><Ico :src="IC.chevron" /></button>
      </div>
      <div v-if="car" class="fields">
        <button type="button" class="fields__row" @click="sheet = 'city'"><span>지역<i>*</i></span><em :class="{ ph: !v.city }">{{ v.city || "선택" }}</em><Ico :src="IC.chevron" class="fields__arr" /></button>
        <label class="fields__row"><span>현재 총 주행거리</span><input :value="v.odo" inputmode="numeric" placeholder="정수로 입력" aria-label="현재 총 주행거리(km)" @input="v.odo = num(($event.target as HTMLInputElement).value, 0)" /><u>km</u></label>
        <label v-if="hasEnergy" class="fields__row"><span>평균 전비</span><input :value="v.energy" inputmode="decimal" placeholder="소수 한 자리" aria-label="평균 전비(km/kWh)" @input="v.energy = num(($event.target as HTMLInputElement).value, 1)" /><u>km/kWh</u></label>
        <label v-if="hasFuel" class="fields__row"><span>평균 연비</span><input :value="v.fuel" inputmode="decimal" placeholder="소수 한 자리" aria-label="평균 연비(km/L)" @input="v.fuel = num(($event.target as HTMLInputElement).value, 1)" /><u>km/L</u></label>
        <div v-if="isEv" class="fields__row fields__row--ev"><span>완충 실주행거리</span><label class="fields__temp"><input :value="v.temp" inputmode="numeric" aria-label="측정 온도(℃)" @input="v.temp = ($event.target as HTMLInputElement).value.replace(/[^\d-]/g, '').slice(0, 3)" /><u>℃</u></label><input :value="v.range" inputmode="numeric" placeholder="정수로 입력" aria-label="완충 실주행거리(km)" @input="v.range = num(($event.target as HTMLInputElement).value, 0)" /><u>km</u></div>
      </div>
    </section>

    <CarPicker v-if="picker" title="브랜드 선택" @close="picker = false" @pick="car = $event; picker = false" />
    <Sheet v-if="sheet === 'city'" title="지역" @close="sheet = ''">
      <div class="opt-grid"><button v-for="c in SIDO" :key="c" type="button" :class="{ on: v.city === c }" @click="v.city = c; sheet = ''">{{ c }}</button></div>
    </Sheet>
    <Sheet v-if="sheet === 'example'" title="참고 예시" @close="sheet = ''">
      <div class="doc"><img class="doc__img" :src="asset(EXAMPLES[exampleIdx]!)" alt="연비 사진 참고 예시" /><p>계기판 평균 연비 · 주행거리 화면이나 제조사 앱 화면을 찍어 올려 주세요. 번호판과 개인정보는 보이지 않게 해 주세요.</p></div>
    </Sheet>
  </main>
</template>
