<script setup lang="ts">
// 내 차 팔기(卖车帖) 쓰기 — 동처띠 실측 2026-11-03:
// 안내 줄 「실제 사진 1장 이상 · 외관 · 실내 여러 각도」 → 차량 사진 칸 → 내 차 카드(차종 ⇄) + 필수 5줄
// (등록 연월 · 현재 주행거리 · 차량 색상 · 소유자 변경 횟수 · 희망 판매가) → 제목(선택) · 본문 → 「써 줘 · 지우기 · 지역 · n/2000」.
// 각 줄은 아래에서 올라오는 시트(돌려 고르기 · 색 격자 · 숫자 자판 + 예상 시세)로 고른다.
import { computed, reactive, ref } from "vue";
import WriteHead from "../WriteHead.vue";
import PubMedia from "./PubMedia.vue";
import AiWrite from "./AiWrite.vue";
import PhotoPicker from "./PhotoPicker.vue";
import PhotoEditor from "../PhotoEditor.vue";
import CarPicker from "../CarPicker.vue";
import Sheet from "../Sheet.vue";
import Wheel from "./Wheel.vue";
import Ico from "../Ico.vue";
import { IC } from "../../lib/icons";
import { aiDraft, CAR_COLORS, type Media } from "../../lib/publish";
import { SIDO, type CarModel } from "../../lib/data";
import { usePub } from "../../lib/usePub";
import { toast } from "../../lib/ui";
import type { Kind } from "../../lib/route";

const emit = defineEmits<{ switch: [Kind] }>();
const MAX = 20;
const BODY_MAX = 2000;
const media = ref<Media[]>([]);
const car = ref<CarModel | null>(null);
const v = reactive({ year: "", month: "", man: "", chun: "", color: "", owners: "", price: "" });
const title = ref("");
const body = ref("");
const city = ref("");
const layer = ref<"" | "pick" | "edit" | "car" | "date" | "km" | "color" | "owners" | "price" | "city">("");
const editAt = ref(0);
const draft = reactive({ year: "", month: "", man: "", chun: "", color: "", owners: "", price: "" });

const now = new Date();
const YEARS = Array.from({ length: 30 }, (_, i) => String(now.getFullYear() - i));
const MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MAN = Array.from({ length: 51 }, (_, i) => String(i));
const CHUN = Array.from({ length: 10 }, (_, i) => String(i));
const OWNERS = Array.from({ length: 21 }, (_, i) => String(i));

const dateText = computed(() => (v.year ? `${v.year}년 ${v.month}월` : ""));
const kmText = computed(() => (v.man !== "" ? `${v.man}.${v.chun || 0}만km` : ""));
const priceText = computed(() => (v.price ? `${Number(v.price).toLocaleString()}만원` : ""));
/** 예상 시세(서버 시세 API 연결 전): 연식 · 주행거리로 대략 범위를 만든다 */
const estimate = computed(() => {
  if (!car.value || !v.year) return null;
  const age = now.getFullYear() - Number(v.year);
  const base = 5200 * Math.pow(0.86, age) * (1 - Math.min(0.3, (Number(v.man || 0) / 30)));
  return [Math.round(base * 0.9 / 10) * 10, Math.round(base * 1.1 / 10) * 10];
});
const filled = computed(() => Boolean(car.value && v.year && v.man !== "" && v.color && v.owners !== "" && v.price));
const can = computed(() => media.value.length >= 1 && filled.value);
const has = computed(() => Boolean(media.value.length || car.value || body.value.trim()));
const { close, publish } = usePub("sell", {
  snapshot: () => ({ media: media.value, car: car.value, v: { ...v }, title: title.value, body: body.value, city: city.value }),
  restore: (d) => { media.value = d.media; car.value = d.car; Object.assign(v, d.v); title.value = d.title; body.value = d.body; city.value = d.city; },
  dirty: () => has.value, watchOn: [media, car, v, title, body, city],
});
const open = (k: "date" | "km" | "color" | "owners" | "price") => {
  if (!car.value) { layer.value = "car"; return toast("차종을 먼저 골라 주세요"); }
  Object.assign(draft, v);
  if (k === "date" && !draft.year) { draft.year = YEARS[2]!; draft.month = "1"; }
  if (k === "km" && draft.man === "") { draft.man = "2"; draft.chun = "0"; }
  if (k === "owners" && draft.owners === "") draft.owners = "0";
  layer.value = k;
};
const ok = (k: (keyof typeof v)[]) => { k.forEach((x) => (v[x] = draft[x])); layer.value = ""; };
const key = (d: string) => {
  if (d === "del") { draft.price = draft.price.slice(0, -1); return; }
  if (d === "clr") { draft.price = ""; return; }
  if (d === "." && (draft.price.includes(".") || !draft.price)) return;
  if (draft.price.includes(".") && draft.price.split(".")[1]!.length >= 2) return;
  if (draft.price.replace(".", "").length >= 6) return;
  draft.price = draft.price === "0" && d !== "." ? d : draft.price + d;
};
const addImages = (srcs: string[]) => { media.value.push(...srcs.slice(0, MAX - media.value.length).map((src) => ({ kind: "image" as const, src }))); layer.value = ""; };
const onEdited = (imgs: string[]) => { media.value = imgs.map((src) => ({ kind: "image" as const, src })); layer.value = ""; };
const post = () => {
  if (!media.value.length) { layer.value = "pick"; return toast("실제 차량 사진을 1장 이상 올려 주세요"); }
  if (!car.value) { layer.value = "car"; return toast("차종을 골라 주세요"); }
  const miss = [!v.year && "등록 연월", v.man === "" && "현재 주행거리", !v.color && "차량 색상", v.owners === "" && "소유자 변경 횟수", !v.price && "희망 판매가"].filter(Boolean);
  if (miss.length) return toast(`${miss[0]}을(를) 골라 주세요`);
  publish({ title: title.value.trim() || `${car.value.brand} ${car.value.model} 팝니다`, body: body.value.trim(), media: media.value, car: car.value, city: city.value,
    sell: { "등록 연월": dateText.value, "주행거리": kmText.value, "차량 색상": v.color, "소유자 변경": `${v.owners}회`, "희망 판매가": priceText.value },
    raw: { reg_month: `${v.year}.${String(v.month || 1).padStart(2, "0")}`, odometer_km: Number(v.man || 0) * 10000 + Number(v.chun || 0) * 1000, color: v.color, owner_changes: Number(v.owners), price_manwon: Number(v.price) } });
};
</script>

