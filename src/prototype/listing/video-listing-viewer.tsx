import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { asset } from "../data";
import { dealerInstagramPosts, type DealerInstagramPost } from "../data/seoul-autogallery-instagram-v01";
import { seoulAutoGallerySiteRows, type SeoulAutoGallerySiteRow } from "../data/seoul-autogallery-site-v01";
import "./video-listing-viewer.css";

type VideoListingViewerProps = {
  onClose: () => void;
  onNotify: (message: string) => void;
};

type VideoListing = {
  code: string;
  date: string;
  maker: string;
  model: string;
  video: string;
  poster: string;
  row: SeoulAutoGallerySiteRow;
};

const icon = (name: string) => asset(`icons/chotot/${name}.svg`);
const posts = dealerInstagramPosts["450560:한지훈"] ?? [];
const rows = seoulAutoGallerySiteRows.filter((row) => row.company === "(주)플로시모터스" && row.price !== null);

const normalizedMaker = (value: string) => value.replace("메르세데스-벤츠", "벤츠").replaceAll(/[^가-힣A-Za-z0-9]/g, "").toLocaleLowerCase("ko-KR");
const rowForPost = (post: DealerInstagramPost, index: number) => {
  const maker = normalizedMaker(post.maker ?? "");
  const candidates = rows.filter((row) => normalizedMaker(row.maker) === maker);
  const model = (post.model ?? "").replaceAll(/[^가-힣A-Za-z0-9]/g, "").toLocaleLowerCase("ko-KR");
  return candidates.find((row) => model.includes(row.model.replaceAll(/[^가-힣A-Za-z0-9]/g, "").toLocaleLowerCase("ko-KR")))
    ?? candidates[index % Math.max(candidates.length, 1)]
    ?? rows[index % rows.length];
};

const VIDEO_LISTINGS: readonly VideoListing[] = posts
  .filter((post): post is DealerInstagramPost & Required<Pick<DealerInstagramPost, "video" | "poster" | "maker" | "model">> => Boolean(post.video && post.poster && post.maker && post.model))
  .slice(0, 15)
  .map((post, index) => ({ ...post, maker: post.maker, model: post.model, video: post.video, poster: post.poster, row: rowForPost(post, index) }));

const priceLabel = (price: number | null) => price === null ? "가격 상담" : `${price.toLocaleString("ko-KR")}만원`;
const specLabel = (item: VideoListing) => `${item.row.year}년식 · ${item.row.mileage.toLocaleString("ko-KR")}km · ${item.row.fuel} · 자동`;
const dateLabel = (date: string) => {
  const days = Math.max(0, Math.floor((Date.now() - Date.parse(`${date}T00:00:00+09:00`)) / 86_400_000));
  if (days === 0) return "오늘";
  if (days === 1) return "1일 전";
  return `${days}일 전`;
};
const seconds = (value: number) => {
  if (!Number.isFinite(value)) return "0:00";
  const minute = Math.floor(value / 60);
  return `${minute}:${String(Math.floor(value % 60)).padStart(2, "0")}`;
};

function SvgChevron({ direction }: { direction: "up" | "down" }) {
  const path = direction === "up"
    ? "M11.3993 9.20119C11.7802 8.91389 12.3183 8.9342 12.6766 9.26271L17.6757 13.8467C18.0825 14.2198 18.11 14.8518 17.7372 15.2588C17.3639 15.6659 16.7312 15.6936 16.3241 15.3203L11.9999 11.3565L7.67565 15.3203C7.19021 15.6887 6.61241 15.6405 6.26257 15.2588C5.8897 14.8517 5.91729 14.2198 6.32409 13.8467L11.3251 9.26271L11.3993 9.20119Z"
    : "M6.26267 9.32433C6.61242 8.94273 7.1903 8.89456 7.59666 9.19737L12 13.2237L16.3242 9.2628C16.8096 8.89457 17.3875 8.94271 17.7373 9.32433C18.087 9.70608 18.0842 10.2858 17.747 10.6642L12.6767 15.3175C12.2945 15.6677 11.7074 15.6676 11.3252 15.3175L6.25291 10.6651C5.9153 10.2868 5.91286 9.70628 6.26267 9.32433Z";
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={path} fill="currentColor" /></svg>;
}

