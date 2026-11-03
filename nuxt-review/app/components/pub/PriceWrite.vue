<script setup lang="ts">
// 실제 구매가(车主价) 올리기 — 동처띠 실측: 보상 안내 → 「구매 영수증 올리면 자동으로 읽어요」 → 필수 5줄(차종 · 차량가 · 실구매가 · 구매 시기 · 구매 지역)
// → 메모 → 「기타 정보 ▾」(결제 방식 일시불/할부 · 구매 대리점 · 추가 혜택). 심사 후 공개되며, 영수증은 다른 사람에게 보이지 않는다.
import { computed, reactive, ref } from "vue";
import WriteHead from "../WriteHead.vue";
import CarPicker from "../CarPicker.vue";
import Sheet from "../Sheet.vue";
import Ico from "../Ico.vue";
import { IC } from "../../lib/icons";
import { asset } from "../../lib/site";
import { readFile } from "../../lib/publish";
import { SIDO, type CarModel } from "../../lib/data";
import { usePub } from "../../lib/usePub";
import { toast } from "../../lib/ui";
import type { Kind } from "../../lib/route";

const emit = defineEmits<{ switch: [Kind] }>();
const car = ref<CarModel | null>(null);
const v = reactive({ nake: "", total: "", month: "", city: "", note: "", pay: "" as "" | "full" | "loan", dealer: "", gift: "" });
const invoice = ref("");
const reading = ref(false);
const more = ref(false);
const layer = ref<"" | "car" | "month" | "city" | "reward">("");
const MONTHS = (() => { const out: string[] = []; const d = new Date(); for (let i = 0; i < 36; i += 1) { const x = new Date(d.getFullYear(), d.getMonth() - i, 1); out.push(`${x.getFullYear()}년 ${x.getMonth() + 1}월`); } return out; })();
const num2 = (s: string) => { const [a, b] = s.replace(/[^\d.]/g, "").split("."); return b === undefined ? a ?? "" : `${a}.${b.slice(0, 2)}`; };
const can = computed(() => Boolean(car.value && v.nake && v.total && v.month && v.city));
const has = computed(() => Boolean(car.value || v.nake || v.total || invoice.value || v.note));
const { close, publish } = usePub("price", {
  snapshot: () => ({ car: car.value, v: { ...v }, invoice: invoice.value }),
  restore: (d) => { car.value = d.car; Object.assign(v, d.v); invoice.value = d.invoice; },
  dirty: () => has.value, watchOn: [car, v, invoice],
});
/** 영수증 자동 인식(서버 OCR 연결 전): 사진을 올리면 읽는 시늉 뒤 비어 있는 칸만 예시로 채우고, 확인을 부탁한다 */
const onInvoice = async (e: Event) => {
  const f = (e.target as HTMLInputElement).files?.[0]; (e.target as HTMLInputElement).value = "";
  if (!f) return;
  invoice.value = await readFile(f);
  reading.value = true;
  setTimeout(() => {
    reading.value = false;
    if (!v.month) v.month = MONTHS[0]!;
    toast("영수증을 읽었어요. 금액이 맞는지 확인해 주세요");
  }, 1500);
};
const post = () => {
  const miss = [!car.value && "차종", !v.nake && "차량가", !v.total && "실구매가", !v.month && "구매 시기", !v.city && "구매 지역"].filter(Boolean);
  if (miss.length) return toast(`${miss[0]}을(를) 채워 주세요`);
  if (Number(v.total) < Number(v.nake) * 0.5) return toast("실구매가가 차량가보다 너무 낮아요. 다시 확인해 주세요");
  const c = car.value!;
  publish({ title: `${c.brand} ${c.model} 실제 구매가`, body: v.note.trim(), media: [], city: v.city,
    ownerPrice: { car: c, month: v.month, nake: v.nake, total: v.total, city: v.city, pay: v.pay || undefined, dealer: v.dealer, note: v.note },
    extra: { "결제 방식": v.pay === "full" ? "일시불" : v.pay === "loan" ? "할부" : "", "구매 대리점": v.dealer, "추가 혜택": v.gift, "영수증": invoice.value ? "제출함(심사용, 공개 안 됨)" : "" } });
};
</script>

