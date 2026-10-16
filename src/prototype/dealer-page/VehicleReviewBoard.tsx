import { useEffect, useMemo, useRef, useState } from "react";
import { asset, type Car } from "../data";
import { ratingCategories, ratingComment, ratingProfiles, reviewModels, reviewSeedVehicles, type RatingCategoryId, type ReviewModel } from "./vehicle-review-data";
import "./vehicle-review-board.css";
import "./vehicle-review-board-variables.css";

type BoardView = "list" | "write" | "detail";
type ScoreMap = Partial<Record<RatingCategoryId, number>>;
type ReviewSort = "all" | "latest" | "negative" | "liked";

type SavedReview = {
  id: string;
  modelId: ReviewModel["id"];
  title: string;
  ratings: ScoreMap;
  body: string;
  owner: boolean;
  purchaseDate?: string;
  location?: string;
  price?: string;
  ownerMetric?: string;
  imageData?: string;
  createdAt: string;
  likes?: number;
  comments?: number;
  author?: string;
  ownershipLabel?: string;
};

const STORAGE_KEY = "bobae-vehicle-reviews-v1";
const autohomeLogo = (file: string) => asset(`brand/kr/${file}`);
// GitHub Pages serves this app below `/bobaedream/`. Unlike `/assets/`, icon
// paths are not rewritten by the Pages workflow, so resolve them from the
// current document directory just like DealerPage does.
const publicBase = typeof document === "undefined" ? import.meta.env.BASE_URL : new URL(".", document.location.href).pathname;
const publicIcon = (path: string) => `${publicBase}${path}`;
const reviewIcons = {
  // `%61ssets` resolves to `assets` in the browser while avoiding the Pages
  // workflow's global `/assets/` replacement inside nested community paths.
  back: "community/%61ssets/reddit-ui/back.svg",
  bookmark: "icons/chotot/chotot-common-bookmark.svg",
  chat: "community/%61ssets/reddit-ui/chat.svg",
  check: "assets/register/chotot-v01/check-mark.svg",
  chevronRight: "assets/register/chotot-v01/chevron-right.svg",
  close: "assets/register/chotot-v01/close-x.svg",
  image: "assets/register/chotot-v01/image.svg",
  info: "icons/chotot/chotot-common-info.svg",
  like: "community/%61ssets/reddit-ui/recommend-thumb-up.svg",
  share: "assets/detail/autoscout24-share.svg",
  starEmpty: "icons/chotot/chotot-common-review-star-button.svg",
  starFilled: "icons/chotot/chotot-common-review-star-selected.svg",
  write: "community/%61ssets/reddit-ui/write.svg",
} as const;
type ReviewIconName = keyof typeof reviewIcons;

function ReviewIcon({ name, size }: { name: ReviewIconName; size?: number }) {
  return <img className="vr-ui-icon" src={publicIcon(reviewIcons[name])} alt="" aria-hidden="true" style={size ? { width: size, height: size } : undefined} />;
}

const reviewBodies = [
  "출퇴근과 주말 장거리에서 함께 운행했습니다. 차체가 안정적이고 조향 반응이 자연스러우며, 실내 정숙성과 시트 편안함도 기대했던 수준입니다.",
  "도심 정체 구간과 고속도로를 번갈아 주행했습니다. 가속과 제동이 매끄럽고 시야가 편안하지만, 노면이 거친 구간에서는 승차감이 조금 단단하게 느껴집니다.",
  "가족과 여행하며 적재 공간과 2열 승차감을 집중해서 봤습니다. 장거리 피로도가 낮고 기본 편의 사양이 충분해 일상용으로 만족스럽습니다.",
] as const;
const titleSuffixes = ["실사용 솔직 후기", "출퇴근·장거리 주행 후기", "승차감과 유지비 체감 후기"] as const;
const reviewAuthors = ["드라이브로그", "차생활연구소", "주말오너", "매일출근러", "패밀리카유저", "모터다이어리", "서울드라이버", "로드테스터"] as const;
const reviewLocations = ["서울", "경기", "인천", "부산", "대구", "대전"] as const;

