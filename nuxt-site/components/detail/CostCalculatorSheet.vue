<script setup lang="ts">
// 리액트 CostCalculatorSheet(detail/index.tsx). onClose → emit("close").
// 차량가격 입력칸은 리액트처럼 매 글자마다 숫자만 남기고 천 단위 쉼표로 다시 그린다(@input).
import { computed, ref } from "vue";
import { asset, getActiveDetailCar, parsePrice } from "@proto/data";
import { useDetailUi } from "../../composables/detail/useDetailUi";
import { formatCostManwon, formatCostWon, type CostBenefit, type CostRegion, type CostVehicleType } from "./detail-local";

const emit = defineEmits<{ close: [] }>();
const { notify } = useDetailUi();
const car = getActiveDetailCar();
const scrollRef = ref<HTMLDivElement | null>(null);
const initialPrice = Math.max(100, parsePrice(car?.price ?? "1억 4,500만원") || 14500);
const price = ref(initialPrice);
const vehicleType = ref<CostVehicleType>("승용");
const fuel = ref(car?.filter?.fuel ?? "가솔린");
const region = ref<CostRegion>(car?.place.includes("경기") ? "경기" : car?.place.includes("서울") ? "서울" : "기타");
const benefit = ref<CostBenefit>("해당없음");
const downPayment = ref(30);
const loanMonths = ref(36);
const advancedOpen = ref(false);
const transferOpen = ref(false);
const loanOpen = ref(false);

const taxRate: Record<CostVehicleType, number> = { 승용: .07, 경차: .04, 승합: .05, 화물: .05 };
const bondRate: Record<CostRegion, number> = { 서울: .012, 경기: .01, 기타: .008 };
const registrationFees = 5;
const managementFee = 44;
const inspectionInsurance = 12;
const calc = computed(() => {
  const baseAcquisitionTax = Math.round(price.value * taxRate[vehicleType.value]);
  const taxDiscount = benefit.value === "장애인" ? baseAcquisitionTax : benefit.value === "다자녀" ? Math.min(140, baseAcquisitionTax) : 0;
  const acquisitionTax = Math.max(0, baseAcquisitionTax - taxDiscount);
  const bondDiscount = Math.round(price.value * bondRate[region.value]);
  const transferCost = acquisitionTax + bondDiscount + registrationFees;
  const total = price.value + transferCost + managementFee + inspectionInsurance;
  const financed = Math.round(total * (1 - downPayment.value / 100));
  const monthlyRate = .069 / 12;
  const monthlyPayment = financed * monthlyRate * ((1 + monthlyRate) ** loanMonths.value) / (((1 + monthlyRate) ** loanMonths.value) - 1);
  return { acquisitionTax, bondDiscount, transferCost, total, financed, monthlyPayment };
});
const fuelOptions = computed(() => Array.from(new Set([fuel.value, "가솔린", "디젤", "하이브리드", "전기"])));
const title = car ? `${car.title} ${car.trim}`.trim() : "벤틀리 컨티넨탈 GT 3세대";
const regions: CostRegion[] = ["서울", "경기", "기타"];
const vehicleTypes: CostVehicleType[] = ["승용", "경차", "승합", "화물"];
const benefits: CostBenefit[] = ["해당없음", "다자녀", "장애인"];

