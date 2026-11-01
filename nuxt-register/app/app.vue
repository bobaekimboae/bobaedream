<script setup lang="ts">
// 보배드림 매물 등록 — 초톳 네이티브 앱 「Đăng tin Xe cộ」 순서 그대로(2026-11-01 폰 실측):
// 머리(뒤로 · 제목 · 임시저장) → [사진/영상 → 매물 설명 → 매물 제목 → 판매 가격 → 거래 지역 → 판매자] → [상세 정보] → 하단 고정(등록 방식 · 미리보기 · 등록하기)
import { computed, onMounted, ref, watch } from "vue";
import Ico from "./components/Ico.vue";
import OField from "./components/OField.vue";
import PillRow from "./components/PillRow.vue";
import MediaSection from "./components/MediaSection.vue";
import DetailCard from "./components/DetailCard.vue";
import PickerSheet, { type Section } from "./components/PickerSheet.vue";
import MediaSourceSheet from "./components/MediaSourceSheet.vue";
import RuleSheet from "./components/RuleSheet.vue";
import PostTypeSheet from "./components/PostTypeSheet.vue";
import PreviewSheet from "./components/PreviewSheet.vue";
import DoneSheet from "./components/DoneSheet.vue";
import AddressSheet from "./components/AddressSheet.vue";
import ExitSheet from "./components/ExitSheet.vue";
import PhotoViewer from "./components/PhotoViewer.vue";
import MultiSheet from "./components/MultiSheet.vue";
import PolicySheet from "./components/PolicySheet.vue";
import InspectSheet from "./components/InspectSheet.vue";
import { DESC_DRAFTS, DESC_TEMPLATE, LEASE_COMPANIES, LOCK_ON_LOOKUP, MOCK_PLATE, mockLookup, normPlate, OPTION_GROUPS, POLICY_LINES, RENT_COMPANIES, SALE_KINDS, SELLER_PHONE, INSPECTION_WARN, type SaleKind } from "./lib/devform";
import { IC } from "./lib/icons";
import { CATEGORIES, FUEL, YEARS, truckFormats, truckSubtypes, type CategoryId, type Field } from "./lib/categories";
import { fuelsOf, generationsOf, gradesOf, makerSections, modelsOf } from "./lib/catalog";
import { blank, DESC_MAX, dropDraft, fmtSec, loadDraft, MAX_MEDIA, regionLine, saveDraft, TITLE_MAX, useForm, useTimer, type Media, type PostType, type Region, type Run } from "./lib/form";
import { shootKitUrl, takeHandoff } from "./lib/shoot-handoff";
import { sitePath } from "@kit/site";

const { form, tried, cat, fields, errors, shown, setValue, setCategory } = useForm();
const timer = useTimer();
const debug = ref(false);
const toastMsg = ref("");
let toastT = 0;
const toast = (m: string) => {
  toastMsg.value = m;
  window.clearTimeout(toastT);
  toastT = window.setTimeout(() => (toastMsg.value = ""), 2400);
};

// ── 사진 · 영상 ──
const fileIn = ref<HTMLInputElement | null>(null);
const camIn = ref<HTMLInputElement | null>(null);
const srcOpen = ref(false);
const ruleOpen = ref(false);
let seq = 0;
const posterOf = (url: string) =>
  new Promise<string>((resolve) => {
    const v = document.createElement("video");
    v.muted = true;
    v.playsInline = true;
    v.preload = "metadata";
    v.src = url;
    const done = (s: string) => resolve(s);
    v.onloadeddata = () => {
      v.currentTime = Math.min(0.5, (v.duration || 1) / 3);
    };
    v.onseeked = () => {
      const c = document.createElement("canvas");
      c.width = 320;
      c.height = Math.round((320 * (v.videoHeight || 180)) / (v.videoWidth || 320));
      c.getContext("2d")?.drawImage(v, 0, 0, c.width, c.height);
      done(c.toDataURL("image/jpeg", 0.8));
    };
    v.onerror = () => done("");
    window.setTimeout(() => done(""), 4000);
  });
const durationOf = (url: string) =>
  new Promise<number>((resolve) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.src = url;
    v.onloadedmetadata = () => resolve(Math.round(v.duration || 0));
    v.onerror = () => resolve(0);
  });