function seedRatings(powertrain: ReviewModel["powertrain"], index: number): ScoreMap {
  const values = [3.5, 4, 4.5, 4, 3.5, 4.5, 4, 3.5];
  if (powertrain === "ev" || powertrain === "phev" || powertrain === "erev") {
    return { exterior: values[index % 8], interior: values[(index + 1) % 8], space: values[(index + 2) % 8], features: values[(index + 3) % 8], driving: values[(index + 4) % 8], range: values[(index + 5) % 8], adas: values[(index + 6) % 8], cockpit: values[(index + 7) % 8] };
  }
  return { exterior: values[index % 8], interior: values[(index + 1) % 8], space: values[(index + 2) % 8], features: values[(index + 3) % 8], power: values[(index + 4) % 8], fuel: values[(index + 5) % 8] };
}

const seedReviews: SavedReview[] = Array.from({ length: 50 }, (_, index) => {
  const vehicle = reviewSeedVehicles[index % reviewSeedVehicles.length];
  const variant = Math.floor(index / reviewSeedVehicles.length);
  const owner = index % 4 !== 3;
  return {
    id: `review-${vehicle.photoKey}-${variant + 1}`,
    modelId: vehicle.id,
    title: `${vehicle.brand} ${vehicle.model} ${titleSuffixes[(index + variant) % titleSuffixes.length]}`,
    ratings: seedRatings(vehicle.powertrain, index),
    body: reviewBodies[(index + variant) % reviewBodies.length],
    owner,
    purchaseDate: owner ? `202${3 + (index % 4)}-${String((index % 12) + 1).padStart(2, "0")}` : undefined,
    location: reviewLocations[index % reviewLocations.length],
    price: owner ? String(3200 + index * 170) : undefined,
    ownerMetric: owner ? (vehicle.powertrain === "ev" ? String(360 + index % 90) : String((7.2 + (index % 7) * 0.6).toFixed(1))) : undefined,
    imageData: asset(`cars/seoul-autogallery-v01/${vehicle.photoKey}-${(index % 5) + 1}.webp`),
    createdAt: `2026-10-${String(16 - (index % 15)).padStart(2, "0")}`,
    likes: 12 + (index * 7) % 89,
    comments: 2 + (index * 3) % 24,
    author: reviewAuthors[index % reviewAuthors.length],
    ownershipLabel: owner ? `보유 ${3 + (index % 21)}개월` : "시승 리뷰",
  };
});

function loadReviews() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as SavedReview[];
    return [...stored, ...seedReviews];
  } catch {
    return seedReviews;
  }
}

function average(ratings: ScoreMap, ids?: RatingCategoryId[]) {
  const values = (ids ?? Object.keys(ratings) as RatingCategoryId[]).map((id) => ratings[id]).filter((value): value is number => typeof value === "number");
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function Logo({ model, large = false }: { model: ReviewModel; large?: boolean }) {
  return <span className={`vr-logo${large ? " is-large" : ""}`}>{model.logo ? <img src={autohomeLogo(model.logo)} alt={`${model.brand} 엠블럼`} /> : <b className="vr-logo-fallback">{model.brand}</b>}</span>;
}

function StarVisual({ score, size = 18 }: { score: number; size?: number }) {
  return <span className="vr-star-visual" aria-hidden="true">{Array.from({ length: 5 }, (_, index) => {
    const fill = Math.max(0, Math.min(1, score - index));
    return <span key={index} style={{ width: size, height: size }}><ReviewIcon name="starEmpty" size={size} /><i style={{ width: `${fill * 100}%` }}><ReviewIcon name="starFilled" size={size} /></i></span>;
  })}</span>;
}

function StarInput({ value = 0, onChange, label }: { value?: number; onChange: (score: number) => void; label: string }) {
  const [announcedScore, setAnnouncedScore] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);
  useEffect(() => () => { if (timerRef.current !== null) window.clearTimeout(timerRef.current); }, []);
  const chooseScore = (score: number) => {
    onChange(score);
    setAnnouncedScore(score);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setAnnouncedScore(null), 900);
  };
  return <div className="vr-star-input" role="radiogroup" aria-label={`${label} 별점`}>
    <StarVisual score={value} size={22} />
    {announcedScore ? <output className="vr-star-popover" style={{ left: `${Math.max(12, Math.min(88, (announcedScore / 5) * 100))}%` }}><ReviewIcon name="starFilled" size={14} />{announcedScore.toFixed(1)}점</output> : null}
    <div className="vr-star-hit">{Array.from({ length: 10 }, (_, index) => {
      const score = (index + 1) / 2;
      return <button key={score} type="button" role="radio" aria-checked={value === score} aria-label={`${score}점`} onClick={() => chooseScore(score)} />;
    })}</div>
  </div>;
}