const onPrice = (event: Event) => {
  const input = event.target as HTMLInputElement;
  price.value = Math.max(0, Number(input.value.replace(/[^\d]/g, "")) || 0);
  // 리액트 제어 입력처럼 화면 글자를 상태 값으로 되돌린다(같은 값이면 Vue가 다시 그리지 않으므로 직접 맞춘다)
  input.value = price.value.toLocaleString("ko-KR");
};
const complete = () => {
  scrollRef.value?.scrollTo({ top: 0, behavior: "smooth" });
  notify(`계산 결과는 ${formatCostManwon(calc.value.total)}입니다.`);
};
</script>
<template>
  <div class="cost-calculator-sheet cost-calculator-smart">
    <button class="cost-calculator-close" type="button" aria-label="구매비용 계산기 닫기" @click="emit('close')">
      <img :src="asset('detail/price-history-close.svg')" alt="" />
    </button>

    <div ref="scrollRef" class="cost-calculator-scroll">
      <section class="cost-smart-vehicle" aria-label="계산 대상 차량">
        <span>선택 차량</span>
        <strong>{{ title }}</strong>
        <small>{{ car?.filter ? `${car.filter.year}년 · ${car.filter.mileage.toLocaleString("ko-KR")}km · ${car.filter.fuel}` : "2016년 · 117,037km · 가솔린" }}</small>
      </section>

      <section class="cost-smart-total" aria-live="polite">
        <span>총 구매비용</span>
        <strong>{{ formatCostManwon(calc.total) }}</strong>
        <small>차량가격 포함 · 자동차보험료 제외</small>
      </section>

      <section class="cost-smart-form" aria-label="기본 계산 조건">
        <label class="cost-smart-field">
          <span>차량가격</span>
          <span><input inputmode="numeric" :value="price.toLocaleString('ko-KR')" aria-label="차량가격, 만원 단위" @input="onPrice" />만원</span>
        </label>
        <label class="cost-smart-field">
          <span>등록지역</span>
          <select :value="region" @change="region = ($event.target as HTMLSelectElement).value as CostRegion"><option v-for="value in regions" :key="value">{{ value }}</option></select>
        </label>
        <button class="cost-smart-disclosure" type="button" :aria-expanded="advancedOpen" @click="advancedOpen = !advancedOpen">차량 기본정보 변경 <span aria-hidden="true">{{ advancedOpen ? "−" : "+" }}</span></button>
        <div v-if="advancedOpen" class="cost-smart-advanced">
          <label><span>차종</span><select :value="vehicleType" @change="vehicleType = ($event.target as HTMLSelectElement).value as CostVehicleType"><option v-for="value in vehicleTypes" :key="value">{{ value }}</option></select></label>
          <label><span>연료</span><select :value="fuel" @change="fuel = ($event.target as HTMLSelectElement).value"><option v-for="value in fuelOptions" :key="value">{{ value }}</option></select></label>
          <label><span>감면</span><select :value="benefit" @change="benefit = ($event.target as HTMLSelectElement).value as CostBenefit"><option v-for="value in benefits" :key="value">{{ value }}</option></select></label>
        </div>
        <button class="cost-smart-calculate" type="button" @click="complete">계산하기</button>
      </section>

      <section class="cost-smart-section" aria-labelledby="cost-breakdown-title">
        <h3 id="cost-breakdown-title">비용 상세</h3>
        <div class="cost-smart-list">
          <div><span>차량가격</span><strong>{{ formatCostWon(price) }}</strong></div>
          <button type="button" :aria-expanded="transferOpen" @click="transferOpen = !transferOpen"><span>이전등록비 <small>{{ transferOpen ? "접기" : "상세" }}</small></span><strong>{{ formatCostWon(calc.transferCost) }}</strong></button>
          <div v-if="transferOpen" class="cost-smart-sublist"><span>취득세 <b>{{ formatCostWon(calc.acquisitionTax) }}</b></span><span>공채 할인 <b>{{ formatCostWon(calc.bondDiscount) }}</b></span><span>등록 수수료 <b>{{ formatCostWon(registrationFees) }}</b></span></div>
          <div><span>관리비용</span><strong>{{ formatCostWon(managementFee) }}</strong></div>
          <div><span>성능책임보험료</span><strong>{{ formatCostWon(inspectionInsurance) }}</strong></div>
          <div><span>배송비</span><strong>별도</strong></div>
        </div>
      </section>

      <section class="cost-smart-section cost-smart-loan" aria-labelledby="cost-loan-title">
        <button class="cost-smart-loan-head" type="button" :aria-expanded="loanOpen" @click="loanOpen = !loanOpen">
          <span><b id="cost-loan-title">할부 월 예상</b><small>연 6.9% · 원리금균등</small></span>
          <strong>{{ formatCostManwon(calc.monthlyPayment) }} <i aria-hidden="true">{{ loanOpen ? "−" : "+" }}</i></strong>
        </button>
        <div v-if="loanOpen" class="cost-smart-loan-options">
          <div class="cost-option-row"><span>선수금</span><div><button v-for="value in [20, 30, 40]" :key="value" type="button" :aria-pressed="downPayment === value" @click="downPayment = value">{{ value }}%</button></div></div>
          <div class="cost-option-row"><span>기간</span><div><button v-for="value in [24, 36, 48]" :key="value" type="button" :aria-pressed="loanMonths === value" @click="loanMonths = value">{{ value }}개월</button></div></div>
          <div class="cost-smart-loan-principal"><span>대출원금</span><strong>{{ formatCostWon(calc.financed) }}</strong></div>
        </div>
      </section>

      <p class="cost-disclaimer">계산 결과는 참고용입니다. 실제 세금과 부대비용은 차량 상태, 구매자 조건, 등록지역에 따라 달라질 수 있습니다.</p>
    </div>
    <div class="cost-calculator-footer"><div><span>총 구매비용</span><strong>{{ formatCostManwon(calc.total) }}</strong></div><button type="button" @click="emit('close')">계산 완료</button></div>
  </div>
</template>
