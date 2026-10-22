import { useEffect, useMemo, useRef, useState } from "react";
import { Cross2Icon, PauseIcon, PlayIcon } from "@radix-ui/react-icons";
import { asset, type Car } from "../../data";
import { bbmCardSpec } from "../../data/bbm-card-samples";
import { CUT, canMakeMp4, drawFrame, exportMp4, loadImage, planDuration, type ShortformPlan, type ShortformTemplate } from "./render";
import "./shortform-studio.css";

export type MadeShortform = { id: string; url: string; poster: string; carId: number; title: string; template: ShortformTemplate; seconds: number };

type DealerInfo = { name: string; company: string; phone: string; photo: string };
type Step = "pick" | "edit" | "making" | "done";
type Photo = { src: string; image: HTMLImageElement | null };

const W = 720;
const H = 1280;
const FPS = 30;
const MAX_CUTS = 8;
// 사진이 적은 매물도 영상 길이가 너무 짧지 않게 최소 4컷(같은 사진은 다른 방향으로 움직여 다시 쓴다).
const MIN_CUTS = 4;
const cutsOf = (selected: number[]) => selected.length ? Array.from({ length: Math.max(MIN_CUTS, selected.length) }, (_, i) => selected[i % selected.length]) : [];

const photosOf = (car: Car) => (car.photoList?.length ? car.photoList : [car.image]).filter(Boolean).slice(0, 12);
const priceOf = (car: Car) => {
  const value = String(car.price ?? "");
  if (!value || /상담/.test(value)) return "";
  return /만원/.test(value) ? value.replace(/\s*만원/, "만원") : `${value}만원`;
};
const modelOf = (car: Car) => (car.modelGroup || car.title.replace(new RegExp(`^${car.maker}\\s*`), "")).split(" ").slice(0, 2).join(" ");

// 자동 대본: 매물 정보에 있는 사실만 쓴다(사고 이력·상태 같은 확인 안 된 말은 넣지 않는다).
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