function ScoreStars({ score, size = 14 }: { score: number; size?: number }) {
  return <span className="vr-score-stars" aria-label={`별점 ${score.toFixed(1)}점`}><StarVisual score={score} size={size} /></span>;
}

function findReviewCar(cars: Car[], model: ReviewModel) {
  const normalizedBrand = model.brand.toLowerCase();
  const normalizedModel = model.model.toLowerCase().replace(/\s+/g, "");
  return cars.find((car) => {
    const source = `${car.maker} ${car.modelGroup ?? ""} ${car.title} ${car.trim}`.toLowerCase();
    const compactSource = source.replace(/\s+/g, "");
    return source.includes(normalizedBrand) || compactSource.includes(normalizedModel);
  });
}

function reviewPhotos(review: SavedReview, model: ReviewModel, cars: Car[]) {
  const seeded = reviewSeedVehicles.find((item) => item.id === model.id);
  if (seeded) return [1, 2, 3].map((index) => asset(`cars/seoul-autogallery-v01/${seeded.photoKey}-${index}.webp`));
  if (review.imageData) return [review.imageData];
  const car = findReviewCar(cars, model);
  return car ? [asset(car.listThumb ?? car.image)] : [];
}

const seededComments = [
  { author: "M 드라이버", owner: "BMW M3 오너 · 보유 2년", body: "장거리에서도 시트와 조향감이 편한가요? 데일리카로 고민 중입니다.", meta: "10월 16일 · 서울", likes: 11, replies: 4 },
  { author: "주말오너", owner: "실소유자 인증", body: "저도 비슷하게 느꼈어요. 컴포트 모드에서는 승차감이 생각보다 무난했습니다.", meta: "10월 16일 · 경기", likes: 3, replies: 2 },
  { author: "모터다이어리", owner: "차량 리뷰어", body: "보험료와 소모품 비용도 함께 알려주시면 구매를 고민하는 분들께 도움이 될 것 같아요.", meta: "10월 15일 · 부산", likes: 2, replies: 1 },
  { author: "로드테스터", owner: "실소유자 인증", body: "고속 주행 안정감과 브레이크 답력은 같은 급에서 가장 만족스러웠습니다.", meta: "10월 14일 · 대구", likes: 1, replies: 0 },
] as const;

