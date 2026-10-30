// 리액트 src/prototype/dealer-page/shortform/ShortformStudio.tsx 의 ShortformStudio 를 Vue 렌더 함수(TSX)로 옮김.
// 리액트 판과 줄 단위로 대조할 수 있게 그릴 때마다 계산하는 구조를 그대로 두었다(lib/render-hooks.ts).
// props: cars: Car[] · dealer: DealerInfo · initialCarId?: number
// emits(리액트 콜백): close() · publish(made: MadeShortform) · toast(message: string)  — JSX 에서는 onClose · onPublish · onToast
// 그리기·mp4 만들기(render.ts)·자동 대본 계산은 공유 파일을 그대로 쓴다.
import { defineComponent, ref, shallowRef, type PropType } from "vue";
import { asset, type Car } from "@proto/data";
import { bbmCardSpec } from "@proto/data/bbm-card-samples";
import { ASPECT_SIZE, CUT, END_CARD, VIDEO_CUT_MAX, canMakeMp4, cutAt, drawFrame, exportMp4, loadImage, loadVideo, makeQr, planDuration, type Cut, type ShortformAspect, type ShortformPlan, type ShortformTemplate } from "@proto/dealer-page/shortform/render";
import { captionFor, type PlatformId } from "@proto/dealer-page/shortform/SnsPublish";
import type { MadeShortform } from "@proto/dealer-page/shortform/ShortformStudio";
import "@proto/dealer-page/shortform/shortform-studio.css";
import { renderHooks, setter } from "../../../lib/render-hooks";
import SnsPublish from "./SnsPublish.vue";
import Cross2Icon from "../../icons/Cross2Icon.vue";
import PauseIcon from "../../icons/PauseIcon.vue";
import PlayIcon from "../../icons/PlayIcon.vue";
import ChevronUpIcon from "../../icons/ChevronUpIcon.vue";
import ChevronDownIcon from "../../icons/ChevronDownIcon.vue";

export type { MadeShortform };
export type DealerInfo = { name: string; company: string; phone: string; photo: string; storageKey: string; snsHandles: Partial<Record<PlatformId, string>>; shop: string; emp: string };
type Step = "pick" | "edit" | "making" | "done";
// 재료: 매물 사진 + 딜러가 직접 넣은 영상(2026-10-22 「추가 기능」).
type Media = { id: string; kind: "image" | "video"; src: string; image?: HTMLImageElement | null; video?: HTMLVideoElement; file?: Blob; duration?: number };
type LengthOption = "auto" | 15 | 30 | 60;
type Voice = { url: string; buffer: AudioBuffer; seconds: number };

const FPS = 30;
const MAX_CUTS = 12;
// 사진이 적은 매물도 영상 길이가 너무 짧지 않게 최소 4컷(같은 사진은 다른 방향으로 움직여 다시 쓴다).
const MIN_CUTS = 4;
const cutsOf = (selected: string[]) => selected.length ? Array.from({ length: Math.max(MIN_CUTS, selected.length) }, (_, i) => selected[i % selected.length]) : [];

// 사진 제한 없음(이전 12장). 매물에 등록된 사진을 모두 고를 수 있다.
const photosOf = (car: Car) => (car.photoList?.length ? car.photoList : [car.image]).filter(Boolean);
const priceOf = (car: Car) => {
  const value = String(car.price ?? "");
  if (!value || /상담/.test(value)) return "";
  return /만원/.test(value) ? value.replace(/\s*만원/, "만원") : `${value}만원`;
};
const modelOf = (car: Car) => (car.modelGroup || car.title.replace(new RegExp(`^${car.maker}\\s*`), "")).split(" ").slice(0, 2).join(" ");

