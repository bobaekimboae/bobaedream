<script setup lang="ts">
// 원본 Check the vehicle details: 사진(8~15장) → 기본 정보 → 기술 정보 → 구매자가 먼저 묻는 6가지 → 끝 장면 정보 → 템플릿 → 출력 비율 → 음악 → AI 음성 → 로고 → 영상 언어 → 요약 · 영상 만들기
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import Icon from "./Icon.vue";
import TopBack from "./TopBack.vue";
import Picker from "./Picker.vue";
import Preview from "./Preview.vue";
import { BODY, COLOR, CONDITION, CURRENCY, DRIVETRAIN, FUEL, LANGS, TRANSMISSION, type Opt } from "../lib/options";
import { MUSIC, previewMusic, stopMusic } from "../lib/music";
import { PROJECTS } from "../lib/projects";
import { startVideo } from "../lib/jobs";
import { state, uid } from "../lib/store";
import { ct, rd, sitePath } from "../lib/site";
import { isPc } from "../lib/layout";
import { defaultOptions, emptyDetails, type Details, type Options, type Photo, type TemplateId } from "../lib/types";

const props = defineProps<{ projectId?: string }>();
const emit = defineEmits<{ back: []; go: [v: string, extra?: Record<string, string>, replace?: boolean]; toast: [t: string] }>();
const MIN = 8;
const MAX = 15;

const project = PROJECTS.find((p) => p.id === props.projectId);
const d = reactive<Details>({ ...emptyDetails(), dealer: state.profile.dealer, phone: state.profile.phone, address: state.profile.address });
const o = reactive<Options>(defaultOptions());
const photos = ref<Photo[]>([]);
const loading = ref(false);
/** 원본: 사진을 고르면 「AI is reviewing the photos…」 띠가 뜨고 칸마다 도는 표시 → 끝나면 정보가 채워진다 */
const reviewing = ref(false);
const aiNote = ref("");
const file = ref<HTMLInputElement | null>(null);
const logoFile = ref<HTMLInputElement | null>(null);
const viewer = ref<string>("");
const preview = ref<TemplateId | "">("");
const playing = ref<string>("");
const busy = ref(false);

const selected = computed(() => photos.value.filter((p) => p.selected));
const numOf = (p: Photo) => selected.value.indexOf(p) + 1;
const okPhotos = computed(() => selected.value.length >= MIN && selected.value.length <= MAX);
const ready = computed(() => okPhotos.value && !reviewing.value && d.make.trim() && d.model.trim());
const why = computed(() => (!okPhotos.value ? `사진을 ${MIN}~${MAX}장 골라 주세요(지금 ${selected.value.length}장).` : !d.make.trim() || !d.model.trim() ? "제조사와 모델을 적어 주세요." : ""));

function addBlobs(blobs: Blob[]) {
  for (const blob of blobs) {
    const sel = photos.value.filter((p) => p.selected).length < MAX;
    photos.value.push({ id: uid(), blob, url: URL.createObjectURL(blob), selected: sel });
  }
}
async function onFiles(e: Event) {
  const input = e.target as HTMLInputElement;
  const list = Array.from(input.files ?? []).filter((f) => f.type.startsWith("image/"));
  input.value = "";
  if (!list.length) return;
  const first = photos.value.length === 0;
  addBlobs(list);
  if (first && !project) {
    // 원본은 사진을 올리면 AI가 제조사 · 모델 · 연식 · 주행거리(계기판) · 변속기 · 연료 · 구동 · 바디 · 색을 채운다.
    reviewing.value = true;
    await new Promise((r) => setTimeout(r, 2400));
    reviewing.value = false;
    aiNote.value = "사진 자동 인식은 서버 연결 뒤에 켜져요. 지금은 정보를 직접 적어 주세요.";
  }
}
onMounted(async () => {
  if (!project) return;
  loading.value = true;
  const blobs = await Promise.all(project.photos.map(async (u) => { try { const r = await fetch(u); return r.ok ? await r.blob() : null; } catch { return null; } }));
  addBlobs(blobs.filter(Boolean) as Blob[]);
  loading.value = false;
  reviewing.value = true;
  await new Promise((r) => setTimeout(r, 2400));
  reviewing.value = false;
  for (const [k, val] of Object.entries(project.details)) if (val && !(d as Record<string, unknown>)[k]) (d as Record<string, unknown>)[k] = val;
});
onBeforeUnmount(() => { photos.value.forEach((p) => URL.revokeObjectURL(p.url)); stopMusic(); });