function ReviewWriter({ onCancel, onSaved }: { onCancel: () => void; onSaved: (review: SavedReview) => void }) {
  const [model, setModel] = useState<ReviewModel>(reviewModels[0]);
  const [ratings, setRatings] = useState<ScoreMap>({});
  const [showOptional, setShowOptional] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [owner, setOwner] = useState(true);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [ownerMetric, setOwnerMetric] = useState("");
  const [imageData, setImageData] = useState("");
  const [error, setError] = useState("");
  const profile = ratingProfiles[model.powertrain];
  const overall = average(ratings, profile.required);
  const progress = Math.min(100, Math.round(body.length / 3));
  const unreleased = "released" in model && model.released === false;

  const changeModel = (next: ReviewModel) => {
    if (Object.keys(ratings).length || title || body) {
      if (!window.confirm("차량을 바꾸면 입력한 별점과 내용이 초기화됩니다. 변경할까요?")) return;
    }
    setModel(next);
    setRatings({});
    setTitle("");
    setBody("");
    setShowOptional(false);
    setOwnerMetric("");
    setPurchaseDate("");
    setLocation("");
    setPrice("");
    setOwner(!("released" in next && next.released === false));
    setError("");
    setShowModelPicker(false);
  };

  const cancel = () => {
    if ((Object.keys(ratings).length || title || body || imageData) && !window.confirm("작성 중인 리뷰를 닫을까요? 입력한 내용은 저장되지 않습니다.")) return;
    onCancel();
  };

  const submit = () => {
    if (title.trim().length < 5) { setError("리뷰 제목을 5자 이상 입력해 주세요."); return; }
    const missing = profile.required.filter((id) => !ratings[id]);
    if (missing.length) { setError(`${missing.map((id) => ratingCategories[id].label).join(", ")} 항목의 별점을 선택해 주세요.`); return; }
    if (owner && (!purchaseDate || !location || !price || !ownerMetric)) { setError("실소유자 정보의 필수 항목을 입력해 주세요."); return; }
    if (body.trim().length < 30) { setError(`리뷰를 30자 이상 작성해 주세요. 현재 ${body.trim().length}자예요.`); return; }
    if (unreleased && !imageData) { setError("출시 예정 모델은 시승·체험을 확인할 수 있는 사진을 추가해 주세요."); return; }
    const review: SavedReview = { id: `local-${Date.now()}`, modelId: model.id, title: title.trim(), ratings, body: body.trim(), owner, purchaseDate, location, price, ownerMetric, imageData: imageData || undefined, createdAt: new Date().toISOString().slice(0, 10), likes: 0, comments: 0, author: "보배드림 회원", ownershipLabel: owner ? "실소유자" : "시승 리뷰" };
    const current = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as SavedReview[];
    localStorage.setItem(STORAGE_KEY, JSON.stringify([review, ...current]));
    onSaved(review);
  };

  return <section className="vr-write" aria-label="차량 리뷰 등록">
    <header className="vr-write-head"><button type="button" onClick={cancel} aria-label="닫기"><ReviewIcon name="close" /></button><strong>차량 리뷰</strong><button type="button" onClick={submit}><ReviewIcon name="write" /> 등록</button></header>
    <div className="vr-exposure"><b>300자 이상 자세히 작성하면 노출 기회가 높아져요</b><span><i style={{ width: `${progress}%` }} /></span><small><span>등록 가능</span><span>300자 상세 리뷰</span></small></div>

    <label className="vr-write-card vr-title-field"><span><b>리뷰 제목</b><small>{title.length}/60</small></span><input value={title} maxLength={60} onChange={(event) => { setTitle(event.target.value); setError(""); }} placeholder="차량 경험이 잘 드러나는 제목을 입력해 주세요" autoFocus /></label>

    <section className="vr-write-card vr-vehicle-card" aria-label="평가 차량과 소유 여부">
      <button type="button" className="vr-selected-model" onClick={() => setShowModelPicker(true)}><Logo model={model} large /><span><b>{model.brand} {model.model}</b><small>{model.trim}</small><em>{profile.label}</em></span><ReviewIcon name="chevronRight" /></button>
      {unreleased ? <p className="vr-preview-note">출시 예정 모델은 시승·체험 사진이 있어야 등록할 수 있어요.</p> : <label className="vr-owner-switch"><span><b>실소유자예요</b><small>구매 정보와 실사용 수치를 함께 남길 수 있어요.</small></span><input type="checkbox" checked={owner} onChange={(event) => setOwner(event.target.checked)} /><i><ReviewIcon name="check" /></i></label>}
    </section>

    {owner ? <section className="vr-write-card vr-owner-fields-card"><h2>차량 구매 정보</h2><div className="vr-owner-fields"><label>출고·구매 시기<input type="month" value={purchaseDate} onChange={(event) => setPurchaseDate(event.target.value)} /></label><label>구매 지역<select value={location} onChange={(event) => setLocation(event.target.value)}><option value="">선택</option><option>서울</option><option>경기</option><option>인천</option><option>부산</option><option>대구</option><option>기타</option></select></label><label>차량 가격<input inputMode="numeric" value={price} onChange={(event) => setPrice(event.target.value.replace(/[^0-9,]/g, ""))} placeholder="만원" /></label><label>{profile.ownerMetric.label}<span className="vr-unit-input"><input inputMode="decimal" value={ownerMetric} onChange={(event) => setOwnerMetric(event.target.value.replace(/[^0-9.]/g, ""))} placeholder={profile.ownerMetric.placeholder} /><em>{profile.ownerMetric.unit}</em></span></label></div></section> : null}

    <section className="vr-write-card vr-rating-card">
      <div className="vr-rating-title"><h2>종합 평점 {overall ? <strong>{overall.toFixed(2)}점</strong> : null}</h2><button type="button"><ReviewIcon name="info" /> 평가 안내</button></div>
      <div className="vr-rating-rows">
      {profile.required.map((id) => <RatingRow key={id} id={id} value={ratings[id]} setValue={(value) => setRatings((current) => ({ ...current, [id]: value }))} />)}
      {showOptional ? profile.optional.map((id) => <RatingRow key={id} id={id} value={ratings[id]} optional setValue={(value) => setRatings((current) => ({ ...current, [id]: value }))} />) : null}
      {profile.optional.length ? <button type="button" className="vr-more-ratings" onClick={() => setShowOptional((value) => !value)}>{showOptional ? "추가 평가 접기" : `주행 보조·인포테인먼트도 평가하기 (${profile.optional.length})`}</button> : null}
      </div>
    </section>

    <label className="vr-write-card vr-body"><span><b>차량 경험을 들려주세요</b><small>{body.length}/300</small></span><textarea value={body} onChange={(event) => setBody(event.target.value.slice(0, 300))} placeholder="차량의 장단점과 실제 주행 경험을 알려주세요. 4.5점 이상 또는 3점 이하로 평가한 항목은 이유를 자세히 적으면 더 도움이 돼요." /><em className={body.trim().length >= 30 ? "is-ok" : ""}>{body.trim().length >= 30 ? "등록 가능한 분량이에요" : `최소 30자 · ${Math.max(0, 30 - body.trim().length)}자 더 필요해요`}</em></label>
    {imageData ? <div className="vr-cover-preview"><img src={imageData} alt="첨부한 대표 사진" /><button type="button" onClick={() => setImageData("")}>사진 삭제</button></div> : <label className="vr-cover"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; if (file.size > 4 * 1024 * 1024) { setError("사진은 4MB 이하만 첨부할 수 있어요."); return; } const reader = new FileReader(); reader.onload = () => { setImageData(String(reader.result ?? "")); setError(""); }; reader.readAsDataURL(file); }} /><span><ReviewIcon name="image" /></span><b>대표 사진 추가</b><small>차량 전체가 잘 보이는 사진을 권장해요</small></label>}
    {error ? <p className="vr-error" role="alert">{error}</p> : null}
    <button type="button" className="vr-submit" onClick={submit}>리뷰 등록하기</button>

    {showModelPicker ? <div className="vr-model-sheet" role="dialog" aria-modal="true" aria-label="평가 차량 선택"><button type="button" className="vr-sheet-backdrop" aria-label="차량 선택 닫기" onClick={() => setShowModelPicker(false)} /><section><header><strong>평가할 차량 선택</strong><button type="button" onClick={() => setShowModelPicker(false)} aria-label="닫기"><ReviewIcon name="close" /></button></header><div className="vr-model-options">{reviewModels.map((item) => <button key={item.id} type="button" className={model.id === item.id ? "is-active" : ""} onClick={() => changeModel(item)}><Logo model={item} /><span><b>{item.brand} {item.model}</b><small>{item.trim}</small></span>{model.id === item.id ? <ReviewIcon name="check" /> : <ReviewIcon name="chevronRight" />}</button>)}</div></section></div> : null}
  </section>;
}