// 자동 대본: 매물 정보에 있는 사실만 쓴다(사고 이력·상태 같은 확인 안 된 말은 넣지 않는다). (리액트 파일에서 export 안 됨 → 복사)
function autoLines(car: Car, dealerName: string, count: number) {
  const specs = bbmCardSpec(car, false).split(" · ").filter(Boolean);
  const year = specs.find((part) => /^\d{4}$|년/.test(part)) ?? "";
  const mileage = specs.find((part) => /km$/.test(part)) ?? "";
  const fuel = specs.find((part) => /가솔린|디젤|하이브리드|전기|LPG|수소/.test(part)) ?? "";
  const price = priceOf(car);
  const pool = [
    `${year} ${car.maker} ${modelOf(car)}`.trim(),
    mileage ? `주행거리 ${mileage}` : "",
    fuel ? `${fuel} 모델이에요` : "",
    price ? `판매가 ${price}` : "가격은 상담으로 안내해요",
    `${dealerName} 딜러가 직접 판매해요`,
    car.place ? `${car.place.split(" · ")[0]}에서 바로 보실 수 있어요` : "",
    "사진은 보배드림에서 더 보세요",
    "문의는 안심번호로 편하게",
  ].filter(Boolean);
  return Array.from({ length: count }, (_, i) => pool[i] ?? pool[pool.length - 1]);
}