<template>
  <main class="write write--pub write--price">
    <WriteHead kind="price" :picked="has" :can-post="can" @close="close" @post="post" @switch="emit('switch', $event)" />
    <section class="pcard prew">
      <button type="button" class="prew__title" @click="layer = 'reward'">보상 안내<Ico :src="IC.help" /></button>
      <p><i />구매가 심사를 통과하면 그 차의 차량 모임 <b class="prew__badge">기여도</b>를 받아요</p>
      <p><i />구매 영수증 심사를 통과하면 <b>300~500 포인트</b>를 받아요</p>
      <label class="prew__inv" :class="{ has: invoice }">
        <input type="file" accept="image/*" @change="onInvoice" />
        <img v-if="invoice" :src="invoice" alt="올린 영수증" /><img v-else class="prew__sample" :src="asset('register/guide/car_interior_dashboard.jpg')" alt="" />
        <span class="prew__plus"><Ico :src="IC.add" /></span><b>{{ reading ? "영수증을 읽는 중…" : invoice ? "영수증 다시 올리기" : "구매 영수증 올리면 자동으로 읽어요" }}</b>
      </label>
    </section>
    <section class="pcard prows">
      <button type="button" class="prows__row" @click="layer = 'car'"><span>차종<i>*</i></span><em :class="{ ph: !car }">{{ car ? `${car.brand} ${car.model} ${car.trim}` : "차종을 골라 주세요" }}</em><Ico :src="IC.chevron" /></button>
      <label class="prows__row"><span>차량가<i>*</i></span><input :value="v.nake" inputmode="decimal" placeholder="소수 둘째 자리까지" aria-label="차량가(만원)" @input="v.nake = num2(($event.target as HTMLInputElement).value)" /><u>만원</u></label>
      <label class="prows__row"><span>실구매가<i>*</i></span><input :value="v.total" inputmode="decimal" placeholder="소수 둘째 자리까지" aria-label="실구매가(만원)" @input="v.total = num2(($event.target as HTMLInputElement).value)" /><u>만원</u></label>
      <button type="button" class="prows__row" @click="layer = 'month'"><span>구매 시기<i>*</i></span><em :class="{ ph: !v.month }">{{ v.month || "시기를 골라 주세요" }}</em><Ico :src="IC.chevron" /></button>
      <button type="button" class="prows__row" @click="layer = 'city'"><span>구매 지역<i>*</i></span><em :class="{ ph: !v.city }">{{ v.city || "지역을 골라 주세요" }}</em><Ico :src="IC.chevron" /></button>
    </section>
    <section class="pcard pnote">
      <h2>메모</h2>
      <textarea v-model="v.note" rows="3" maxlength="300" aria-label="메모" placeholder="예: 탁송비 30만원 포함, 블랙박스 · 틴팅 서비스, 4년 8만km 기본 정비 포함" />
    </section>
    <section class="pcard pmore">
      <button type="button" class="pmore__head" :aria-expanded="more" @click="more = !more"><b>기타 정보</b><small>(채울수록 심사가 빨라요)</small><i class="tri" :class="{ up: more }" /></button>
      <template v-if="more">
        <div class="prows__row"><span>결제 방식</span><div class="seg seg--sm"><button type="button" :class="{ on: v.pay === 'full' }" @click="v.pay = v.pay === 'full' ? '' : 'full'">일시불</button><button type="button" :class="{ on: v.pay === 'loan' }" @click="v.pay = v.pay === 'loan' ? '' : 'loan'">할부</button></div></div>
        <label class="prows__row"><span>구매 대리점</span><input v-model="v.dealer" maxlength="30" placeholder="선택" aria-label="구매 대리점" /></label>
        <label class="prows__row"><span>추가 혜택</span><input v-model="v.gift" maxlength="40" placeholder="예: 썬팅 · 매트 · 보험 지원" aria-label="추가 혜택" /></label>
      </template>
    </section>
    <div class="pfoot-space" />

    <CarPicker v-if="layer === 'car'" title="구매한 차종" @close="layer = ''" @pick="car = $event; layer = ''" />
    <Sheet xr v-if="layer === 'month'" title="구매 시기" @close="layer = ''"><div class="opt-grid"><button v-for="m in MONTHS" :key="m" type="button" :class="{ on: v.month === m }" @click="v.month = m; layer = ''">{{ m }}</button></div></Sheet>
    <Sheet xr v-if="layer === 'city'" title="구매 지역" @close="layer = ''"><div class="opt-grid"><button v-for="c in SIDO" :key="c" type="button" :class="{ on: v.city === c }" @click="v.city = c; layer = ''">{{ c }}</button></div></Sheet>
    <Sheet xr v-if="layer === 'reward'" title="보상 안내" @close="layer = ''"><div class="doc"><p>올린 구매가는 심사 뒤 그 차종의 구매가 목록에 공개돼요. 이름 · 연락처 · 영수증 사진은 공개하지 않아요.</p><p>영수증의 금액과 입력한 금액이 맞아야 포인트를 받아요. 같은 차를 두 번 올리면 처음 것만 인정돼요.</p></div></Sheet>
  </main>
</template>