function RatingRow({ id, value, setValue, optional = false }: { id: RatingCategoryId; value?: number; setValue: (score: number) => void; optional?: boolean }) {
  const item = ratingCategories[id];
  const comment = value ? ratingComment(id, value) : null;
  return <div className="vr-rating-row">
    <div><b>{item.label}{optional ? <em>선택</em> : <sup>*</sup>}</b>{comment ? <small>{comment.korean}</small> : null}</div>
    <StarInput value={value} onChange={setValue} label={item.label} />
    <strong className="vr-rating-value" aria-live="polite">{value ? `${value.toFixed(1)}점` : "선택 안 함"}</strong>
  </div>;
}

function ReviewList({ reviews, cars, onWrite, onOpen }: { reviews: SavedReview[]; cars: Car[]; onWrite: () => void; onOpen: (review: SavedReview) => void }) {
  const [powertrain, setPowertrain] = useState<"all" | ReviewModel["powertrain"]>("all");
  const [sort, setSort] = useState<ReviewSort>("all");
  const [ownerOnly, setOwnerOnly] = useState(false);
  const [tag, setTag] = useState<RatingCategoryId | null>(null);
  const [following, setFollowing] = useState<Set<string>>(() => new Set());
  const scoreOf = (review: SavedReview) => average(review.ratings);
  const visible = reviews
    .filter((review) => powertrain === "all" || reviewModels.find((model) => model.id === review.modelId)?.powertrain === powertrain)
    .filter((review) => !ownerOnly || review.owner)
    .filter((review) => !tag || typeof review.ratings[tag] === "number")
    .filter((review) => sort !== "negative" || scoreOf(review) <= 3)
    .sort((a, b) => sort === "liked" ? (b.likes ?? 0) - (a.likes ?? 0) : sort === "latest" ? b.createdAt.localeCompare(a.createdAt) : 0);
  const totalScore = reviews.length ? reviews.reduce((sum, review) => sum + scoreOf(review), 0) / reviews.length : 0;
  const negativeRate = reviews.length ? Math.round(reviews.filter((review) => scoreOf(review) <= 3).length / reviews.length * 100) : 0;
  return <section className="vr-list">
    <div className="vr-community-head"><div><span>BOBAE VEHICLE SCORE</span><h2>차량 경험 리뷰</h2><p>실제 오너와 시승자가 남긴 솔직한 평가를 확인하세요.</p></div><button type="button" onClick={onWrite}><ReviewIcon name="write" /> 리뷰 등록</button></div>
    <div className="vr-summary"><strong>{totalScore.toFixed(1)}</strong><span><ScoreStars score={totalScore} size={20} /><b>리뷰 {reviews.length}개 · 실소유자 {reviews.filter((review) => review.owner).length}명</b><small>평균 만족도 {Math.round(totalScore / 5 * 100)}% · 낮은 평가 {negativeRate}%</small></span></div>
    <div className="vr-list-toolbar"><button type="button" className="vr-model-filter">전체 모델 <ReviewIcon name="chevronRight" /></button><label className="vr-owner-only"><span>실소유자만</span><input type="checkbox" checked={ownerOnly} onChange={(event) => setOwnerOnly(event.target.checked)} /><i /></label></div>
    <div className="vr-filters" role="tablist" aria-label="동력 방식 필터">{([["all", "전체"], ["ev", "전기차"], ["phev", "플러그인"], ["erev", "증거리형"], ["hybrid", "하이브리드"], ["ice", "내연기관"]] as const).map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={powertrain === id} onClick={() => setPowertrain(id)}>{label}</button>)}</div>
    <div className="vr-list-controls"><div role="tablist" aria-label="리뷰 정렬">{([["all", "전체"], ["latest", "최신 리뷰"], ["negative", `낮은 평가 (${negativeRate}%)`], ["liked", "도움순"]] as const).map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={sort === id} onClick={() => setSort(id)}>{label}</button>)}</div></div>
    <div className="vr-topic-tags" aria-label="평가 항목 필터">{(["driving", "fuel", "range", "space", "features"] as RatingCategoryId[]).map((id) => <button key={id} type="button" aria-pressed={tag === id} onClick={() => setTag((current) => current === id ? null : id)}>{ratingCategories[id].label}</button>)}</div>
    {!visible.length ? <div className="vr-empty"><b>조건에 맞는 리뷰가 아직 없습니다.</b><span>필터를 바꾸거나 첫 리뷰를 등록해 주세요.</span></div> : null}
    <div className="vr-list-cards">{visible.map((review) => {
      const model = reviewModels.find((item) => item.id === review.modelId) ?? reviewModels[0];
      const score = average(review.ratings);
      const photos = reviewPhotos(review, model, cars);
      return <article className="vr-card" key={review.id}>
        <header><Logo model={model} /><span><b>{review.author ?? "보배드림 회원"}{review.owner ? <em><ReviewIcon name="check" /> 인증</em> : null}</b><small>{model.brand} {model.model} · {review.location ?? "지역 미입력"}</small></span><button type="button" aria-pressed={following.has(review.id)} onClick={() => setFollowing((current) => { const next = new Set(current); if (next.has(review.id)) next.delete(review.id); else next.add(review.id); return next; })}>{following.has(review.id) ? "구독 중" : "구독"}</button></header>
        <button type="button" className="vr-card-open" onClick={() => onOpen(review)}>
          <div className="vr-card-rating"><ScoreStars score={score} size={20} /><strong>{score.toFixed(1)}</strong><span>{score >= 4.5 ? "매우 만족" : score >= 4 ? "만족" : score >= 3 ? "보통" : "아쉬움"}</span><small>{model.trim.split(" ")[0]} · {review.ownershipLabel ?? (review.owner ? "실소유자" : "시승 리뷰")}</small></div>
          <h3>{review.title || `${model.brand} ${model.model} 사용자 리뷰`}</h3>
          <p>{review.body}</p>
          {photos.length ? <div className={`vr-card-gallery is-${photos.length}`}>{photos.map((photo, index) => <img key={`${photo}-${index}`} src={photo} alt={index === 0 ? `${model.brand} ${model.model} 리뷰 사진` : ""} aria-hidden={index > 0 ? "true" : undefined} />)}</div> : null}
          <footer><span>{review.createdAt}</span><span><ReviewIcon name="share" /> 공유</span><span><ReviewIcon name="chat" /> 댓글 {review.comments ?? 0}</span><span className="vr-card-like"><ReviewIcon name="like" /> 도움돼요 {review.likes ?? 0}</span></footer>
        </button>
      </article>;
    })}</div>
    <button type="button" className="vr-floating-write" onClick={onWrite}><ReviewIcon name="write" /> 차량 리뷰 작성</button>
  </section>;
}