export default defineComponent({
  name: "ShortformStudio",
  props: {
    cars: { type: Array as PropType<Car[]>, required: true },
    dealer: { type: Object as PropType<DealerInfo>, required: true },
    initialCarId: { type: Number, default: undefined },
  },
  emits: { close: () => true, publish: (_made: MadeShortform) => true, toast: (_message: string) => true },
  setup(props, { emit }) {
    const onClose = () => emit("close");
    const onPublish = (made: MadeShortform) => emit("publish", made);
    const onToast = (message: string) => emit("toast", message);
    const hooks = renderHooks();

    const usableOf = () => props.cars.filter((car) => photosOf(car).length);
    const carRef = shallowRef<Car | null>(usableOf().find((item) => item.id === props.initialCarId) ?? null);
    const stepRef = ref<Step>(carRef.value ? "edit" : "pick");
    const templateRef = ref<ShortformTemplate>("reels");
    const aspectRef = ref<ShortformAspect>("9:16");
    const lengthRef = ref<LengthOption>("auto");
    const mediaRef = shallowRef<Media[]>([]);
    const selectedRef = shallowRef<string[]>([]);
    const linesRef = shallowRef<string[]>([]);
    const hookRef = ref("");
    const showPriceRef = ref(true);
    const showQrRef = ref(true);
    const qrRef = shallowRef<HTMLCanvasElement | null>(null);
    const voiceRef = shallowRef<Voice | null>(null);
    const recordingRef = ref(false);
    const dealerImageRef = shallowRef<HTMLImageElement | null>(null);
    const loadingRef = ref(false);
    const playingRef = ref(true);
    const progressRef = ref(0);
    const errorRef = ref("");
    const supportedRef = ref<boolean | null>(null);
    const resultRef = shallowRef<MadeShortform | null>(null);
    const canvasRef = ref<HTMLCanvasElement | null>(null);
    const audioRef = ref<HTMLAudioElement | null>(null);
    const fileRef = ref<HTMLInputElement | null>(null);
    let recorder: MediaRecorder | null = null;
    const timeRef = { current: 0 };
    const cancelRef = { current: false };

    const setCar = setter(carRef); const setStep = setter(stepRef); const setTemplate = setter(templateRef); const setAspect = setter(aspectRef);
    const setLength = setter(lengthRef); const setMedia = setter(mediaRef); const setSelected = setter(selectedRef); const setLines = setter(linesRef);
    const setHook = setter(hookRef); const setShowPrice = setter(showPriceRef); const setShowQr = setter(showQrRef); const setQr = setter(qrRef);
    const setVoice = setter(voiceRef); const setRecording = setter(recordingRef); const setDealerImage = setter(dealerImageRef); const setLoading = setter(loadingRef);
    const setPlaying = setter(playingRef); const setProgress = setter(progressRef); const setError = setter(errorRef); const setSupported = setter(supportedRef); const setResult = setter(resultRef);

    return () => {
      hooks.begin();
      const { cars, dealer, initialCarId } = props;
      void initialCarId;
      const car = carRef.value; const step = stepRef.value; const template = templateRef.value; const aspect = aspectRef.value; const length = lengthRef.value;
      const media = mediaRef.value; const selected = selectedRef.value; const lines = linesRef.value; const hook = hookRef.value; const showPrice = showPriceRef.value;
      const showQr = showQrRef.value; const qr = qrRef.value; const voice = voiceRef.value; const recording = recordingRef.value; const dealerImage = dealerImageRef.value;
      const loading = loadingRef.value; const playing = playingRef.value; const progress = progressRef.value; const error = errorRef.value; const supported = supportedRef.value; const result = resultRef.value;
      const usable = hooks.memo(() => cars.filter((item) => photosOf(item).length), [cars]);
      const [W, H] = ASPECT_SIZE[aspect];

      hooks.effect(() => { canMakeMp4().then(setSupported); }, []);
      hooks.effect(() => { loadImage(dealer.photo).then(setDealerImage); }, [dealer.photo]);
      hooks.effect(() => {
        const onKey = (event: KeyboardEvent) => { if (event.key === "Escape" && stepRef.value !== "making" && !recordingRef.value) onClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
      }, [step, recording]);

      // 끝 장면 QR = 이 매물 상세 주소
      hooks.effect(() => {
        if (!car) return;
        const url = new URL(window.location.href);
        url.search = new URLSearchParams({ qf: "guazi", profile: "dealer", shop: dealer.shop, emp: dealer.emp, listing: String(car.id) }).toString();
        url.hash = "";
        makeQr(url.href).then(setQr).catch(() => setQr(null));
      }, [car, dealer.shop, dealer.emp]);

      // 매물을 고르면 사진을 불러오고 기본 대본을 만든다.
      hooks.effect(() => {
        if (!car) return;
        let alive = true;
        setLoading(true);
        const sources = photosOf(car).map((path) => asset(path));
        Promise.all([
          ...sources.map((src, i) => loadImage(src).then((image): Media => ({ id: `p${i}`, kind: "image", src, image }))),
          document.fonts?.load(`900 76px "Pretendard Variable"`).catch(() => undefined),
        ]).then((items) => {
          if (!alive) return;
          const loaded = items.filter((item): item is Media => Boolean(item && typeof item === "object" && "kind" in item));
          setMedia(loaded);
          const picks = loaded.filter((item) => item.image).slice(0, 6).map((item) => item.id);
          setSelected(picks);
          setLines(autoLines(car, dealer.name, cutsOf(picks).length));
          setHook(`${car.maker} ${modelOf(car)} 판매 중`);
          timeRef.current = 0;
          setLoading(false);
        });
        return () => { alive = false; };
      }, [car, dealer.name]);

      const byId = hooks.memo(() => new Map(media.map((item) => [item.id, item])), [media]);

      // 컷 길이: 영상 컷은 영상 길이(최대 6초), 사진 컷은 틀 기본값 또는 고른 전체 길이에 맞춰 나눈다.
      const cuts: Cut[] = hooks.memo(() => {
        const ids = cutsOf(selected).filter((id) => byId.get(id));
        const videoSeconds = ids.reduce((sum, id) => { const item = byId.get(id)!; return item.kind === "video" ? sum + Math.min(item.duration ?? 3, VIDEO_CUT_MAX) : sum; }, 0);
        const photoCount = ids.filter((id) => byId.get(id)!.kind === "image").length;
        const photoCut = length === "auto" || !photoCount ? CUT[template] : Math.min(8, Math.max(1.2, (length - END_CARD - videoSeconds) / photoCount));
        return ids.map((id, i): Cut => {
          const item = byId.get(id)!;
          const line = lines[i] ?? "";
          if (item.kind === "video") return { source: { kind: "video", video: item.video!, file: item.file!, duration: item.duration ?? 3 }, duration: Math.min(item.duration ?? 3, VIDEO_CUT_MAX), line };
          return { source: { kind: "image", image: item.image! }, duration: photoCut, line };
        });
      }, [selected, byId, lines, length, template]);

      const plan: ShortformPlan | null = hooks.memo(() => {
        if (!car || !cuts.length) return null;
        return {
          template, width: W, height: H, fps: FPS, cuts,
          hook, title: `${car.maker} ${car.title.replace(new RegExp(`^${car.maker}\\s*`), "")}`.trim(), trim: car.trim ?? "", price: priceOf(car),
          specs: bbmCardSpec(car, false).split(" · ").filter(Boolean), place: (car.place ?? "").split(" · ")[0],
          showPrice, dealer: { name: dealer.name, company: dealer.company, phone: dealer.phone, photo: dealerImage ?? undefined },
          qr: showQr ? qr : null, voice: voice?.buffer ?? null,
        };
      }, [car, cuts, hook, template, showPrice, dealer, dealerImage, W, H, showQr, qr, voice]);

      // 미리보기: 실제 mp4와 같은 그리기 함수로 재생한다. 딜러 영상과 녹음한 목소리는 미리보기 시간에 맞춰 함께 재생한다.
      hooks.effect(() => {
        if (step !== "edit" || !plan) return;
        const ctx = canvasRef.value?.getContext("2d");
        if (!ctx) return;
        const duration = planDuration(plan);
        let frame = 0;
        let last = performance.now();
        const tick = (now: number) => {
          // rAF 첫 시각이 performance.now()보다 앞설 수 있어 음수 시간이 되지 않게 막는다.
          if (playing) timeRef.current = (Math.max(0, timeRef.current) + Math.max(0, now - last) / 1000) % duration;
          last = now;
          const t = timeRef.current;
          const at = cutAt(plan, t);
          plan.cuts.forEach((cut) => {
            if (cut.source.kind !== "video") return;
            const video = cut.source.video;
            if (cut === at.cut) {
              const want = Math.min(at.local, cut.source.duration - 0.05);
              if (Math.abs(video.currentTime - want) > 0.3) video.currentTime = want;
              if (playing && video.paused) video.play().catch(() => undefined);
              if (!playing && !video.paused) video.pause();
            } else if (!video.paused) video.pause();
          });
          const audio = audioRef.value;
          if (audio && voice && !recording) {
            if (playing && t < voice.seconds) {
              if (Math.abs(audio.currentTime - t) > 0.3) audio.currentTime = t;
              if (audio.paused) audio.play().catch(() => undefined);
            } else if (!audio.paused) audio.pause();
          }
          drawFrame(ctx, plan, t);
          frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => {
          cancelAnimationFrame(frame);
          plan.cuts.forEach((cut) => { if (cut.source.kind === "video") cut.source.video.pause(); });
          audioRef.value?.pause();
        };
      }, [plan, playing, step, voice, recording]);

      const resizeLines = (next: string[], keep: string[]) => {
        const count = cutsOf(next).length;
        const auto = car ? autoLines(car, dealer.name, count) : [];
        return Array.from({ length: count }, (_, i) => keep[i] ?? auto[i] ?? "");
      };

      const toggleMedia = (id: string) => {
        const position = selected.indexOf(id);
        let next = selected;
        let keep = lines;
        if (position >= 0) {
          if (selected.length <= 1) return;
          next = selected.filter((item) => item !== id);
          keep = lines.filter((_, i) => i !== position);
        } else {
          if (selected.length >= MAX_CUTS) { onToast(`한 영상에는 ${MAX_CUTS}컷까지 넣을 수 있어요`); return; }
          next = [...selected, id];
        }
        // 컷 수가 바뀌면 고친 자막은 앞에서부터 유지하고 모자란 줄만 자동 문장으로 채운다.
        setSelected(next);
        setLines(resizeLines(next, keep));
        timeRef.current = 0;
      };

      // 컷 순서 바꾸기(위·아래). 자막도 함께 움직인다.
      const moveCut = (from: number, to: number) => {
        if (to < 0 || to >= selected.length) return;
        const next = [...selected];
        const keep = [...lines];
        [next[from], next[to]] = [next[to], next[from]];
        [keep[from], keep[to]] = [keep[to], keep[from]];
        setSelected(next);
        setLines(keep);
        timeRef.current = cuts.slice(0, to).reduce((sum, cut) => sum + cut.duration, 0) + 0.3;
      };

      // 딜러가 찍은 영상 넣기(휴대폰 갤러리·카메라). 소리는 쓰지 않고 화면만 넣는다.
      const addVideos = async (files: FileList | null) => {
        if (!files?.length) return;
        const added: Media[] = [];
        for (const file of Array.from(files).slice(0, 4)) {
          const video = await loadVideo(file);
          if (!video) { onToast(`${file.name}은(는) 열 수 없는 영상이에요`); continue; }
          added.push({ id: `v${Date.now()}-${added.length}`, kind: "video", src: video.src, video, file, duration: Number.isFinite(video.duration) ? video.duration : 3 });
        }
        if (!added.length) return;
        const room = MAX_CUTS - selected.length;
        const next = [...selected, ...added.slice(0, Math.max(0, room)).map((item) => item.id)];
        setMedia((value) => [...value, ...added]);
        setSelected(next);
        setLines(resizeLines(next, lines.slice(0, selected.length)));
        timeRef.current = 0;
      };

      // 목소리 녹음: 미리보기를 처음부터 재생하면서 끝 장면까지 녹음한다(캡컷 「보이스오버」와 같은 방식).
      const startRecording = async () => {
        if (!plan) return;
        let stream: MediaStream;
        try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { onToast("마이크를 쓸 수 없어요. 브라우저에서 마이크 권한을 허락해 주세요"); return; }
        const chunks: BlobPart[] = [];
        const rec = new MediaRecorder(stream);
        recorder = rec;
        rec.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
        rec.onstop = async () => {
          stream.getTracks().forEach((track) => track.stop());
          setRecording(false);
          const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
          try {
            const context = new AudioContext();
            const buffer = await context.decodeAudioData(await blob.arrayBuffer());
            context.close();
            if (voice) URL.revokeObjectURL(voice.url);
            setVoice({ url: URL.createObjectURL(blob), buffer, seconds: buffer.duration });
            onToast("목소리를 넣었어요. 미리보기에서 들어 보세요");
          } catch { onToast("녹음을 읽지 못했어요. 다시 녹음해 주세요"); }
          timeRef.current = 0;
          setPlaying(true);
        };
        timeRef.current = 0;
        setPlaying(true);
        setRecording(true);
        rec.start();
        window.setTimeout(() => { if (rec.state === "recording") rec.stop(); }, planDuration(plan) * 1000);
      };
      const stopRecording = () => { if (recorder?.state === "recording") recorder.stop(); };

      const make = async () => {
        if (!plan || !car) return;
        setError("");
        setProgress(0);
        cancelRef.current = false;
        setStep("making");
        try {
          const blob = await exportMp4(plan, setProgress, () => cancelRef.current);
          const posterCanvas = document.createElement("canvas");
          posterCanvas.width = Math.round(W / 2);
          posterCanvas.height = Math.round(H / 2);
          const pctx = posterCanvas.getContext("2d")!;
          pctx.scale(0.5, 0.5);
          drawFrame(pctx, plan, Math.min(1.2, plan.cuts[0].duration - 0.2));
          const made: MadeShortform = { id: `${car.id}-${Date.now()}`, url: URL.createObjectURL(blob), poster: posterCanvas.toDataURL("image/jpeg", 0.82), carId: car.id, title: plan.title, template, seconds: Math.round(planDuration(plan)), aspect };
          setResult(made);
          setStep("done");
        } catch (reason) {
          if ((reason as Error).message === "cancelled") { setStep("edit"); return; }
          setError((reason as Error).message || "영상을 만들지 못했어요. 다시 시도해 주세요.");
          setStep("edit");
        }
      };

      const duration = plan ? planDuration(plan) : 0;
      const unusable = media.filter((item) => item.kind === "image" && !item.image).length;
      const cutIds = cutsOf(selected);
      const startOf = (index: number) => cuts.slice(0, index).reduce((sum, cut) => sum + cut.duration, 0);

      return <div class="sfs-backdrop" role="presentation" onMousedown={(event: MouseEvent) => { if (event.target === event.currentTarget && step !== "making" && !recording) onClose(); }}>
        <section class="sfs-sheet" role="dialog" aria-modal="true" aria-labelledby="sfs-title">
          <header class="sfs-head">
            <h2 id="sfs-title">{step === "pick" ? "숏폼 만들 매물 고르기" : step === "done" ? "숏폼이 완성됐어요" : "숏폼 만들기"}</h2>
            <button type="button" class="sfs-close" aria-label="닫기" onClick={onClose} disabled={step === "making" || recording}><Cross2Icon /></button>
          </header>

          {step === "pick" ? <div class="sfs-body">
            <p class="sfs-lead">사진과 매물 정보로 세로 영상을 자동으로 만들어요. 사진은 고치지 않고 그대로 써요.</p>
            <div class="sfs-pick-grid">{usable.map((item) => <button type="button" key={item.id} onClick={() => { setCar(item); setStep("edit"); }}>
              <img src={asset(item.listThumb ?? item.image)} alt="" loading="lazy" />
              <b>{item.maker} {item.title.replace(new RegExp(`^${item.maker}\\s*`), "")}</b>
              <span>{priceOf(item) || "가격 상담"} · 사진 {photosOf(item).length}장</span>
            </button>)}</div>
            {!usable.length ? <p class="sfs-empty">사진이 있는 판매 차량이 없어요. 매물 사진을 먼저 등록해 주세요.</p> : null}
          </div> : null}

          {step === "edit" && car ? <div class="sfs-body sfs-edit">
            <div class={`sfs-preview is-${aspect.replace(":", "x")}`}>
              <canvas ref={canvasRef} width={W} height={H} aria-label={`${car.maker} 숏폼 미리보기`} />
              {loading ? <div class="sfs-loading">사진을 불러오는 중…</div> : null}
              {recording ? <div class="sfs-rec" role="status"><i />녹음 중 · 자막에 맞춰 말해 주세요</div> : null}
              <button type="button" class="sfs-play" onClick={() => setPlaying((value) => !value)} disabled={recording} aria-label={playing ? "일시정지" : "재생"}>{playing ? <PauseIcon /> : <PlayIcon />}</button>
              <span class="sfs-duration">{Math.round(duration)}초</span>
              {voice ? <audio ref={audioRef} src={voice.url} preload="auto" /> : null}
            </div>

            <div class="sfs-controls">
              <div class="sfs-field">
                <span class="sfs-label">틀</span>
                <div class="sfs-segment" role="radiogroup" aria-label="영상 틀">
                  {([["reels", "릴스형", "꽉 찬 화면 · 한 마디씩 큰 자막"], ["card", "매물 카드형", "사진 그대로 · 정보 함께"]] as const).map(([id, label, hint]) => <button type="button" role="radio" aria-checked={template === id} key={id} onClick={() => { setTemplate(id); timeRef.current = 0; }}><b>{label}</b><small>{hint}</small></button>)}
                </div>
              </div>

              <div class="sfs-field">
                <span class="sfs-label">화면 비율</span>
                <div class="sfs-segment is-3" role="radiogroup" aria-label="화면 비율">
                  {([["9:16", "세로", "릴스·틱톡·쇼츠"], ["1:1", "정사각", "인스타 피드"], ["16:9", "가로", "유튜브"]] as const).map(([id, label, hint]) => <button type="button" role="radio" aria-checked={aspect === id} key={id} onClick={() => { setAspect(id); timeRef.current = 0; }}><b>{label} <span>{id}</span></b><small>{hint}</small></button>)}
                </div>
              </div>

              <div class="sfs-field">
                <span class="sfs-label">길이 <small>지금 {Math.round(duration)}초</small></span>
                <div class="sfs-pills" role="radiogroup" aria-label="영상 길이">
                  {(["auto", 15, 30, 60] as LengthOption[]).map((id) => <button type="button" role="radio" aria-checked={length === id} key={id} onClick={() => { setLength(id); timeRef.current = 0; }}>{id === "auto" ? "자동" : `${id}초`}</button>)}
                </div>
              </div>

              <div class="sfs-field">
                <span class="sfs-label">사진·영상 <small>{selected.length}/{MAX_CUTS}컷 · 누른 순서대로{selected.length < MIN_CUTS ? ` · ${MIN_CUTS}컷으로 반복` : ""}</small></span>
                <div class="sfs-photos">
                  <button type="button" class="sfs-add-video" onClick={() => fileRef.value?.click()} aria-label="내 영상 넣기"><b>＋</b><span>영상</span></button>
                  <input ref={fileRef} type="file" accept="video/*" multiple hidden onChange={(event: Event) => { const input = event.target as HTMLInputElement; addVideos(input.files); input.value = ""; }} />
                  {media.map((item, i) => {
                    const order = selected.indexOf(item.id);
                    const usableItem = item.kind === "video" || item.image;
                    return <button type="button" key={item.id} disabled={!usableItem} aria-pressed={order >= 0} onClick={() => toggleMedia(item.id)} aria-label={usableItem ? `${item.kind === "video" ? "영상" : "사진"} ${i + 1}${order >= 0 ? ` ${order + 1}번째 컷` : ""}` : `사진 ${i + 1} 불러올 수 없음`}>
                      {item.kind === "video" ? <><video src={item.src} muted playsinline preload="metadata" /><em>{Math.round(item.duration ?? 0)}초</em></> : item.image ? <img src={item.src} alt="" loading="lazy" /> : <span class="sfs-photo-off">사용 불가</span>}
                      {order >= 0 ? <i>{order + 1}</i> : null}
                    </button>;
                  })}
                </div>
                {unusable ? <p class="sfs-note">외부 사진 {unusable}장은 영상에 넣을 수 없어요(사이트 보안 설정).</p> : null}
              </div>

              {template === "reels" ? <label class="sfs-field">
                <span class="sfs-label">첫 화면 문구</span>
                <input value={hook} maxlength={24} onInput={(event: Event) => setHook((event.target as HTMLInputElement).value)} placeholder="예: 최저가 벤틀리" />
              </label> : null}

              <div class="sfs-field">
                <span class="sfs-label">컷별 자막·순서 <small>매물 정보로 자동 작성 · 고칠 수 있어요</small></span>
                <ol class="sfs-lines">{cutIds.map((id, i) => {
                  const item = byId.get(id);
                  const movable = i < selected.length;
                  return <li key={`${id}-${i}`}>
                    {item?.kind === "video" ? <video src={item.src} muted playsinline preload="metadata" /> : item?.image ? <img src={item.src} alt="" /> : <span />}
                    <input value={lines[i] ?? ""} maxlength={28} aria-label={`${i + 1}번째 컷 자막`} onInput={(event: Event) => { const text = (event.target as HTMLInputElement).value; setLines((value) => value.map((line, j) => j === i ? text : line)); }} onFocus={() => { timeRef.current = startOf(i) + 0.6; }} />
                    <span class="sfs-move">
                      <button type="button" disabled={!movable || i === 0} onClick={() => moveCut(i, i - 1)} aria-label={`${i + 1}번째 컷 앞으로`}><ChevronUpIcon /></button>
                      <button type="button" disabled={!movable || i >= selected.length - 1} onClick={() => moveCut(i, i + 1)} aria-label={`${i + 1}번째 컷 뒤로`}><ChevronDownIcon /></button>
                    </span>
                  </li>;
                })}</ol>
              </div>

              <div class="sfs-field">
                <span class="sfs-label">내 목소리 <small>미리보기를 보며 자막에 맞춰 말해요</small></span>
                <div class="sfs-voice">
                  {recording
                    ? <button type="button" class="is-rec" onClick={stopRecording}><i />녹음 끝내기</button>
                    : <button type="button" onClick={startRecording} disabled={!plan}><i />{voice ? "다시 녹음" : "녹음하기"}</button>}
                  {voice && !recording ? <><span>{voice.seconds.toFixed(1)}초 녹음됨</span><button type="button" class="is-text" onClick={() => { URL.revokeObjectURL(voice.url); setVoice(null); }}>지우기</button></> : null}
                </div>
              </div>

              <label class="sfs-check">
                <input type="checkbox" checked={showPrice} onChange={(event: Event) => setShowPrice((event.target as HTMLInputElement).checked)} disabled={!priceOf(car)} />
                <span>가격 보이기{priceOf(car) ? ` (${priceOf(car)})` : " · 가격 상담 매물"}</span>
              </label>
              <label class="sfs-check">
                <input type="checkbox" checked={showQr} onChange={(event: Event) => setShowQr((event.target as HTMLInputElement).checked)} />
                <span>끝 장면에 매물 QR 넣기</span>
              </label>
              <p class="sfs-note">마지막 3초는 {dealer.name} 딜러 명함과 안심번호가 자동으로 들어가요. 배경음악은 올릴 때 인스타그램·유튜브에서 고를 수 있어요.</p>
              {error ? <p class="sfs-error" role="alert">{error}</p> : null}
              {supported === false ? <p class="sfs-error">이 브라우저에서는 mp4 만들기를 지원하지 않아요. 크롬·엣지·최신 사파리에서 열어 주세요.</p> : null}
            </div>
          </div> : null}

          {step === "making" ? <div class="sfs-body sfs-making" aria-live="polite">
            <div class="sfs-meter"><span style={{ width: `${Math.round(progress * 100)}%` }} /></div>
            <b>영상을 만드는 중이에요 · {Math.round(progress * 100)}%</b>
            <p>이 화면을 닫지 마세요. 휴대폰 안에서 바로 만들어요.</p>
          </div> : null}

          {step === "done" && result && plan && car ? <div class="sfs-body sfs-done">
            <div class="sfs-done-video">
              <video class={`is-${aspect.replace(":", "x")}`} src={result.url} poster={result.poster} controls playsinline autoplay muted loop style={{ aspectRatio: aspect.replace(":", " / ") }} />
              <p>{result.title} · {result.seconds}초 · {W}×{H}{voice ? " · 목소리" : ""}</p>
            </div>
            <SnsPublish made={result} storageKey={dealer.storageKey} initialHandles={dealer.snsHandles} onToast={onToast}
              caption={captionFor({ title: plan.title, price: plan.showPrice ? plan.price : "", specs: plan.specs, dealerName: dealer.name, company: dealer.company, phone: dealer.phone, maker: car.maker, model: modelOf(car).split(" ")[0] })} />
          </div> : null}

          <footer class="sfs-foot">
            {step === "pick" ? <button type="button" class="sfs-secondary" onClick={onClose}>닫기</button> : null}
            {step === "edit" ? <>
              <button type="button" class="sfs-secondary" disabled={recording} onClick={() => { setCar(null); setStep("pick"); setVoice(null); }}>매물 바꾸기</button>
              <button type="button" class="sfs-primary" disabled={!plan || loading || recording || supported === false} onClick={make}>mp4 만들기</button>
            </> : null}
            {step === "making" ? <button type="button" class="sfs-secondary is-wide" onClick={() => { cancelRef.current = true; }}>만들기 취소</button> : null}
            {step === "done" && result ? <>
              <a class="sfs-secondary" href={result.url} download={`bobae-shortform-${result.carId}.mp4`}>내려받기</a>
              <button type="button" class="sfs-primary" onClick={() => { onPublish(result); onClose(); }}>SNS 판매 차량에 올리기</button>
            </> : null}
          </footer>
        </section>
      </div>;
    };
  },
});