const onFiles = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  input.value = "";
  await addFiles(files);
};
const mediaMax = computed(() => cat.value.mediaMax ?? MAX_MEDIA);
const addFiles = async (files: File[]) => {
  srcOpen.value = false;
  const room = mediaMax.value - form.value.media.length;
  if (files.length > room) toast(`사진 · 영상은 ${mediaMax.value}개까지예요. ${room}개만 넣었어요`);
  const big = files.filter((f) => f.type.startsWith("image/") && f.size > 10 * 1024 * 1024).length;
  const list = files.filter((f) => !(f.type.startsWith("image/") && f.size > 10 * 1024 * 1024)).slice(0, Math.max(0, room));
  if (big) toast(`10MB가 넘는 사진 ${big}장은 뺐어요`);
  const add: Media[] = [];
  for (const f of list) {
    const src = URL.createObjectURL(f);
    if (f.type.startsWith("video/")) add.push({ id: `a${Date.now()}${seq++}`, kind: "video", src, poster: await posterOf(src), seconds: await durationOf(src), from: "album" });
    else if (f.type.startsWith("image/")) add.push({ id: `a${Date.now()}${seq++}`, kind: "photo", src, from: "album" });
  }
  if (add.length) form.value = { ...form.value, media: [...form.value.media, ...add] };
};
const removeMedia = (id: string) => (form.value = { ...form.value, media: form.value.media.filter((m) => m.id !== id) });
const moveMedia = (from: number, to: number) => {
  const m = [...form.value.media];
  const [x] = m.splice(from, 1);
  m.splice(to, 0, x);
  form.value = { ...form.value, media: m };
};
const goKit = async (role: "dealer" | "crew") => {
  srcOpen.value = false;
  // 다녀오는 동안 입력한 글이 사라지지 않게 먼저 보관한다
  try {
    await saveDraft(form.value);
  } catch {
    /* 저장 공간이 없어도 촬영은 갈 수 있게 */
  }
  location.href = shootKitUrl(form.value.category, role);
};

// ── 고르기 시트 ──
type Picker = { title: string; key: string; sections: Section[]; value?: string; loading?: boolean; back?: boolean };
const picker = ref<Picker | null>(null);
const optionsFor = async (f: Field): Promise<Section[]> => {
  const o = f.options;
  if (Array.isArray(o)) return [{ items: o }];
  if (o === "year") return [{ items: YEARS }];
  if (o === "truckFormat") return [{ items: truckFormats() }];
  if (o === "truckSubtype") return [{ items: form.value.values.format ? truckSubtypes(form.value.values.format) : [] }];
  if (o === "maker") {
    const c = cat.value;
    if (c.catalog === "list") return [{ items: c.makers ?? [] }];
    return makerSections(c.catalog);
  }
  const v = form.value.values;
  const other = "기타(목록에 없음)";
  if (o === "generation") {
    const list = v.model && v.model !== other ? await generationsOf(v.maker, v.model) : [];
    return [{ items: [...list, other] }];
  }
  if (o === "fuelCat") {
    const list = v.gen && v.gen !== other ? await fuelsOf(v.maker, v.model, v.gen) : [];
    return [{ items: list.length ? list : FUEL }];
  }
  if (o === "grade") {
    const list = v.gen && v.gen !== other ? await gradesOf(v.maker, v.model, v.gen, v.fuel ?? "") : [];
    return [{ items: [...list, other] }];
  }
  if (o === "model") {
    const c = cat.value;
    const mk = form.value.values.maker;
    if (!mk || c.catalog === "list") return [];
    const list = await modelsOf(c.catalog, mk);
    return [{ items: [...list, "기타(목록에 없음)"] }];
  }
  return [];
};
// 옵션처럼 여러 개 고르는 칸
const multi = ref<{ key: string; title: string; groups: { title: string; items: string[] }[]; value: string[] } | null>(null);
const openField = async (f: Field) => {
  if (f.kind === "multi") {
    const cur = form.value.values[f.key];
    multi.value = { key: f.key, title: `${f.label} 고르기`, groups: OPTION_GROUPS, value: cur ? cur.split("|") : [] };
    return;
  }
  if (f.options === "model" && !form.value.values.maker) return toast("제조사를 먼저 골라 주세요");
  if (f.options === "generation" && !form.value.values.model) return toast("모델을 먼저 골라 주세요");
  if (f.options === "grade" && !form.value.values.gen) return toast("세부모델을 먼저 골라 주세요");
  if (f.options === "truckSubtype" && !form.value.values.format) return toast("형식을 먼저 골라 주세요");
  picker.value = { title: `${f.label} 고르기`, key: f.key, sections: [], value: form.value.values[f.key], loading: true };
  try {
    const sections = await optionsFor(f);
    if (picker.value?.key === f.key) picker.value = { ...picker.value, sections, loading: false };
  } catch {
    if (picker.value?.key === f.key) picker.value = { ...picker.value, loading: false };
    toast("목록을 불러오지 못했어요. 잠시 뒤 다시 눌러 주세요");
  }
};
const openCategory = () => (picker.value = { title: "카테고리 고르기", key: "@category", sections: [{ items: CATEGORIES.map((c) => c.name) }], value: cat.value.name });
const applyMulti = (list: string[]) => {
  if (multi.value) setValue(multi.value.key, list.join("|"));
  multi.value = null;
};