export function ShortformStudio({ cars, dealer, initialCarId, onClose, onPublish }: { cars: Car[]; dealer: DealerInfo; initialCarId?: number; onClose: () => void; onPublish: (made: MadeShortform) => void }) {
  const usable = useMemo(() => cars.filter((car) => photosOf(car).length), [cars]);
  const [car, setCar] = useState<Car | null>(() => usable.find((item) => item.id === initialCarId) ?? null);
  const [step, setStep] = useState<Step>(car ? "edit" : "pick");
  const [template, setTemplate] = useState<ShortformTemplate>("reels");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [lines, setLines] = useState<string[]>([]);
  const [hook, setHook] = useState("");
  const [showPrice, setShowPrice] = useState(true);
  const [dealerImage, setDealerImage] = useState<HTMLImageElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [supported, setSupported] = useState<boolean | null>(null);
  const [result, setResult] = useState<MadeShortform | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timeRef = useRef(0);
  const cancelRef = useRef(false);

  useEffect(() => { canMakeMp4().then(setSupported); }, []);
  useEffect(() => { loadImage(dealer.photo).then(setDealerImage); }, [dealer.photo]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape" && step !== "making") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, step]);

  // 매물을 고르면 사진을 불러오고 기본 대본을 만든다.
  useEffect(() => {
    if (!car) return;
    let alive = true;
    setLoading(true);
    const sources = photosOf(car).map((path) => asset(path));
    Promise.all([
      ...sources.map((src) => loadImage(src).then((image) => ({ src, image }))),
      document.fonts?.load(`900 76px "Pretendard Variable"`).catch(() => undefined),
    ]).then((items) => {
      if (!alive) return;
      const loaded = items.filter((item): item is Photo => Boolean(item && typeof item === "object" && "src" in item));
      setPhotos(loaded);
      const picks = loaded.map((item, i) => (item.image ? i : -1)).filter((i) => i >= 0).slice(0, 6);
      setSelected(picks);
      setLines(autoLines(car, dealer.name, cutsOf(picks).length));
      setHook(`${car.maker} ${modelOf(car)} 판매 중`);
      timeRef.current = 0;
      setLoading(false);
    });
    return () => { alive = false; };
  }, [car, dealer.name]);

  const plan: ShortformPlan | null = useMemo(() => {
    if (!car) return null;
    const images = cutsOf(selected).map((i) => photos[i]?.image).filter((image): image is HTMLImageElement => Boolean(image));
    if (!images.length) return null;
    return {
      template, width: W, height: H, fps: FPS, photos: images,
      lines: images.map((_, i) => lines[i] ?? ""),
      hook, title: `${car.maker} ${car.title.replace(new RegExp(`^${car.maker}\\s*`), "")}`.trim(), trim: car.trim ?? "", price: priceOf(car),
      specs: bbmCardSpec(car, false).split(" · ").filter(Boolean), place: (car.place ?? "").split(" · ")[0],
      showPrice, dealer: { name: dealer.name, company: dealer.company, phone: dealer.phone, photo: dealerImage ?? undefined },
    };
  }, [car, selected, photos, lines, hook, template, showPrice, dealer, dealerImage]);

  // 미리보기: 실제 mp4와 같은 그리기 함수로 재생한다.
  useEffect(() => {
    if (step !== "edit" || !plan) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const duration = planDuration(plan);
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      // rAF 첫 시각이 performance.now()보다 앞설 수 있어 음수 시간이 되지 않게 막는다.
      if (playing) timeRef.current = (Math.max(0, timeRef.current) + Math.max(0, now - last) / 1000) % duration;
      last = now;
      drawFrame(ctx, plan, timeRef.current);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [plan, playing, step]);

  const togglePhoto = (index: number) => {
    const position = selected.indexOf(index);
    let next = selected;
    if (position >= 0) {
      if (selected.length <= 1) return;
      next = selected.filter((i) => i !== index);
    } else {
      if (selected.length >= MAX_CUTS) return;
      next = [...selected, index];
    }
    // 컷 수가 바뀌면 고친 자막은 앞에서부터 유지하고 모자란 줄만 자동 문장으로 채운다.
    const count = cutsOf(next).length;
    const auto = car ? autoLines(car, dealer.name, count) : [];
    setSelected(next);
    setLines(Array.from({ length: count }, (_, i) => lines[i] ?? auto[i] ?? ""));
    timeRef.current = 0;
  };

  const make = async () => {
    if (!plan || !car) return;
    setError("");
    setProgress(0);
    cancelRef.current = false;
    setStep("making");
    try {
      const blob = await exportMp4(plan, setProgress, () => cancelRef.current);
      const posterCanvas = document.createElement("canvas");
      posterCanvas.width = 360;
      posterCanvas.height = 640;
      const pctx = posterCanvas.getContext("2d")!;
      pctx.scale(0.5, 0.5);
      drawFrame(pctx, plan, Math.min(1.2, CUT[plan.template] - 0.2));
      const made: MadeShortform = { id: `${car.id}-${Date.now()}`, url: URL.createObjectURL(blob), poster: posterCanvas.toDataURL("image/jpeg", 0.82), carId: car.id, title: plan.title, template, seconds: Math.round(planDuration(plan)) };
      setResult(made);
      setStep("done");
    } catch (reason) {
      if ((reason as Error).message === "cancelled") { setStep("edit"); return; }
      setError((reason as Error).message || "영상을 만들지 못했어요. 다시 시도해 주세요.");
      setStep("edit");
    }
  };

  const duration = plan ? planDuration(plan) : 0;
  const unusable = photos.filter((item) => !item.image).length;

  return <div className="sfs-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && step !== "making") onClose(); }}>
    <section className="sfs-sheet" role="dialog" aria-modal="true" aria-labelledby="sfs-title">
      <header className="sfs-head">
        <h2 id="sfs-title">{step === "pick" ? "숏폼 만들 매물 고르기" : step === "done" ? "숏폼이 완성됐어요" : "숏폼 만들기"}</h2>
        <button type="button" className="sfs-close" aria-label="닫기" onClick={onClose} disabled={step === "making"}><Cross2Icon /></button>
      </header>

      {step === "pick" ? <div className="sfs-body">
        <p className="sfs-lead">사진과 매물 정보로 세로 영상을 자동으로 만들어요. 사진은 고치지 않고 그대로 써요.</p>
        <div className="sfs-pick-grid">{usable.map((item) => <button type="button" key={item.id} onClick={() => { setCar(item); setStep("edit"); }}>
          <img src={asset(item.listThumb ?? item.image)} alt="" loading="lazy" />
          <b>{item.maker} {item.title.replace(new RegExp(`^${item.maker}\\s*`), "")}</b>
          <span>{priceOf(item) || "가격 상담"} · 사진 {photosOf(item).length}장</span>
        </button>)}</div>
        {!usable.length ? <p className="sfs-empty">사진이 있는 판매 차량이 없어요. 매물 사진을 먼저 등록해 주세요.</p> : null}
      </div> : null}

      {step === "edit" && car ? <div className="sfs-body sfs-edit">
        <div className="sfs-preview">
          <canvas ref={canvasRef} width={W} height={H} aria-label={`${car.maker} 숏폼 미리보기`} />
          {loading ? <div className="sfs-loading">사진을 불러오는 중…</div> : null}
          <button type="button" className="sfs-play" onClick={() => setPlaying((value) => !value)} aria-label={playing ? "일시정지" : "재생"}>{playing ? <PauseIcon /> : <PlayIcon />}</button>
          <span className="sfs-duration">{Math.round(duration)}초</span>
        </div>

        <div className="sfs-controls">
          <div className="sfs-field">
            <span className="sfs-label">틀</span>
            <div className="sfs-segment" role="radiogroup" aria-label="영상 틀">
              {([["reels", "릴스형", "꽉 찬 화면 · 한 마디씩 큰 자막"], ["card", "매물 카드형", "사진 그대로 · 아래에 정보"]] as const).map(([id, label, hint]) => <button type="button" role="radio" aria-checked={template === id} key={id} onClick={() => { setTemplate(id); timeRef.current = 0; }}><b>{label}</b><small>{hint}</small></button>)}
            </div>
          </div>

          <div className="sfs-field">
            <span className="sfs-label">사진 <small>{selected.length}/{MAX_CUTS}장 · 누른 순서대로{selected.length < MIN_CUTS ? ` · ${MIN_CUTS}컷으로 반복` : ""}</small></span>
            <div className="sfs-photos">{photos.map((item, i) => {
              const order = selected.indexOf(i);
              return <button type="button" key={item.src} disabled={!item.image} aria-pressed={order >= 0} onClick={() => togglePhoto(i)} aria-label={item.image ? `사진 ${i + 1}${order >= 0 ? ` ${order + 1}번째 컷` : ""}` : `사진 ${i + 1} 불러올 수 없음`}>
                {item.image ? <img src={item.src} alt="" /> : <span className="sfs-photo-off">사용 불가</span>}
                {order >= 0 ? <i>{order + 1}</i> : null}
              </button>;
            })}</div>
            {unusable ? <p className="sfs-note">외부 사진 {unusable}장은 영상에 넣을 수 없어요(사이트 보안 설정).</p> : null}
          </div>

          {template === "reels" ? <label className="sfs-field">
            <span className="sfs-label">첫 화면 문구</span>
            <input value={hook} maxLength={24} onChange={(event) => setHook(event.target.value)} placeholder="예: 최저가 벤틀리" />
          </label> : null}

          <div className="sfs-field">
            <span className="sfs-label">컷별 자막 <small>매물 정보로 자동 작성 · 고칠 수 있어요</small></span>
            <ol className="sfs-lines">{cutsOf(selected).map((photoIndex, i) => <li key={`${photoIndex}-${i}`}>
              {photos[photoIndex]?.image ? <img src={photos[photoIndex].src} alt="" /> : null}
              <input value={lines[i] ?? ""} maxLength={28} aria-label={`${i + 1}번째 컷 자막`} onChange={(event) => setLines((value) => value.map((line, j) => j === i ? event.target.value : line))} onFocus={() => { timeRef.current = i * CUT[template] + 0.6; }} />
            </li>)}</ol>
          </div>

          <label className="sfs-check">
            <input type="checkbox" checked={showPrice} onChange={(event) => setShowPrice(event.target.checked)} disabled={!priceOf(car)} />
            <span>가격 보이기{priceOf(car) ? ` (${priceOf(car)})` : " · 가격 상담 매물"}</span>
          </label>
          <p className="sfs-note">마지막 3초는 {dealer.name} 딜러 명함과 안심번호가 자동으로 들어가요. 음악은 영상을 올릴 때 인스타그램·유튜브에서 고를 수 있어요.</p>
          {error ? <p className="sfs-error" role="alert">{error}</p> : null}
          {supported === false ? <p className="sfs-error">이 브라우저에서는 mp4 만들기를 지원하지 않아요. 크롬·엣지·최신 사파리에서 열어 주세요.</p> : null}
        </div>
      </div> : null}

      {step === "making" ? <div className="sfs-body sfs-making" aria-live="polite">
        <div className="sfs-meter"><span style={{ width: `${Math.round(progress * 100)}%` }} /></div>
        <b>영상을 만드는 중이에요 · {Math.round(progress * 100)}%</b>
        <p>이 화면을 닫지 마세요. 휴대폰 안에서 바로 만들어요.</p>
      </div> : null}

      {step === "done" && result ? <div className="sfs-body sfs-done">
        <video src={result.url} poster={result.poster} controls playsInline autoPlay muted loop />
        <p>{result.title} · {result.seconds}초 · 720×1280</p>
      </div> : null}

      <footer className="sfs-foot">
        {step === "pick" ? <button type="button" className="sfs-secondary" onClick={onClose}>닫기</button> : null}
        {step === "edit" ? <>
          <button type="button" className="sfs-secondary" onClick={() => { setCar(null); setStep("pick"); }}>매물 바꾸기</button>
          <button type="button" className="sfs-primary" disabled={!plan || loading || supported === false} onClick={make}>mp4 만들기</button>
        </> : null}
        {step === "making" ? <button type="button" className="sfs-secondary is-wide" onClick={() => { cancelRef.current = true; }}>만들기 취소</button> : null}
        {step === "done" && result ? <>
          <a className="sfs-secondary" href={result.url} download={`bobae-shortform-${result.carId}.mp4`}>내려받기</a>
          <button type="button" className="sfs-primary" onClick={() => { onPublish(result); onClose(); }}>SNS 판매 차량에 올리기</button>
        </> : null}
      </footer>
    </section>
  </div>;
}
