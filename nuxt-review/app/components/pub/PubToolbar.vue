<script setup lang="ts">
// 글쓰기 아래 도구 줄(동처띠 실측): 동태 = 표정 · 투표 · 구매가 · 위치, 질문 = 표정 · 투표, 긴 글 = 표정 · 사진 · 구매가 · 튜닝 부품.
// 표정은 키보드 자리에 판을 연다(최근 사용 · 전체 표정, 지우기). 나머지는 아래 시트.
import { asset } from "../../lib/site";
import { computed, reactive, ref } from "vue";
import Ico from "../Ico.vue";
import Sheet from "../Sheet.vue";
import CarPicker from "../CarPicker.vue";
import { IC } from "../../lib/icons";
import { EMOJI_ALL, EMOJI_RECENT, PART_METRIC, PART_TYPES, type OwnerPrice, type PartCard, type Vote } from "../../lib/publish";
import { SIDO } from "../../lib/data";
import { ask, toast } from "../../lib/ui";

type Tool = "emoji" | "vote" | "price" | "map" | "image" | "refit";
const p = defineProps<{ tools: Tool[]; city?: string; hasVote?: boolean }>();
const emit = defineEmits<{ emoji: [string]; backspace: []; vote: [Vote]; price: [OwnerPrice]; part: [PartCard]; image: [File[]]; city: [string] }>();

const panel = ref(false);
const sheet = ref<"" | "vote" | "voteUntil" | "price" | "priceMonth" | "part" | "partEdit" | "city">("");
const recent = ref<string[]>((() => { try { return JSON.parse(localStorage.getItem("bbm-dcd-emoji") || "null") ?? EMOJI_RECENT; } catch { return EMOJI_RECENT; } })());
const putEmoji = (e: string) => {
  emit("emoji", e);
  recent.value = [e, ...recent.value.filter((x) => x !== e)].slice(0, 8);
  try { localStorage.setItem("bbm-dcd-emoji", JSON.stringify(recent.value)); } catch { /* 저장 실패는 무시 */ }
};

/* 투표(投票): 제목 필수 · 단일/복수 · 선택지 2~10 · 마감 시간 필수 */
const vote = reactive<Vote>({ title: "", multi: false, options: ["", ""], until: "" });
const UNTIL = ["1일 뒤", "3일 뒤", "7일 뒤", "30일 뒤"];
const voteOk = computed(() => vote.title.trim() && vote.options.filter((o) => o.trim()).length >= 2 && vote.until);
const doneVote = () => {
  if (!vote.title.trim()) return toast("투표 제목을 써 주세요");
  if (vote.options.filter((o) => o.trim()).length < 2) return toast("선택지를 2개 이상 써 주세요");
  if (!vote.until) return toast("마감 시간을 골라 주세요");
  emit("vote", { ...vote, options: vote.options.map((o) => o.trim()).filter(Boolean) });
  sheet.value = "";
};

/* 구매가(车主成交价): 차종 · 구매 월 · 차량가 · 실구매가(두 자리 소수, 만원) */
const price = reactive<OwnerPrice>({ car: null, month: "", nake: "", total: "", city: "" });
const picker = ref(false);
const num2 = (v: string) => { const [a, b] = v.replace(/[^\d.]/g, "").split("."); return b === undefined ? a ?? "" : `${a}.${b.slice(0, 2)}`; };
const MONTHS = (() => { const out: string[] = []; const d = new Date(); for (let i = 0; i < 36; i += 1) { const x = new Date(d.getFullYear(), d.getMonth() - i, 1); out.push(`${x.getFullYear()}.${String(x.getMonth() + 1).padStart(2, "0")}`); } return out; })();
const priceOk = computed(() => Boolean(price.car && price.month && price.nake && price.total));
const donePrice = () => { if (!priceOk.value) return; emit("price", { ...price, city: price.city || p.city || "" }); sheet.value = ""; Object.assign(price, { car: null, month: "", nake: "", total: "" }); };

/* 튜닝 부품(选择配件类型 → 编辑配件信息) */
const part = reactive<PartCard>({ type: "", brand: "", metric: "", price: "" });
const openPart = (t: string) => { part.type = t; sheet.value = "partEdit"; };
const donePart = () => { if (!part.brand.trim()) return toast("브랜드 · 모델을 써 주세요"); emit("part", { ...part }); Object.assign(part, { type: "", brand: "", metric: "", price: "" }); sheet.value = ""; };