function toggle(p: Photo) {
  if (!p.selected && selected.value.length >= MAX) return emit("toast", `사진은 최대 ${MAX}장까지 고를 수 있어요.`);
  p.selected = !p.selected;
}
function remove(p: Photo) {
  URL.revokeObjectURL(p.url);
  photos.value = photos.value.filter((x) => x !== p);
}

// 고르기 시트
const sheet = ref<{ key: keyof Details; title: string; list: { v: string; ko: string }[] } | null>(null);
const openSheet = (key: keyof Details, title: string, list: (Opt | { v: string; ko: string })[]) => (sheet.value = { key, title, list });
const shown = (key: keyof Details, list: (Opt | { v: string; ko: string })[]) => list.find((x) => x.v === d[key])?.ko ?? "";
function pick(v: string) {
  if (!sheet.value) return;
  (d as Record<string, string>)[sheet.value.key] = v;
  sheet.value = null;
}
const set = <K extends keyof Details>(k: K, v: Details[K]) => { d[k] = (d[k] === v ? "" : v) as Details[K]; };

async function playMusic(id: string) {
  if (playing.value === id) { stopMusic(); playing.value = ""; return; }
  playing.value = id;
  await previewMusic(id as never, () => { if (playing.value === id) playing.value = ""; });
}
function onLogo(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0];
  (e.target as HTMLInputElement).value = "";
  if (!f) return;
  const r = new FileReader();
  r.onload = () => { o.logo = String(r.result); };
  r.readAsDataURL(f);
}
const tplName: Record<TemplateId, string> = { classic: "클래식", modern: "모던", showcase: "쇼케이스" };

async function create() {
  if (!ready.value || busy.value) return;
  busy.value = true;
  state.profile.dealer = d.dealer; state.profile.phone = d.phone; state.profile.address = d.address;
  const id = await startVideo({ ...d }, { ...o }, selected.value.map((p) => p.blob), project?.id);
  emit("go", "making", { id }, true);
}
const previewPhotos = computed(() => (selected.value.length >= 3 ? selected.value.map((p) => p.url) : PROJECTS[0]!.photos.slice(0, 10)));
const previewDetails = computed(() => (d.make && d.model ? { ...d } : { ...PROJECTS[0]!.details }));
</script>