function ReviewDetail({ review, cars, onBack, onDelete }: { review: SavedReview; cars: Car[]; onBack: () => void; onDelete: (review: SavedReview) => void }) {
  const model = reviewModels.find((item) => item.id === review.modelId) ?? reviewModels[0];
  const profile = ratingProfiles[model.powertrain];
  const score = average(review.ratings);
  const photos = reviewPhotos(review, model, cars);
  const [subscribed, setSubscribed] = useState(false);
  const [helpful, setHelpful] = useState(false);
  const [unhelpful, setUnhelpful] = useState(false);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const commentsRef = useRef<HTMLElement | null>(null);
  return <article className="vr-detail">
    <header className="vr-detail-head"><button type="button" onClick={onBack} aria-label="목록으로"><ReviewIcon name="back" /></button><strong>차량 리뷰</strong><button type="button" aria-label="공유" onClick={async () => { await navigator.clipboard?.writeText(window.location.href); setCopied(true); window.setTimeout(() => setCopied(false), 1400); }}><ReviewIcon name="share" /></button></header>
    <div className="vr-detail-model"><Logo model={model} large /><span><h2>{review.author ?? "보배드림 회원"}{review.owner ? <em><ReviewIcon name="check" /> 실소유자</em> : null}</h2><p>{model.brand} {model.model} · {review.location ?? "지역 미입력"}</p></span><button type="button" aria-pressed={subscribed} onClick={() => setSubscribed((value) => !value)}>{subscribed ? "구독 중" : "구독"}</button></div>
    <div className="vr-detail-score"><div><b>{model.brand} {model.model}</b><ScoreStars score={score} size={20} /><strong>{score.toFixed(2)}</strong><em>{score >= 4.5 ? "매우 만족" : score >= 4 ? "만족" : score >= 3 ? "보통" : "아쉬움"}</em></div><small>{model.trim} · {model.benchmark}</small></div>
    <div className="vr-detail-ratings">{[...profile.required, ...profile.optional].filter((id) => review.ratings[id]).map((id) => { const value = review.ratings[id] ?? 0; const comment = ratingComment(id, value); return <div key={id}><span><b>{ratingCategories[id].label}</b><small>{comment.korean}</small></span><strong>{value.toFixed(1)}</strong><i><em style={{ width: `${value * 20}%` }} /></i></div>; })}</div>
    {review.owner ? <dl className="vr-detail-owner"><div><dt>소유자 인증</dt><dd>실소유자 리뷰</dd></div><div><dt>구매 시기</dt><dd>{review.purchaseDate ?? "미입력"}</dd></div><div><dt>구매 지역</dt><dd>{review.location ?? "미입력"}</dd></div><div><dt>차량 가격</dt><dd>{review.price ? `${review.price}만원` : "미입력"}</dd></div><div><dt>{profile.ownerMetric.label}</dt><dd>{review.ownerMetric ? `${review.ownerMetric}${profile.ownerMetric.unit}` : "미입력"}</dd></div></dl> : null}
    <div className="vr-detail-body"><h1>{review.title || `${model.brand} ${model.model} 사용자 리뷰`}</h1><p>{review.body}</p>{photos.length ? <div className={`vr-detail-gallery is-${photos.length}`}>{photos.map((photo, index) => <img key={`${photo}-${index}`} src={photo} alt={index === 0 ? `${model.model} 대표 이미지` : `${model.model} 리뷰 사진 ${index + 1}`} />)}</div> : null}</div>
    {copied ? <p className="vr-copy-toast">리뷰 주소를 복사했어요.</p> : null}
    <section ref={commentsRef} className="vr-comments" aria-label="리뷰 댓글"><header><div><h3>전체 댓글 {(review.comments ?? 0) + comments.length}</h3><p>차량 경험에 도움이 되는 댓글을 먼저 보여드려요.</p></div><button type="button">추천순</button></header><form onSubmit={(event) => { event.preventDefault(); const value = comment.trim(); if (!value) return; setComments((current) => [...current, value]); setComment(""); }}><input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="댓글을 입력하세요" aria-label="댓글 입력" /><button type="submit" disabled={!comment.trim()}>등록</button></form>{comments.map((item, index) => <article key={`${item}-${index}`}><Logo model={model} /><div><b>보배드림 회원 <em>실소유자</em></b><span>{item}</span><small>방금 전 · 답글</small></div><button type="button"><ReviewIcon name="like" /> 0</button></article>)}{seededComments.map((item) => <article key={item.author}><Logo model={model} /><div><b>{item.author}<small>{item.owner}</small></b><span>{item.body}</span><footer>{item.meta}<button type="button">답글</button>{item.replies ? <button type="button" className="vr-replies">답글 {item.replies}개 보기</button> : null}</footer></div><button type="button"><ReviewIcon name="like" /> {item.likes}</button></article>)}</section>
    <div className="vr-detail-actions"><button type="button" onClick={() => commentsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}><ReviewIcon name="chat" /> 댓글 {(review.comments ?? 0) + comments.length}</button><button type="button" aria-pressed={saved} onClick={() => setSaved((value) => !value)}><ReviewIcon name="bookmark" /> {saved ? "저장됨" : "저장"}</button><button type="button" aria-pressed={helpful} onClick={() => { setHelpful((value) => !value); setUnhelpful(false); }}><ReviewIcon name="like" /> 도움돼요 {(review.likes ?? 0) + (helpful ? 1 : 0)}</button><button type="button" aria-pressed={unhelpful} onClick={() => { setUnhelpful((value) => !value); setHelpful(false); }}><ReviewIcon name="like" /> 별로예요</button></div>
    {review.id.startsWith("local-") ? <button type="button" className="vr-delete" onClick={() => onDelete(review)}>테스트 리뷰 삭제</button> : null}
  </article>;
}