/* 위치: 원본은 위치 권한부터 묻는다(「开启位置权限」 暂不开启 / 一键开启) */
const askMap = async () => {
  const ok = await ask("위치 권한을 켤까요? 보배드림이 지금 위치로 지역을 채워요", "지금은 안 함", "켜기");
  if (!ok) return;
  if (!navigator.geolocation) { sheet.value = "city"; return; }
  navigator.geolocation.getCurrentPosition(() => { sheet.value = "city"; toast("가까운 지역을 골라 주세요"); }, () => { sheet.value = "city"; toast("위치를 알 수 없어요. 지역을 직접 골라 주세요"); }, { timeout: 5000 });
};
const fileEl = ref<HTMLInputElement | null>(null);
const onFiles = (e: Event) => { const fs = [...((e.target as HTMLInputElement).files ?? [])]; if (fs.length) emit("image", fs); (e.target as HTMLInputElement).value = ""; };
const tap = (t: Tool) => {
  if (t === "emoji") { panel.value = !panel.value; return; }
  panel.value = false;
  if (t === "vote") { if (p.hasVote) return toast("투표는 하나만 넣을 수 있어요"); sheet.value = "vote"; }
  else if (t === "price") sheet.value = "price";
  else if (t === "refit") sheet.value = "part";
  else if (t === "map") void askMap();
  else if (t === "image") fileEl.value?.click();
};
const LABEL: Record<Tool, string> = { emoji: "표정", vote: "투표", price: "구매가", map: "위치", image: "사진", refit: "튜닝 부품" };
const ICON: Record<Tool, string> = { emoji: IC.emoji, vote: IC.vote, price: IC.priceTag, map: IC.pin, image: IC.imagePost, refit: IC.tools };
defineExpose({ closePanel: () => (panel.value = false) });
</script>

