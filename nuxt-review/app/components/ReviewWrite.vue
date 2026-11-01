<script setup lang="ts">
// 리뷰 쓰기(동처띠 懂车分 작성 화면 실측 2026-11-01): 노출 안내 띠 → 차량 선택 → (오너) 구매 정보 → 종합 평점 → 총평 → 대표 사진.
// 평가 항목은 동력 방식에 따라 바뀐다(전기 = 주행감 · 주행거리·전비 + 더 보기 2개, 내연 = 동력·핸들링 · 연비).
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import Ico from "./Ico.vue";
import WriteHead from "./WriteHead.vue";
import CarPicker from "./CarPicker.vue";
import StarInput from "./StarInput.vue";
import Sheet from "./Sheet.vue";
import { IC } from "../lib/icons";
import { asset } from "../lib/site";
import { ratingCategories, ratingComment, ratingProfiles, SIDO, avg, benchmarkOf, type CarModel, type RatingCategoryId, type Review } from "../lib/data";
import { api } from "../lib/api/client";
import type { ReviewInput } from "../lib/api/contract";
import { ask, toast } from "../lib/ui";
import { back, replace, setLeaveGuard, type Board } from "../lib/route";

const emit = defineEmits<{ switch: [Board] }>();
const MIN = 30;
const GOOD = 300;

const car = ref<CarModel | null>(null);
const picker = ref(false);
const owner = ref(false);
const buy = reactive({ month: "", city: "", price: "", paid: "", metric: "" });
const scores = reactive<Record<string, number>>({});
const more = ref(false);
const body = ref("");
const photo = ref("");
const sheet = ref<"" | "month" | "city" | "rule" | "tip">("");
const tried = ref(false);
const bodyEl = ref<HTMLTextAreaElement | null>(null);

const profile = computed(() => ratingProfiles[car.value?.powertrain ?? "ev"]);
const required = computed<RatingCategoryId[]>(() => profile.value.required);
const optional = computed<RatingCategoryId[]>(() => profile.value.optional);
const shownOptional = computed(() => (more.value ? optional.value : []));
const average = computed(() => {
  const xs = [...required.value, ...shownOptional.value].map((k) => scores[k] ?? 0);
  return xs.some(Boolean) ? avg(xs) : 0;
});
const len = computed(() => [...body.value.trim()].length);
const missingStars = computed(() => required.value.filter((k) => !scores[k]));
const ownerMissing = computed(() => (owner.value ? (["month", "city", "price", "metric"] as const).filter((k) => !buy[k]) : []));
const dirty = computed(() => Boolean(car.value || body.value.trim() || Object.keys(scores).length || photo.value));

const MONTHS = (() => {
  const out: string[] = [];
  const d = new Date();
  for (let i = 0; i < 36; i += 1) { const x = new Date(d.getFullYear(), d.getMonth() - i, 1); out.push(`${x.getFullYear()}.${String(x.getMonth() + 1).padStart(2, "0")}`); }
  return out;
})();

const onPick = (c: CarModel) => {
  car.value = c;
  picker.value = false;
  for (const k of Object.keys(scores)) if (![...ratingProfiles[c.powertrain].required, ...ratingProfiles[c.powertrain].optional].includes(k as RatingCategoryId)) delete scores[k];
};
const onPhoto = (e: Event) => {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (!f) return;
  if (f.size > 8 * 1024 * 1024) return toast("사진은 8MB까지 올릴 수 있어요");
  const r = new FileReader();
  r.onload = () => (photo.value = String(r.result || ""));
  r.readAsDataURL(f);
};
const num = (v: string, dec: number) => {
  const [a, b] = v.replace(/[^\d.]/g, "").split(".");
  return b === undefined ? a ?? "" : `${a}.${b.slice(0, dec)}`;
};

type DraftBody = { car: CarModel; owner: boolean; buy: typeof buy; scores: Record<string, number>; more: boolean; body: string };
const snapshot = (): DraftBody => ({ car: car.value!, owner: owner.value, buy: { ...buy }, scores: { ...scores }, more: more.value, body: body.value });
const restore = (d: DraftBody) => {
  car.value = d.car; owner.value = d.owner; Object.assign(buy, d.buy); Object.assign(scores, d.scores); more.value = d.more; body.value = d.body;
};
/** 임시저장(원본: 차종마다 초안을 두고, 다시 들어오면 「○○ 리뷰 초안을 불러올까요?」): 차를 고른 뒤 바뀔 때마다 0.8초 뒤 저장 */
let saveT: ReturnType<typeof setTimeout> | undefined;
const saveDraft = () => { if (car.value) void api.saveDraft("review", car.value.id, `${car.value.brand} ${car.value.model}`, snapshot()); };
watch([car, owner, buy, scores, more, body], () => { clearTimeout(saveT); saveT = setTimeout(saveDraft, 800); }, { deep: true });