// ── 테스트 서버 양식: 차량번호 조회(14러0927 목업) · 판매구분 · 연락처 · 상세설명 유형 · 점검기록부 · 정책 동의 ──
const dev = computed(() => Boolean(cat.value.devForm));
const lookup = () => {
  const plate = normPlate(form.value.values.plate ?? "");
  if (!plate) return toast("차량번호를 입력해 주세요");
  if (plate !== MOCK_PLATE) return toast(`시안 조회는 ${MOCK_PLATE}만 돼요. 「임시번호/직수입」에 체크하면 직접 입력할 수 있어요`);
  const locked = cat.value.fields.map((f) => f.key).filter((k) => LOCK_ON_LOOKUP.includes(k) && mockLookup[k] !== undefined);
  form.value = { ...form.value, values: { ...form.value.values, ...mockLookup }, locked };
  toast("차량 정보를 불러왔어요. 나머지 칸을 채워 주세요");
};
const setImported = (on: boolean) => (form.value = { ...form.value, imported: on });
const setSale = (k: string) => {
  const kind = (SALE_KINDS as readonly string[]).includes(k) ? (k as SaleKind) : "일반";
  form.value = { ...form.value, saleKind: kind, lease: kind === form.value.saleKind ? form.value.lease : { company: "", monthly: "", deposit: "", settle: "", months: "" } };
};
const setLease = (k: keyof FormLease, v: string) => (form.value = { ...form.value, lease: { ...form.value.lease, [k]: v } });
type FormLease = { company: string; monthly: string; deposit: string; settle: string; months: string };
const leaseWord = computed(() => (form.value.saleKind === "렌트" ? "렌트" : "리스"));
const openLeaseCompany = () =>
  (picker.value = { title: `${leaseWord.value}사 고르기`, key: "@lease", sections: [{ items: form.value.saleKind === "렌트" ? RENT_COMPANIES : LEASE_COMPANIES }], value: form.value.lease.company });
const setDescType = (t: string) => {
  const type = t === "기본양식" ? "기본양식" : "직접입력";
  const desc = type === "기본양식" && !form.value.desc.trim() ? DESC_TEMPLATE : form.value.desc;
  form.value = { ...form.value, descType: type, desc };
};
const openDrafts = () => (picker.value = { title: "내 설명글 불러오기", key: "@drafts", sections: [{ items: DESC_DRAFTS.map((d) => `${d.title} · ${d.date}`) }] });
const inspectOpen = ref(false);
const policyOpen = ref(false);
const applyInspect = (no: string) => {
  form.value = { ...form.value, inspectNo: no };
  inspectOpen.value = false;
};
const agreePolicy = () => {
  form.value = { ...form.value, agree: true };
  policyOpen.value = false;
};

// 거래 지역: 초톳 「Địa chỉ」 시트(시·도 → 시·군·구 → 읍·면·동 + 상세 주소)
const addrOpen = ref(false);
const openRegion = () => (addrOpen.value = true);
const applyRegion = (r: NonNullable<Region>) => {
  form.value = { ...form.value, region: r };
  addrOpen.value = false;
};
const onPick = (v: string) => {
  const p = picker.value;
  if (!p) return;
  if (p.key === "@lease") {
    setLease("company", v);
    picker.value = null;
    return;
  }
  if (p.key === "@drafts") {
    const d = DESC_DRAFTS.find((x) => `${x.title} · ${x.date}` === v);
    if (d) {
      form.value = { ...form.value, title: d.title.slice(0, cat.value.titleMax ?? TITLE_MAX), desc: d.body, descType: "직접입력" };
      toast("설명글을 불러왔어요");
    }
    picker.value = null;
    return;
  }
  if (p.key === "@category") {
    const c = CATEGORIES.find((x) => x.name === v);
    if (c && c.id !== form.value.category) {
      setCategory(c.id as CategoryId);
      toast(`${c.name}에 맞는 상세 정보로 바꿨어요`);
    }
    picker.value = null;
    return;
  }
  setValue(p.key, v);
  picker.value = null;
};
const regionText = computed(() => regionLine(form.value.region));