<template>
  <div class="ptool" :class="{ 'is-open': panel }">
    <div class="ptool__bar">
      <button v-for="t in tools" :key="t" type="button" class="ptool__btn" :class="{ on: t === 'emoji' && panel }" :aria-label="LABEL[t]" :aria-pressed="t === 'emoji' ? panel : undefined" @click="tap(t)">
        <Ico :src="ICON[t]" />
      </button>
      <input ref="fileEl" type="file" accept="image/*" multiple hidden @change="onFiles" />
    </div>
    <div v-if="panel" class="ptool__emoji" role="group" aria-label="표정">
      <p>최근 사용</p>
      <div class="ptool__grid"><button v-for="e in recent" :key="`r${e}`" type="button" @click="putEmoji(e)">{{ e }}</button></div>
      <p>전체 표정</p>
      <div class="ptool__grid"><button v-for="e in EMOJI_ALL" :key="e" type="button" @click="putEmoji(e)">{{ e }}</button></div>
      <button type="button" class="ptool__bs" aria-label="한 글자 지우기" @click="emit('backspace')">⌫</button>
    </div>
  </div>

  <Sheet v-if="sheet === 'vote'" title="투표" @close="sheet = ''">
    <div class="pvote">
      <input v-model="vote.title" class="pvote__title" maxlength="40" placeholder="투표 제목을 써 주세요(필수)" aria-label="투표 제목" />
      <div class="pvote__box">
        <div class="seg"><button type="button" :class="{ on: !vote.multi }" @click="vote.multi = false">하나만</button><button type="button" :class="{ on: vote.multi }" @click="vote.multi = true">여러 개</button></div>
        <div v-for="(o, i) in vote.options" :key="i" class="pvote__opt"><input v-model="vote.options[i]" maxlength="20" :placeholder="`선택지 ${i + 1}`" :aria-label="`선택지 ${i + 1}`" /><button v-if="vote.options.length > 2" type="button" :aria-label="`선택지 ${i + 1} 빼기`" @click="vote.options.splice(i, 1)"><Ico :src="IC.clear" /></button></div>
        <button v-if="vote.options.length < 10" type="button" class="pvote__add" @click="vote.options.push('')">+ 선택지 추가</button>
      </div>
      <button type="button" class="pvote__until" @click="sheet = 'voteUntil'"><span><i>*</i>마감 시간</span><em :class="{ ph: !vote.until }">{{ vote.until || "선택" }}</em><Ico :src="IC.chevron" /></button>
    </div>
    <template #foot><button type="button" class="btn-pri" :class="{ 'is-off': !voteOk }" @click="doneVote">완료</button></template>
  </Sheet>
  <Sheet v-if="sheet === 'voteUntil'" title="마감 시간" @close="sheet = 'vote'">
    <div class="opt-grid"><button v-for="u in UNTIL" :key="u" type="button" :class="{ on: vote.until === u }" @click="vote.until = u; sheet = 'vote'">{{ u }}</button></div>
  </Sheet>

  <Sheet v-if="sheet === 'price'" title="실제 구매가" @close="sheet = ''">
    <div class="pprice">
      <p class="pprice__city"><Ico :src="IC.location" />{{ price.city || city || "지역 미정" }}</p>
      <button type="button" class="pprice__car" @click="picker = true"><template v-if="price.car"><img v-if="price.car.photo" :src="asset(price.car.photo)" alt="" /><b>{{ price.car.brand }} {{ price.car.model }}</b><span>{{ price.car.trim }}</span></template><template v-else><Ico :src="IC.add" /><span>차종 고르기</span></template></button>
      <button type="button" class="fields__row" @click="sheet = 'priceMonth'"><span>구매 월<i>*</i></span><em :class="{ ph: !price.month }">{{ price.month || "선택" }}</em><Ico :src="IC.chevron" class="fields__arr" /></button>
      <label class="fields__row"><span>차량가<i>*</i></span><input :value="price.nake" inputmode="decimal" placeholder="소수 둘째 자리까지" aria-label="차량가(만원)" @input="price.nake = num2(($event.target as HTMLInputElement).value)" /><u>만원</u></label>
      <label class="fields__row"><span>실구매가<i>*</i></span><input :value="price.total" inputmode="decimal" placeholder="소수 둘째 자리까지" aria-label="실구매가(만원)" @input="price.total = num2(($event.target as HTMLInputElement).value)" /><u>만원</u></label>
    </div>
    <template #foot><button type="button" class="btn-pri" :class="{ 'is-off': !priceOk }" :aria-disabled="!priceOk" @click="donePrice">구매가 넣기</button></template>
  </Sheet>
  <Sheet v-if="sheet === 'priceMonth'" title="구매 월" @close="sheet = 'price'">
    <div class="opt-grid"><button v-for="m in MONTHS" :key="m" type="button" :class="{ on: price.month === m }" @click="price.month = m; sheet = 'price'">{{ m }}</button></div>
  </Sheet>
  <CarPicker v-if="picker" title="차종 고르기" @close="picker = false" @pick="price.car = $event; picker = false" />

  <Sheet v-if="sheet === 'part'" title="부품 종류 고르기" @close="sheet = ''">
    <div class="opt-grid opt-grid--4"><button v-for="t in PART_TYPES" :key="t" type="button" @click="openPart(t)">{{ t }}</button></div>
  </Sheet>
  <Sheet v-if="sheet === 'partEdit'" title="부품 정보" @close="sheet = ''">
    <div class="opt-grid opt-grid--4"><button v-for="t in PART_TYPES" :key="t" type="button" :class="{ on: part.type === t }" @click="part.type = t">{{ t }}</button></div>
    <div class="pprice">
      <label class="fields__row"><span>브랜드 · 모델<i>*</i></span><input v-model="part.brand" maxlength="30" placeholder="예: BBS LM" aria-label="브랜드 · 모델" /></label>
      <label class="fields__row"><span>규격</span><input v-model="part.metric" maxlength="30" :placeholder="PART_METRIC[part.type] || '규격'" aria-label="규격" /></label>
      <label class="fields__row"><span>가격</span><input :value="part.price" inputmode="numeric" placeholder="선택" aria-label="가격(원)" @input="part.price = ($event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 9)" /><u>원</u></label>
    </div>
    <template #foot><button type="button" class="btn-pri" @click="donePart">부품 저장</button></template>
  </Sheet>
  <Sheet v-if="sheet === 'city'" title="지역" @close="sheet = ''">
    <div class="opt-grid"><button v-for="c in SIDO" :key="c" type="button" :class="{ on: city === c }" @click="emit('city', c); sheet = ''">{{ c }}</button></div>
  </Sheet>
</template>