<template>
  <main class="write write--pub write--sell">
    <WriteHead kind="sell" :picked="true" :can-post="can" @close="close" @post="post" @switch="emit('switch', $event)" />
    <p class="psell__hint">실제 차량 사진을 1장 이상 올려야 등록돼요. 외관 · 실내를 여러 각도로 올리면 더 많이 노출돼요!</p>
    <section class="pcard pcard--media"><PubMedia :media="media" :max="MAX" mode="sell" @pick="layer = 'pick'" @edit="editAt = $event; layer = 'edit'" @remove="media.splice($event, 1)" @move="(a, b) => { const [m] = media.splice(a, 1); media.splice(b, 0, m!); }" /></section>

    <section class="pcard psell">
      <button type="button" class="psell__car" @click="layer = 'car'">
        <Ico :src="IC.car" /><template v-if="car"><b>{{ car.model }}</b><span>{{ car.trim }}</span></template><span v-else class="ph">내 차 차종 고르기<i>*</i></span><Ico :src="IC.switch" class="psell__sw" />
      </button>
      <div class="psell__rows">
        <button type="button" @click="open('date')"><span>등록 연월<i>*</i></span><em :class="{ ph: !dateText }">{{ dateText || "선택" }}</em><Ico :src="IC.chevron" /></button>
        <button type="button" @click="open('km')"><span>현재 주행거리(만km)<i>*</i></span><em :class="{ ph: !kmText }">{{ kmText || "선택" }}</em><Ico :src="IC.chevron" /></button>
        <button type="button" @click="open('color')"><span>차량 색상<i>*</i></span><em :class="{ ph: !v.color }">{{ v.color || "선택" }}</em><Ico :src="IC.chevron" /></button>
        <button type="button" @click="open('owners')"><span>소유자 변경 횟수<i>*</i></span><em :class="{ ph: v.owners === '' }">{{ v.owners === "" ? "선택" : `${v.owners}회` }}</em><Ico :src="IC.chevron" /></button>
        <button type="button" @click="open('price')"><span>희망 판매가(만원)<i>*</i></span><em class="psell__won" :class="{ ph: !v.price }">{{ v.price ? `${Number(v.price).toLocaleString()}만원` : "0만원" }}</em><Ico :src="IC.chevron" /></button>
      </div>
    </section>

    <section class="pcard ptext">
      <input v-model="title" class="ptext__title" maxlength="30" placeholder="제목을 쓰면 더 많이 추천돼요(선택)" aria-label="제목" />
      <textarea v-model="body" class="ptext__body" rows="6" :maxlength="BODY_MAX" aria-label="본문" placeholder="내 차 이야기를 나눠 주세요. 더 많이 노출돼요" />
      <div class="psell__tools">
        <AiWrite :make="() => aiDraft('sell', { car, sell: { month: dateText, km: kmText, color: v.color, owners: v.owners === '' ? '' : `${v.owners}회` } })" @apply="body = $event" />
        <button type="button" class="psell__chip" :class="{ 'is-off': !body }" :disabled="!body" @click="body = ''">지우기</button>
        <button type="button" class="psell__chip" @click="layer = 'city'"><Ico :src="IC.location" />{{ city || "지역" }}<i class="tri tri--r" /></button>
        <span class="ptext__count">{{ [...body].length }}/{{ BODY_MAX }}</span>
      </div>
    </section>

    <PhotoPicker v-if="layer === 'pick'" :max="MAX - media.length" title="좋은 차량 사진" @done="addImages" @close="layer = ''" />
    <PhotoEditor v-if="layer === 'edit'" :images="media.map((m) => m.src)" :start="editAt" @done="onEdited" @close="layer = ''" />
    <CarPicker v-if="layer === 'car'" title="내 차 차종" @close="layer = ''" @pick="car = $event; layer = ''" />
    <Sheet xr v-if="layer === 'date'" title="등록 연월" @close="layer = ''">
      <Wheel :cols="[{ label: '연도', options: YEARS, value: draft.year, suffix: '년' }, { label: '월', options: MONTHS, value: draft.month, suffix: '월' }]" @change="(c, x) => (c ? (draft.month = x) : (draft.year = x))" />
      <template #foot><button type="button" class="btn-pri" @click="ok(['year', 'month'])">확인</button></template>
    </Sheet>
    <Sheet xr v-if="layer === 'km'" title="현재 주행거리" @close="layer = ''">
      <Wheel :cols="[{ label: '만 km', options: MAN, value: draft.man, suffix: '만' }, { label: '천 km', options: CHUN, value: draft.chun, suffix: '천' }, { label: '단위', options: ['km'], value: 'km' }]" @change="(c, x) => (c === 0 ? (draft.man = x) : c === 1 ? (draft.chun = x) : null)" />
      <template #foot><button type="button" class="btn-pri" @click="ok(['man', 'chun'])">확인</button></template>
    </Sheet>
    <Sheet xr v-if="layer === 'color'" title="차량 색상" @close="layer = ''">
      <div class="opt-grid"><button v-for="c in CAR_COLORS" :key="c" type="button" :class="{ on: draft.color === c }" @click="draft.color = c">{{ c }}</button></div>
      <template #foot><button type="button" class="btn-pri" :class="{ 'is-off': !draft.color }" @click="draft.color && ok(['color'])">확인</button></template>
    </Sheet>
    <Sheet xr v-if="layer === 'owners'" title="소유자 변경 횟수" @close="layer = ''">
      <Wheel :cols="[{ label: '횟수', options: OWNERS, value: draft.owners, suffix: '회' }]" @change="(_, x) => (draft.owners = x)" />
      <template #foot><button type="button" class="btn-pri" @click="ok(['owners'])">확인</button></template>
    </Sheet>
    <Sheet xr v-if="layer === 'price'" title="내 차 가격 정하기" @close="layer = ''">
      <div class="pkey">
        <p class="pkey__val" :class="{ ph: !draft.price }">{{ draft.price || "희망 판매가를 쓰세요" }}<b>만원</b></p>
        <p v-if="estimate" class="pkey__est">예상 시세 <em>{{ estimate[0]!.toLocaleString() }}~{{ estimate[1]!.toLocaleString() }}만원</em>이면 더 잘 팔려요</p>
        <div class="pkey__pad">
          <button v-for="d in ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'clr']" :key="d" type="button" :aria-label="d === 'clr' ? '모두 지우기' : d" @click="key(d)">{{ d === "clr" ? "지우기" : d }}</button>
          <button type="button" class="pkey__del" aria-label="한 글자 지우기" @click="key('del')">⌫</button>
          <button type="button" class="pkey__ok" :class="{ 'is-off': !draft.price }" @click="draft.price && ok(['price'])">확인</button>
        </div>
      </div>
    </Sheet>
    <Sheet xr v-if="layer === 'city'" title="지역" @close="layer = ''">
      <div class="opt-grid"><button v-for="c in SIDO" :key="c" type="button" :class="{ on: city === c }" @click="city = c; layer = ''">{{ c }}</button></div>
    </Sheet>
  </main>
</template>