export default function VehicleReviewBoard({ cars }: { cars: Car[] }) {
  const initialReviewParam = new URLSearchParams(window.location.search).get("review");
  const [reviews, setReviews] = useState<SavedReview[]>(() => loadReviews());
  const [view, setView] = useState<BoardView>(initialReviewParam === "write" ? "write" : initialReviewParam ? "detail" : "list");
  const [selected, setSelected] = useState<SavedReview | null>(() => initialReviewParam && initialReviewParam !== "write" ? loadReviews().find((review) => review.id === initialReviewParam) ?? null : null);
  const sorted = useMemo(() => reviews.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [reviews]);
  const syncReviewUrl = (value?: string) => {
    const target = new URL(window.location.href);
    if (value) target.searchParams.set("review", value); else target.searchParams.delete("review");
    window.history.replaceState(null, "", `${target.pathname}${target.search}${target.hash}`);
  };
  const openList = () => {
    if (new URLSearchParams(window.location.search).get("from") === "community") {
      window.location.href = "./community/naver-cafe-list.html?board=vehicle-review";
      return;
    }
    setSelected(null); setView("list"); syncReviewUrl();
  };
  const openWriter = () => { setSelected(null); setView("write"); syncReviewUrl("write"); };
  const openDetail = (review: SavedReview) => { setSelected(review); setView("detail"); syncReviewUrl(review.id); };
  const saved = (review: SavedReview) => {
    setReviews((current) => [review, ...current]);
    if (new URLSearchParams(window.location.search).get("from") === "community") {
      window.location.href = `./community/naver-cafe-list.html?board=vehicle-review&review=${encodeURIComponent(review.id)}`;
      return;
    }
    openDetail(review);
  };
  const remove = (review: SavedReview) => {
    if (!window.confirm("테스트 리뷰를 삭제할까요?")) return;
    const stored = (JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as SavedReview[]).filter((item) => item.id !== review.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    setReviews((current) => current.filter((item) => item.id !== review.id));
    openList();
  };
  if (view === "write") return <ReviewWriter onCancel={openList} onSaved={saved} />;
  if (view === "detail" && selected) return <ReviewDetail review={selected} cars={cars} onBack={openList} onDelete={remove} />;
  return <ReviewList reviews={sorted} cars={cars} onWrite={openWriter} onOpen={openDetail} />;
}