const benchmark = computed(() => (car.value ? benchmarkOf(car.value.brand, car.value.model) : null));

const post = async () => {
  tried.value = true;
  if (!car.value) { picker.value = true; return toast("차량을 먼저 골라 주세요"); }
  if (ownerMissing.value.length) return toast("구매 정보를 모두 채워 주세요");
  if (missingStars.value.length) return toast("필수 항목에 별점을 매겨 주세요");
  if (len.value < MIN) { bodyEl.value?.focus(); return toast(`총평을 ${MIN}자 이상 써 주세요`); }
  const c = car.value;
  const ratingKeys = [...required.value, ...shownOptional.value].filter((k) => scores[k]);
  const input: ReviewInput = {
    model_id: c.id, owner: owner.value, body: body.value.trim(), ratings: Object.fromEntries(ratingKeys.map((k) => [k, scores[k]!])),
    purchase: owner.value ? { month: buy.month, city: buy.city, price: Number(buy.price), paid: buy.paid ? Number(buy.paid) : null, metric: Number(buy.metric) } : null,
  };
  const r: Review = {
    id: `u${Date.now()}`, modelId: c.id, brand: c.brand, model: c.model, trim: c.trim, year: Number((c.trim.match(/^(\d{4})/) || [0, new Date().getFullYear()])[1]),
    powertrain: c.powertrain, brandLogo: c.brandLogo, title: `${c.brand} ${c.model} 리뷰`, body: input.body, author: "나", avatar: "community/assets/profile-avatars/avatar-01.svg",
    publishedAt: new Date().toISOString(), images: photo.value ? [photo.value] : [], views: 0, comments: 0, likes: 0, rating: Number(average.value.toFixed(2)),
    ratings: ratingKeys.map((k) => ({ label: ratingCategories[k].label, score: scores[k]! })),
    owner: owner.value, ownership: owner.value ? "보유 1개월 미만" : "시승 리뷰", location: buy.city || "", benchmark: "",
    purchase: owner.value ? { month: buy.month, price: Number(buy.price), city: buy.city, metric: `${buy.metric}${profile.value.ownerMetric.unit}` } : null, commentList: [], mine: true,
  };
  try {
    const saved = await api.createReview(input, r);
    clearTimeout(saveT);
    await api.deleteDraft("review");
    setLeaveGuard(null);
    toast("리뷰를 등록했어요");
    replace({ board: "review", view: "detail", id: saved.id });
  } catch (e) { toast((e as Error).message || "등록하지 못했어요"); }
};

/** 닫기: 30자가 안 되면 원본처럼 「N자만 더 쓰면 등록돼요. 그만 쓸까요?」, 그만 쓰면 임시저장하고 나간다 */
const leave = () => { clearTimeout(saveT); saveDraft(); setLeaveGuard(null); if (car.value) toast("임시저장했어요"); back(); };
const close = async () => {
  if (!dirty.value) return back();
  if (len.value >= MIN) return leave();
  const stay = await ask(`${MIN - len.value}자만 더 쓰면 등록돼요. 그만 쓸까요?`, "그만 쓰기", "계속 쓰기");
  if (!stay) leave();
};
onMounted(async () => {
  setLeaveGuard(() => { if (!dirty.value) return true; void close(); return false; });
  const d = await api.getDraft<DraftBody>("review");
  if (!d) return;
  const load = await ask(`${d.model_name} 리뷰 임시저장이 있어요. 불러올까요?`, "불러오지 않기", "불러오기");
  if (load) restore(d.payload); else await api.deleteDraft("review");
});
onBeforeUnmount(() => { setLeaveGuard(null); clearTimeout(saveT); });
</script>