// ── PC 아래 버튼 줄(초톳 PC): 아무것도 없으면 「등록하기」만, 쓴 내용이 생기면 「미리보기」, 사진이 있으면 「임시저장」까지 ──
const hasContent = computed(() => Boolean(form.value.media.length || form.value.desc.trim() || form.value.title.trim()));
// PC 「AI로 설명 쓰기」(초톳 PC 「AI Viết giúp」): 서버 없이 지금 고른 상세 정보로 초안을 만든다. 이미 쓴 글은 지우지 않고 아래에 붙인다
const aiDesc = () => {
  const v = form.value.values;
  const name = [v.maker, v.model, v.gen, v.grade].filter((x) => x && !x.startsWith("기타")).join(" ");
  if (!name) return toast("제조사 · 모델을 먼저 고르면 설명 초안을 만들어 드려요");
  const facts = [v.year && `${v.year}년식`, v.mileage && `주행 ${v.mileage}${cat.value.fields.find((f) => f.key === "mileage")?.unit ?? "km"}`, v.fuel, v.gear, v.color].filter(Boolean).join(" · ");
  const draft = `${name}${facts ? ` (${facts})` : ""} 판매합니다.\n사고 · 정비 이력과 교환한 소모품을 적어 주세요.\n차량 확인 가능한 시간과 장소를 적어 주세요.`;
  const cur = form.value.desc.trim();
  form.value = { ...form.value, desc: (cur ? `${cur}\n\n${draft}` : draft).slice(0, cat.value.descMax ?? DESC_MAX) };
  toast("AI 초안을 넣었어요. 사실과 다른 부분은 고쳐 주세요");
};