<template>
  <TopBack @back="emit('back')" />
  <main class="page dt">
    <div class="dt-form">
    <h1 class="h1">차량 정보 확인</h1>
    <p class="lead">AI가 사진을 보고 정보를 채워요. 확인하고 고친 뒤 정하세요.</p>

    <div v-if="reviewing" class="ai-rev" role="status"><span class="car"><Icon :src="sitePath('assets', 'bbm', 'detail-icons', 'maker.svg')" /></span><span><b>AI가 사진을 확인하는 중…</b><span>확인이 끝나면 정보가 자동으로 채워지고, 고칠 수 있어요</span></span></div>
    <div class="sec ph">사진 · {{ photos.length }}장 중 {{ selected.length }}장 고름 <small>{{ selected.length }} / {{ MIN }}–{{ MAX }}</small></div>
    <p class="hint">영상에 넣을 사진을 고르세요. 최소 {{ MIN }}장, 최대 {{ MAX }}장.</p>
    <input ref="file" type="file" accept="image/*" multiple class="sr" @change="onFiles" />
    <button v-if="!photos.length && !loading" class="pick" type="button" @click="file?.click()"><Icon :src="rd('add-outline-24')" /><span>사진 고르기</span></button>
    <p v-else-if="loading && !photos.length" class="empty"><span class="spin" style="display: inline-block; vertical-align: middle; margin-right: 8px" /> 사진을 불러오는 중…</p>
    <div v-else class="grid3">
      <div v-for="p in photos" :key="p.id" class="tile" :class="{ off: !p.selected, loading: reviewing }">
        <img :src="p.url" alt="" @click="toggle(p)" />
        <span v-if="p.selected" class="tile-n">{{ numOf(p) }}</span>
        <button class="tile-ck" type="button" :aria-pressed="p.selected" :aria-label="p.selected ? '고름 풀기' : '고르기'" @click="toggle(p)"><Icon :src="rd('checkmark-fill')" /></button>
        <button class="tile-act zoom" type="button" aria-label="크게 보기" @click="viewer = p.url"><Icon :src="ct('chotot-common-search-white')" /></button>
        <button class="tile-act del" type="button" aria-label="사진 빼기" @click="remove(p)"><Icon :src="rd('close-outline')" /></button>
      </div>
      <button v-if="photos.length < 30" class="tile add" type="button" aria-label="사진 더 올리기" @click="file?.click()">+</button>
    </div>
    <p v-if="aiNote" class="hint" style="margin-top: 10px; color: var(--or)">{{ aiNote }}</p>

    <div class="sec">기본 정보</div>
    <div class="fld-grid">
    <div class="fld"><div class="fld-l">제조사<em>필수</em></div><input v-model="d.make" class="inp" /></div>
    <div class="fld"><div class="fld-l">모델<em>필수</em></div><input v-model="d.model" class="inp" /></div>
    <div class="fld"><div class="fld-l">연식</div><input v-model="d.year" class="inp" inputmode="numeric" maxlength="4" /></div>
    <div class="fld"><div class="fld-l">가격</div><input v-model="d.price" class="inp" inputmode="numeric" placeholder="예: 1,950" /></div>
    <div class="fld s"><div class="fld-l">통화</div><button class="sel" type="button" @click="openSheet('currency', '통화', CURRENCY)">{{ shown('currency', CURRENCY) }}<Icon :src="ct('chotot-pc-detail-chevron-down-white-bg')" /></button></div>
    </div>

    <div class="sec">기술 정보</div>
    <div class="unit"><button type="button" :aria-pressed="d.unit === 'km'" @click="d.unit = 'km'">KM</button><button type="button" :aria-pressed="d.unit === 'mi'" @click="d.unit = 'mi'">MI</button></div>
    <div class="fld-grid">
    <div class="fld"><div class="fld-l">주행거리 ({{ d.unit }})</div><input v-model="d.mileage" class="inp" inputmode="numeric" placeholder="예: 62,000" /></div>
    <div class="fld"><div class="fld-l">출력</div><input v-model="d.power" class="inp" inputmode="numeric" placeholder="예: 110 hp" /></div>
    <div class="fld"><div class="fld-l">배기량</div><input v-model="d.engine" class="inp" inputmode="numeric" placeholder="예: 999 cc" /></div>
    <div v-for="f in ([['transmission', '변속기', TRANSMISSION], ['fuel', '연료', FUEL], ['drivetrain', '구동', DRIVETRAIN], ['body', '바디타입', BODY], ['color', '색상', COLOR], ['condition', '상태', CONDITION]] as const)" :key="f[0]" class="fld s">
      <div class="fld-l">{{ f[1] }}</div>
      <button class="sel" type="button" @click="openSheet(f[0], f[1], f[2])"><span v-if="shown(f[0], f[2])">{{ shown(f[0], f[2]) }}</span><span v-else class="ph">{{ f[1] }}</span><Icon :src="ct('chotot-pc-detail-chevron-down-white-bg')" /></button>
    </div>
    </div>

    <div class="sec">구매자가 먼저 묻는 것</div>
    <p class="hint ask-h">중고차 구매자가 가장 많이 묻는 6가지예요. 모두 선택 항목이고, 고른 것은 영상과 마지막 장면에 나와요.</p>
    <div class="ask-grid">
    <div class="ask"><b>사고 이력</b><div class="opts c2"><button type="button" :aria-pressed="d.damage === 'no'" @click="set('damage', 'no')">없음</button><button type="button" :aria-pressed="d.damage === 'yes'" @click="set('damage', 'yes')">있음</button></div></div>
    <div class="ask"><b>도색 부위</b><div class="opts c2"><button type="button" :aria-pressed="d.repainted === 'no'" @click="set('repainted', 'no')">없음</button><button type="button" :aria-pressed="d.repainted === 'yes'" @click="set('repainted', 'yes')">있음</button></div></div>
    <div class="ask"><b>교환 부위</b><div class="opts c2"><button type="button" :aria-pressed="d.replaced === 'no'" @click="set('replaced', 'no')">없음</button><button type="button" :aria-pressed="d.replaced === 'yes'" @click="set('replaced', 'yes')">있음</button></div></div>
    <div class="ask"><b>소유자 수</b><div class="opts c3"><button type="button" :aria-pressed="d.owners === '1'" @click="set('owners', '1')">1인 소유</button><button type="button" :aria-pressed="d.owners === '2'" @click="set('owners', '2')">2인</button><button type="button" :aria-pressed="d.owners === '3+'" @click="set('owners', '3+')">3인 이상</button></div></div>
    <div class="ask"><b>보증</b><div class="opts c2"><button type="button" :aria-pressed="d.warranty === 'active'" @click="set('warranty', 'active')">유효</button><button type="button" :aria-pressed="d.warranty === 'expired'" @click="set('warranty', 'expired')">만료</button></div></div>
    <div class="ask"><b>대차(보상판매)</b><div class="opts c2"><button type="button" :aria-pressed="d.tradeIn === 'accepted'" @click="set('tradeIn', 'accepted')">가능</button><button type="button" :aria-pressed="d.tradeIn === 'not'" @click="set('tradeIn', 'not')">불가</button></div></div>
    </div>

    <div class="sec">마지막 장면 정보</div>
    <p class="hint end-h">영상 마지막 장면에 나와요. 모두 선택 항목이에요.</p>
    <div class="fld-grid">
    <div class="fld"><div class="fld-l">딜러 · 상사 이름</div><input v-model="d.dealer" class="inp" /></div>
    <div class="fld"><div class="fld-l">전화</div><input v-model="d.phone" class="inp" inputmode="tel" /></div>
    <div class="fld"><div class="fld-l">주소</div><input v-model="d.address" class="inp" /></div>
    </div>

    <div class="sec">템플릿</div>
    <div class="tpl-list">
    <div v-for="t in ([['classic', '차분한 전환과 깔끔한 글자. 첫 장면 · 사양 · 마지막 연락처가 늘 같은 순서로 나와요. 모든 브랜드 · 차종에 어울려요.', 'rd:image-post-outline'], ['modern', '빠른 컷과 힘 있는 전환. 움직이는 글자, 빠른 편집. SNS에서 눈에 띄게 만들었어요.', 'rd:powerup-outline'], ['showcase', '모든 사양을 화면에. 가격 · 주행거리 · 엔진 · 옵션을 하나씩 보여 줘요. 정보를 먼저 보고 싶은 분께.', 'rd:view-grid-outline']] as const)" :key="t[0]" class="tpl" role="button" tabindex="0" :aria-pressed="o.template === t[0]" @click="o.template = t[0]" @keydown.enter="o.template = t[0]">
      <div class="tpl-h"><Icon class="ti" :src="rd(t[2].slice(3))" /><b>{{ tplName[t[0]] }}</b><button class="play" type="button" :aria-label="`${tplName[t[0]]} 미리보기`" @click.stop="preview = t[0]"><Icon :src="rd('play-fill')" /></button></div>
      <p>{{ t[1] }}</p>
    </div>
    </div>

    <div class="sec">출력 비율</div>
    <div class="fmt">
      <button type="button" :aria-pressed="o.aspect === '9:16'" @click="o.aspect = '9:16'"><b>9:16</b><span>릴스 / 쇼츠</span></button>
      <button type="button" :aria-pressed="o.aspect === '1:1'" @click="o.aspect = '1:1'"><b>1:1</b><span>인스타그램</span></button>
      <button type="button" :aria-pressed="o.aspect === '16:9'" @click="o.aspect = '16:9'"><b>16:9</b><span>유튜브</span></button>
    </div>

    <div class="sec">음악</div>
    <div class="mus">
      <div v-for="m in MUSIC" :key="m.id" :class="{ np: m.id === 'none' }" role="button" tabindex="0" :aria-pressed="o.music === m.id" @click="o.music = m.id" @keydown.enter="o.music = m.id">
        <button v-if="m.id !== 'none'" class="play" type="button" :aria-label="`${m.label} 들어 보기`" @click.stop="o.music = m.id; playMusic(m.id)"><Icon :src="playing === m.id ? rd('close-outline') : rd('play-fill')" /></button>
        <span>{{ m.label }}</span>
      </div>
    </div>

    <div class="sec">AI 음성</div>
    <div class="vo"><span>영상에 AI 음성을 넣어요. 켜면 장면마다 읽을 문장을 편집할 때 자동으로 써요.</span><button class="sw" type="button" role="switch" :aria-checked="o.voiceover" aria-label="AI 음성" @click="o.voiceover = !o.voiceover" /></div>

    <div class="sec">로고</div>
    <input ref="logoFile" type="file" accept="image/*" class="sr" @change="onLogo" />
    <div class="logos">
      <button type="button" :aria-pressed="!o.logo" @click="o.logo = null">로고 없음</button>
      <button type="button" :aria-pressed="!!o.logo" @click="logoFile?.click()"><img v-if="o.logo" :src="o.logo" alt="고른 로고" /><template v-else>로고 넣기</template></button>
    </div>
    <p class="logo-h">영상 끝에 나와요(선택).</p>

    <div class="sec">영상 언어</div>
    <div class="langs"><button v-for="l in LANGS" :key="l.v" type="button" :aria-pressed="o.lang === l.v" @click="o.lang = l.v">{{ l.label }}</button></div>

    </div>
    <aside class="dt-side">
    <div v-if="isPc && selected.length" class="dt-cover"><img :src="selected[0]!.url" alt="대표 사진" /><span>대표 사진 · {{ selected.length }}장</span></div>
    <section class="sum">
      <h4>요약</h4>
      <dl>
        <dt>차량</dt><dd>{{ [d.make, d.model, d.year].filter(Boolean).join(" · ") || "-" }}</dd>
        <dt>사진</dt><dd>{{ selected.length }}</dd>
        <dt>템플릿</dt><dd>{{ tplName[o.template] }}</dd>
        <dt>출력 비율</dt><dd>{{ o.aspect }}</dd>
        <dt>음악</dt><dd>{{ o.music === "none" ? "끔" : "켬" }}</dd>
        <dt>AI 음성</dt><dd>{{ o.voiceover ? "켬" : "끔" }}</dd>
      </dl>
      <div class="free"><span>이번 영상</span><b>한시 무료</b></div>
      <button class="btn or" type="button" :disabled="!ready || busy" @click="create">✦ 영상 만들기</button>
      <p v-if="why" class="sr" aria-live="polite">{{ why }}</p>
      <button class="back2" type="button" @click="emit('back')">← 뒤로</button>
    </section>
    </aside>
  </main>

  <Picker v-if="sheet" :title="sheet.title" :list="sheet.list" :value="String(d[sheet.key])" @pick="pick" @close="sheet = null" />
  <div v-if="viewer" class="viewer" @click="viewer = ''"><img :src="viewer" alt="크게 본 사진" /><button class="x" type="button" aria-label="닫기"><Icon :src="rd('close-outline')" /></button></div>
  <Preview v-if="preview" :template="preview" :photos="previewPhotos" :details="previewDetails" :aspect="o.aspect" :lang="o.lang" @close="preview = ''" />
</template>