<template>
  <main class="write">
    <WriteHead kind="review" :picked="Boolean(car)" :can-post="true" @close="close" @post="post" @switch="emit('switch', $event)" />

    <div class="exposure" aria-label="노출 안내">
      <span class="exposure__tip">300자 넘게 쓰면 더 많이 노출돼요</span>
      <div class="exposure__track"><i class="exposure__car" :style="{ left: `${Math.min(100, (len / GOOD) * 100) * 0.9}%`, '--src': `url('${IC.car}')` }" /><b :style="{ width: `${Math.min(100, (len / GOOD) * 100)}%` }" /><em class="exposure__dot exposure__dot--a" /><em class="exposure__dot exposure__dot--b" /></div>
      <div class="exposure__labels"><span>등록하면 베스트 후보가 돼요</span><span>베스트 리뷰가 되면 더 많이 노출돼요</span></div>
    </div>

    <section class="wcard" :class="{ 'is-miss': tried && !car }">
      <template v-if="!car">
        <h2 class="wcard__t">차량 선택<i>*</i></h2>
        <button type="button" class="addcar" @click="picker = true"><Ico :src="IC.add" /><span>차량 추가</span></button>
      </template>
      <template v-else>
        <button type="button" class="carsel" @click="picker = true">
          <span class="carsel__txt"><b>{{ car.brand }} {{ car.model }}<i class="carsel__tri" /></b><span>{{ car.trim }}</span></span>
          <img v-if="car.photo" :src="asset(car.photo)" alt="" />
        </button>
        <label class="ownerchk">
          <input v-model="owner" type="checkbox" /><span class="ownerchk__box" aria-hidden="true"><Ico :src="IC.check" /></span>
          <b>오너예요</b><em>구매 정보를 쓰면 베스트 리뷰 후보가 돼요</em>
        </label>
        <div v-if="owner" class="buy">
          <button type="button" class="buy__row" :class="{ 'is-miss': tried && !buy.month }" @click="sheet = 'month'"><span>출고 시기<i>*</i></span><em :class="{ ph: !buy.month }">{{ buy.month || "출고한 달을 골라 주세요" }}</em><Ico :src="IC.chevron" class="buy__arr" /></button>
          <button type="button" class="buy__row" :class="{ 'is-miss': tried && !buy.city }" @click="sheet = 'city'"><span>구매 지역<i>*</i></span><em :class="{ ph: !buy.city }">{{ buy.city || "차를 산 지역을 골라 주세요" }}</em><Ico :src="IC.chevron" class="buy__arr" /></button>
          <label class="buy__row" :class="{ 'is-miss': tried && !buy.price }"><span>차량 가격<i>*</i></span><input :value="buy.price" inputmode="numeric" placeholder="숫자만 입력" aria-label="차량 가격(만원)" @input="buy.price = num(($event.target as HTMLInputElement).value, 0)" /><u>만원</u></label>
          <label class="buy__row"><span>실구매가</span><input :value="buy.paid" inputmode="numeric" placeholder="등록비 포함, 선택" aria-label="실구매가(만원)" @input="buy.paid = num(($event.target as HTMLInputElement).value, 0)" /><u>만원</u></label>
          <label class="buy__row" :class="{ 'is-miss': tried && !buy.metric }"><span>{{ profile.ownerMetric.label }}<i>*</i></span><input :value="buy.metric" inputmode="decimal" :placeholder="profile.ownerMetric.placeholder" :aria-label="`${profile.ownerMetric.label}(${profile.ownerMetric.unit})`" @input="buy.metric = num(($event.target as HTMLInputElement).value, 1)" /><u>{{ profile.ownerMetric.unit }}</u></label>
        </div>
      </template>
    </section>

    <section class="wcard rate">
      <div class="rate__head">
        <h2>종합 평점<b v-if="average" class="rate__avg">{{ average.toFixed(2) }}<small>점</small></b></h2>
        <button type="button" class="rate__rule" @click="sheet = 'rule'"><Ico :src="IC.help" />평점 기준</button>
      </div>
      <p v-if="benchmark" class="rate__bench">{{ car!.model }}은(는) {{ benchmark.segment }}에서 평균 <b>{{ benchmark.score.toFixed(2) }}</b>점이에요. 참고해 주세요.</p>
      <div v-for="k in [...required, ...shownOptional]" :key="k" class="rate__row" :class="{ 'is-miss': tried && required.includes(k) && !scores[k], 'is-off': !car }">
        <span class="rate__label">{{ ratingCategories[k].label }}<i v-if="required.includes(k)">*</i></span>
        <span v-if="scores[k]" class="rate__word">{{ ratingComment(k, scores[k]!).korean }}</span>
        <StarInput :model-value="scores[k] ?? 0" :label="ratingCategories[k].label" :disabled="!car" @update:model-value="scores[k] = $event" @blocked="toast('차량을 먼저 골라 주세요'); picker = true" />
      </div>
      <button v-if="optional.length" type="button" class="rate__more" :aria-expanded="more" @click="more = !more">{{ more ? "평가 항목 접기" : "평가 항목 더 보기" }}<i :class="{ up: more }" /></button>
    </section>

    <section class="wcard opinion" :class="{ 'is-miss': tried && len < MIN }">
      <h2 class="wcard__t">총평<i>*</i></h2>
      <textarea ref="bodyEl" v-model="body" maxlength="5000" aria-label="총평" placeholder="차를 간단히 소개하고 평가해 주세요. 4.5점 넘게 또는 3점 아래로 준 항목은 이유를 자세히 써 주세요." />
      <div class="opinion__foot">
        <span v-if="len < MIN"><template v-if="!len"><b>{{ MIN }}</b>자 이상 써야 등록돼요</template><template v-else><b>{{ MIN - len }}</b>자 더 써 주세요</template></span>
        <span v-else-if="len < GOOD"><b>{{ GOOD - len }}</b>자 더 쓰면 더 많이 노출돼요</span>
        <span v-else>베스트 리뷰 후보가 될 수 있어요</span>
        <button type="button" class="opinion__tip" @click="sheet = 'tip'"><Ico :src="IC.help" />베스트 리뷰 팁</button>
      </div>
    </section>

    <section class="wcard cover">
      <div v-if="photo" class="cover__img"><img :src="photo" alt="대표 사진" /><button type="button" aria-label="대표 사진 빼기" @click="photo = ''"><Ico :src="IC.remove" /></button></div>
      <label v-else class="cover__add"><input type="file" accept="image/*" @change="onPhoto" /><Ico :src="IC.add" /><span>대표 사진 추가</span></label>
    </section>

    <CarPicker v-if="picker" title="3단계로 차를 고르고 리뷰 쓰기" @close="picker = false" @pick="onPick" />

    <Sheet v-if="sheet === 'month'" title="출고 시기" @close="sheet = ''">
      <button v-for="m in MONTHS" :key="m" type="button" class="opt" :class="{ on: buy.month === m }" @click="buy.month = m; sheet = ''">{{ m.replace('.', '년 ') }}월<Ico v-if="buy.month === m" :src="IC.check" /></button>
    </Sheet>
    <Sheet v-if="sheet === 'city'" title="구매 지역" @close="sheet = ''">
      <div class="opt-grid"><button v-for="c in SIDO" :key="c" type="button" :class="{ on: buy.city === c }" @click="buy.city = c; sheet = ''">{{ c }}</button></div>
    </Sheet>
    <Sheet v-if="sheet === 'rule'" title="평점 기준" @close="sheet = ''">
      <div class="doc">
        <p>별 하나를 왼쪽 반, 오른쪽 반으로 나눠 0.5점부터 5점까지 매길 수 있어요.</p>
        <p v-for="(w, i) in ['1점 이하 · 매우 아쉬움', '2점 이하 · 아쉬움', '3점 이하 · 보통', '4점 이하 · 만족', '4.5점 이상 · 아주 만족']" :key="i">{{ w }}</p>
        <p>평점 옆 문구는 항목마다 달라요. 예: 외관 5점 「디자인 완성도 최고」.</p>
      </div>
    </Sheet>
    <Sheet v-if="sheet === 'tip'" title="베스트 리뷰 팁" @close="sheet = ''">
      <div class="doc">
        <p>1. 차를 산 이유와 비교했던 차를 써 주세요.</p>
        <p>2. 4.5점 넘게 또는 3점 아래로 준 항목은 겪은 일로 설명해 주세요.</p>
        <p>3. 실제 연비·주행거리, 정비 비용처럼 숫자가 있으면 좋아요.</p>
        <p>4. 직접 찍은 사진을 대표 사진으로 올려 주세요.</p>
        <p>300자를 넘기면 더 많이 노출되고, 구매 정보를 채우면 베스트 리뷰 후보가 돼요.</p>
      </div>
    </Sheet>
  </main>
</template>