// ── 등록 방식 · 미리보기 · 등록하기 ──
const postOpen = ref(false);
const previewOpen = ref(false);
const done = ref<Run | null>(null);
const role = ref<"dealer" | "crew" | "self">("self");
const postName = computed(() => (form.value.postType === "premium" ? "프리미엄 등록(유료)" : "일반 등록(무료)"));
const applyPost = (p: PostType) => {
  form.value = { ...form.value, postType: p };
  postOpen.value = false;
};
const firstErrorEl = () => document.querySelector<HTMLElement>(".media-add.is-err, .of.is-err, .row.is-err, .row-wrap.is-err, .row-err, .agree.is-err");
const submit = async () => {
  tried.value = true;
  timer.mark("등록하기 누름");
  const n = Object.keys(errors.value).length;
  if (n) {
    await new Promise((r) => requestAnimationFrame(r));
    firstErrorEl()?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  timer.mark("등록 완료");
  done.value = timer.finish(form.value, role.value);
  void dropDraft();
};
const again = () => {
  done.value = null;
  tried.value = false;
  form.value = blank(form.value.category);
  timer.reset();
  timer.begin();
  window.scrollTo({ top: 0 });
};
const onSave = async () => {
  try {
    await saveDraft(form.value);
    toast("임시저장했어요. 다음에 열면 이어서 할 수 있어요");
  } catch {
    toast("저장 공간이 부족해 임시저장하지 못했어요");
  }
};
// 뒤로(머리 화살표 · 휴대폰 뒤로가기): 쓴 내용이 있으면 초톳처럼 「임시저장할까요?」를 먼저 묻는다
const exitOpen = ref(false);
const viewAt = ref<number | null>(null);
const dirty = () => {
  const d = cat.value.defaults ?? {};
  const v = form.value.values;
  return Boolean(form.value.media.length || form.value.desc || form.value.title || form.value.price || form.value.region || Object.keys(v).some((k) => v[k] !== d[k]));
};
const leavePage = () => {
  leaving = true;
  if (history.length > 2) history.go(-2);
  else location.href = sitePath("");
};
let leaving = false;
const goBack = () => (dirty() ? (exitOpen.value = true) : leavePage());
const exitSave = async () => {
  exitOpen.value = false;
  try {
    await saveDraft(form.value);
  } catch {
    /* 저장 공간이 없어도 나간다 */
  }
  leavePage();
};
const exitLeave = () => {
  exitOpen.value = false;
  void dropDraft();
  leavePage();
};
// 휴대폰 뒤로가기: 열린 시트가 있으면 시트만 닫고, 없으면 「임시저장할까요?」
const onPop = () => {
  if (leaving) return;
  history.pushState({ reg: 1 }, "");
  if (viewAt.value !== null) viewAt.value = null;
  else if (picker.value) picker.value = null;
  else if (multi.value) multi.value = null;
  else if (inspectOpen.value || policyOpen.value) inspectOpen.value = policyOpen.value = false;
  else if (addrOpen.value) addrOpen.value = false;
  else if (srcOpen.value || ruleOpen.value || postOpen.value || previewOpen.value) srcOpen.value = ruleOpen.value = postOpen.value = previewOpen.value = false;
  else if (exitOpen.value) exitOpen.value = false;
  else goBack();
};

// 걸린 시간 기록 지점
watch(() => form.value.media.length > 0, (v) => v && timer.mark("첫 사진"));
watch(() => form.value.desc.trim().length >= 10, (v) => v && timer.mark("설명"));
watch(() => Boolean(form.value.price), (v) => v && timer.mark("가격"));
watch(() => fields.value.filter((f) => f.required).every((f) => form.value.values[f.key]), (v) => v && timer.mark("상세 정보"));
const elapsed = ref(0);

onMounted(async () => {
  const q = new URLSearchParams(location.search);
  debug.value = q.has("debug");
  const want = q.get("cat");
  const back = q.get("shoot") === "1";
  const d = await loadDraft();
  if (d && back) form.value = { ...blank(), ...d.form };
  else if (d && !back && (d.form.media.length || d.form.desc || d.form.title)) {
    if (window.confirm("지난번에 쓰던 매물이 있어요. 이어서 쓸까요?")) form.value = { ...blank(), ...d.form };
    else void dropDraft();
  }
  if (want && CATEGORIES.some((c) => c.id === want) && !back) setCategory(want as CategoryId);
  if (back) {
    const h = await takeHandoff();
    if (h && (h.media.length || h.region)) {
      const shootIds = new Set(h.media.map((m) => m.id));
      const rest = form.value.media.filter((m) => !shootIds.has(m.id));
      const media = [...h.media, ...rest].slice(0, mediaMax.value);
      const region = form.value.region ?? (h.region && h.region.sido ? { sido: h.region.sido, gu: h.region.gu } : null);
      form.value = { ...form.value, media, region };
      const p = h.media.filter((m) => m.kind === "photo").length;
      const v = h.media.filter((m) => m.kind === "video").length;
      toast(`촬영 키트에서 사진 ${p}장${v ? ` · 영상 ${v}개를` : "을"} 받았어요`);
      timer.mark("촬영 키트 완료");
    }
    q.delete("shoot");
    history.replaceState(null, "", `${location.pathname}${q.toString() ? `?${q}` : ""}`);
  }
  if (!history.state?.reg) history.pushState({ reg: 1 }, "");
  window.addEventListener("popstate", onPop);
  if (!timer.start.value) timer.begin();
  window.setInterval(() => (elapsed.value = Math.round((Date.now() - timer.start.value) / 1000)), 1000);
});
</script>

<template>
  <div class="reg">
    <!-- PC 머리(초톳 PC 「Đăng tin」 머리 66 그대로: 메뉴 · 로고 · 지역 알약 · 검색 · 찜 · 알림 · 채팅 · 내 매물 관리 · 매물 등록 · 내 정보). 등록 화면에서는 로고만 이동하고 나머지는 안내만 띄운다 -->
    <header class="pc-top">
      <button type="button" class="pc-top__menu" aria-label="전체 메뉴" @click="toast('시안 화면에서는 메뉴가 열리지 않아요')"><Ico :src="IC.menu" /></button>
      <a class="pc-top__logo" :href="sitePath('')"><img :src="sitePath('assets', 'bbm', 'header-logo.svg')" alt="보배드림" /></a>
      <button type="button" class="pc-top__region" @click="toast('지역은 아래 「거래 지역」에서 골라 주세요')"><Ico class="pc-top__pin" :src="IC.pinHead" /><span>지역 선택</span><Ico :src="IC.caret" /></button>
      <label class="pc-top__search">
        <Ico :src="IC.search" />
        <input type="search" placeholder="매물 검색" aria-label="매물 검색" @keydown.enter="toast('시안 화면에서는 검색이 되지 않아요')" />
        <button type="button" class="pc-top__go" aria-label="검색" @click="toast('시안 화면에서는 검색이 되지 않아요')"><Ico :src="IC.searchDark" /></button>
      </label>
      <button type="button" class="pc-top__ic" aria-label="찜한 매물" @click="toast('시안 화면에서는 동작하지 않아요')"><Ico :src="IC.heart" /></button>
      <button type="button" class="pc-top__ic" aria-label="알림" @click="toast('시안 화면에서는 동작하지 않아요')"><Ico :src="IC.bell" /></button>
      <button type="button" class="pc-top__pill pc-top__chat" @click="toast('시안 화면에서는 동작하지 않아요')"><Ico :src="IC.chat" />채팅</button>
      <button type="button" class="pc-top__pill" @click="toast('시안 화면에서는 동작하지 않아요')">내 매물 관리</button>
      <span class="pc-top__pill pc-top__pill--pri" aria-current="page">매물 등록</span>
      <button type="button" class="pc-top__me" aria-label="내 정보" @click="toast('시안 화면에서는 동작하지 않아요')"><span class="pc-top__ava"><Ico :src="IC.user" /></span><Ico :src="IC.dropdown" /></button>
    </header>
    <header class="reg-head">
      <button type="button" class="reg-head__back" aria-label="뒤로" @click="goBack"><Ico :src="IC.back" /></button>
      <h1>차량 매물 등록</h1>
      <button type="button" class="reg-head__save" @click="onSave">임시저장</button>
    </header>

    <main class="reg-body">
      <!-- 초톳 PC 왼쪽 「Đừng quên đăng video!」 안내 카드(300 · 따라옴) -->
      <aside class="pc-promo pc-only" aria-label="영상 안내">
        <b>영상도 같이 올려 보세요!</b>
        <ul>
          <li><Ico :src="IC.check" /><span>조회수 최대 <strong>2배</strong></span></li>
          <li><Ico :src="IC.check" /><span><strong>보배드림 숏폼</strong>에 무료로 노출</span></li>
        </ul>
      </aside>
      <div class="pc-left">
        <section class="card card--main card--media" aria-label="사진 · 영상">
          <MediaSection :media="form.media" :max="mediaMax" :error="shown('media')" @add="cat.shootKit ? (srcOpen = true) : fileIn?.click()" @remove="removeMedia" @move="moveMedia" @info="ruleOpen = true" @view="(i: number) => (viewAt = i)" @files="addFiles" />
        </section>
      </div>
      <div class="pc-right">
        <section v-if="!dev" class="card card--main card--form" aria-label="매물 기본 정보">
          <OField id="f-desc" v-model="form.desc" label="매물 설명" required multiline :maxlength="DESC_MAX" :placeholder="cat.descHint" :error="shown('desc')">
            <button type="button" class="of__aipc pc-only" @click="aiDesc"><Ico :src="IC.ai" />AI로 설명 쓰기</button>
            <p class="of__count">{{ form.desc.length.toLocaleString("ko-KR") }}/{{ DESC_MAX.toLocaleString("ko-KR") }}자</p>
            <div v-if="!form.desc.trim()" class="desc-tip pc-only"><b>이렇게 쓰면 좋아요:</b><ul><li>제조사, 모델과 연식</li><li>주행거리, 상태와 판매 가격</li></ul></div>
          </OField>
          <OField id="f-title" v-model="form.title" label="매물 제목" required clearable :maxlength="TITLE_MAX" :placeholder="cat.titleHint" :error="shown('title')" />
          <div class="pc-pair">
            <OField id="f-price" v-model="form.price" label="판매 가격" required numeric :suffix="cat.priceUnit" :error="shown('price')" />
            <OField id="f-region" :model-value="regionText" label="거래 지역" required select clearable select-ph="지역 선택" :display="regionText" :error="shown('region')" @open="openRegion" @clear="form = { ...form, region: null }" />
          </div>
          <PillRow v-model="form.seller" label="판매자" required :options="['개인', '딜러']" />
        </section>
        <!-- 테스트 서버 양식: 「판매 정보」(판매구분 · 판매가격 · 거래지역 · 연락처) + 「상세설명」(내 설명글 · 제목 · 유형 · 본문) -->
        <section v-else class="card card--main card--form" aria-label="판매 정보 · 상세설명">
          <h2 class="dev-sec">판매 정보</h2>
          <PillRow :model-value="form.saleKind" label="판매구분" required :options="[...SALE_KINDS]" @update:model-value="setSale" />
          <template v-if="form.saleKind !== '일반'">
            <OField id="f-leaseCompany" :model-value="form.lease.company" :label="`${leaseWord}사`" required select clearable :display="form.lease.company" :error="shown('leaseCompany')" @open="openLeaseCompany" @clear="setLease('company', '')" />
            <div class="pc-pair">
              <OField id="f-leaseMonthly" :model-value="form.lease.monthly" :label="`월 ${leaseWord}료`" required numeric suffix="만원" :error="shown('leaseMonthly')" @update:model-value="(v: string) => setLease('monthly', v)" />
              <OField id="f-leaseDeposit" :model-value="form.lease.deposit" label="보증금" numeric suffix="만원" @update:model-value="(v: string) => setLease('deposit', v)" />
            </div>
            <div class="pc-pair">
              <OField id="f-leaseSettle" :model-value="form.lease.settle" label="정산금(인수금)" numeric suffix="만원" @update:model-value="(v: string) => setLease('settle', v)" />
              <OField id="f-leaseMonths" :model-value="form.lease.months" label="남은 기간" numeric suffix="개월" @update:model-value="(v: string) => setLease('months', v)" />
            </div>
          </template>
          <div class="pc-pair">
            <OField id="f-price" v-model="form.price" label="판매가격" required numeric :suffix="cat.priceUnit" :error="shown('price')" />
            <OField id="f-region" :model-value="regionText" label="거래지역" required select clearable select-ph="지역 선택" :display="regionText" :error="shown('region')" @open="openRegion" @clear="form = { ...form, region: null }" />
          </div>
          <div class="contact">
            <label class="row-check row-check--lg">
              <input v-model="form.contact" type="checkbox" />
              <span class="row-check__box" aria-hidden="true"><Ico :src="IC.check" /></span>
              <span><b>연락처</b> {{ SELLER_PHONE }}</span>
            </label>
            <ul class="contact__help">
              <li>개인정보 보호를 위해 050 안심번호로 표시됩니다.</li>
              <li>미선택 시 채팅으로만 판매상담할 수 있습니다.</li>
            </ul>
          </div>
          <div class="desc-head">
            <h2 class="dev-sec">상세설명</h2>
            <button type="button" class="desc-head__load" @click="openDrafts">내 설명글 불러오기<Ico :src="IC.chevron" /></button>
          </div>
          <OField id="f-title" v-model="form.title" label="제목" clearable :maxlength="cat.titleMax ?? TITLE_MAX" :placeholder="cat.titleHint" :error="shown('title')" />
          <PillRow :model-value="form.descType" label="유형선택" :options="['직접입력', '기본양식']" required @update:model-value="setDescType" />
          <OField id="f-desc" v-model="form.desc" label="상세설명" multiline :maxlength="cat.descMax ?? DESC_MAX" :placeholder="cat.descHint" :error="shown('desc')">
            <button type="button" class="of__aipc pc-only" @click="aiDesc"><Ico :src="IC.ai" />AI로 설명 쓰기</button>
            <p class="of__count">{{ form.desc.length.toLocaleString("ko-KR") }}/{{ (cat.descMax ?? DESC_MAX).toLocaleString("ko-KR") }}자</p>
            <div v-if="!form.desc.trim()" class="desc-tip pc-only"><b>이렇게 쓰면 좋아요:</b><ul><li>제조사, 모델과 연식</li><li>주행거리, 상태와 판매 가격</li></ul></div>
          </OField>
          <OField id="f-videoUrl" v-model="form.videoUrl" label="외부영상 주소" clearable placeholder="유튜브 등 영상 주소" :error="shown('videoUrl')" />
        </section>
        <DetailCard :cat="cat" :fields="fields" :values="form.values" :err="shown" :locked="form.locked" :imported="form.imported" @open="openField" @set="setValue" @category="openCategory" @lookup="lookup" @imported="setImported" />
        <section v-if="dev" class="card card--extra" aria-label="점검기록부 · 부가서비스">
          <button type="button" class="row row--link" aria-haspopup="dialog" @click="inspectOpen = true">
            <span class="row__label">성능 · 상태 점검기록부</span>
            <span class="row__value" :class="{ 'is-set': form.inspectNo }">{{ form.inspectNo ? `제시번호 ${form.inspectNo}` : "등록" }}</span>
            <Ico class="row__chev" :src="IC.chevron" />
          </button>
          <p class="extra-warn">{{ INSPECTION_WARN[0] }}</p>
          <button type="button" class="row row--link" @click="toast('부가서비스는 정식 서비스에서 고를 수 있어요')">
            <span class="row__label">부가서비스</span>
            <span class="row__value">선택</span>
            <Ico class="row__chev" :src="IC.chevron" />
          </button>
          <div class="agree" :class="{ 'is-err': shown('agree') }">
            <label class="row-check">
              <input id="f-agree" v-model="form.agree" type="checkbox" />
              <span class="row-check__box" aria-hidden="true"><Ico :src="IC.check" /></span>
              <span>위 내용을 확인하였으며 이에 동의합니다. <span class="req">(필수)</span></span>
            </label>
            <p class="agree__line"><button type="button" class="agree__link" @click="policyOpen = true">허위매물 운영정책</button>{{ POLICY_LINES[0].replace("허위매물 운영정책", "") }}</p>
            <p v-if="shown('agree')" class="row-err" role="alert">{{ shown("agree") }}</p>
          </div>
        </section>
        <div class="bar">
          <button type="button" class="bar__post" aria-haspopup="dialog" @click="postOpen = true">
            <Ico :src="form.postType === 'premium' ? IC.premium : IC.coupon" />
            <span>선택됨 <b>{{ postName }}</b></span>
            <Ico class="bar__caret" :src="IC.caret" />
          </button>
          <div class="bar__btns" :class="{ 'is-pc-one': !hasContent, 'is-pc-three': form.media.length > 0 }">
            <button type="button" class="btn btn--line" :class="{ 'pc-hide': !hasContent }" @click="previewOpen = true; timer.mark('미리보기')">미리보기</button>
            <button v-if="form.media.length" type="button" class="btn btn--line pc-only" @click="onSave">임시저장</button>
            <button type="button" class="btn btn--pri" @click="submit">등록하기</button>
          </div>
        </div>
      </div>
    </main>

    <input ref="fileIn" type="file" accept="image/*,video/*" multiple hidden @change="onFiles" />
    <input ref="camIn" type="file" accept="image/*" capture="environment" hidden @change="onFiles" />

    <Transition name="sheet" :duration="{ enter: 250, leave: 150 }">
      <MediaSourceSheet v-if="srcOpen" :kit="cat.shootKit" :cat-name="cat.name" @close="srcOpen = false" @kit="goKit" @album="fileIn?.click()" @camera="camIn?.click()" />
    </Transition>
    <Transition name="sheet" :duration="{ enter: 250, leave: 150 }">
      <RuleSheet v-if="ruleOpen" @close="ruleOpen = false" />
    </Transition>
    <Transition name="sheet" :duration="{ enter: 250, leave: 150 }">
      <PickerSheet v-if="picker" :title="picker.title" :sections="picker.sections" :value="picker.value" :loading="picker.loading" :back="picker.back" :clearable="picker.key !== '@category'" @pick="onPick" @close="picker = null" @clear="setValue(picker.key, ''); picker = null" />
    </Transition>
    <Transition name="sheet" :duration="{ enter: 250, leave: 150 }">
      <PostTypeSheet v-if="postOpen" :value="form.postType" @close="postOpen = false" @apply="applyPost" />
    </Transition>
    <Transition name="sheet" :duration="{ enter: 250, leave: 150 }">
      <PreviewSheet v-if="previewOpen" :form="form" :cat="cat" :fields="fields" @close="previewOpen = false" />
    </Transition>
    <Transition name="sheet" :duration="{ enter: 250, leave: 150 }">
      <AddressSheet v-if="addrOpen" :value="form.region" @close="addrOpen = false" @apply="applyRegion" />
    </Transition>
    <Transition name="sheet" :duration="{ enter: 250, leave: 150 }">
      <ExitSheet v-if="exitOpen" @close="exitOpen = false" @leave="exitLeave" @save="exitSave" />
    </Transition>
    <Transition name="sheet" :duration="{ enter: 250, leave: 150 }">
      <MultiSheet v-if="multi" :title="multi.title" :groups="multi.groups" :value="multi.value" @close="multi = null" @apply="applyMulti" />
    </Transition>
    <Transition name="sheet" :duration="{ enter: 250, leave: 150 }">
      <InspectSheet v-if="inspectOpen" :value="form.inspectNo" @close="inspectOpen = false" @apply="applyInspect" />
    </Transition>
    <Transition name="sheet" :duration="{ enter: 250, leave: 150 }">
      <PolicySheet v-if="policyOpen" @close="policyOpen = false" @agree="agreePolicy" />
    </Transition>
    <PhotoViewer v-if="viewAt !== null" :media="form.media" :start="viewAt" @close="viewAt = null" />
    <DoneSheet v-if="done" :run="done" :premium="form.postType === 'premium'" @close="done = null" @again="again" />

    <div v-if="toastMsg" class="toast" role="status">{{ toastMsg }}</div>
    <aside v-if="debug" class="dbg" aria-label="등록 시간 측정">
      <div>등록 시간 · {{ cat.name }}</div>
      <b>{{ fmtSec(elapsed) }}</b>
      <ul>
        <li v-for="m in timer.marks.value" :key="m.k"><span>{{ m.k }}</span><span>{{ fmtSec(m.t) }}</span></li>
      </ul>
    </aside>
  </div>
</template>