function VideoListingViewer({ onClose, onNotify }: VideoListingViewerProps) {
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.72);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [paused, setPaused] = useState(false);
  const [liked, setLiked] = useState<Set<string>>(() => new Set());
  const [saved, setSaved] = useState<Set<string>>(() => new Set());
  const [tab, setTab] = useState<"info" | "comments">("info");
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const item = VIDEO_LISTINGS[index];
  const thumbs = useMemo(() => Array.from({ length: 7 }, (_, offset) => ({ offset, item: VIDEO_LISTINGS[(index + offset) % VIDEO_LISTINGS.length] })), [index]);

  const choose = (next: number) => {
    setIndex((next + VIDEO_LISTINGS.length) % VIDEO_LISTINGS.length);
    setElapsed(0);
    setDuration(0);
    setPaused(false);
    setTab("info");
  };
  const move = (delta: number) => choose(index + delta);
  const toggleSet = (setter: typeof setLiked, code: string) => setter((current) => {
    const next = new Set(current);
    if (next.has(code)) next.delete(code); else next.add(code);
    return next;
  });
  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.muted = false;
      setMuted(false);
      void video.play().then(() => setAudioBlocked(false)).catch(() => setAudioBlocked(true));
    } else video.pause();
  };
  const toggleSound = () => {
    const video = videoRef.current;
    const nextMuted = !muted;
    setMuted(nextMuted);
    if (!video) return;
    video.muted = nextMuted;
    video.volume = volume;
    if (!nextMuted) void video.play().then(() => setAudioBlocked(false)).catch(() => setAudioBlocked(true));
  };

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, []);
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowUp") move(-1);
      if (event.key === "ArrowDown") move(1);
      if (event.key === " ") { event.preventDefault(); togglePlayback(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = muted;
    video.volume = volume;
    const promise = video.play();
    promise?.then(() => setAudioBlocked(false)).catch(() => { setAudioBlocked(!muted); setPaused(true); });
  }, [index, muted, volume]);

  if (!item) return null;
  const isLiked = liked.has(item.code);
  const isSaved = saved.has(item.code);

  return <main className="vlf" aria-label="영상 매물">
    <section className="vlf-shell">
      <div className="vlf-stage">
        <video
          key={item.code}
          ref={videoRef}
          src={asset(item.video)}
          poster={asset(item.poster)}
          autoPlay
          muted={muted}
          playsInline
          preload="metadata"
          onClick={togglePlayback}
          onPlay={() => { setPaused(false); setAudioBlocked(false); }}
          onPause={() => setPaused(true)}
          onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
          onTimeUpdate={(event) => setElapsed(event.currentTarget.currentTime)}
          onEnded={() => move(1)}
        />
        <div className="vlf-stage-shade" />
        <button type="button" className="vlf-close" aria-label="영상 매물 닫기" onClick={onClose}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.293 7.293a1 1 0 0 1 1.414 1.414L13.414 12l3.293 3.293a1 1 0 1 1-1.414 1.414L12 13.414l-3.293 3.293a1 1 0 1 1-1.414-1.414L10.586 12 7.293 8.707a1 1 0 1 1 1.414-1.414L12 10.586l3.293-3.293Z" fill="currentColor" /></svg>
        </button>
        <div className="vlf-brand"><img src={asset("bbm/header-logo.svg")} alt="보배드림" /><b>영상</b></div>
        <nav className="vlf-discovery" aria-label="영상 추천 방식"><button type="button" className="is-active">영상매물</button><button type="button">추천매물</button></nav>
        <div className="vlf-volume">
          <button type="button" className="vlf-sound" aria-label={muted ? "소리 켜기" : "음소거"} aria-pressed={!muted} onClick={toggleSound}>
            <span className={muted ? "is-muted" : undefined} aria-hidden="true" />
          </button>
          <input aria-label="영상 음량" type="range" min="0" max="1" step="0.05" value={volume} onChange={(event) => { const nextVolume = Number(event.currentTarget.value); setVolume(nextVolume); if (videoRef.current) videoRef.current.volume = nextVolume; }} />
        </div>
        {paused ? <button type="button" className={`vlf-play${audioBlocked ? " is-audio-blocked" : ""}`} aria-label={audioBlocked ? "소리 켜고 재생" : "영상 재생"} onClick={togglePlayback}><span />{audioBlocked ? <b>소리 켜고 재생</b> : null}</button> : null}
        <div className="vlf-progress">
          <input aria-label="재생 위치" type="range" min="0" max={Math.max(duration, 1)} step="0.1" value={Math.min(elapsed, Math.max(duration, 1))} onChange={(event) => { const value = Number(event.currentTarget.value); if (videoRef.current) videoRef.current.currentTime = value; setElapsed(value); }} style={{ "--vlf-progress": `${duration ? elapsed / duration * 100 : 0}%` } as CSSProperties} />
          <b>{seconds(elapsed)} / {seconds(duration)}</b>
        </div>
        <div className="vlf-filmstrip" aria-label={`${index + 1} / ${VIDEO_LISTINGS.length}`}>
          <button type="button" className="vlf-film-arrow" aria-label="이전 영상" disabled={index === 0} onClick={() => move(-1)}><img src={icon("chotot-pc-detail-chevron-left-white-bg")} alt="" /></button>
          <div>{VIDEO_LISTINGS.map((video, dot) => <button key={video.code} type="button" className={dot === index ? "is-active" : undefined} aria-label={`${dot + 1}번 영상`} onClick={() => choose(dot)} />)}</div>
          <button type="button" className="vlf-film-arrow" aria-label="다음 영상" onClick={() => move(1)}><img src={icon("chotot-pc-detail-chevron-right-white-bg")} alt="" /></button>
        </div>
        <article className="vlf-mobile-summary">
          <strong>{item.maker} {item.model}</strong><span>{specLabel(item)}</span><b>{priceLabel(item.row.price)}</b>
        </article>
      </div>

      <aside className="vlf-actions" aria-label="영상 매물 동작">
        <button type="button" className={isLiked ? "is-active" : undefined} aria-label="좋아요" aria-pressed={isLiked} onClick={() => toggleSet(setLiked, item.code)}><span><img src={icon("chotot-list-detail-listing-like")} alt="" /></span><small>{isLiked ? 1 : 0}</small></button>
        <button type="button" aria-label="댓글" onClick={() => setTab("comments")}><span><img src={icon("chotot-list-detail-listing-comment")} alt="" /></span><small>0</small></button>
        <button type="button" className={isSaved ? "is-active" : undefined} aria-label="저장" aria-pressed={isSaved} onClick={() => toggleSet(setSaved, item.code)}><span><img src={icon(isSaved ? "chotot-common-bookmark-filled" : "chotot-common-bookmark")} alt="" /></span><small>저장</small></button>
        <button type="button" aria-label="공유" onClick={() => onNotify("영상 매물 링크를 복사했어요")}><span><img src={icon("chotot-common-share")} alt="" /></span><small>공유</small></button>
        <div className="vlf-stepper"><button type="button" aria-label="이전 매물" disabled={index === 0} onClick={() => move(-1)}><SvgChevron direction="up" /></button><button type="button" aria-label="다음 매물" onClick={() => move(1)}><SvgChevron direction="down" /></button></div>
      </aside>

      <article className="vlf-detail">
        <header>
          <h1>{item.maker} {item.model}</h1>
          <p>{specLabel(item)}</p>
          <strong>{priceLabel(item.row.price)}</strong>
          <span><img src={icon("chotot-list-detail-address-location")} alt="" />서울 서초구 · 서울오토갤러리</span>
          <span><img src={icon("chotot-common-clock-gray")} alt="" />{dateLabel(item.date)}</span>
        </header>
        <div className="vlf-thumbs" aria-label="다른 영상 매물">
          {thumbs.map(({ offset, item: thumb }) => <button key={`${item.code}-${thumb.code}-${offset}`} type="button" className={offset === 0 ? "is-active" : undefined} aria-label={`${thumb.maker} ${thumb.model}`} onClick={() => choose(index + offset)}><img src={asset(thumb.poster)} alt="" /></button>)}
        </div>
        <section className="vlf-seller">
          <span className="vlf-avatar">한</span><span><strong>한지훈 <img src={icon("chotot-list-detail-verified-dealer-wavy-badge")} alt="인증" /></strong><small>보배드림 인증딜러 · 판매 중 15대</small></span><b>플로시모터스</b>
        </section>
        <nav className="vlf-tabs" role="tablist"><button type="button" role="tab" aria-selected={tab === "info"} className={tab === "info" ? "is-active" : undefined} onClick={() => setTab("info")}>정보</button><button type="button" role="tab" aria-selected={tab === "comments"} className={tab === "comments" ? "is-active" : undefined} onClick={() => setTab("comments")}>댓글 (0)</button></nav>
        <div className="vlf-detail-body">
          {tab === "info" ? <><h2>상세 설명</h2><p>{item.row.year}년 {item.row.month}월 등록 · {item.row.mileage.toLocaleString("ko-KR")}km 실주행 차량입니다.<br />{item.row.fuel} · {item.row.color} · {item.row.cc ? `${item.row.cc.toLocaleString("ko-KR")}cc` : "친환경차"}<br />공개 판매 영상으로 차량의 외관과 실내 상태를 확인해 보세요.</p><dl><div><dt>판매자</dt><dd>한지훈 인증딜러</dd></div><div><dt>매매단지</dt><dd>서울오토갤러리</dd></div></dl></> : <div className="vlf-empty-comment"><img src={icon("chotot-list-detail-listing-comment")} alt="" /><strong>첫 댓글을 남겨보세요</strong><p>차량에 궁금한 점은 채팅으로 바로 문의할 수 있어요.</p></div>}
        </div>
        <footer><button type="button" onClick={() => onNotify("한지훈 딜러와 채팅을 시작할 수 있어요")}>채팅</button><button type="button" onClick={() => onNotify("전화번호는 정식 서비스에서 확인할 수 있어요")}><img src={icon("chotot-list-detail-phone")} alt="" />전화번호 보기</button></footer>
      </article>
    </section>
  </main>;
}

export { VideoListingViewer, VIDEO_LISTINGS };
